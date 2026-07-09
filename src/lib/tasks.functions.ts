import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { writeAudit } from "./audit-log";

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
      const { data: prev } = await context.supabase
        .from("tasks")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      const patch = {
        ...data,
        ...(data.status === "done" ? { completed_at: new Date().toISOString() } : {}),
      };
      const { error } = await context.supabase.from("tasks").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
      await writeAudit(context.supabase, {
        user_id: context.userId,
        action: "update",
        entity_type: "task",
        entity_id: data.id,
        metadata: { status: data.status, priority: data.priority, assigned_to: data.assigned_to ?? null },
        old_values: prev ?? null,
        new_values: patch,
      });
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("tasks")
      .insert(data)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (row?.id) {
      await writeAudit(context.supabase, {
        user_id: context.userId,
        action: "create",
        entity_type: "task",
        entity_id: row.id,
        metadata: {
          title: data.title,
          status: data.status,
          priority: data.priority,
          entity_type: data.entity_type ?? null,
          entity_id: data.entity_id ?? null,
        },
        old_values: null,
        new_values: row,
      });
    }
    return { id: row?.id };
  });

export const setTaskStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ id: z.string().uuid(), status: StatusEnum }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const { data: prev } = await context.supabase
      .from("tasks")
      .select("status, completed_at")
      .eq("id", data.id)
      .maybeSingle();
    const patch = {
      status: data.status,
      ...(data.status === "done" ? { completed_at: new Date().toISOString() } : {}),
    };
    const { error } = await context.supabase.from("tasks").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "status_change",
      entity_type: "task",
      entity_id: data.id,
      metadata: { status: data.status },
      old_values: prev ?? null,
      new_values: patch,
    });
    return { ok: true };
  });

export const approveTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { data: prev } = await context.supabase
      .from("tasks")
      .select("approved_by, approved_at")
      .eq("id", data.id)
      .maybeSingle();
    const patch = { approved_by: context.userId, approved_at: new Date().toISOString() };
    const { error } = await context.supabase
      .from("tasks")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: "approve",
      entity_type: "task",
      entity_id: data.id,
      metadata: {},
      old_values: prev ?? null,
      new_values: patch,
    });
    return { ok: true };
  });
