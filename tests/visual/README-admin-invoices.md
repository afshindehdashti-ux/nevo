# Visual Regression — /admin/invoices (themes × breakpoints)

Guards the most layout-dense admin screen against the regressions we already
fixed once: mobile column overflow, clipped dropdowns/tooltips, washed-out
currency and muted text, and skeleton/empty-state layout shift.

## What runs

`scripts/visual/admin-invoices-visual.py` loads `/admin/invoices` for every
combination of:

- **Themes** — `dark` (`.dark` on `<html>` + `prefers-color-scheme: dark`) and
  `light` (no `.dark` + `prefers-color-scheme: light`).
- **Breakpoints** — 390 (mobile cards), 768 (tablet), 1280 (laptop table),
  1536 (wide).

and asserts three things per combination:

1. **Pixel baseline** — `<main>` screenshot vs the approved PNG in
   `tests/visual/baselines/admin-invoices/<theme>-<name>-<width>.png`. Fails on
   a size change or a mean per-channel diff above `2/255`.
2. **No horizontal overflow** — `document.scrollWidth <= window.innerWidth`.
3. **Contrast** — WCAG 2.1 ratio for the page title, helper copy, invoice
   links, money cells, status badges and table/definition labels; 4.5:1 for
   normal text, 3.0:1 for large/bold. Colors are resolved through a canvas so
   Tailwind v4 `oklch()`/`oklab()` values and translucent layers composite
   correctly. The run fails if fewer than 4 probes resolve, so stale selectors
   can't silently disable the gate.

Data is deterministic: the Supabase `invoices` REST call is intercepted and
fulfilled with a fixed three-row fixture (sent / paid / overdue, USD + EUR), and
animations plus transitions are disabled.

## Run

```bash
# dev server running on http://localhost:8080, signed in as an admin
bun run test:visual:admin-invoices
```

Auth comes from the injected Lovable preview session
(`LOVABLE_BROWSER_AUTH_STATUS=injected`) or a minted
`~/.cache/lovable-auth/session.json` (`LOVABLE_SESSION_FILE` overrides).

## Approve an intentional change

```bash
bun run test:visual:admin-invoices:update
```

Review the regenerated PNGs under `tests/visual/baselines/admin-invoices/`
before committing them.

## Artifacts

Actual screenshots and amplified diffs land in
`tests/visual/diffs/admin-invoices/` (not committed).

Exit codes: `0` pass, `1` regression, `2` harness error (e.g. no session).
