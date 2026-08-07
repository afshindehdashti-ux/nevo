/**
 * Copy-paste template for a new admin list page.
 *
 * This file lives OUTSIDE `src/routes/` on purpose — TanStack Router only
 * scans `src/routes/`, so keeping the template here means it never turns
 * into a real route and never trips the file-based routing generator.
 *
 * To create a new admin list page:
 *
 *   1. Register the slug in `src/components/admin/list-telemetry.ts`
 *      (append to `ADMIN_LIST_RESOURCES`). Without this, the `resource`
 *      prop below will not typecheck.
 *
 *   2. Copy this file to
 *      `src/routes/_authenticated/admin.<slug-with-dashes>.tsx`
 *      (e.g. `admin.shipments.tsx`).
 *
 *   3. Replace every `__REPLACE__` marker below. Do NOT change the
 *      `admin_list_empty_shown` wiring — telemetry is driven by
 *      <AdminListPage resource=... /> and the `empty` / `filtersActive` /
 *      `expectSeed` flags. The three approved reason values map as:
 *
 *        no reason flag        → reason="no_records"   (info)
 *        filtersActive: true   → reason="filtered_out" (info)
 *        expectSeed: true      → reason="seed_missing" (warn)
 *
 *      `filtersActive` and `expectSeed` are mutually exclusive; the
 *      compiler will reject setting both.
 *
 *   4. Add a matching row to `REGISTRY` in
 *      `src/routes/_authenticated/__tests__/admin-list-empty-telemetry.test.tsx`.
 *
 *   5. Run `bun run check:admin-list-telemetry` and `bunx vitest run`.
 *
 * See `docs/admin-list-states.md` → "Add a new admin list page" for the
 * full walkthrough and precedence rules.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
// __REPLACE__ — pick an icon from lucide-react for the empty state.
import { Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminListPage } from "@/components/admin/AdminListPage";

// __REPLACE__ — route path must match the filename:
//   admin.shipments.tsx → "/_authenticated/admin/shipments"
export const Route = createFileRoute("/_authenticated/admin/__REPLACE__")({
  head: () => ({
    meta: [
      // __REPLACE__ — page title shown in the browser tab.
      { title: "__REPLACE__ — NEVO CRM" },
      // Admin pages are never indexed.
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminListRoute,
});

function AdminListRoute() {
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    // __REPLACE__ — stable cache key for this list.
    queryKey: ["admin", "__REPLACE__"],
    queryFn: async () => {
      const { data, error } = await supabase
        // __REPLACE__ — target table + columns.
        .from("__REPLACE__" as never)
        .select("id, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 15_000,
  });

  return (
    <AdminListPage
      // MUST be a slug registered in ADMIN_LIST_RESOURCES.
      // Drives `admin_list_empty_shown` (empty) + `reportClientError` (error).
      resource="__REPLACE__"
      // __REPLACE__ — user-facing header copy.
      title="__REPLACE__"
      eyebrow="Operations"
      subtitle="__REPLACE__ — one-sentence description of what this list shows."
      isLoading={isLoading}
      error={error}
      data={data}
      refetch={refetch}
      isFetching={isFetching}
      // Empty-state card. Do NOT log `admin_list_empty_shown` manually —
      // <ListEmptyState> (rendered by AdminListPage) emits it exactly once
      // with { surface: "admin_list", resource, reason }.
      //
      // Reason selection (pick AT MOST one flag, or neither):
      //   • Neither flag set        → reason="no_records"   (info)
      //   • filtersActive: true     → reason="filtered_out" (info)
      //   • expectSeed: true        → reason="seed_missing" (warn)
      empty={{
        icon: Truck,
        // __REPLACE__ — short empty-state headline.
        title: "No __REPLACE__ yet",
        // Keep the phrase "will show up here" / "will appear here" so the
        // static telemetry guard recognises this as the shared empty card.
        description: "__REPLACE__ will show up here as they enter the pipeline.",
        // Uncomment ONE of these when applicable — never both:
        // filtersActive: activeFilterCount > 0,
        // expectSeed: import.meta.env.VITE_EXPECT_SEED === "true",
      }}
    >
      {(rows) => (
        <div className="border border-border rounded-md overflow-hidden bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {/* __REPLACE__ — column headers */}
                <th className="text-left px-3 py-2">ID</th>
                <th className="text-left px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id} className="border-t border-border hover:bg-muted/20">
                  {/* __REPLACE__ — cells */}
                  <td className="px-3 py-2 font-medium">{row.id}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminListPage>
  );
}
