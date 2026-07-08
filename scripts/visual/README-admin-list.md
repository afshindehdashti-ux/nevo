# Admin list layout — visual regression

`scripts/visual/admin-list-layout.py` verifies that every admin list page
renders its **loading skeleton** and **empty card** at the same geometry, so
the shared `AdminListPage` / `ListEmptyState` / skeleton contract can't
silently drift when a page is edited by hand.

## What it checks

For each page in `PAGES` (Opportunities, Commission Invoices, Purchase Orders):

1. Intercepts the Supabase REST call for that page's table:
   - **Loading**: the request never fulfills — the query stays in `isLoading`
     and the skeleton renders.
   - **Empty**: the request fulfills with `[]` — the empty card renders.
2. Measures the bounding box of the state region and the first skeleton row.
3. Screenshots the region into `/tmp/browser/admin-list-visual/`.

Assertions:

- `loading.container.x`, `loading.container.width`, `loading.row.height`
  match across all pages (±1px).
- `empty.container.x`, `empty.container.width` match across all pages (±1px).
- Skeleton always exposes `aria-busy="true"`.
- If `admin-list-layout.baseline.json` exists, each page's current geometry
  is also compared against the saved baseline — catches a
  same-shift-everywhere regression that per-page cross-checks would miss.

We deliberately don't pixel-diff the screenshots: icons and copy legitimately
differ per resource. Geometry is the shared invariant.

## Running

```bash
# Prereq: dev server on http://localhost:8080 and a Supabase session already
# injected via the preview (LOVABLE_BROWSER_AUTH_STATUS=injected).
npm run test:visual:admin-list

# Update the per-page baseline after an intentional layout change:
npm run test:visual:admin-list:update
```

Exit codes: `0` pass, `1` layout drift (see stdout for which field drifted
and by how many px), `2` harness error.

## When it fails

1. Open the artifacts under `/tmp/browser/admin-list-visual/` (loading + empty
   PNGs plus `measurements.json`) and compare the offending page against a
   passing sibling.
2. Typical causes: a page bypassed `AdminListPage` and hand-rolled its own
   wrapper, an extra `max-w-*` on the container, a stray padding class, or a
   skeleton row with a non-standard height (`h-12` is the house style).
3. Fix the page to route through `<AdminListPage>` (see
   `admin-list-states.md`) rather than updating the baseline — the whole
   point is that pages stay in lockstep.
