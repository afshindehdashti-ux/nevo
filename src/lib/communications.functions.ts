import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { writeAudit } from "./audit-log";

const ENTITY_TYPES = [
  "customer",
  "lead",
  "order",
  "invoice",
  "quotation",
  "project",
  "partner",
  "shipment",
] as const;

const KINDS = ["note", "email", "call", "meeting", "whatsapp", "file"] as const;
const DIRECTIONS = ["inbound", "outbound", "internal"] as const;

const EntityInput = z.object({
  entity_type: z.enum(ENTITY_TYPES),
  entity_id: z.string().uuid(),
});

const AttachmentSchema = z.object({
  name: z.string(),
  path: z.string(),
  size: z.number().optional(),
  mime: z.string().optional(),
});
export type CommAttachment = z.infer<typeof AttachmentSchema>;

export const listCommunications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v) => EntityInput.parse(v))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("communications")
      .select("*")
      .eq("entity_type", data.entity_type)
      .eq("entity_id", data.entity_id)
      .order("occurred_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const CreateInput = EntityInput.extend({
  kind: z.enum(KINDS).default("note"),
  direction: z.enum(DIRECTIONS).default("internal"),
  subject: z.string().nullable().optional(),
  body: z.string().min(1),
  contact_name: z.string().nullable().optional(),
  contact_email: z.string().nullable().optional(),
  occurred_at: z.string().optional(),
  follow_up_at: z.string().nullable().optional(),
  attachments: z.array(AttachmentSchema).optional(),
});

export const createCommunication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v) => CreateInput.parse(v))
  .handler(async ({ context, data }) => {
    const insertPayload = {
      ...data,
      attachments: data.attachments ?? [],
      user_id: context.userId,
      occurred_at: data.occurred_at ?? new Date().toISOString(),
    };
    const { data: row, error } = await context.supabase
      .from("communications")
      .insert(insertPayload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "create",
      entity_type: "communication",
      entity_id: row!.id,
      metadata: {
        parent_entity_type: data.entity_type,
        parent_entity_id: data.entity_id,
        kind: data.kind,
        direction: data.direction,
        has_attachments: (data.attachments?.length ?? 0) > 0,
      },
      old_values: null,
      new_values: row,
    });
    return { ok: true, id: row!.id };
  });

const UpdateInput = z.object({
  id: z.string().uuid(),
  subject: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  kind: z.enum(KINDS).optional(),
  direction: z.enum(DIRECTIONS).optional(),
  occurred_at: z.string().optional(),
  follow_up_at: z.string().nullable().optional(),
  follow_up_done: z.boolean().optional(),
  attachments: z.array(AttachmentSchema).optional(),
});

export const updateCommunication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v) => UpdateInput.parse(v))
  .handler(async ({ context, data }) => {
    const { id, ...patch } = data;
    const { data: prev } = await context.supabase
      .from("communications")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    const { error } = await context.supabase.from("communications").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "update",
      entity_type: "communication",
      entity_id: id,
      metadata: { fields: Object.keys(patch) },
      old_values: prev ?? null,
      new_values: patch,
    });
    return { ok: true };
  });

export const deleteCommunication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { data: prev } = await context.supabase
      .from("communications")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("communications").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "delete",
      entity_type: "communication",
      entity_id: data.id,
      metadata: {},
      old_values: prev ?? null,
      new_values: null,
    });
    return { ok: true };
  });

/* ============ Center: cross-entity list + filters ============ */

const CenterFilter = z.object({
  entity_type: z.enum(ENTITY_TYPES).nullable().optional(),
  entity_id: z.string().uuid().nullable().optional(),
  kind: z.enum(KINDS).nullable().optional(),
  direction: z.enum(DIRECTIONS).nullable().optional(),
  from: z.string().nullable().optional(),
  to: z.string().nullable().optional(),
  only_follow_ups: z.boolean().optional(),
  q: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export type CommunicationRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  kind: string;
  direction: string;
  subject: string | null;
  body: string | null;
  occurred_at: string;
  follow_up_at: string | null;
  follow_up_done: boolean;
  attachments: CommAttachment[];
  contact_name: string | null;
  contact_email: string | null;
  entity_label: string | null;
};

export const listCommunicationsCenter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((v) => CenterFilter.parse(v ?? {}))
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("communications")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(data.limit ?? 200);

    if (data.entity_type) q = q.eq("entity_type", data.entity_type);
    if (data.entity_id) q = q.eq("entity_id", data.entity_id);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.direction) q = q.eq("direction", data.direction);
    if (data.from) q = q.gte("occurred_at", data.from);
    if (data.to) q = q.lte("occurred_at", data.to);
    if (data.only_follow_ups) q = q.not("follow_up_at", "is", null).eq("follow_up_done", false);
    if (data.q && data.q.trim()) {
      const needle = `%${data.q.trim()}%`;
      q = q.or(
        `subject.ilike.${needle},body.ilike.${needle},contact_name.ilike.${needle},contact_email.ilike.${needle}`,
      );
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as any[];

    // Resolve entity labels in a few grouped lookups.
    const byType = new Map<string, Set<string>>();
    for (const r of list) {
      if (!byType.has(r.entity_type)) byType.set(r.entity_type, new Set());
      byType.get(r.entity_type)!.add(r.entity_id);
    }
    const labels = new Map<string, string>();
    const key = (t: string, id: string) => `${t}:${id}`;

    for (const [t, idSet] of byType) {
      const ids = Array.from(idSet);
      if (ids.length === 0) continue;
      if (t === "customer") {
        const { data } = await context.supabase
          .from("customers")
          .select("id, name, contact_person")
          .in("id", ids);
        for (const r of data ?? [])
          labels.set(key(t, r.id), r.name || r.contact_person || "Customer");
      } else if (t === "lead") {
        const { data } = await context.supabase
          .from("project_inquiries")
          .select("id, name, company")
          .in("id", ids);
        for (const r of data ?? []) labels.set(key(t, r.id), r.company || r.name || "Lead");
      } else if (t === "project") {
        const { data } = await context.supabase
          .from("projects")
          .select("id, project_name")
          .in("id", ids);
        for (const r of data ?? []) labels.set(key(t, r.id), r.project_name || "Project");
      } else if (t === "partner") {
        const { data } = await context.supabase
          .from("partners")
          .select("id, company_name")
          .in("id", ids);
        for (const r of data ?? []) labels.set(key(t, r.id), r.company_name);
      } else if (t === "order") {
        const { data } = await context.supabase
          .from("orders")
          .select("id, order_number")
          .in("id", ids);
        for (const r of data ?? []) labels.set(key(t, r.id), r.order_number || "Order");
      } else if (t === "invoice") {
        const { data } = await context.supabase
          .from("invoices")
          .select("id, invoice_number")
          .in("id", ids);
        for (const r of data ?? []) labels.set(key(t, r.id), r.invoice_number || "Invoice");
      } else if (t === "quotation") {
        const { data } = await context.supabase
          .from("quotations")
          .select("id, quotation_number")
          .in("id", ids);
        for (const r of data ?? []) labels.set(key(t, r.id), r.quotation_number || "Quotation");
      } else if (t === "shipment") {
        const { data } = await context.supabase
          .from("shipments")
          .select("id, shipment_number, tracking_no")
          .in("id", ids);
        for (const r of data ?? [])
          labels.set(key(t, r.id), r.shipment_number || r.tracking_no || "Shipment");
      }
    }

    const enriched: CommunicationRow[] = list.map((r) => ({
      id: r.id,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      kind: r.kind,
      direction: r.direction,
      subject: r.subject,
      body: r.body,
      occurred_at: r.occurred_at,
      follow_up_at: r.follow_up_at,
      follow_up_done: r.follow_up_done,
      attachments: Array.isArray(r.attachments) ? (r.attachments as CommAttachment[]) : [],
      contact_name: r.contact_name,
      contact_email: r.contact_email,
      entity_label: labels.get(key(r.entity_type, r.entity_id)) ?? null,
    }));
    return enriched;
  });

/* ============ Lookup helpers for filters ============ */

export const listCommsCustomersLite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("customers")
      .select("id, name, contact_person")
      .order("name", { ascending: true })
      .limit(1000);
    return (data ?? []).map((c) => ({
      id: c.id,
      label: c.name || c.contact_person || "Customer",
    }));
  });

export const listCommsLeadsLite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("project_inquiries")
      .select("id, name, company")
      .order("created_at", { ascending: false })
      .limit(1000);
    return (data ?? []).map((c) => ({
      id: c.id,
      label: c.company || c.name || "Lead",
    }));
  });

export const listCommsProjectsLite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("projects")
      .select("id, project_name")
      .order("created_at", { ascending: false })
      .limit(1000);
    return (data ?? []).map((c) => ({
      id: c.id,
      label: c.project_name || "Project",
    }));
  });

/* ============ Attachments (signed URLs) ============ */

export const getCommAttachmentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v) => z.object({ path: z.string().min(1) }).parse(v))
  .handler(async ({ context, data }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("crm-docs")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
