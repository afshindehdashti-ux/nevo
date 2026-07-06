import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const StatusEnum = z.enum(["open", "in_progress", "waiting", "done", "cancelled"]);
const PriorityEnum = z.enum(["low", "normal", "high", "urgent"]);

export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        mine: z.boolean().optional(),
        status: StatusEnum.optional(),
        entity_type: z.string().optional(),
        entity_id: z.string().uuid().optional(),
      })
      .parse(v ?? {}),
  )
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("priority", { ascending: false })
      .limit(500);
    if (data.mine) q = q.eq("assigned_to", context.userId);
    if (data.status) q = q.eq("status", data.status);
    if (data.entity_type) q = q.eq("entity_type", data.entity_type);
    if (data.entity_id) q = q.eq("entity_id", data.entity_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const UpsertInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  status: StatusEnum.default("open"),
  priority: PriorityEnum.default("normal"),
  assigned_to: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  entity_type: z.string().nullable().optional(),
  entity_id: z.string().uuid().nullable().optional(),
  approval_required: z.boolean().default(false),
});

export const upsertTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => UpsertInput.parse(v))
  .handler(async ({ context, data }) => {
    if (data.id) {
      const patch: Record<string, unknown> = { ...data };
      if (data.status === "done") patch.completed_at = new Date().toISOString();
      const { error } = await context.supabase.from("tasks").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("tasks")
      .insert(data)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { id: row?.id };
  });

export const setTaskStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ id: z.string().uuid(), status: StatusEnum }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "done") patch.completed_at = new Date().toISOString();
    const { error } = await context.supabase.from("tasks").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const approveTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("tasks")
      .update({ approved_by: context.userId, approved_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
