# Page Contract — NEVO Industrial

Every hub and detail page implements the same 9-block spine. Templates add type-specific blocks but never drop from the spine — a page missing Problem or FAQ is broken IA, not a design choice.

---

## 9-block spine (universal)

| # | Block | Purpose | Data source |
|---|---|---|---|
| 1 | Hero | H1, one-line value, primary CTA, secondary CTA, breadcrumb, hero visual | Entity fields |
| 2 | Problem | The pain this page addresses, in the reader's language | Entity `problem_blocks` |
| 3 | Solution | What NEVO delivers, in structured form | Entity `solution_blocks` |
| 4 | Benefits | 3–6 measurable outcomes | Entity `benefits[]` |
| 5 | Applications | Connected industries / panels / lines | Taxonomy auto-links |
| 6 | Downloads | Related datasheets, brochures, CAD | `downloads[]` + taxonomy auto |
| 7 | Related Articles | 3–6 from Knowledge | Related-content engine |
| 8 | FAQ | 4–8 questions with FAQPage JSON-LD | `faqs[]` |
| 9 | CTA | Page-specific primary conversion | `cta_variant` |

Cross-cutting on every internal page:
- Breadcrumb component (emits BreadcrumbList JSON-LD).
- "Related Markets" strip when `market` taxonomy present.
- "Related Case Studies" strip when `product` or `industry` taxonomy present.
- Sticky right-rail CTA on desktop for Product and Solution templates.

---

## Template extensions

### Home
- Pathways ribbon ("I want to…") with 6 persona entry cards.
- Solutions overview grid.
- Products overview (3 family cards).
- Industries overview grid.
- Why NEVO panel.
- Knowledge teaser (3 latest guides).
- Markets map.
- Global CTA banner.

### Solution hub
- 8 solution cards.
- Engagement model diagram.
- Featured case studies row.

### Solution detail
- Process diagram (4–6 phases).
- Deliverables list.
- Engagement model + timeline.
- Engineer bio card.
- Related case studies.

### Product family hub (Raw Materials / Production Lines / Finished Panels)
- Category grid (children as cards).
- Comparison anchor (link into a comparison guide in Knowledge).
- Quality standards & certifications.
- RFQ entry form.

### Product detail
- Technical spec table (structured data → Product schema).
- Standards & certifications badges.
- Sizes / variants table.
- Applications strip (industries).
- Downloads block (datasheet mandatory).
- RFQ form inline + sticky rail.

### Industry
- Problem context specific to the industry.
- Recommended panels (linked).
- Recommended production lines (linked).
- Codes & standards relevant to industry.
- Case studies from `industry` taxonomy.

### Knowledge article / Guide
- Table of contents (sticky on desktop).
- Long-form body (block editor: text, image, table, callout, code, gallery, embed).
- Author + engineer reviewer card.
- Related topics chip row.
- Related downloads.
- Next-article suggestions (from same `topic`).
- Guide-only: chapter navigator + PDF download.

### Download
- File preview (thumbnail + first page for PDFs).
- Size, format, page count, language.
- Progressive form (open for datasheets; email-gated for whitepapers).
- Related downloads.

### Case study
- Client (or anonymized descriptor).
- Challenge.
- Solution NEVO delivered.
- Results — 3–6 metrics.
- Gallery.
- Related products / lines / panels.
- Contextual RFQ CTA.

### Market / Country
- Regional demand context (chart or quote).
- Local standards & regulations.
- Projects delivered in market.
- Local contact card + WhatsApp.
- Distributor application CTA.

### Company subpages
- Narrative body.
- Proof block (metrics, certifications, partners).
- Contextual CTA.

### Contact / RFQ router
- Persona selector (6 cards).
- Loads the correct RFQ form inline based on selection.
- Confirmation page with next-steps and related content.

### Search results
- Grouped tabs (All · Products · Knowledge · Downloads · Case Studies · FAQ · Markets).
- Facet filters (industry, topic, market, content type).
- Empty state: trending queries + pillar guides.

### 404 / 500
- Search bar.
- Top hubs.
- Recent knowledge articles.
