import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const DocType = z.enum([
  "quotation",
  "proforma_invoice",
  "commercial_invoice",
  "purchase_order",
  "commission_invoice",
]);

const DocStatus = z.enum([
  "draft",
  "pending_approval",
  "approved",
  "issued",
  "sent",
  "partially_paid",
  "paid",
  "overdue",
  "converted",
  "cancelled",
  "void",
]);

const ItemInput = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid().nullable().optional(),
  item_code: z.string().nullable().optional(),
  description: z.string().min(1),
  hs_code: z.string().nullable().optional(),
  quantity: z.number().positive(),
  unit: z.string().nullable().optional(),
  unit_price: z.number().min(0),
  discount_percent: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
  tax_percent: z.number().min(0).max(100).optional(),
  sort_order: z.number().int().optional(),
});

const DocumentInput = z.object({
  id: z.string().uuid().optional(),
  document_type: DocType,
  customer_id: z.string().uuid().nullable().optional(),
  supplier_id: z.string().uuid().nullable().optional(),
  partner_id: z.string().uuid().nullable().optional(),
  source_document_id: z.string().uuid().nullable().optional(),
  issue_date: z.string().optional(),
  valid_until: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  currency: z.string().max(8).optional(),
  incoterms: z.string().nullable().optional(),
  payment_terms: z.string().nullable().optional(),
  delivery_terms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  internal_notes: z.string().nullable().optional(),
  status: DocStatus.optional(),
  items: z.array(ItemInput).optional(),
});

export const listFinanceDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { document_type?: string; status?: string; limit?: number } | undefined) => v ?? {})
  .handler(async ({ data, context }) => {
    let q: any = context.supabase
      .from("finance_documents")
      .select(
        "id, document_type, document_number, status, issue_date, valid_until, due_date, currency, subtotal, discount_total, tax_total, shipping_total, grand_total, amount_paid, balance, customer_id, supplier_id, partner_id, source_document_id, created_at, updated_at, customers(company_name, name, email), suppliers(name, email), finance_document_items(count)"
      )
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.document_type) q = q.eq("document_type", data.document_type);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as any[];
  });

export const getFinanceDocument = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string }) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: doc, error } = await context.supabase
      .from("finance_documents")
      .select(
        "*, customers(id, company_name, name, email, phone, address_line1, country), suppliers(id, name, email, phone), partners(id, company_name), finance_document_items(*)"
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc) throw new Error("Document not found");
    return doc;
  });

async function ensureCounterparty(input: z.infer<typeof DocumentInput>) {
  if (input.document_type === "purchase_order") {
    if (!input.supplier_id) throw new Error("Purchase orders require a supplier");
  } else if (input.document_type === "commission_invoice") {
    if (!input.partner_id) throw new Error("Commission invoices require a partner");
  } else {
    if (!input.customer_id) throw new Error("This document requires a customer");
  }
}

export const upsertFinanceDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => DocumentInput.parse(v))
  .handler(async ({ data, context }) => {
    await ensureCounterparty(data);
    const { items, id, ...header } = data;
    const payload: any = { ...header, updated_by: context.userId };
    let docId = id;
    if (id) {
      const { error } = await (context.supabase.from("finance_documents") as any).update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      payload.created_by = context.userId;
      const { data: ins, error } = await (context.supabase.from("finance_documents") as any)
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      docId = ins.id;
    }

    if (items) {
      const { error: delErr } = await context.supabase
        .from("finance_document_items")
        .delete()
        .eq("document_id", docId!);
      if (delErr) throw new Error(delErr.message);
      if (items.length) {
        const rows = items.map((it, idx) => ({
          document_id: docId!,
          product_id: it.product_id ?? null,
          item_code: it.item_code ?? null,
          description: it.description,
          hs_code: it.hs_code ?? null,
          quantity: it.quantity,
          unit: it.unit ?? null,
          unit_price: it.unit_price,
          discount_percent: it.discount_percent ?? 0,
          discount_amount: it.discount_amount ?? 0,
          tax_percent: it.tax_percent ?? 0,
          sort_order: it.sort_order ?? idx,
        }));
        const { error: insErr } = await (context.supabase.from("finance_document_items") as any).insert(rows);
        if (insErr) throw new Error(insErr.message);
      }
    }
    return { id: docId! };
  });

export const addFinanceDocumentItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ document_id: z.string().uuid(), item: ItemInput }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("finance_document_items")
      .insert({
        document_id: data.document_id,
        product_id: data.item.product_id ?? null,
        item_code: data.item.item_code ?? null,
        description: data.item.description,
        hs_code: data.item.hs_code ?? null,
        quantity: data.item.quantity,
        unit: data.item.unit ?? null,
        unit_price: data.item.unit_price,
        discount_percent: data.item.discount_percent ?? 0,
        discount_amount: data.item.discount_amount ?? 0,
        tax_percent: data.item.tax_percent ?? 0,
        sort_order: data.item.sort_order ?? 0,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const removeFinanceDocumentItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("finance_document_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const changeFinanceDocumentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ id: z.string().uuid(), status: DocStatus }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { data: doc, error: fErr } = await context.supabase
      .from("finance_documents")
      .select("id, document_type, grand_total, customer_id, supplier_id, partner_id")
      .eq("id", data.id)
      .maybeSingle();
    if (fErr) throw new Error(fErr.message);
    if (!doc) throw new Error("Document not found");

    // Guardrails: cannot issue/send zero-total docs, must have counterparty
    if (["issued", "sent", "approved"].includes(data.status)) {
      if (Number(doc.grand_total) <= 0) {
        throw new Error("Cannot issue a document with a zero total");
      }
      const needsCustomer = ["quotation", "proforma_invoice", "commercial_invoice"].includes(
        doc.document_type
      );
      if (needsCustomer && !doc.customer_id) throw new Error("Missing customer");
      if (doc.document_type === "purchase_order" && !doc.supplier_id) throw new Error("Missing supplier");
      if (doc.document_type === "commission_invoice" && !doc.partner_id) throw new Error("Missing partner");
    }

    const { error } = await context.supabase
      .from("finance_documents")
      .update({ status: data.status, updated_by: context.userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const CONVERSION_MAP: Record<string, string[]> = {
  quotation: ["proforma_invoice", "commercial_invoice"],
  proforma_invoice: ["commercial_invoice"],
};

export const convertFinanceDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ id: z.string().uuid(), target_type: DocType }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { data: src, error } = await context.supabase
      .from("finance_documents")
      .select("*, finance_document_items(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!src) throw new Error("Source document not found");
    const allowed = CONVERSION_MAP[src.document_type] ?? [];
    if (!allowed.includes(data.target_type)) {
      throw new Error(`Cannot convert ${src.document_type} to ${data.target_type}`);
    }

    const { data: newDoc, error: insErr } = await context.supabase
      .from("finance_documents")
      .insert({
        document_type: data.target_type,
        status: "draft",
        customer_id: src.customer_id,
        supplier_id: src.supplier_id,
        partner_id: src.partner_id,
        source_document_id: src.id,
        currency: src.currency,
        incoterms: src.incoterms,
        payment_terms: src.payment_terms,
        delivery_terms: src.delivery_terms,
        notes: src.notes,
        created_by: context.userId,
        updated_by: context.userId,
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);

    const items = (src.finance_document_items ?? []) as Array<Record<string, unknown>>;
    if (items.length) {
      const rows = items.map((it) => ({
        document_id: newDoc.id,
        product_id: it.product_id ?? null,
        item_code: it.item_code ?? null,
        description: it.description,
        hs_code: it.hs_code ?? null,
        quantity: it.quantity,
        unit: it.unit ?? null,
        unit_price: it.unit_price,
        discount_percent: it.discount_percent ?? 0,
        discount_amount: it.discount_amount ?? 0,
        tax_percent: it.tax_percent ?? 0,
        sort_order: it.sort_order ?? 0,
      }));
      const { error: itemsErr } = await (context.supabase
        .from("finance_document_items") as any)
        .insert(rows);
      if (itemsErr) throw new Error(itemsErr.message);
    }

    await context.supabase
      .from("finance_documents")
      .update({ status: "converted", updated_by: context.userId })
      .eq("id", src.id);

    return { id: newDoc.id };
  });

export const deleteFinanceDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("finance_documents")
      .select("status")
      .eq("id", data.id)
      .maybeSingle();
    if (doc && !["draft", "cancelled", "void"].includes(doc.status)) {
      throw new Error("Only draft, cancelled, or void documents can be deleted");
    }
    const { error } = await context.supabase.from("finance_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
