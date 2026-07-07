import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type PurgeAuditRow = {
  id: string;
  user_id: string | null;
  created_at: string;
  metadata: unknown;
};

const PURGE_ROLES = ["super_admin", "management", "finance"] as const;

async function assertCanPurge(context: {
  supabase: import("@supabase/supabase-js").SupabaseClient;
  userId: string;
}) {
  const { data: allowed, error } = await context.supabase.rpc("has_any_role", {
    _user_id: context.userId,
    _roles: PURGE_ROLES as unknown as string[],
  });
  if (error) throw new Error(error.message);
  if (!allowed) {
    throw new Error(
      "You do not have permission to export the purge audit log.",
    );
  }
}

const FilteredInput = z.object({
  invoice_id: z.string().uuid(),
  user_filter: z.string().optional(), // "all" | "__system__" | uuid
  from_date: z.string().optional(), // yyyy-mm-dd
  to_date: z.string().optional(),
  sort_column: z.enum(["created_at", "user_id"]).default("created_at"),
  sort_ascending: z.boolean().default(false),
  limit: z.number().int().min(1).max(10000).default(10000),
});

export const listPurgeAuditForExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => FilteredInput.parse(v))
  .handler(async ({ context, data }): Promise<PurgeAuditRow[]> => {
    await assertCanPurge(context);
    let q = context.supabase
      .from("activity_logs")
      .select("id, user_id, created_at, metadata")
      .eq("action", "purge_pdf_versions")
      .eq("entity_type", "invoice")
      .eq("entity_id", data.invoice_id);
    if (data.user_filter === "__system__") q = q.is("user_id", null);
    else if (data.user_filter && data.user_filter !== "all")
      q = q.eq("user_id", data.user_filter);
    if (data.from_date)
      q = q.gte("created_at", new Date(data.from_date + "T00:00:00").toISOString());
    if (data.to_date)
      q = q.lte("created_at", new Date(data.to_date + "T23:59:59.999").toISOString());
    const { data: rows, error } = await q
      .order(data.sort_column, { ascending: data.sort_ascending })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return (rows ?? []) as PurgeAuditRow[];
  });

const SelectedInput = z.object({
  invoice_id: z.string().uuid(),
  ids: z.array(z.string().uuid()).min(1).max(10000),
});

export const listPurgeAuditByIds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => SelectedInput.parse(v))
  .handler(async ({ context, data }): Promise<PurgeAuditRow[]> => {
    await assertCanPurge(context);
    const { data: rows, error } = await context.supabase
      .from("activity_logs")
      .select("id, user_id, created_at, metadata")
      .eq("action", "purge_pdf_versions")
      .eq("entity_type", "invoice")
      .eq("entity_id", data.invoice_id)
      .in("id", data.ids)
      .limit(data.ids.length);
    if (error) throw new Error(error.message);
    return (rows ?? []) as PurgeAuditRow[];
  });
