
## Goal

Add a CI-runnable script that crawls every route × every locale and fails with a non-zero exit code if any page is missing `<title>`, `<meta name="description">`, `<link rel="canonical">`, `og:image`, or `twitter:image`. Wire it into `package.json` so CI (and the local build gate) can invoke it.

## New file: `scripts/check-seo-metadata.mjs`

Node script (no new dependencies — uses built-in `fetch` + a tiny regex extractor, matching the style of the existing `check-links.mjs` and `i18n-coverage.mjs`).

Behavior:
1. Boot the dev server if `SEO_CHECK_BASE_URL` isn't provided:
   - Spawn `vite dev --port 4321 --host 127.0.0.1` as a child process, poll `/` until 200, then run checks. Kill on exit.
   - If `SEO_CHECK_BASE_URL` is set (CI can point at a pre-built preview server), skip the spawn.
2. Enumerate routes from a single source of truth: a constant `ROUTES` array in the script (31 canonical paths — same set already validated in the OG-image audit) and `LOCALES = ["en","ar","tr","ru","pt","de","es","fr","it","zh"]`.
3. For each `${locale}/${path}`:
   - `fetch` the HTML.
   - Extract with regex (case-insensitive):
     - `<title>...</title>` — non-empty, not equal to a known fallback set (`"Lovable"`, `"NEVO Industrial"` bare root, etc. — configurable).
     - `<meta name="description" content="...">` — non-empty.
     - `<link rel="canonical" href="...">` — must exist AND must contain `/${locale}/` (or equal site root for `/` → `/${locale}`).
     - `<meta property="og:image" content="...">` — must exist, absolute `https://` URL.
     - `<meta name="twitter:image" content="...">` — must exist.
4. Collect failures into `{ locale, path, missing: [...], canonicalMismatch?: string }`.
5. Print a grouped report:
   ```text
   ✗ /ar/knowledge-hub          missing: og:image, twitter:image
   ✗ /zh/solutions              canonical mismatch: expected /zh/ prefix, got /solutions
   ```
   Followed by a per-locale summary line (`ar: 30/31 pass`).
6. Exit code:
   - `0` if zero failures.
   - `1` if any failure.
   - `--warn-only` flag prints report but exits `0` (matches `check:i18n:warn` convention).
   - `--json` flag emits machine-readable JSON for CI artifact upload.

## `package.json` script additions

Add under `scripts`:
```json
"check:seo": "node scripts/check-seo-metadata.mjs",
"check:seo:warn": "node scripts/check-seo-metadata.mjs --warn-only",
"check:seo:json": "node scripts/check-seo-metadata.mjs --json"
```

Optionally chain into a combined gate:
```json
"check:all": "npm run check:i18n && npm run check:seo"
```

## Technical details

- No new dependencies. Uses Node ≥ 18 built-in `fetch`, `node:child_process`, `node:net` for the port probe.
- Route list lives at the top of the script as a plain array so contributors adding a new route add one line — the script auto-multiplies by 10 locales.
- Regex extractor deliberately tolerates attribute reordering (`content` before `name`, single vs double quotes) — mirrors the Playwright-based audit already run manually against 310 pages.
- Runtime: ~5–8 s for 310 requests against a warm dev server; suitable for a pre-push hook or CI job.
- No changes to route files or `seo.ts` — this is purely a verification layer.

## Out of scope

- Wiring into a GitHub Actions / Cloudflare Pages workflow file (the project has no `.github/workflows/` yet; the npm script is the CI-agnostic contract).
- Validating `hreflang` completeness (already covered by the earlier audit; can be a follow-up `check:seo:hreflang`).
- Rescanning the seo_chat findings — separate tool surface.
