#!/usr/bin/env python3
"""Provenance validation for in-use image assets.

Blocks placeholder / AI-generated imagery from reaching a build or deploy by
checking, for every image imported by application code:

  1. Licence sidecar   -- <image>.license.json with source, licence and rights.
  2. C2PA manifest     -- embedded Content Credentials (JUMBF/c2pa box).
  3. AI-detection      -- C2PA generative claims, generator signatures in
                          EXIF/XMP, and structural heuristics typical of
                          text-to-image output.
  4. EXIF / capture    -- camera make, model or capture timestamp, unless the
                          sidecar carries a signed provenance attestation.

Findings are graded ERROR (blocking) or WARN. Files listed in the baseline
(docs/image-provenance-baseline.json) are known-pending replacements: their
errors are downgraded to warnings so the gate fails only on new or regressed
assets. Remove entries from the baseline as real photography lands.

Usage:
  python3 scripts/check-image-provenance.py            # gate (non-zero on error)
  python3 scripts/check-image-provenance.py --warn-only
  python3 scripts/check-image-provenance.py --json
  python3 scripts/check-image-provenance.py --write-baseline
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field

from PIL import Image, ExifTags

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "src")
BASELINE = os.path.join(ROOT, "docs", "image-provenance-baseline.json")

IMAGE_EXT = (".jpg", ".jpeg", ".png", ".webp", ".avif")

# Software / XMP strings emitted by common generative tools.
AI_SIGNATURES = re.compile(
    r"(midjourney|stable\s*diffusion|dall[\s\-·]?e|firefly|imagen|flux\.?1|"
    r"nano\s*banana|gpt-?image|ideogram|leonardo\.ai|playground\s*v2|"
    r"generativeai|ai[_\s-]?generated|trainedAlgorithmicMedia|"
    r"compositeWithTrainedAlgorithmicMedia)",
    re.I,
)
C2PA_MARKERS = (b"c2pa", b"jumbf", b"urn:uuid:c2pa", b"c2pa.assertions")

REQUIRED_SIDECAR_FIELDS = ("source", "license", "license_id", "credit", "ai_generated")

# Square power-of-two canvases are the default output of most diffusion models
# and effectively never a deliberate photographic crop in this project.
AI_TYPICAL_SIZES = {(1024, 1024), (512, 512), (768, 768), (1536, 1536), (2048, 2048)}


@dataclass
class Finding:
    asset: str
    level: str  # "error" | "warn"
    code: str
    message: str


@dataclass
class AssetReport:
    asset: str
    width: int = 0
    height: int = 0
    has_sidecar: bool = False
    has_c2pa: bool = False
    has_exif: bool = False
    ai_flags: list[str] = field(default_factory=list)
    findings: list[Finding] = field(default_factory=list)


def in_use_images() -> list[str]:
    """Every image imported from a .ts/.tsx module under src/."""
    imp = re.compile(
        r'import\s+[A-Za-z0-9_]+\s+from\s+["\']([^"\']+\.(?:jpg|jpeg|png|webp|avif))["\']'
    )
    found: set[str] = set()
    for dirpath, _dirs, files in os.walk(SRC):
        for name in files:
            if not name.endswith((".ts", ".tsx")):
                continue
            path = os.path.join(dirpath, name)
            try:
                text = open(path, errors="ignore").read()
            except OSError:
                continue
            for spec in imp.findall(text):
                if spec.startswith("@/"):
                    target = os.path.join(SRC, spec[2:])
                elif spec.startswith("."):
                    target = os.path.normpath(os.path.join(dirpath, spec))
                else:
                    continue
                if os.path.isfile(target):
                    found.add(os.path.relpath(target, ROOT))
    return sorted(found)


def read_sidecar(abs_path: str) -> tuple[dict | None, str | None]:
    sidecar = abs_path + ".license.json"
    if not os.path.isfile(sidecar):
        return None, None
    try:
        return json.load(open(sidecar)), sidecar
    except (json.JSONDecodeError, OSError) as exc:
        return {"__error__": str(exc)}, sidecar


def scan_binary(abs_path: str) -> tuple[bool, list[str]]:
    """Return (has_c2pa, ai_signature_hits) from raw bytes + embedded XMP."""
    try:
        blob = open(abs_path, "rb").read()
    except OSError:
        return False, []
    lowered = blob.lower()
    has_c2pa = any(marker in lowered for marker in C2PA_MARKERS)
    hits: list[str] = []
    for match in AI_SIGNATURES.finditer(blob.decode("latin-1", "ignore")):
        token = match.group(0).strip()
        if token not in hits:
            hits.append(token)
    return has_c2pa, hits[:5]


def exif_summary(abs_path: str) -> tuple[int, int, bool, list[str]]:
    width = height = 0
    has_exif = False
    hits: list[str] = []
    try:
        with Image.open(abs_path) as img:
            width, height = img.size
            raw = getattr(img, "getexif", lambda: None)()
            if raw:
                tags = {ExifTags.TAGS.get(k, k): v for k, v in raw.items()}
                capture_keys = ("Make", "Model", "DateTimeOriginal", "DateTime", "LensModel")
                has_exif = any(str(tags.get(k, "")).strip() for k in capture_keys)
                for key in ("Software", "ImageDescription", "Artist", "XPComment"):
                    value = str(tags.get(key, ""))
                    if value and AI_SIGNATURES.search(value):
                        hits.append(f"EXIF:{key}={value[:60]}")
    except Exception:  # unreadable/exotic encodings are reported by other checks
        pass
    return width, height, has_exif, hits


def evaluate(rel_path: str) -> AssetReport:
    abs_path = os.path.join(ROOT, rel_path)
    report = AssetReport(asset=rel_path)

    sidecar, sidecar_path = read_sidecar(abs_path)
    has_c2pa, byte_hits = scan_binary(abs_path)
    width, height, has_exif, exif_hits = exif_summary(abs_path)

    report.width, report.height = width, height
    report.has_c2pa = has_c2pa
    report.has_exif = has_exif
    report.has_sidecar = bool(sidecar) and "__error__" not in sidecar
    report.ai_flags = byte_hits + exif_hits

    add = report.findings.append

    # 1. Licence sidecar
    if sidecar is None:
        add(Finding(rel_path, "error", "missing-license",
                    f"No licence sidecar. Create {os.path.basename(abs_path)}.license.json "
                    f"with {', '.join(REQUIRED_SIDECAR_FIELDS)}."))
    elif "__error__" in sidecar:
        add(Finding(rel_path, "error", "invalid-license",
                    f"Licence sidecar is not valid JSON: {sidecar['__error__']}"))
    else:
        missing = [f for f in REQUIRED_SIDECAR_FIELDS if f not in sidecar]
        if missing:
            add(Finding(rel_path, "error", "incomplete-license",
                        f"Licence sidecar missing field(s): {', '.join(missing)}."))
        if sidecar.get("ai_generated") is True:
            add(Finding(rel_path, "error", "declared-ai",
                        "Sidecar declares ai_generated: true — replace with licensed photography."))
        if str(sidecar.get("license", "")).lower() in {"", "placeholder", "unknown", "tbd"}:
            add(Finding(rel_path, "error", "placeholder-license",
                        "Licence field is a placeholder value."))

    # 2 + 3. AI detection
    if report.ai_flags:
        add(Finding(rel_path, "error", "ai-signature",
                    "Generative-AI signature detected: " + "; ".join(report.ai_flags)))
    if (width, height) in AI_TYPICAL_SIZES and not has_exif and not has_c2pa:
        add(Finding(rel_path, "error", "ai-heuristic",
                    f"{width}x{height} canvas with no EXIF and no Content Credentials — "
                    "matches text-to-image output."))

    attested = bool(report.has_sidecar and sidecar and sidecar.get("provenance_attestation"))

    # 2. C2PA Content Credentials
    if not has_c2pa and not attested:
        add(Finding(rel_path, "warn", "no-c2pa",
                    "No embedded C2PA Content Credentials; add them or a signed "
                    "provenance_attestation in the sidecar."))

    # 4. EXIF capture metadata
    if not has_exif and not attested:
        add(Finding(rel_path, "error", "no-exif",
                    "No camera EXIF (Make/Model/DateTimeOriginal) and no provenance "
                    "attestation — cannot verify this is real photography."))

    return report


def load_baseline() -> set[str]:
    if not os.path.isfile(BASELINE):
        return set()
    try:
        data = json.load(open(BASELINE))
        return set(data.get("pending_replacement", []))
    except (json.JSONDecodeError, OSError):
        return set()


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate image provenance before build/deploy.")
    parser.add_argument("--warn-only", action="store_true", help="never exit non-zero")
    parser.add_argument("--json", action="store_true", help="machine-readable report")
    parser.add_argument("--ignore-baseline", action="store_true",
                        help="treat baselined assets as blocking too")
    parser.add_argument("--write-baseline", action="store_true",
                        help="record every currently failing asset as pending replacement")
    args = parser.parse_args()

    assets = in_use_images()
    reports = [evaluate(a) for a in assets]
    baseline = set() if (args.ignore_baseline or args.write_baseline) else load_baseline()

    blocking: list[Finding] = []
    warnings: list[Finding] = []
    for report in reports:
        for finding in report.findings:
            if finding.level == "error" and report.asset not in baseline:
                blocking.append(finding)
            else:
                warnings.append(finding)

    if args.write_baseline:
        pending = sorted({f.asset for f in blocking})
        os.makedirs(os.path.dirname(BASELINE), exist_ok=True)
        json.dump(
            {
                "note": "Assets awaiting genuinely sourced or licensed photography. "
                        "Errors on these are downgraded to warnings. Remove an entry "
                        "once its replacement passes provenance validation; never add new ones.",
                "pending_replacement": pending,
            },
            open(BASELINE, "w"),
            indent=2,
        )
        print(f"Baseline written: {len(pending)} asset(s) pending replacement -> {BASELINE}")
        return 0

    if args.json:
        print(json.dumps({
            "scanned": len(reports),
            "baselined": len(baseline),
            "errors": [f.__dict__ for f in blocking],
            "warnings": [f.__dict__ for f in warnings],
            "assets": [
                {
                    "asset": r.asset, "size": f"{r.width}x{r.height}",
                    "sidecar": r.has_sidecar, "c2pa": r.has_c2pa, "exif": r.has_exif,
                    "ai_flags": r.ai_flags,
                    "findings": [f.__dict__ for f in r.findings],
                }
                for r in reports
            ],
        }, indent=2))
    else:
        print(f"Image provenance: scanned {len(reports)} in-use image(s), "
              f"{len(baseline)} baselined as pending replacement.\n")
        by_asset: dict[str, list[Finding]] = {}
        for finding in blocking:
            by_asset.setdefault(finding.asset, []).append(finding)
        for asset, items in sorted(by_asset.items()):
            print(f"ERROR {asset}")
            for item in items:
                print(f"   - [{item.code}] {item.message}")
        if blocking:
            print()
        codes: dict[str, int] = {}
        for finding in warnings:
            codes[finding.code] = codes.get(finding.code, 0) + 1
        if codes:
            print("Warnings (non-blocking): " +
                  ", ".join(f"{code} x{count}" for code, count in sorted(codes.items())))
        print(f"\nBlocking findings: {len(blocking)}")
        if not blocking:
            print("PASS — no new placeholder or AI-style imagery detected.")

    if blocking and not args.warn_only:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
