import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { financeBalanceDue, financeTotalAmount } from "./finance-normalization";

/** All server functions that back the NEVO internal AI Assistant. */

// ---------------------------------------------------------------------------
// Shared enums / schemas
// ---------------------------------------------------------------------------

const CATEGORY = z.enum([
  "crm_user_guide",
  "company_profile",
  "product_datasheet",
  "supplier_agreement",
  "customer_document",
  "invoice_template",
  "commission_agreement",
  "sop_procedure",
  "sales_training",
  "technical_document",
  "legal_compliance",
  "general",
]);

const ACCESS_LEVEL = z.enum([
  "all_internal",
  "management_only",
  "finance_only",
  "operations_only",
  "sales_only",
  "super_admin_only",
]);

// ---------------------------------------------------------------------------
// Chat sessions
// ---------------------------------------------------------------------------

export const listChatSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_chat_sessions")
      .select("id,title,related_module,related_record_id,created_at,updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createChatSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200).optional(),
        related_module: z.string().max(60).optional(),
        related_record_id: z.string().max(120).optional(),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("ai_chat_sessions")
      .insert({
        user_id: context.userId,
        title: data.title ?? "New conversation",
        related_module: data.related_module ?? null,
        related_record_id: data.related_record_id ?? null,
      })
      .select("id,title,related_module,related_record_id,created_at,updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const renameChatSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(200) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_chat_sessions")
      .update({ title: data.title })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteChatSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_chat_sessions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getChatSessionMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ session_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("ai_chat_messages")
      .select("id,role,content,sources,created_at")
      .eq("session_id", data.session_id)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---------------------------------------------------------------------------
// Ask (non-streaming chat with RAG)
// ---------------------------------------------------------------------------

const NEVO_SYSTEM_PROMPT = `You are NEVO Industrial Internal AI Assistant. You help authenticated NEVO team members use the CRM, understand documents, manage customers, suppliers, orders, invoices, commission invoices and reports.

Be accurate, concise, and operational. Use only permitted CRM data, uploaded knowledge base documents, and NEVO internal process definitions provided to you. If information is missing, say so. Never invent financial, legal, supplier, technical, or delivery information. Never perform destructive actions. For every financial or status-changing action, ask for confirmation.

When Knowledge Base excerpts are provided, cite them inline using [n] where n is the source number, and only claim what those excerpts support. If no excerpts are provided or none are relevant, say so plainly and offer general CRM guidance.

Company: NEVO TRADING AND CONSULTANCY L.L.C - FZ. Website: www.nevoindustrial.com. Answer in the user's language (default English).`;

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        session_id: z.string().uuid(),
        message: z.string().min(1).max(6000),
        context: z
          .object({
            module: z.string().max(60).optional(),
            route: z.string().max(200).optional(),
            record_id: z.string().max(120).optional(),
            record_summary: z.string().max(2000).optional(),
          })
          .optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { chatComplete, embedBatch } = await import("./ai-assistant.server");
    const { supabase, userId } = context;

    // Verify session ownership.
    const { data: session } = await supabase
      .from("ai_chat_sessions")
      .select("id,title")
      .eq("id", data.session_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!session) throw new Error("Chat session not found");

    // Persist user message first.
    await supabase.from("ai_chat_messages").insert({
      session_id: data.session_id,
      user_id: userId,
      role: "user",
      content: data.message,
      sources: [],
    });

    // Load prior history (bounded) so the model has context.
    const { data: history } = await supabase
      .from("ai_chat_messages")
      .select("role,content")
      .eq("session_id", data.session_id)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(20);
    const historyMsgs = (history ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    // Retrieval: embed the user query and pull top chunks the user is allowed to see.
    let sources: Array<{
      chunk_id: string;
      document_id: string;
      document_title: string;
      document_category: string;
      page_number: number | null;
      similarity: number;
      snippet: string;
    }> = [];
    let contextBlock = "";
    try {
      const [queryVec] = await embedBatch([data.message]);
      const { data: matches } = await supabase.rpc("match_ai_chunks", {
        query_embedding: queryVec as unknown as string,
        match_count: 6,
      });
      if (matches && matches.length > 0) {
        sources = matches.map((m) => ({
          chunk_id: m.chunk_id as string,
          document_id: m.document_id as string,
          document_title: m.document_title as string,
          document_category: m.document_category as string,
          page_number: (m.page_number as number | null) ?? null,
          similarity: (m.similarity as number) ?? 0,
          snippet: (m.chunk_text as string).slice(0, 320),
        }));
        contextBlock = matches
          .map(
            (m, i) =>
              `[${i + 1}] ${m.document_title}${m.page_number ? ` (p.${m.page_number})` : ""}\n${(
                m.chunk_text as string
              ).slice(0, 1200)}`,
          )
          .join("\n\n---\n\n");
      }
    } catch (err) {
      // RAG failure should not block the answer; fall through to a general response.
      console.warn("AI assistant embedding/retrieval failed", err);
    }

    // Build system prompt with retrieval + page context.
    const parts: string[] = [NEVO_SYSTEM_PROMPT];
    if (data.context?.module || data.context?.route || data.context?.record_id) {
      parts.push(
        `Current CRM context:\n- Module: ${data.context.module ?? "unknown"}\n- Route: ${data.context.route ?? ""}\n- Record: ${data.context.record_id ?? "n/a"}${
          data.context.record_summary ? `\n\nRecord summary:\n${data.context.record_summary}` : ""
        }`,
      );
    }
    if (contextBlock) {
      parts.push(`Knowledge base excerpts (cite as [n]):\n\n${contextBlock}`);
    } else {
      parts.push("No relevant knowledge base excerpts were found for this question.");
    }

    // Call the model.
    const { text, usage } = await chatComplete({
      system: parts.join("\n\n"),
      messages: historyMsgs,
      maxTokens: 1200,
    });

    const answer =
      text ||
      "I do not have enough information in the NEVO knowledge base to answer this accurately.";

    // Persist assistant reply and bump session timestamp.
    await supabase.from("ai_chat_messages").insert({
      session_id: data.session_id,
      user_id: userId,
      role: "assistant",
      content: answer,
      sources,
      tokens_in: usage?.prompt_tokens ?? null,
      tokens_out: usage?.completion_tokens ?? null,
    });
    await supabase
      .from("ai_chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.session_id)
      .eq("user_id", userId);

    return { answer, sources };
  });

// ---------------------------------------------------------------------------
// Knowledge Base
// ---------------------------------------------------------------------------

export const listKnowledgeDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        category: CATEGORY.optional(),
        access_level: ACCESS_LEVEL.optional(),
        search: z.string().max(200).optional(),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("ai_documents")
      .select(
        "id,title,category,description,file_type,byte_size,access_level,tags,status,chunk_count,uploaded_by,created_at,related_customer_id,related_supplier_id,related_order_id,related_invoice_id,error_message",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.category) query = query.eq("category", data.category);
    if (data.access_level) query = query.eq("access_level", data.access_level);
    if (data.search && data.search.trim()) {
      const like = `%${data.search.trim()}%`;
      query = query.or(`title.ilike.${like},description.ilike.${like}`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const deleteKnowledgeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    // Fetch file_url so we can also remove the storage object.
    const { data: doc } = await context.supabase
      .from("ai_documents")
      .select("file_url")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("ai_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (doc?.file_url) {
      await context.supabase.storage
        .from("ai-knowledge")
        .remove([doc.file_url])
        .catch(() => {});
    }
    return { ok: true };
  });

export const ingestKnowledgeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        category: CATEGORY,
        description: z.string().max(2000).optional(),
        access_level: ACCESS_LEVEL,
        tags: z.array(z.string().max(60)).max(20).optional(),
        related_customer_id: z.string().uuid().optional().nullable(),
        related_supplier_id: z.string().uuid().optional().nullable(),
        related_order_id: z.string().uuid().optional().nullable(),
        related_invoice_id: z.string().uuid().optional().nullable(),
        // Either upload metadata for a stored file, or paste text directly.
        storage_path: z.string().max(500).optional(),
        file_type: z.string().max(120).optional(),
        byte_size: z.number().int().nonnegative().optional(),
        raw_text: z.string().max(500_000).optional(),
      })
      .refine((v) => v.storage_path || v.raw_text, {
        message: "Either storage_path or raw_text is required",
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { chunkText, embedBatch, extractText, AI_EMBED_BATCH } =
      await import("./ai-assistant.server");
    const { supabase, userId } = context;

    // Insert the parent doc row in `processing` state.
    const { data: doc, error: insertErr } = await supabase
      .from("ai_documents")
      .insert({
        title: data.title,
        category: data.category,
        description: data.description ?? null,
        access_level: data.access_level,
        tags: data.tags ?? [],
        related_customer_id: data.related_customer_id ?? null,
        related_supplier_id: data.related_supplier_id ?? null,
        related_order_id: data.related_order_id ?? null,
        related_invoice_id: data.related_invoice_id ?? null,
        file_url: data.storage_path ?? null,
        file_type: data.file_type ?? (data.raw_text ? "text/plain" : null),
        byte_size: data.byte_size ?? (data.raw_text ? data.raw_text.length : null),
        uploaded_by: userId,
        status: "processing",
      })
      .select("id")
      .single();
    if (insertErr || !doc) throw new Error(insertErr?.message || "Failed to create document row");

    try {
      // Get text.
      let text = data.raw_text ?? "";
      let warning: string | undefined;
      if (!text && data.storage_path) {
        const { data: file, error: dlErr } = await supabase.storage
          .from("ai-knowledge")
          .download(data.storage_path);
        if (dlErr || !file) throw new Error(dlErr?.message || "Failed to download file");
        const bytes = await file.arrayBuffer();
        const extracted = await extractText(data.title, data.file_type ?? null, bytes);
        text = extracted.text;
        warning = extracted.warning;
      }

      const chunks = chunkText(text);
      if (chunks.length === 0) {
        await supabase
          .from("ai_documents")
          .update({
            status: warning ? "ready" : "failed",
            chunk_count: 0,
            error_message:
              warning ??
              "No text could be extracted. Paste the content manually or try a text-based file.",
          })
          .eq("id", doc.id);
        return { id: doc.id, chunk_count: 0, warning };
      }

      // Embed in batches.
      for (let i = 0; i < chunks.length; i += AI_EMBED_BATCH) {
        const batch = chunks.slice(i, i + AI_EMBED_BATCH);
        const vectors = await embedBatch(batch);
        const rows = batch.map((chunk_text, j) => ({
          document_id: doc.id,
          chunk_index: i + j,
          chunk_text,
          embedding: vectors[j] as unknown as string,
        }));
        const { error: chunkErr } = await supabase.from("ai_document_chunks").insert(rows);
        if (chunkErr) throw new Error(chunkErr.message);
      }

      await supabase
        .from("ai_documents")
        .update({ status: "ready", chunk_count: chunks.length, error_message: null })
        .eq("id", doc.id);

      return { id: doc.id, chunk_count: chunks.length, warning };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await supabase
        .from("ai_documents")
        .update({ status: "failed", error_message: msg })
        .eq("id", doc.id);
      throw err;
    }
  });

// ---------------------------------------------------------------------------
// Invoice AI Check
// ---------------------------------------------------------------------------

const InvoiceFinding = z.object({
  severity: z.enum(["info", "warning", "error"]),
  field: z.string(),
  message: z.string(),
  suggestion: z.string().nullable().optional(),
});

export const checkInvoiceIntegrity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ invoice_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { chatComplete } = await import("./ai-assistant.server");
    const { supabase } = context;

    const { data: inv, error } = await supabase
      .from("invoices")
      .select(
        "id,invoice_number,type,status,issue_date,due_date,currency,subtotal,vat_amount,total,amount_paid,balance,customer_id,order_id,notes",
      )
      .eq("id", data.invoice_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!inv) throw new Error("Invoice not found");

    const [{ data: items }, { data: customer }] = await Promise.all([
      supabase
        .from("invoice_items")
        .select("description,quantity,unit_price,vat_rate,line_total")
        .eq("invoice_id", data.invoice_id),
      inv.customer_id
        ? supabase
            .from("customers")
            .select("name,contact_person,email,phone,country,city,payment_terms")
            .eq("id", inv.customer_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const payload = {
      invoice: inv,
      items: items ?? [],
      customer: customer ?? null,
    };

    const system = `You are an internal invoice-integrity checker for NEVO Industrial. Given an invoice JSON payload, identify missing, inconsistent, or risky fields for a ${
      inv.type ?? "commercial"
    } invoice. Never invent values. Never propose to auto-send, delete, or mark-as-paid. Only inspect what is present.

Respond with strict JSON of the form:
{ "findings": [ { "severity": "info" | "warning" | "error", "field": "<field name>", "message": "<one sentence>", "suggestion": "<optional short suggestion or null>" } ] }

Check: customer/supplier name, invoice number, issue and due dates, line items (quantity, unit_price, line_total consistency), currency, VAT calculation vs subtotal, totals (subtotal + vat = total), payment terms, and any obvious inconsistencies. Keep findings concise.`;

    const { text } = await chatComplete({
      system,
      messages: [{ role: "user", content: JSON.stringify(payload) }],
      maxTokens: 1200,
      responseFormat: "json_object",
    });

    let findings: z.infer<typeof InvoiceFinding>[] = [];
    try {
      const parsed = JSON.parse(text) as { findings?: unknown };
      const raw = Array.isArray(parsed.findings) ? parsed.findings : [];
      findings = raw
        .map((f) => {
          const r = InvoiceFinding.safeParse(f);
          return r.success ? r.data : null;
        })
        .filter((f): f is z.infer<typeof InvoiceFinding> => f !== null)
        .slice(0, 30);
    } catch {
      findings = [
        {
          severity: "info",
          field: "assistant",
          message: text.slice(0, 500) || "The assistant returned an empty response.",
          suggestion: null,
        },
      ];
    }

    return { findings };
  });

// ---------------------------------------------------------------------------
// Contextual record summary (for the AI Assist drawer)
// ---------------------------------------------------------------------------

export const getRecordSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        module: z.enum(["customer", "supplier", "order", "invoice", "quotation", "lead"]),
        id: z.string().uuid(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    if (data.module === "customer") {
      const { data: c } = await supabase
        .from("customers")
        .select("name,contact_person,email,phone,country,city,currency,payment_terms")
        .eq("id", data.id)
        .maybeSingle();
      if (!c) return { summary: null };
      return {
        summary: `Customer: ${c.name}${c.contact_person ? ` (${c.contact_person})` : ""}. Country: ${c.country ?? "?"}. Currency: ${c.currency ?? "?"}. Terms: ${c.payment_terms ?? "n/a"}.`,
      };
    }
    if (data.module === "supplier") {
      const { data: s } = await supabase
        .from("suppliers")
        .select("name,contact_person,email,country,payment_terms")
        .eq("id", data.id)
        .maybeSingle();
      if (!s) return { summary: null };
      return {
        summary: `Supplier: ${s.name}${s.contact_person ? ` (${s.contact_person})` : ""}. Country: ${s.country ?? "?"}. Terms: ${s.payment_terms ?? "n/a"}.`,
      };
    }
    if (data.module === "order") {
      const { data: o } = await supabase
        .from("orders")
        .select("id,order_number,status,total,currency,order_date,customer_id")
        .eq("id", data.id)
        .maybeSingle();
      if (!o) return { summary: null };
      return {
        summary: `Order ${o.order_number ?? o.id}. Status: ${o.status}. Total: ${o.total} ${o.currency ?? ""}. Date: ${o.order_date ?? ""}.`,
      };
    }
    if (data.module === "invoice") {
      const { data: i } = await supabase
        .from("invoices")
        .select("invoice_number,type,status,total,balance,currency,issue_date,due_date")
        .eq("id", data.id)
        .maybeSingle();
      if (!i) return { summary: null };
      return {
        summary: `${i.type ?? "Invoice"} ${i.invoice_number ?? ""} — status ${i.status}. Total ${financeTotalAmount(i)} ${i.currency ?? ""}, balance ${financeBalanceDue(i)}. Due ${i.due_date ?? "n/a"}.`,
      };
    }
    if (data.module === "quotation") {
      const { data: q } = await supabase
        .from("quotations")
        .select("quotation_number,status,total,currency,valid_until")
        .eq("id", data.id)
        .maybeSingle();
      if (!q) return { summary: null };
      return {
        summary: `Quotation ${q.quotation_number ?? ""} — status ${q.status}. Total ${financeTotalAmount(q)} ${q.currency ?? ""}. Valid until ${q.valid_until ?? "n/a"}.`,
      };
    }
    if (data.module === "lead") {
      const { data: l } = await supabase
        .from("leads")
        .select("name,company,status,country,source")
        .eq("id", data.id)
        .maybeSingle();
      if (!l) return { summary: null };
      return {
        summary: `Lead: ${l.company ?? l.name ?? ""}${l.name && l.company ? ` (${l.name})` : ""}. Status ${l.status}. Country ${l.country ?? "?"}. Source ${l.source ?? "?"}.`,
      };
    }
    return { summary: null };
  });

export const logAiAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        action_type: z.string().min(1).max(80),
        related_module: z.string().max(60).optional(),
        related_record_id: z.string().max(120).optional(),
        ai_summary: z.string().max(4000).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ai_actions_log").insert({
      user_id: context.userId,
      action_type: data.action_type,
      related_module: data.related_module ?? null,
      related_record_id: data.related_record_id ?? null,
      ai_summary: data.ai_summary ?? null,
      metadata: (data.metadata ?? {}) as never,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
