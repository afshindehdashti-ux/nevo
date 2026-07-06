import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const IdInput = z.object({ id: z.string().uuid() });

const UpsertInput = z.object({
  id: z.string().uuid().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  inquiry_id: z.string().uuid().nullable().optional(),
  status: z
    .enum([
      "draft",
      "pending_approval",
      "approved",
      "sent",
      "accepted",
      "rejected",
      "expired",
      "converted",
      "void",
    ])
    .optional(),
  issue_date: z.string().optional(),
  valid_until: z.string().nullable().optional(),
  currency: z.string().max(8).optional(),
  vat_rate: z.number().min(0).max(100).optional(),
  terms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  internal_notes: z.string().nullable().optional(),
});

export const listQuotations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quotations")
      .select(
        "id, quotation_number, status, issue_date, valid_until, currency, total, customer_id, customers(name), created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getQuotation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    const [{ data: quotation, error: qErr }, { data: items, error: iErr }] = await Promise.all([
      context.supabase
        .from("quotations")
        .select("*, customers(id,name,email,city,country,currency)")
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", data.id)
        .order("position"),
    ]);
    if (qErr) throw new Error(qErr.message);
    if (iErr) throw new Error(iErr.message);
    if (!quotation) throw new Error("Quotation not found");
    return { quotation, items: items ?? [] };
  });

export const upsertQuotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => UpsertInput.parse(v))
  .handler(async ({ context, data }) => {
    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("quotations")
        .update(data)
        .eq("id", data.id)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return { id: updated?.id };
    }
    const { data: inserted, error } = await context.supabase
      .from("quotations")
      .insert(data)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { id: inserted?.id };
  });

const ItemInput = z.object({
  id: z.string().uuid().optional(),
  quotation_id: z.string().uuid(),
  position: z.number().int().default(1),
  description: z.string().min(1),
  quantity: z.number().default(1),
  unit: z.string().nullable().optional(),
  unit_price: z.number().default(0),
  discount_pct: z.number().default(0),
});

export const upsertQuotationItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => ItemInput.parse(v))
  .handler(async ({ context, data }) => {
    const line_total =
      data.quantity * data.unit_price * (1 - (data.discount_pct ?? 0) / 100);
    const payload = { ...data, line_total: Math.round(line_total * 100) / 100 };
    if (data.id) {
      const { error } = await context.supabase
        .from("quotation_items")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("quotation_items").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteQuotationItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("quotation_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setQuotationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "draft",
          "pending_approval",
          "approved",
          "sent",
          "accepted",
          "rejected",
          "expired",
          "converted",
          "void",
        ]),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const now = new Date().toISOString();
    const patch = {
      status: data.status,
      ...(data.status === "sent" ? { sent_at: now } : {}),
      ...(data.status === "accepted" ? { accepted_at: now } : {}),
    };
    const { error } = await context.supabase.from("quotations").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteQuotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IdInput.parse(v))
  .handler(async ({ context, data }) => {
    // delete items first (in case FK isn't cascade)
    await context.supabase.from("quotation_items").delete().eq("quotation_id", data.id);
    const { error } = await context.supabase.from("quotations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listInquiriesLite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("project_inquiries")
      .select("id, name, company, project_type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    return (data ?? []) as {
      id: string;
      name: string;
      company: string | null;
      project_type: string | null;
      status: string;
      created_at: string;
    }[];
  });

/**
 * Convert an approved/accepted quotation into a proforma invoice.
 * Copies line items, sets the quotation to `converted`, and links back
 * via quotations.converted_invoice_id.
 */
export const convertQuotationToProforma = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid(),
        due_date: z.string().nullable().optional(),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const [{ data: q, error: qErr }, { data: items, error: iErr }] = await Promise.all([
      context.supabase
        .from("quotations")
        .select(
          "id, customer_id, currency, vat_rate, subtotal, vat_amount, total, terms, notes, converted_invoice_id, status",
        )
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("quotation_items")
        .select("description, quantity, unit, unit_price, discount_pct, position, product_id")
        .eq("quotation_id", data.id)
        .order("position"),
    ]);
    if (qErr) throw new Error(qErr.message);
    if (iErr) throw new Error(iErr.message);
    if (!q) throw new Error("Quotation not found");
    if (!q.customer_id) throw new Error("Quotation has no customer");
    if (q.converted_invoice_id) {
      return { invoice_id: q.converted_invoice_id, already: true };
    }

    const { data: inv, error: invErr } = await context.supabase
      .from("invoices")
      .insert({
        type: "proforma",
        status: "draft",
        customer_id: q.customer_id,
        currency: q.currency,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: data.due_date ?? null,
        subtotal: Number(q.subtotal ?? 0),
        vat_amount: Number(q.vat_amount ?? 0),
        total: Number(q.total ?? 0),
        notes: q.notes ?? null,
      })
      .select("id")
      .maybeSingle();
    if (invErr) throw new Error(invErr.message);
    if (!inv?.id) throw new Error("Could not create proforma invoice");

    if ((items ?? []).length > 0) {
      const rate = Number(q.vat_rate ?? 0);
      const rows = (items ?? []).map((it) => {
        const qty = Number(it.quantity ?? 0);
        const price = Number(it.unit_price ?? 0);
        const discount = Number(it.discount_pct ?? 0);
        const line_total = Math.round(qty * price * (1 - discount / 100) * 100) / 100;
        return {
          invoice_id: inv.id,
          description: it.description,
          quantity: qty,
          unit: it.unit ?? "unit",
          unit_price: price,
          discount_pct: discount,
          vat_pct: rate,
          line_total,
          position: it.position,
          product_id: it.product_id ?? null,
        };
      });
      const { error: itemsErr } = await context.supabase.from("invoice_items").insert(rows);
      if (itemsErr) throw new Error(itemsErr.message);
    }

    const { error: linkErr } = await context.supabase
      .from("quotations")
      .update({ converted_invoice_id: inv.id, status: "converted" })
      .eq("id", data.id);
    if (linkErr) throw new Error(linkErr.message);

    return { invoice_id: inv.id, already: false };
  });

