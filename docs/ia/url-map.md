# URL Map — NEVO Industrial

Single source of truth for canonical URLs. Every entry lists the page-type template it uses and its primary conversion. This file drives the router and the dynamic sitemap.

Legend:

- **Template** — see `page-contract.md` for block extensions.
- **CTA** — primary conversion event for the page.
- Flat detail routes (`/knowledge/{slug}/`, `/downloads/{slug}/`, `/case-studies/{slug}/`, `/markets/{country}/`, `/company/careers/{job}/`) enumerate by content, not by menu.

## Root

| URL | Template | CTA                                   |
| --- | -------- | ------------------------------------- |
| `/` | Home     | Multi-pathway (routes to persona hub) |

## Solutions

| URL                                   | Template        | CTA                             |
| ------------------------------------- | --------------- | ------------------------------- |
| `/solutions/`                         | Solution hub    | Talk to an Engineer             |
| `/solutions/factory-development/`     | Solution detail | Request Feasibility Study       |
| `/solutions/engineering-consultancy/` | Solution detail | Book Engineering Consult        |
| `/solutions/factory-audits/`          | Solution detail | Request Audit                   |
| `/solutions/production-optimization/` | Solution detail | Request Optimization Assessment |
| `/solutions/automation/`              | Solution detail | Request Automation Plan         |
| `/solutions/commissioning/`           | Solution detail | Request Commissioning Support   |
| `/solutions/training/`                | Solution detail | Request Training Program        |
| `/solutions/technical-support/`       | Solution detail | Open Support Ticket             |

## Products › Raw Materials

| URL                           | Template           | CTA                     |
| ----------------------------- | ------------------ | ----------------------- |
| `/raw-materials/`             | Product family hub | Request Material RFQ    |
| `/raw-materials/pir/`         | Product detail     | Request PIR RFQ         |
| `/raw-materials/pur/`         | Product detail     | Request PUR RFQ         |
| `/raw-materials/ppgi/`        | Product detail     | Request PPGI RFQ        |
| `/raw-materials/gi/`          | Product detail     | Request GI RFQ          |
| `/raw-materials/aluzinc/`     | Product detail     | Request Aluzinc RFQ     |
| `/raw-materials/rock-wool/`   | Product detail     | Request Rock Wool RFQ   |
| `/raw-materials/adhesives/`   | Product detail     | Request Adhesives RFQ   |
| `/raw-materials/sealants/`    | Product detail     | Request Sealants RFQ    |
| `/raw-materials/accessories/` | Product detail     | Request Accessories RFQ |
| `/raw-materials/consumables/` | Product detail     | Request Consumables RFQ |

## Products › Production Lines

| URL                                  | Template           | CTA                            |
| ------------------------------------ | ------------------ | ------------------------------ |
| `/production-lines/`                 | Product family hub | Request Line RFQ               |
| `/production-lines/continuous/`      | Product detail     | Request Continuous Line RFQ    |
| `/production-lines/discontinuous/`   | Product detail     | Request Discontinuous Line RFQ |
| `/production-lines/roll-forming/`    | Product detail     | Request Roll Forming RFQ       |
| `/production-lines/pu-injection/`    | Product detail     | Request PU Injection RFQ       |
| `/production-lines/rock-wool/`       | Product detail     | Request Rock Wool Line RFQ     |
| `/production-lines/cutting-systems/` | Product detail     | Request Cutting System RFQ     |
| `/production-lines/packaging/`       | Product detail     | Request Packaging System RFQ   |
| `/production-lines/automation/`      | Product detail     | Request Automation Package     |
| `/production-lines/modernization/`   | Product detail     | Request Modernization Audit    |
| `/production-lines/spare-parts/`     | Product detail     | Request Spare Parts Quote      |

## Products › Finished Panels

| URL                               | Template           | CTA                               |
| --------------------------------- | ------------------ | --------------------------------- |
| `/finished-panels/`               | Product family hub | Request Panel Quote               |
| `/finished-panels/roof/`          | Product detail     | Request Roof Panel Quote          |
| `/finished-panels/wall/`          | Product detail     | Request Wall Panel Quote          |
| `/finished-panels/cold-room/`     | Product detail     | Request Cold Room Panel Quote     |
| `/finished-panels/fire-rated/`    | Product detail     | Request Fire-Rated Panel Quote    |
| `/finished-panels/clean-room/`    | Product detail     | Request Clean Room Panel Quote    |
| `/finished-panels/architectural/` | Product detail     | Request Architectural Panel Quote |

## Industries

| URL                                 | Template     | CTA                          |
| ----------------------------------- | ------------ | ---------------------------- |
| `/industries/`                      | Industry hub | Talk to an Engineer          |
| `/industries/cold-storage/`         | Industry     | Request Cold Storage Consult |
| `/industries/food-processing/`      | Industry     | Request Food-Grade Consult   |
| `/industries/pharmaceutical/`       | Industry     | Request GMP Consult          |
| `/industries/industrial-buildings/` | Industry     | Request Industrial Consult   |
| `/industries/commercial-buildings/` | Industry     | Request Commercial Consult   |
| `/industries/warehouses/`           | Industry     | Request Warehouse Consult    |
| `/industries/modular-buildings/`    | Industry     | Request Modular Consult      |
| `/industries/clean-rooms/`          | Industry     | Request Clean Room Consult   |
| `/industries/agriculture/`          | Industry     | Request Agri Consult         |
| `/industries/logistics/`            | Industry     | Request Logistics Consult    |

## Knowledge (flat, taxonomy-driven)

| URL                              | Template                   | CTA                 |
| -------------------------------- | -------------------------- | ------------------- |
| `/knowledge/`                    | Knowledge hub (filterable) | Download the Guide  |
| `/knowledge/{article-slug}/`     | Knowledge article / Guide  | Stage-appropriate   |
| `/knowledge/topic/{topic-slug}/` | Taxonomy landing           | Talk to an Engineer |
| `/knowledge/type/{type-slug}/`   | Content-type landing       | Talk to an Engineer |

Seed article set (each becomes `/knowledge/{slug}/`):
`what-is-sandwich-panel`, `pir-guide`, `pur-guide`, `rock-wool-guide`, `fire-rating`, `production-technology`, `factory-design`, `factory-cost`, `machinery-guide`, `raw-material-guide`, `engineering-library`, `installation-guide`, `maintenance`, `energy-efficiency`, `market-reports`, `industry-news`, `technical-articles`.

## Downloads (flat)

| URL                               | Template                   | CTA                        |
| --------------------------------- | -------------------------- | -------------------------- |
| `/downloads/`                     | Downloads hub (filterable) | Progressive gated download |
| `/downloads/{download-slug}/`     | Download detail            | Download                   |
| `/downloads/category/{cat-slug}/` | Taxonomy landing           | Download                   |

Seed categories: `company-profile`, `technical-brochures`, `datasheets`, `factory-checklists`, `investment-guides`, `engineering-guides`, `white-papers`, `cad-drawings`, `pdf-library`.

## Case Studies (flat)

| URL                                  | Template                    | CTA                 |
| ------------------------------------ | --------------------------- | ------------------- |
| `/case-studies/`                     | Case study hub (filterable) | Talk to an Engineer |
| `/case-studies/{project-slug}/`      | Case study                  | Contextual RFQ      |
| `/case-studies/category/{cat-slug}/` | Taxonomy landing            | Talk to an Engineer |

Seed categories: `factory-projects`, `production-optimization`, `material-supply`, `engineering-success-stories`, `industrial-buildings`, `cold-storage-projects`.

## FAQ

| URL                     | Template     | CTA                 |
| ----------------------- | ------------ | ------------------- |
| `/faq/`                 | FAQ hub      | Talk to an Engineer |
| `/faq/{category-slug}/` | FAQ category | Talk to an Engineer |

## Markets

| URL                              | Template                | CTA                                         |
| -------------------------------- | ----------------------- | ------------------------------------------- |
| `/markets/`                      | Markets hub (world map) | Apply as Distributor                        |
| `/markets/{country-slug}/`       | Market/country          | Contact Local Office / Apply as Distributor |
| `/markets/region/{region-slug}/` | Region rollup           | Apply as Distributor                        |

Seed countries: `saudi-arabia`, `uae`, `oman`, `turkey`, `iraq`, `russia`, `kenya`, `cameroon`. Region rollup: `africa` (extensible: `gcc`, `mena`, `cis`, `east-africa`, `west-africa`).

## Company

| URL                             | Template        | CTA                            |
| ------------------------------- | --------------- | ------------------------------ |
| `/company/`                     | Company hub     | Contact NEVO                   |
| `/company/about/`               | Company subpage | Contact NEVO                   |
| `/company/why-nevo/`            | Company subpage | Talk to an Engineer            |
| `/company/leadership/`          | Company subpage | Contact Leadership             |
| `/company/engineering-process/` | Company subpage | Book Engineering Consult       |
| `/company/global-network/`      | Company subpage | Find Local Office              |
| `/company/partners/`            | Company subpage | Apply as Partner / Distributor |
| `/company/careers/`             | Careers hub     | View Open Roles                |
| `/company/careers/{job-slug}/`  | Job posting     | Apply                          |

## Contact

| URL                     | Template                | CTA                   |
| ----------------------- | ----------------------- | --------------------- |
| `/contact/`             | Contact hub             | Route to correct form |
| `/contact/rfq/`         | RFQ router              | Persona-tailored RFQ  |
| `/contact/distributor/` | Distributor application | Submit                |
| `/contact/support/`     | Support ticket          | Submit                |
| `/contact/media/`       | Media inquiry           | Submit                |

## Search

| URL        | Template       | CTA                  |
| ---------- | -------------- | -------------------- |
| `/search/` | Search results | Refine / open result |

## Legal

| URL                      | Template |
| ------------------------ | -------- |
| `/legal/privacy/`        | Legal    |
| `/legal/terms/`          | Legal    |
| `/legal/cookies/`        | Legal    |
| `/legal/quality-policy/` | Legal    |

## Utility

| URL            | Purpose                        |
| -------------- | ------------------------------ |
| `/sitemap.xml` | Dynamic sitemap (server route) |
| `/robots.txt`  | Crawl policy                   |
| `/404`         | Not found                      |
| `/500`         | Server error                   |
