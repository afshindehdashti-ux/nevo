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
from urllib.parse import urlparse



BASE = os.environ.get("BASE_URL", "http://127.0.0.1:8080").rstrip("/")
LOCALES = [l.strip() for l in os.environ.get("LOCALES", "en,ar,tr").split(",") if l.strip()]
TIMEOUT = int(os.environ.get("TIMEOUT_SECONDS", "20"))
RETRIES = max(1, int(os.environ.get("RETRIES", "3")))
IN_GHA = os.environ.get("GITHUB_ACTIONS") == "true"

# Paths every deployment must serve. Kept short — this is a smoke test, not
# a snapshot; verify_solutions_seo.py covers the exhaustive matrix afterward.
CORE_PATHS = ["/", "/sitemap.xml", "/robots.txt"]
LOCALIZED_PATHS = ["/solutions"]

# Minimum body size (bytes) that indicates a real page vs. an SPA error shell.
MIN_BODY_BYTES = {
    "/robots.txt": 20,
    "/sitemap.xml": 200,
}
DEFAULT_MIN_BYTES = 500


def probe(url: str) -> tuple[bool, str]:
    """Return (ok, message). Retries transient failures with backoff."""
    last_err = ""
    for attempt in range(1, RETRIES + 1):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "lovable-seo-preflight/1.0",
                "Accept": "text/html,application/xml,text/plain;q=0.9,*/*;q=0.5",
            })
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                status = r.status
                body = r.read()
                path = urllib.request.urlparse(url).path if hasattr(urllib.request, "urlparse") else url
                # urlparse actually lives on urllib.parse — use it explicitly.
                from urllib.parse import urlparse
                path = urlparse(url).path
                min_bytes = MIN_BODY_BYTES.get(path, DEFAULT_MIN_BYTES)
                if status != 200:
                    last_err = f"HTTP {status}"
                elif len(body) < min_bytes:
                    last_err = f"body {len(body)}B < min {min_bytes}B (likely error page)"
                else:
                    return True, f"200 OK ({len(body)}B)"
        except urllib.error.HTTPError as e:
            last_err = f"HTTP {e.code}"
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            last_err = f"{type(e).__name__}: {e}"
        if attempt < RETRIES:
            time.sleep(2 ** attempt)
    return False, last_err or "unknown error"


def main() -> int:
    urls: list[str] = [f"{BASE}{p}" for p in CORE_PATHS]
    for locale in LOCALES:
        for path in LOCALIZED_PATHS:
            urls.append(f"{BASE}/{locale}{path}")

    print(f"Preflight: probing {len(urls)} URL(s) at {BASE} (timeout={TIMEOUT}s, retries={RETRIES})")
    failures: list[tuple[str, str]] = []
    for url in urls:
        ok, msg = probe(url)
        marker = "✓" if ok else "✗"
        print(f"  {marker} {url} — {msg}")
        if not ok:
            failures.append((url, msg))

    if failures:
        for url, msg in failures:
            if IN_GHA:
                print(f"::error title=Preflight failure::{url} — {msg}", flush=True)
        print(f"\nPreflight FAILED: {len(failures)}/{len(urls)} URL(s) unhealthy.")
        return 1

    print(f"\nPreflight OK: all {len(urls)} URL(s) reachable.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
