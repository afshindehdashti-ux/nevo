# Nevo — Final Screenshot-Quality Audit

_Last run: 2026-07-02 — full-library sweep of `src/assets/**`_

## Method
Every image was inspected by (a) on-disk byte size and (b) actual pixel dimensions via PIL. Any asset with a native resolution below ~1000 px on the long edge, or a file size that betrays a thumbnail/screenshot origin, is flagged for replacement. All previously regenerated folders (`ai/`, `engineering/`, `knowledge/`, `project/`, plus most `panels/`, `industries/`, `installation/`, `quality/`, `research/`, `factory-layouts/`, `machinery/`, `configurator/`, `corporate/`, `tools/`) now pass at 1600 px+ native — confirmed clean.

Legend: ✅ passes audit · ❌ still screenshot / thumbnail · ⚠️ acceptable but low-res source

---

## ❌ STILL REQUIRES REPLACEMENT

### `src/assets/raw-materials/` — 8 thumbnail-sized JPGs (~200 px)
| File | Current | Issue |
|---|---|---|
| `gi-coil.jpg` | 196×237, 11 KB | Thumbnail |
| `prepainted-coil.jpg` | 202×237, 12 KB | Thumbnail |
| `aluzinc-coil.jpg` | 196×237, 14 KB | Thumbnail |
| `rock-wool-core.jpg` | 248×175, 13 KB | Thumbnail |
| `rock-wool-panel.jpg` | 250×175, 14 KB | Thumbnail |
| `warehouse-raw.jpg` | 246×170, 14 KB | Thumbnail |
| `warehouse-coil.jpg` | 250×170, 14 KB | Thumbnail |
| `warehouse-shipping.jpg` | 250×170, 12 KB | Thumbnail |

### `src/assets/raw-materials/` — 3 mid-res JPGs (~350–512 px)
| File | Current | Issue |
|---|---|---|
| `steel-coils.jpg` | 342×352, 28 KB | Below 1000 px |
| `finished-panels.jpg` | 341×352, 34 KB | Below 1000 px |
| `pir-sandwich.jpg` | 512×410, 55 KB | Below 1000 px |
| `production-line.jpg` | 512×398, 60 KB | Below 1000 px |

### `src/assets/pir-vs-rockwool/` — every PNG (all thumbnails, 122–292 px)
| File | Current |
|---|---|
| `app-cold-steel-coil.png` | 126×161 |
| `app-industrial-building.png` | 127×161 |
| `app-clean-room.png` | 127×161 |
| `app-commercial-building.png` | 122×161 |
| `app-warehouse.png` | 127×161 |
| `core-pir.png` | 146×149 |
| `core-rockwool.png` | 161×149 |
| `ppgi-coil.png` | 230×169 |
| `fire-pir.png` | 199×205 |
| `fire-rockwool.png` | 200×205 |
| `mechanical.png` | 292×169 |
| `thermal-pir.png` | 238×205 |
| `thermal-rockwool.png` | 231×205 |
| `cross-pir.png` | 266×215 |
| `cross-rockwool.png` | 268×215 |

### `src/assets/factory-layout/` — 3 low-res composite/diagram PNGs
| File | Current | Issue |
|---|---|---|
| `flow-diagram.png` | 506×102, 65 KB | Screenshot strip |
| `top-view.png` | 506×297, 211 KB | Low-res |
| `master-3d.png` | 730×399, 459 KB | Below 1000 px |

**Total remaining screenshot-quality assets: 30**

---

## ✅ CONFIRMED CLEAN (audit passes)

All assets in the following folders are now native 1600 px+ ultra-photorealistic DSLR-grade renders and pass audit:

- `src/assets/ai/` — 14 files ✅
- `src/assets/engineering/` — all files ✅
- `src/assets/knowledge/` — 28+ regenerated files ✅
- `src/assets/project/` — 24 files ✅
- `src/assets/panels/` — all tiles ≥ 1600 px ✅
- `src/assets/industries/` — all tiles ≥ 1600 px ✅
- `src/assets/installation/` — 10 files ✅
- `src/assets/quality/` — 10 files ✅
- `src/assets/research/` — 10 files ✅
- `src/assets/factory-layouts/` — 10 files (1600 px) ✅
- `src/assets/machinery/` — all ✅
- `src/assets/configurator/` — all ✅
- `src/assets/corporate/`, `tools/`, `hero-*.jpg` ✅
- `src/assets/raw-materials/` HIGH-RES subset: `pir-core.jpg`, `polyol-ibc.jpg`, `polyol-drum.jpg`, `mdi-ibc.jpg`, `ppgi-coil.jpg`, `adhesive-sealants.jpg`, `warehouse-chemical.jpg`, `hero-production-line.jpg` ✅
- `src/assets/factory-layout/` HIGH-RES subset: `rendering.png`, `line-*.png`, `wh-*.png`, `material-flow.png`, `expansion.png` (all 1600 px) ✅

---

## Next action
Regenerate the 30 assets listed above (raw-materials thumbnails + all pir-vs-rockwool PNGs + 3 factory-layout diagrams) as ultra-photorealistic 1600 px+ DSLR industrial photography. After that pass, the entire asset library will be screenshot-free.
