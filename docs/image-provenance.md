# Image provenance validation

Automated gate that stops placeholder or AI-generated imagery from reaching a
build or deploy. It runs over every image actually imported by application
code (the same set as [`docs/image-manifest.md`](./image-manifest.md)).

```bash
npm run check:images            # gate — non-zero exit on new failures
npm run check:images:warn       # report only
npm run check:images:json       # machine-readable
npm run check:images:strict     # ignore the baseline (full target state)
npm run check:images:baseline   # re-record pending assets
```

It is part of `npm run check:all` and runs in CI via
`.github/workflows/image-provenance.yml`.

## What is checked

| Check | Code | Level | Rule |
|---|---|---|---|
| Licence sidecar present | `missing-license` | error | `<image>.license.json` must exist |
| Sidecar parses | `invalid-license` | error | valid JSON |
| Sidecar complete | `incomplete-license` | error | `source`, `license`, `license_id`, `credit`, `ai_generated` |
| Declared AI | `declared-ai` | error | `ai_generated: true` is rejected |
| Placeholder licence | `placeholder-license` | error | `""`, `placeholder`, `unknown`, `tbd` |
| Generator signature | `ai-signature` | error | Midjourney / SD / DALL·E / Firefly / Imagen / Flux / GPT-Image / Ideogram strings, and C2PA `trainedAlgorithmicMedia` claims, in raw bytes, XMP or EXIF `Software`/`Artist`/`ImageDescription` |
| AI-shaped output | `ai-heuristic` | error | square power-of-two canvas (1024², 512², …) with no EXIF and no Content Credentials |
| Content Credentials | `no-c2pa` | warn | no embedded C2PA/JUMBF manifest |
| Camera metadata | `no-exif` | error | no `Make`/`Model`/`DateTimeOriginal` and no signed attestation |

`provenance_attestation` in the sidecar satisfies the C2PA and EXIF checks for
legitimately stripped files (many stock providers remove EXIF on export).

## Licence sidecar format

Save next to the image as `<filename>.license.json`:

```json
{
  "source": "Getty Images",
  "source_url": "https://www.gettyimages.com/detail/photo/1234567890",
  "license": "Royalty-free, editorial and commercial",
  "license_id": "GI-1234567890",
  "credit": "Photographer Name / Getty Images",
  "capture_date": "2025-11-04",
  "ai_generated": false,
  "provenance_attestation": {
    "verified_by": "afshin@nevoindustrial.com",
    "verified_on": "2026-08-18",
    "method": "invoice + provider licence certificate on file"
  }
}
```

A copy-ready template lives at
[`docs/templates/image-license.template.json`](./templates/image-license.template.json).

## Baseline

`docs/image-provenance-baseline.json` lists the assets currently awaiting real
photography. Their errors are downgraded to warnings, so the gate only fails on
**new or regressed** assets.

Rules:

- Never add entries. A new image must pass on its own.
- Remove an entry the moment its replacement lands with a valid sidecar.
- `npm run check:images:strict` shows the full target state (baseline ignored).

Progress is simply the shrinking length of `pending_replacement`.
