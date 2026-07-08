# Admin List Pages — UI State Reference

Every admin list page (Opportunities, Commission Invoices, Purchase Orders, and any
future sibling) MUST render exactly one of four states and MUST use the shared
components below. This keeps behaviour, a11y, and telemetry consistent.

## The four states

| Order | State    | Component                          | Role / a11y                        | Telemetry emitted                                    |
|-------|----------|------------------------------------|------------------------------------|------------------------------------------------------|
| 1     | Error    | `ListErrorState`                   | `role="alert"` + `aria-live`       | `reportClientError` (dedup per resource+message) + `admin_list_retry_clicked` on retry |
| 2     | Loading  | `<Skeleton />` block               | `data-testid="list-skeleton"`, `aria-busy="true"` | none                                                 |
| 3     | Empty    | `ListEmptyState`                   | `role="status"`                    | `admin_list_empty_shown` (dedup per resource+reason) |
| 4     | Ready    | data `<table>`                     | native table semantics             | none                                                 |

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
