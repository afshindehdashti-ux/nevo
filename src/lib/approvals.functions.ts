import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const APPROVAL_ENTITY_TYPES = [
  "proforma",
  "invoice",
  "commission_invoice",
  "document",
  "quotation_discount",
] as const;
export type ApprovalEntityType = (typeof APPROVAL_ENTITY_TYPES)[number];

export const APPROVAL_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export type ApprovalRequest = {
  id: string;
  entity_type: ApprovalEntityType;
  entity_id: string;
  reason: string | null;
  details: Record<string, string | number | boolean | null> | null;
  status: ApprovalStatus;
  requested_by: string | null;
  requested_at: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_notes: string | null;
  created_at: string;
  updated_at: string;
  entity_label?: string | null;
  requested_by_name?: string | null;
  decided_by_name?: string | null;
};

const SubmitInput = z.object({
  entity_type: z.enum(APPROVAL_ENTITY_TYPES),
  entity_id: z.string().uuid(),
  reason: z.string().min(1),
  details: z.record(z.string(), z.any()).optional(),
});

export const submitApprovalRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v) => SubmitInput.parse(v))
  .handler(async ({ context, data }) => {
    const { data: existing } = await context.supabase
      .from("approval_requests")
      .select("id")
      .eq("entity_type", data.entity_type)
      .eq("entity_id", data.entity_id)
      .eq("status", "pending")
      .maybeSingle();
    if (existing?.id) return { ok: true, id: existing.id, deduped: true };

    const { data: row, error } = await context.supabase
      .from("approval_requests")
      .insert({
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        reason: data.reason,
        details: data.details ?? {},
        requested_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row!.id, deduped: false };
  });

const DecideInput = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected", "cancelled"]),
  notes: z.string().nullable().optional(),
});

export const decideApprovalRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v) => DecideInput.parse(v))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.rpc("decide_approval_request", {
      _id: data.id,
      _decision: data.decision,
      _notes: data.notes ?? undefined,
    });
    if (error) throw new Error(error.message);
    return row as ApprovalRequest;
  });

const ListInput = z
  .object({
    status: z.enum(APPROVAL_STATUSES).nullable().optional(),
    entity_type: z.enum(APPROVAL_ENTITY_TYPES).nullable().optional(),
    entity_id: z.string().uuid().nullable().optional(),
    limit: z.number().int().min(1).max(500).optional(),
  })
  .default({});

export const listApprovalRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v) => ListInput.parse(v ?? {}))
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("approval_requests")
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.status) q = q.eq("status", data.status);
    if (data.entity_type) q = q.eq("entity_type", data.entity_type);
    if (data.entity_id) q = q.eq("entity_id", data.entity_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as ApprovalRequest[];

    // Resolve entity labels
    const byType = new Map<string, Set<string>>();
    for (const r of list) {
      if (!byType.has(r.entity_type)) byType.set(r.entity_type, new Set());
      byType.get(r.entity_type)!.add(r.entity_id);
    }
    const labels = new Map<string, string>();
    const key = (t: string, id: string) => `${t}:${id}`;

    const invoiceIds = new Set<string>();
    (["proforma", "invoice"] as const).forEach((t) => {
      byType.get(t)?.forEach((id) => invoiceIds.add(id));
    });
    if (invoiceIds.size) {
      const { data } = await context.supabase
        .from("invoices")
        .select("id, invoice_number, total, currency, type")
        .in("id", Array.from(invoiceIds));
      for (const r of data ?? []) {
        labels.set(
          key(r.type === "proforma" ? "proforma" : "invoice", r.id),
          `${r.invoice_number ?? "(draft)"} · ${r.currency} ${Number(r.total).toLocaleString()}`,
        );
      }
    }
    const commIds = Array.from(byType.get("commission_invoice") ?? []);
    if (commIds.length) {
      const { data } = await context.supabase
        .from("partner_commissions")
        .select("id, amount, currency, partner_id, partners(company_name)")
        .in("id", commIds);
      for (const r of (data ?? []) as any[]) {
        labels.set(
          key("commission_invoice", r.id),
          `${r.partners?.company_name ?? "Partner"} · ${r.currency} ${Number(r.amount).toLocaleString()}`,
        );
      }
    }
    const docIds = Array.from(byType.get("document") ?? []);
    if (docIds.length) {
      const { data } = await context.supabase
        .from("doc_intel_documents")
        .select("id, original_filename, title, confidentiality_level")
        .in("id", docIds);
      for (const r of data ?? []) {
        labels.set(
          key("document", r.id),
          `${r.title || r.original_filename || "Document"}${r.confidentiality_level ? ` · ${r.confidentiality_level}` : ""}`,
        );
      }
    }
    const qIds = Array.from(byType.get("quotation_discount") ?? []);
    if (qIds.length) {
      const { data } = await context.supabase
        .from("quotations")
        .select("id, quotation_number, total, currency")
        .in("id", qIds);
      for (const r of data ?? []) {
        labels.set(
          key("quotation_discount", r.id),
          `${r.quotation_number ?? "(draft)"} · ${r.currency} ${Number(r.total).toLocaleString()}`,
        );
      }
    }

    // Resolve requester/decider names
    const userIds = new Set<string>();
    for (const r of list) {
      if (r.requested_by) userIds.add(r.requested_by);
      if (r.decided_by) userIds.add(r.decided_by);
    }
    const names = new Map<string, string>();
    if (userIds.size) {
      const { data } = await context.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(userIds));
      for (const p of data ?? []) names.set(p.id, p.full_name || "");
    }

    return list.map((r) => ({
      ...r,
      entity_label: labels.get(key(r.entity_type, r.entity_id)) ?? null,
      requested_by_name: r.requested_by ? (names.get(r.requested_by) ?? null) : null,
      decided_by_name: r.decided_by ? (names.get(r.decided_by) ?? null) : null,
    }));
  });

export const getApprovalThresholds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("company_settings")
      .select(
        "approval_invoice_threshold, approval_commission_threshold, approval_discount_pct_threshold",
      )
      .eq("is_active", true)
      .maybeSingle();
    return {
      invoice: Number(data?.approval_invoice_threshold ?? 10000),
      commission: Number(data?.approval_commission_threshold ?? 2500),
      discount_pct: Number(data?.approval_discount_pct_threshold ?? 15),
    };
  });
