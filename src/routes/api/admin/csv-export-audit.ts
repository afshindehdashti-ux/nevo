/**
 * Read-only admin API endpoint for external compliance tooling.
 *
 * GET /api/admin/csv-export-audit
 *   Query params:
 *     - id        (uuid, optional): return a single audit record
 *     - entity_type, entity_id, scope, user_id (optional filters)
 *     - from, to  (yyyy-mm-dd, inclusive) — filter on created_at
 *     - search    (matches filename / sha256 / entity_id, case-insensitive)
 *     - limit     (1..500, default 100)
 *
 * Auth: requires `Authorization: Bearer <access_token>` for a Supabase user
 * whose role passes the `csv_export_audit` RLS policy (super_admin /
 * management / finance). Non-privileged callers see an empty list because
 * RLS filters every row.
 *
 * Response payload includes the full `metadata` blob so downstream
 * compliance tooling can compare `embedded_sha256` /
 * `embedded_exported_at_iso` against the top-level `sha256` / `created_at`.
 */

import { createFileRoute } from "@tanstack/react-router";
import { withMethodGuards } from "@/lib/api-http";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const QuerySchema = z.object({
  id: z.string().uuid().optional(),
  entity_type: z.string().max(64).optional(),
  entity_id: z.string().max(255).optional(),
  scope: z.string().max(64).optional(),
  user_id: z.string().uuid().optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ error: message, ...(extra ?? {}) }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/admin/csv-export-audit")({
  server: {
    handlers: withMethodGuards({
      GET: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
        if (!token) return jsonError(401, "Missing bearer token");

        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!url || !key) return jsonError(500, "Server misconfigured");

        // Per-request client scoped to the caller's token. RLS on
        // csv_export_audit already restricts SELECT to privileged roles,
        // so RLS is the authorization boundary — no admin key needed.
        const supabase = createClient<Database>(url, key, {
          auth: {
            storage: undefined,
            persistSession: false,
            autoRefreshToken: false,
          },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });

        // Confirm the token maps to a real user before spending a query.
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userRes.user) return jsonError(401, "Invalid or expired token");

        const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
        if (!parsed.success) {
          return jsonError(400, "Invalid query parameters", {
            issues: parsed.error.issues,
          });
        }
        const q = parsed.data;

        let query = supabase
          .from("csv_export_audit")
          .select(
            "id, created_at, user_id, export_type, filename, sha256, byte_size, row_count, scope, entity_type, entity_id, filters, metadata",
            { count: "exact" },
          );

        if (q.id) query = query.eq("id", q.id);
        if (q.entity_type) query = query.eq("entity_type", q.entity_type);
        if (q.entity_id) query = query.eq("entity_id", q.entity_id);
        if (q.scope) query = query.eq("scope", q.scope);
        if (q.user_id) query = query.eq("user_id", q.user_id);
        if (q.from) query = query.gte("created_at", new Date(`${q.from}T00:00:00Z`).toISOString());
        if (q.to) query = query.lte("created_at", new Date(`${q.to}T23:59:59.999Z`).toISOString());
        if (q.search && q.search.trim()) {
          const term = q.search.trim().replace(/[%,]/g, "");
          query = query.or(
            `filename.ilike.%${term}%,sha256.ilike.%${term}%,entity_id.ilike.%${term}%`,
          );
        }

        const { data, error, count } = await query
          .order("created_at", { ascending: false })
          .limit(q.limit);

        if (error) {
          // RLS denial or unexpected error — treat as forbidden for privileged-only table.
          return jsonError(403, error.message);
        }

        const rows = data ?? [];
        return new Response(
          JSON.stringify(
            {
              generated_at: new Date().toISOString(),
              returned: rows.length,
              total: count ?? rows.length,
              limit: q.limit,
              rows,
            },
            null,
            2,
          ),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          },
        );
      },
    }),
  },
});
