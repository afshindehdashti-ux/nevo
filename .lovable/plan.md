## Goal

Every page must declare a **self-referencing canonical URL that includes its locale prefix** (`https://nevoindustrial.com/{lang}{path}`), and the matching `og:url` must agree. Today all 300 pages canonicalize to `https://nevoindustrial.com/<path>` with no locale, causing Google to collapse the 10 locales into one and drop 9 translations.

## Changes

### 1. `src/lib/seo.ts` — teach `buildSeo` about locale

- Add a required `lang: LocaleCode` field to `SeoInput`.
- Build `absolutePath` as `${SITE.url}/${lang}${path}` (path `"/"` becomes just `/${lang}`).
- Use that absolute URL for both `og:url` and `<link rel="canonical">` — guaranteeing they self-reference.
- Rewrite the hreflang loop so every locale (including `en`) uses the `/{code}` prefix; `x-default` points to `/en{path}`. This matches the actual URL structure and fixes the current inconsistency where `en` had no prefix.

### 2. Every route's `head()` — pass `params.lang` through

TanStack Router already provides `{ params }` to `head()`. For each of the ~31 route files under `src/routes/$lang.*.tsx`:

- Change `head: () => ({ ... })` (or `head: ({ loaderData }) => ...`) to `head: ({ params }) => ...`.
- Pass `lang: params.lang` into every `buildSeo({ ... })` call.
- Routes that call `buildSeo` twice (`partner-portal`, `ai-project-estimator`, `customer-portal`) get `lang` on both calls.

### 3. `src/routes/$lang.solutions.index.tsx` — fix the hand-rolled head

This route bypasses `buildSeo` and puts a `{ rel: "canonical", ... }` object inside the `meta` array (invalid — canonicals belong in `links`), which is why it emitted no canonical at all in the audit. Replace with a standard `buildSeo({ title, description, path: "/solutions", lang: params.lang })` call so it gets the same locale-prefixed canonical + full hreflang set as every other route.

### 4. Dynamic knowledge-hub route

`src/routes/$lang.knowledge-hub.$slug.tsx`'s `head({ params, loaderData })` needs the same treatment — pass `lang: params.lang` and let `path` continue to include the slug.

## Verification

After the edits:
- `bun run build` must succeed.
- Re-run the SEO scan script (`/tmp/seo_report.py`) and confirm:
  - Every canonical of the form `https://nevoindustrial.com/{lang}{path}` (300/310, plus /solutions now covered → 310/310).
  - `og:url` matches canonical on every page.
  - hreflang set unchanged (still 10 locales + x-default, all locale-prefixed).

## Out of scope

Not touching translations, the missing `og:image` on 27 routes, or any UI. Pure metadata correction.

## Note for the user

Search engines and social platforms cache metadata. After deploy, the new canonicals will only take effect as crawlers re-fetch each URL. Google Search Console's URL Inspection tool can force a recrawl per URL; Facebook/LinkedIn have link preview debuggers that do the same.