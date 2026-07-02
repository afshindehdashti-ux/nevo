# Nevo — Full Screenshot-Quality Audit (re-run)

_Run date: 2026-07-02 — post factory-layout/flow-diagram fix_

## Summary
- **Total image assets scanned**: `src/assets/**/*.{jpg,jpeg,png,webp}`
- **Passed (≥1000 px native)**: everything not listed below
- **Still flagged (<1000 px long edge)**: **29 files** across 3 legacy folders

## ✅ Just confirmed clean
- `src/assets/factory-layout/flow-diagram.png` — replaced with 1600×640 DSLR factory-line photo, loads via `factory-layout-generator.tsx` line 45 ✅
- All previously regenerated folders — `ai/`, `engineering/`, `knowledge/`, `project/`, `panels/`, `industries/`, `installation/`, `quality/`, `research/`, `factory-layouts/`, `machinery/`, `configurator/`, `corporate/`, `tools/`, `raw-materials/` hi-res subset, `factory-layout/` hi-res subset — all pass at 1024–1920 px native ✅

## ❌ Still requires replacement — 29 files

### `src/assets/raw-materials/` (12 files, all thumbnails ≤ 512 px)
Used by `src/routes/solutions.raw-materials.tsx`.

| File | Native |
|---|---|
| gi-coil.jpg | 196×237 |
| aluzinc-coil.jpg | 196×237 |
| prepainted-coil.jpg | 202×237 |
| rock-wool-core.jpg | 248×175 |
| rock-wool-panel.jpg | 250×175 |
| warehouse-raw.jpg | 246×170 |
| warehouse-coil.jpg | 250×170 |
| warehouse-shipping.jpg | 250×170 |
| steel-coils.jpg | 342×352 (unreferenced, safe to delete) |
| finished-panels.jpg | 341×352 |
| production-line.jpg | 512×398 |
| pir-sandwich.jpg | 512×410 |

### `src/assets/pir-vs-rockwool/` (15 PNGs, all 122–292 px thumbnails)
Used by `src/routes/pir-vs-rock-wool.tsx`.

app-cold-steel-coil, app-industrial-building, app-clean-room, app-commercial-building, app-warehouse, core-pir, core-rockwool, ppgi-coil, fire-pir, fire-rockwool, mechanical, thermal-pir, thermal-rockwool, cross-pir, cross-rockwool.

### `src/assets/factory-layout/` (2 diagrams below 1000 px)
Used by `src/routes/factory-layout-generator.tsx`.

| File | Native |
|---|---|
| top-view.png | 506×297 |
| master-3d.png | 730×399 |

## Load-integrity check
All 29 flagged files still resolve on disk and are imported by their respective routes — the app loads them without 404s; they simply render upscaled/blurry because the source pixels are thumbnail-grade. Every previously regenerated asset also resolves; no broken imports detected.

## Next action
Regenerate the 29 listed files as ultra-photorealistic 1600 px+ DSLR industrial photography (raw-materials + pir-vs-rockwool + 2 factory-layout diagrams). After that pass, zero screenshot-quality assets will remain anywhere in `src/assets/`.
