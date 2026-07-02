
## Goal

Every leaf route emits an absolute, self-hosted `og:image` (and matching `twitter:image`) that renders identically on every locale. No route falls back to the hosting-injected screenshot.

## Approach

`og:image` is language-agnostic — the same image works for `/en/about` and `/ar/about`. The URL still needs to be absolute (`https://nevoindustrial.com/...`) and self-referencing per route, but the *asset* is shared across locales.

Two-tier strategy:

1. **Reuse existing hero art wherever a route already has one.** `src/assets/` already contains route-specific hero photography (`hero-nevo-line.jpg`, `hero-production-line.jpg`, `engineering-philosophy.jpg`, plus the `industries/`, `panels/`, `factory-layout/`, `pir-vs-rockwool/`, `raw-materials/` folders, etc.). Map each route to its most representative existing image.
2. **Generate a small set of category defaults** (5 images at 1200×630, DSLR industrial style, on-brand) for routes that don't have a clear hero yet: `brand-default`, `solutions-default`, `industries-default`, `knowledge-default`, `corporate-default`. Every remaining route falls back to one of these — never to the generic hosting screenshot.

## Implementation

### 1. Centralize the mapping (`src/lib/og-images.ts`)

```ts
import { SITE } from "./seo";
import heroLine from "@/assets/hero-nevo-line.jpg";
// ...other imports

export const OG_DEFAULT = `${SITE.url}${brandDefault}`;

export const OG_IMAGES: Record<string, string> = {
  "/":                       `${SITE.url}${heroLine}`,
  "/about":                  `${SITE.url}${engineeringPhilosophy}`,
  "/solutions":              `${SITE.url}${solutionsDefault}`,
  "/solutions/sandwich-panels": `${SITE.url}${panelsHero}`,
  "/solutions/production-lines": `${SITE.url}${heroProductionLine}`,
  // ...one entry per route
};

export function ogImageFor(path: string) {
  return OG_IMAGES[path] ?? OG_DEFAULT;
}
```

Vite fingerprints the imports, so URLs stay cache-busted.

### 2. Extend `buildSeo` (`src/lib/seo.ts`)

Add an optional `image` field. When provided (or when a route-path lookup hits), emit:

```ts
{ property: "og:image", content: absoluteImage },
{ property: "og:image:width", content: "1200" },
{ property: "og:image:height", content: "630" },
{ property: "og:image:alt", content: title },
{ name: "twitter:image", content: absoluteImage },
```

Because these live in `meta` (deduped by property), it's safe to also set a sitewide `og:image` fallback in `__root.tsx` — but we won't, to respect the "leaf only" rule. Instead, every leaf route calls `buildSeo({ ..., image: ogImageFor(URL_PATH) })`, guaranteeing coverage without root pollution.

### 3. Update all 31 leaf route files

Small mechanical change per file — one added argument to the existing `buildSeo(...)` call. No route logic changes.

### 4. Generate the 5 category default images

Ultra-photorealistic DSLR industrial photography at 1200×630 (OG-optimal), saved to `src/assets/og/`:
- `og-brand-default.jpg` — NEVO factory floor wide shot
- `og-solutions-default.jpg` — sandwich panel line close-up
- `og-industries-default.jpg` — cold-storage warehouse exterior
- `og-knowledge-default.jpg` — engineering blueprints + panel cross-section
- `og-corporate-default.jpg` — modern industrial HQ facade

### 5. Verify

- `bun run build` (typecheck)
- `curl` a sampling of routes across 3 locales, grep for `og:image` and confirm absolute URL + matching `twitter:image`
- Re-run the Playwright SEO audit; expect 31/31 og:image coverage per locale

## Notes for you

- **Crawler caches:** Facebook, LinkedIn, X, and Slack cache previews. New images won't appear in already-shared links until each platform re-fetches — force refresh via their link-preview debuggers.
- **No locale-specific images:** using the same asset for all 10 locales is standard practice; the surrounding OG text is already localized via `t()`.
- **Approval:** Generating 5 images incurs image-gen cost. If you'd rather I skip #4 and point every uncovered route at a single existing brand image (e.g. `hero-nevo-line.jpg`), say so and I'll drop that step.
