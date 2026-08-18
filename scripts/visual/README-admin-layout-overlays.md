# Admin layout — overlay & z-index visual regression

`scripts/visual/admin-layout-overlays.py` pins the authenticated admin shell
(CrmSidebar + sticky header + AI Assist launcher) so overlay/stacking bugs are
caught before they reach the preview.

## Why

Two regression classes already hit this app:

1. **Public chrome leaking into backend routes** — `AIAssistantLauncher`,
   `StickyMobileCTA` and `CookieConsent` are bottom-anchored `fixed` elements
   that land exactly on the sidebar footer.
2. **z-index drift** — the sticky header (`z-10`), desktop sidebar (`z-10`,
   rail `z-20`), mobile sheet (`z-50`) and AI Assist FAB (`z-40`) share one
   stacking context. A bumped z-index or a new full-width `fixed` bar silently
   covers admin navigation.

## What it checks

Per case (breakpoint × sidebar state — mobile sheet, desktop expanded, desktop
collapsed at 390 / 768 / 1280 / 1536):

1. **Pixel baseline** — screenshot of the sidebar compared against
   `tests/visual/baselines/admin-layout-overlays/`; fails above a mean
   per-channel diff of `2.0`. The session-dependent profile block in the footer
   is masked so baselines are account-agnostic.
2. **Occlusion** — `elementFromPoint` at three points of the sidebar footer,
   header, first/last nav link, the trigger and the app header must resolve
   inside that region. Anything else is a covering overlay. (Trigger + app
   header are skipped in the mobile sheet state, where the scrim covers them by
   design.)
3. **Stacking inventory** — every visible `fixed`/`sticky` element intersecting
   the sidebar is classified; unknown layers fail. New overlays are opt-in via
   `ALLOWED_OVERLAYS`.
4. **Leaked public chrome** — the marketing CTA selectors (kept in sync with
   `e2e/backend-cta-gate.spec.ts`) must not exist at all.
5. **Overflow** — `scrollWidth` must not exceed the viewport.

## Running

```bash
# Prereq: dev server on http://localhost:8080 + an authenticated admin session
# (LOVABLE_BROWSER_AUTH_STATUS=injected, or `lovable auth-session --json`).
npm run test:visual:admin-layout

# Approve intentional visual changes
npm run test:visual:admin-layout:update

# Harness self-test: paints a rogue fixed bottom bar; every assertion must fire
VISUAL_INJECT_OVERLAY=1 npm run test:visual:admin-layout
```

Exit codes: `0` pass, `1` regression, `2` harness error.
Artifacts (actual PNGs, diff PNGs, `*.layers.json` stacking dumps) land in
`tests/visual/diffs/admin-layout-overlays/` (git-ignored).

## When it fails

- **"covered at (x,y) by …"** — a real overlay is on top of admin chrome. Fix
  the overlay (gate it with `useIsBackend()`, or lower its z-index); do not
  refresh the baseline.
- **"unexpected fixed layer over the sidebar"** — a new overlay was introduced.
  If it is intentional and non-blocking, add a signature branch in
  `INSPECT_JS`'s `signature()` and list it in `ALLOWED_OVERLAYS`.
- **"mean pixel diff"** — inspect the `.diff.png`; refresh baselines only when
  the change was deliberate.
