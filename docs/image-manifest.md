# NEVO Image Replacement Manifest

Every image asset currently imported by application code: **341 files**, 39.1 MB total.
Use this to commission or license replacement photography. `Required` is the target delivery size for the slot (deliver at 2x where the slot is displayed smaller).

Machine-readable copy: [`docs/image-manifest.csv`](./image-manifest.csv).

## Summary by folder

| Folder | Files | Size (MB) |
|---|---|---|
| `assets` | 3 | 0.2 |
| `assets/ai` | 14 | 1.8 |
| `assets/configurator` | 6 | 0.6 |
| `assets/corporate` | 4 | 0.9 |
| `assets/downloads` | 1 | 0.0 |
| `assets/engineering` | 25 | 4.3 |
| `assets/estimator` | 8 | 0.0 |
| `assets/factory-layouts` | 10 | 1.6 |
| `assets/industries` | 23 | 3.2 |
| `assets/installation` | 10 | 1.3 |
| `assets/knowledge` | 23 | 5.1 |
| `assets/machinery` | 10 | 2.2 |
| `assets/og` | 30 | 3.7 |
| `assets/og/knowledge` | 13 | 1.6 |
| `assets/panels` | 29 | 3.7 |
| `assets/partner-portal` | 21 | 0.0 |
| `assets/pir-vs-rockwool` | 15 | 0.7 |
| `assets/portal` | 21 | 0.0 |
| `assets/premium` | 11 | 0.0 |
| `assets/project` | 24 | 3.3 |
| `assets/quality` | 10 | 1.4 |
| `assets/raw-materials` | 19 | 2.1 |
| `assets/research` | 10 | 1.3 |
| `assets/tools` | 1 | 0.1 |

## `assets`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `nevo-logo-dark.png` | 1376x768 (150 KB) | Brand logo | SVG or 1024px PNG, transparent | (root layout) | `src/routes/__root.tsx` | NEVO Industrial |
| `nevo-logo-full.png.asset.json` | CDN pointer (0 KB) | Brand logo | SVG or 1024px PNG, transparent | /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability | `src/components/site/SiteHeader.tsx` | — |
| `nevo-logo-light.png` | 1376x768 (96 KB) | Brand logo | SVG or 1024px PNG, transparent | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /admin | `src/components/crm/CrmSidebar.tsx; src/components/site/SiteFooter.tsx; src/components/site/SiteHeader.tsx; src/routes/__root.tsx` | NEVO |

## `assets/ai`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `collab.jpg` | 1024x1024 (124 KB) | Card / section cover | 1600x900 (16:9) | /$lang/ai-assistant | `src/routes/$lang.ai-assistant.tsx` | NEVO engineering team reviewing a project |
| `digital-twin.jpg` | 1024x1024 (103 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-assistant | `src/routes/$lang.ai-assistant.tsx` | — |
| `drawings-review.jpg` | 1024x1024 (101 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-assistant | `src/routes/$lang.ai-assistant.tsx` | — |
| `eco-engineering-consultancy.jpg` | 1024x1024 (121 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-assistant | `src/routes/$lang.ai-assistant.tsx` | — |
| `eco-factory-development.jpg` | 1024x1024 (186 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-assistant | `src/routes/$lang.ai-assistant.tsx` | — |
| `eco-finished-panels.jpg` | 1024x1024 (223 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-assistant | `src/routes/$lang.ai-assistant.tsx` | — |
| `eco-knowledge-hub.jpg` | 1024x1024 (121 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-assistant | `src/routes/$lang.ai-assistant.tsx` | — |
| `eco-production-lines.jpg` | 1024x1024 (183 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-assistant | `src/routes/$lang.ai-assistant.tsx` | — |
| `eco-project-inquiry.jpg` | 1024x1024 (113 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-assistant | `src/routes/$lang.ai-assistant.tsx` | — |
| `eco-raw-materials.jpg` | 1024x1024 (136 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-assistant | `src/routes/$lang.ai-assistant.tsx` | — |
| `hero-engineer.jpg` | 1024x1024 (97 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang/ai-assistant | `src/routes/$lang.ai-assistant.tsx` | NEVO AI Engineer — engineer reviewing holographic factory model |
| `live-consultation.jpg` | 1024x1024 (101 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-assistant | `src/routes/$lang.ai-assistant.tsx` | — |
| `technical-proposal.jpg` | 1024x1024 (98 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-assistant | `src/routes/$lang.ai-assistant.tsx` | — |
| `whatsapp-support.jpg` | 1024x1024 (98 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-assistant | `src/routes/$lang.ai-assistant.tsx` | — |

## `assets/configurator`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `context-cleanroom.jpg` | 1024x1024 (81 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/product-configurator | `src/routes/$lang.product-configurator.tsx` | — |
| `context-coldroom.jpg` | 1024x1024 (67 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/product-configurator | `src/routes/$lang.product-configurator.tsx` | — |
| `context-fire.jpg` | 1024x1024 (151 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/product-configurator | `src/routes/$lang.product-configurator.tsx` | — |
| `context-roof.jpg` | 1024x1024 (93 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/product-configurator | `src/routes/$lang.product-configurator.tsx` | — |
| `context-wall.jpg` | 1024x1024 (91 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/product-configurator | `src/routes/$lang.product-configurator.tsx` | — |
| `hero-configurator.jpg` | 1536x1024 (117 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang/product-configurator | `src/routes/$lang.product-configurator.tsx` | NEVO sandwich panel — engineering render |

## `assets/corporate`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `careers-hero.jpg` | 1920x1088 (217 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang/careers | `src/routes/$lang.careers.tsx` | NEVO engineering team |
| `contact-hero.jpg` | 1920x1088 (249 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang/contact | `src/routes/$lang.contact.tsx` | — |
| `investor-hero.jpg` | 1920x1088 (164 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang/investors | `src/routes/$lang.investors.tsx` | Executive boardroom Dubai |
| `sustainability-hero.jpg` | 1920x1088 (287 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang/sustainability | `src/routes/$lang.sustainability.tsx` | Solar-panel factory rooftop at golden hour |

## `assets/downloads`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `hero-engineering-portrait.png.asset.json` | CDN pointer (0 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang/download-center | `src/routes/$lang.download-center.tsx` | — |

## `assets/engineering`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `01-hero.jpg` | 1920x1088 (318 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | NEVO continuous sandwich panel production line |
| `02-factory.jpg` | 1600x1072 (211 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | Factory engineering overview — 3D rendered production plant |
| `03-team.jpg` | 1600x1072 (129 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | NEVO engineering team reviewing factory plans |
| `04-3d.jpg` | 1600x1067 (155 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | NEVO engineer working on a 3D factory model |
| `05-layout.jpg` | 1024x1024 (93 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `06-flow.jpg` | 1024x1024 (235 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `07-process.jpg` | 1600x1067 (197 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `08-equip.jpg` | 1600x1067 (209 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `09-utility.jpg` | 1024x1024 (174 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `10-electrical.jpg` | 1600x1067 (215 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | NEVO electrical control cabinet and HMI |
| `11-construction.jpg` | 1600x1067 (181 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `12-installation.jpg` | 1600x1067 (229 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `13-commissioning.jpg` | 1600x1067 (228 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `14-training.jpg` | 1600x1067 (212 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `15-optimization.jpg` | 1024x1024 (132 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | OEE and production optimization dashboard |
| `16-qc.jpg` | 1024x1024 (111 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | NEVO quality control lab technician |
| `17-finished.jpg` | 1024x1024 (215 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | NEVO finished sandwich panels stacked and packaged |
| `18-raw.jpg` | 1024x1024 (154 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | NEVO raw materials — steel coils and chemical IBCs |
| `19-pid.jpg` | 1024x1024 (135 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `20-general.jpg` | 1024x1024 (144 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `21-structural.jpg` | 1024x1024 (258 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `22-capacity.jpg` | 1024x1024 (89 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `23-roi.jpg` | 1024x1024 (119 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `24-timeline.jpg` | 1024x1024 (133 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | — |
| `25-materials.jpg` | 1024x1024 (105 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/engineering-consultancy | `src/routes/$lang.solutions.engineering-consultancy.tsx` | NEVO raw materials and chemical systems lineup |

## `assets/estimator`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `est-eq1.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-project-estimator | `src/routes/$lang.ai-project-estimator.tsx` | — |
| `est-eq2.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-project-estimator | `src/routes/$lang.ai-project-estimator.tsx` | — |
| `est-eq3.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-project-estimator | `src/routes/$lang.ai-project-estimator.tsx` | — |
| `est-eq4.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-project-estimator | `src/routes/$lang.ai-project-estimator.tsx` | — |
| `est-eq5.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/ai-project-estimator | `src/routes/$lang.ai-project-estimator.tsx` | — |
| `est-layout.png.asset.json` | CDN pointer (0 KB) | Card / section cover | 1600x900 (16:9) | /$lang/ai-project-estimator | `src/routes/$lang.ai-project-estimator.tsx` | Factory Layout |
| `est-panel-hero.png.asset.json` | CDN pointer (0 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang/ai-project-estimator | `src/routes/$lang.ai-project-estimator.tsx` | Panel cross-section |
| `est-report.png.asset.json` | CDN pointer (0 KB) | Card / section cover | 1600x900 (16:9) | /$lang/ai-project-estimator | `src/routes/$lang.ai-project-estimator.tsx` | Report Preview |

## `assets/factory-layouts`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `fl-01-master.jpg` | 1024x1024 (204 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/factory-layouts | `src/routes/$lang.factory-layouts.tsx` | — |
| `fl-02-3d.jpg` | 1024x1024 (178 KB) | Card / section cover | 1600x900 (16:9) | /$lang/factory-layouts | `src/routes/$lang.factory-layouts.tsx` | — |
| `fl-03-production-flow.jpg` | 1024x1024 (177 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/factory-layouts | `src/routes/$lang.factory-layouts.tsx` | — |
| `fl-04-material-flow.jpg` | 1024x1024 (116 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/factory-layouts | `src/routes/$lang.factory-layouts.tsx` | — |
| `fl-05-warehouse.jpg` | 1024x1024 (190 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/factory-layouts | `src/routes/$lang.factory-layouts.tsx` | — |
| `fl-06-utility.jpg` | 1024x1024 (167 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/factory-layouts | `src/routes/$lang.factory-layouts.tsx` | — |
| `fl-07-office.jpg` | 1024x1024 (150 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/factory-layouts | `src/routes/$lang.factory-layouts.tsx` | — |
| `fl-08-truck.jpg` | 1024x1024 (142 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/factory-layouts | `src/routes/$lang.factory-layouts.tsx` | — |
| `fl-09-expansion.jpg` | 1024x1024 (199 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/factory-layouts | `src/routes/$lang.factory-layouts.tsx` | — |
| `fl-10-completed.jpg` | 1024x1024 (152 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/factory-layouts | `src/routes/$lang.factory-layouts.tsx` | — |

## `assets/industries`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `tile-01.jpg` | 1264x848 (129 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-02.jpg` | 1264x848 (104 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-03.jpg` | 1264x848 (125 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-04.jpg` | 1264x848 (188 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-05.jpg` | 1264x848 (190 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-06.jpg` | 1264x848 (167 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-07.jpg` | 1600x1067 (195 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-08.jpg` | 1600x1067 (200 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-09.jpg` | 1600x1067 (261 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-10.jpg` | 1600x1024 (145 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-11.jpg` | 1024x1024 (228 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-12.jpg` | 1024x1024 (142 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-13.jpg` | 1024x1024 (157 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-14.jpg` | 1024x1024 (125 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-15.jpg` | 1024x1024 (126 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-16.jpg` | 1024x1024 (160 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-17.jpg` | 1024x1024 (160 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-18.jpg` | 1024x1024 (98 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-19.jpg` | 1024x1024 (72 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-20.jpg` | 1024x1024 (60 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-21.jpg` | 1024x1024 (100 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-22.jpg` | 1024x1024 (110 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |
| `tile-23.jpg` | 1024x1024 (76 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/industries | `src/routes/$lang.industries.tsx` | — |

## `assets/installation`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `inst-01-machine-installation.jpg` | 1024x1024 (176 KB) | Card / section cover | 1600x900 (16:9) | /$lang/installation-commissioning | `src/routes/$lang.installation-commissioning.tsx` | — |
| `inst-02-mechanical-alignment.jpg` | 1024x1024 (107 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/installation-commissioning | `src/routes/$lang.installation-commissioning.tsx` | — |
| `inst-03-electrical-installation.jpg` | 1024x1024 (134 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/installation-commissioning | `src/routes/$lang.installation-commissioning.tsx` | — |
| `inst-04-plc-scada.jpg` | 1024x1024 (88 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/installation-commissioning | `src/routes/$lang.installation-commissioning.tsx` | — |
| `inst-05-first-panel.jpg` | 1024x1024 (147 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/installation-commissioning | `src/routes/$lang.installation-commissioning.tsx` | — |
| `inst-06-fat.jpg` | 1024x1024 (172 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/installation-commissioning | `src/routes/$lang.installation-commissioning.tsx` | — |
| `inst-07-sat.jpg` | 1024x1024 (131 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/installation-commissioning | `src/routes/$lang.installation-commissioning.tsx` | — |
| `inst-08-training.jpg` | 1024x1024 (137 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/installation-commissioning | `src/routes/$lang.installation-commissioning.tsx` | — |
| `inst-09-remote-support.jpg` | 1024x1024 (108 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/installation-commissioning | `src/routes/$lang.installation-commissioning.tsx` | — |
| `inst-10-aftersales.jpg` | 1024x1024 (163 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/installation-commissioning | `src/routes/$lang.installation-commissioning.tsx` | — |

## `assets/knowledge`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `01-blueprint.jpg` | 1920x1280 (245 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /sitemap[/]xml; /sitemaps/$slug | `src/lib/knowledge-articles.ts; src/lib/og-article-covers.ts; src/routes/$lang.knowledge-hub.tsx` | — |
| `02-cad.jpg` | 1024x1024 (86 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/about | `src/routes/$lang.about.tsx` | — |
| `03-3d-factory.jpg` | 1920x1280 (443 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/about; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /sitemap[/]xml; /sitemaps/$slug | `src/lib/knowledge-articles.ts; src/lib/og-article-covers.ts; src/routes/$lang.about.tsx; src/routes/$lang.knowledge-hub.tsx` | — |
| `04-meeting.jpg` | 1024x1024 (152 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/about | `src/routes/$lang.about.tsx` | — |
| `05-calculations.jpg` | 1024x1024 (107 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/about | `src/routes/$lang.about.tsx` | — |
| `06-production-line.jpg` | 1920x1280 (263 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/about; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /sitemap[/]xml; /sitemaps/$slug | `src/lib/knowledge-articles.ts; src/lib/og-article-covers.ts; src/routes/$lang.about.tsx; src/routes/$lang.knowledge-hub.tsx` | — |
| `07-laminator.jpg` | 1920x1280 (208 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/about; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /sitemap[/]xml; /sitemaps/$slug | `src/lib/knowledge-articles.ts; src/lib/og-article-covers.ts; src/routes/$lang.about.tsx; src/routes/$lang.knowledge-hub.tsx` | — |
| `10-stacking.jpg` | 1024x1024 (194 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/about | `src/routes/$lang.about.tsx` | — |
| `11-ppgi.jpg` | 1024x1024 (81 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/about | `src/routes/$lang.about.tsx` | — |
| `14-polyol.jpg` | 1920x1280 (247 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /sitemap[/]xml; /sitemaps/$slug | `src/lib/knowledge-articles.ts; src/lib/og-article-covers.ts` | — |
| `16-rockwool.jpg` | 1920x1280 (416 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /sitemap[/]xml; /sitemaps/$slug | `src/lib/knowledge-articles.ts; src/lib/og-article-covers.ts` | — |
| `17-pir-panel.jpg` | 1920x1280 (118 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/about; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /sitemap[/]xml; /sitemaps/$slug | `src/lib/knowledge-articles.ts; src/lib/og-article-covers.ts; src/routes/$lang.about.tsx; src/routes/$lang.knowledge-hub.tsx` | — |
| `21-coldroom-panel.jpg` | 1920x1280 (284 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /sitemap[/]xml; /sitemaps/$slug | `src/lib/knowledge-articles.ts; src/lib/og-article-covers.ts; src/routes/$lang.knowledge-hub.tsx` | — |
| `23-cleanroom.jpg` | 1920x1280 (193 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /sitemap[/]xml; /sitemaps/$slug | `src/lib/knowledge-articles.ts; src/lib/og-article-covers.ts` | — |
| `26-industrial-bldg.jpg` | 1920x1280 (172 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /sitemap[/]xml; /sitemaps/$slug | `src/lib/knowledge-articles.ts; src/lib/og-article-covers.ts` | — |
| `28-fire-rating.jpg` | 1920x1280 (259 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /sitemap[/]xml; /sitemaps/$slug | `src/lib/knowledge-articles.ts; src/lib/og-article-covers.ts; src/routes/$lang.knowledge-hub.tsx` | — |
| `30-flow-diagram.jpg` | 1024x1024 (229 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/about | `src/routes/$lang.about.tsx` | — |
| `31-material-flow.jpg` | 1024x1024 (171 KB) | Card / section cover | 1600x900 (16:9) | /$lang/about | `src/routes/$lang.about.tsx` | — |
| `33-layout.jpg` | 1920x1280 (388 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/about; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /sitemap[/]xml; /sitemaps/$slug | `src/lib/knowledge-articles.ts; src/lib/og-article-covers.ts; src/routes/$lang.about.tsx; src/routes/$lang.knowledge-hub.tsx` | — |
| `36-investment-report.jpg` | 1920x1280 (144 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/about; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /sitemap[/]xml; /sitemaps/$slug | `src/lib/knowledge-articles.ts; src/lib/og-article-covers.ts; src/routes/$lang.about.tsx; src/routes/$lang.knowledge-hub.tsx` | — |
| `38-factory-guide.jpg` | 1920x1280 (226 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/knowledge-hub | `src/routes/$lang.knowledge-hub.tsx` | — |
| `40-material-guide.jpg` | 1920x1280 (338 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/knowledge-hub | `src/routes/$lang.knowledge-hub.tsx` | — |
| `hub-hero.jpg` | 1920x1088 (223 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang/knowledge-hub | `src/routes/$lang.knowledge-hub.tsx` | — |

## `assets/machinery`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `01-decoiler.jpg` | 1600x1072 (242 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/production-lines | `src/routes/$lang.solutions.production-lines.tsx` | — |
| `02-roll-former.jpg` | 1600x1072 (214 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/production-lines | `src/routes/$lang.solutions.production-lines.tsx` | — |
| `03-foam-injection.jpg` | 1600x1072 (172 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/production-lines | `src/routes/$lang.solutions.production-lines.tsx` | — |
| `04-double-belt-laminator.jpg` | 1600x1072 (210 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/production-lines | `src/routes/$lang.solutions.production-lines.tsx` | — |
| `05-flying-saw.jpg` | 1600x1072 (177 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/production-lines | `src/routes/$lang.solutions.production-lines.tsx` | — |
| `06-cooling-section.jpg` | 1600x1072 (236 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/production-lines | `src/routes/$lang.solutions.production-lines.tsx` | — |
| `07-stacking-system.jpg` | 1600x1072 (302 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/production-lines | `src/routes/$lang.solutions.production-lines.tsx` | — |
| `08-packaging-line.jpg` | 1600x1072 (262 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/production-lines | `src/routes/$lang.solutions.production-lines.tsx` | — |
| `09-control-system.jpg` | 1600x1072 (182 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/production-lines | `src/routes/$lang.solutions.production-lines.tsx` | — |
| `10-air-compressor.jpg` | 1600x1072 (237 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/production-lines | `src/routes/$lang.solutions.production-lines.tsx` | — |

## `assets/og`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `ai-collab.jpg` | 1200x630 (130 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `ai-digital-twin.jpg` | 1200x630 (94 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `ai-hero-engineer.jpg` | 1200x630 (95 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `ai-technical-proposal.jpg` | 1200x630 (102 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `careers-hero.jpg` | 1200x630 (120 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `configurator-hero.jpg` | 1200x630 (75 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `contact-hero.jpg` | 1200x630 (127 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `eco-consultancy.jpg` | 1200x630 (124 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `eco-factory-dev.jpg` | 1200x630 (155 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `eco-finished-panels.jpg` | 1200x630 (214 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `eco-production-lines.jpg` | 1200x630 (179 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `eco-raw-materials.jpg` | 1200x630 (126 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `engineering-hero.jpg` | 1200x630 (174 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `engineering-philosophy.jpg` | 1200x630 (192 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `factory-hero.jpg` | 1200x630 (122 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `factory-layout-master.jpg` | 1200x630 (140 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `hero-nevo-line.jpg` | 1200x630 (171 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `hero-production-line.jpg` | 1200x630 (100 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `industries-tile.jpg` | 1200x630 (93 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `installation-hero.jpg` | 1200x630 (152 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `investor-hero.jpg` | 1200x630 (91 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `knowledge-cross-section.jpg` | 1200x630 (96 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `knowledge-datasheet.jpg` | 1200x630 (99 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `knowledge-fire-rating.jpg` | 1200x630 (129 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `knowledge-hub-hero.jpg` | 1200x630 (124 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `knowledge-investment.jpg` | 1200x630 (69 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `knowledge-pir-vs-pur.jpg` | 1200x630 (150 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `panels-tile.jpg` | 1200x630 (79 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `project-blueprint.jpg` | 1200x630 (132 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |
| `sustainability-hero.jpg` | 1200x630 (149 KB) | Social / OG card | 1200x630 (1.91:1) | (root layout); /$lang; /$lang/about; /$lang/ai-assistant; /$lang/ai-project-estimator; /$lang/careers; /$lang/contact; /$lang/customer-portal; /$lang/download-center; /$lang/engineering-tools; /$lang/factory-layout-generator; /$lang/factory-layouts; /$lang/industries; /$lang/installation-commissioning; /$lang/investment-calculator; /$lang/investors; /$lang/knowledge-hub; /$lang/knowledge-hub/$slug; /$lang/panel-thickness-calculator; /$lang/partner-portal; /$lang/pir-vs-rock-wool; /$lang/privacy; /$lang/product-configurator; /$lang/project-inquiry; /$lang/quality; /$lang/research-innovation; /$lang/solutions; /$lang/solutions/engineering-consultancy; /$lang/solutions/factory-development; /$lang/solutions/production-lines; /$lang/solutions/raw-materials; /$lang/solutions/sandwich-panels; /$lang/sustainability; /sitemap[/]xml; /sitemaps/$slug | `src/lib/og-images.ts` | — |

## `assets/og/knowledge`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `01-blueprint.jpg` | 1200x630 (120 KB) | Social / OG card | 1200x630 (1.91:1) | /$lang/knowledge-hub/$slug | `src/lib/og-article-covers.ts` | — |
| `03-3d-factory.jpg` | 1200x630 (214 KB) | Social / OG card | 1200x630 (1.91:1) | /$lang/knowledge-hub/$slug | `src/lib/og-article-covers.ts` | — |
| `06-production-line.jpg` | 1200x630 (132 KB) | Social / OG card | 1200x630 (1.91:1) | /$lang/knowledge-hub/$slug | `src/lib/og-article-covers.ts` | — |
| `07-laminator.jpg` | 1200x630 (104 KB) | Social / OG card | 1200x630 (1.91:1) | /$lang/knowledge-hub/$slug | `src/lib/og-article-covers.ts` | — |
| `14-polyol.jpg` | 1200x630 (127 KB) | Social / OG card | 1200x630 (1.91:1) | /$lang/knowledge-hub/$slug | `src/lib/og-article-covers.ts` | — |
| `16-rockwool.jpg` | 1200x630 (189 KB) | Social / OG card | 1200x630 (1.91:1) | /$lang/knowledge-hub/$slug | `src/lib/og-article-covers.ts` | — |
| `17-pir-panel.jpg` | 1200x630 (50 KB) | Social / OG card | 1200x630 (1.91:1) | /$lang/knowledge-hub/$slug | `src/lib/og-article-covers.ts` | — |
| `21-coldroom-panel.jpg` | 1200x630 (124 KB) | Social / OG card | 1200x630 (1.91:1) | /$lang/knowledge-hub/$slug | `src/lib/og-article-covers.ts` | — |
| `23-cleanroom.jpg` | 1200x630 (97 KB) | Social / OG card | 1200x630 (1.91:1) | /$lang/knowledge-hub/$slug | `src/lib/og-article-covers.ts` | — |
| `26-industrial-bldg.jpg` | 1200x630 (81 KB) | Social / OG card | 1200x630 (1.91:1) | /$lang/knowledge-hub/$slug | `src/lib/og-article-covers.ts` | — |
| `28-fire-rating.jpg` | 1200x630 (129 KB) | Social / OG card | 1200x630 (1.91:1) | /$lang/knowledge-hub/$slug | `src/lib/og-article-covers.ts` | — |
| `33-layout.jpg` | 1200x630 (170 KB) | Social / OG card | 1200x630 (1.91:1) | /$lang/knowledge-hub/$slug | `src/lib/og-article-covers.ts` | — |
| `36-investment-report.jpg` | 1200x630 (69 KB) | Social / OG card | 1200x630 (1.91:1) | /$lang/knowledge-hub/$slug | `src/lib/og-article-covers.ts` | — |

## `assets/panels`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `tile-01.jpg` | 1280x960 (103 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | NEVO PIR sandwich panel — premium engineered wall panel |
| `tile-02.jpg` | 1280x960 (88 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-03.jpg` | 1280x960 (81 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-04.jpg` | 1280x960 (130 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-05.jpg` | 1280x960 (205 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-06.jpg` | 1280x960 (144 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-07.jpg` | 1280x960 (116 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-08.jpg` | 1280x960 (162 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-09.jpg` | 1280x960 (114 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-10.jpg` | 1280x960 (85 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-11.jpg` | 1280x960 (82 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-12.jpg` | 1280x960 (73 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-13.jpg` | 1280x960 (199 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-14.jpg` | 1280x960 (115 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-15.jpg` | 1280x960 (142 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-16.jpg` | 1280x960 (157 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-17.jpg` | 1280x960 (136 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-18.jpg` | 1280x960 (141 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-19.jpg` | 1280x960 (152 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-20.jpg` | 1280x960 (128 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-21.jpg` | 1280x960 (101 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-22.jpg` | 1280x960 (85 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-23.jpg` | 1280x960 (68 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-24.jpg` | 1280x960 (147 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-25.jpg` | 1280x960 (133 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-26.jpg` | 1280x960 (209 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | Why NEVO Panels |
| `tile-27.jpg` | 1280x960 (111 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | — |
| `tile-28.jpg` | 1280x960 (117 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | NEVO panel connection systems |
| `tile-29.jpg` | 1280x960 (233 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/sandwich-panels | `src/routes/$lang.solutions.sandwich-panels.tsx` | Sustainability — NEVO panels |

## `assets/partner-portal`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `partner-01.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-02.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-03.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-04.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-05.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-06.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-07.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-08.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-09.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-10.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-11.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-12.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-13.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-14.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-15.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-16.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-17.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-18.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-19.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-20.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |
| `partner-21.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/partner-portal | `src/routes/$lang.partner-portal.tsx` | — |

## `assets/pir-vs-rockwool`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `app-clean-room.png` | 127x161 (27 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |
| `app-cold-steel-coil.png` | 126x161 (26 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |
| `app-commercial-building.png` | 122x161 (31 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |
| `app-industrial-building.png` | 127x161 (27 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |
| `app-warehouse.png` | 127x161 (32 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |
| `core-pir.png` | 146x149 (32 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |
| `core-rockwool.png` | 161x149 (34 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |
| `cross-pir.png` | 266x215 (76 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |
| `cross-rockwool.png` | 268x215 (74 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |
| `fire-pir.png` | 199x205 (56 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |
| `fire-rockwool.png` | 200x205 (59 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |
| `mechanical.png` | 292x169 (59 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |
| `ppgi-coil.png` | 230x169 (49 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |
| `thermal-pir.png` | 238x205 (63 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |
| `thermal-rockwool.png` | 231x205 (64 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/pir-vs-rock-wool | `src/routes/$lang.pir-vs-rock-wool.tsx` | — |

## `assets/portal`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `portal-01.png.asset.json` | CDN pointer (0 KB) | Card / section cover | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | NEVO customer portal |
| `portal-02.png.asset.json` | CDN pointer (0 KB) | Card / section cover | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | Project overview |
| `portal-03.png.asset.json` | CDN pointer (0 KB) | Card / section cover | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | Timeline |
| `portal-04.png.asset.json` | CDN pointer (0 KB) | Card / section cover | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | Shipping tracker |
| `portal-05.png.asset.json` | CDN pointer (0 KB) | Card / section cover | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | Engineering support |
| `portal-06.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-07.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-08.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-09.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-10.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-11.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-12.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-13.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-14.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-15.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-16.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-17.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-18.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-19.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-20.png.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | — |
| `portal-21.png.asset.json` | CDN pointer (0 KB) | Card / section cover | 1600x900 (16:9) | /$lang/customer-portal | `src/routes/$lang.customer-portal.tsx` | Engineering assistance |

## `assets/premium`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `01-aerial-factory.jpg.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang | `src/components/site/FeaturedFactory.tsx` | — |
| `04-warehouse-racking.jpg.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/factory-development | `src/routes/$lang.solutions.factory-development.tsx` | — |
| `12-engineer-bim.jpg.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/factory-development | `src/routes/$lang.solutions.factory-development.tsx` | — |
| `18-boardroom.jpg.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/factory-development | `src/routes/$lang.solutions.factory-development.tsx` | — |
| `22-site-survey.jpg.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/factory-development | `src/routes/$lang.solutions.factory-development.tsx` | — |
| `23-commissioning.jpg.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/factory-development | `src/routes/$lang.solutions.factory-development.tsx` | — |
| `24-masterplan.jpg.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/factory-development | `src/routes/$lang.solutions.factory-development.tsx` | — |
| `25-prodline-hero.jpg.asset.json` | CDN pointer (0 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang/solutions/production-lines | `src/routes/$lang.solutions.production-lines.tsx` | — |
| `26-prodline-detail.jpg.asset.json` | CDN pointer (0 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/production-lines | `src/routes/$lang.solutions.production-lines.tsx` | — |
| `homepage-hero-desktop.jpg.asset.json` | CDN pointer (0 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang | `src/components/site/Hero.tsx` | — |
| `homepage-hero-mobile.jpg.asset.json` | CDN pointer (0 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang | `src/components/site/Hero.tsx` | — |

## `assets/project`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `dubai.jpg` | 1280x960 (124 KB) | Card / section cover | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | NEVO Industrial — Dubai headquarters |
| `hero-factory.jpg` | 1920x1088 (232 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | NEVO engineering — 3D factory render |
| `tile-01.jpg` | 1280x960 (123 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-02.jpg` | 1280x960 (128 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-03.jpg` | 1280x960 (156 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-04.jpg` | 1280x960 (169 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-05.jpg` | 1280x960 (103 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-06.jpg` | 1280x960 (94 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-07.jpg` | 1280x960 (124 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-08.jpg` | 1280x960 (155 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-09.jpg` | 1280x960 (138 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-10.jpg` | 1280x960 (117 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-11.jpg` | 1280x960 (153 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-12.jpg` | 1280x960 (111 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-13.jpg` | 1280x960 (208 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-14.jpg` | 1280x960 (144 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-15.jpg` | 1280x960 (153 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-16.jpg` | 1280x960 (112 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-17.jpg` | 1280x960 (177 KB) | Card / section cover | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-18.jpg` | 1280x960 (122 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-19.jpg` | 1280x960 (151 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-20.jpg` | 1280x960 (94 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-21.jpg` | 1280x960 (149 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |
| `tile-22.jpg` | 1280x960 (92 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/project-inquiry | `src/routes/$lang.project-inquiry.tsx` | — |

## `assets/quality`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `qa-01-lab.jpg` | 1600x1067 (140 KB) | Card / section cover | 1600x900 (16:9) | /$lang/quality | `src/routes/$lang.quality.tsx` | — |
| `qa-02-thickness.jpg` | 1600x1067 (74 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/quality | `src/routes/$lang.quality.tsx` | — |
| `qa-03-fire.jpg` | 1600x1067 (117 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/quality | `src/routes/$lang.quality.tsx` | — |
| `qa-04-thermal.jpg` | 1600x1067 (92 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/quality | `src/routes/$lang.quality.tsx` | — |
| `qa-05-adhesion.jpg` | 1600x1067 (188 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/quality | `src/routes/$lang.quality.tsx` | — |
| `qa-06-dimensional.jpg` | 1600x1067 (176 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/quality | `src/routes/$lang.quality.tsx` | — |
| `qa-07-density.jpg` | 1600x1067 (87 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/quality | `src/routes/$lang.quality.tsx` | — |
| `qa-08-iso.jpg` | 1600x1067 (175 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/quality | `src/routes/$lang.quality.tsx` | — |
| `qa-09-audit.jpg` | 1600x1067 (216 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/quality | `src/routes/$lang.quality.tsx` | — |
| `qa-10-shipment.jpg` | 1600x1067 (214 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/quality | `src/routes/$lang.quality.tsx` | — |

## `assets/raw-materials`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `adhesive-sealants.jpg` | 1600x1200 (159 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `aluzinc-coil.jpg` | 196x237 (13 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `finished-panels.jpg` | 341x352 (33 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `gi-coil.jpg` | 196x237 (11 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `hero-production-line.jpg` | 1920x1088 (234 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | NEVO continuous double-belt laminator producing a PIR sandwich panel |
| `mdi-ibc.jpg` | 1600x1200 (245 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `pir-core.jpg` | 1600x1200 (183 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `pir-sandwich.jpg` | 512x410 (53 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `polyol-drum.jpg` | 1600x1200 (303 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `polyol-ibc.jpg` | 1600x1200 (214 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `ppgi-coil.jpg` | 1600x1200 (259 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `prepainted-coil.jpg` | 202x237 (11 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `production-line.jpg` | 512x398 (58 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `rock-wool-core.jpg` | 248x175 (12 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `rock-wool-panel.jpg` | 250x175 (13 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `warehouse-chemical.jpg` | 1600x1200 (282 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `warehouse-coil.jpg` | 250x170 (14 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `warehouse-raw.jpg` | 246x170 (13 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |
| `warehouse-shipping.jpg` | 250x170 (11 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/solutions/raw-materials | `src/routes/$lang.solutions.raw-materials.tsx` | — |

## `assets/research`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `ri-01-rd-lab.jpg` | 1024x1024 (153 KB) | Card / section cover | 1600x900 (16:9) | /$lang/research-innovation | `src/routes/$lang.research-innovation.tsx` | — |
| `ri-02-material-science.jpg` | 1024x1024 (130 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/research-innovation | `src/routes/$lang.research-innovation.tsx` | — |
| `ri-03-pir-foam.jpg` | 1024x1024 (149 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/research-innovation | `src/routes/$lang.research-innovation.tsx` | — |
| `ri-04-fire.jpg` | 1024x1024 (150 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/research-innovation | `src/routes/$lang.research-innovation.tsx` | — |
| `ri-05-thermal.jpg` | 1024x1024 (125 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/research-innovation | `src/routes/$lang.research-innovation.tsx` | — |
| `ri-06-digital-twin.jpg` | 1024x1024 (139 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/research-innovation | `src/routes/$lang.research-innovation.tsx` | — |
| `ri-07-prototype-line.jpg` | 1024x1024 (150 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/research-innovation | `src/routes/$lang.research-innovation.tsx` | — |
| `ri-08-ai-analytics.jpg` | 1024x1024 (117 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/research-innovation | `src/routes/$lang.research-innovation.tsx` | — |
| `ri-09-collaboration.jpg` | 1024x1024 (133 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/research-innovation | `src/routes/$lang.research-innovation.tsx` | — |
| `ri-10-future-lab.jpg` | 1024x1024 (112 KB) | Inline illustration / card | 1600x900 (16:9) | /$lang/research-innovation | `src/routes/$lang.research-innovation.tsx` | — |

## `assets/tools`

| Asset | Current | Slot | Required | Page(s) | Component | Alt text |
|---|---|---|---|---|---|---|
| `hero-cockpit.jpg` | 1920x1088 (149 KB) | Full-bleed hero | 2400x1200 (2:1), safe centre crop | /$lang/engineering-tools | `src/routes/$lang.engineering-tools.tsx` | — |

## Replacement rules

- Keep the same file path and name so no code changes are needed; only the binary is swapped.
- Deliver JPG for photography (quality 82, progressive) and PNG only for transparency.
- Match or exceed the `Required` size; never upscale a smaller source.
- Licensing: record source, licence type, and licence ID per file before committing.
- Re-run `python3 scripts/build-image-manifest.py` after any asset change to refresh this document.
