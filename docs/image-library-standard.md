# Image library standard

One naming rule and one metadata shape for every image in the repo, so sourcing
and licence verification is mechanical rather than archaeological.

Enforced by `npm run check:image-library`
(`scripts/standardize-image-library.py`), which runs in `check:all` and in the
**Image provenance** GitHub workflow.

## 1. Filenames

```
<folder>/<slug>.<ext>          slug = [a-z0-9]+(-[a-z0-9]+)*
```

- Lowercase kebab-case only — no underscores, spaces, camelCase or double dashes.
- Extension lowercase (`.jpg`, not `.JPG`; keep `.jpg` over `.jpeg`).
- Folder = the area the image serves (`src/assets/knowledge/`,
  `src/assets/og/knowledge/`, `src/assets/machinery/`, …).
- Ordered series keep their numeric prefix: `knowledge/07-laminator.jpg`.
- Social cards mirror their source path under `src/assets/og/`.

Renaming is never manual: `npm run fix:image-library` moves the file, moves its
sidecar and rewrites every reference in `src`, `public`, `docs`, `scripts`,
`e2e` and `tests`.

## 2. Metadata sidecar

Every image has a sibling `<image>.license.json` with this exact field order:

| Field | Meaning |
| --- | --- |
| `schema_version` | Sidecar shape version (currently `1`) |
| `asset` | Repo-relative path of the image it describes |
| `slot` | Slot label from the image manifest (hero, card, OG card, …) |
| `routes` | Pages the image renders on |
| `required_size` | Target dimensions for a replacement photo |
| `caption` | Visible caption / figure text (`""` when the slot shows none) |
| `alt` | Accessibility text |
| `credit` | Attribution string to display where the licence requires it |
| `source` | Provider, agency, photographer or in-house shoot |
| `source_url` | Asset page, contract or shoot folder |
| `license` | Licence type, e.g. "Royalty-free, commercial + editorial" |
| `license_id` | Order / asset / contract ID proving the licence |
| `capture_date` | `YYYY-MM-DD` |
| `location` | Where the photograph was taken |
| `restrictions` | Model/property release, territory or term limits |
| `ai_generated` | `true` for the remaining placeholder renders |
| `status` | `pending-sourcing` or `licensed` (derived, do not hand-edit) |
| `provenance_attestation` | `verified_by`, `verified_on`, `method` |

`status` flips to `licensed` automatically once `source`, `license` and
`license_id` are filled and `ai_generated` is `false`. Project-specific extra
keys are preserved and sorted after the canonical block.

## 3. Replacing a photo

1. Source the photo at the `required_size` in the sidecar.
2. Fill `source`, `source_url`, `license`, `license_id`, `credit`,
   `capture_date`, `caption`, and set `ai_generated: false`.
3. Complete `provenance_attestation`.
4. Run `npm run fix:image-library` (normalizes ordering and `status`) and
   `npm run check:images` (provenance gate).
5. Remove the asset from `docs/image-provenance-baseline.json`.

Non-technical replacements go through **Admin → Workspace → Image Library**
(`/admin/images`), which captures the same source/licence/credit fields.
