import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { APPROVAL_ENTITY_TYPES } from "@/lib/approvals.functions";

export type ApprovalAuditEntry = {
  id: string;
  timestamp: string;
  action: string; // approve | reject | cancel | request
  entity_type: string; // stripped of "approval:" prefix
  entity_id: string;
  actor_id: string | null;
  actor_name: string | null;
  request_id: string | null;
  previous_status: string | null;
  new_status: string | null;
  reason: string | null;
  notes: string | null;
  affected_fields: Record<string, string | number | boolean | null> | null;
  entity_label?: string | null;
};

const ListInput = z
  .object({
    entity_type: z.enum(APPROVAL_ENTITY_TYPES).nullable().optional(),
    entity_id: z.string().uuid().nullable().optional(),
    action: z.enum(["approve", "reject", "cancel"]).nullable().optional(),
    limit: z.number().int().min(1).max(500).optional(),
  })
  .default({});

function normalizeFields(v: unknown): Record<string, string | number | boolean | null> | null {
  if (!v || typeof v !== "object") return null;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (val === null || val === undefined) out[k] = null;
    else if (typeof val === "string" || typeof val === "number" || typeof val === "boolean")
      out[k] = val;
    else {
      try {
        out[k] = JSON.stringify(val);
      } catch {
        out[k] = String(val);
      }
    }
  }
  return out;
}

export const listApprovalAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v) => ListInput.parse(v ?? {}))
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("activity_logs")
      .select("id, created_at, user_id, action, entity_type, entity_id, metadata")
      .like("entity_type", "approval:%")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);

    if (data.entity_type) q = q.eq("entity_type", `approval:${data.entity_type}`);
    if (data.entity_id) q = q.eq("entity_id", data.entity_id);
    if (data.action) q = q.eq("action", data.action);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const list = (rows ?? []).map((r: any): ApprovalAuditEntry => {
      const meta = (r.metadata ?? {}) as Record<string, any>;
      const et = String(r.entity_type ?? "").replace(/^approval:/, "");
      return {
        id: r.id,
        timestamp: r.created_at,
        action: r.action,
        entity_type: et,
        entity_id: String(r.entity_id ?? ""),
        actor_id: r.user_id ?? null,
        actor_name: null,
        request_id: meta.request_id ?? null,
        previous_status: meta.previous_status ?? "pending",
        new_status:
          meta.decision ??
          (r.action === "approve"
            ? "approved"
            : r.action === "reject"
              ? "rejected"
              : r.action === "cancel"
                ? "cancelled"
                : null),
        reason: meta.reason ?? null,
        notes: meta.notes ?? null,
        affected_fields: normalizeFields(meta.details),
      };
    });

    // Resolve actor names
    const userIds = Array.from(
      new Set(list.map((r) => r.actor_id).filter((v): v is string => !!v)),
    );
    if (userIds.length) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      const nameById = new Map((profs ?? []).map((p: any) => [p.id, p.full_name || ""]));
      for (const r of list) if (r.actor_id) r.actor_name = nameById.get(r.actor_id) ?? null;
    }

    // Resolve entity labels
    const byType = new Map<string, Set<string>>();
    for (const r of list) {
      if (!r.entity_id) continue;
      if (!byType.has(r.entity_type)) byType.set(r.entity_type, new Set());
      byType.get(r.entity_type)!.add(r.entity_id);
    }
    const labels = new Map<string, string>();
    const key = (t: string, id: string) => `${t}:${id}`;

    const invoiceIds = new Set<string>();
    (["proforma", "invoice"] as const).forEach((t) =>
      byType.get(t)?.forEach((id) => invoiceIds.add(id)),
    );
    if (invoiceIds.size) {
      const { data: inv } = await context.supabase
        .from("invoices")
        .select("id, invoice_number, total, currency, type")
        .in("id", Array.from(invoiceIds));
      for (const r of inv ?? []) {
        labels.set(
          key(r.type === "proforma" ? "proforma" : "invoice", r.id),
          `${r.invoice_number ?? "(draft)"} · ${r.currency} ${Number(r.total).toLocaleString()}`,
        );
      }
    }
    const commIds = Array.from(byType.get("commission_invoice") ?? []);
    if (commIds.length) {
      const { data: c } = await context.supabase
        .from("partner_commissions")
        .select("id, amount, currency, partners(company_name)")
        .in("id", commIds);
      for (const r of (c ?? []) as any[]) {
        labels.set(
          key("commission_invoice", r.id),
          `${r.partners?.company_name ?? "Partner"} · ${r.currency} ${Number(r.amount).toLocaleString()}`,
        );
      }
    }
    const docIds = Array.from(byType.get("document") ?? []);
    if (docIds.length) {
      const { data: d } = await context.supabase
        .from("doc_intel_documents")
        .select("id, original_filename, title, confidentiality_level")
        .in("id", docIds);
      for (const r of d ?? []) {
        labels.set(
          key("document", r.id),
          `${r.title || r.original_filename || "Document"}${r.confidentiality_level ? ` · ${r.confidentiality_level}` : ""}`,
        );
      }
    }
    const qIds = Array.from(byType.get("quotation_discount") ?? []);
    if (qIds.length) {
      const { data: qd } = await context.supabase
        .from("quotations")
        .select("id, quotation_number, total, currency")
        .in("id", qIds);
      for (const r of qd ?? []) {
        labels.set(
          key("quotation_discount", r.id),
          `${r.quotation_number ?? "(draft)"} · ${r.currency} ${Number(r.total).toLocaleString()}`,
        );
      }
    }

    for (const r of list) {
      r.entity_label = labels.get(key(r.entity_type, r.entity_id)) ?? null;
    }

    return list;
  });
