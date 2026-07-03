#!/usr/bin/env python3
"""
Consolidated failure index: one row per failing URL for the week.

Reads the enriched JSON report produced by verify_solutions_seo.py and emits
a single readable Markdown table (Locale | Path | URL | Issue count | Codes
| File | Fixes) suitable both for a downloadable artifact and for pasting
into GitHub's Step Summary.

Unlike the diff report (only new/resolved) or the full HTML dashboard (per-
check detail), this view answers one question: "what pages are broken RIGHT
NOW, at a glance?"

Env / args:
  --input   path to verify_solutions_seo.py JSON (required)
  --out     path to write the Markdown file (required)
  --append  optional path to APPEND the same markdown to (e.g. $GITHUB_STEP_SUMMARY)
  --title   optional H2 title (default: "Consolidated failure index")
"""
from __future__ import annotations
import argparse, json, sys
from collections import defaultdict
from pathlib import Path


def _md_cell(s: object) -> str:
    return str(s).replace("|", "\\|").replace("\n", "<br>")


def render(report: dict, title: str) -> str:
    issues = report.get("issues", []) or []
    total = report.get("total", 0)
    failed_pages = report.get("failed", 0)
    generated = report.get("generated_at", "unknown")
    base = report.get("base", "")

    lines: list[str] = [f"## {title}", ""]
    if not issues:
        lines += [
            f"_Snapshot generated at `{generated}` against `{base}`._",
            "",
            f"**All {total} pages passed.** No failing URLs to review.",
            "",
        ]
        return "\n".join(lines)

    # Group by (locale, path, url) so one broken page = one row, even when it
    # trips 5 different checks.
    by_url: dict[tuple[str, str, str], dict] = {}
    for i in issues:
        key = (i.get("locale", ""), i.get("path", ""), i.get("url", ""))
        row = by_url.setdefault(key, {
            "file_path": i.get("file_path", ""),
            "codes": [],
            "fixes": [],
        })
        row["codes"].append(i.get("issue_code", "UNKNOWN"))
        fix = i.get("fix") or ""
        if fix and fix not in row["fixes"]:
            row["fixes"].append(fix)

    lines += [
        f"_Snapshot generated at `{generated}` against `{base}`._",
        "",
        f"- **{failed_pages}** of **{total}** pages failing",
        f"- **{len(by_url)}** unique failing URL(s)",
        f"- **{len(issues)}** total issue(s)",
        "",
        "| # | Locale | Path | URL | Issues | Codes | File | Suggested fixes |",
        "| ---: | --- | --- | --- | ---: | --- | --- | --- |",
    ]
    for n, (key, row) in enumerate(
        sorted(by_url.items(), key=lambda kv: (-len(kv[1]["codes"]), kv[0][0], kv[0][1])),
        start=1,
    ):
        locale, path, url = key
        rel_url = url.replace(base, "") or url
        codes = ", ".join(f"`{c}`" for c in sorted(set(row["codes"])))
        fixes = "<br>".join(f"• {_md_cell(f)}" for f in row["fixes"]) or "—"
        lines.append(
            f"| {n} "
            f"| `{_md_cell(locale)}` "
            f"| `{_md_cell(path)}` "
            f"| [{_md_cell(rel_url)}]({url}) "
            f"| {len(row['codes'])} "
            f"| {codes} "
            f"| `{_md_cell(row['file_path'])}` "
            f"| {fixes} |"
        )
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--append")
    ap.add_argument("--title", default="Consolidated failure index")
    args = ap.parse_args()

    src = Path(args.input)
    if not src.exists():
        print(f"error: {args.input} missing", file=sys.stderr)
        return 1
    try:
        report = json.loads(src.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"error: cannot parse {args.input}: {e}", file=sys.stderr)
        return 1

    md = render(report, args.title)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(md + "\n", encoding="utf-8")
    print(f"wrote {out} ({len(md)} chars)")

    if args.append:
        Path(args.append).parent.mkdir(parents=True, exist_ok=True)
        with Path(args.append).open("a", encoding="utf-8") as fh:
            fh.write(md + "\n")
        print(f"appended to {args.append}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
