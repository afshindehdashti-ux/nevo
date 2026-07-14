# Admin List Pages — UI State Reference

Every admin list page (Opportunities, Commission Invoices, Purchase Orders, and any
future sibling) MUST render exactly one of four states and MUST use the shared
components below. This keeps behaviour, a11y, and telemetry consistent.

## The four states

| Order | State   | Component            | Role / a11y                                       | Telemetry emitted                                                                      |
| ----- | ------- | -------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1     | Error   | `ListErrorState`     | `role="alert"` + `aria-live`                      | `reportClientError` (dedup per resource+message) + `admin_list_retry_clicked` on retry |
| 2     | Loading | `<Skeleton />` block | `data-testid="list-skeleton"`, `aria-busy="true"` | none                                                                                   |
| 3     | Empty   | `ListEmptyState`     | `role="status"`                                   | `admin_list_empty_shown` (dedup per resource+reason)                                   |
| 4     | Ready   | data `<table>`       | native table semantics                            | none                                                                                   |

Rules:

- Precedence is **error → loading → empty → ready**. Never render two at once.
- Loading gates on React Query's `isLoading` (initial fetch only), never
  `isFetching` — background refetches must not flash the skeleton.
- Non-array responses are treated as errors (see `classifyListState`) so
  schema drift trips error telemetry instead of an unexplained empty card.

## Preferred: `<AdminListPage>` template

For new pages, use the shared shell at
`src/components/admin/AdminListPage.tsx`. It wires `classifyListState` and
both telemetry streams (`admin_list_empty_shown`, `reportClientError`)
automatically, so you can't accidentally forget one:

```tsx
const { data, isLoading, error, refetch, isFetching } = useQuery({ ... });

return (
  <AdminListPage<Opportunity>
    resource="opportunities"
    eyebrow="CRM"
    title="Opportunities"
    subtitle="Pipeline of open and closed deals across NEVO Industrial."
    isLoading={isLoading}
    error={error}
    data={data}
    refetch={refetch}
    isFetching={isFetching}
    empty={{
      icon: Target,
      title: "No opportunities yet",
      description: "New opportunities will show up here as your team creates them.",
    }}
  >
    {(rows) => <OpportunitiesTable rows={rows} />}
  </AdminListPage>
);
```

The shell enforces the precedence chain, the a11y attributes on the skeleton,
and the `resource` slug on both telemetry streams. Non-array responses are
routed through `ListErrorState` via `classifyListState`, so schema drift
never renders as an unexplained empty card.

Only fall back to the manual skeleton below when you need a layout the shell
can't express (e.g. tabs that own their own state region).

## Canonical page skeleton (manual)

```tsx
const { data, isLoading, error, refetch, isFetching } = useQuery({ ... });

return (
  <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
    <header>{/* title + subtitle */}</header>

    {error ? (
      <ListErrorState
        resource="opportunities"           // snake_case slug, matches telemetry
        error={error}
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    ) : isLoading ? (
      <div data-testid="list-skeleton" aria-busy="true" aria-live="polite" className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    ) : (data ?? []).length === 0 ? (
      <ListEmptyState
        icon={Target}                       // lucide icon that matches the domain
        title="No opportunities yet"
        description="One sentence explaining what will populate this list."
        resource="opportunities"            // required for telemetry
      />
    ) : (
      <table>{/* rows */}</table>
    )}
  </div>
);
```

## Component contracts

### `ListErrorState`

- Props: `resource`, `error`, `onRetry`, `isRetrying?`.
- Renders a non-destructive card (prior cached data stays untouched).
- Fires `reportClientError({ surface: "admin_list", resource, kind: "supabase_query_failure" })`
  once per distinct `(resource, error.message)` — no retry storms.
- Retry button fires `logClientEvent("admin_list_retry_clicked", { resource, message }, "info")`
  before calling `onRetry`.

### Loading skeleton

- Always `data-testid="list-skeleton"` and `aria-busy="true"` — tests assert on both.
- 3 rows of `<Skeleton className="h-12 w-full" />` is the house style.
- No telemetry (loading is expected).

### `ListEmptyState`

- Props: `icon`, `title`, `description`, `action?`, `resource?`, `reason?`.
- Renders `role="status"` card with icon + title + description (+ optional CTA).
- When `resource` is set, fires `logClientEvent("admin_list_empty_shown", { surface, resource, reason }, level)`
  once per `(resource, reason)`. `reason: "seed_missing"` escalates level from `info` → `warn`.
- Allowed reasons: `no_records` (default), `seed_missing`, `filtered_out`.

### `classifyListState<T>({ isLoading, error, data, expectSeed? })`

- Returns a discriminated `ListViewState<T>` — use in smoke tests / helpers
  that need to reason about the current state programmatically.
- Non-array `data` → `{ kind: "error", error: … }` so the UI shows
  `ListErrorState` and telemetry fires.

## Copy guidelines

- **Error card**: never fabricate a fix; the shared component already says
  "No data was changed. You can retry the request below." Keep it.
- **Empty title**: `No <plural resource> yet` (sentence case, no period).
- **Empty description**: one sentence, present/future tense, explains what
  produces a record. End with a period. Test regex looks for
  `will (show up|appear) here`, so keep that phrasing.
- **Icons**: pick a lucide icon that matches the domain
  (`Target`, `Percent`, `ClipboardList`, …) — reuse across list, header,
  and empty state.

## Test coverage checklist

When adding a new admin list page, extend these files:

- `src/routes/_authenticated/__tests__/admin-list-skeleton.test.tsx`
  — skeleton visible while pending, gone after resolve.
- `src/routes/_authenticated/__tests__/admin-list-empty.test.tsx`
  — empty card renders with correct title/description/`resource`, no table,
  no error card, `admin_list_empty_shown` fires once.
- `src/routes/_authenticated/__tests__/admin-list-loading-to-empty.test.tsx`
  — clean transition skeleton → empty on `[]`, states never overlap.
- `scripts/e2e/admin-list-smoke.py`
  — Playwright smoke against seeded data.

The shared telemetry tests in `src/components/admin/__tests__/` cover
`ListErrorState` and `ListEmptyState` behaviour once — no need to re-test
per page.

## `admin_list_empty_shown` telemetry checklist

Every new list page MUST emit `admin_list_empty_shown` with the correct
`resource` slug and `reason` — the dashboards group by both, and a typo
silently drops the page from ops visibility. Walk this list before merging:

### `resource` slug rules

- **Present**: `resource` is set on **both** `ListErrorState` and
  `ListEmptyState` (or passed once to `<AdminListPage>`). Missing on
  `ListEmptyState` = telemetry never fires; missing on `ListErrorState` =
  error stream can't be joined to the empty stream.
- **Format**: `snake_case`, singular-or-plural matching the URL segment.
  Allowed characters: `[a-z0-9_]+`.
- **Matches the URL**: `resource` equals the last `/admin/<segment>` chunk
  with `-` → `_`. Examples:
  | Route                        | `resource` slug       |
  | ---------------------------- | --------------------- |
  | `/admin/opportunities`       | `opportunities`       |
  | `/admin/commission-invoices` | `commission_invoices` |
  | `/admin/purchase-orders`     | `purchase_orders`     |
- **Unique**: grep the repo — no other page uses the same slug. Two pages
  sharing a slug collide in telemetry and the dedup ref cancels the second
  event.
- **Stable**: never rename after ship. Renaming breaks historical dashboards
  and alert thresholds.

### `reason` value rules

Only these three values are allowed (`ListEmptyState` prop type enforces it):

| `reason`       | When to use                                                                       | Telemetry level |
| -------------- | --------------------------------------------------------------------------------- | --------------- |
| `no_records`   | Default. A fresh environment or genuinely empty table.                            | `info`          |
| `seed_missing` | Env should have seeded rows but doesn't (smoke test failed, seed script skipped). | `warn`          |
| `filtered_out` | User's active filters/search excluded every row — data exists, just none matches. | `info`          |

Rules:

- **Default to `no_records`** — don't pass `reason` at all unless one of the
  other two applies.
- **`seed_missing`** is only correct when the caller can _prove_ seeded data
  should exist (e.g. `expectSeed` on `<AdminListPage>` in a smoke env). Never
  hard-code it in the page.
- **`filtered_out`** requires that at least one filter/search is currently
  active. Don't emit it on the initial unfiltered load.
- Copy must match the reason: `no_records` → "will show up here" phrasing;
  `filtered_out` → mentions filters and how to clear them.

### Verification steps for a new page

1. **grep**: `rg "resource=\"<slug>\"" src/routes/_authenticated/` returns
   both an `ListErrorState` and a `ListEmptyState` usage (or one
   `<AdminListPage>`).
2. **grep uniqueness**: `rg "resource=\"<slug>\"" src` — no other route file
   claims the same slug.
3. **Unit test** in `admin-list-empty.test.tsx` asserts:
   ```ts
   expect(logClientEvent).toHaveBeenCalledWith(
     "admin_list_empty_shown",
     { surface: "admin_list", resource: "<slug>", reason: "no_records" },
     "info",
   );
   ```
4. **Dedup**: assert `logClientEvent` was called exactly once even after a
   re-render with the same props (covered by the shared telemetry test —
   don't duplicate, but confirm your page relies on `ListEmptyState` and
   doesn't emit the event itself).
5. **Runtime spot-check** (once, after first deploy): open the page against
   an empty table, filter DevTools console for `admin_list_empty_shown`, and
   verify the payload's `resource` and `reason` match the checklist above.

## Allowed registries (single source of truth)

Both TypeScript types and every automated check (ESLint plugin, CI grep,
runtime validation wrapper) derive their allowed values from
[`src/components/admin/list-telemetry.ts`](../src/components/admin/list-telemetry.ts).
Do not hard-code these strings anywhere else — always import the union
type or extend the tuple in that file first.

### `ADMIN_LIST_RESOURCES`

| Slug                  | URL segment                  |
| --------------------- | ---------------------------- |
| `opportunities`       | `/admin/opportunities`       |
| `commission_invoices` | `/admin/commission-invoices` |
| `purchase_orders`     | `/admin/purchase-orders`     |

### `ADMIN_LIST_EMPTY_REASONS`

| Reason         | Telemetry level | When to use                                                   |
| -------------- | --------------- | ------------------------------------------------------------- |
| `no_records`   | `info`          | Default. Table is genuinely empty (or `reason` prop omitted). |
| `seed_missing` | `warn`          | Env was expected to have seeded data but doesn't.             |
| `filtered_out` | `info`          | Rows exist; the user's active filters exclude all of them.    |

To add a new resource, append to `ADMIN_LIST_RESOURCES` (never rename or
reorder existing entries — dashboards key off them). Reasons are frozen;
adding a new one requires updating the wrapper, the ESLint rule, the CI
grep script, and the dashboards in tandem.

## Enforcement — how the guardrails compose

Four layers catch drift, in this order:

1. **TypeScript** — `AdminListResource` / `AdminListEmptyReason` unions on
   `AdminListPage`, `ListEmptyState`, and `ListErrorState` props. A typo
   fails `bun run typecheck`.
2. **ESLint plugin** — [`eslint-rules/admin-list-telemetry.js`](../eslint-rules/admin-list-telemetry.js)
   catches non-typed callers, dynamic props, and mutually exclusive
   flags. Rules:
   - `admin-list-telemetry/valid-resource-prop`
   - `admin-list-telemetry/valid-empty-reason` — `--fix` rewrites near
     typos to the nearest approved value (Levenshtein ≤ 3); ambiguous or
     far-off values fail hard.
   - `admin-list-telemetry/no-raw-empty-event`
   - `admin-list-telemetry/no-conflicting-empty-flags`
3. **CI grep** — `scripts/check-admin-list-telemetry.mjs` prints a
   per-file drift report with categories, offending lines, and the
   current allowed values. Runs in
   `.github/workflows/check-admin-list-telemetry.yml`.
4. **Runtime wrapper** — `emitAdminListEmptyShown()` in
   `list-telemetry.ts` validates the payload one last time before the
   transport, drops unknown values, and emits an
   `admin_list_empty_shown__rejected` diagnostic so drift is visible in
   telemetry instead of polluting real events.

## Copy-paste examples that satisfy every rule

Every snippet below has been verified against the ESLint plugin. Copy
verbatim, then swap in your slug and copy strings.

### 1. Default empty state (via `<AdminListPage>`)

```tsx
<AdminListPage
  resource="opportunities" // must be in ADMIN_LIST_RESOURCES
  title="Opportunities"
  isLoading={isLoading}
  error={error}
  data={data}
  refetch={refetch}
  isFetching={isFetching}
  empty={{
    icon: Target,
    title: "No opportunities yet",
    description: "New opportunities will show up here as your team creates them.",
    // reason omitted → defaults to "no_records" (info)
  }}
>
  {(rows) => <OpportunitiesTable rows={rows} />}
</AdminListPage>
```

### 2. Filtered-out empty state

```tsx
<AdminListPage
  resource="commission_invoices"
  title="Commission Invoices"
  isLoading={isLoading}
  error={error}
  data={data}
  refetch={refetch}
  isFetching={isFetching}
  empty={{
    icon: Percent,
    title: "No invoices match your filters",
    description: "Clear filters to see invoices that will show up here.",
    filtersActive: activeFilterCount > 0, // → reason="filtered_out"
    // NEVER also set expectSeed — no-conflicting-empty-flags will fail.
  }}
>
  {(rows) => <CommissionInvoicesTable rows={rows} />}
</AdminListPage>
```

### 3. Seed-missing (smoke-test env only)

```tsx
<AdminListPage
  resource="purchase_orders"
  title="Purchase Orders"
  isLoading={isLoading}
  error={error}
  data={data}
  refetch={refetch}
  isFetching={isFetching}
  empty={{
    icon: ClipboardList,
    title: "No purchase orders yet",
    description: "Purchase orders will show up here after import runs.",
    expectSeed: import.meta.env.VITE_EXPECT_SEED === "true", // → reason="seed_missing" (warn)
  }}
>
  {(rows) => <PurchaseOrdersTable rows={rows} />}
</AdminListPage>
```

### 4. Direct `<ListEmptyState>` (only when the shell can't express the layout)

```tsx
<ListEmptyState
  resource="opportunities" // required, must be in registry
  reason="filtered_out" // optional, must be in registry
  icon={Target}
  title="No opportunities match your filters"
  description="Clear filters to see opportunities that will show up here."
/>
```

### 5. Common mistakes the rules catch

```tsx
// ❌ valid-resource-prop: missing slug
<AdminListPage title="Shipments" />

// ❌ valid-resource-prop: slug not in ADMIN_LIST_RESOURCES
<ListEmptyState resource="shipmnts" ... />

// ❌ valid-empty-reason: typo — auto-fixed by --fix to "no_records"
<ListEmptyState resource="opportunities" reason="no_record" ... />

// ❌ valid-empty-reason: too far from any allowed value — hard error
<ListEmptyState resource="opportunities" reason="brand_new_reason" ... />

// ❌ no-conflicting-empty-flags: mutually exclusive
<ListEmptyState resource="opportunities" filtersActive expectSeed ... />

// ❌ no-raw-empty-event: forbidden outside ListEmptyState.tsx
logClientEvent("admin_list_empty_shown", { ... });
```

Run locally before pushing:

```bash
bun run lint                          # ESLint plugin (all four rules)
bun run check:admin-list-telemetry    # CI grep with per-file drift report
bunx vitest run                       # runtime wrapper + component tests
```

## Add a new admin list page

Five steps. If you skip step 1, the `resource` prop in step 3 won't compile.
If you skip step 5, `bun run check:admin-list-telemetry` will fail in CI.

### 1. Register the telemetry slug

Add a `snake_case` slug to `ADMIN_LIST_RESOURCES` in
`src/components/admin/list-telemetry.ts`. This tuple is the single source
of truth — the `AdminListResource` type derives from it and every prop
(`AdminListPage.resource`, `ListEmptyState.resource`, `ListErrorState.resource`)
narrows to that union.

```ts
// src/components/admin/list-telemetry.ts
export const ADMIN_LIST_RESOURCES = [
  "opportunities",
  "commission_invoices",
  "purchase_orders",
  "shipments", // ← new
] as const;
```

### 2. Create the route file

File-based routing: `src/routes/_authenticated/admin.<slug-with-dashes>.tsx`.

### 3. Copy-paste the page skeleton

The canonical, always-current template lives at
[`templates/admin-list-page.template.tsx`](../templates/admin-list-page.template.tsx).
Copy that file to `src/routes/_authenticated/admin.<slug>.tsx` and replace
every `__REPLACE__` marker — the `resource`, `empty`, `filtersActive`, and
`expectSeed` wiring for `admin_list_empty_shown` is already correct and
must not be changed.

The same skeleton, inlined for reference:

```tsx
// src/routes/_authenticated/admin.shipments.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminListPage } from "@/components/admin/AdminListPage";

export const Route = createFileRoute("/_authenticated/admin/shipments")({
  component: ShipmentsPage,
});

function ShipmentsPage() {
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "shipments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("id, tracking_no, status, dispatched_at")
        .order("dispatched_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminListPage
      // MUST match a slug in ADMIN_LIST_RESOURCES — this drives both
      // `admin_list_empty_shown` (empty state) and `reportClientError`
      // (error state) telemetry.
      resource="shipments"
      title="Shipments"
      eyebrow="Operations"
      subtitle="Outbound shipments in the fulfilment pipeline."
      isLoading={isLoading}
      error={error}
      data={data}
      refetch={refetch}
      isFetching={isFetching}
      // Omit both flags → reason="no_records" (level: info).
      // Set `expectSeed`  → reason="seed_missing"  (level: warn) —
      //   use in envs where data is expected (smoke tests).
      // Set `filtersActive` → reason="filtered_out" (level: info) —
      //   set when the user has narrowed the list with a filter.
      // The two flags are mutually exclusive — the compiler enforces it.
      empty={{
        icon: Truck,
        title: "No shipments yet",
        // Keep the phrase "will show up here" or "will appear here".
        description: "Shipments will show up here as orders leave the warehouse.",
      }}
    >
      {(rows) => (
        <table className="w-full text-sm">
          {/* … your table body … */}
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.tracking_no}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminListPage>
  );
}
```

That single JSX block emits:

| Situation                         | Event                                                     | Payload                                                                            | Level |
| --------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----- |
| Query resolves with `[]`          | `admin_list_empty_shown`                                  | `{ surface: "admin_list", resource: "shipments", reason: "no_records" }`           | info  |
| `[]` while `expectSeed` is set    | `admin_list_empty_shown`                                  | `{ …, reason: "seed_missing" }`                                                    | warn  |
| `[]` while `filtersActive` is set | `admin_list_empty_shown`                                  | `{ …, reason: "filtered_out" }`                                                    | info  |
| Query throws                      | `reportClientError` + `admin_list_retry_clicked` on retry | `{ surface: "admin_list", resource: "shipments", kind: "supabase_query_failure" }` | error |
| Non-array response (schema drift) | Same as query throw                                       | Error message: "Unexpected response shape…"                                        | error |

### 4. Extend the contract test

Add one row to `REGISTRY` in
`src/routes/_authenticated/__tests__/admin-list-empty-telemetry.test.tsx`.
The suite iterates the registry and auto-asserts slug + reason for the new
page — no per-page test to write.

```ts
{
  label: "admin.shipments",
  routePath: "@/routes/_authenticated/admin.shipments",
  emptyTitle: "No shipments yet",
  expectedResource: "shipments",
},
```

### 5. Verify locally

```bash
bun run check:admin-list-telemetry   # static guard
bunx vitest run                      # contract + telemetry tests
```

Both must pass before CI. The static guard also runs in
`.github/workflows/check-admin-list-telemetry.yml` and fails the build if a
new page skips `resource`, uses an unregistered slug, uses an unapproved
`reason`, or hand-rolls a raw `logClientEvent("admin_list_empty_shown", …)`
outside `ListEmptyState.tsx`.

## Do / don't

- **Do** put the `resource` slug on both `ListErrorState` and
  `ListEmptyState` so both telemetry streams line up.
- **Do** keep the branch order `error → isLoading → empty → table`.
- **Don't** render the skeleton on background refetch — use `isLoading`,
  not `isFetching`.
- **Don't** invent a bespoke empty card; extend `ListEmptyState` with a new
  `reason` or an `action` prop instead.
- **Don't** log Supabase errors manually in the page — `ListErrorState`
  already reports them.
