
# NEVO Industrial — Information Architecture v1

Deliverable: a complete IA blueprint. No visual pages will be built in this step. Once approved, this becomes the routing map, content model, and SEO spine for every subsequent design prompt.

Two artifacts will be produced in the repo (docs only, no page redesign):

- `docs/ia/README.md` — the master IA (everything below).
- `docs/ia/url-map.md` — the flat URL registry used by developers, editors, and the sitemap generator.

---

## 1. Strategic frame

Positioning: the definitive global engineering platform for the sandwich panel industry — factories, machinery, materials, panels, and knowledge, unified under one authority.

Business objectives → primary conversion events:
- Factory Project inquiry
- Engineering Consultancy inquiry
- Raw Material RFQ
- Production Line RFQ
- Finished Panel RFQ
- Distributor application
- Technical Support ticket
- Download (lead-magnet, gated where appropriate)

Authority objectives → non-conversion KPIs: organic sessions, backlinks, average pages per session in `/knowledge/`, download count, branded search growth in target markets.

---

## 2. Audience → Goal → Entry point matrix

| Audience | Primary goal | First-touch entry | Primary CTA |
|---|---|---|---|
| Investor | Build a factory | `/solutions/factory-development/`, `/knowledge/factory-cost/` | Request Feasibility Study |
| Factory Owner | Modernize / expand | `/solutions/production-optimization/`, `/production-lines/modernization/` | Request Audit |
| Factory Manager | Fix a production issue | `/solutions/factory-audits/`, `/knowledge/production-technology/` | Book Technical Call |
| Production Manager | Improve OEE / quality | `/solutions/automation/`, `/production-lines/automation/` | Request Line Assessment |
| Engineering Consultant | Reference / partnership | `/knowledge/engineering-library/`, `/company/partners/` | Become a Partner |
| Construction Co. / Contractor | Buy panels | `/finished-panels/*`, `/industries/*` | Request Panel Quote |
| Architect | Specify panels | `/finished-panels/architectural/`, `/downloads/cad-drawings/` | Download CAD + Datasheet |
| Distributor | Represent NEVO | `/company/partners/`, `/markets/{country}/` | Apply as Distributor |
| Raw Material Buyer | Source PIR/PPGI/etc. | `/raw-materials/*` | Request Material RFQ |
| Developer / Gov. Projects | Turnkey capability | `/solutions/factory-development/`, `/case-studies/factory-projects/` | Request Proposal |

Every persona has a pathway ribbon on the homepage ("I want to…") that lands them on the correct hub.

---

## 3. Top-level navigation (Mega Menu, max 7)

Visible header items (locked at 7):

1. Solutions
2. Products
3. Industries
4. Knowledge
5. Markets
6. Company
7. Contact

`Products` is a mega-menu supercluster that contains three product families: Raw Materials, Production Lines, Finished Panels. Keeping them under one header keeps the top bar at 7 while preserving deep hierarchy inside the menu. Download Center, Case Studies, and FAQ live inside Knowledge. Careers lives inside Company. Global Search sits in the header rail with a persistent icon.

Mega-menu columns (per top item):

- Solutions: overview link + 8 solution children + featured case study card + "Talk to an Engineer" CTA.
- Products: three columns (Raw Materials / Production Lines / Finished Panels), each listing its children, plus a featured RFQ card.
- Industries: two columns of 10 industries + featured project card.
- Knowledge: Guides / Technical Library / Downloads / Case Studies / FAQ / News + featured article card.
- Markets: region → country grid + "Become a Distributor" CTA.
- Company: About / Why NEVO / Leadership / Engineering Process / Global Network / Partners / Careers + brand card.
- Contact: primary CTA button (no dropdown).

Mobile: same taxonomy, delivered as a two-level accordion. Persistent bottom bar with Call · WhatsApp · RFQ.

---

## 4. Canonical URL structure

Rules:
- Lowercase, hyphenated, trailing slash on directories.
- Two-level max for hubs, three-level max for detail pages.
- Country codes use ISO where possible (`saudi-arabia`, `uae`).
- Knowledge is flat under `/knowledge/{slug}/` — categories are taxonomy, not URL segments — so 1000+ articles never require nav redesign.
- Downloads are flat under `/downloads/{slug}/` with the same rationale.
- Legal/utility pages under `/legal/…`.

Complete URL map (this is the flat registry that will drive the sitemap):

```text
/
/solutions/
/solutions/factory-development/
/solutions/engineering-consultancy/
/solutions/factory-audits/
/solutions/production-optimization/
/solutions/automation/
/solutions/commissioning/
/solutions/training/
/solutions/technical-support/

/raw-materials/
/raw-materials/pir/
/raw-materials/pur/
/raw-materials/ppgi/
/raw-materials/gi/
/raw-materials/aluzinc/
/raw-materials/rock-wool/
/raw-materials/adhesives/
/raw-materials/sealants/
/raw-materials/accessories/
/raw-materials/consumables/

/production-lines/
/production-lines/continuous/
/production-lines/discontinuous/
/production-lines/roll-forming/
/production-lines/pu-injection/
/production-lines/rock-wool/
/production-lines/cutting-systems/
/production-lines/packaging/
/production-lines/automation/
/production-lines/modernization/
/production-lines/spare-parts/

/finished-panels/
/finished-panels/roof/
/finished-panels/wall/
/finished-panels/cold-room/
/finished-panels/fire-rated/
/finished-panels/clean-room/
/finished-panels/architectural/

/industries/
/industries/cold-storage/
/industries/food-processing/
/industries/pharmaceutical/
/industries/industrial-buildings/
/industries/commercial-buildings/
/industries/warehouses/
/industries/modular-buildings/
/industries/clean-rooms/
/industries/agriculture/
/industries/logistics/

/knowledge/                                (hub, filterable)
/knowledge/{article-slug}/                 (flat, 1000+ scale)
/knowledge/topic/{topic-slug}/             (taxonomy landing, e.g. /knowledge/topic/pir/)
/knowledge/type/{guide|article|report}/    (content-type taxonomy)

/downloads/                                (hub, filterable)
/downloads/{download-slug}/                (flat, 100+ scale)
/downloads/category/{cat-slug}/            (taxonomy landing)

/case-studies/                             (hub, filterable)
/case-studies/{project-slug}/              (flat, 100+ scale)
/case-studies/category/{cat-slug}/

/faq/                                      (hub, categorized)
/faq/{category-slug}/                      (category landing with all Q&A)

/markets/
/markets/{country-slug}/                   (100+ scale country pages)
/markets/region/{region-slug}/             (rollup, e.g. /markets/region/africa/)

/company/
/company/about/
/company/why-nevo/
/company/leadership/
/company/engineering-process/
/company/global-network/
/company/partners/
/company/careers/
/company/careers/{job-slug}/

/contact/
/contact/rfq/                              (multi-step RFQ router)
/contact/distributor/
/contact/support/
/contact/media/

/search/                                   (global search results)

/legal/privacy/
/legal/terms/
/legal/cookies/
/legal/quality-policy/

/sitemap.xml
/robots.txt
```

Redirect policy: any legacy or shorter alias (e.g. `/pir/`) 301s to its canonical URL. Trailing-slash canonicalization is enforced at the edge.

---

## 5. Content taxonomies (the scalability engine)

Rather than nesting 1000 articles under menu items, all long-tail content is flat and connected via **taxonomies**. Every taxonomy is a first-class filter, a related-content driver, and a landing-page generator.

Shared taxonomies (apply across Knowledge, Downloads, Case Studies, News):

- `topic` — pir, pur, rock-wool, ppgi, gi, aluzinc, adhesives, fire-rating, energy-efficiency, factory-design, factory-cost, machinery, production-technology, installation, maintenance, market-report.
- `industry` — mirrors `/industries/*`.
- `product-family` — raw-materials, production-lines, finished-panels.
- `product` — mirrors specific product slugs (`pir`, `continuous-line`, `cold-room-panel`, …).
- `solution` — mirrors `/solutions/*`.
- `market` — country slugs.
- `audience` — investor, factory-owner, engineer, architect, distributor, buyer, contractor.
- `content-type` — guide, article, whitepaper, datasheet, brochure, checklist, cad, report, case-study, faq, news.
- `language` — en (default), ar, ru, tr, fr (future).
- `stage` — awareness, evaluation, decision (drives CTA choice).

Every content item is tagged with 1–N of each. Taxonomy landing pages are auto-generated at `/knowledge/topic/{slug}/`, `/downloads/category/{slug}/`, and used as the source of "Related …" blocks on every page.

Content model (fields common to all long-form entries): `title`, `slug`, `summary`, `hero_image`, `body_blocks[]`, `taxonomies{...}`, `related_manual[]`, `downloads[]`, `faqs[]`, `cta_variant`, `author`, `reviewed_by_engineer`, `published_at`, `updated_at`, `reading_time`, `schema_type`.

---

## 6. Universal page contract

Every hub and detail page implements the same 9-block spine so editors, designers, and SEO share one mental model:

1. Hero — H1, one-line value, primary CTA, secondary CTA, breadcrumb, hero visual.
2. Problem — the pain this page addresses, in the reader's language.
3. Solution — what NEVO delivers, in structured form.
4. Benefits — 3–6 measurable outcomes.
5. Applications — which industries, panels, or lines this connects to (auto-linked).
6. Downloads — related datasheets, brochures, CAD (auto + manual).
7. Related Articles — 3–6 from Knowledge (auto by taxonomy).
8. FAQ — 4–8 questions with FAQPage JSON-LD.
9. CTA — page-specific primary conversion (RFQ, feasibility, consult, download).

Additional cross-cutting elements on every internal page:
- Breadcrumb (BreadcrumbList JSON-LD).
- "Related Markets" strip where relevant.
- "Related Case Studies" strip where relevant.
- Sticky right-rail CTA on desktop for product/solution pages.

---

## 7. Page-type templates

Each template inherits the universal contract and adds type-specific blocks.

- **Home** — pathways ribbon, solutions overview, products overview, industries overview, why NEVO, knowledge teaser, markets map, CTA.
- **Solution hub / detail** — process diagram, deliverables, engagement model, timeline, engineer bio card, case studies.
- **Product family hub** (Raw Materials / Production Lines / Finished Panels) — category grid, comparison anchor, quality standards, RFQ form entry.
- **Product detail** — technical specs table, standards & certifications, sizes/variants, applications, downloads, RFQ form.
- **Industry** — problem context, recommended panels, recommended lines, code/standards, case studies, FAQ.
- **Knowledge article** — TOC, long-form body, author + reviewer, related topics, related downloads, next-article suggestions.
- **Guide** (pillar) — chaptered long-form, downloadable PDF version, cluster of linked articles.
- **Download** — preview, size/format, gated form (progressive), related downloads.
- **Case study** — client, challenge, solution, results (metrics), gallery, related products.
- **Market/country** — regional demand context, local standards, projects delivered, distributor CTA, local contact.
- **Company subpages** — narrative + proof + CTA.
- **Contact / RFQ router** — persona selector → tailored form (Factory / Materials / Lines / Panels / Support / Distributor).
- **Search results** — grouped by content type with facet filters.
- **404 / 500** — helpful navigation to top hubs and search.

---

## 8. Global search (Algolia-shaped contract)

Single index with faceted fields:

- `objectID`, `url`, `title`, `summary`, `body`, `image`.
- `content_type` (product, article, download, case-study, faq, market, page).
- `taxonomies.topic[]`, `.industry[]`, `.product[]`, `.solution[]`, `.market[]`, `.audience[]`, `.stage[]`.
- `language`, `updated_at`, `weight` (editorial boost).

Search UI:
- Instant results with grouped tabs (All · Products · Knowledge · Downloads · Case Studies · FAQ · Markets).
- Faceted refinement by industry, topic, market, content type.
- Empty state suggests trending queries + top pillar guides.
- Query logging feeds an internal "content gap" report.

Search route: `/search/?q=…&type=…&topic=…&market=…`.

---

## 9. Related-content engine

Deterministic scoring on every page render:

```
score(candidate) =
  3 * shared(product) +
  2 * shared(solution) +
  2 * shared(topic) +
  2 * shared(industry) +
  1 * shared(market) +
  1 * shared(audience) +
  editorial_boost
```

Top N per surface:
- Related Products: 3–4
- Related Articles: 3–6
- Related Downloads: 3–4
- Related FAQs: 4–6
- Related Markets: 3–5

Editors can pin/exclude items via `related_manual[]` and `related_exclude[]`.

---

## 10. Conversion architecture

Primary conversions and their canonical forms:

- **Factory Feasibility Request** — long form, from `/solutions/factory-development/` and homepage pathway.
- **Engineering Consultation** — short form, from `/solutions/*`, industry pages, and article CTAs.
- **Raw Material RFQ** — item + qty + destination, from `/raw-materials/*`.
- **Production Line RFQ** — line type + capacity + panel spec, from `/production-lines/*`.
- **Panel Quote** — panel type + dimensions + volume + market, from `/finished-panels/*` and `/industries/*`.
- **Distributor Application** — from `/company/partners/` and `/markets/{country}/`.
- **Support Ticket** — from `/contact/support/` and product pages.
- **Download** — progressive: email required for whitepapers, open for datasheets.

All forms feed one CRM pipeline with `source_url`, `persona`, `stage`, `market`, `utm_*`, `form_variant`. `/contact/rfq/` is a persona router that pre-selects the right form.

Micro-CTAs across the site: "Talk to an Engineer" (chat/whatsapp), "Book a Call", "Download the Guide". Every article has a stage-appropriate CTA driven by `stage` taxonomy.

---

## 11. SEO architecture

- Head metadata (title, description, og:title, og:description, canonical, og:url) is defined per route via TanStack `head()`. Leaf routes carry `og:image`; root does not.
- One H1 per page; H2/H3 semantic hierarchy mirrors the 9-block spine.
- Schema.org JSON-LD by page type: Organization (root), WebSite + SearchAction (root), BreadcrumbList (all internal), Article/TechArticle (knowledge), Product (product), HowTo (installation/guides), FAQPage (any page with FAQ block), CaseStudy (creativework), LocalBusiness variant (country pages), JobPosting (careers).
- Internal linking is powered by taxonomy relationships plus 3 pillar-cluster hubs: (a) *How to build a sandwich panel factory* pillar under `/knowledge/factory-design/`, (b) *PIR vs PUR vs Rock Wool* pillar under `/knowledge/pir-guide/` and siblings, (c) *Production line selection* pillar under `/knowledge/production-technology/`.
- Sitemap: dynamic server route generating one entry per public URL, including all taxonomy landings and detail pages, split into sitemap index if it exceeds 50k URLs (10-year horizon).
- Hreflang: reserved for `en`/`ar`/`ru`/`tr`/`fr`; language switch lives in header rail. First release ships `en` only; URL scheme is `/` for English and `/{lang}/…` for future locales to avoid a rewrite later.
- Robots: allow all; disallow `/search/`, `/contact/*/thank-you/`, and `/legal/preview/*`.

---

## 12. User journey blueprints

Investor — building a factory:
```text
Home → pathway "Build a Factory" → /solutions/factory-development/ →
  /knowledge/factory-cost/ → /case-studies/factory-projects/ →
  Feasibility Request form
```

Factory Manager — fix production quality:
```text
Home → Solutions mega-menu → /solutions/factory-audits/ →
  /knowledge/production-technology/ → /production-lines/automation/ →
  Audit Request form
```

Architect — specify panels:
```text
Search "fire rated wall panel" → /finished-panels/fire-rated/ →
  /downloads/{fire-rated-datasheet}/ → /downloads/{cad-pack}/ →
  Panel Quote form
```

Distributor — represent NEVO in Kenya:
```text
/markets/kenya/ → /company/partners/ → Distributor Application
```

Raw material buyer — PPGI in Iraq:
```text
Search "PPGI supplier" → /raw-materials/ppgi/ →
  /markets/iraq/ → Material RFQ
```

Each journey is instrumented; drop-off between steps drives editorial and CTA iteration.

---

## 13. Scalability model (10-year horizon)

- 1000+ articles → flat `/knowledge/{slug}/` with taxonomy landings; no menu changes needed.
- 500+ products → 3 product families remain fixed at the top; new SKUs are children of existing family hubs.
- 100+ downloads → flat `/downloads/{slug}/` with category landings.
- 100+ case studies → flat `/case-studies/{slug}/` with category and industry landings.
- 100+ country pages → flat `/markets/{country}/` grouped by region rollups.
- Localization → `/{lang}/…` prefix reserved from day one; content model already has `language` field.
- Component library and page-type templates are fixed; adding a new SKU is a data operation, never a design operation.
- CMS-shape: headless, with the content model in section 5. Editorial workflow: draft → engineer review → publish. Every entity carries `reviewed_by_engineer` and `updated_at` — visible on-page (E-E-A-T) and used by scanner tools.

---

## 14. Governance

- URL registry (`docs/ia/url-map.md`) is the single source of truth; PRs that add routes must update it.
- Taxonomy vocabularies are closed lists edited only by the IA owner.
- Every new page type must reuse the 9-block spine unless the IA owner approves an exception.
- Quarterly IA review checks: orphan pages, dead-end pages (no outbound related links), taxonomy drift, search zero-result queries, top-exit pages.

---

## 15. What this plan will change in the repo

Docs only in this step — no page redesign, no route deletions.

1. Create `docs/ia/README.md` with the full IA above.
2. Create `docs/ia/url-map.md` with the flat URL registry from section 4, annotated with page-type template and primary conversion.
3. Create `docs/ia/taxonomies.md` with the closed vocabularies from section 5.
4. Create `docs/ia/page-contract.md` with the 9-block spine and per-template extensions from sections 6–7.
5. Leave all existing routes and components as-is. Subsequent prompts will implement routes against this IA one hub at a time.

Approve this and I will write the four docs, then wait for the next prompt to start building the first hub (recommendation: `/solutions/` + `/solutions/factory-development/` as the flagship template, since it exercises every block and every related-content surface).
