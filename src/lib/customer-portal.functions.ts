import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { writeAudit } from "./audit-log";

/**
 * Returns the customer(s) the current signed-in user is linked to via customer_users.
 * Empty array means the user has not been linked to a customer yet.
 */
export const getMyCustomerContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: links, error: linkErr } = await context.supabase
      .from("customer_users")
      .select("customer_id")
      .eq("user_id", context.userId);
    if (linkErr) throw new Error(linkErr.message);
    const ids = (links ?? []).map((l) => l.customer_id);
    if (ids.length === 0) return { customer: null, allCustomers: [] };

    const { data: customers, error } = await context.supabase
      .from("customers")
      .select(
        "id, name, contact_person, email, phone, whatsapp, city, country, currency, payment_terms",
      )
      .in("id", ids);
    if (error) throw new Error(error.message);
    const primary = customers?.[0] ?? null;
    if (primary) {
      await writeAudit(context.supabase, {
        user_id: context.userId,
        action: "portal_access",
        entity_type: "customer",
        entity_id: primary.id,
        metadata: { portal: "customer", customer_count: customers?.length ?? 0 },
        old_values: null,
        new_values: null,
      });
    }
    return { customer: primary, allCustomers: customers ?? [] };
  });

const CustomerScoped = z.object({ customer_id: z.string().uuid() });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CustomerScoped.parse(v))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("orders")
      .select("id, order_number, status, order_date, requested_delivery, currency, total")
      .eq("customer_id", data.customer_id)
      .order("order_date", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getMyInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CustomerScoped.parse(v))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("invoices")
      .select(
        "id, invoice_number, type, status, issue_date, due_date, currency, total, amount_paid, balance",
      )
      .eq("customer_id", data.customer_id)
      .order("issue_date", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getMyShipments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CustomerScoped.parse(v))
  .handler(async ({ context, data }) => {
    // shipments live under orders → filter by orders.customer_id
    const { data: orders, error: oErr } = await context.supabase
      .from("orders")
      .select("id")
      .eq("customer_id", data.customer_id);
    if (oErr) throw new Error(oErr.message);
    const ids = (orders ?? []).map((o) => o.id);
    if (ids.length === 0) return [];
    const { data: rows, error } = await context.supabase
      .from("shipments")
      .select(
        "id, shipment_number, status, carrier, tracking_no, container_no, incoterm, shipped_at, delivered_at, order_id",
      )
      .in("order_id", ids)
      .order("shipped_at", { ascending: false, nullsFirst: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getMyQuotations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CustomerScoped.parse(v))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("quotations")
      .select("id, quotation_number, status, issue_date, valid_until, currency, total")
      .eq("customer_id", data.customer_id)
      .in("status", ["sent", "accepted", "converted"])
      .order("issue_date", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getMyDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CustomerScoped.parse(v))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("documents")
      .select(
        "id, entity_type, entity_id, kind, file_name, mime_type, size_bytes, created_at, file_path",
      )
      .eq("entity_type", "customer")
      .eq("entity_id", data.customer_id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getMyDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ document_id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { data: doc, error } = await context.supabase
      .from("documents")
      .select("file_path, file_name, entity_type, entity_id")
      .eq("id", data.document_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc) throw new Error("Document not found");

    const { data: signed, error: sErr } = await context.supabase.storage
      .from("documents-private")
      .createSignedUrl(doc.file_path, 300);
    if (sErr) throw new Error(sErr.message);
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "portal_document_access",
      entity_type: "document",
      entity_id: data.document_id,
      metadata: {
        portal: "customer",
        file_name: doc.file_name,
        entity_type: doc.entity_type,
        entity_id: doc.entity_id,
      },
      old_values: null,
      new_values: null,
    });
    return { url: signed?.signedUrl ?? null, file_name: doc.file_name };
  });

/**
 * Verify the caller is linked to `customer_id` via customer_users. Throws on mismatch.
 * Returns a service-role admin client used for scoped reads across tables whose RLS
 * does not currently grant customer_users direct access. All reads still filter by
 * `customer_id` (or a derived list) so the caller only ever sees their own data.
 */
async function verifyCustomerAccess(userId: string, customerId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("customer_users")
    .select("customer_id")
    .eq("user_id", userId)
    .eq("customer_id", customerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Not authorized for this customer");
  return supabaseAdmin;
}

export const getMyProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CustomerScoped.parse(v))
  .handler(async ({ context, data }) => {
    const admin = await verifyCustomerAccess(context.userId, data.customer_id);
    const { data: rows, error } = await admin
      .from("projects")
      .select("id, project_name, project_type, status, country, ai_summary, created_at, updated_at")
      .eq("customer_id", data.customer_id)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getMyPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CustomerScoped.parse(v))
  .handler(async ({ context, data }) => {
    const admin = await verifyCustomerAccess(context.userId, data.customer_id);
    const { data: invs, error: iErr } = await admin
      .from("invoices")
      .select("id, invoice_number")
      .eq("customer_id", data.customer_id);
    if (iErr) throw new Error(iErr.message);
    const list = invs ?? [];
    const ids = list.map((i) => i.id);
    if (ids.length === 0) return [];
    const numByInv = new Map(list.map((i) => [i.id, i.invoice_number]));
    const { data: rows, error } = await admin
      .from("payments")
      .select("id, invoice_id, amount, currency, method, reference, received_at, notes")
      .in("invoice_id", ids)
      .order("received_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((p) => ({ ...p, invoice_number: numByInv.get(p.invoice_id) ?? null }));
  });

export const getMyMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CustomerScoped.parse(v))
  .handler(async ({ context, data }) => {
    const admin = await verifyCustomerAccess(context.userId, data.customer_id);
    // Messages tied to the customer entity, plus any of the customer's projects/orders.
    const [projs, orders] = await Promise.all([
      admin.from("projects").select("id").eq("customer_id", data.customer_id),
      admin.from("orders").select("id").eq("customer_id", data.customer_id),
    ]);
    const projIds = (projs.data ?? []).map((r) => r.id);
    const orderIds = (orders.data ?? []).map((r) => r.id);

    const filters: string[] = [`and(entity_type.eq.customer,entity_id.eq.${data.customer_id})`];
    if (projIds.length)
      filters.push(`and(entity_type.eq.project,entity_id.in.(${projIds.join(",")}))`);
    if (orderIds.length)
      filters.push(`and(entity_type.eq.order,entity_id.in.(${orderIds.join(",")}))`);

    const { data: rows, error } = await admin
      .from("communications")
      .select(
        "id, entity_type, entity_id, kind, direction, subject, body, occurred_at, contact_name, attachments, thread_id, parent_id",
      )
      .or(filters.join(","))
      .order("occurred_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    const list = rows ?? [];
    const ids = list.map((r) => r.id);
    let readSet = new Set<string>();
    if (ids.length) {
      const { data: reads } = await admin
        .from("communication_reads")
        .select("message_id")
        .eq("user_id", context.userId)
        .in("message_id", ids);
      readSet = new Set((reads ?? []).map((r) => r.message_id as string));
    }
    return list.map((m) => ({
      ...m,
      read: m.direction === "inbound" ? true : readSet.has(m.id),
    }));
  });

export const markMyMessagesRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CustomerScoped.parse(v))
  .handler(async ({ context, data }) => {
    const admin = await verifyCustomerAccess(context.userId, data.customer_id);
    const [projs, orders] = await Promise.all([
      admin.from("projects").select("id").eq("customer_id", data.customer_id),
      admin.from("orders").select("id").eq("customer_id", data.customer_id),
    ]);
    const projIds = (projs.data ?? []).map((r) => r.id);
    const orderIds = (orders.data ?? []).map((r) => r.id);
    const filters: string[] = [`and(entity_type.eq.customer,entity_id.eq.${data.customer_id})`];
    if (projIds.length)
      filters.push(`and(entity_type.eq.project,entity_id.in.(${projIds.join(",")}))`);
    if (orderIds.length)
      filters.push(`and(entity_type.eq.order,entity_id.in.(${orderIds.join(",")}))`);

    const { data: outbound } = await admin
      .from("communications")
      .select("id")
      .eq("direction", "outbound")
      .or(filters.join(","))
      .limit(1000);
    const ids = (outbound ?? []).map((r) => r.id);
    if (!ids.length) return { marked: 0 };

    const { data: existing } = await admin
      .from("communication_reads")
      .select("message_id")
      .eq("user_id", context.userId)
      .in("message_id", ids);
    const already = new Set((existing ?? []).map((r) => r.message_id as string));
    const toInsert = ids
      .filter((id) => !already.has(id))
      .map((id) => ({ message_id: id, user_id: context.userId }));
    if (!toInsert.length) return { marked: 0 };
    const { error } = await admin.from("communication_reads").insert(toInsert);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "portal_mark_read",
      entity_type: "customer",
      entity_id: data.customer_id,
      metadata: { portal: "customer", marked: toInsert.length },
      old_values: null,
      new_values: { message_ids: ids.filter((id) => !already.has(id)) },
    });
    return { marked: toInsert.length };
  });

export type TimelineEvent = {
  id: string;
  at: string;
  kind: "order" | "invoice" | "payment" | "shipment" | "message" | "document";
  title: string;
  detail: string | null;
};

export const getMyTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CustomerScoped.parse(v))
  .handler(async ({ context, data }): Promise<TimelineEvent[]> => {
    const admin = await verifyCustomerAccess(context.userId, data.customer_id);

    const [ordersRes, invoicesRes, shipmentsRes] = await Promise.all([
      admin
        .from("orders")
        .select("id, order_number, status, order_date, created_at")
        .eq("customer_id", data.customer_id)
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("invoices")
        .select("id, invoice_number, type, status, issue_date, total, currency, created_at")
        .eq("customer_id", data.customer_id)
        .order("created_at", { ascending: false })
        .limit(50),
      admin.from("orders").select("id").eq("customer_id", data.customer_id),
    ]);

    const orderIds = (shipmentsRes.data ?? []).map((o) => o.id);
    const [shipRows, payRows, msgRows] = await Promise.all([
      orderIds.length
        ? admin
            .from("shipments")
            .select("id, shipment_number, status, shipped_at, delivered_at, created_at")
            .in("order_id", orderIds)
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({
            data: [] as Array<{
              id: string;
              shipment_number: string;
              status: string;
              shipped_at: string | null;
              delivered_at: string | null;
              created_at: string;
            }>,
            error: null,
          }),
      (async () => {
        const invIds = (invoicesRes.data ?? []).map((i) => i.id);
        if (!invIds.length)
          return {
            data: [] as Array<{
              id: string;
              amount: number;
              currency: string;
              received_at: string;
              invoice_id: string;
            }>,
            error: null,
          };
        return admin
          .from("payments")
          .select("id, amount, currency, received_at, invoice_id")
          .in("invoice_id", invIds)
          .order("received_at", { ascending: false })
          .limit(50);
      })(),
      admin
        .from("communications")
        .select("id, subject, kind, direction, occurred_at")
        .eq("entity_type", "customer")
        .eq("entity_id", data.customer_id)
        .order("occurred_at", { ascending: false })
        .limit(50),
    ]);

    const events: TimelineEvent[] = [];
    (ordersRes.data ?? []).forEach((o) =>
      events.push({
        id: `o-${o.id}`,
        at: o.created_at,
        kind: "order",
        title: `Order ${o.order_number}`,
        detail: `Status: ${o.status}`,
      }),
    );
    (invoicesRes.data ?? []).forEach((i) =>
      events.push({
        id: `i-${i.id}`,
        at: i.created_at,
        kind: "invoice",
        title: `${i.type === "proforma" ? "Proforma" : "Invoice"} ${i.invoice_number}`,
        detail: `${i.status} · ${i.currency} ${Number(i.total).toLocaleString()}`,
      }),
    );
    (shipRows.data ?? []).forEach((s) =>
      events.push({
        id: `s-${s.id}`,
        at: s.delivered_at ?? s.shipped_at ?? s.created_at,
        kind: "shipment",
        title: `Shipment ${s.shipment_number}`,
        detail: `Status: ${s.status}`,
      }),
    );
    (payRows.data ?? []).forEach((p) =>
      events.push({
        id: `p-${p.id}`,
        at: p.received_at,
        kind: "payment",
        title: `Payment received`,
        detail: `${p.currency} ${Number(p.amount).toLocaleString()}`,
      }),
    );
    (msgRows.data ?? []).forEach((m) =>
      events.push({
        id: `m-${m.id}`,
        at: m.occurred_at,
        kind: "message",
        title: m.subject ?? `${m.kind} (${m.direction})`,
        detail: null,
      }),
    );

    events.sort((a, b) => (a.at < b.at ? 1 : -1));
    return events.slice(0, 100);
  });

const MessageAttachmentInput = z.object({
  customer_id: z.string().uuid(),
  path: z.string().min(1),
});

export const getMyMessageAttachmentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => MessageAttachmentInput.parse(v))
  .handler(async ({ context, data }) => {
    const admin = await verifyCustomerAccess(context.userId, data.customer_id);
    // Scope: only allow paths under this customer's folder OR attachments referenced by
    // messages already visible to this customer.
    const ownedPrefix = `customer/${data.customer_id}/`;
    if (!data.path.startsWith(ownedPrefix)) {
      const { data: rows } = await admin
        .from("communications")
        .select("attachments")
        .eq("entity_type", "customer")
        .eq("entity_id", data.customer_id);
      const known = new Set<string>();
      for (const r of rows ?? []) {
        for (const a of (r.attachments as any[]) ?? []) if (a?.path) known.add(a.path);
      }
      if (!known.has(data.path)) throw new Error("Not authorized for this attachment");
    }
    const { data: signed, error } = await admin.storage
      .from("crm-docs")
      .createSignedUrl(data.path, 300);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "portal_attachment_access",
      entity_type: "customer",
      entity_id: data.customer_id,
      metadata: { portal: "customer", path: data.path },
      old_values: null,
      new_values: null,
    });
    return { url: signed?.signedUrl ?? null };
  });

const AttachmentInput = z.object({
  name: z.string().min(1).max(200),
  mime: z.string().optional(),
  base64: z.string().min(1),
});

const SendMessageInput = z.object({
  customer_id: z.string().uuid(),
  kind: z.enum(["note", "email", "whatsapp", "call", "meeting"]).default("email"),
  subject: z.string().max(300).nullable().optional(),
  body: z.string().min(1).max(20000),
  attachments: z.array(AttachmentInput).max(10).optional(),
  parent_id: z.string().uuid().nullable().optional(),
});

export const sendMyMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => SendMessageInput.parse(v))
  .handler(async ({ context, data }) => {
    const admin = await verifyCustomerAccess(context.userId, data.customer_id);

    const uploaded: Array<{ name: string; path: string; size: number; mime?: string }> = [];
    for (const a of data.attachments ?? []) {
      const bytes = Buffer.from(a.base64, "base64");
      if (bytes.byteLength > 15 * 1024 * 1024) {
        throw new Error(`Attachment ${a.name} exceeds 15 MB limit`);
      }
      const safe = a.name.replace(/[^\w.-]+/g, "_");
      const path = `customer/${data.customer_id}/messages/${crypto.randomUUID()}-${safe}`;
      const { error: upErr } = await admin.storage
        .from("crm-docs")
        .upload(path, bytes, { contentType: a.mime ?? "application/octet-stream", upsert: false });
      if (upErr) throw new Error(upErr.message);
      uploaded.push({ name: a.name, path, size: bytes.byteLength, mime: a.mime });
    }

    const { data: prof } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();

    let parentEntityType: string | null = null;
    let parentEntityId: string | null = null;
    let parentSubject: string | null = null;
    if (data.parent_id) {
      const { data: parent, error: pErr } = await admin
        .from("communications")
        .select("id, entity_type, entity_id, subject")
        .eq("id", data.parent_id)
        .maybeSingle();
      if (pErr) throw new Error(pErr.message);
      if (!parent) throw new Error("Parent message not found");
      // Verify the parent is visible to this customer via the same scoping used in getMyMessages
      const scoped =
        (parent.entity_type === "customer" && parent.entity_id === data.customer_id) ||
        (parent.entity_type === "project" &&
          (
            await admin
              .from("projects")
              .select("id")
              .eq("customer_id", data.customer_id)
              .eq("id", parent.entity_id)
              .maybeSingle()
          ).data) ||
        (parent.entity_type === "order" &&
          (
            await admin
              .from("orders")
              .select("id")
              .eq("customer_id", data.customer_id)
              .eq("id", parent.entity_id)
              .maybeSingle()
          ).data);
      if (!scoped) throw new Error("Not authorized to reply to this message");
      parentEntityType = parent.entity_type;
      parentEntityId = parent.entity_id;
      parentSubject = parent.subject;
    }

    const finalSubject =
      data.subject ??
      (parentSubject
        ? parentSubject.startsWith("Re:")
          ? parentSubject
          : `Re: ${parentSubject}`
        : null);

    const { data: row, error } = await admin
      .from("communications")
      .insert({
        entity_type: parentEntityType ?? "customer",
        entity_id: parentEntityId ?? data.customer_id,
        kind: data.kind,
        direction: "inbound",
        subject: finalSubject,
        body: data.body,
        attachments: uploaded,
        contact_name: prof?.full_name ?? null,
        user_id: context.userId,
        occurred_at: new Date().toISOString(),
        parent_id: data.parent_id ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "portal_send_message",
      entity_type: "communication",
      entity_id: row!.id,
      metadata: {
        portal: "customer",
        customer_id: data.customer_id,
        kind: data.kind,
        parent_id: data.parent_id ?? null,
        attachment_count: uploaded.length,
      },
      old_values: null,
      new_values: {
        entity_type: parentEntityType ?? "customer",
        entity_id: parentEntityId ?? data.customer_id,
        kind: data.kind,
        direction: "inbound",
        subject: finalSubject,
        body: data.body,
        attachments: uploaded,
        parent_id: data.parent_id ?? null,
      },
    });
    return { ok: true, id: row!.id };
  });
