# NEVO Industrial — Information Architecture v1

> Master IA blueprint. Single source of truth for routes, navigation, taxonomies, page contracts, search, related-content, conversions, SEO, and scalability. No visual design decisions live here.

Companion documents:

- [`url-map.md`](./url-map.md) — flat URL registry (drives router + sitemap)
- [`taxonomies.md`](./taxonomies.md) — closed vocabularies for tagging
- [`page-contract.md`](./page-contract.md) — 9-block spine + per-template extensions

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
- Download (progressive lead-magnet)

Authority KPIs: organic sessions, backlinks, avg. pages/session in `/knowledge/`, download count, branded search growth per target market.

---

## 2. Audience → Goal → Entry point matrix

| Audience                      | Primary goal            | First-touch entry                                                             | Primary CTA               |
| ----------------------------- | ----------------------- | ----------------------------------------------------------------------------- | ------------------------- |
| Investor                      | Build a factory         | `/solutions/factory-development/`, `/knowledge/factory-cost/`                 | Request Feasibility Study |
| Factory Owner                 | Modernize / expand      | `/solutions/production-optimization/`, `/production-lines/modernization/`     | Request Audit             |
| Factory Manager               | Fix production issue    | `/solutions/factory-audits/`, `/knowledge/production-technology/`             | Book Technical Call       |
| Production Manager            | Improve OEE / quality   | `/solutions/automation/`, `/production-lines/automation/`                     | Request Line Assessment   |
| Engineering Consultant        | Reference / partnership | `/knowledge/engineering-library/`, `/company/partners/`                       | Become a Partner          |
| Construction Co. / Contractor | Buy panels              | `/finished-panels/*`, `/industries/*`                                         | Request Panel Quote       |
| Architect                     | Specify panels          | `/finished-panels/architectural/`, `/downloads/category/cad-drawings/`        | Download CAD + Datasheet  |
| Distributor                   | Represent NEVO          | `/company/partners/`, `/markets/{country}/`                                   | Apply as Distributor      |
| Raw Material Buyer            | Source PIR/PPGI/etc.    | `/raw-materials/*`                                                            | Request Material RFQ      |
| Developer / Gov. Projects     | Turnkey capability      | `/solutions/factory-development/`, `/case-studies/category/factory-projects/` | Request Proposal          |

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

`Products` is a mega-menu supercluster containing three product families: Raw Materials, Production Lines, Finished Panels. Keeps top bar at 7 while preserving hierarchy inside the menu. Download Center, Case Studies, and FAQ live inside Knowledge. Careers lives inside Company. Global Search sits in the header rail.

Mega-menu columns per top item:

- **Solutions** — overview + 8 solution children + featured case study card + "Talk to an Engineer" CTA.
- **Products** — three columns (Raw Materials / Production Lines / Finished Panels) each listing children + featured RFQ card.
- **Industries** — two columns of 10 industries + featured project card.
- **Knowledge** — Guides / Technical Library / Downloads / Case Studies / FAQ / News + featured article card.
- **Markets** — region → country grid + "Become a Distributor" CTA.
- **Company** — About / Why NEVO / Leadership / Engineering Process / Global Network / Partners / Careers + brand card.
- **Contact** — primary CTA button (no dropdown).

Mobile: same taxonomy as a two-level accordion. Persistent bottom bar with Call · WhatsApp · RFQ.

---

## 4. Canonical URL structure

Rules:

- Lowercase, hyphenated, trailing slash on directories.
- Two-level max for hubs, three-level max for detail pages.
- Country slugs use readable form (`saudi-arabia`, `uae`).
- Knowledge, Downloads, Case Studies are **flat** — categories are taxonomy, not URL segments — so 1000+ items never require nav redesign.
- Legal / utility under `/legal/…`.

Full canonical registry lives in [`url-map.md`](./url-map.md).

Redirect policy: any legacy or shorter alias (e.g. `/pir/`) 301s to canonical. Trailing-slash canonicalization enforced at the edge.

---

## 5. Content taxonomies (scalability engine)

Long-tail content is flat and connected via **taxonomies**. Each taxonomy is a first-class filter, related-content driver, and landing-page generator. Vocabularies are closed lists documented in [`taxonomies.md`](./taxonomies.md).

Content model (fields common to all long-form entries):
`title`, `slug`, `summary`, `hero_image`, `body_blocks[]`, `taxonomies{...}`, `related_manual[]`, `related_exclude[]`, `downloads[]`, `faqs[]`, `cta_variant`, `author`, `reviewed_by_engineer`, `published_at`, `updated_at`, `reading_time`, `schema_type`, `language`.

Taxonomy landing pages are auto-generated at `/knowledge/topic/{slug}/`, `/downloads/category/{slug}/`, `/case-studies/category/{slug}/` and used as the source for "Related …" blocks on every page.

---

## 6. Universal page contract

Every hub and detail page implements the same 9-block spine so editors, designers, and SEO share one mental model:

1. **Hero** — H1, one-line value, primary CTA, secondary CTA, breadcrumb, hero visual.
2. **Problem** — the pain this page addresses, in the reader's language.
3. **Solution** — what NEVO delivers, in structured form.
4. **Benefits** — 3–6 measurable outcomes.
5. **Applications** — connected industries / panels / lines (auto-linked).
6. **Downloads** — related datasheets, brochures, CAD (auto + manual).
7. **Related Articles** — 3–6 from Knowledge (auto by taxonomy).
8. **FAQ** — 4–8 questions with FAQPage JSON-LD.
9. **CTA** — page-specific primary conversion.

Cross-cutting elements on every internal page:

- Breadcrumb (BreadcrumbList JSON-LD).
- "Related Markets" strip where relevant.
- "Related Case Studies" strip where relevant.
- Sticky right-rail CTA on desktop for product/solution pages.

Per-template extensions live in [`page-contract.md`](./page-contract.md).

---

## 7. Page-type templates

- **Home** — pathways ribbon, solutions overview, products overview, industries overview, why NEVO, knowledge teaser, markets map, CTA.
- **Solution hub / detail** — process diagram, deliverables, engagement model, timeline, engineer bio, case studies.
- **Product family hub** (Raw Materials / Production Lines / Finished Panels) — category grid, comparison anchor, quality standards, RFQ entry.
- **Product detail** — technical specs table, standards & certifications, sizes/variants, applications, downloads, RFQ form.
- **Industry** — problem context, recommended panels, recommended lines, codes/standards, case studies, FAQ.
- **Knowledge article** — TOC, long-form body, author + reviewer, related topics, related downloads, next-article.
- **Guide** (pillar) — chaptered long-form, downloadable PDF, cluster of linked articles.
- **Download** — preview, size/format, progressive-gated form, related downloads.
- **Case study** — client, challenge, solution, metrics, gallery, related products.
- **Market / country** — regional demand, local standards, projects delivered, distributor CTA, local contact.
- **Company subpages** — narrative + proof + CTA.
- **Contact / RFQ router** — persona selector → tailored form (Factory / Materials / Lines / Panels / Support / Distributor).
- **Search results** — grouped by content type with facet filters.
- **404 / 500** — helpful navigation to top hubs + search.

---

## 8. Global search

Single search index with faceted fields:
`objectID`, `url`, `title`, `summary`, `body`, `image`, `content_type`, `taxonomies.{topic,industry,product,solution,market,audience,stage}[]`, `language`, `updated_at`, `weight`.

Search UI:

- Instant results grouped by tab (All · Products · Knowledge · Downloads · Case Studies · FAQ · Markets).
- Faceted refinement by industry, topic, market, content type.
- Empty state → trending queries + top pillar guides.
- Query logging feeds a "content gap" report.

Search route: `/search/?q=…&type=…&topic=…&market=…`.

Frontend uses public search key; indexing operations run on the backend against the same content model.

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

Top N per surface: Products 3–4 · Articles 3–6 · Downloads 3–4 · FAQs 4–6 · Markets 3–5. Editors override via `related_manual[]` / `related_exclude[]`.

---

## 10. Conversion architecture

Canonical forms:

- **Factory Feasibility Request** — long form, from `/solutions/factory-development/` + homepage pathway.
- **Engineering Consultation** — short form, from `/solutions/*`, industry pages, article CTAs.
- **Raw Material RFQ** — item + qty + destination, from `/raw-materials/*`.
- **Production Line RFQ** — line type + capacity + panel spec, from `/production-lines/*`.
- **Panel Quote** — panel type + dimensions + volume + market, from `/finished-panels/*` + `/industries/*`.
- **Distributor Application** — from `/company/partners/` + `/markets/{country}/`.
- **Support Ticket** — from `/contact/support/` + product pages.
- **Download** — progressive gating (open for datasheets, email for whitepapers).

All forms feed one CRM pipeline with `source_url`, `persona`, `stage`, `market`, `utm_*`, `form_variant`. `/contact/rfq/` is a persona router. Micro-CTAs: "Talk to an Engineer", "Book a Call", "Download the Guide" — chosen by `stage` taxonomy.

---

## 11. SEO architecture

- Head metadata (title, description, og:title, og:description, canonical, og:url) is defined per route via TanStack `head()`. Leaf routes carry `og:image`; root does not.
- One H1 per page; H2/H3 hierarchy mirrors the 9-block spine.
- Schema.org JSON-LD by page type: Organization (root), WebSite + SearchAction (root), BreadcrumbList (all internal), Article/TechArticle (knowledge), Product (product detail), HowTo (installation guides), FAQPage (any FAQ block), CreativeWork (case studies), LocalBusiness (country pages), JobPosting (careers).
- Internal linking driven by taxonomy plus three pillar-cluster hubs:
  1. _How to build a sandwich panel factory_ under `/knowledge/factory-design/`.
  2. _PIR vs PUR vs Rock Wool_ under `/knowledge/pir-guide/` (+ siblings).
  3. _Production line selection_ under `/knowledge/production-technology/`.
- Sitemap: dynamic server route generating one entry per public URL, including taxonomy landings; split into sitemap index if it exceeds 50k URLs (10-year horizon).
- Hreflang: reserved for `en` / `ar` / `ru` / `tr` / `fr`. First release ships `en` only; URL scheme is `/` (English default) and `/{lang}/…` for future locales.
- Robots: allow all; disallow `/search/`, `/contact/*/thank-you/`, `/legal/preview/*`.

---

## 12. User journey blueprints

Investor — building a factory:

```text
Home → pathway "Build a Factory" → /solutions/factory-development/ →
  /knowledge/factory-cost/ → /case-studies/category/factory-projects/ →
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
  /downloads/{datasheet} → /downloads/{cad-pack} →
  Panel Quote form
```

Distributor — represent NEVO in Kenya:

```text
/markets/kenya/ → /company/partners/ → Distributor Application
```

Raw material buyer — PPGI in Iraq:

```text
Search "PPGI supplier" → /raw-materials/ppgi/ → /markets/iraq/ →
  Material RFQ
```

Each journey is instrumented; drop-off between steps drives editorial and CTA iteration.

---

## 13. Scalability model (10-year horizon)

- **1000+ articles** → flat `/knowledge/{slug}/` with taxonomy landings; no menu changes.
- **500+ products** → 3 product families fixed at the top; new SKUs are children of existing family hubs.
- **100+ downloads** → flat `/downloads/{slug}/` with category landings.
- **100+ case studies** → flat `/case-studies/{slug}/` with category and industry landings.
- **100+ country pages** → flat `/markets/{country}/` grouped by region rollups.
- **Localization** → `/{lang}/…` prefix reserved from day one; content model already carries `language`.
- Component library and page-type templates are fixed; adding an SKU is a data operation, never a design operation.
- CMS shape: headless, model in section 5. Editorial workflow: draft → engineer review → publish. `reviewed_by_engineer` and `updated_at` visible on-page (E-E-A-T).

---

## 14. Governance

- URL registry (`url-map.md`) is the single source of truth; PRs adding routes must update it.
- Taxonomy vocabularies are closed lists edited only by the IA owner.
- Every new page type must reuse the 9-block spine unless the IA owner approves an exception.
- Quarterly IA review: orphan pages, dead-end pages (no outbound related links), taxonomy drift, search zero-result queries, top-exit pages.
