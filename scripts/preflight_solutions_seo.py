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
  ACCEPT_STATUS        comma list of accepted HTTP codes / ranges
                       (default: `200`; e.g. `200,204,301-399` or
                       `200,403,404` for staging behind auth).
  ACCEPT_STATUS_OVERRIDES  per-path overrides, `path=codes` entries
                           (e.g. `/robots.txt=200,404;/admin=401,403`).
                           Use `;` between entries so `,` can stay inside
                           the code list.
  FOLLOW_REDIRECTS     `true` (default) follows 3xx before checking status;
                       set `false` to accept raw 3xx via ACCEPT_STATUS.
  USER_AGENT           override the request UA (default:
                       `lovable-seo-preflight/1.0`). Set to a real browser UA
                       when a site blocks bot UAs.
  CUSTOM_HEADERS       extra request headers, one `Name: value` per line OR
                       `Name: value` entries separated by `|` (values often
                       contain `;`, so `;` is not a separator). Example:
                       `Authorization: Bearer $TOKEN|Accept-Language: fa,en;q=0.8`.
                       `$VAR` / `${VAR}` are expanded from env so secrets
                       stay in Actions secrets, not the YAML. Sensitive
                       header values are masked in logs and the summary.
  METHOD               `GET` (default), `HEAD`, or `HEAD_THEN_GET`.
                       HEAD skips the body download — much faster on heavy
                       SSR pages. HEAD_THEN_GET tries HEAD first and falls
                       back to GET when HEAD returns a non-accepted status
                       (some CDNs / SPAs return 405/404 for HEAD).
                       Under HEAD, min-body-bytes is evaluated against the
                       `Content-Length` response header when present, and
                       skipped otherwise (routes without Content-Length
                       can't be size-checked via HEAD — use GET for those).
  METHOD_OVERRIDES     per-path method overrides, `path=METHOD` entries
                       separated by `|` (e.g. `/sitemap.xml=GET|/health=HEAD`).

Tune the *_BYTES / TIMEOUT / BACKOFF_* vars per site: a static marketing
page ships >5KB in <200ms, a heavy SSR dashboard may need `TIMEOUT=45`
and `MIN_BODY_BYTES=2000`; a tiny status endpoint may need `=50`.

Exits 0 when every probe returns 200. Exits 1 on any failure, printing a
GitHub `::error::` line so the workflow surfaces the failing URL directly
without needing to open the job log.
"""
from __future__ import annotations
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


def _parse_status_set(spec: str) -> set[int]:
    """Parse `200,204,301-399` into a set of ints. Empty → empty set."""
    out: set[int] = set()
    for token in (t.strip() for t in spec.split(",") if t.strip()):
        if "-" in token:
            lo, _, hi = token.partition("-")
            try:
                a, b = int(lo), int(hi)
                if a > b:
                    a, b = b, a
                out.update(range(a, b + 1))
            except ValueError:
                print(f"preflight: warning: skipping malformed status range {token!r}", file=sys.stderr)
        else:
            try:
                out.add(int(token))
            except ValueError:
                print(f"preflight: warning: skipping malformed status code {token!r}", file=sys.stderr)
    return out


ACCEPT_STATUS: set[int] = _parse_status_set(os.environ.get("ACCEPT_STATUS", "200")) or {200}
# Per-path overrides use `;` as entry separator so status lists can keep `,`.
ACCEPT_STATUS_OVERRIDES: dict[str, set[int]] = {}
for item in (x.strip() for x in os.environ.get("ACCEPT_STATUS_OVERRIDES", "").split(";") if x.strip()):
    if "=" not in item:
        print(f"preflight: warning: skipping malformed ACCEPT_STATUS_OVERRIDES entry {item!r}", file=sys.stderr)
        continue
    path, _, val = item.partition("=")
    codes = _parse_status_set(val)
    if codes:
        ACCEPT_STATUS_OVERRIDES[path.strip()] = codes

FOLLOW_REDIRECTS = os.environ.get("FOLLOW_REDIRECTS", "true").strip().lower() not in ("0", "false", "no")

USER_AGENT = os.environ.get("USER_AGENT", "lovable-seo-preflight/1.0").strip() or "lovable-seo-preflight/1.0"

# Header names whose values must be masked in any user-facing output.
_SENSITIVE_HEADER_SUBSTR = ("authorization", "cookie", "token", "secret", "api-key", "apikey")

def _is_sensitive_header(name: str) -> bool:
    n = name.lower()
    return any(s in n for s in _SENSITIVE_HEADER_SUBSTR)

def _mask(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "***"
    return f"{value[:3]}…{value[-2:]} ({len(value)} chars)"

def _parse_headers(spec: str) -> dict[str, str]:
    """Parse `Name: value` lines and/or `Name=value;` entries into a dict."""
    out: dict[str, str] = {}
    if not spec:
        return out
    # Split on newlines and `|`. `;` is NOT a separator because it commonly
    # appears inside header values (e.g. `Accept-Language: fa,en;q=0.8`).
    parts: list[str] = []
    for line in spec.splitlines():
        parts.extend(line.split("|"))
    for raw in (p.strip() for p in parts if p.strip()):
        if ":" in raw:
            name, _, val = raw.partition(":")
        elif "=" in raw:
            name, _, val = raw.partition("=")
        else:
            print(f"preflight: warning: skipping malformed CUSTOM_HEADERS entry {raw!r}", file=sys.stderr)
            continue
        name = name.strip()
        val = os.path.expandvars(val.strip())
        if not name:
            continue
        if val.startswith("$"):
            # expandvars couldn't resolve it — leave it out rather than send a literal `$VAR`.
            print(f"preflight: warning: env var for header {name!r} unresolved; skipping", file=sys.stderr)
            continue
        out[name] = val
    return out

CUSTOM_HEADERS: dict[str, str] = _parse_headers(os.environ.get("CUSTOM_HEADERS", ""))

# Register sensitive header values with the Actions log masker so they can't
# leak via a stray print / traceback elsewhere in the job.
if os.environ.get("GITHUB_ACTIONS") == "true":
    for _name, _val in CUSTOM_HEADERS.items():
        if _is_sensitive_header(_name) and _val:
            print(f"::add-mask::{_val}", flush=True)




def _accepted_for(path: str) -> set[int]:
    return ACCEPT_STATUS_OVERRIDES.get(path, ACCEPT_STATUS)


def _backoff_delay(attempt: int) -> float:
    """Delay before retry `attempt+1`. attempt is 1-indexed."""
    return min(BACKOFF_MAX, BACKOFF_BASE * (BACKOFF_FACTOR ** (attempt - 1)))


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[override]
        return None  # surface the 3xx as an HTTPError so caller can inspect it


_NO_REDIRECT_OPENER = urllib.request.build_opener(_NoRedirect)


_VALID_METHODS = {"GET", "HEAD", "HEAD_THEN_GET"}

def _norm_method(raw: str, default: str = "GET") -> str:
    m = (raw or "").strip().upper().replace("-", "_")
    if m not in _VALID_METHODS:
        if raw:
            print(f"preflight: warning: invalid METHOD {raw!r}; using {default}", file=sys.stderr)
        return default
    return m

METHOD = _norm_method(os.environ.get("METHOD", "GET"))
METHOD_OVERRIDES: dict[str, str] = {}
for item in (x.strip() for x in os.environ.get("METHOD_OVERRIDES", "").split("|") if x.strip()):
    if "=" not in item:
        print(f"preflight: warning: skipping malformed METHOD_OVERRIDES entry {item!r}", file=sys.stderr)
        continue
    p, _, m = item.partition("=")
    METHOD_OVERRIDES[p.strip()] = _norm_method(m, default=METHOD)


def _method_for(path: str) -> str:
    return METHOD_OVERRIDES.get(path, METHOD)




def probe(url: str) -> dict:
    """Probe a URL with retries. Return a result dict with timing/status."""
    path = urlparse(url).path
    accepted = _accepted_for(path)
    min_bytes = MIN_BODY_BYTES.get(path, DEFAULT_MIN_BYTES)
    method_mode = _method_for(path)
    last_err = ""
    last_status: int | None = None
    last_bytes = 0
    last_ms = 0.0
    last_method = ""
    attempts = 0

    def _evaluate(status: int, body_bytes: int, ms: float, http_method: str) -> dict | None:
        """Return a success dict when the response satisfies accept + min-bytes rules.

        `body_bytes` is len(body) for GET, or Content-Length (0 when absent) for HEAD.
        """
        nonlocal last_err, last_status, last_bytes, last_ms, last_method
        last_status, last_bytes, last_ms, last_method = status, body_bytes, ms, http_method
        if status not in accepted:
            last_err = f"HTTP {status} not in accept set {sorted(accepted)}"
            return None
        # Min-bytes only for accepted 2xx. On HEAD, we only enforce when we
        # actually know the size (Content-Length > 0); otherwise skip so a
        # missing Content-Length doesn't false-positive.
        if 200 <= status < 300 and body_bytes > 0 and body_bytes < min_bytes:
            last_err = f"body {body_bytes}B < min {min_bytes}B (likely error page)"
            return None
        last_err = ""
        return {"url": url, "ok": True, "status": status, "bytes": body_bytes,
                "ms": ms, "attempts": attempts, "error": "", "method": http_method}

    def _do_request(http_method: str) -> tuple[int | None, int, float, str]:
        """Issue one request. Returns (status, size_bytes, ms, error).

        On success, error is "". On failure, status may be None.
        """
        t0 = time.perf_counter()
        try:
            headers = {
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xml,text/plain;q=0.9,*/*;q=0.5",
            }
            headers.update(CUSTOM_HEADERS)
            req = urllib.request.Request(url, headers=headers, method=http_method)
            opener = urllib.request.urlopen if FOLLOW_REDIRECTS else _NO_REDIRECT_OPENER.open
            with opener(req, timeout=TIMEOUT) as r:
                if http_method == "HEAD":
                    size = int(r.headers.get("Content-Length") or 0)
                else:
                    size = len(r.read())
                return r.status, size, (time.perf_counter() - t0) * 1000, ""
        except urllib.error.HTTPError as e:
            ms = (time.perf_counter() - t0) * 1000
            if http_method == "HEAD":
                size = int(e.headers.get("Content-Length") or 0) if e.headers else 0
            else:
                try:
                    size = len(e.read() or b"")
                except Exception:
                    size = 0
            return e.code, size, ms, f"HTTP {e.code}"
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            ms = (time.perf_counter() - t0) * 1000
            return None, 0, ms, f"{type(e).__name__}: {e}"

    for attempt in range(1, RETRIES + 1):
        attempts = attempt

        # Pick the first method to try, then optional fallback for HEAD_THEN_GET.
        first_method = "HEAD" if method_mode in ("HEAD", "HEAD_THEN_GET") else "GET"
        status, size, ms, err = _do_request(first_method)

        if status is not None:
            ok = _evaluate(status, size, ms, first_method)
            if ok:
                return ok

        # HEAD_THEN_GET: if HEAD failed evaluation OR the transport errored,
        # retry the SAME attempt with GET before backing off. Cheap upgrade.
        if method_mode == "HEAD_THEN_GET" and first_method == "HEAD":
            status2, size2, ms2, err2 = _do_request("GET")
            if status2 is not None:
                ok2 = _evaluate(status2, size2, ms2, "GET")
                if ok2:
                    return ok2
            # Prefer the GET error for reporting (it's the authoritative attempt).
            if status2 is not None or err2:
                # _evaluate already updated last_* on the GET call above.
                pass
            elif err:
                # HEAD transport error and GET transport error → keep GET's err message.
                last_err = err2 or err

        elif status is None:
            # No HTTP response at all; record the transport error.
            last_err = err
            last_ms = ms

        if attempt < RETRIES:
            time.sleep(_backoff_delay(attempt))

    return {"url": url, "ok": False, "status": last_status, "bytes": last_bytes,
            "ms": last_ms, "attempts": attempts,
            "error": last_err or "unknown error", "method": last_method or method_mode}



def _md_cell(s: object) -> str:
    return str(s).replace("|", "\\|").replace("\n", " ")


def _render_headers_md(headers: dict[str, str]) -> str:
    if not headers:
        return "_none_"
    parts = []
    for name, val in headers.items():
        shown = _mask(val) if _is_sensitive_header(name) else val
        parts.append(f"`{name}: {shown}`")
    return ", ".join(parts)



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
        f"min body `{DEFAULT_MIN_BYTES}B`, accept `{','.join(str(s) for s in sorted(ACCEPT_STATUS))}`, "
        f"method `{METHOD}`, follow-redirects `{str(FOLLOW_REDIRECTS).lower()}`)._",
        "",
        f"- UA: `{USER_AGENT}`",
        f"- Custom headers: {_render_headers_md(CUSTOM_HEADERS)}",
        f"- **{ok_count}/{len(results)}** healthy",
        f"- Total wall time: **{total_ms:.0f} ms**",
        f"- Slowest response: **{slowest:.0f} ms**",
        "",
        "| Status | URL | Method | HTTP | Time (ms) | Size | Attempts | Notes |",
        "| :---: | --- | :---: | ---: | ---: | ---: | ---: | --- |",
    ]
    for r in sorted(results, key=lambda x: (x["ok"], -x["ms"])):
        marker = "✅" if r["ok"] else "❌"
        rel = r["url"].replace(BASE, "") or r["url"]
        http = r["status"] if r["status"] is not None else "—"
        size = f"{r['bytes']:,} B" if r["bytes"] else "—"
        note = _md_cell(r["error"]) if r["error"] else "ok"
        meth = r.get("method") or METHOD
        lines.append(
            f"| {marker} | [{_md_cell(rel)}]({r['url']}) | `{meth}` "
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

    print(f"Preflight: probing {len(urls)} URL(s) at {BASE} "
          f"(method={METHOD}, timeout={TIMEOUT}s, retries={RETRIES})")
    results = [probe(u) for u in urls]
    for r in results:
        marker = "✓" if r["ok"] else "✗"
        http = r["status"] if r["status"] is not None else "-"
        detail = r["error"] if r["error"] else f"{r['bytes']}B"
        meth = r.get("method") or METHOD
        print(f"  {marker} [{meth} {http}] {r['ms']:6.0f}ms  {r['url']} — {detail}")

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

