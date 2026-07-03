# NEVO Industrial — Content & SEO Master Architecture

Companion to `docs/ia/`. The IA defines *where* content lives; this document defines *what* is written, *how* it is structured, and *how* it earns organic authority. Scope: 1,000+ articles, 500+ technical documents, 300+ FAQs, 100+ case studies, 100+ market pages — with zero structural change required to scale.

---

## 1. Mission & Editorial Principles

**Mission.** Become the first trusted destination for anyone researching sandwich panels, factory development, raw materials, production lines, and industrial engineering.

**Non-negotiables.**
- Education before selling. Every page solves a real customer problem.
- Technical accuracy over marketing polish. Engineers are the primary reader; buyers and investors are secondary.
- No SEO-only content. If it does not teach, it does not ship.
- No hype, no unverifiable claims, no keyword stuffing.
- Voice: professional, technical, confident, clear.

**Reading order per page.** Engineer → Procurement → Investor → Search engine. If copy fails the engineer, it fails the page.

---

## 2. Content Pyramid

Four tiers. Every URL in `docs/ia/url-map.md` belongs to exactly one tier.

| Tier | Purpose | Examples | Target length | Cadence |
|---|---|---|---|---|
| **L1 — Pillar** | Definitive guide to a broad topic. Anchors a cluster. | Complete Guide to Sandwich Panels · Factory Development · Production Lines · Raw Materials · Industrial Engineering · Cold Storage · Fire-Rated Panels | 3,500–6,000 words | ~15 total, refreshed quarterly |
| **L2 — Cluster** | Deep sub-topic that links up to a pillar and down to supporting articles. | PIR · PUR · Rock Wool · PPGI · Roof Panels · Wall Panels · Cold Room Panels · Continuous Line · Roll Forming · Automation | 1,500–3,000 words | ~60 total |
| **L3 — Supporting** | Focused answer to a specific engineering question. | What is PIR · PIR vs PUR · Rock Wool Density Guide · PPGI Coating Types · How Sandwich Panels Are Manufactured · Factory Layout Guide · Panel Installation Guide · Energy Efficiency Guide | 800–1,800 words | 500–1,000 total |
| **L4 — Knowledge Library** | Atomic reference: FAQ entry, glossary term, datasheet, checklist, calculator input, download landing. | PIR density FAQ · Glossary: Lambda value · Datasheet: NEVO PIR 100mm · Engineering Checklist v3 | 150–800 words + asset | Unlimited |

**Rule.** Each L3 must link up to one L2 and one L1. Each L2 must link up to one L1. Pillars link down to every direct cluster child.

---

## 3. Universal Page Contract

Extends the 9-block spine in `docs/ia/page-contract.md`. Every content page renders these blocks in order (some are optional per page type — see §4):

1. **Hero** — H1, one-line promise, primary CTA, hero image.
2. **Introduction** — 2–4 sentences framing who this is for and what they'll learn.
3. **Problem** — the engineering / commercial pain being solved.
4. **Technical Explanation** — the substance. Diagrams, tables, formulas, ranges.
5. **Benefits** — quantified where possible (W/m·K, kg/m³, EI minutes, €/m²).
6. **Applications** — where it's used, linked to Industry pages.
7. **Comparison** — vs alternatives, in a table.
8. **Downloads** — datasheets, guides, checklists, calculators.
9. **FAQ** — 5–12 engineering questions (see §9).
10. **CTA** — contextual (see §11).
11. **Related Articles** — 3–6, driven by taxonomy (see §7).
12. **Related Products** — pulled from `product-family` tag.
13. **Related Services** — pulled from `solution` tag.

Optional blocks per page type: Case Studies (industry, market, project pages), Standards & Codes (raw material, industry), Cost Ranges (investment, factory pages), Timeline / Process (service pages).

---

## 4. Page Types & Templates

Each template is a JSON-serializable content model. Editors fill fields; the renderer maps them to the 9+3 spine.

| Template | Route pattern | Required blocks | Optional blocks |
|---|---|---|---|
| `pillar` | `/knowledge/{slug}`, `/solutions/{slug}` | 1–7, 9, 11–13 | Downloads, Case Studies |
| `cluster` | `/knowledge/{topic}/{slug}`, `/raw-materials/{slug}` | 1–9, 11–13 | Standards, Cost |
| `article` | `/knowledge/{topic}/{slug}` | 1–5, 9, 11 | 6–8, 12–13 |
| `product-family` | `/raw-materials/{slug}`, `/production-lines/{slug}`, `/panels/{slug}` | 1–9, 12, 13 | Standards, Case Studies |
| `industry` | `/industries/{slug}` | 1, 2, 6, 7, 9, 11, 12 | Standards, Case Studies |
| `market` | `/markets/{slug}` | see §12 | — |
| `case-study` | `/case-studies/{slug}` | see §13 | — |
| `service` | `/solutions/{slug}` | 1–5, 9, 10, 11 | Process, Timeline |
| `download-landing` | `/downloads/{slug}` | Hero, Description, Preview, Form-gated CTA, Related | — |
| `faq-entry` | `/knowledge/faq/{slug}` | Question, Answer, Related, Source | — |
| `glossary` | `/knowledge/glossary/{slug}` | Term, Definition, See Also | — |

---

## 5. Content Categories (closed vocabulary)

Extends `docs/ia/taxonomies.md`. Category is the primary editorial filter for the Knowledge Hub.

`engineering` · `raw-materials` · `production` · `applications` · `factory-design` · `investment` · `technology` · `installation` · `maintenance` · `quality-control` · `automation` · `industrial-buildings` · `market-reports` · `industry-news` · `case-studies`

Every content record MUST tag exactly one category. New categories require IA review — they change navigation surface area.

---

## 6. URL Rules

Enforces `docs/ia/url-map.md`. Additional editorial rules:

- Short. Max 3 segments after the section root. `/knowledge/pir` — not `/knowledge/raw-materials/insulation-cores/pir-boards`.
- Lowercase, hyphenated, no stop words, no dates, no IDs.
- Slug = primary keyword, singular form, ASCII only.
- Never change a published URL. Renames go through 301 in `docs/ia/redirects.md`.
- Country pages: `/markets/{iso-lowercase-country}` (e.g. `/markets/oman`, `/markets/saudi-arabia`).
- Downloads: `/downloads/{slug}` (landing) → file at `/files/{slug}.pdf`.

---

## 7. Internal Linking Model

The related-content engine reads the taxonomy graph. No manual "related links" arrays.

**Automatic surfaces on every page:**
- **Related Articles** — up to 6, same `topic` + shared `industry` or `product-family`, ranked by recency × depth-tier match.
- **Related Products** — same `product-family` tag.
- **Related Services** — same `solution` tag.
- **Relevant Industries** — pages tagged with any of this page's `industry` values.
- **Relevant Markets** — pages tagged with any of this page's `market` values.
- **Related Downloads** — same `topic` and any shared `product-family` or `industry`.
- **Related FAQs** — FAQ entries with matching `topic`.

**Manual editorial links (inside body copy):**
- Each L3 body MUST contain 3–8 inline links: 1 up to L2, 1 up to L1, 1+ lateral to sibling L3s, remainder to product / industry / download.
- Each L2 body MUST contain 5–15 inline links, at least 5 pointing to its L3 children.
- Each L1 body MUST link to every direct L2 child at least once.
- Anchor text = target's primary keyword or a natural variation. Never "click here".

**Orphan rule.** No published page has zero inbound editorial links from the same cluster within 14 days of launch.

---

## 8. SEO Per-Page Contract

Every page record MUST populate:

```yaml
primary_keyword: "pir panel"
secondary_keywords: ["pir insulation", "polyisocyanurate panel", "pir vs pur"]
search_intent: informational | commercial | transactional | navigational
meta_title: "PIR Panels: Properties, Uses & Density Guide | NEVO"   # ≤ 60 chars
meta_description: "..."                                              # ≤ 155 chars
canonical: "/knowledge/pir"
h1: "PIR Panels"
heading_outline:
  - h2: "What is PIR?"
  - h2: "Technical Properties"
    - h3: "Thermal Conductivity"
    - h3: "Density Range"
    - h3: "Fire Behaviour"
  - h2: "PIR vs PUR vs Rock Wool"
  - h2: "Applications"
  - h2: "FAQ"
schema:
  - Article           # all L1–L3
  - FAQPage           # any page with FAQ block
  - HowTo             # process / installation guides
  - Product           # product-family pages
  - BreadcrumbList    # all pages
  - Organization      # global, once, in __root
suggested_images: ["hero: PIR line", "diagram: PIR cell structure", "chart: lambda comparison"]
suggested_downloads: ["PIR datasheet", "Panel selection guide"]
internal_links_target: 8   # minimum inline
external_authoritative_refs: 1-3   # standards bodies, peer-reviewed, gov
```

**Heading hierarchy.** Exactly one H1 per page. H2s ordered by search intent. H3s only under H2s. Never skip levels.

**Title/description patterns.**
- Pillar: `{Topic}: Complete Guide | NEVO Industrial`
- Cluster: `{Topic}: {Angle} | NEVO`
- Article: `{Primary Keyword} — {Benefit or Angle}`
- Product: `{Product} — Specs, Applications, Datasheet | NEVO`
- Industry: `Sandwich Panels for {Industry} | NEVO`
- Market: `Sandwich Panels & Factory Solutions in {Country} | NEVO`

---

## 9. FAQ Strategy

Engineering-first. Marketing questions ("Why choose NEVO?") do not belong in FAQ blocks.

**Question archetypes.** Density · Lambda / U-value · Fire class · Cost per m² · Manufacturing tolerance · Compatible substrates · Installation sequence · Standards compliance · Capacity sizing · Payback period.

**Examples (from the brief).**
- What density should PIR have?
- How is Rock Wool manufactured?
- What production capacity should I choose?
- What is the difference between PUR and PIR?
- How much does a sandwich panel factory cost?

**Rules.**
- 5–12 FAQs per L1/L2, 3–6 per L3.
- Question in real user phrasing (mirror People-Also-Ask when accurate).
- Answer: first sentence answers directly, following 2–4 sentences add technical nuance and link out.
- Every FAQ block emits `FAQPage` JSON-LD.
- Standalone FAQ entries at `/knowledge/faq/{slug}` for high-volume queries.

---

## 10. Download Strategy

Downloads are lead magnets *and* SEO assets — each has a landing page indexed as `download-landing`.

| Download type | Format | Gating |
|---|---|---|
| Factory Investment Guide | PDF | Form-gated (name, company, email, country) |
| Engineering Checklist | PDF | Ungated |
| Technical Datasheet | PDF | Ungated |
| White Paper | PDF | Form-gated |
| Comparison Table | PDF / HTML | Ungated |
| Factory Planning Pack | PDF + DWG | Form-gated |
| Panel Selection Guide | PDF | Ungated |

**Rules.**
- File naming: `{slug}-v{n}.pdf`. Version bumps never break URLs.
- Every download tagged with `topic`, `product-family`, `industry`, `audience`.
- Landing page carries a preview (first 2 pages as images) + full table of contents.
- Gated forms feed CRM with UTM + page-of-origin. Never gate content that is already indexed as an HTML article.

---

## 11. Lead Generation Model

Every educational page carries **one contextual CTA**, chosen by page type. Never interrupt the reading flow.

| Page type | Primary CTA | Secondary CTA |
|---|---|---|
| Raw material pillar/cluster | Request Material Quotation | Download Datasheet |
| Production line pillar/cluster | Request Factory Proposal | Talk to an Engineer |
| Factory development / consultancy | Request Consultation | Download Investment Guide |
| Industry page | Talk to an Engineer | Download Selection Guide |
| Market page | Contact Regional Team | Download Country Brief |
| Knowledge L3 article | Talk to an Engineer | Related Download |
| Case study | Request Similar Project | — |
| FAQ / Glossary | Talk to an Engineer | — |

CTA copy is verb-first. All CTAs share one form contract (see `docs/ia/page-contract.md` §CTA).

---

## 12. Market Page Template

`/markets/{country}` — one per active country. Structure locked so 100+ markets scale without redesign.

1. Hero — country name, one-line positioning, primary CTA.
2. **Market Overview** — sector size, growth trend, source-cited.
3. **Demand Drivers** — construction, cold chain, industrial parks, government programmes.
4. **Applications** — top 3–5 use cases in this market, linked to Industry pages.
5. **Building Codes & Standards** — national fire codes, thermal regs, relevant EN / ASTM references.
6. **Climate Considerations** — temperature range, humidity, seismic zone → panel spec implications.
7. **Available Products** — filtered product cards from local inventory / production.
8. **Engineering Support** — local team, languages, response SLAs.
9. **Case Studies** — filtered by `market={country}`.
10. **Contact CTA** — regional form.

Every market page tagged `market={iso}` — feeds the related-content engine globally.

---

## 13. Case Study Template

`/case-studies/{slug}` — repeatable structure so 100+ scale.

1. Project Overview — client (or anonymised), location, sector, year, scale (m², capacity, €).
2. Challenge — the engineering / commercial constraint.
3. Engineering Solution — spec decisions, trade-offs, drawings.
4. Materials — bill of materials, linked to product pages.
5. Production — line configuration, throughput, timeline.
6. Results — measured outcomes: energy saved, throughput achieved, payback.
7. Downloads — one-page project sheet PDF.
8. Related Projects — same `industry` + `market`.

Every case study tagged `industry`, `market`, `product-family`, `solution` — powers filters on `/case-studies/`.

---

## 14. Governance

- **Editorial calendar** lives in `docs/content/calendar.md` (created when first article is scheduled).
- **Owner per pillar.** Each L1 has a named subject-matter owner accountable for accuracy and quarterly refresh.
- **Refresh cadence.** L1: quarterly. L2: semi-annually. L3: annually or on standard/spec change. Case studies: on client approval to update.
- **Deprecation.** Retired URLs 301 to nearest surviving parent. No 404s for previously indexed pages.
- **Quality gate.** Pre-publish checklist in `docs/content/checklist.md`. No page ships without: primary keyword confirmed, meta title/desc, headings validated, 3+ internal links, schema present, at least one download or CTA wired, engineer sign-off on technical claims.
- **Measurement.** Per-page KPIs: organic sessions, avg. position for primary keyword, download conversions, CTA submissions, assisted revenue. Reviewed monthly.

---

## 15. Scalability Guarantees

The system supports the target volumes without structural change because:

- **Taxonomy-driven surfaces** — hubs, filters, related content, sitemaps regenerate from tags. No hand-maintained lists.
- **Templated page types** — 11 templates cover 100% of planned content. New content = new record, not new component.
- **Flat URLs** — max 3 segments; adding a topic never deepens the tree.
- **Cluster hygiene** — the 3-tier link contract (L3→L2→L1) prevents orphaning as volume grows.
- **Automated schema** — every template emits its schema envelope; no per-page JSON-LD authoring.
- **Locked vocabularies** — new categories, industries, markets require IA review; the system rejects free-tagging.

When any single tier crosses these thresholds, revisit this doc:
- Pillars > 20 → introduce a second-level hub grouping.
- Cluster pages > 150 within one pillar → split the pillar.
- Downloads > 500 → introduce a searchable resource centre index.
- Markets > 40 → introduce regional roll-ups (`/markets/gcc`, `/markets/mena`).

---

## 16. Companion Docs

- `docs/ia/README.md` — Information Architecture master
- `docs/ia/url-map.md` — canonical URL registry
- `docs/ia/taxonomies.md` — closed vocabularies
- `docs/ia/page-contract.md` — 9-block spine
- `docs/content/templates/` — per-template field specs *(to be authored with first page of each type)*
- `docs/content/checklist.md` — pre-publish quality gate *(to be authored before first launch)*
- `docs/content/calendar.md` — editorial calendar *(to be authored when scheduling begins)*

## 17. Logo Telemetry Configuration

Header logo events (`header.logo.render` and `header.logo.error`) are controlled by three build-time environment variables. All are read by Vite at build time and clamped to safe ranges; malformed or missing values fall back to defaults.

| Variable | Type | Range | Default | Behavior |
|---|---|---|---|---|
| `VITE_LOGO_RENDER_SAMPLE_RATE` | number | `0..1` | `1` in dev, `0.05` in production | Probability that a single render event is logged per tab session. Set to `0` to disable render logging entirely. |
| `VITE_LOGO_ERROR_MAX_PER_SESSION` | integer | `0..1000` | `4` | Maximum `header.logo.error` events sent per tab session. Set to `0` to disable error logging entirely. |
| `VITE_LOGO_ERROR_MIN_INTERVAL_MS` | integer | `0..60000` | `1000` | Minimum milliseconds between two non-terminal errors of the same stage. Used to suppress duplicate bursts while preserving real-time alerting. |

These values are consumed in `src/lib/logo-telemetry-config.ts` and emitted by the client logger to `/api/public/client-log`. Events are stored in `public.header_logo_events` and forwarded to Sentry for operational alerts.
