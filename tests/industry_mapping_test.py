#!/usr/bin/env python3
"""CI check: industry card image ↔ icon ↔ slot mapping is intact.

Guards against three regressions:
  1. Someone reorders INDUSTRY_IMGS or INDUSTRY_ICONS in
     src/routes/$lang.industries.tsx so an industry gets the wrong icon.
  2. Someone swaps an image file (e.g. tile-10.jpg) for content that no
     longer matches its industry slot — the pinned sha256 breaks.
  3. A required tile file is missing.

Source of truth: tests/industry-mapping.json. After an intentional image or
ordering change, update that file in the same commit.

Run:
    python tests/industry_mapping_test.py

Exit 0 on pass, 1 on any mismatch.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROUTE = ROOT / "src/routes/$lang.industries.tsx"
ASSETS = ROOT / "src/assets/industries"
MAPPING = ROOT / "tests/industry-mapping.json"


def parse_route_arrays(src: str) -> tuple[list[str], list[str]]:
    """Extract INDUSTRY_IMGS and INDUSTRY_ICONS array contents in order."""
    def grab(name: str) -> list[str]:
        m = re.search(rf"const\s+{name}\s*=\s*\[([^\]]+)\]", src)
        if not m:
            raise RuntimeError(f"could not find {name} in industries route")
        return [tok.strip() for tok in m.group(1).split(",") if tok.strip()]

    imgs = grab("INDUSTRY_IMGS")
    icons = grab("INDUSTRY_ICONS")
    return imgs, icons


def parse_image_imports(src: str) -> dict[str, str]:
    """Map local import name -> tile filename, e.g. 't10' -> 'tile-10.jpg'."""
    out: dict[str, str] = {}
    for m in re.finditer(
        r'import\s+(\w+)\s+from\s+"@/assets/industries/(tile-\d+\.jpg)"', src
    ):
        out[m.group(1)] = m.group(2)
    return out


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    mapping = json.loads(MAPPING.read_text())["industries"]
    src = ROUTE.read_text()
    imgs_syms, icon_syms = parse_route_arrays(src)
    sym_to_tile = parse_image_imports(src)

    errors: list[str] = []

    if len(imgs_syms) != len(mapping):
        errors.append(
            f"INDUSTRY_IMGS length {len(imgs_syms)} != mapping length {len(mapping)}"
        )
    if len(icon_syms) != len(mapping):
        errors.append(
            f"INDUSTRY_ICONS length {len(icon_syms)} != mapping length {len(mapping)}"
        )

    for i, entry in enumerate(mapping):
        slot = entry["slot"]
        slug = entry["slug"]
        want_tile = entry["tile"]
        want_icon = entry["icon"]
        want_sha = entry["sha256"]
        prefix = f"slot {slot} ({slug})"

        # 1. Route imports the expected tile at this slot.
        if i < len(imgs_syms):
            sym = imgs_syms[i]
            got_tile = sym_to_tile.get(sym)
            if got_tile is None:
                errors.append(
                    f"{prefix}: INDUSTRY_IMGS[{i}] = {sym!r} — no matching image import"
                )
            elif got_tile != want_tile:
                errors.append(
                    f"{prefix}: expected {want_tile}, INDUSTRY_IMGS[{i}] resolves to {got_tile}"
                )

        # 2. Route uses the expected icon at this slot.
        if i < len(icon_syms) and icon_syms[i] != want_icon:
            errors.append(
                f"{prefix}: expected icon {want_icon}, INDUSTRY_ICONS[{i}] = {icon_syms[i]}"
            )

        # 3. Tile file exists and matches the pinned sha256.
        tile_path = ASSETS / want_tile
        if not tile_path.exists():
            errors.append(f"{prefix}: {tile_path.relative_to(ROOT)} is missing")
            continue
        got_sha = sha256(tile_path)
        if got_sha != want_sha:
            errors.append(
                f"{prefix}: {want_tile} sha256 mismatch\n"
                f"        expected {want_sha}\n"
                f"        actual   {got_sha}\n"
                f"        (image content changed — update tests/industry-mapping.json "
                f"if intentional)"
            )

    if errors:
        print("Industry mapping check FAILED:\n")
        for e in errors:
            print(f"  - {e}")
        return 1

    print(f"Industry mapping OK — {len(mapping)} slots verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
