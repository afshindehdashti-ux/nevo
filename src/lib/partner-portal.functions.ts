import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { writeAudit } from "./audit-log";

const PartnerScoped = z.object({ partner_id: z.string().uuid() });

async function assertLinked(context: any, partnerId: string) {
  const { data, error } = await context.supabase
    .from("partner_users")
    .select("partner_id")
    .eq("user_id", context.userId)
    .eq("partner_id", partnerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Not authorized for this partner");
}

export const getMyPartnerContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: links, error: linkErr } = await context.supabase
      .from("partner_users")
      .select("partner_id")
      .eq("user_id", context.userId);
    if (linkErr) throw new Error(linkErr.message);
    const ids = (links ?? []).map((l: any) => l.partner_id);
    if (ids.length === 0) return { partner: null, allPartners: [] };

    const { data: partners, error } = await context.supabase
      .from("partners")
      .select("id, company_name, contact_email, country, partner_type, created_at")
      .in("id", ids);
    if (error) throw new Error(error.message);
    const primary = partners?.[0] ?? null;
    if (primary) {
      await writeAudit(context.supabase, {
        user_id: context.userId,
        action: "portal_access",
        entity_type: "partner",
        entity_id: primary.id,
        metadata: { portal: "partner", partner_count: partners?.length ?? 0 },
        old_values: null,
        new_values: null,
      });
    }
    return { partner: primary, allPartners: partners ?? [] };
  });

export const getMyPartnerLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v) => PartnerScoped.parse(v))
  .handler(async ({ context, data }) => {
    await assertLinked(context, data.partner_id);
    const { data: rows, error } = await context.supabase
      .from("project_inquiries")
      .select(
        "id, name, company, country, project_type, application, status, priority, budget_range, timeline, created_at, next_action_date",
      )
      .eq("partner_id", data.partner_id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getMyPartnerCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v) => PartnerScoped.parse(v))
  .handler(async ({ context, data }) => {
    await assertLinked(context, data.partner_id);
    const { data: rows, error } = await context.supabase
      .from("customers")
      .select("id, name, contact_person, country, city, currency, is_active, created_at")
      .eq("partner_id", data.partner_id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getMyPartnerDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v) => PartnerScoped.parse(v))
  .handler(async ({ context, data }) => {
    await assertLinked(context, data.partner_id);
    const { data: rows, error } = await context.supabase
      .from("doc_intel_documents")
      .select(
        "id, title, category, storage_bucket, storage_path, mime_type, file_size, created_at, status",
      )
      .eq("partner_id", data.partner_id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getMyPartnerDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v) => z.object({ document_id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { data: doc, error } = await context.supabase
      .from("doc_intel_documents")
      .select("storage_bucket, storage_path, partner_id, status")
      .eq("id", data.document_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc?.partner_id) throw new Error("Document not available");
    await assertLinked(context, doc.partner_id);
    if (doc.status !== "approved") throw new Error("Document not approved");
    if (!doc.storage_bucket || !doc.storage_path) throw new Error("Missing storage path");
    const { data: signed, error: sErr } = await context.supabase.storage
      .from(doc.storage_bucket)
      .createSignedUrl(doc.storage_path, 60 * 10);
    if (sErr) throw new Error(sErr.message);
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "portal_document_access",
      entity_type: "document",
      entity_id: data.document_id,
      metadata: { portal: "partner", partner_id: doc.partner_id, bucket: doc.storage_bucket },
      old_values: null,
      new_values: null,
    });
    return { url: signed?.signedUrl ?? null };
  });

export const getMyPartnerCommissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v) => PartnerScoped.parse(v))
  .handler(async ({ context, data }) => {
    await assertLinked(context, data.partner_id);
    const { data: rows, error } = await context.supabase
      .from("partner_commissions")
      .select(
        "id, amount, currency, status, earned_at, paid_at, notes, customer_id, order_id, invoice_id, created_at",
      )
      .eq("partner_id", data.partner_id)
      .order("earned_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getMyPartnerPerformance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v) => PartnerScoped.parse(v))
  .handler(async ({ context, data }) => {
    await assertLinked(context, data.partner_id);

    const [leadsRes, customersRes, commissionsRes] = await Promise.all([
      context.supabase
        .from("project_inquiries")
        .select("id, status, created_at", { count: "exact" })
        .eq("partner_id", data.partner_id),
      context.supabase
        .from("customers")
        .select("id, is_active", { count: "exact" })
        .eq("partner_id", data.partner_id),
      context.supabase
        .from("partner_commissions")
        .select("amount, currency, status, earned_at")
        .eq("partner_id", data.partner_id),
    ]);

    const leads = leadsRes.data ?? [];
    const customers = customersRes.data ?? [];
    const commissions = commissionsRes.data ?? [];

    const currency = commissions[0]?.currency ?? "USD";
    const sumBy = (pred: (c: any) => boolean) =>
      commissions.filter(pred).reduce((s, c) => s + Number(c.amount ?? 0), 0);

    const now = new Date();
    const ytdStart = new Date(now.getFullYear(), 0, 1);

    return {
      leadsTotal: leads.length,
      leadsNew: leads.filter((l: any) =>
        ["new", "contacted"].includes((l.status ?? "").toLowerCase()),
      ).length,
      leadsConverted: leads.filter((l: any) => (l.status ?? "").toLowerCase() === "converted")
        .length,
      customersTotal: customers.length,
      customersActive: customers.filter((c: any) => c.is_active).length,
      currency,
      commissionPending: sumBy((c) => c.status === "pending" || c.status === "approved"),
      commissionPaid: sumBy((c) => c.status === "paid"),
      commissionYtd: sumBy((c) => c.status === "paid" && new Date(c.earned_at) >= ytdStart),
      commissionCount: commissions.length,
    };
  });
