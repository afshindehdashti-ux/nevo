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
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "sent") patch.sent_at = new Date().toISOString();
    if (data.status === "accepted") patch.accepted_at = new Date().toISOString();
    const { error } = await context.supabase.from("quotations").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
