#!/usr/bin/env python3
"""
Google Search Console URL Inspection for every Solutions page in every locale.

Iterates all locale × path combinations, calls
POST /v1/urlInspection/index:inspect through the Lovable connector gateway,
and prints a summary table (+ optional JSON / GitHub Step Summary markdown).

Required env (populated once the Google Search Console connector is linked):
  LOVABLE_API_KEY                gateway auth
  GOOGLE_SEARCH_CONSOLE_API_KEY  connection key

Optional env:
  SITE_URL       Search Console property, default https://nevo-engineering-hub.lovable.app/
  BASE_URL       origin used to build inspected URLs, default = SITE_URL
  LOCALES        comma-separated override (default: en,ar,tr,ru,pt,de,es,fr,it,zh)
  PATHS          comma-separated override
  REPORT_JSON    write machine-readable report to this path
  REPORT_MD      write markdown table (used by $GITHUB_STEP_SUMMARY)
  SLEEP_MS       delay between calls, default 400
"""
from __future__ import annotations
import json, os, sys, time, urllib.request, urllib.error

GATEWAY = "https://connector-gateway.lovable.dev/google_search_console/v1/urlInspection/index:inspect"

LOVABLE_KEY = os.environ.get("LOVABLE_API_KEY")
GSC_KEY = os.environ.get("GOOGLE_SEARCH_CONSOLE_API_KEY")

SITE_URL = os.environ.get("SITE_URL", "https://nevo-engineering-hub.lovable.app/")
if not SITE_URL.endswith("/"):
    SITE_URL += "/"
BASE_URL = os.environ.get("BASE_URL", SITE_URL).rstrip("/")

LOCALES = [s.strip() for s in os.environ.get(
    "LOCALES", "en,ar,tr,ru,pt,de,es,fr,it,zh").split(",") if s.strip()]
PATHS = [s.strip() for s in os.environ.get("PATHS", ",".join([
    "/solutions",
    "/solutions/sandwich-panels",
    "/solutions/production-lines",
    "/solutions/raw-materials",
    "/solutions/factory-development",
    "/solutions/engineering-consultancy",
])).split(",") if s.strip()]

SLEEP = float(os.environ.get("SLEEP_MS", "400")) / 1000.0
REPORT_JSON = os.environ.get("REPORT_JSON")
REPORT_MD = os.environ.get("REPORT_MD")


def die(msg: str, code: int = 2) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def inspect(url: str) -> dict:
    body = json.dumps({"inspectionUrl": url, "siteUrl": SITE_URL}).encode()
    req = urllib.request.Request(
        GATEWAY, data=body, method="POST",
        headers={
            "Authorization": f"Bearer {LOVABLE_KEY}",
            "X-Connection-Api-Key": GSC_KEY,
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return {"ok": True, "status": r.status, "data": json.loads(r.read().decode("utf-8", "ignore"))}
    except urllib.error.HTTPError as e:
        return {"ok": False, "status": e.code, "error": e.read().decode("utf-8", "ignore")}
    except (urllib.error.URLError, TimeoutError) as e:
        return {"ok": False, "status": 0, "error": str(e)}


EXPECTED_RICH_TYPES = {"Breadcrumbs"}  # always required on Solutions pages
TRACKED_RICH_TYPES = {"Breadcrumbs", "FAQ"}  # additionally reported when present


def summarize_rich(rich: dict) -> dict:
    """Parse richResultsResult.detectedItems[] → per-type status + issues."""
    detected = rich.get("detectedItems", []) or []
    by_type: dict[str, dict] = {}
    for group in detected:
        rtype = group.get("richResultType", "Unknown")
        items = group.get("items", []) or []
        errors, warnings, item_issues = 0, 0, []
        for it in items:
            for iss in it.get("issues", []) or []:
                sev = (iss.get("severity") or "").upper()
                msg = iss.get("issueMessage", "")
                item_issues.append({"severity": sev, "message": msg, "name": it.get("name", "")})
                if sev == "ERROR":
                    errors += 1
                elif sev == "WARNING":
                    warnings += 1
        by_type[rtype] = {
            "count": len(items),
            "errors": errors,
            "warnings": warnings,
            "issues": item_issues,
        }
    missing = sorted(t for t in EXPECTED_RICH_TYPES if t not in by_type)
    return {"verdict": rich.get("verdict", "-"), "types": by_type, "missing": missing}


def _rich_flag(rd: dict, key: str) -> str:
    """Compact per-type cell: 'OK(2)' / 'ERR(1)' / 'WARN(1)' / '—'."""
    t = rd["types"].get(key)
    if not t:
        return "missing" if key in EXPECTED_RICH_TYPES else "—"
    if t["errors"]:
        return f"ERR({t['errors']})"
    if t["warnings"]:
        return f"WARN({t['warnings']})"
    return f"OK({t['count']})"


def summarize(res: dict) -> dict:
    if not res.get("ok"):
        return {"verdict": "ERROR", "coverage": "-", "indexing": "-",
                "mobile": "-", "rich": "-", "canonical": "-",
                "rich_detail": {"verdict": "-", "types": {}, "missing": []},
                "breadcrumb": "-", "faq": "-", "rich_issues": [],
                "note": res.get("error", "")[:120]}
    idx = res["data"].get("inspectionResult", {})
    ir = idx.get("indexStatusResult", {}) or {}
    mob = idx.get("mobileUsabilityResult", {}) or {}
    rich = idx.get("richResultsResult", {}) or {}
    rd = summarize_rich(rich)
    issues = []
    for rtype, t in rd["types"].items():
        for iss in t["issues"]:
            if iss["severity"] in ("ERROR", "WARNING"):
                issues.append({"type": rtype, **iss})
    return {
        "verdict": ir.get("verdict", "-"),
        "coverage": ir.get("coverageState", "-"),
        "indexing": ir.get("indexingState", "-"),
        "mobile": mob.get("verdict", "-"),
        "rich": rd["verdict"],
        "canonical": ir.get("googleCanonical", "-"),
        "rich_detail": rd,
        "breadcrumb": _rich_flag(rd, "Breadcrumbs"),
        "faq": _rich_flag(rd, "FAQ"),
        "rich_issues": issues,
        "note": "",
    }



def main() -> int:
    if not LOVABLE_KEY:
        die("LOVABLE_API_KEY missing")
    if not GSC_KEY:
        die("GOOGLE_SEARCH_CONSOLE_API_KEY missing — link the Google Search Console connector first")

    rows: list[dict] = []
    total = len(LOCALES) * len(PATHS)
    i = 0
    for locale in LOCALES:
        for path in PATHS:
            i += 1
            url = f"{BASE_URL}/{locale}{path}"
            print(f"[{i}/{total}] {url}", file=sys.stderr)
            raw = inspect(url)
            row = {"locale": locale, "path": path, "url": url, **summarize(raw), "raw": raw}
            rows.append(row)
            time.sleep(SLEEP)

    # Console table
    hdr = (f"{'LOCALE':6} {'PATH':40} {'VERDICT':10} {'COVERAGE':22} "
           f"{'INDEX':16} {'MOBILE':10} {'RICH':10} {'BREADCRUMB':11} {'FAQ':8}")
    print("\n" + hdr)
    print("-" * len(hdr))
    for r in rows:
        print(f"{r['locale']:6} {r['path']:40} {r['verdict']:10} {r['coverage']:22} "
              f"{r['indexing']:16} {r['mobile']:10} {r['rich']:10} "
              f"{r['breadcrumb']:11} {r['faq']:8}")

    # Rich-results issue detail
    rich_err_rows = [r for r in rows if any(i["severity"] == "ERROR" for i in r["rich_issues"])
                     or r["rich_detail"]["missing"]]
    if rich_err_rows:
        print("\nRich-results problems:")
        for r in rich_err_rows:
            if r["rich_detail"]["missing"]:
                print(f"  ✗ {r['locale']}{r['path']} — MISSING: {', '.join(r['rich_detail']['missing'])}")
            for iss in r["rich_issues"]:
                if iss["severity"] == "ERROR":
                    print(f"  ✗ {r['locale']}{r['path']} — [{iss['type']}] {iss['message']}")

    fails = [r for r in rows if r["verdict"] not in ("PASS", "-")]
    ok_count = sum(1 for r in rows if r["verdict"] == "PASS")
    rich_error_count = sum(1 for r in rows if any(i["severity"] == "ERROR" for i in r["rich_issues"]))
    missing_count = sum(1 for r in rows if r["rich_detail"]["missing"])
    print(f"\n{ok_count}/{len(rows)} PASS · {len(fails)} needs attention · "
          f"rich errors: {rich_error_count} · missing required schema: {missing_count}")

    if REPORT_JSON:
        with open(REPORT_JSON, "w", encoding="utf-8") as f:
            json.dump({"site": SITE_URL, "rows": rows}, f, indent=2, ensure_ascii=False)
        print(f"wrote {REPORT_JSON}", file=sys.stderr)

    if REPORT_MD:
        lines = [
            f"## Google Search Console — Solutions URL Inspection",
            f"Site: `{SITE_URL}` · {ok_count}/{len(rows)} PASS · "
            f"{rich_error_count} rich-result errors · {missing_count} missing required schema",
            "",
            "| Locale | Path | Verdict | Coverage | Indexing | Mobile | Rich | Breadcrumb | FAQ | Google Canonical |",
            "|---|---|---|---|---|---|---|---|---|---|",
        ]
        for r in rows:
            lines.append(
                f"| {r['locale']} | `{r['path']}` | {r['verdict']} | {r['coverage']} | "
                f"{r['indexing']} | {r['mobile']} | {r['rich']} | {r['breadcrumb']} | "
                f"{r['faq']} | {r['canonical']} |"
            )
        if rich_err_rows:
            lines += ["", "### Rich-results problems", ""]
            for r in rich_err_rows:
                if r["rich_detail"]["missing"]:
                    lines.append(f"- ❌ `{r['locale']}{r['path']}` — missing required: "
                                 f"**{', '.join(r['rich_detail']['missing'])}**")
                for iss in r["rich_issues"]:
                    icon = "❌" if iss["severity"] == "ERROR" else "⚠️"
                    lines.append(f"- {icon} `{r['locale']}{r['path']}` "
                                 f"[{iss['type']}] {iss['message']}")
        with open(REPORT_MD, "a", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        print(f"wrote {REPORT_MD}", file=sys.stderr)

    # Exit non-zero on transport errors, or on rich-results problems when strict.
    warn_only = "--warn-only" in sys.argv
    strict_rich = "--strict-rich" in sys.argv or os.environ.get("STRICT_RICH") == "1"
    transport_errors = [r for r in rows if r["verdict"] == "ERROR"]
    if warn_only:
        return 0
    if transport_errors:
        return 1
    if strict_rich and (rich_error_count or missing_count):
        return 1
    return 0



if __name__ == "__main__":
    sys.exit(main())
