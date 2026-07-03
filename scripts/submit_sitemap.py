#!/usr/bin/env python3
"""
Submit sitemap.xml to Google Search Console and report its crawl status.

Uses the Lovable connector gateway (no service-account key required):
  PUT /webmasters/v3/sites/{siteUrl}/sitemaps/{feedpath}   — submit
  GET /webmasters/v3/sites/{siteUrl}/sitemaps/{feedpath}   — status of one
  GET /webmasters/v3/sites/{siteUrl}/sitemaps              — index (list all)

Required env (present once the Google Search Console connector is linked):
  LOVABLE_API_KEY
  GOOGLE_SEARCH_CONSOLE_API_KEY

Optional env:
  SITE_URL        Search Console property, default https://nevo-engineering-hub.lovable.app/
  SITEMAP_URL     Sitemap absolute URL, default {SITE_URL}sitemap.xml
  REPORT_JSON     Write machine-readable snapshot
  REPORT_MD       Append markdown to $GITHUB_STEP_SUMMARY
"""
from __future__ import annotations
import json, os, sys, urllib.parse, urllib.request, urllib.error
from datetime import datetime, timezone

GATEWAY = "https://connector-gateway.lovable.dev/google_search_console"

LOVABLE_KEY = os.environ.get("LOVABLE_API_KEY")
GSC_KEY = os.environ.get("GOOGLE_SEARCH_CONSOLE_API_KEY")

SITE_URL = os.environ.get("SITE_URL", "https://nevo-engineering-hub.lovable.app/")
if not SITE_URL.endswith("/"):
    SITE_URL += "/"
SITEMAP_URL = os.environ.get("SITEMAP_URL", f"{SITE_URL}sitemap.xml")
REPORT_JSON = os.environ.get("REPORT_JSON")
REPORT_MD = os.environ.get("REPORT_MD")

SKIP_SUBMIT = "--skip-submit" in sys.argv


def die(msg: str, code: int = 2) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def call(method: str, path: str) -> dict:
    req = urllib.request.Request(
        GATEWAY + path, method=method,
        headers={
            "Authorization": f"Bearer {LOVABLE_KEY}",
            "X-Connection-Api-Key": GSC_KEY,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            body = r.read().decode("utf-8", "ignore")
            return {"ok": True, "status": r.status,
                    "data": json.loads(body) if body else {}}
    except urllib.error.HTTPError as e:
        return {"ok": False, "status": e.code, "error": e.read().decode("utf-8", "ignore")}
    except (urllib.error.URLError, TimeoutError) as e:
        return {"ok": False, "status": 0, "error": str(e)}


def main() -> int:
    if not LOVABLE_KEY:
        die("LOVABLE_API_KEY missing")
    if not GSC_KEY:
        die("GOOGLE_SEARCH_CONSOLE_API_KEY missing — link the Google Search Console connector first")

    site_enc = urllib.parse.quote(SITE_URL, safe="")
    feed_enc = urllib.parse.quote(SITEMAP_URL, safe="")

    # 1) Submit (idempotent). Skip if already submitted today or with --skip-submit.
    submit = {"skipped": True} if SKIP_SUBMIT else call(
        "PUT", f"/webmasters/v3/sites/{site_enc}/sitemaps/{feed_enc}"
    )
    print(f"submit → {submit}", file=sys.stderr)
    if not SKIP_SUBMIT and not submit.get("ok"):
        # PUT usually returns empty 200; a non-2xx is a real failure.
        print(f"ERROR: sitemap submit failed: HTTP {submit.get('status')} {submit.get('error', '')[:200]}", file=sys.stderr)

    # 2) Status for this sitemap
    status = call("GET", f"/webmasters/v3/sites/{site_enc}/sitemaps/{feed_enc}")
    # 3) All sitemaps registered for the property (sitemap index)
    listed = call("GET", f"/webmasters/v3/sites/{site_enc}/sitemaps")

    if not status.get("ok"):
        print(f"ERROR: status fetch failed: HTTP {status.get('status')} {status.get('error', '')[:200]}", file=sys.stderr)
        return 1

    s = status["data"]
    contents = s.get("contents", []) or []
    total_submitted = sum(int(c.get("submitted", 0) or 0) for c in contents)
    total_indexed = sum(int(c.get("indexed", 0) or 0) for c in contents)
    warnings = int(s.get("warnings", 0) or 0)
    errors = int(s.get("errors", 0) or 0)
    last_downloaded = s.get("lastDownloaded", "—")
    last_submitted = s.get("lastSubmitted", "—")

    print("\nSitemap:", SITEMAP_URL)
    print(f"  Property:        {SITE_URL}")
    print(f"  Type:            {s.get('type', '—')}  isPending={s.get('isPending', False)}  isSitemapsIndex={s.get('isSitemapsIndex', False)}")
    print(f"  Last submitted:  {last_submitted}")
    print(f"  Last downloaded: {last_downloaded}")
    print(f"  URLs submitted:  {total_submitted}")
    print(f"  URLs indexed:    {total_indexed}")
    print(f"  Warnings/errors: {warnings} / {errors}")

    if listed.get("ok"):
        all_maps = listed["data"].get("sitemap", []) or []
        print(f"\nAll sitemaps registered for property ({len(all_maps)}):")
        for m in all_maps:
            print(f"  - {m.get('path')}  type={m.get('type', '—')}  "
                  f"lastDownloaded={m.get('lastDownloaded', '—')}  "
                  f"errors={m.get('errors', 0)}  warnings={m.get('warnings', 0)}")

    snapshot = {
        "site": SITE_URL,
        "sitemap": SITEMAP_URL,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "submit": submit,
        "status": s,
        "index": listed.get("data", {}),
    }

    if REPORT_JSON:
        with open(REPORT_JSON, "w", encoding="utf-8") as f:
            json.dump(snapshot, f, indent=2, ensure_ascii=False)
        print(f"wrote {REPORT_JSON}", file=sys.stderr)

    if REPORT_MD:
        md = [
            f"## Google Search Console — Sitemap status",
            f"Property: `{SITE_URL}` · Sitemap: `{SITEMAP_URL}`",
            "",
            f"- **Last submitted:** {last_submitted}",
            f"- **Last downloaded (crawled):** {last_downloaded}",
            f"- **URLs submitted:** {total_submitted}",
            f"- **URLs indexed:** {total_indexed}",
            f"- **Warnings / errors:** {warnings} / {errors}",
            f"- **Pending:** {s.get('isPending', False)} · **Sitemap index:** {s.get('isSitemapsIndex', False)}",
            "",
        ]
        if listed.get("ok"):
            all_maps = listed["data"].get("sitemap", []) or []
            md += [
                f"### All sitemaps for property ({len(all_maps)})",
                "",
                "| Path | Type | Last downloaded | Warnings | Errors |",
                "|---|---|---|---|---|",
            ]
            for m in all_maps:
                md.append(
                    f"| `{m.get('path', '')}` | {m.get('type', '—')} | "
                    f"{m.get('lastDownloaded', '—')} | {m.get('warnings', 0)} | {m.get('errors', 0)} |"
                )
        with open(REPORT_MD, "a", encoding="utf-8") as f:
            f.write("\n".join(md) + "\n")
        print(f"wrote {REPORT_MD}", file=sys.stderr)

    # Fail the run on hard errors (or a failed submit that wasn't skipped)
    if errors > 0:
        return 1
    if not SKIP_SUBMIT and not submit.get("ok"):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
