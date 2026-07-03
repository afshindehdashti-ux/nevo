#!/usr/bin/env python3
"""
Preflight health check for the Solutions SEO weekly workflow.

Verifies that the target host is reachable and that a small set of critical
URLs (root, sitemap.xml, robots.txt, one localized Solutions page per top
locale) return HTTP 200 with a non-trivial body before spending time on the
full SEO snapshot.

Env:
  BASE_URL             site to probe (default: http://127.0.0.1:8080)
  LOCALES              comma-separated locales to sample (default: en,ar,tr)
  TIMEOUT_SECONDS      per-request timeout (default: 20)
  RETRIES              attempts per URL (default: 3)
  BACKOFF_BASE_SECONDS backoff base; wait = base * factor**(attempt-1),
                       capped at BACKOFF_MAX_SECONDS (default: 2)
  BACKOFF_FACTOR       exponential factor (default: 2 → 2s, 4s, 8s …)
  BACKOFF_MAX_SECONDS  cap between retries (default: 30)
  MIN_BODY_BYTES       default minimum body size for HTML pages (default: 500)
  MIN_BODY_BYTES_SITEMAP   min bytes for /sitemap.xml (default: 200)
  MIN_BODY_BYTES_ROBOTS    min bytes for /robots.txt (default: 20)
  MIN_BODY_BYTES_OVERRIDES comma-separated `path=bytes` extras
                           (e.g. `/en/solutions=1500,/health=10`)

Tune the *_BYTES / TIMEOUT / BACKOFF_* vars per site: a static marketing
page ships >5KB in <200ms, a heavy SSR dashboard may need `TIMEOUT=45`
and `MIN_BODY_BYTES=2000`; a tiny status endpoint may need `=50`.

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
def _num(env_name: str, default: float, cast=float, minimum: float | None = None) -> float:
    raw = os.environ.get(env_name, "").strip()
    if not raw:
        return cast(default)
    try:
        val = cast(raw)
    except ValueError:
        print(f"preflight: warning: invalid {env_name}={raw!r}; using default {default}", file=sys.stderr)
        return cast(default)
    if minimum is not None and val < minimum:
        print(f"preflight: warning: {env_name}={val} < {minimum}; clamping", file=sys.stderr)
        return cast(minimum)
    return val

TIMEOUT = int(_num("TIMEOUT_SECONDS", 20, int, minimum=1))
RETRIES = int(_num("RETRIES", 3, int, minimum=1))
BACKOFF_BASE = _num("BACKOFF_BASE_SECONDS", 2.0, float, minimum=0.0)
BACKOFF_FACTOR = _num("BACKOFF_FACTOR", 2.0, float, minimum=1.0)
BACKOFF_MAX = _num("BACKOFF_MAX_SECONDS", 30.0, float, minimum=0.0)
IN_GHA = os.environ.get("GITHUB_ACTIONS") == "true"

# Minimum body size (bytes) that indicates a real page vs. an SPA error shell.
# All defaults are env-tunable so noisy / lightweight endpoints can be dialed in.
DEFAULT_MIN_BYTES = int(_num("MIN_BODY_BYTES", 500, int, minimum=0))
MIN_BODY_BYTES: dict[str, int] = {
    "/robots.txt": int(_num("MIN_BODY_BYTES_ROBOTS", 20, int, minimum=0)),
    "/sitemap.xml": int(_num("MIN_BODY_BYTES_SITEMAP", 200, int, minimum=0)),
}
# Extra per-path overrides: MIN_BODY_BYTES_OVERRIDES="/en/solutions=1500,/health=10"
for item in (x.strip() for x in os.environ.get("MIN_BODY_BYTES_OVERRIDES", "").split(",") if x.strip()):
    if "=" not in item:
        print(f"preflight: warning: skipping malformed MIN_BODY_BYTES_OVERRIDES entry {item!r}", file=sys.stderr)
        continue
    path, _, val = item.partition("=")
    try:
        MIN_BODY_BYTES[path.strip()] = max(0, int(val.strip()))
    except ValueError:
        print(f"preflight: warning: invalid byte count in override {item!r}", file=sys.stderr)


def _backoff_delay(attempt: int) -> float:
    """Delay before retry `attempt+1`. attempt is 1-indexed."""
    return min(BACKOFF_MAX, BACKOFF_BASE * (BACKOFF_FACTOR ** (attempt - 1)))



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
            time.sleep(_backoff_delay(attempt))
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
        f"(timeout `{TIMEOUT}s`, retries `{RETRIES}`, "
        f"backoff `{BACKOFF_BASE:g}s × {BACKOFF_FACTOR:g}` cap `{BACKOFF_MAX:g}s`, "
        f"min body `{DEFAULT_MIN_BYTES}B`)._",
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

