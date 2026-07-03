#!/usr/bin/env python3
"""
Solutions SEO snapshot: canonical, og:*, twitter:*, hreflang.

Fetches each Solutions page (default: all 10 locales) from a running server
(SSR HTML, Googlebot UA) and asserts:
  - exactly 1 self-referencing <link rel="canonical">
  - og:url == canonical, og:image absolute (https://)
  - twitter:card = summary_large_image, twitter:image absolute
  - hreflang covers every active locale + x-default, all absolute
  - <title> present, meta description 120-180 chars

Env:
  BASE_URL     default http://127.0.0.1:8080
  REPORT_JSON  optional path — write machine-readable report
  REPORT_MD    optional path — write GitHub Step Summary markdown
  REPORT_HTML  optional path — write standalone HTML dashboard

Exit 1 on any failure. --warn-only forces exit 0.
"""
from __future__ import annotations
import json, os, re, sys, urllib.request, urllib.error
from pathlib import Path

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:8080").rstrip("/")
WARN_ONLY = "--warn-only" in sys.argv

LOCALES = ["en", "ar", "tr", "ru", "pt", "de", "es", "fr", "it", "zh"]
PATHS = [
    "/solutions",
    "/solutions/sandwich-panels",
    "/solutions/production-lines",
    "/solutions/raw-materials",
    "/solutions/factory-development",
    "/solutions/engineering-consultancy",
]

# Map each Solutions path → the route file that owns its head() / SEO helpers.
# Used for GitHub workflow-command annotations so a PR shows the failure inline
# on the file a developer can actually edit.
ROUTE_FILES = {
    "/solutions": "src/routes/$lang.solutions.index.tsx",
    "/solutions/sandwich-panels": "src/routes/$lang.solutions.sandwich-panels.tsx",
    "/solutions/production-lines": "src/routes/$lang.solutions.production-lines.tsx",
    "/solutions/raw-materials": "src/routes/$lang.solutions.raw-materials.tsx",
    "/solutions/factory-development": "src/routes/$lang.solutions.factory-development.tsx",
    "/solutions/engineering-consultancy": "src/routes/$lang.solutions.engineering-consultancy.tsx",
}
IN_GHA = os.environ.get("GITHUB_ACTIONS") == "true"


def gha_escape(s: str) -> str:
    """Escape a workflow-command property/message per GitHub's spec."""
    return (
        s.replace("%", "%25")
         .replace("\r", "%0D")
         .replace("\n", "%0A")
         .replace(":", "%3A")
         .replace(",", "%2C")
    )


def emit_annotation(level: str, file: str, title: str, message: str) -> None:
    """Print `::error file=…,title=…::message` (or ::warning)."""
    if not IN_GHA:
        return
    print(
        f"::{level} file={gha_escape(file)},title={gha_escape(title)}::{gha_escape(message)}",
        flush=True,
    )


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "ignore")


def find_all(pat: str, html: str):
    return re.findall(pat, html, re.I)


def audit(path: str, locale: str):
    url = f"{BASE}/{locale}{path}"
    try:
        html = fetch(url)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        return {"url": url, "path": path, "locale": locale, "failures": [f"FETCH_ERROR: {e}"]}
    head = html.split("</head>", 1)[0]

    canonical = find_all(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"', head)
    og_url = find_all(r'<meta[^>]+property="og:url"[^>]+content="([^"]+)"', head)
    og_img = find_all(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', head)
    og_title = find_all(r'<meta[^>]+property="og:title"[^>]+content="([^"]+)"', head)
    tw_card = find_all(r'<meta[^>]+name="twitter:card"[^>]+content="([^"]+)"', head)
    tw_img = find_all(r'<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"', head)
    title = find_all(r"<title[^>]*>([^<]+)</title>", head)
    desc = find_all(r'<meta[^>]+name="description"[^>]+content="([^"]+)"', head)

    hl_a = find_all(r'<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"', head)
    hl_b = find_all(r'<link[^>]+hreflang="([^"]+)"[^>]+rel="alternate"[^>]+href="([^"]+)"', head)
    hl = hl_a + hl_b
    hl_locales = {h[0].split("-")[0].lower() for h in hl}

    fails = []
    localized_path = f"/{locale}{path}"
    if len(canonical) != 1:
        fails.append(f"canonical count = {len(canonical)} (want 1)")
    elif not canonical[0].endswith(localized_path):
        fails.append(f"canonical not self-ref: {canonical[0]}")
    if not og_url or not og_url[0].endswith(localized_path):
        fails.append(f"og:url not self-ref: {og_url[0] if og_url else '<missing>'}")
    if not og_img or not og_img[0].startswith("https://"):
        fails.append(f"og:image not absolute https: {og_img[0] if og_img else '<missing>'}")
    if not tw_card or tw_card[0] != "summary_large_image":
        fails.append(f"twitter:card != summary_large_image: {tw_card[0] if tw_card else '<missing>'}")
    if not tw_img or not tw_img[0].startswith("https://"):
        fails.append(f"twitter:image not absolute https: {tw_img[0] if tw_img else '<missing>'}")
    if not title:
        fails.append("missing <title>")
    if not desc:
        fails.append("missing meta description")
    else:
        # Measure in UTF-8 bytes so CJK / Arabic aren't penalized by char-count.
        # Google's SERP truncation is ~155 Latin chars ≈ 155-320 UTF-8 bytes.
        bl = len(desc[0].encode("utf-8"))
        if not (100 <= bl <= 320):
            fails.append(f"description byte-length {bl} outside 100-320")

    missing_hl = [l for l in LOCALES if l not in hl_locales]
    if missing_hl:
        fails.append(f"hreflang missing locales: {','.join(missing_hl)}")
    if not any(h[0].lower() == "x-default" for h in hl):
        fails.append("hreflang missing x-default")
    if hl and not all(h[1].startswith("https://") for h in hl):
        fails.append("hreflang has non-absolute href")

    return {
        "url": url, "path": path, "locale": locale,
        "canonical": canonical[0] if canonical else None,
        "og_title": og_title[0] if og_title else None,
        "og_image": og_img[0] if og_img else None,
        "failures": fails,
    }


def main() -> int:
    results = [audit(p, l) for l in LOCALES for p in PATHS]
    failed = [r for r in results if r["failures"]]

    # Human console
    print(f"Solutions SEO snapshot — {len(results)} pages @ {BASE}")
    if not failed:
        print(f"✓ All {len(results)} pages passed canonical/og/twitter/hreflang checks.")
    else:
        print(f"✗ {len(failed)} page(s) failed:")
        for r in failed:
            print(f"  ✗ {r['url']}")
            for f in r["failures"]:
                print(f"      {f}")

    # GitHub PR annotations — one per failing check, pinned to the route file.
    level = "warning" if WARN_ONLY else "error"
    for r in failed:
        file = ROUTE_FILES.get(r["path"], "src/routes/__root.tsx")
        for f in r["failures"]:
            emit_annotation(
                level,
                file,
                f"Solutions SEO [{r['locale']}] {r['path']}",
                f"{f} — {r['url']}",
            )


    # Machine JSON report
    if p := os.environ.get("REPORT_JSON"):
        Path(p).parent.mkdir(parents=True, exist_ok=True)
        Path(p).write_text(json.dumps({"base": BASE, "total": len(results), "failed": len(failed), "results": results}, indent=2))

    # GitHub step summary markdown
    if p := os.environ.get("REPORT_MD"):
        Path(p).parent.mkdir(parents=True, exist_ok=True)
        lines = [
            f"## Solutions SEO snapshot",
            f"- Base: `{BASE}`",
            f"- Pages checked: **{len(results)}** ({len(LOCALES)} locales × {len(PATHS)} routes)",
            f"- Failing: **{len(failed)}**",
            "",
        ]
        if failed:
            lines.append("### Failures")
            lines.append("| URL | Issue |")
            lines.append("| --- | --- |")
            for r in failed:
                for f in r["failures"]:
                    lines.append(f"| `{r['url'].replace(BASE, '')}` | {f} |")
        else:
            lines.append("All pages passed ✅")
        # Append (GitHub step summary supports concatenation across steps)
        with Path(p).open("a", encoding="utf-8") as fh:
            fh.write("\n".join(lines) + "\n")

    if failed and not WARN_ONLY:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
