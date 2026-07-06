# NEVO Professionalization Roadmap

Scope: English site only. No new pages, no new languages. Turn the current site into a production-ready industrial platform.

Current baseline: 406 image files (~73 MB), 32 routes, 3 tools (Panel Configurator, Factory Layout Generator, Panel Thickness Calculator). Only the Thickness Calculator is fully dynamic today. Inquiry form exists but is not wired to a backend.

---

## Phase 1 — Backend + Data Model (Foundation)

**Goal:** everything downstream (inquiry form, calculator hand-off) writes to real storage.

1. Migration: `public.project_inquiries` table
   - Columns: `id`, `created_at`, `name`, `email`, `phone`, `company`, `country`, `application`, `message`, `source_page`, `calculator_state jsonb`, `status`, `ip`, `user_agent`.
   - RLS on. Policies: `anon + authenticated` may INSERT; only `admin` role may SELECT. GRANT block per project conventions.
2. Migration: `public.download_events` (small event log for download-button clicks so "downloads" become real, trackable actions).
3. Server function `submitInquiry` (createServerFn, no auth middleware — public form). Zod validation, rate-limit by IP, writes to `project_inquiries`.
4. Server function `logDownload` for the download center.

## Phase 2 — Image Overhaul (visual replacement pass)

**Goal:** kill every poster crop, screenshot, blur, and placeholder. Replace with clean, high-res AI-generated industrial photography.

1. Audit script: enumerate every `import ... from "@/assets/..."` and every raw asset reference across all routes. Group by section (hero, industries, machinery, engineering, knowledge-hub, raw-materials, corporate, tools).
2. Delete every screenshot-style tool preview (calculator/configurator/factory-layout hero crops) — they'll be replaced by the live components themselves in Phase 3.
3. Generate a curated set of ~35–45 fresh **1536×1024 hero/section images** with `openai/gpt-image-2` premium via the agent image tool. Categories:
   - Sandwich panel manufacturing lines (continuous laminator, cutting, stacking)
   - Cold storage / freezer interiors with panels installed
   - Cleanroom pharma/food facility interiors
   - PIR/PUR/mineral wool raw materials, PPGI coils
   - Engineering / R&D / QA lab environments
   - Corporate: careers, contact, sustainability, investors
   - Industries: food, pharma, logistics, retail cold chain
4. Externalize every retained image via `lovable-assets` CLI so the repo stays lean and CDN delivery is fast. Delete original binaries from `src/assets`.
5. Add descriptive `alt` text to every `<img>` in the same edit pass — this doubles as the SEO fix.

## Phase 3 — Rebuild the two remaining tools as dynamic components

**Panel Configurator** (`$lang.product-configurator.tsx`)

- Real React state: application, core, thickness, skin gauges, colour (RAL), length, joint type.
- Live SVG cross-section (same style as Panel Thickness Calculator).
- Live spec sheet: U-value, weight/m², fire class, recommended use.
- Validation and impossible-combo guardrails (mirror Thickness Calculator patterns).
- "Send to inquiry" button that navigates to Project Inquiry with encoded state.

**Factory Layout Generator** (`$lang.factory-layout-generator.tsx`)

- Inputs: plant capacity (m³/day or panels/day), line width, panel length range, product mix (cold-room / façade / roof), site dimensions.
- Deterministic layout algorithm places: decoiler, mixing station, laminator, cooling tunnel, cutting, stacking, packaging, raw material storage, finished-goods warehouse, offices, forklift lanes.
- Renders a live scalable SVG floor plan with legend, dimensions, and area breakdown.
- Outputs: total footprint (m²), theoretical throughput, staffing estimate, energy load estimate.
- "Send layout to inquiry" CTA.

**Panel Thickness Calculator** — already dynamic; polish only: mobile layout, focus states, animation timing.

## Phase 4 — Wire tools → Project Inquiry

- Project Inquiry page reads `?config=...` (base64 JSON) query param and pre-fills a read-only "Attached configuration" card.
- All three tools' primary CTA becomes "Request engineering recommendation" and links with the encoded state.
- Inquiry form submits via `submitInquiry` server fn; success/error toast; disabled state during submit; honeypot field for spam.

## Phase 5 — Every CTA becomes real

- Sweep every `<Link>`, `<a>`, `<Button>` across all 32 routes. Any target that resolves to `#`, `javascript:void`, or a missing route gets a real destination (existing route or scroll anchor to a real section).
- "Read More / Learn More" on cards must go to the correct sub-route or knowledge-hub article.
- Download-center buttons: generate real PDF spec sheets on the fly with `jsPDF` (same pattern already used in Thickness Calculator report), OR link to a real PDF asset. Every click logs to `download_events`.

## Phase 6 — SEO, structured data, internal linking

- Per-route `head()`: unique title (<60), description (<160), og:title, og:description, og:type, canonical, og:url. og:image only on leaf routes with a real hero.
- JSON-LD: `Organization` sitewide (root), `Product` on panel/config routes, `Article` on knowledge-hub, `FAQPage` where FAQs exist, `BreadcrumbList` on deep routes.
- `sitemap.xml` regenerated from actual route list.
- Internal linking: every solution page links to relevant industries + tools; every knowledge-hub article links to related tools; footer gets a full sitemap block.
- Alt text: done in Phase 2.

## Phase 7 — Performance & Core Web Vitals

- All hero images externalized to CDN (Phase 2) — massive LCP win.
- Preload the LCP image per route via `head().links`.
- `loading="lazy"` + `decoding="async"` on all below-the-fold images.
- Explicit `width`/`height` on every `<img>` to eliminate CLS.
- Font strategy: keep the existing `<link>` in `__root.tsx`; add `font-display: swap`.
- Code-split the three heavy tool routes (they already use dynamic imports for jsPDF; extend to any charting libs).

## Phase 8 — Responsive & polish QA

Run Playwright at 375, 768, 1024, 1280, 1536 across the 12 highest-traffic routes. Capture screenshots. Fix each finding:

- Overflow rows: apply the grid + min-w-0 + shrink-0 pattern from responsive-layout-patterns.
- Clipped cards: normalize `aspect-ratio` and `object-fit`.
- Broken sticky elements, off-screen buttons, wrapped nav.
- Focus rings, tap targets ≥44px.

## Phase 9 — Final sweep

- Build passes (`bun run build`).
- Typecheck clean.
- Security scan (Cloud tables + edge fn if any).
- Trigger SEO scan, resolve findings.

---

## Technical notes

- **Storage:** Lovable Cloud (Supabase). No email notifications this pass; admin views inquiries in backend panel.
- **Images:** all AI-generated via agent `imagegen--generate_image` premium tier, then externalized to CDN via `lovable-assets`. Repo `src/assets` shrinks from 73 MB to <5 MB (only true source SVGs, .asset.json pointers).
- **No new pages, no new languages.** English content only. Existing `$lang` routes stay; only English content polished.
- **Reversibility:** each phase is a discrete commit; user can revert individually.

## Deliverable per phase

Each phase ends with: files changed listed, build green, one-line summary. I'll pause after **Phase 2** and **Phase 5** for you to sanity-check the visual direction and CTA behaviour before continuing.

## Time estimate

Long. Realistically 8–12 agent turns given image generation volume and the two tool rebuilds. I will not stop mid-phase.

---

Approve to start with **Phase 1 (backend)**, or reorder phases if you want a different starting point.
