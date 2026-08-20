import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateObject, NoObjectGeneratedError } from "ai";
import { AiAnalysisSchema, SENSITIVE_CATEGORIES, type AiAnalysis } from "./doc-intel.schema";
import { DOC_INTEL_SYSTEM_PROMPT, buildUserPrompt } from "./doc-intel-prompt.server";

const STAFF_ROLES = [
  "super_admin",
  "management",
  "sales",
  "operations",
  "finance",
  "read_only",
] as const;
const WRITE_ROLES = ["super_admin", "management", "sales", "operations", "finance"] as const;
const APPROVE_ROLES = ["super_admin", "management"] as const;

async function assertRole(
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> },
  userId: string,
  roles: readonly string[],
) {
  const { data, error } = await supabase.rpc("current_user_has_any_role", { _roles: roles as unknown as string[] });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// ---------------------- Create row after client uploaded to originals bucket ----------------------
const CreateInput = z.object({
  storage_path: z.string().min(1),
  original_filename: z.string().min(1),
  mime_type: z.string().nullable().optional(),
  file_size: z.number().int().nonnegative().nullable().optional(),
  user_note: z.string().nullable().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  partner_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  intended_destination: z.string().nullable().optional(),
  confidentiality_level: z.string().nullable().optional(),
});

export const createDocumentRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase as never, context.userId, WRITE_ROLES);
    const { data: row, error } = await context.supabase
      .from("doc_intel_documents")
      .insert({
        storage_bucket: "documents-originals",
        storage_path: data.storage_path,
        original_filename: data.original_filename,
        mime_type: data.mime_type ?? null,
        file_size: data.file_size ?? null,
        user_note: data.user_note ?? null,
        customer_id: data.customer_id ?? null,
        partner_id: data.partner_id ?? null,
        project_id: data.project_id ?? null,
        intended_destination: data.intended_destination ?? null,
        confidentiality_level: data.confidentiality_level ?? "internal",
        status: "uploaded",
        uploaded_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("doc_intel_audit_logs").insert({
      document_id: row.id,
      actor_id: context.userId,
      action: "upload",
      details: { filename: data.original_filename, size: data.file_size },
    });
    return row;
  });

// ---------------------- Analyze ----------------------
const AnalyzeInput = z.object({ documentId: z.string().uuid() });

export const analyzeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AnalyzeInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase as never, context.userId, WRITE_ROLES);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { extractDocumentText } = await import("./doc-intel-extract.server");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");

    const { data: doc, error: dErr } = await context.supabase
      .from("doc_intel_documents")
      .select("*")
      .eq("id", data.documentId)
      .single();
    if (dErr) throw new Error(dErr.message);

    // Fetch the file bytes with service role (bucket is private)
    const { data: blob, error: fErr } = await supabaseAdmin.storage
      .from(doc.storage_bucket)
      .download(doc.storage_path);
    if (fErr || !blob) throw new Error(fErr?.message ?? "Failed to download original file");
    const bytes = new Uint8Array(await blob.arrayBuffer());

    const extraction = await extractDocumentText(
      bytes,
      doc.mime_type ?? "",
      doc.original_filename,
    );

    // Optional context lookups
    let customerName: string | null = null;
    let partnerName: string | null = null;
    let projectName: string | null = null;
    if (doc.customer_id) {
      const { data: c } = await context.supabase
        .from("customers")
        .select("name")
        .eq("id", doc.customer_id)
        .maybeSingle();
      customerName = (c as { name?: string } | null)?.name ?? null;
    }
    if (doc.partner_id) {
      const { data: p } = await context.supabase
        .from("partners")
        .select("company_name")
        .eq("id", doc.partner_id)
        .maybeSingle();
      partnerName = (p as { company_name?: string } | null)?.company_name ?? null;
    }
    if (doc.project_id) {
      const { data: pr } = await context.supabase
        .from("projects")
        .select("project_name")
        .eq("id", doc.project_id)
        .maybeSingle();
      projectName = (pr as { project_name?: string } | null)?.project_name ?? null;
    }

    const userPrompt = buildUserPrompt({
      userNote: doc.user_note,
      customer: customerName,
      partner: partnerName,
      project: projectName,
      intendedDestination: doc.intended_destination,
      documentText: extraction.text,
    });

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(apiKey);
    const modelId = "google/gemini-2.5-flash";
    const model = gateway(modelId);

    // Build messages — attach file bytes for PDFs/images so Gemini can read them natively.
    type ContentBlock =
      | { type: "text"; text: string }
      | { type: "image"; image: string }
      | { type: "file"; data: string; mediaType: string; filename?: string };
    const content: ContentBlock[] = [{ type: "text", text: userPrompt }];
    if (extraction.usedMultimodal) {
      const b64 = Buffer.from(bytes).toString("base64");
      const mt = (doc.mime_type || "").toLowerCase();
      if (mt.startsWith("image/")) {
        content.push({ type: "image", image: `data:${mt};base64,${b64}` });
      } else {
        content.push({
          type: "file",
          data: `data:${mt || "application/pdf"};base64,${b64}`,
          mediaType: mt || "application/pdf",
          filename: doc.original_filename,
        });
      }
    }

    let analysis: AiAnalysis;
    try {
      const { object } = await generateObject({
        model,
        system: DOC_INTEL_SYSTEM_PROMPT,
        schema: AiAnalysisSchema,
        messages: [{ role: "user", content: content as never }],
      });
      analysis = object;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err) && err.text) {
        try {
          const cleaned = err.text.replace(/^```json\s*|\s*```$/g, "").trim();
          analysis = AiAnalysisSchema.parse(JSON.parse(cleaned));
        } catch {
          throw new Error("AI returned invalid JSON. Please try again or fill fields manually.");
        }
      } else {
        throw err;
      }
    }

    // Sanitize AI recommendations against server-enforced policy
    const isSensitive = SENSITIVE_CATEGORIES.has(analysis.category);
    const lowConfidence = (analysis.confidence_score ?? 0) < 0.85;
    let requiresApproval = isSensitive || lowConfidence || analysis.requires_human_approval;
    let visibility = analysis.portal_visibility;
    let confidentiality = analysis.confidentiality_level;
    let destination = analysis.recommended_destination;
    let folderPath = analysis.recommended_folder_path;
    if (isSensitive && visibility === "public") visibility = "none";

    // Apply admin-defined routing rules
    const { fetchEnabledRules, applyRulesToAnalysis, snapshotFromAnalysis } = await import(
      "./doc-intel-rules.server"
    );
    const rules = await fetchEnabledRules(context.supabase as never);
    const snap = snapshotFromAnalysis(analysis, doc.original_filename);
    const ruleOutcome = applyRulesToAnalysis(
      { ...snap, confidentiality_level: confidentiality, portal_visibility: visibility },
      rules,
    );
    confidentiality = ruleOutcome.confidentiality;
    visibility = ruleOutcome.visibility;
    destination = ruleOutcome.destination;
    folderPath = ruleOutcome.folder_path;
    if (ruleOutcome.requires_approval) requiresApproval = true;
    const extraTags = ruleOutcome.added_tags;

    // Persist extraction + AI fields
    await context.supabase.from("doc_intel_extractions").insert({
      document_id: doc.id,
      raw_text: extraction.text?.slice(0, 20_000) ?? null,
      extracted_json: analysis as unknown as never,
      model_name: modelId,
    });

    const { data: updated, error: uErr } = await context.supabase
      .from("doc_intel_documents")
      .update({
        title: analysis.document_title,
        summary: analysis.summary,
        document_type: analysis.document_type,
        category: analysis.category,
        language: analysis.detected_language ?? null,
        destination: destination,
        folder_path: folderPath,
        stored_filename: analysis.recommended_filename,
        confidentiality_level: confidentiality,
        portal_visibility: visibility,
        ai_confidence: analysis.confidence_score,
        ai_reasoning: analysis.reasoning,
        detected_company: analysis.detected_company,
        detected_country: analysis.detected_country,
        detected_products: analysis.detected_products as unknown as never,
        detected_standards: analysis.detected_standards as unknown as never,
        status: requiresApproval ? "pending_approval" : "analyzed",
      })
      .eq("id", doc.id)
      .select("*")
      .single();
    if (uErr) throw new Error(uErr.message);

    // Refresh tags (AI tags + rule-added tags, deduped)
    await context.supabase.from("doc_intel_tags").delete().eq("document_id", doc.id);
    const allTags = Array.from(new Set([...(analysis.tags ?? []), ...extraTags]));
    if (allTags.length > 0) {
      await context.supabase
        .from("doc_intel_tags")
        .insert(allTags.map((tag) => ({ document_id: doc.id, tag })));
    }

    await context.supabase.from("doc_intel_audit_logs").insert({
      document_id: doc.id,
      actor_id: context.userId,
      action: "analyze",
      details: {
        model: modelId,
        confidence: analysis.confidence_score,
        sensitive: isSensitive,
        note: extraction.note ?? null,
        matched_rules: ruleOutcome.matched.map((m) => ({ id: m.id, name: m.name })),
      },
    });

    return { document: updated, analysis };
  });

// ---------------------- Approve / Reject / Send back ----------------------
const ApproveInput = z.object({
  documentId: z.string().uuid(),
  action: z.enum(["approve", "reject", "send_to_review"]),
  edited: z
    .object({
      title: z.string().optional(),
      summary: z.string().optional(),
      category: z.string().optional(),
      destination: z.string().optional(),
      folder_path: z.string().optional(),
      stored_filename: z.string().optional(),
      confidentiality_level: z.string().optional(),
      portal_visibility: z.string().optional(),
      tags: z.array(z.string()).optional(),
      customer_id: z.string().uuid().nullable().optional(),
      partner_id: z.string().uuid().nullable().optional(),
      project_id: z.string().uuid().nullable().optional(),
    })
    .default({}),
});

function sanitizeSegment(s: string) {
  return s.replace(/[^A-Za-z0-9._\-\/]+/g, "_").replace(/^\/+|\/+$/g, "");
}

export const approveDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApproveInput.parse(d))
  .handler(async ({ data, context }) => {
    // Reject / send-back allowed for any staff writer; approval restricted to management.
    if (data.action === "approve") {
      await assertRole(context.supabase as never, context.userId, APPROVE_ROLES);
    } else {
      await assertRole(context.supabase as never, context.userId, WRITE_ROLES);
    }

    // Apply edited metadata first
    const patch: Record<string, unknown> = { ...data.edited };
    delete patch.tags;
    if (Object.keys(patch).length > 0) {
      const { error } = await context.supabase
        .from("doc_intel_documents")
        .update(patch as never)
        .eq("id", data.documentId);
      if (error) throw new Error(error.message);
    }
    if (data.edited.tags) {
      await context.supabase.from("doc_intel_tags").delete().eq("document_id", data.documentId);
      if (data.edited.tags.length > 0) {
        await context.supabase
          .from("doc_intel_tags")
          .insert(data.edited.tags.map((tag) => ({ document_id: data.documentId, tag })));
      }
    }

    const { data: doc, error: dErr } = await context.supabase
      .from("doc_intel_documents")
      .select("*")
      .eq("id", data.documentId)
      .single();
    if (dErr) throw new Error(dErr.message);

    if (data.action === "reject") {
      await context.supabase
        .from("doc_intel_documents")
        .update({ status: "rejected" })
        .eq("id", doc.id);
      await context.supabase.from("doc_intel_audit_logs").insert({
        document_id: doc.id,
        actor_id: context.userId,
        action: "reject",
      });
      return { ok: true, status: "rejected" as const };
    }

    if (data.action === "send_to_review") {
      await context.supabase
        .from("doc_intel_documents")
        .update({ status: "pending_approval" })
        .eq("id", doc.id);
      await context.supabase.from("doc_intel_audit_logs").insert({
        document_id: doc.id,
        actor_id: context.userId,
        action: "send_to_review",
      });
      return { ok: true, status: "pending_approval" as const };
    }

    // --- Approve & route ---
    // Server-enforced guard: sensitive categories cannot be published as public
    if (SENSITIVE_CATEGORIES.has(doc.category ?? "") && doc.portal_visibility === "public") {
      throw new Error(
        `Category "${doc.category}" cannot be routed as public. Change visibility first.`,
      );
    }

    const targetBucket =
      doc.portal_visibility === "public"
        ? "documents-public"
        : doc.portal_visibility === "customer" ||
            doc.portal_visibility === "partner" ||
            doc.portal_visibility === "on_request"
          ? "documents-private"
          : "documents-routed";

    const folder = sanitizeSegment(doc.folder_path || doc.category || "misc");
    const filename = sanitizeSegment(doc.stored_filename || doc.original_filename);
    const routedPath = `${folder}/${Date.now()}-${filename}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: blob, error: fErr } = await supabaseAdmin.storage
      .from(doc.storage_bucket)
      .download(doc.storage_path);
    if (fErr || !blob) throw new Error(fErr?.message ?? "Failed to read original for routing");

    const { error: upErr } = await supabaseAdmin.storage
      .from(targetBucket)
      .upload(routedPath, blob, {
        contentType: doc.mime_type ?? undefined,
        upsert: false,
      });
    if (upErr) throw new Error(`Route upload failed: ${upErr.message}`);

    // Public URL only if bucket is public (workspace may block public buckets — fallback to signed URL later)
    let fileUrl: string | null = null;
    if (targetBucket === "documents-public") {
      const pub = supabaseAdmin.storage.from(targetBucket).getPublicUrl(routedPath);
      fileUrl = pub.data.publicUrl;
    }

    const { data: updated, error: uErr } = await context.supabase
      .from("doc_intel_documents")
      .update({
        status: "routed",
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
        routed_bucket: targetBucket,
        routed_path: routedPath,
        file_url: fileUrl,
      })
      .eq("id", doc.id)
      .select("*")
      .single();
    if (uErr) throw new Error(uErr.message);

    // Version + audit
    const { data: existingVersions } = await context.supabase
      .from("doc_intel_versions")
      .select("version_number")
      .eq("document_id", doc.id)
      .order("version_number", { ascending: false })
      .limit(1);
    const nextVersion =
      ((existingVersions?.[0] as { version_number?: number } | undefined)?.version_number ?? 0) + 1;

    await context.supabase.from("doc_intel_versions").insert({
      document_id: doc.id,
      version_number: nextVersion,
      storage_bucket: targetBucket,
      storage_path: routedPath,
      file_url: fileUrl,
      filename,
      change_note: nextVersion === 1 ? "Initial routed version" : "Re-routed",
      created_by: context.userId,
    });
    await context.supabase.from("doc_intel_audit_logs").insert({
      document_id: doc.id,
      actor_id: context.userId,
      action: "approve_and_route",
      details: {
        bucket: targetBucket,
        path: routedPath,
        visibility: doc.portal_visibility,
        destination: doc.destination,
      },
    });

    return { ok: true, status: "routed" as const, document: updated };
  });

// ---------------------- List / Get / Sign / Request access ----------------------
const ListInput = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  customer_id: z.string().uuid().optional(),
  partner_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  destination: z.string().optional(),
  confidentiality_level: z.string().optional(),
  portal_visibility: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(200).default(100),
});

export const listDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("doc_intel_documents")
      .select(
        "*, customers(name), partners(company_name), projects(project_name)",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status) q = q.eq("status", data.status);
    if (data.category) q = q.eq("category", data.category);
    if (data.customer_id) q = q.eq("customer_id", data.customer_id);
    if (data.partner_id) q = q.eq("partner_id", data.partner_id);
    if (data.project_id) q = q.eq("project_id", data.project_id);
    if (data.destination) q = q.eq("destination", data.destination);
    if (data.confidentiality_level) q = q.eq("confidentiality_level", data.confidentiality_level);
    if (data.portal_visibility) q = q.eq("portal_visibility", data.portal_visibility);
    if (data.search) {
      const s = data.search.replace(/[,%]/g, " ");
      q = q.or(`title.ilike.%${s}%,summary.ilike.%${s}%,original_filename.ilike.%${s}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: doc }, { data: tags }, { data: versions }, { data: audit }, { data: extract }] =
      await Promise.all([
        context.supabase
          .from("doc_intel_documents")
          .select("*, customers(name), partners(company_name), projects(project_name)")
          .eq("id", data.id)
          .single(),
        context.supabase.from("doc_intel_tags").select("*").eq("document_id", data.id),
        context.supabase
          .from("doc_intel_versions")
          .select("*")
          .eq("document_id", data.id)
          .order("version_number", { ascending: false }),
        context.supabase
          .from("doc_intel_audit_logs")
          .select("*")
          .eq("document_id", data.id)
          .order("created_at", { ascending: false }),
        context.supabase
          .from("doc_intel_extractions")
          .select("*")
          .eq("document_id", data.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
    if (!doc) throw new Error("Document not found");
    return { document: doc, tags: tags ?? [], versions: versions ?? [], audit: audit ?? [], extract: extract ?? null };
  });

export const signDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), which: z.enum(["original", "routed"]).default("routed") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: doc, error } = await context.supabase
      .from("doc_intel_documents")
      .select(
        "storage_bucket,storage_path,routed_bucket,routed_path,stored_filename,original_filename,confidentiality_level,status,uploaded_by,customer_id,partner_id",
      )
      .eq("id", data.id)
      .single();
    if (error || !doc) throw new Error(error?.message ?? "Not found");

    const sensitive = ["confidential", "restricted", "secret"].includes(
      (doc.confidentiality_level ?? "").toLowerCase(),
    );
    if (sensitive && doc.status !== "approved") {
      const isUploader = doc.uploaded_by === context.userId;
      const { data: canApprove } = await context.supabase.rpc("current_user_has_any_role", { _roles: ["super_admin", "management", "finance"] });
      if (!isUploader && !canApprove) {
        throw new Error("Document is pending approval — access locked");
      }
    }

    const bucket =
      data.which === "routed" && doc.routed_bucket ? doc.routed_bucket : doc.storage_bucket;
    const path = data.which === "routed" && doc.routed_path ? doc.routed_path : doc.storage_path;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, 300);
    if (sErr || !signed) throw new Error(sErr?.message ?? "Sign failed");
    return {
      url: signed.signedUrl,
      filename: doc.stored_filename || doc.original_filename,
    };
  });

export const requestDocumentAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), note: z.string().max(1000).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await context.supabase.from("doc_intel_audit_logs").insert({
      document_id: data.id,
      actor_id: context.userId,
      action: "access_request",
      details: { note: data.note ?? null },
    });
    return { ok: true };
  });

// ---------------------- Simple pickers ----------------------
export const listCustomersLite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("customers")
      .select("id, name")
      .order("name")
      .limit(500);
    return ((data ?? []) as unknown as { id: string; name: string }[]).map((c) => ({
      id: c.id,
      company_name: c.name,
    }));
  });

export const listPartnersLite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("partners")
      .select("id, company_name")
      .order("company_name")
      .limit(500);
    return (data ?? []) as unknown as { id: string; company_name: string }[];
  });

export const listProjectsLite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("projects")
      .select("id, project_name, customer_id")
      .order("project_name")
      .limit(500);
    return (data ?? []) as { id: string; project_name: string; customer_id: string | null }[];
  });
