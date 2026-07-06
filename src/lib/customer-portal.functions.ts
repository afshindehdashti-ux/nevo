import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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
    return { customer: customers?.[0] ?? null, allCustomers: customers ?? [] };
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
      .select("id, entity_type, entity_id, kind, file_name, mime_type, size_bytes, created_at, file_path")
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
      .select("id, entity_type, entity_id, kind, direction, subject, body, occurred_at, contact_name")
      .or(filters.join(","))
      .order("occurred_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
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
      admin.from("orders").select("id, order_number, status, order_date, created_at")
        .eq("customer_id", data.customer_id).order("created_at", { ascending: false }).limit(50),
      admin.from("invoices").select("id, invoice_number, type, status, issue_date, total, currency, created_at")
        .eq("customer_id", data.customer_id).order("created_at", { ascending: false }).limit(50),
      admin.from("orders").select("id").eq("customer_id", data.customer_id),
    ]);

    const orderIds = (shipmentsRes.data ?? []).map((o) => o.id);
    const [shipRows, payRows, msgRows] = await Promise.all([
      orderIds.length
        ? admin.from("shipments").select("id, shipment_number, status, shipped_at, delivered_at, created_at")
            .in("order_id", orderIds).order("created_at", { ascending: false }).limit(50)
        : Promise.resolve({ data: [] as Array<{ id: string; shipment_number: string; status: string; shipped_at: string | null; delivered_at: string | null; created_at: string }>, error: null }),
      (async () => {
        const invIds = (invoicesRes.data ?? []).map((i) => i.id);
        if (!invIds.length) return { data: [] as Array<{ id: string; amount: number; currency: string; received_at: string; invoice_id: string }>, error: null };
        return admin.from("payments").select("id, amount, currency, received_at, invoice_id")
          .in("invoice_id", invIds).order("received_at", { ascending: false }).limit(50);
      })(),
      admin.from("communications")
        .select("id, subject, kind, direction, occurred_at")
        .eq("entity_type", "customer").eq("entity_id", data.customer_id)
        .order("occurred_at", { ascending: false }).limit(50),
    ]);

    const events: TimelineEvent[] = [];
    (ordersRes.data ?? []).forEach((o) => events.push({
      id: `o-${o.id}`, at: o.created_at, kind: "order",
      title: `Order ${o.order_number}`, detail: `Status: ${o.status}`,
    }));
    (invoicesRes.data ?? []).forEach((i) => events.push({
      id: `i-${i.id}`, at: i.created_at, kind: "invoice",
      title: `${i.type === "proforma" ? "Proforma" : "Invoice"} ${i.invoice_number}`,
      detail: `${i.status} · ${i.currency} ${Number(i.total).toLocaleString()}`,
    }));
    (shipRows.data ?? []).forEach((s) => events.push({
      id: `s-${s.id}`, at: s.delivered_at ?? s.shipped_at ?? s.created_at,
      kind: "shipment", title: `Shipment ${s.shipment_number}`, detail: `Status: ${s.status}`,
    }));
    (payRows.data ?? []).forEach((p) => events.push({
      id: `p-${p.id}`, at: p.received_at, kind: "payment",
      title: `Payment received`, detail: `${p.currency} ${Number(p.amount).toLocaleString()}`,
    }));
    (msgRows.data ?? []).forEach((m) => events.push({
      id: `m-${m.id}`, at: m.occurred_at, kind: "message",
      title: m.subject ?? `${m.kind} (${m.direction})`, detail: null,
    }));

    events.sort((a, b) => (a.at < b.at ? 1 : -1));
    return events.slice(0, 100);
  });

