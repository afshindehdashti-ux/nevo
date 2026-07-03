#!/usr/bin/env python3
"""
Preflight health check for the Solutions SEO weekly workflow.

Verifies that the target host is reachable and that a small set of critical
URLs (root, sitemap.xml, robots.txt, one localized Solutions page per top
locale) return HTTP 200 with a non-trivial body before spending time on the
full SEO snapshot.

Env:
  BASE_URL          site to probe (default: http://127.0.0.1:8080)
  LOCALES           comma-separated locales to sample (default: en,ar,tr)
  TIMEOUT_SECONDS   per-request timeout (default: 20)
  RETRIES           attempts per URL (default: 3, exponential 2/4/8s)

Exits 0 when every probe returns 200. Exits 1 on any failure, printing a
GitHub `::error::` line so the workflow surfaces the failing URL directly
without needing to open the job log.
"""
from __future__ import annotations
import os, sys, time, urllib.request, urllib.error
from pathlib import Path
from urllib.parse import urlparse

# Shared source of truth for locales / paths — same list drives
# verify_solutions_seo.py, so preflight coverage tracks the audit matrix.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from solutions_seo_config import (  # noqa: E402
    LOCALES as ALL_LOCALES,
    PATHS as ALL_PATHS,
    CORE_PATHS,
    preflight_sample,
)


BASE = os.environ.get("BASE_URL", "http://127.0.0.1:8080").rstrip("/")

# LOCALES / PATHS env overrides are validated against the shared matrix:
# any value not in the shared list is dropped with a warning so we can't
# probe a locale/path the audit doesn't recognize.
def _select(env_name: str, default: list[str], universe: list[str]) -> list[str]:
    raw = os.environ.get(env_name, "").strip()
    if not raw:
        return default
    picked, unknown = [], []
    for item in (x.strip() for x in raw.split(",") if x.strip()):
        (picked if item in universe else unknown).append(item)
    if unknown:
        print(f"preflight: warning: ignoring unknown {env_name} values: {unknown}", file=sys.stderr)
    return picked or default

LOCALES = _select("LOCALES", ALL_LOCALES[:3], ALL_LOCALES)
LOCALIZED_PATHS = _select("PATHS", ALL_PATHS[:1], ALL_PATHS)
TIMEOUT = int(os.environ.get("TIMEOUT_SECONDS", "20"))
RETRIES = max(1, int(os.environ.get("RETRIES", "3")))
IN_GHA = os.environ.get("GITHUB_ACTIONS") == "true"

# Minimum body size (bytes) that indicates a real page vs. an SPA error shell.
MIN_BODY_BYTES = {
    "/robots.txt": 20,
    "/sitemap.xml": 200,
}
DEFAULT_MIN_BYTES = 500



def probe(url: str) -> dict:
    """Probe a URL with retries. Return a result dict with timing/status."""
    last_err = ""
    last_status: int | None = None
    last_bytes = 0
    last_ms = 0.0
    attempts = 0
    for attempt in range(1, RETRIES + 1):
        attempts = attempt
        t0 = time.perf_counter()
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "lovable-seo-preflight/1.0",
                "Accept": "text/html,application/xml,text/plain;q=0.9,*/*;q=0.5",
            })
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                status = r.status
                body = r.read()
                last_ms = (time.perf_counter() - t0) * 1000
                last_status = status
                last_bytes = len(body)
                min_bytes = MIN_BODY_BYTES.get(urlparse(url).path, DEFAULT_MIN_BYTES)
                if status != 200:
                    last_err = f"HTTP {status}"
                elif len(body) < min_bytes:
                    last_err = f"body {len(body)}B < min {min_bytes}B (likely error page)"
                else:
                    return {"url": url, "ok": True, "status": status, "bytes": len(body),
                            "ms": last_ms, "attempts": attempt, "error": ""}
        except urllib.error.HTTPError as e:
            last_ms = (time.perf_counter() - t0) * 1000
            last_status = e.code
            last_err = f"HTTP {e.code}"
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            last_ms = (time.perf_counter() - t0) * 1000
            last_err = f"{type(e).__name__}: {e}"
        if attempt < RETRIES:
            time.sleep(2 ** attempt)
    return {"url": url, "ok": False, "status": last_status, "bytes": last_bytes,
            "ms": last_ms, "attempts": attempts, "error": last_err or "unknown error"}


def _md_cell(s: object) -> str:
    return str(s).replace("|", "\\|").replace("\n", " ")


def write_step_summary(results: list[dict]) -> None:
    """Append a Markdown table of results to $GITHUB_STEP_SUMMARY."""
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return
    ok_count = sum(1 for r in results if r["ok"])
    total_ms = sum(r["ms"] for r in results)
    slowest = max((r["ms"] for r in results), default=0.0)
    lines = [
        "## Preflight — site + sitemap reachable",
        "",
        f"_Probed **{len(results)}** URL(s) at `{BASE}` "
        f"(timeout `{TIMEOUT}s`, retries `{RETRIES}`)._",
        "",
        f"- **{ok_count}/{len(results)}** healthy",
        f"- Total wall time: **{total_ms:.0f} ms**",
        f"- Slowest response: **{slowest:.0f} ms**",
        "",
        "| Status | URL | HTTP | Time (ms) | Size | Attempts | Notes |",
        "| :---: | --- | ---: | ---: | ---: | ---: | --- |",
    ]
    for r in sorted(results, key=lambda x: (x["ok"], -x["ms"])):
        marker = "✅" if r["ok"] else "❌"
        rel = r["url"].replace(BASE, "") or r["url"]
        http = r["status"] if r["status"] is not None else "—"
        size = f"{r['bytes']:,} B" if r["bytes"] else "—"
        note = _md_cell(r["error"]) if r["error"] else "ok"
        lines.append(
            f"| {marker} | [{_md_cell(rel)}]({r['url']}) "
            f"| `{http}` | {r['ms']:.0f} | {size} | {r['attempts']} | {note} |"
        )
    lines.append("")
    with open(path, "a", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")


def main() -> int:
    urls: list[str] = [f"{BASE}{p}" for p in CORE_PATHS]
    for locale in LOCALES:
        for path in LOCALIZED_PATHS:
            urls.append(f"{BASE}/{locale}{path}")

    print(f"Preflight: probing {len(urls)} URL(s) at {BASE} (timeout={TIMEOUT}s, retries={RETRIES})")
    results = [probe(u) for u in urls]
    for r in results:
        marker = "✓" if r["ok"] else "✗"
        http = r["status"] if r["status"] is not None else "-"
        detail = r["error"] if r["error"] else f"{r['bytes']}B"
        print(f"  {marker} [{http}] {r['ms']:6.0f}ms  {r['url']} — {detail}")

    write_step_summary(results)

    failures = [r for r in results if not r["ok"]]
    if failures:
        for r in failures:
            if IN_GHA:
                print(
                    f"::error title=Preflight failure::{r['url']} "
                    f"[HTTP {r['status']}] {r['ms']:.0f}ms — {r['error']}",
                    flush=True,
                )
        print(f"\nPreflight FAILED: {len(failures)}/{len(results)} URL(s) unhealthy.")
        return 1

    print(f"\nPreflight OK: all {len(results)} URL(s) reachable.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

