import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const EntityInput = z.object({
  entity_type: z.enum([
    "customer",
    "lead",
    "order",
    "invoice",
    "quotation",
    "project",
    "partner",
    "shipment",
  ]),
  entity_id: z.string().uuid(),
});

export const listCommunications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => EntityInput.parse(v))
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
  kind: z.enum(["note", "email", "call", "meeting", "whatsapp", "file"]).default("note"),
  direction: z.enum(["inbound", "outbound", "internal"]).default("internal"),
  subject: z.string().nullable().optional(),
  body: z.string().min(1),
  contact_name: z.string().nullable().optional(),
  contact_email: z.string().nullable().optional(),
  occurred_at: z.string().optional(),
});

export const createCommunication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CreateInput.parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("communications").insert({
      ...data,
      user_id: context.userId,
      occurred_at: data.occurred_at ?? new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCommunication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("communications").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
