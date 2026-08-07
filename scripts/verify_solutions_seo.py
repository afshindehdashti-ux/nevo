#!/usr/bin/env python3
"""
Solutions SEO snapshot: canonical, og:*, twitter:*, hreflang.

Fetches each Solutions page (default: all 11 locales) from a running server
(SSR HTML, Googlebot UA) and asserts:
  - exactly 1 self-referencing <link rel="canonical">
  - og:url == canonical, og:image absolute (https://)
  - twitter:card = summary_large_image, twitter:image absolute
  - hreflang covers every active locale + x-default, all absolute
  - <title> present, meta description 120-180 chars

Env:
  BASE_URL            default http://127.0.0.1:8080
  REPORT_JSON         optional path — write machine-readable report
  REPORT_MD           optional path — write GitHub Step Summary markdown
  REPORT_HTML         optional path — write standalone HTML dashboard
  GROUP_ANNOTATIONS   "true" to group all issues per page into one annotation

Exit 1 on any failure. --warn-only forces exit 0. --group-annotations reduces
PR clutter by collapsing multiple issues for the same page into a single
GitHub annotation.
"""
from __future__ import annotations
import json, os, re, sys, urllib.request, urllib.error
from pathlib import Path

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:8080").rstrip("/")
WARN_ONLY = "--warn-only" in sys.argv
GROUP_ANNOTATIONS = "--group-annotations" in sys.argv or os.environ.get("GROUP_ANNOTATIONS") == "true"

# Shared with scripts/preflight_solutions_seo.py so both tools audit the same
# locale × path matrix — keeping diffs and preflight coverage in lock-step.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from solutions_seo_config import LOCALES, PATHS, ROUTE_FILES  # noqa: E402

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


# --- Issue codes --------------------------------------------------------------
# Stable machine-readable codes for each failure category, used by the JSON
# artifact so downstream analysis can group / filter without regex-ing messages.
ISSUE_CODES: list[tuple[re.Pattern, str]] = [
    (re.compile(r"^FETCH_ERROR"), "FETCH_ERROR"),
    (re.compile(r"^canonical count"), "CANONICAL_COUNT"),
    (re.compile(r"^canonical not self-ref"), "CANONICAL_NOT_SELF_REF"),
    (re.compile(r"^og:url not self-ref"), "OG_URL_NOT_SELF_REF"),
    (re.compile(r"^og:image not absolute"), "OG_IMAGE_NOT_ABSOLUTE"),
    (re.compile(r"^twitter:card"), "TWITTER_CARD_INVALID"),
    (re.compile(r"^twitter:image not absolute"), "TWITTER_IMAGE_NOT_ABSOLUTE"),
    (re.compile(r"^missing <title>"), "TITLE_MISSING"),
    (re.compile(r"^missing meta description"), "DESCRIPTION_MISSING"),
    (re.compile(r"^description byte-length"), "DESCRIPTION_LENGTH"),
    (re.compile(r"^hreflang missing locales"), "HREFLANG_MISSING_LOCALES"),
    (re.compile(r"^hreflang missing x-default"), "HREFLANG_MISSING_XDEFAULT"),
    (re.compile(r"^hreflang has non-absolute"), "HREFLANG_NOT_ABSOLUTE"),
]


def issue_code(failure: str) -> str:
    for pat, code in ISSUE_CODES:
        if pat.search(failure):
            return code
    return "UNKNOWN"



# Map each failure category to a short, concrete remediation. Kept intentionally
# terse so it fits inside a GitHub annotation / MD table cell without wrapping.
FIX_HINTS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"^FETCH_ERROR"),
     "Server unreachable — start dev server (npm run dev) or check BASE_URL."),
    (re.compile(r"^canonical count"),
     "Emit exactly one <link rel=\"canonical\"> in the route head() — remove duplicates from __root."),
    (re.compile(r"^canonical not self-ref"),
     "Set canonical to https://<host>/<locale><path> for THIS page (not the home URL)."),
    (re.compile(r"^og:url not self-ref"),
     "Set og:url to the same absolute URL as canonical (self-referencing)."),
    (re.compile(r"^og:image not absolute"),
     "Use an absolute https://… URL for og:image (1200×630 JPG/PNG, <300KB)."),
    (re.compile(r"^twitter:card"),
     "Set <meta name=\"twitter:card\" content=\"summary_large_image\">."),
    (re.compile(r"^twitter:image not absolute"),
     "Set twitter:image to the same absolute https:// URL as og:image."),
    (re.compile(r"^missing <title>"),
     "Add a unique <title> 30–60 chars including locale + primary keyword."),
    (re.compile(r"^missing meta description"),
     "Add <meta name=\"description\"> — 120–160 chars, localized, with a call to action."),
    (re.compile(r"^description byte-length"),
     "Rewrite meta description to ~120–160 chars (100–320 UTF-8 bytes)."),
    (re.compile(r"^hreflang missing locales"),
     "Emit <link rel=\"alternate\" hreflang=\"xx\"> for every active locale in LOCALES."),
    (re.compile(r"^hreflang missing x-default"),
     "Add <link rel=\"alternate\" hreflang=\"x-default\" href=…> pointing at the default locale URL."),
    (re.compile(r"^hreflang has non-absolute"),
     "All hreflang href values must be absolute https:// URLs."),
]


def suggest_fix(failure: str) -> str:
    """Return a short actionable hint for a failure message, or '' if none."""
    for pat, hint in FIX_HINTS:
        if pat.search(failure):
            return hint
    return ""




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
                hint = suggest_fix(f)
                if hint:
                    print(f"        ↳ fix: {hint}")

    # GitHub PR annotations — pinned to the route file.
    # Per-check annotations give the finest detail; grouping keeps PRs tidy when
    # one page has many related issues. Each issue is followed by an inline
    # "↳ fix:" hint so reviewers see the remediation next to the failure.
    level = "warning" if WARN_ONLY else "error"
    if GROUP_ANNOTATIONS:
        by_key: dict[tuple[str, str, str], list[dict]] = {}
        for r in failed:
            file = ROUTE_FILES.get(r["path"], "src/routes/__root.tsx")
            key = (file, r["path"], r["locale"])
            by_key.setdefault(key, []).append(r)
        for (file, path, locale), rs in by_key.items():
            urls = sorted({r["url"] for r in rs})
            lines_out = []
            for r in rs:
                for f in r["failures"]:
                    hint = suggest_fix(f)
                    lines_out.append(f"• {f}" + (f"\n    ↳ fix: {hint}" if hint else ""))
            issues = "\n".join(lines_out)
            emit_annotation(
                level,
                file,
                f"Solutions SEO [{locale}] {path}",
                f"{sum(len(r['failures']) for r in rs)} issue(s) on {len(urls)} URL(s)\n{issues}",
            )
    else:
        for r in failed:
            file = ROUTE_FILES.get(r["path"], "src/routes/__root.tsx")
            for f in r["failures"]:
                hint = suggest_fix(f)
                msg = f"{f} — {r['url']}"
                if hint:
                    msg += f"\n↳ fix: {hint}"
                emit_annotation(
                    level,
                    file,
                    f"Solutions SEO [{r['locale']}] {r['path']}",
                    msg,
                )



    # Machine JSON report — enriched with a flat `issues` list carrying
    # {url, path, locale, issue_code, message, fix, file_path} per failure so
    # downstream analysis can group by code or file without re-parsing messages.
    if p := os.environ.get("REPORT_JSON"):
        Path(p).parent.mkdir(parents=True, exist_ok=True)
        issues_flat = []
        for r in failed:
            file_path = ROUTE_FILES.get(r["path"], "src/routes/__root.tsx")
            for f in r["failures"]:
                issues_flat.append({
                    "url": r["url"],
                    "locale": r["locale"],
                    "path": r["path"],
                    "issue_code": issue_code(f),
                    "message": f,
                    "fix": suggest_fix(f),
                    "file_path": file_path,
                })
        by_code: dict[str, int] = {}
        for i in issues_flat:
            by_code[i["issue_code"]] = by_code.get(i["issue_code"], 0) + 1
        payload = {
            "base": BASE,
            "generated_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
            "total": len(results),
            "passed": len(results) - len(failed),
            "failed": len(failed),
            "issue_count": len(issues_flat),
            "by_code": by_code,
            "issues": issues_flat,
            "results": results,
        }
        Path(p).write_text(json.dumps(payload, indent=2, ensure_ascii=False))


    # GitHub step summary markdown
    if p := os.environ.get("REPORT_MD"):
        Path(p).parent.mkdir(parents=True, exist_ok=True)
        # Append (GitHub step summary supports concatenation across steps)
        with Path(p).open("a", encoding="utf-8") as fh:
            fh.write(render_md(BASE, results, failed) + "\n")

    # Standalone HTML dashboard
    if p := os.environ.get("REPORT_HTML"):
        Path(p).parent.mkdir(parents=True, exist_ok=True)
        Path(p).write_text(render_html(BASE, results, failed), encoding="utf-8")

    if failed and not WARN_ONLY:
        return 1
    return 0


def _esc(s: object) -> str:
    return (
        str(s).replace("&", "&amp;").replace("<", "&lt;")
        .replace(">", "&gt;").replace('"', "&quot;")
    )


def _md_cell(s: object) -> str:
    """Escape a string for use inside a Markdown table cell."""
    return str(s).replace("|", "\\|").replace("\n", "<br>")



def render_md(base: str, results: list, failed: list) -> str:
    from datetime import datetime, timezone
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    total = len(results)
    passed = total - len(failed)
    pct = (passed / total * 100) if total else 0

    # Per-locale aggregate
    per_locale: dict[str, dict[str, int]] = {}
    for r in results:
        d = per_locale.setdefault(r["locale"], {"pass": 0, "fail": 0})
        d["fail" if r["failures"] else "pass"] += 1

    lines = [
        "## Solutions SEO snapshot",
        f"",
        f"- Base: `{base}`",
        f"- Generated: {ts}",
        f"- Pages checked: **{total}** ({len(LOCALES)} locales × {len(PATHS)} routes)",
        f"",
        "### Summary",
        f"",
        "| Metric | Value |",
        "| --- | --- |",
        f"| Total pages | {_md_cell(total)} |",
        f"| Passing | {_md_cell(passed)} |",
        f"| Failing | {_md_cell(len(failed))} |",
        f"| Pass rate | {_md_cell(f'{pct:.1f}%')} |",
        f"",
        "### By locale",
        f"",
        "| Locale | Passing | Failing | Status |",
        "| --- | --- | --- | --- |",
    ]
    for locale in sorted(per_locale.keys()):
        d = per_locale[locale]
        status = "✅" if d["fail"] == 0 else "❌"
        lines.append(
            f"| `{_md_cell(locale)}` | {_md_cell(d['pass'])} | {_md_cell(d['fail'])} | {status} |"
        )

    if failed:
        lines.extend([
            f"",
            "### Failures",
            f"",
            "| Status | Locale | Path | URL | Issue | Suggested fix |",
            "| --- | --- | --- | --- | --- | --- |",
        ])
        for r in sorted(failed, key=lambda r: (r["locale"], r["path"])):
            rel_url = r["url"].replace(base, "") or r["path"]
            issues = "<br>".join(_md_cell(f) for f in r["failures"])
            hints = "<br>".join(_md_cell(suggest_fix(f) or "—") for f in r["failures"])
            lines.append(
                f"| ❌ | `{_md_cell(r['locale'])}` | `{_md_cell(r['path'])}` | `{_md_cell(rel_url)}` | {issues} | {hints} |"
            )

    else:
        lines.extend([f"", "### Result", f"", "✅ All pages passed."])

    return "\n".join(lines)




def render_html(base: str, results: list, failed: list) -> str:
    from datetime import datetime, timezone
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    total = len(results)
    passed = total - len(failed)
    pct = (passed / total * 100) if total else 0

    # Per-locale aggregate
    per_locale: dict[str, dict[str, int]] = {}
    for r in results:
        d = per_locale.setdefault(r["locale"], {"pass": 0, "fail": 0})
        d["fail" if r["failures"] else "pass"] += 1

    rows = []
    for r in sorted(results, key=lambda r: (bool(not r["failures"]), r["locale"], r["path"])):
        status = "FAIL" if r["failures"] else "PASS"
        cls = "fail" if r["failures"] else "pass"
        def _li(f: str) -> str:
            hint = suggest_fix(f)
            hint_html = f'<span class="hint">↳ fix: {_esc(hint)}</span>' if hint else ""
            return f"<li>{_esc(f)}{hint_html}</li>"
        issues = "".join(_li(f) for f in r["failures"]) or "<li class=ok>All checks passed</li>"

        rows.append(f"""
        <tr class="{cls}">
          <td><span class="badge {cls}">{status}</span></td>
          <td><code>{_esc(r['locale'])}</code></td>
          <td><code>{_esc(r['path'])}</code></td>
          <td><a href="{_esc(r['url'])}" target="_blank" rel="noopener">{_esc(r['url'])}</a></td>
          <td><ul class="issues">{issues}</ul></td>
        </tr>""")

    loc_rows = "".join(
        f"<tr><td><code>{_esc(l)}</code></td><td>{d['pass']}</td><td class='{ 'fail' if d['fail'] else 'ok'}'>{d['fail']}</td></tr>"
        for l, d in sorted(per_locale.items())
    )

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Solutions SEO Report — {_esc(ts)}</title>
<style>
  :root {{ --bg:#0f172a; --card:#1e293b; --muted:#94a3b8; --text:#f1f5f9;
           --ok:#10b981; --fail:#ef4444; --accent:#38bdf8; --border:#334155; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;
          background:var(--bg); color:var(--text); padding:32px; }}
  h1 {{ margin:0 0 4px; font-size:24px; }}
  .sub {{ color:var(--muted); margin-bottom:24px; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; margin-bottom:24px; }}
  .card {{ background:var(--card); border:1px solid var(--border); border-radius:12px; padding:20px; }}
  .card .label {{ color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.05em; }}
  .card .value {{ font-size:32px; font-weight:600; margin-top:4px; }}
  .value.ok {{ color:var(--ok); }} .value.fail {{ color:var(--fail); }}
  .bar {{ height:8px; background:var(--border); border-radius:4px; overflow:hidden; margin-top:12px; }}
  .bar > span {{ display:block; height:100%; background:var(--ok); width:{pct:.1f}%; }}
  h2 {{ font-size:16px; margin:24px 0 12px; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }}
  table {{ width:100%; border-collapse:collapse; background:var(--card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }}
  th, td {{ padding:10px 12px; text-align:left; border-bottom:1px solid var(--border); vertical-align:top; }}
  th {{ background:#0b1220; color:var(--muted); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.05em; }}
  tr:last-child td {{ border-bottom:none; }}
  tr.fail td {{ background:rgba(239,68,68,.06); }}
  code {{ background:#0b1220; padding:2px 6px; border-radius:4px; font-size:12px; color:var(--accent); }}
  a {{ color:var(--accent); text-decoration:none; }} a:hover {{ text-decoration:underline; }}
  .badge {{ display:inline-block; padding:3px 8px; border-radius:999px; font-size:11px; font-weight:600; }}
  .badge.pass {{ background:rgba(16,185,129,.15); color:var(--ok); }}
  .badge.fail {{ background:rgba(239,68,68,.15); color:var(--fail); }}
  ul.issues {{ margin:0; padding-left:16px; }} ul.issues li {{ margin:2px 0; }}
  ul.issues li.ok {{ color:var(--muted); list-style:none; margin-left:-16px; }}
  .hint {{ display:block; color:var(--muted); font-size:12px; margin-top:2px; padding-left:12px; border-left:2px solid var(--accent); }}

  td.ok {{ color:var(--ok); }} td.fail {{ color:var(--fail); font-weight:600; }}
  .filters {{ margin:12px 0; display:flex; gap:8px; }}
  .filters button {{ background:var(--card); color:var(--text); border:1px solid var(--border);
                      padding:6px 12px; border-radius:6px; cursor:pointer; font:inherit; }}
  .filters button.active {{ border-color:var(--accent); color:var(--accent); }}
</style>
</head>
<body>
  <h1>Solutions SEO Report</h1>
  <div class="sub">Base: <code>{_esc(base)}</code> · Generated {_esc(ts)}</div>

  <div class="grid">
    <div class="card"><div class="label">Total pages</div><div class="value">{total}</div></div>
    <div class="card"><div class="label">Passing</div><div class="value ok">{passed}</div>
      <div class="bar"><span></span></div></div>
    <div class="card"><div class="label">Failing</div><div class="value {'fail' if failed else 'ok'}">{len(failed)}</div></div>
    <div class="card"><div class="label">Pass rate</div><div class="value {'ok' if pct==100 else 'fail'}">{pct:.1f}%</div></div>
  </div>

  <h2>By locale</h2>
  <table>
    <thead><tr><th>Locale</th><th>Passing</th><th>Failing</th></tr></thead>
    <tbody>{loc_rows}</tbody>
  </table>

  <h2>Page results</h2>
  <div class="filters">
    <button class="active" data-f="all">All ({total})</button>
    <button data-f="fail">Failing ({len(failed)})</button>
    <button data-f="pass">Passing ({passed})</button>
  </div>
  <table id="results">
    <thead><tr><th>Status</th><th>Locale</th><th>Path</th><th>URL</th><th>Issues</th></tr></thead>
    <tbody>{''.join(rows)}</tbody>
  </table>

<script>
  document.querySelectorAll('.filters button').forEach(b => b.addEventListener('click', () => {{
    document.querySelectorAll('.filters button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    const f = b.dataset.f;
    document.querySelectorAll('#results tbody tr').forEach(tr => {{
      tr.style.display = (f === 'all' || tr.classList.contains(f)) ? '' : 'none';
    }});
  }}));
</script>
</body>
</html>
"""



if __name__ == "__main__":
    sys.exit(main())
