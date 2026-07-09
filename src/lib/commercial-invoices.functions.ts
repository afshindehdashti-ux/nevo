import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Phase 2 CRUD server functions for commercial invoices.
 * `invoices` table has no item-level DB trigger; totals are recomputed here.
 * `recalc_invoice_totals` (DB trigger) fires on `payments` and reconciles
 * paid/balance/status — it does not touch subtotal/vat/total.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

const IdInput = z.object({ id: z.string().uuid() });

const HeaderInput = z.object({
  customer_id: z.string().uuid(),
  type: z.enum(["proforma", "commercial", "credit_note"]).default("commercial"),
  status: z
    .enum([
      "draft",
      "issued",
      "sent",
      "partially_paid",
      "paid",
      "overdue",
      "void",
      "cancelled",
    ])
    .optional(),
  order_id: z.string().uuid().nullable().optional(),
  proforma_invoice_id: z.string().uuid().nullable().optional(),
  issue_date: z.string().optional(),
  due_date: z.string().nullable().optional(),
  currency: z.string().max(8).default("USD"),
  payment_terms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const ItemInput = z.object({
  id: z.string().uuid().optional(),
  invoice_id: z.string().uuid().optional(),
  product_id: z.string().uuid().nullable().optional(),
  description: z.string().min(1),
  quantity: z.number().default(1),
  unit: z.string().default("pcs"),
  unit_price: z.number().default(0),
  discount: z.number().min(0).max(100).default(0),
  tax_rate: z.number().min(0).max(100).default(0),
  sort_order: z.number().int().default(0),
});

function itemLineTotal(it: {
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
}) {
  const gross = it.quantity * it.unit_price;
  const taxable = gross * (1 - it.discount / 100);
  return round2(taxable * (1 + it.tax_rate / 100));
}

export const listCommercialInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("invoices")
      .select(
        "id, invoice_number, type, status, currency, subtotal, vat_amount, total, amount_paid, balance, customer_id, customers(name, company_name), issue_date, due_date, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getCommercialInvoice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    const { data: header, error } = await context.supabase
      .from("invoices")
      .select("*, customers(name, company_name, email)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!header) throw new Error("Invoice not found");
    const { data: items, error: iErr } = await context.supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", data.id)
      .order("sort_order", { ascending: true });
    if (iErr) throw new Error(iErr.message);
    return { header, items: items ?? [] };
  });

async function recalcCommercialInvoiceTotalsInternal(supabase: any, id: string) {
  const { data: items, error } = await supabase
    .from("invoice_items")
    .select("quantity, unit_price, discount, tax_rate")
    .eq("invoice_id", id);
  if (error) throw new Error(error.message);
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  for (const it of items ?? []) {
    const gross = Number(it.quantity) * Number(it.unit_price);
    const discAmt = gross * Number(it.discount) / 100;
    const taxable = gross - discAmt;
    subtotal += taxable;
    discountTotal += discAmt;
    taxTotal += taxable * Number(it.tax_rate) / 100;
  }
  subtotal = round2(subtotal);
  discountTotal = round2(discountTotal);
  taxTotal = round2(taxTotal);
  const total = round2(subtotal + taxTotal);
  const { data: paidRow } = await supabase
    .from("invoices")
    .select("amount_paid")
    .eq("id", id)
    .maybeSingle();
  const paid = Number(paidRow?.amount_paid ?? 0);
  const { error: upErr } = await supabase
    .from("invoices")
    .update({
      subtotal,
      discount_total: discountTotal,
      tax_total: taxTotal,
      vat_amount: taxTotal,
      total,
      balance: round2(Math.max(total - paid, 0)),
      updated_at: new Date().toISOString(),
      updated_by: null,
    })
    .eq("id", id);
  if (upErr) throw new Error(upErr.message);
  return { subtotal, discount_total: discountTotal, tax_total: taxTotal, vat_amount: taxTotal, total };
}

export const recalcCommercialInvoiceTotals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => recalcCommercialInvoiceTotalsInternal(context.supabase, data.id));

export const createCommercialInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ header: HeaderInput, items: z.array(ItemInput).default([]) }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const { data: inserted, error } = await context.supabase
      .from("invoices")
      .insert({
        customer_id: data.header.customer_id,
        type: data.header.type,
        status: data.header.status ?? "draft",
        order_id: data.header.order_id ?? null,
        proforma_invoice_id: data.header.proforma_invoice_id ?? null,
        issue_date: data.header.issue_date ?? new Date().toISOString().slice(0, 10),
        due_date: data.header.due_date ?? null,
        currency: data.header.currency,
        payment_terms: data.header.payment_terms ?? null,
        notes: data.header.notes ?? null,
        created_by: context.userId,
        updated_by: context.userId,
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!inserted?.id) throw new Error("Could not create invoice");

    if (data.items.length) {
      const rows = data.items.map((it, idx) => ({
        invoice_id: inserted.id,
        product_id: it.product_id ?? null,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        discount: it.discount,
        discount_pct: it.discount,
        tax_rate: it.tax_rate,
        vat_pct: it.tax_rate,
        line_total: itemLineTotal(it),
        sort_order: it.sort_order ?? idx,
        position: it.sort_order ?? idx,
      }));
      const { error: iErr } = await context.supabase.from("invoice_items").insert(rows);
      if (iErr) {
        await context.supabase.from("invoices").delete().eq("id", inserted.id);
        throw new Error(iErr.message);
      }
    }

    await recalcCommercialInvoiceTotalsInternal(context.supabase, inserted.id);

    try {
      await context.supabase.from("activity_logs").insert({
        user_id: context.userId,
        action: "create",
        entity_type: "invoice",
        entity_id: inserted.id,
        metadata: { items: data.items.length, currency: data.header.currency, type: data.header.type },
      });
    } catch (err) {
      console.warn("createCommercialInvoice activity log failed", err);
    }
    return { id: inserted.id };
  });

export const updateCommercialInvoiceHeader = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ id: z.string().uuid(), patch: HeaderInput.partial() }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("invoices")
      .update({ ...data.patch, updated_at: new Date().toISOString(), updated_by: context.userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addCommercialInvoiceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    ItemInput.extend({ invoice_id: z.string().uuid() }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("invoice_items").insert({
      invoice_id: data.invoice_id,
      product_id: data.product_id ?? null,
      description: data.description,
      quantity: data.quantity,
      unit: data.unit,
      unit_price: data.unit_price,
      discount: data.discount,
      discount_pct: data.discount,
      tax_rate: data.tax_rate,
      vat_pct: data.tax_rate,
      line_total: itemLineTotal(data),
      sort_order: data.sort_order,
      position: data.sort_order,
    });
    if (error) throw new Error(error.message);
    await recalcCommercialInvoiceTotalsInternal(context.supabase, data.invoice_id);
    return { ok: true };
  });

export const updateCommercialInvoiceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ id: z.string().uuid(), patch: ItemInput.partial() }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const patch: Record<string, unknown> = { ...data.patch };
    if (data.patch.discount !== undefined) patch.discount_pct = data.patch.discount;
    if (data.patch.tax_rate !== undefined) patch.vat_pct = data.patch.tax_rate;
    if (data.patch.sort_order !== undefined) patch.position = data.patch.sort_order;

    // recompute line_total when math fields change
    if (["quantity", "unit_price", "discount", "tax_rate"].some((k) => k in data.patch)) {
      const { data: current } = await context.supabase
        .from("invoice_items")
        .select("quantity, unit_price, discount, tax_rate")
        .eq("id", data.id)
        .maybeSingle();
      const merged = {
        quantity: Number(data.patch.quantity ?? current?.quantity ?? 0),
        unit_price: Number(data.patch.unit_price ?? current?.unit_price ?? 0),
        discount: Number(data.patch.discount ?? current?.discount ?? 0),
        tax_rate: Number(data.patch.tax_rate ?? current?.tax_rate ?? 0),
      };
      patch.line_total = itemLineTotal(merged);
    }

    const { data: row, error } = await context.supabase
      .from("invoice_items")
      .update(patch)
      .eq("id", data.id)
      .select("invoice_id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (row?.invoice_id) {
      await recalcCommercialInvoiceTotalsInternal(context.supabase, row.invoice_id);
    }
    return { ok: true };
  });

export const removeCommercialInvoiceItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("invoice_items")
      .select("invoice_id")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("invoice_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (row?.invoice_id) {
      await recalcCommercialInvoiceTotalsInternal(context.supabase, row.invoice_id);
    }
    return { ok: true };
  });

export const saveCommercialInvoice = createServerFn({ method: "POST" })
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
        .from("invoices")
        .update({ ...data.header, updated_at: new Date().toISOString(), updated_by: context.userId })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    const kept = data.items.filter((i) => i.id).map((i) => i.id!) as string[];
    let del = context.supabase.from("invoice_items").delete().eq("invoice_id", data.id);
    if (kept.length) del = del.not("id", "in", `(${kept.join(",")})`);
    const { error: dErr } = await del;
    if (dErr) throw new Error(dErr.message);

    for (let idx = 0; idx < data.items.length; idx++) {
      const it = data.items[idx];
      const payload = {
        invoice_id: data.id,
        product_id: it.product_id ?? null,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        discount: it.discount,
        discount_pct: it.discount,
        tax_rate: it.tax_rate,
        vat_pct: it.tax_rate,
        line_total: itemLineTotal(it),
        sort_order: it.sort_order ?? idx,
        position: it.sort_order ?? idx,
      };
      if (it.id) {
        const { error } = await context.supabase
          .from("invoice_items")
          .update(payload)
          .eq("id", it.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await context.supabase.from("invoice_items").insert(payload);
        if (error) throw new Error(error.message);
      }
    }
    return recalcCommercialInvoiceTotalsInternal(context.supabase, data.id);
  });

export const deleteCommercialInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    await context.supabase.from("invoice_items").delete().eq("invoice_id", data.id);
    const { error } = await context.supabase.from("invoices").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    try {
      await context.supabase.from("activity_logs").insert({
        user_id: context.userId,
        action: "delete",
        entity_type: "invoice",
        entity_id: data.id,
        metadata: {},
      });
    } catch (err) {
      console.warn("deleteCommercialInvoice activity log failed", err);
    }
    return { ok: true };
  });
