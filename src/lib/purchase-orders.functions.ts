import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { writeAudit } from "./audit-log";

/**
 * Phase 2 CRUD server functions for purchase orders.
 * `orders` + `order_items` have no item-level math trigger; totals computed here.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

const IdInput = z.object({ id: z.string().uuid() });

const HeaderInput = z.object({
  customer_id: z.string().uuid(),
  status: z
    .enum([
      "draft",
      "confirmed",
      "in_production",
      "ready_to_ship",
      "shipped",
      "delivered",
      "cancelled",
    ])
    .optional(),
  order_date: z.string().optional(),
  requested_delivery: z.string().nullable().optional(),
  currency: z.string().max(8).default("USD"),
  incoterm: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const ItemInput = z.object({
  id: z.string().uuid().optional(),
  order_id: z.string().uuid().optional(),
  product_id: z.string().uuid().nullable().optional(),
  description: z.string().min(1),
  quantity: z.number().default(1),
  unit: z.string().default("pcs"),
  unit_price: z.number().default(0),
  discount_pct: z.number().min(0).max(100).default(0),
  vat_pct: z.number().min(0).max(100).default(0),
  position: z.number().int().default(0),
});

function itemLineTotal(it: {
  quantity: number;
  unit_price: number;
  discount_pct: number;
  vat_pct: number;
}) {
  const gross = it.quantity * it.unit_price;
  const taxable = gross * (1 - it.discount_pct / 100);
  return round2(taxable * (1 + it.vat_pct / 100));
}

export const listPurchaseOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select(
        "id, order_number, status, currency, subtotal, vat_amount, total, customer_id, customers(name, company_name), order_date, requested_delivery, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getPurchaseOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    const { data: header, error } = await context.supabase
      .from("orders")
      .select("*, customers(name, company_name, email)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!header) throw new Error("Order not found");
    const { data: items, error: iErr } = await context.supabase
      .from("order_items")
      .select("*")
      .eq("order_id", data.id)
      .order("position", { ascending: true });
    if (iErr) throw new Error(iErr.message);
    return { header, items: items ?? [] };
  });

async function recalcPurchaseOrderTotalsInternal(supabase: any, id: string) {
  const { data: items, error } = await supabase
    .from("order_items")
    .select("quantity, unit_price, discount_pct, vat_pct")
    .eq("order_id", id);
  if (error) throw new Error(error.message);
  let subtotal = 0;
  let taxTotal = 0;
  for (const it of items ?? []) {
    const gross = Number(it.quantity) * Number(it.unit_price);
    const taxable = gross * (1 - Number(it.discount_pct) / 100);
    subtotal += taxable;
    taxTotal += taxable * Number(it.vat_pct) / 100;
  }
  subtotal = round2(subtotal);
  taxTotal = round2(taxTotal);
  const total = round2(subtotal + taxTotal);
  const { error: upErr } = await supabase
    .from("orders")
    .update({
      subtotal,
      vat_amount: taxTotal,
      total,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (upErr) throw new Error(upErr.message);
  return { subtotal, vat_amount: taxTotal, total };
}

export const recalcPurchaseOrderTotals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => recalcPurchaseOrderTotalsInternal(context.supabase, data.id));

export const createPurchaseOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ header: HeaderInput, items: z.array(ItemInput).default([]) }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const { data: inserted, error } = await context.supabase
      .from("orders")
      .insert({
        customer_id: data.header.customer_id,
        status: data.header.status ?? "draft",
        order_date: data.header.order_date ?? new Date().toISOString().slice(0, 10),
        requested_delivery: data.header.requested_delivery ?? null,
        currency: data.header.currency,
        incoterm: data.header.incoterm ?? null,
        notes: data.header.notes ?? null,
        created_by: context.userId,
        updated_by: context.userId,
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!inserted?.id) throw new Error("Could not create order");

    if (data.items.length) {
      const rows = data.items.map((it, idx) => ({
        order_id: inserted.id,
        product_id: it.product_id ?? null,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        discount_pct: it.discount_pct,
        vat_pct: it.vat_pct,
        line_total: itemLineTotal(it),
        position: it.position ?? idx,
      }));
      const { error: iErr } = await context.supabase.from("order_items").insert(rows);
      if (iErr) {
        await context.supabase.from("orders").delete().eq("id", inserted.id);
        throw new Error(iErr.message);
      }
    }

    await recalcPurchaseOrderTotalsInternal(context.supabase, inserted.id);

    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "create",
      entity_type: "purchase_order",
      entity_id: inserted.id,
      metadata: { items: data.items.length, currency: data.header.currency },
      old_values: null,
      new_values: { header: data.header, items: data.items },
    });
    return { id: inserted.id };
  });

export const updatePurchaseOrderHeader = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ id: z.string().uuid(), patch: HeaderInput.partial() }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const { data: prev } = await context.supabase
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase
      .from("orders")
      .update({ ...data.patch, updated_at: new Date().toISOString(), updated_by: context.userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "update_header",
      entity_type: "purchase_order",
      entity_id: data.id,
      metadata: { fields: Object.keys(data.patch) },
      old_values: prev ?? null,
      new_values: data.patch,
    });
    return { ok: true };
  });

export const addPurchaseOrderItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => ItemInput.extend({ order_id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const insertPayload = {
      order_id: data.order_id,
      product_id: data.product_id ?? null,
      description: data.description,
      quantity: data.quantity,
      unit: data.unit,
      unit_price: data.unit_price,
      discount_pct: data.discount_pct,
      vat_pct: data.vat_pct,
      line_total: itemLineTotal(data),
      position: data.position,
    };
    const { error } = await context.supabase.from("order_items").insert(insertPayload);
    if (error) throw new Error(error.message);
    await recalcPurchaseOrderTotalsInternal(context.supabase, data.order_id);
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "add_item",
      entity_type: "purchase_order",
      entity_id: data.order_id,
      metadata: { description: data.description, quantity: data.quantity },
      old_values: null,
      new_values: insertPayload,
    });
    return { ok: true };
  });

export const updatePurchaseOrderItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ id: z.string().uuid(), patch: ItemInput.partial() }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const patch: Record<string, unknown> = { ...data.patch };
    const { data: prev } = await context.supabase
      .from("order_items")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (["quantity", "unit_price", "discount_pct", "vat_pct"].some((k) => k in data.patch)) {
      const merged = {
        quantity: Number(data.patch.quantity ?? prev?.quantity ?? 0),
        unit_price: Number(data.patch.unit_price ?? prev?.unit_price ?? 0),
        discount_pct: Number(data.patch.discount_pct ?? prev?.discount_pct ?? 0),
        vat_pct: Number(data.patch.vat_pct ?? prev?.vat_pct ?? 0),
      };
      patch.line_total = itemLineTotal(merged);
    }
    const { data: row, error } = await context.supabase
      .from("order_items")
      .update(patch as never)
      .eq("id", data.id)
      .select("order_id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (row?.order_id) {
      await recalcPurchaseOrderTotalsInternal(context.supabase, row.order_id);
      await writeAudit(context.supabase, {
        user_id: context.userId,
        action: "update_item",
        entity_type: "purchase_order",
        entity_id: row.order_id,
        metadata: { item_id: data.id, fields: Object.keys(data.patch) },
        old_values: prev ?? null,
        new_values: patch,
      });
    }
    return { ok: true };
  });

export const removePurchaseOrderItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("order_items")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("order_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (row?.order_id) {
      await recalcPurchaseOrderTotalsInternal(context.supabase, row.order_id);
      await writeAudit(context.supabase, {
        user_id: context.userId,
        action: "remove_item",
        entity_type: "purchase_order",
        entity_id: row.order_id,
        metadata: { item_id: data.id },
        old_values: row ?? null,
        new_values: null,
      });
    }
    return { ok: true };
  });

export const savePurchaseOrder = createServerFn({ method: "POST" })
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
    const { data: prevHeader } = await context.supabase
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    const { data: prevItems } = await context.supabase
      .from("order_items")
      .select("*")
      .eq("order_id", data.id);
    if (Object.keys(data.header).length) {
      const { error } = await context.supabase
        .from("orders")
        .update({ ...data.header, updated_at: new Date().toISOString(), updated_by: context.userId })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    const kept = data.items.filter((i) => i.id).map((i) => i.id!) as string[];
    let del = context.supabase.from("order_items").delete().eq("order_id", data.id);
    if (kept.length) del = del.not("id", "in", `(${kept.join(",")})`);
    const { error: dErr } = await del;
    if (dErr) throw new Error(dErr.message);
    for (let idx = 0; idx < data.items.length; idx++) {
      const it = data.items[idx];
      const payload = {
        order_id: data.id,
        product_id: it.product_id ?? null,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unit_price: it.unit_price,
        discount_pct: it.discount_pct,
        vat_pct: it.vat_pct,
        line_total: itemLineTotal(it),
        position: it.position ?? idx,
      };
      if (it.id) {
        const { error } = await context.supabase
          .from("order_items")
          .update(payload)
          .eq("id", it.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await context.supabase.from("order_items").insert(payload);
        if (error) throw new Error(error.message);
      }
    }
    const totals = await recalcPurchaseOrderTotalsInternal(context.supabase, data.id);
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "save",
      entity_type: "purchase_order",
      entity_id: data.id,
      metadata: {
        header_fields: Object.keys(data.header),
        item_count: data.items.length,
        total: totals.total,
      },
      old_values: { header: prevHeader ?? null, items: prevItems ?? [] },
      new_values: { header: data.header, items: data.items, totals },
    });
    return totals;
  });

export const deletePurchaseOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    const { data: prevHeader } = await context.supabase
      .from("orders")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    const { data: prevItems } = await context.supabase
      .from("order_items")
      .select("*")
      .eq("order_id", data.id);
    await context.supabase.from("order_items").delete().eq("order_id", data.id);
    const { error } = await context.supabase.from("orders").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "delete",
      entity_type: "purchase_order",
      entity_id: data.id,
      metadata: {},
      old_values: { header: prevHeader ?? null, items: prevItems ?? [] },
      new_values: null,
    });
    return { ok: true };
  });

