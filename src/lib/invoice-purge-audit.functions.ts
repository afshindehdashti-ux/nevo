import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

export type PurgeAuditRow = {
  id: string;
  user_id: string | null;
  created_at: string;
  metadata: Json;
};

export type PurgeAuditExportResult = {
  rows: PurgeAuditRow[];
  total: number;
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
    throw new Error("You do not have permission to export the purge audit log.");
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
  .validator((v) => FilteredInput.parse(v))
  .handler(async ({ context, data }): Promise<PurgeAuditExportResult> => {
    await assertCanPurge(context);
    let q = context.supabase
      .from("activity_logs")
      .select("id, user_id, created_at, metadata", { count: "exact" })
      .eq("action", "purge_pdf_versions")
      .eq("entity_type", "invoice")
      .eq("entity_id", data.invoice_id);
    if (data.user_filter === "__system__") q = q.is("user_id", null);
    else if (data.user_filter && data.user_filter !== "all") q = q.eq("user_id", data.user_filter);
    if (data.from_date)
      q = q.gte("created_at", new Date(data.from_date + "T00:00:00").toISOString());
    if (data.to_date)
      q = q.lte("created_at", new Date(data.to_date + "T23:59:59.999").toISOString());
    const {
      data: rows,
      error,
      count,
    } = await q.order(data.sort_column, { ascending: data.sort_ascending }).limit(data.limit);
    if (error) throw new Error(error.message);
    return {
      rows: (rows ?? []) as PurgeAuditRow[],
      total: count ?? 0,
    };
  });

const SelectedInput = z.object({
  invoice_id: z.string().uuid(),
  ids: z.array(z.string().uuid()).min(1).max(10000),
});

export const listPurgeAuditByIds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v) => SelectedInput.parse(v))
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

const RecordExportInput = z.object({
  export_type: z.string().min(1).max(64),
  filename: z.string().min(1).max(255),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  byte_size: z.number().int().nonnegative(),
  row_count: z.number().int().nonnegative(),
  scope: z.string().max(64).optional(),
  entity_type: z.string().max(64).optional(),
  entity_id: z.string().max(255).optional(),
  filters: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CsvExportAuditRecord = {
  id: string;
  created_at: string;
  user_id: string | null;
  export_type: string;
  filename: string;
  sha256: string;
  byte_size: number;
  row_count: number;
  scope: string | null;
  entity_type: string | null;
  entity_id: string | null;
  filters: Json;
  metadata: Json;
};

export const recordCsvExportAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v) => RecordExportInput.parse(v))
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    await assertCanPurge(context);
    const { data: row, error } = await context.supabase
      .from("csv_export_audit")
      .insert({
        user_id: context.userId,
        export_type: data.export_type,
        filename: data.filename,
        sha256: data.sha256.toLowerCase(),
        byte_size: data.byte_size,
        row_count: data.row_count,
        scope: data.scope ?? null,
        entity_type: data.entity_type ?? null,
        entity_id: data.entity_id ?? null,
        filters: (data.filters ?? {}) as Json,
        metadata: (data.metadata ?? {}) as Json,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

const ListExportInput = z.object({
  entity_type: z.string().max(64).optional(),
  entity_id: z.string().max(255).optional(),
  scope: z.string().max(64).optional(),
  user_id: z.string().uuid().optional(),
  from_date: z.string().optional(), // yyyy-mm-dd
  to_date: z.string().optional(),
  search: z.string().max(200).optional(), // filename / sha256 / entity id contains
  limit: z.number().int().min(1).max(500).default(100),
});

export type CsvExportAuditListResult = {
  rows: CsvExportAuditRecord[];
  total: number;
  actors: Array<{ user_id: string; full_name: string | null }>;
};

export const listCsvExportAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v) => ListExportInput.parse(v))
  .handler(async ({ context, data }): Promise<CsvExportAuditListResult> => {
    await assertCanPurge(context);
    let q = context.supabase
      .from("csv_export_audit")
      .select(
        "id, created_at, user_id, export_type, filename, sha256, byte_size, row_count, scope, entity_type, entity_id, filters, metadata",
        { count: "exact" },
      );
    if (data.entity_type) q = q.eq("entity_type", data.entity_type);
    if (data.entity_id) q = q.eq("entity_id", data.entity_id);
    if (data.scope) q = q.eq("scope", data.scope);
    if (data.user_id) q = q.eq("user_id", data.user_id);
    if (data.from_date)
      q = q.gte("created_at", new Date(data.from_date + "T00:00:00").toISOString());
    if (data.to_date)
      q = q.lte("created_at", new Date(data.to_date + "T23:59:59.999").toISOString());
    if (data.search && data.search.trim()) {
      const term = data.search.trim().replace(/[%,]/g, "");
      // Filename, sha256, or entity id contains term (case-insensitive).
      q = q.or(`filename.ilike.%${term}%,sha256.ilike.%${term}%,entity_id.ilike.%${term}%`);
    }
    const {
      data: rows,
      error,
      count,
    } = await q.order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as CsvExportAuditRecord[];

    // Distinct actor lookup for the filter dropdown.
    const userIds = Array.from(new Set(list.map((r) => r.user_id).filter((v): v is string => !!v)));
    let actors: Array<{ user_id: string; full_name: string | null }> = [];
    if (userIds.length > 0) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      actors = (profs ?? []).map((p) => ({
        user_id: p.id as string,
        full_name: (p.full_name as string | null) ?? null,
      }));
    }

    return { rows: list, total: count ?? 0, actors };
  });
