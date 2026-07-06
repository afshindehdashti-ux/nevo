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
