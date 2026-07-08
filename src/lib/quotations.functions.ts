import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const IdInput = z.object({ id: z.string().uuid() });

const UpsertInput = z.object({
  id: z.string().uuid().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  inquiry_id: z.string().uuid().nullable().optional(),
  status: z
    .enum([
      "draft",
      "pending_approval",
      "approved",
      "sent",
      "accepted",
      "rejected",
      "expired",
      "converted",
      "void",
    ])
    .optional(),
  issue_date: z.string().optional(),
  valid_until: z.string().nullable().optional(),
  currency: z.string().max(8).optional(),
  vat_rate: z.number().min(0).max(100).optional(),
  terms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  internal_notes: z.string().nullable().optional(),
});

export const listQuotations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quotations")
      .select(
        "id, quotation_number, status, issue_date, valid_until, currency, subtotal, vat_amount, total, customer_id, customers(name, company_name, email), created_at, sent_at, converted_invoice_id, quotation_items(count)",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Lightweight customer creator used from the "New quotation" dialog so
 *  users never have to leave the flow to add a missing counterparty. */
export const createCustomerLite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        name: z.string().trim().min(1, "Customer name is required"),
        email: z.string().email().nullable().optional(),
        country: z.string().nullable().optional(),
        currency: z.string().max(8).nullable().optional(),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const { data: inserted, error } = await context.supabase
      .from("customers")
      .insert({
        name: data.name,
        company_name: data.name,
        email: data.email ?? null,
        country: data.country ?? null,
        currency: data.currency ?? "USD",
      })
      .select("id, name, company_name")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!inserted?.id) throw new Error("Could not create customer");
    return inserted;
  });

export const getQuotation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    const [{ data: quotation, error: qErr }, { data: items, error: iErr }] = await Promise.all([
      context.supabase
        .from("quotations")
        .select("*, customers(id,name,company_name,email,city,country,currency)")
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", data.id)
        .order("position"),
    ]);
    if (qErr) throw new Error(qErr.message);
    if (iErr) throw new Error(iErr.message);
    if (!quotation) throw new Error("Quotation not found");
    return { quotation, items: items ?? [] };
  });

export const upsertQuotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => UpsertInput.parse(v))
  .handler(async ({ context, data }) => {
    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("quotations")
        .update(data)
        .eq("id", data.id)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return { id: updated?.id };
    }
    const { data: inserted, error } = await context.supabase
      .from("quotations")
      .insert({ ...data, created_by: context.userId })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { id: inserted?.id };
  });

/**
 * Create a quotation with a required customer, valid_until, and at least
 * one line item — atomic-ish (item insert on failure rolls back the header).
 * This is the ONLY sanctioned "New quotation" entry point; the button in
 * the list must not create empty drafts anymore.
 */

const CreateFullInput = z.object({
  customer_id: z.string().uuid(),
  issue_date: z.string(),
  valid_until: z.string(),
  currency: z.string().max(8).default("USD"),
  vat_rate: z.number().min(0).max(100).default(0),
  terms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        item_code: z.string().nullable().optional(),
        hs_code: z.string().nullable().optional(),
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(0),
        unit: z.string().nullable().optional(),
        unit_price: z.number().min(0),
        discount_pct: z.number().min(0).max(100).default(0),
      }),
    )
    .min(1, "At least one line item is required"),
});

export const createQuotationWithItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CreateFullInput.parse(v))
  .handler(async ({ context, data }) => {
    const { data: inserted, error } = await context.supabase
      .from("quotations")
      .insert({
        customer_id: data.customer_id,
        issue_date: data.issue_date,
        valid_until: data.valid_until,
        currency: data.currency,
        vat_rate: data.vat_rate,
        terms: data.terms ?? null,
        notes: data.notes ?? null,
        created_by: context.userId,
        status: "draft",
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!inserted?.id) throw new Error("Could not create quotation");

    const rows = data.items.map((it, idx) => {
      const line_total =
        Math.round(
          it.quantity * it.unit_price * (1 - (it.discount_pct ?? 0) / 100) * 100,
        ) / 100;
      return {
        quotation_id: inserted.id,
        position: idx + 1,
        item_code: it.item_code ?? null,
        hs_code: it.hs_code ?? null,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit ?? "unit",
        unit_price: it.unit_price,
        discount_pct: it.discount_pct ?? 0,
        line_total,
      };
    });
    const { error: itemsErr } = await context.supabase.from("quotation_items").insert(rows);
    if (itemsErr) {
      await context.supabase.from("quotations").delete().eq("id", inserted.id);
      throw new Error(itemsErr.message);
    }

    // Audit trail
    try {
      await context.supabase.from("activity_logs").insert({
        user_id: context.userId,
        action: "create",
        entity_type: "quotation",
        entity_id: inserted.id,
        metadata: { items: rows.length, currency: data.currency },
      });
    } catch (err) {
      console.warn("createQuotationWithItems activity log failed", err);
    }
    return { id: inserted.id };
  });


const ItemInput = z.object({
  id: z.string().uuid().optional(),
  quotation_id: z.string().uuid(),
  position: z.number().int().default(1),
  item_code: z.string().nullable().optional(),
  hs_code: z.string().nullable().optional(),
  description: z.string().min(1),
  quantity: z.number().default(1),
  unit: z.string().nullable().optional(),
  unit_price: z.number().default(0),
  discount_pct: z.number().default(0),
});

export const upsertQuotationItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => ItemInput.parse(v))
  .handler(async ({ context, data }) => {
    const line_total =
      data.quantity * data.unit_price * (1 - (data.discount_pct ?? 0) / 100);
    const payload = { ...data, line_total: Math.round(line_total * 100) / 100 };
    if (data.id) {
      const { error } = await context.supabase
        .from("quotation_items")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("quotation_items").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateQuotationItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("quotation_items")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Item not found");
    const { error: insErr } = await context.supabase
      .from("quotation_items")
      .insert({
        quotation_id: row.quotation_id,
        description: row.description,
        item_code: row.item_code ?? null,
        hs_code: row.hs_code ?? null,
        quantity: row.quantity,
        unit: row.unit,
        unit_price: row.unit_price,
        discount_pct: row.discount_pct,
        line_total: row.line_total,
        position: (row.position ?? 0) + 1,
        product_id: row.product_id ?? null,
      });
    if (insErr) throw new Error(insErr.message);
    return { ok: true };
  });

export const deleteQuotationItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("quotation_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setQuotationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "draft",
          "pending_approval",
          "approved",
          "sent",
          "accepted",
          "rejected",
          "expired",
          "converted",
          "void",
        ]),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const now = new Date().toISOString();
    const patch = {
      status: data.status,
      ...(data.status === "sent" ? { sent_at: now } : {}),
      ...(data.status === "accepted" ? { accepted_at: now } : {}),
    };
    const { error } = await context.supabase.from("quotations").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteQuotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    // delete items first (in case FK isn't cascade)
    await context.supabase.from("quotation_items").delete().eq("quotation_id", data.id);
    const { error } = await context.supabase.from("quotations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listInquiriesLite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("project_inquiries")
      .select("id, name, company, project_type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    return (data ?? []) as {
      id: string;
      name: string;
      company: string | null;
      project_type: string | null;
      status: string;
      created_at: string;
    }[];
  });

/**
 * Convert an approved/accepted quotation into a proforma invoice.
 * Copies line items, sets the quotation to `converted`, and links back
 * via quotations.converted_invoice_id.
 */
export const convertQuotationToProforma = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid(),
        due_date: z.string().nullable().optional(),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const [{ data: q, error: qErr }, { data: items, error: iErr }] = await Promise.all([
      context.supabase
        .from("quotations")
        .select(
          "id, customer_id, currency, vat_rate, subtotal, vat_amount, total, terms, notes, converted_invoice_id, status",
        )
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("quotation_items")
        .select("description, quantity, unit, unit_price, discount_pct, position, product_id")
        .eq("quotation_id", data.id)
        .order("position"),
    ]);
    if (qErr) throw new Error(qErr.message);
    if (iErr) throw new Error(iErr.message);
    if (!q) throw new Error("Quotation not found");
    if (!q.customer_id) throw new Error("Quotation has no customer");
    if (q.converted_invoice_id) {
      return { invoice_id: q.converted_invoice_id, already: true };
    }

    const { data: inv, error: invErr } = await context.supabase
      .from("invoices")
      .insert({
        type: "proforma",
        status: "draft",
        customer_id: q.customer_id,
        currency: q.currency,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: data.due_date ?? null,
        subtotal: Number(q.subtotal ?? 0),
        vat_amount: Number(q.vat_amount ?? 0),
        total: Number(q.total ?? 0),
        notes: q.notes ?? null,
        payment_terms: q.terms ?? null,
      })
      .select("id, invoice_number")
      .maybeSingle();
    if (invErr) throw new Error(invErr.message);
    if (!inv?.id) throw new Error("Could not create proforma invoice");

    if ((items ?? []).length > 0) {
      const rate = Number(q.vat_rate ?? 0);
      const rows = (items ?? []).map((it) => {
        const qty = Number(it.quantity ?? 0);
        const price = Number(it.unit_price ?? 0);
        const discount = Number(it.discount_pct ?? 0);
        const line_total = Math.round(qty * price * (1 - discount / 100) * 100) / 100;
        return {
          invoice_id: inv.id,
          description: it.description,
          quantity: qty,
          unit: it.unit ?? "unit",
          unit_price: price,
          discount_pct: discount,
          vat_pct: rate,
          line_total,
          position: it.position,
          product_id: it.product_id ?? null,
        };
      });
      const { error: itemsErr } = await context.supabase.from("invoice_items").insert(rows);
      if (itemsErr) throw new Error(itemsErr.message);
    }

    const { error: linkErr } = await context.supabase
      .from("quotations")
      .update({ converted_invoice_id: inv.id, status: "converted" })
      .eq("id", data.id);
    if (linkErr) throw new Error(linkErr.message);

    // Audit trail — best-effort.
    try {
      await context.supabase.from("activity_logs").insert({
        user_id: context.userId,
        action: "convert",
        entity_type: "quotation_to_proforma",
        entity_id: data.id,
        metadata: {
          quotation_id: data.id,
          proforma_invoice_id: inv.id,
          proforma_number: inv.invoice_number,
          items: (items ?? []).length,
          total: Number(q.total ?? 0),
          currency: q.currency,
        },
      });
    } catch (err) {
      console.warn("convertQuotationToProforma activity log failed", err);
    }

    return { invoice_id: inv.id, already: false };
  });

/**
 * Convert a proforma invoice into a commercial (final) invoice.
 * Copies customer, currency, payment terms, notes, and all line items.
 * Links the new commercial invoice back to the source via
 * `invoices.proforma_invoice_id`.
 */
export const convertProformaToCommercial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid(),
        due_date: z.string().nullable().optional(),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const [{ data: pi, error: piErr }, { data: items, error: iErr }] = await Promise.all([
      context.supabase
        .from("invoices")
        .select(
          "id, type, customer_id, currency, subtotal, vat_amount, total, notes, payment_terms, invoice_number",
        )
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("invoice_items")
        .select(
          "description, quantity, unit, unit_price, discount_pct, vat_pct, line_total, position, product_id",
        )
        .eq("invoice_id", data.id)
        .order("position"),
    ]);
    if (piErr) throw new Error(piErr.message);
    if (iErr) throw new Error(iErr.message);
    if (!pi) throw new Error("Proforma invoice not found");
    if (pi.type !== "proforma") throw new Error("Source invoice is not a proforma");
    if (!pi.customer_id) throw new Error("Proforma has no customer");

    // Idempotency: reuse an existing commercial invoice already derived from
    // this proforma.
    const { data: existing } = await context.supabase
      .from("invoices")
      .select("id")
      .eq("proforma_invoice_id", pi.id)
      .eq("type", "commercial")
      .maybeSingle();
    if (existing?.id) {
      return { invoice_id: existing.id, already: true };
    }

    const { data: inv, error: invErr } = await context.supabase
      .from("invoices")
      .insert({
        type: "commercial",
        status: "draft",
        customer_id: pi.customer_id,
        currency: pi.currency,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: data.due_date ?? null,
        subtotal: Number(pi.subtotal ?? 0),
        vat_amount: Number(pi.vat_amount ?? 0),
        total: Number(pi.total ?? 0),
        notes: pi.notes ?? null,
        payment_terms: pi.payment_terms ?? null,
        proforma_invoice_id: pi.id,
      })
      .select("id, invoice_number")
      .maybeSingle();
    if (invErr) throw new Error(invErr.message);
    if (!inv?.id) throw new Error("Could not create commercial invoice");

    if ((items ?? []).length > 0) {
      const rows = (items ?? []).map((it) => ({
        invoice_id: inv.id,
        description: it.description,
        quantity: Number(it.quantity ?? 0),
        unit: it.unit ?? "unit",
        unit_price: Number(it.unit_price ?? 0),
        discount_pct: Number(it.discount_pct ?? 0),
        vat_pct: Number(it.vat_pct ?? 0),
        line_total: Number(it.line_total ?? 0),
        position: it.position,
        product_id: it.product_id ?? null,
      }));
      const { error: itemsErr } = await context.supabase
        .from("invoice_items")
        .insert(rows);
      if (itemsErr) throw new Error(itemsErr.message);
    }

    try {
      await context.supabase.from("activity_logs").insert({
        user_id: context.userId,
        action: "convert",
        entity_type: "proforma_to_invoice",
        entity_id: pi.id,
        metadata: {
          proforma_invoice_id: pi.id,
          proforma_number: pi.invoice_number,
          commercial_invoice_id: inv.id,
          commercial_number: inv.invoice_number,
          items: (items ?? []).length,
          total: Number(pi.total ?? 0),
          currency: pi.currency,
        },
      });
    } catch (err) {
      console.warn("convertProformaToCommercial activity log failed", err);
    }

    return { invoice_id: inv.id, already: false };
  });

/**
 * Email a quotation PDF to a recipient via Resend (through the Lovable
 * connector gateway). The PDF is generated on the client and passed as
 * base64. On success the quotation is bumped to `sent` when currently
 * `draft` or `approved`, and an activity log row is written.
 */
const EmailInput = z.object({
  id: z.string().uuid(),
  to: z.string().email(),
  cc: z.array(z.string().email()).optional(),
  subject: z.string().min(1).max(300),
  message: z.string().max(20_000).optional().default(""),
  pdf_base64: z.string().min(100),
  pdf_filename: z.string().min(1).max(200),
});

export const emailQuotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => EmailInput.parse(v))
  .handler(async ({ context, data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    if (!lovableKey || !resendKey) {
      throw new Error("Email provider is not configured. Contact an administrator.");
    }

    // Load quotation for reference-number in the activity log and status bump.
    const { data: q, error: qErr } = await context.supabase
      .from("quotations")
      .select("id, quotation_number, status, currency, total, customer_id")
      .eq("id", data.id)
      .maybeSingle();
    if (qErr) throw new Error(qErr.message);
    if (!q) throw new Error("Quotation not found");

    // Pull sender identity from company settings; fall back to a Resend
    // sandbox address (only deliverable to the account owner) so the call
    // never silently fails at build time.
    const { data: settings } = await context.supabase
      .from("company_settings")
      .select("legal_name, email")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const fromName = settings?.legal_name || "NEVO Industrial";
    const fromEmail = settings?.email || "onboarding@resend.dev";
    const from = `${fromName} <${fromEmail}>`;

    const html = [
      `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111;line-height:1.55">`,
      data.message
        ? data.message
            .split("\n")
            .map((l) => `<p style="margin:0 0 10px">${l.replace(/</g, "&lt;")}</p>`)
            .join("")
        : `<p>Please find attached quotation <b>${q.quotation_number ?? ""}</b>.</p>`,
      `<p style="margin-top:24px;color:#666;font-size:12px">${fromName}</p>`,
      `</div>`,
    ].join("");

    const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from,
        to: [data.to],
        cc: data.cc && data.cc.length ? data.cc : undefined,
        subject: data.subject,
        html,
        attachments: [
          {
            filename: data.pdf_filename,
            content: data.pdf_base64,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Resend send failed [${res.status}]: ${body}`);
      throw new Error(`Email provider rejected the send (${res.status}). ${body.slice(0, 300)}`);
    }
    const responseJson = (await res.json().catch(() => ({}))) as { id?: string };

    // Bump status to `sent` on first send from draft/approved.
    if (q.status === "draft" || q.status === "approved") {
      await context.supabase
        .from("quotations")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", q.id);
    }

    // Audit log — best effort.
    try {
      await context.supabase.from("activity_logs").insert({
        user_id: context.userId,
        action: "email_sent",
        entity_type: "quotation",
        entity_id: q.id,
        metadata: {
          quotation_number: q.quotation_number,
          to: data.to,
          cc: data.cc ?? [],
          subject: data.subject,
          resend_id: responseJson.id ?? null,
          filename: data.pdf_filename,
          total: Number(q.total ?? 0),
          currency: q.currency,
        },
      });
    } catch (err) {
      console.warn("emailQuotation activity log failed", err);
    }

    return { ok: true, resend_id: responseJson.id ?? null };
  });



