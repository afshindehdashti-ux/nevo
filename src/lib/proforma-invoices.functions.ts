import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Phase 2 CRUD server functions for proforma invoices.
 * Line totals are also computed by DB trigger `proforma_item_compute_line_total`
 * and totals by `recalc_proforma_totals`; the app-side recalc here is a
 * belt-and-braces path so all four document types share identical semantics.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

const IdInput = z.object({ id: z.string().uuid() });

const HeaderInput = z.object({
  customer_id: z.string().uuid(),
  currency: z.string().max(8).default("USD"),
  vat_rate: z.number().min(0).max(100).default(0),
  valid_until: z.string().nullable().optional(),
  payment_terms: z.string().nullable().optional(),
  delivery_terms: z.string().nullable().optional(),
  incoterms: z.string().nullable().optional(),
  terms_conditions: z.string().nullable().optional(),
  bank_details: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z
    .enum([
      "draft",
      "sent",
      "approved",
      "accepted",
      "rejected",
      "converted_to_invoice",
      "cancelled",
    ])
    .optional(),
  order_id: z.string().uuid().nullable().optional(),
  opportunity_id: z.string().uuid().nullable().optional(),
});

const ItemInput = z.object({
  id: z.string().uuid().optional(),
  proforma_invoice_id: z.string().uuid().optional(),
  product_id: z.string().uuid().nullable().optional(),
  item_code: z.string().nullable().optional(),
  description: z.string().min(1),
  quantity: z.number().default(1),
  unit: z.string().default("pcs"),
  unit_price: z.number().default(0),
  discount: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100).default(0),
  sort_order: z.number().int().default(0),
});

export const listProformaInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("proforma_invoices")
      .select(
        "id, proforma_number, status, currency, subtotal, vat_amount, grand_total, total, customer_id, customers(name, company_name), valid_until, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getProformaInvoice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    const { data: header, error } = await context.supabase
      .from("proforma_invoices")
      .select("*, customers(name, company_name, email)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!header) throw new Error("Proforma invoice not found");
    const { data: items, error: iErr } = await context.supabase
      .from("proforma_invoice_items")
      .select("*")
      .eq("proforma_invoice_id", data.id)
      .order("sort_order", { ascending: true });
    if (iErr) throw new Error(iErr.message);
    return { header, items: items ?? [] };
  });

async function recalcProformaTotalsInternal(supabase: any, id: string) {
  const { data: items, error } = await supabase
    .from("proforma_invoice_items")
    .select("line_total, quantity, unit_price, discount, discount_amount, tax_rate")
    .eq("proforma_invoice_id", id);
  if (error) throw new Error(error.message);
  const { data: header } = await supabase
    .from("proforma_invoices")
    .select("vat_rate")
    .eq("id", id)
    .maybeSingle();
  const vatRate = Number(header?.vat_rate ?? 0);
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  for (const it of items ?? []) {
    const gross = Number(it.quantity) * Number(it.unit_price);
    const discAmt =
      Number(it.discount_amount) > 0
        ? Number(it.discount_amount)
        : (gross * Number(it.discount)) / 100;
    const taxable = gross - discAmt;
    subtotal += taxable;
    discountTotal += discAmt;
    taxTotal += (taxable * Number(it.tax_rate)) / 100;
  }
  subtotal = round2(subtotal);
  discountTotal = round2(discountTotal);
  taxTotal = round2(taxTotal);
  const vatAmount = round2((subtotal * vatRate) / 100);
  const grand = round2(subtotal + Math.max(taxTotal, vatAmount));
  const { error: upErr } = await supabase
    .from("proforma_invoices")
    .update({
      subtotal,
      discount_total: discountTotal,
      discount_amount: discountTotal,
      tax_total: taxTotal,
      vat_amount: vatAmount,
      total: grand,
      grand_total: grand,
      balance_due: round2(grand - 0),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (upErr) throw new Error(upErr.message);
  return {
    subtotal,
    discount_total: discountTotal,
    tax_total: taxTotal,
    vat_amount: vatAmount,
    grand_total: grand,
  };
}

export const recalcProformaTotals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => recalcProformaTotalsInternal(context.supabase, data.id));

export const createProformaInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ header: HeaderInput, items: z.array(ItemInput).default([]) }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const { data: inserted, error } = await context.supabase
      .from("proforma_invoices")
      .insert({
        customer_id: data.header.customer_id,
        currency: data.header.currency,
        vat_rate: data.header.vat_rate,
        valid_until: data.header.valid_until ?? null,
        payment_terms: data.header.payment_terms ?? null,
        delivery_terms: data.header.delivery_terms ?? null,
        incoterms: data.header.incoterms ?? null,
        terms_conditions: data.header.terms_conditions ?? null,
        bank_details: data.header.bank_details ?? null,
        notes: data.header.notes ?? null,
        status: data.header.status ?? "draft",
        order_id: data.header.order_id ?? null,
        opportunity_id: data.header.opportunity_id ?? null,
        created_by: context.userId,
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!inserted?.id) throw new Error("Could not create proforma invoice");

    if (data.items.length) {
      const rows = data.items.map((it, idx) => ({
        proforma_invoice_id: inserted.id,
        product_id: it.product_id ?? null,
        item_code: it.item_code ?? null,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        discount: it.discount,
        discount_amount: it.discount_amount,
        tax_rate: it.tax_rate,
        sort_order: it.sort_order ?? idx,
      }));
      const { error: iErr } = await context.supabase.from("proforma_invoice_items").insert(rows);
      if (iErr) {
        await context.supabase.from("proforma_invoices").delete().eq("id", inserted.id);
        throw new Error(iErr.message);
      }
    }

    await recalcProformaTotalsInternal(context.supabase, inserted.id);

    try {
      await context.supabase.from("activity_logs").insert({
        user_id: context.userId,
        action: "create",
        entity_type: "proforma_invoice",
        entity_id: inserted.id,
        metadata: { items: data.items.length, currency: data.header.currency },
      });
    } catch (err) {
      console.warn("createProformaInvoice activity log failed", err);
    }
    return { id: inserted.id };
  });

export const updateProformaInvoiceHeader = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid(), patch: HeaderInput.partial() }).parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("proforma_invoices")
      .update({ ...data.patch, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (data.patch.vat_rate !== undefined) {
      await recalcProformaTotalsInternal(context.supabase, data.id);
    }
    return { ok: true };
  });

export const addProformaInvoiceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => ItemInput.extend({ proforma_invoice_id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("proforma_invoice_items").insert({
      proforma_invoice_id: data.proforma_invoice_id,
      product_id: data.product_id ?? null,
      item_code: data.item_code ?? null,
      description: data.description,
      quantity: data.quantity,
      unit: data.unit,
      unit_price: data.unit_price,
      discount: data.discount,
      discount_amount: data.discount_amount,
      tax_rate: data.tax_rate,
      sort_order: data.sort_order,
    });
    if (error) throw new Error(error.message);
    await recalcProformaTotalsInternal(context.supabase, data.proforma_invoice_id);
    return { ok: true };
  });

export const updateProformaInvoiceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid(), patch: ItemInput.partial() }).parse(v))
  .handler(async ({ context, data }) => {
    const { data: row, error: rErr } = await context.supabase
      .from("proforma_invoice_items")
      .update(data.patch)
      .eq("id", data.id)
      .select("proforma_invoice_id")
      .maybeSingle();
    if (rErr) throw new Error(rErr.message);
    if (row?.proforma_invoice_id) {
      await recalcProformaTotalsInternal(context.supabase, row.proforma_invoice_id);
    }
    return { ok: true };
  });

export const removeProformaInvoiceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("proforma_invoice_items")
      .select("proforma_invoice_id")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase
      .from("proforma_invoice_items")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (row?.proforma_invoice_id) {
      await recalcProformaTotalsInternal(context.supabase, row.proforma_invoice_id);
    }
    return { ok: true };
  });

export const saveProformaInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid(),
        header: HeaderInput.partial(),
        items: z.array(ItemInput),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    if (Object.keys(data.header).length) {
      const { error } = await context.supabase
        .from("proforma_invoices")
        .update({ ...data.header, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    const kept = data.items.filter((i) => i.id).map((i) => i.id!) as string[];
    let del = context.supabase
      .from("proforma_invoice_items")
      .delete()
      .eq("proforma_invoice_id", data.id);
    if (kept.length) del = del.not("id", "in", `(${kept.join(",")})`);
    const { error: dErr } = await del;
    if (dErr) throw new Error(dErr.message);
    for (let idx = 0; idx < data.items.length; idx++) {
      const it = data.items[idx];
      const payload = {
        proforma_invoice_id: data.id,
        product_id: it.product_id ?? null,
        item_code: it.item_code ?? null,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        discount: it.discount,
        discount_amount: it.discount_amount,
        tax_rate: it.tax_rate,
        sort_order: it.sort_order ?? idx,
      };
      if (it.id) {
        const { error } = await context.supabase
          .from("proforma_invoice_items")
          .update(payload)
          .eq("id", it.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await context.supabase.from("proforma_invoice_items").insert(payload);
        if (error) throw new Error(error.message);
      }
    }
    return recalcProformaTotalsInternal(context.supabase, data.id);
  });

export const deleteProformaInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    await context.supabase
      .from("proforma_invoice_items")
      .delete()
      .eq("proforma_invoice_id", data.id);
    const { error } = await context.supabase.from("proforma_invoices").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    try {
      await context.supabase.from("activity_logs").insert({
        user_id: context.userId,
        action: "delete",
        entity_type: "proforma_invoice",
        entity_id: data.id,
        metadata: {},
      });
    } catch (err) {
      console.warn("deleteProformaInvoice activity log failed", err);
    }
    return { ok: true };
  });
