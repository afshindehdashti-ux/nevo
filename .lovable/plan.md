
# Multilingual + International SEO Plan — NEVO Industrial

## Reality check before we start

The current site is ~22,700 lines of TSX across **38 routes**, **22 shared components**, plus a **378-line knowledge article catalog** and long-form pages (Knowledge Hub 498 lines, Engineering Guides, Calculators, Configurators, AI Assistant). Every visible string across that surface, translated **9 times** into native industrial-engineering copy — Arabic, Turkish, Russian, Portuguese, German, Spanish, French, Italian, Simplified Chinese — is on the order of **60–80k translated words per language**, i.e. ~600k words total.

That is not deliverable as one turn, and pretending otherwise would ship machine-translation slop for a brand that explicitly rejected it. I'll build the **enterprise-grade infrastructure** in this pass — routing, i18n runtime, locale switcher, RTL, hreflang, per-locale metadata, localized sitemap, AI-search structured data — and translate the **global chrome + high-traffic routes** natively. The remaining long-form pages then plug into the same system incrementally without another refactor.

## Phase 1 — Infrastructure (this pass)

### Routing
Restructure to locale-prefixed URLs:
```text
src/routes/
  __root.tsx
  $lang/                    # pathless-like folder scoped to a locale
    route.tsx               # validates lang param, sets <html lang dir>, provides context
    index.tsx               # /en, /ar, /tr, ...
    about.tsx
    contact.tsx
    knowledge-hub.tsx
    knowledge-hub.$slug.tsx
    ...all 38 routes moved under here
  index.tsx                 # 302 → /en (or Accept-Language match)
  sitemap[.]xml.ts          # emits one entry per (locale, route)
```
`$lang` is validated against `["en","ar","tr","ru","pt","de","es","fr","it","zh"]`; unknown values throw `notFound()`. The `route.tsx` loader returns `{ lang, dir }` for the whole subtree.

### i18n runtime
- Library: `i18next` + `react-i18next` (SSR-safe, supports namespaces and pluralization for CJK/RU).
- Namespace-per-surface JSON dictionaries under `src/i18n/locales/{lang}/{namespace}.json` (`common`, `nav`, `home`, `solutions`, `knowledge`, `forms`, `errors`, `seo`, …).
- Language detection order: URL segment → cookie `NEVO_LANG` → `Accept-Language` → `en`.
- Persistence: `NEVO_LANG` cookie (1 yr) written by the language switcher.

### RTL
- `route.tsx` sets `<html lang={lang} dir={lang==='ar'?'rtl':'ltr'}>` via `head()`.
- Tailwind: enable logical properties utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) project-wide; sweep components to replace `ml-*`/`pl-*`/`left-*`/`right-*` with logical equivalents in shared chrome (Header, Footer, Nav, Cards, Forms).
- Arabic font stack: `IBM Plex Sans Arabic` (headings), `Noto Sans Arabic` (body) loaded via `<link>` in `__root.tsx` under a `[lang="ar"]` selector.
- Chinese font stack: `Noto Sans SC` under `[lang="zh"]`.
- Animation directions (carousels, marquees, slide-ins) invert under `[dir="rtl"]` via CSS custom properties.

### Language switcher
- Desktop: dropdown in `SiteHeader` — flag emoji + native language name (`العربية`, `Türkçe`, `Русский`, `中文`, …), current locale highlighted, keyboard-navigable, ARIA-compliant.
- Mobile: full-screen sheet inside `SiteHeader`'s existing mobile menu with the same list.
- Behavior: rewrites the current pathname's leading `/xx` segment to the chosen locale and persists to cookie.

### International SEO
- `head()` on every route builds:
  - `<link rel="alternate" hreflang="{lang}" href="{origin}/{lang}{path}">` for **all 10 locales** + `hreflang="x-default"` → `/en{path}`.
  - `<link rel="canonical" href="{origin}/{lang}{path}">` (self-referential per locale).
  - Localized `og:title`, `og:description`, `og:locale` (`en_US`, `ar_AE`, `tr_TR`, `ru_RU`, `pt_BR`, `de_DE`, `es_ES`, `fr_FR`, `it_IT`, `zh_CN`), `og:locale:alternate` for the others.
  - Localized Twitter Card metadata.
- `src/routes/sitemap[.]xml.ts`: one `<url>` per (locale, route), each with a full `<xhtml:link rel="alternate" hreflang>` block per Google spec.
- `public/robots.txt`: allow all; reference `/sitemap.xml`.

### AI-search & entity optimization
- Sitewide `Organization` JSON-LD in `__root.tsx` with `@id`, `sameAs` (LinkedIn/YouTube/etc. if provided), `knowsAbout` (PIR panels, sandwich panels, rock wool, continuous laminators, factory engineering), `areaServed` (10 markets), `availableLanguage` (all 10 BCP-47 codes).
- `WebSite` JSON-LD with `inLanguage`.
- Per-route `BreadcrumbList`, `Article` on knowledge posts, `Product` on panels/lines, `FAQPage` on FAQs, `TechArticle` on engineering guides — all localized.
- Localized answer-first paragraphs (definition → specifications → application) in translated copy for LLM retrievability.

## Phase 2 — Native translation (this pass covers items 1–3)

Delivered natively (professional industrial-engineering register) in all 10 languages:

1. **Global chrome** — SiteHeader, SiteFooter, mobile nav, cookie banner, 404/500, common CTAs, form labels, validation & error messages, success toasts, AI Assistant launcher.
2. **Home page** — hero, WhyNevo, FeaturedFactory, Markets, Testimonials, all CTAs.
3. **Top revenue routes** — About, Contact, Project Inquiry (all fields + validation), Solutions index, Sandwich Panels, Production Lines, Engineering Consultancy, PIR vs Rock Wool, Industries, Quality, all SEO metadata for these routes.

## Phase 3 — Long-form incremental (subsequent turns)

Wired into the same i18n system but translated in follow-up passes so each gets professional review:

- Knowledge Hub (all articles in `knowledge-articles.ts`)
- Engineering Guides
- Downloads Center descriptions
- Calculators (Panel Thickness, Investment, Factory Layout Generator)
- Product Configurator option strings
- AI Assistant system prompts per locale
- Careers, Investors, Sustainability, Research & Innovation, Partner/Customer Portals, Privacy

Each is a mechanical "add JSON dictionary + swap literals for `t()` calls" pass — no more architecture.

## What you'll see after this pass

- Every URL under `/{lang}/…`; `/` redirects to preferred locale.
- Working language switcher in header (desktop + mobile), persists across visits.
- Arabic renders full RTL with proper Arabic typography; Chinese with Noto Sans SC.
- All chrome + home + top routes read natively in all 10 languages.
- Google Search Console-valid hreflang across every page.
- Localized sitemap at `/sitemap.xml` with per-locale alternates.
- Localized Organization + WebSite + per-page schema for AI search engines.
- Any not-yet-translated long-form page still functions — it falls back to English inside the localized shell — so nothing breaks, and Phase 3 fills the gaps without further refactor.

## Technical stack additions
- `i18next`, `react-i18next`, `i18next-browser-languagedetector`
- No new server dependencies — dictionaries are static JSON bundled per locale
- Tailwind logical-property utilities (built into v4)

## Confirm before I start
1. Locale list & default locale (English) — confirmed above, ✅ proceed?
2. Region mapping for `og:locale` — using `pt_BR` (Brazil), `es_ES` (Spain), `zh_CN` (Simplified). If you want `pt_PT`, `es_MX`, or `zh_TW` instead, say so.
3. Phase 3 scope acceptable? (Chrome + top routes now, long-form in follow-up turns to keep translation quality high.)
