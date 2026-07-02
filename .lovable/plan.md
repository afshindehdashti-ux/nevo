## Current State (verified this turn)

- URL routing, RTL, hreflang, canonical, OG images, language switcher and the global locale-link guard are already **complete and working** across all 10 locales.
- Locale JSONs currently hold **~333 keys per language** — enough for the site chrome (header, footer, hero, contact, project inquiry) but nothing else.
- **32 of 32 route bodies contain zero `useTranslation` calls.** Roughly **20,000 lines of hardcoded English** live inside route files, plus configurators, calculators, AI Assistant, Knowledge Hub, and downloads.
- Realistic scope: **~3,500–4,500 unique strings**, each needing 10 native translations = **35k–45k professional engineering translations**.

This cannot honestly be completed in a single turn. Doing it in one shot would either (a) blow the context window mid-file and leave the app broken, or (b) produce shallow machine-tone translations that violate the "native engineering copywriter" quality bar you set. I want your sign-off on scope + sequencing before I start.

## Recommended Phased Execution

Each phase leaves the site fully building, fully bilingual for what's shipped, and independently reviewable.

**Phase 1 — Global chrome & shared surfaces** *(already ~80% done)*
Verify + finish: `SiteHeader` mega-menu items, `SiteFooter` columns, `AnnouncementBar`, cookie banner, 404, toasts, form validation messages, loading/empty states, pagination, common Button labels. Add `common` namespace with shared verbs (Learn more, Download, Get quote, Read article, Back, Next, Submit, Loading, Error…).

**Phase 2 — Top revenue routes** (highest traffic, highest conversion)
`index`, `about`, `contact`, `project-inquiry`, `solutions/index`, `solutions/factory-development`, `solutions/production-lines`, `solutions/sandwich-panels`, `solutions/raw-materials`, `solutions/engineering-consultancy`, `industries`.

**Phase 3 — Tools & configurators**
`product-configurator` (1,380 lines — every option, material, thickness, tooltip, generated report line), `panel-thickness-calculator`, `investment-calculator`, `factory-layout-generator`, `engineering-tools` index, `ai-project-estimator`. Includes result-report copy and PDF-export strings.

**Phase 4 — Knowledge & AI surfaces**
`knowledge-hub` index, `knowledge-hub/$slug` article template + all article JSON content, `ai-assistant` (UI shell + system prompt localization so the model answers in the active language), `download-center` (categories, filters, metadata), `pir-vs-rock-wool`, `factory-layouts`.

**Phase 5 — Corporate & legal**
`careers`, `investors`, `sustainability`, `research-innovation`, `quality`, `installation-commissioning`, `customer-portal`, `partner-portal`, `privacy`, plus new `terms` and `cookies` pages.

**Phase 6 — Sitewide QA sweep**
Playwright audit across 10 locales × all routes, flag any residual English tokens, tighten register per language (Arabic MSA, Simplified Chinese engineering register, German compound nouns, Turkish suffix agreement, French/Italian/Spanish/Portuguese EPC vocabulary), verify RTL mirroring on every route, regenerate localized sitemap entries.

## Technical Approach

- Extend `src/i18n/locales/{lang}.json` with one namespace per route (`about`, `productConfigurator`, `knowledgeHub`, …). Keeps diffs reviewable and lazy-loadable later.
- Refactor route by route: extract every literal → `t("ns.key")`, seed English, then generate the other 9 languages using professional industrial-engineering register (not literal MT).
- For AI Assistant: pass the active locale into the server route's system prompt (`Respond in ${localeName}. Use native industrial engineering terminology.`) so streamed answers match the UI language.
- For configurator/calculator generated reports: build strings from templated keys with ICU interpolation so numbers/units render correctly per locale (Arabic-Indic digits optional, Chinese unit spacing, French non-breaking spaces, etc.).
- Expand `scripts/i18n-coverage.mjs` to also flag **hardcoded literals inside JSX** (not just missing keys), so CI catches regressions.
- Update `scripts/check-seo-metadata.mjs` after each phase.

## Deliverable Per Phase

Every phase ends with: build green, `check:all` green, Playwright spot-check across `en/ar/zh/de` for the phase's routes, and a short written status report.

## What I Need From You

Please confirm one of:

1. **Approve the phased plan** and I start Phase 1 verification + Phase 2 (top revenue routes) this turn, then continue phase-by-phase in follow-up turns.
2. **Compress to fewer phases** (e.g. combine 2+3, or 4+5) — faster but larger single turns.
3. **Change priority order** (e.g. do AI Assistant + configurators before corporate pages, or vice versa).
4. **Different quality bar** — if "professional native engineering copywriter" tone across 10 languages is not required and high-quality machine translation is acceptable, the work compresses roughly 3×.

Reply with a number (or a custom variant) and I'll execute.