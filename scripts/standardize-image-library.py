#!/usr/bin/env python3
"""Standardize image filenames and metadata sidecars across the media library.

Two jobs, one convention:

1. FILENAMES -- every in-repo image must be lowercase kebab-case:
       <folder>/<slug>.<ext>       slug = [a-z0-9]+(-[a-z0-9]+)*
   Underscores, spaces, camelCase, double dashes and stray punctuation are
   rewritten and every textual reference in the repo is updated with it.

2. METADATA -- every image carries a sibling `<image>.license.json` sidecar
   using one canonical field set (see CANONICAL_FIELDS). Missing sidecars are
   created pre-filled from the image manifest (caption/alt/slot/routes), with
   empty sourcing fields for whoever licenses the replacement photo.
   Existing sidecars are re-ordered, back-filled and never lose custom keys.

Usage:
    python3 scripts/standardize-image-library.py            # report only
    python3 scripts/standardize-image-library.py --apply    # rename + write
    python3 scripts/standardize-image-library.py --check    # CI: fail on drift
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from collections import OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIRS = ("src/assets", "public")
IMAGE_EXTS = (".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg")
SLOTS_JSON = os.path.join(ROOT, "src/data/image-slots.json")
BASELINE = os.path.join(ROOT, "docs/image-provenance-baseline.json")

# Directories scanned when rewriting references after a rename.
REFERENCE_DIRS = ("src", "public", "docs", "scripts", "e2e", "tests")
REFERENCE_EXTS = (
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".json", ".md",
    ".html", ".py", ".yml", ".yaml", ".xml", ".txt",
)
SKIP_DIRS = {"node_modules", ".git", "dist", "build", ".output", ".vinxi", "__pycache__"}

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

# Canonical sidecar field order. Everything the sourcing team must fill in,
# plus the display metadata the site and the admin image library read.
CANONICAL_FIELDS = (
    "schema_version",     # int, bumped when this shape changes
    "asset",              # repo-relative image path (self-describing sidecar)
    "slot",               # human slot label from the manifest
    "routes",             # pages the image appears on
    "required_size",      # target dimensions for a replacement
    "caption",            # visible caption / figure text ("" when none)
    "alt",                # accessibility text
    "credit",             # attribution string to display
    "source",             # provider, agency, photographer or in-house shoot
    "source_url",         # asset page, contract or shoot folder
    "license",            # licence type
    "license_id",         # order / asset / contract ID
    "capture_date",       # YYYY-MM-DD
    "location",
    "restrictions",
    "ai_generated",       # bool
    "status",             # pending-sourcing | licensed
    "provenance_attestation",
)

SCHEMA_VERSION = 1
EMPTY_ATTESTATION = {"verified_by": "", "verified_on": "", "method": ""}


# --------------------------------------------------------------------------
# filenames
# --------------------------------------------------------------------------

def kebab(name: str) -> str:
    """Normalize a bare filename (no extension) to kebab-case."""
    # split camelCase / PascalCase boundaries before lowercasing
    name = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", "-", name)
    name = name.lower()
    name = re.sub(r"[^a-z0-9]+", "-", name)
    name = re.sub(r"-{2,}", "-", name).strip("-")
    return name or "image"


def iter_images() -> list[str]:
    found: list[str] = []
    for base in IMAGE_DIRS:
        abs_base = os.path.join(ROOT, base)
        if not os.path.isdir(abs_base):
            continue
        for dirpath, dirnames, filenames in os.walk(abs_base):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fn in filenames:
                if fn.lower().endswith(IMAGE_EXTS):
                    abs_path = os.path.join(dirpath, fn)
                    found.append(os.path.relpath(abs_path, ROOT).replace(os.sep, "/"))
    return sorted(found)


def planned_renames(images: list[str]) -> list[tuple[str, str]]:
    plan: list[tuple[str, str]] = []
    taken = set(images)
    for rel in images:
        folder, fn = os.path.split(rel)
        stem, ext = os.path.splitext(fn)
        new_stem = kebab(stem)
        new_rel = f"{folder}/{new_stem}{ext.lower()}"
        if new_rel == rel:
            continue
        if new_rel in taken:  # never clobber an existing asset
            suffix = 2
            while f"{folder}/{new_stem}-{suffix}{ext.lower()}" in taken:
                suffix += 1
            new_rel = f"{folder}/{new_stem}-{suffix}{ext.lower()}"
        taken.add(new_rel)
        plan.append((rel, new_rel))
    return plan


def iter_reference_files() -> list[str]:
    files: list[str] = []
    for base in REFERENCE_DIRS:
        abs_base = os.path.join(ROOT, base)
        if not os.path.isdir(abs_base):
            continue
        for dirpath, dirnames, filenames in os.walk(abs_base):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fn in filenames:
                if fn.endswith(REFERENCE_EXTS):
                    files.append(os.path.join(dirpath, fn))
    return files


def rewrite_references(plan: list[tuple[str, str]]) -> int:
    """Replace old filenames with new ones everywhere they're referenced."""
    # Match on the trailing `<folder>/<file>` pair so we never touch an
    # unrelated string that happens to share a stem.
    pairs = []
    for old, new in plan:
        old_tail = "/".join(old.split("/")[-2:])
        new_tail = "/".join(new.split("/")[-2:])
        pairs.append((old_tail, new_tail, os.path.basename(old), os.path.basename(new)))

    touched = 0
    for path in iter_reference_files():
        try:
            text = open(path, encoding="utf-8").read()
        except (UnicodeDecodeError, OSError):
            continue
        original = text
        for old_tail, new_tail, old_base, new_base in pairs:
            if old_tail in text:
                text = text.replace(old_tail, new_tail)
            elif old_base in text:
                text = text.replace(old_base, new_base)
        if text != original:
            open(path, "w", encoding="utf-8").write(text)
            touched += 1
    return touched


def git_mv(old: str, new: str) -> None:
    old_abs, new_abs = os.path.join(ROOT, old), os.path.join(ROOT, new)
    os.makedirs(os.path.dirname(new_abs), exist_ok=True)
    try:
        subprocess.run(["git", "mv", "-f", old, new], cwd=ROOT, check=True,
                       capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        os.replace(old_abs, new_abs)
    sidecar = old_abs + ".license.json"
    if os.path.isfile(sidecar):
        os.replace(sidecar, new_abs + ".license.json")


# --------------------------------------------------------------------------
# metadata sidecars
# --------------------------------------------------------------------------

def load_slots() -> dict[str, dict]:
    try:
        data = json.load(open(SLOTS_JSON, encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return {s["assetPath"]: s for s in data.get("slots", [])}


def load_pending() -> set[str]:
    try:
        return set(json.load(open(BASELINE, encoding="utf-8")).get("pending_replacement", []))
    except (OSError, json.JSONDecodeError):
        return set()


def canonical_sidecar(rel: str, existing: dict | None, slot: dict | None,
                      pending: set[str]) -> OrderedDict:
    existing = existing or {}
    slot = slot or {}
    ai_flag = existing.get("ai_generated")
    if ai_flag is None:
        ai_flag = rel in pending  # baselined assets are the AI placeholders

    defaults = {
        "schema_version": SCHEMA_VERSION,
        "asset": rel,
        "slot": slot.get("slot", ""),
        "routes": slot.get("routes", []),
        "required_size": slot.get("required", ""),
        "caption": "",
        "alt": slot.get("alt", ""),
        "credit": "",
        "source": "",
        "source_url": "",
        "license": "",
        "license_id": "",
        "capture_date": "",
        "location": "",
        "restrictions": "",
        "ai_generated": bool(ai_flag),
        "status": "pending-sourcing",
        "provenance_attestation": dict(EMPTY_ATTESTATION),
    }

    out: OrderedDict = OrderedDict()
    for field in CANONICAL_FIELDS:
        value = existing.get(field, defaults[field])
        if value in (None, [], {}) and field not in ("routes", "provenance_attestation"):
            value = defaults[field]
        out[field] = value

    # Always keep these authoritative / derived rather than stale.
    out["schema_version"] = SCHEMA_VERSION
    out["asset"] = rel
    if slot:
        out["slot"] = out["slot"] or slot.get("slot", "")
        out["routes"] = slot.get("routes", out["routes"])
        out["required_size"] = out["required_size"] or slot.get("required", "")
        out["alt"] = out["alt"] or slot.get("alt", "")

    att = out.get("provenance_attestation") or {}
    out["provenance_attestation"] = OrderedDict(
        (k, att.get(k, "")) for k in EMPTY_ATTESTATION
    )

    licensed = bool(out["source"] and out["license"] and out["license_id"]) \
        and not out["ai_generated"]
    if out["status"] not in ("pending-sourcing", "licensed"):
        out["status"] = "licensed" if licensed else "pending-sourcing"
    else:
        out["status"] = "licensed" if licensed else "pending-sourcing"

    # Preserve any project-specific extras after the canonical block.
    for key, value in existing.items():
        if key not in out:
            out[key] = value
    return out


def sync_sidecars(images: list[str], apply: bool) -> tuple[int, int]:
    slots, pending = load_slots(), load_pending()
    created = updated = 0
    for rel in images:
        path = os.path.join(ROOT, rel + ".license.json")
        existing = None
        if os.path.isfile(path):
            try:
                existing = json.load(open(path, encoding="utf-8"))
            except json.JSONDecodeError:
                existing = None
        wanted = canonical_sidecar(rel, existing, slots.get(rel), pending)
        serialized = json.dumps(wanted, indent=2, ensure_ascii=False) + "\n"
        current = open(path, encoding="utf-8").read() if os.path.isfile(path) else None
        if current == serialized:
            continue
        if current is None:
            created += 1
        else:
            updated += 1
        if apply:
            open(path, "w", encoding="utf-8").write(serialized)
    return created, updated


# --------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="rename files and write sidecars")
    parser.add_argument("--check", action="store_true", help="exit non-zero when drift exists")
    args = parser.parse_args()

    images = iter_images()
    plan = planned_renames(images)

    print(f"Image library: {len(images)} image(s) under {', '.join(IMAGE_DIRS)}.")
    if plan:
        print(f"\nFilenames off-convention ({len(plan)}):")
        for old, new in plan:
            print(f"  {old}\n    -> {new}")
    else:
        print("Filenames: all lowercase kebab-case. OK")

    if args.apply and plan:
        for old, new in plan:
            git_mv(old, new)
        touched = rewrite_references(plan)
        print(f"\nRenamed {len(plan)} file(s); updated references in {touched} file(s).")
        images = iter_images()

    created, updated = sync_sidecars(images, apply=args.apply)
    verb = "Wrote" if args.apply else "Would write"
    if created or updated:
        print(f"\nMetadata sidecars: {verb} {created} new, {updated} normalized "
              f"(canonical fields: {', '.join(CANONICAL_FIELDS[:6])}, ...).")
    else:
        print("Metadata sidecars: every image has a canonical .license.json. OK")

    if args.check and (plan or created or updated):
        print("\nFAIL: run `python3 scripts/standardize-image-library.py --apply` "
              "to standardize filenames and metadata.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
