# Taxonomies — NEVO Industrial

Closed vocabularies. Editors tag every content entity against these lists; nothing else creates URLs, filters, or "Related …" relationships.

Adding a term is an IA-owner decision. Term slugs are lowercase, hyphenated, and stable — renaming requires a 301 for any generated landing page.

---

## `topic`

Editorial topic, drives `/knowledge/topic/{slug}/` landings.

```
pir · pur · rock-wool · ppgi · gi · aluzinc · adhesives · sealants ·
fire-rating · thermal-performance · acoustic-performance ·
energy-efficiency · factory-design · factory-cost · machinery ·
production-technology · quality-control · installation · maintenance ·
market-report · standards-and-codes
```

## `industry`

Mirrors `/industries/*`.

```
cold-storage · food-processing · pharmaceutical · industrial-buildings ·
commercial-buildings · warehouses · modular-buildings · clean-rooms ·
agriculture · logistics
```

## `product-family`

```
raw-materials · production-lines · finished-panels
```

## `product`

Mirrors product slugs under the three families (see `url-map.md`).

```
pir · pur · ppgi · gi · aluzinc · rock-wool · adhesives · sealants ·
accessories · consumables ·
continuous-line · discontinuous-line · roll-forming · pu-injection ·
rock-wool-line · cutting-systems · packaging · line-automation ·
line-modernization · spare-parts ·
roof-panel · wall-panel · cold-room-panel · fire-rated-panel ·
clean-room-panel · architectural-panel
```

## `solution`

Mirrors `/solutions/*`.

```
factory-development · engineering-consultancy · factory-audits ·
production-optimization · automation · commissioning · training ·
technical-support
```

## `market`

Country slugs (mirrors `/markets/{country}/`).

```
saudi-arabia · uae · oman · turkey · iraq · russia · kenya · cameroon
(extensible)
```

Region rollups (`/markets/region/{slug}/`):

```
gcc · mena · cis · africa · east-africa · west-africa
```

## `audience`

Drives persona filters, homepage pathways, and CTA variants.

```
investor · factory-owner · factory-manager · production-manager ·
engineer · consultant · architect · contractor · distributor ·
buyer · developer · government
```

## `content-type`

Governs the `/knowledge/type/{slug}/` and `/downloads/category/{slug}/` landings.

```
guide · article · whitepaper · datasheet · brochure · checklist ·
cad · report · case-study · faq · news · video
```

## `stage`

Determines the CTA variant on any page.

```
awareness   → "Read the Guide" · "Explore Topic"
evaluation  → "Talk to an Engineer" · "Download Datasheet"
decision    → "Request RFQ" · "Request Feasibility Study"
```

## `language`

```
en (default) · ar · ru · tr · fr (future)
```

URL scheme: `/` for `en`, `/{lang}/…` for future locales. Content model carries `language`; hreflang emitted per page.

---

## Tagging rules

- Every entity carries at least one `topic` and one `content-type`.
- Products and case studies carry at least one `industry` and one `market`.
- Knowledge articles carry a `stage`; hub pages default to `evaluation`.
- Empty tag arrays are invalid — the related-content engine returns nothing and the page becomes a dead-end.
