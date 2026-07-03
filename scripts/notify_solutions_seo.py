#!/usr/bin/env python3
"""
Post a Slack notification when the Solutions SEO snapshot finds failures.

Reads the enriched JSON report (see verify_solutions_seo.py) and posts a
Block Kit message summarizing:
  - total failing pages / issues
  - top N failing URLs (grouped by URL, with issue codes)
  - a link to the GitHub Actions run + artifacts

Silently exits 0 when:
  - SLACK_WEBHOOK_URL is not set (feature disabled)
  - The report has zero failures (nothing to notify)
  - The report is missing / invalid (already logged upstream)

Environment:
  SLACK_WEBHOOK_URL   Slack Incoming Webhook (GitHub secret)
  REPORT_JSON         path to verify_solutions_seo.py JSON report
  RUN_URL             link to the workflow run (rendered in the message)
  RUN_LABEL           short label, e.g. "PR #123" or "weekly 2026-W27"
  TOP_N               max failing URLs to list (default 5)
"""
from __future__ import annotations
import json, os, sys, urllib.request
from collections import defaultdict
from pathlib import Path


def main() -> int:
    webhook = os.environ.get("SLACK_WEBHOOK_URL", "").strip()
    if not webhook:
        print("notify: SLACK_WEBHOOK_URL not set — skipping.")
        return 0

    report_path = os.environ.get("REPORT_JSON", "reports/seo/solutions-seo.json")
    p = Path(report_path)
    if not p.exists():
        print(f"notify: {report_path} missing — skipping.")
        return 0
    try:
        report = json.loads(p.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        print(f"notify: cannot read {report_path}: {e}")
        return 0

    issues = report.get("issues", []) or []
    if not issues:
        print("notify: no failures — skipping.")
        return 0

    top_n = int(os.environ.get("TOP_N", "5"))
    run_url = os.environ.get("RUN_URL", "")
    run_label = os.environ.get("RUN_LABEL", "run")
    base = report.get("base", "")
    total = report.get("total", 0)
    failed = report.get("failed", 0)
    by_code = report.get("by_code", {}) or {}

    # Group issues by URL so the same page doesn't show up 5 times.
    per_url: dict[str, list[str]] = defaultdict(list)
    for i in issues:
        per_url[i.get("url", "?")].append(i.get("issue_code", "UNKNOWN"))

    # Sort by issue-count desc, then URL asc for determinism.
    top = sorted(per_url.items(), key=lambda kv: (-len(kv[1]), kv[0]))[:top_n]
    top_lines = [
        f"• <{url}|{url.replace(base, '') or url}> — `{', '.join(sorted(set(codes)))}` "
        f"({len(codes)} issue{'s' if len(codes) != 1 else ''})"
        for url, codes in top
    ]
    hidden = len(per_url) - len(top)
    if hidden > 0:
        top_lines.append(f"_…and {hidden} more failing URL(s)_")

    code_summary = ", ".join(f"`{c}`×{n}" for c, n in sorted(by_code.items(), key=lambda kv: -kv[1]))

    header_text = f":rotating_light: Solutions SEO — {failed}/{total} pages failing ({run_label})"
    blocks = [
        {"type": "header", "text": {"type": "plain_text", "text": header_text[:150]}},
        {"type": "section", "text": {"type": "mrkdwn",
            "text": f"*Base:* `{base}`\n*Issues by code:* {code_summary or '—'}"}},
        {"type": "section", "text": {"type": "mrkdwn",
            "text": f"*Top failing URLs:*\n" + "\n".join(top_lines)}},
    ]
    if run_url:
        blocks.append({
            "type": "actions",
            "elements": [{
                "type": "button",
                "text": {"type": "plain_text", "text": "View run & artifacts"},
                "url": run_url,
                "style": "primary",
            }],
        })

    payload = json.dumps({
        "text": f"Solutions SEO: {failed}/{total} pages failing",  # fallback for notifications
        "blocks": blocks,
    }).encode("utf-8")

    req = urllib.request.Request(
        webhook, data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            body = r.read().decode("utf-8", "ignore")
            print(f"notify: slack responded {r.status} {body[:200]}")
    except Exception as e:  # noqa: BLE001 — never fail the workflow on notify errors
        print(f"notify: slack post failed: {e}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
