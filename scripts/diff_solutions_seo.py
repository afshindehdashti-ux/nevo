#!/usr/bin/env python3
"""
Diff two Solutions SEO JSON reports and emit a Markdown summary of only the
issues that are NEW or RESOLVED between the previous and current run.

Usage:
  diff_solutions_seo.py --previous prev.json --current cur.json [--out diff.md]

If --previous is missing or unreadable, prints a "baseline" note (nothing to
diff against) and exits 0. Never exits non-zero on diff content — this script
is a reporter, not a gate.

Issue identity = (url, issue_code). Two runs with the same (url, issue_code)
are considered the same issue; message-text drift is ignored.
"""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path


def load(path: str | None) -> dict | None:
    if not path:
        return None
    p = Path(path)
    if not p.exists() or p.stat().st_size == 0:
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        print(f"warn: cannot read {path}: {e}", file=sys.stderr)
        return None


def index_issues(report: dict) -> dict[tuple[str, str], dict]:
    """Index issues by (url, issue_code) for fast set diff."""
    out: dict[tuple[str, str], dict] = {}
    for i in report.get("issues", []) or []:
        key = (i.get("url", ""), i.get("issue_code", "UNKNOWN"))
        out[key] = i
    return out


def _md_cell(s: object) -> str:
    return str(s).replace("|", "\\|").replace("\n", "<br>")


def render(prev: dict | None, cur: dict) -> str:
    lines: list[str] = ["", "## SEO diff vs previous run", ""]

    if prev is None:
        lines += [
            "_No previous report available — this run establishes the baseline._",
            "",
            f"- Current issues: **{cur.get('issue_count', 0)}** across "
            f"**{cur.get('failed', 0)}** page(s)",
            "",
        ]
        return "\n".join(lines)

    prev_idx = index_issues(prev)
    cur_idx = index_issues(cur)

    new_keys = sorted(cur_idx.keys() - prev_idx.keys())
    resolved_keys = sorted(prev_idx.keys() - cur_idx.keys())
    persisting = cur_idx.keys() & prev_idx.keys()

    prev_when = prev.get("generated_at", "unknown")
    lines += [
        f"Comparing against report generated at `{prev_when}`.",
        "",
        "| Metric | Previous | Current | Δ |",
        "| --- | ---: | ---: | ---: |",
        f"| Total issues | {prev.get('issue_count', 0)} | {cur.get('issue_count', 0)} "
        f"| {cur.get('issue_count', 0) - prev.get('issue_count', 0):+d} |",
        f"| Failing pages | {prev.get('failed', 0)} | {cur.get('failed', 0)} "
        f"| {cur.get('failed', 0) - prev.get('failed', 0):+d} |",
        f"| New issues | — | **{len(new_keys)}** | |",
        f"| Resolved issues | — | **{len(resolved_keys)}** | |",
        f"| Persisting | — | {len(persisting)} | |",
        "",
    ]

    if not new_keys and not resolved_keys:
        lines += ["No new or resolved issues — status unchanged since previous run.", ""]
        return "\n".join(lines)

    if new_keys:
        lines += [
            "### New issues",
            "",
            "| Locale | Path | Issue code | URL | Fix |",
            "| --- | --- | --- | --- | --- |",
        ]
        for key in new_keys:
            i = cur_idx[key]
            lines.append(
                f"| `{_md_cell(i.get('locale', ''))}` "
                f"| `{_md_cell(i.get('path', ''))}` "
                f"| `{_md_cell(i.get('issue_code', ''))}` "
                f"| `{_md_cell(i.get('url', ''))}` "
                f"| {_md_cell(i.get('fix') or '—')} |"
            )
        lines.append("")

    if resolved_keys:
        lines += [
            "### Resolved since previous run",
            "",
            "| Locale | Path | Issue code | URL |",
            "| --- | --- | --- | --- |",
        ]
        for key in resolved_keys:
            i = prev_idx[key]
            lines.append(
                f"| `{_md_cell(i.get('locale', ''))}` "
                f"| `{_md_cell(i.get('path', ''))}` "
                f"| `{_md_cell(i.get('issue_code', ''))}` "
                f"| `{_md_cell(i.get('url', ''))}` |"
            )
        lines.append("")

    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--previous")
    ap.add_argument("--current", required=True)
    ap.add_argument("--out", help="Path to append markdown to (default: stdout)")
    args = ap.parse_args()

    cur = load(args.current)
    if cur is None:
        print(f"error: current report {args.current} missing/invalid", file=sys.stderr)
        return 1
    prev = load(args.previous)
    md = render(prev, cur)

    if args.out:
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        with Path(args.out).open("a", encoding="utf-8") as fh:
            fh.write(md + "\n")
    else:
        print(md)
    return 0


if __name__ == "__main__":
    sys.exit(main())
