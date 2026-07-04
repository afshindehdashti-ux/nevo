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
  RETRIES              max attempts per URL (default: 3). A probe stops
                       early when the attempt's classified error_kind is not
                       in RETRYABLE_ERROR_KINDS — deterministic failures
                       (TLS, 4xx, body-too-small) do not retry.
  RETRYABLE_ERROR_KINDS  comma list of error_kind values that are worth
                        retrying (default:
                        `timeout,connection_reset,connection_refused,connection_error,dns`).
                        Set to `''` to disable retries entirely, or add
                        `http_status` to also retry all HTTP 4xx/5xx.
  RETRYABLE_STATUS_CLASSES comma list of HTTP status classes (`4xx`, `5xx`)
                        and/or specific codes (`429`, `503`) that should be
                        retried even when `http_status` is not in
                        RETRYABLE_ERROR_KINDS. Empty by default. Use this to
                        retry only rate-limit (429) or backend-overload
                        (503) responses without retrying every 4xx/5xx.

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
  BODY_SNIPPET_CHARS   chars of body preview to render for failed URLs in
                       the step summary (default: 200; set 0 to disable).
  BODY_HASH            `true` (default) attaches a sha256[:12] of the failed
                       response body — quick way to tell "same error page as
                       yesterday" vs "new failure mode" without diffing text.
  BODY_SANITIZE        `true` (default) strips <script>/<style>/HTML tags
                       from the snippet and redacts obvious secrets (JWTs,
                       bearer tokens, api_key=…, emails, long hex, AWS/SB
                       keys). Set `false` to render raw text.
  RESPONSE_HEADERS     comma-separated response headers to surface for
                       failed URLs in the step summary. Default:
                       `Content-Type,Content-Length,Server,Retry-After,
                       Cache-Control,Age,Location,X-Cache,CF-Ray,Via`.
                        Sensitive values (Set-Cookie, Authorization, …) are
                        masked.
  BODY_SNIPPET_CONTENT_TYPES
                        comma-separated content types for which a body
                        snippet is shown in the summary. Default:
                        `text/*,application/json`. Binary responses
                        (images, PDFs, archives, etc.) get an empty
                        snippet to avoid dumping base64/null bytes.

  RESULTS_CSV_PATH     write the full per-URL result set as CSV to this path
                       (opt-in; upload as a CI artifact for later analysis).
  RESULTS_JSON_PATH    also write results as pretty JSON (raw dict per URL,
                       including response headers and body snippet).
  RESULTS_INCLUDE      filter exported rows. Supports:
                         - `all` (default) — every row
                         - `failures` — only rows with ok=false
                         - `status_class=4xx,5xx` — rows whose status_class matches
                         - `error_kind=timeout,tls` — rows whose error_kind matches
                         - `combo=http:5xx,timeout:none` — exact error_kind:status_class pairs
                       Multiple clauses may be combined with `;` (logical OR),
                       e.g. `RESULTS_INCLUDE="status_class=5xx;error_kind=timeout"`.
  LATENCY_BUCKETS      explicit comma-separated upper-bound edges (ms) for
                       the latency histogram/heatmap, e.g.
                       `LATENCY_BUCKETS=50,100,250,500,1000,5000`.
  LATENCY_BIN_SIZE     uniform bin width (ms); combine with LATENCY_MAX_MS
                       to auto-generate evenly spaced buckets, e.g.
                       `LATENCY_BIN_SIZE=250 LATENCY_MAX_MS=5000` →
                       0–250, 250–500, …, 4750–5000, 5000+.
  LATENCY_MAX_MS       highest finite edge for LATENCY_BIN_SIZE; slower
                       samples land in the always-present `+` overflow bin.

  SORT_COMBOS_BY       sort the summary error_kind × status_class breakdown by
                       `default` (ok rows first, then count descending),
                       `count`, `success_rate`, or `failures_pct`.
  SORT_COMBOS_ORDER    `asc` or `desc`; default is `desc` for `count`,
                       `success_rate`, and `failures_pct`. Ignored for `default`.

  SUMMARY_FILTER_PRESETS
                       named filter presets to switch between scenarios in
                       the summary without re-typing full expressions.
                       Format: `name::expr||name::expr`, e.g.
                       `server::status_class=5xx||transport::error_kind=timeout,tls,dns`.
                       Each `expr` uses the same grammar as SUMMARY_FILTER /
                       RESULTS_INCLUDE.
  SUMMARY_FILTER_PRESETS_JSON
                       same as above but as a JSON object
                       `{"server":"status_class=5xx", ...}`; JSON takes
                       precedence when both are set.
  SUMMARY_FILTER       set to `preset:<name>` or `@<name>` (or just the
                       preset name, if unique) to apply a saved preset.

  DISABLE_PERCENTILES  `true` to skip percentile latency calculations and the
                        `BREAKDOWN_CSV_PATH` / `BREAKDOWN_JSON_PATH` exports. This
                        reduces runtime and summary size when only pass/fail
                        data matters. Same effect as passing `--disable-percentiles`
                        on the command line.

  DISABLE_HEATMAP_EXPORT  `true` to skip the `HEATMAP_CSV_PATH` / `HEATMAP_JSON_PATH`
                        exports and the heatmap/breakdown consistency validation.
                        Use this when heatmaps are not needed to speed up the run.
                        Same effect as passing `--disable-heatmap-export` on the
                        command line.

  DISABLE_HEATMAP_VALIDATION
                        `true` to skip the heatmap/breakdown consistency check
                        while still exporting `HEATMAP_CSV_PATH` / `HEATMAP_JSON_PATH`.
                        Use this when the export is needed but the validation
                        step is too slow or not required. Same effect as passing
                        `--disable-heatmap-validation` on the command line.

  HEATMAP_PREVIEW_TOP   number of top non-zero latency buckets to print in the
                        compact stdout preview per combo (default 3). Set to `0`
                        to disable the preview. Same effect as passing
                        `--heatmap-preview-top=N` on the command line.

  CLI flags:
    --help, -h                Print this help text and exit.
    --disable-percentiles     Skip p50/p95/p99 latency breakdowns and exports.
    --disable-heatmap-export  Skip heatmap CSV/JSON export and validation.
    --disable-heatmap-validation
                              Skip heatmap/breakdown consistency validation only.
    --heatmap-preview-top=N   Number of top non-zero buckets to preview per combo
                              (default 3; set 0 to disable).


  Output / Summary:

  The console prints a "Latency by error_kind × status_class" block showing,
  for each (error_kind, status_class) combo: count, failed, avg, p50, p95,
  p99, and max latency — all in milliseconds. This is always derived from the
  full result set so regressions are visible even when RESULTS_INCLUDE narrows
  the per-URL export.

  The GitHub step summary renders the same combos in a Markdown table plus a
  small bar chart of success/failure rate so patterns stand out without reading
  raw numbers.

  BREAKDOWN_CSV_PATH / BREAKDOWN_JSON_PATH export one aggregate row per combo
  with these columns:
    error_kind, status_class, count, failed,
    success_rate_pct, share_pct, failures_pct,
    attempts_total, attempts_avg,
    ms_avg, ms_p50, ms_p95, ms_p99, ms_max
  When DISABLE_PERCENTILES is set, these exports and the percentile columns are
  skipped entirely.

  Latency percentile fields (ms):
    ms_avg   arithmetic mean latency for the combo
    ms_p50   median (50th percentile); half the samples were ≤ this value
    ms_p95   95th percentile; 95% of samples were ≤ this value
    ms_p99   99th percentile; tail latency used to spot rare stalls
    ms_max   highest observed latency in the combo
  Percentiles are computed with nearest-rank over the observed samples, so the
  reported value is always a real request latency, not an interpolated estimate.

  When $GITHUB_STEP_SUMMARY is set, the script appends a "Result artifacts"
  section that links every produced file. For example, after setting
  BREAKDOWN_CSV_PATH, BREAKDOWN_JSON_PATH, HEATMAP_CSV_PATH and HEATMAP_JSON_PATH:

  ```text
  ### Result artifacts

  _Scope: **all** (12 of 12 row(s))._

  - `results.csv`
  - `results.json`

  _Breakdown (error_kind × status_class, full result set):_

  - `breakdown.csv`
  - `breakdown.json`

  _Latency heatmap bin counts (error_kind × status_class × bucket):_

  - [`heatmap.csv`](heatmap.csv)
  - [`heatmap.json`](heatmap.json)
  ```

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

# Which error_kind values are worth retrying. Transient network faults
# (timeouts, resets, refused, DNS blips) retry by default; deterministic
# failures (TLS handshake mismatch, HTTP 4xx, body-too-small, unknown) do
# not — retrying them just burns time and inflates latency stats.
_DEFAULT_RETRYABLE = "timeout,connection_reset,connection_refused,connection_error,dns"
RETRYABLE_ERROR_KINDS: set[str] = {
    k.strip().lower()
    for k in (os.environ.get("RETRYABLE_ERROR_KINDS") or _DEFAULT_RETRYABLE).split(",")
    if k.strip()
}

# HTTP status classes/codes worth retrying independently of RETRYABLE_ERROR_KINDS.
# Accepts `4xx`, `5xx` classes or exact codes like `429`, `503`. This lets the
# user retry only rate-limit/overload responses without enabling retry for
# every HTTP error via RETRYABLE_ERROR_KINDS.
RETRYABLE_STATUS_CLASSES: set[str] = {
    s.strip().lower()
    for s in (os.environ.get("RETRYABLE_STATUS_CLASSES") or "").split(",")
    if s.strip()
}
IN_GHA = os.environ.get("GITHUB_ACTIONS") == "true"


# Disable percentile-based latency breakdowns to reduce runtime / summary size
# when only pass/fail data is needed. Set env DISABLE_PERCENTILES=true or pass
# the --disable-percentiles CLI flag.
_DISABLE_PERCENTILES = os.environ.get("DISABLE_PERCENTILES", "").strip().lower() in (
    "1", "true", "yes", "on"
)

# Disable heatmap CSV/JSON export (and the related heatmap/breakdown consistency
# validation) to make the run faster when the heatmap artifact is not needed.
# Set env DISABLE_HEATMAP_EXPORT=true or pass the --disable-heatmap-export flag.
_DISABLE_HEATMAP_EXPORT = os.environ.get("DISABLE_HEATMAP_EXPORT", "").strip().lower() in (
    "1", "true", "yes", "on"
)

# Disable heatmap/breakdown consistency validation only (the heatmap CSV/JSON
# files are still exported). Use this when the export is needed but the
# validation step is too slow or not required. Set env
# DISABLE_HEATMAP_VALIDATION=true or pass --disable-heatmap-validation.
_DISABLE_HEATMAP_VALIDATION = os.environ.get(
    "DISABLE_HEATMAP_VALIDATION", ""
).strip().lower() in ("1", "true", "yes", "on")

# Number of top non-zero latency buckets to preview in stdout for each combo.
# Env HEATMAP_PREVIEW_TOP (default 3); set to 0 to disable the preview entirely.
# The --heatmap-preview-top=N CLI flag overrides the env var.
try:
    _HEATMAP_PREVIEW_TOP = int(os.environ.get("HEATMAP_PREVIEW_TOP", "3"))
except ValueError:
    _HEATMAP_PREVIEW_TOP = 3




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




BODY_SNIPPET_CHARS = int(_num("BODY_SNIPPET_CHARS", 200, int, minimum=0))
BODY_HASH_ENABLED = os.environ.get("BODY_HASH", "true").strip().lower() not in ("0", "false", "no")


# Toggle body-snippet sanitization. On by default: strips <script>/<style>,
# collapses HTML tags to plain text, and redacts obvious secrets so a failed
# response embedded in a GitHub summary doesn't leak tokens or dump a wall
# of minified markup. Set BODY_SANITIZE=false to render the raw text
# (still whitespace-collapsed + truncated).
BODY_SANITIZE_ENABLED = os.environ.get("BODY_SANITIZE", "true").strip().lower() not in ("0", "false", "no")

# Content types for which a body snippet is useful in the step summary.
# Binary responses (image/*, application/pdf, application/zip, etc.) produce
# an empty snippet so the summary doesn't dump a wall of base64 or null bytes.
# Supports wildcards (`text/*`) and parameters are ignored (`application/json;
# charset=utf-8` matches). Default: text/* and application/json.
_DEFAULT_SNIPPET_CONTENT_TYPES = ["text/*", "application/json"]
_BODY_SNIPPET_CONTENT_TYPES_RAW = os.environ.get(
    "BODY_SNIPPET_CONTENT_TYPES", ",".join(_DEFAULT_SNIPPET_CONTENT_TYPES)
)
BODY_SNIPPET_CONTENT_TYPES: list[tuple[str, str | None]] = []
for _ct in (x.strip() for x in _BODY_SNIPPET_CONTENT_TYPES_RAW.split(",") if x.strip()):
    _ct = _ct.lower()
    if _ct.endswith("/*"):
        BODY_SNIPPET_CONTENT_TYPES.append((_ct[:-2], None))  # wildcard subtype
    elif "/" in _ct:
        _main, _sub = _ct.split("/", 1)
        BODY_SNIPPET_CONTENT_TYPES.append((_main, _sub))
    else:
        print(f"preflight: warning: skipping malformed BODY_SNIPPET_CONTENT_TYPES entry {_ct!r}", file=sys.stderr)



# Patterns for redaction. Order matters: match longer/structured secrets first
# so an email inside a JWT payload doesn't get partially replaced.
import re as _re_mod
_REDACTION_PATTERNS: list[tuple[_re_mod.Pattern[str], str]] = [
    # JWT-ish: three base64url segments separated by dots.
    (_re_mod.compile(r"\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\b"), "[REDACTED_JWT]"),
    # Bearer / Basic auth headers echoed into the body.
    (_re_mod.compile(r"\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}", _re_mod.IGNORECASE), r"\1 [REDACTED]"),
    # Common secret-looking key=value pairs (api_key, token, secret, password, authorization).
    (_re_mod.compile(
        r"\b(api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password|passwd|pwd|authorization|auth[_-]?token)\b"
        r"\s*[:=]\s*['\"]?([^\s'\"&,}]{4,})['\"]?",
        _re_mod.IGNORECASE,
    ), r"\1=[REDACTED]"),
    # Supabase-style publishable/secret keys.
    (_re_mod.compile(r"\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{10,}"), "[REDACTED_SB_KEY]"),
    # AWS access key IDs.
    (_re_mod.compile(r"\bAKIA[0-9A-Z]{16}\b"), "[REDACTED_AWS_KEY]"),
    # Long hex strings (>=32 chars) — likely hashes/keys, not prose.
    (_re_mod.compile(r"\b[a-fA-F0-9]{32,}\b"), "[REDACTED_HEX]"),
    # Email addresses.
    (_re_mod.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"), "[REDACTED_EMAIL]"),
]

def _sanitize_snippet(text: str) -> str:
    """Strip scripts/styles/tags and redact obvious secrets from a text blob.

    Kept intentionally dependency-free (no bs4/lxml) so it runs in the same
    minimal Actions container the rest of preflight uses.
    """
    # Drop <script>/<style>/<noscript> blocks entirely — they're never useful
    # in an error preview and often contain inline JSON with tokens.
    text = _re_mod.sub(r"<(script|style|noscript)\b[^>]*>.*?</\1\s*>", " ", text,
                      flags=_re_mod.IGNORECASE | _re_mod.DOTALL)
    # Drop HTML comments (may hide server debug info).
    text = _re_mod.sub(r"<!--.*?-->", " ", text, flags=_re_mod.DOTALL)
    # Collapse remaining tags to spaces so we keep the visible text.
    text = _re_mod.sub(r"<[^>]+>", " ", text)
    # Decode a handful of common entities so the snippet reads naturally.
    for entity, char in (("&nbsp;", " "), ("&amp;", "&"), ("&lt;", "<"),
                          ("&gt;", ">"), ("&quot;", '"'), ("&#39;", "'")):
        text = text.replace(entity, char)
    # Redact secrets after tag stripping so patterns match cleanly.
    for pattern, replacement in _REDACTION_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def _content_type_allowed_for_snippet(content_type: str) -> bool:
    """Return True if the response Content-Type is text-like enough to preview.

    Empty/unknown content types are allowed (fail-open). Binary types such as
    image/*, application/pdf, application/octet-stream, etc. return False so
    the summary doesn't render a base64 or null-byte wall.
    """
    if not content_type:
        return True
    mt = content_type.split(";", 1)[0].strip().lower()
    if not mt or "/" not in mt:
        return True
    main, sub = mt.split("/", 1)
    for allowed_main, allowed_sub in BODY_SNIPPET_CONTENT_TYPES:
        if main == allowed_main and (allowed_sub is None or sub == allowed_sub):
            return True
    return False


def _body_preview(body: bytes, content_type: str = "") -> tuple[str, str]:
    """Return (sha256_short, snippet) for a failed-response body.

    snippet is whitespace-collapsed, truncated to BODY_SNIPPET_CHARS chars.
    When BODY_SANITIZE is enabled (default), scripts/styles/HTML tags are
    stripped and obvious secrets are redacted so the preview is readable
    and safe to paste into a public step summary.

    The snippet is omitted (empty string) for binary responses whose
    Content-Type is not in BODY_SNIPPET_CONTENT_TYPES.
    """
    import hashlib, re as _re
    if not body:
        return "", ""
    # Hash the raw bytes — must stay stable across runs so we can spot
    # "same error page as yesterday" regardless of sanitization changes.
    digest = hashlib.sha256(body).hexdigest()[:12] if BODY_HASH_ENABLED else ""
    if BODY_SNIPPET_CHARS <= 0:
        return digest, ""
    if not _content_type_allowed_for_snippet(content_type):
        return digest, ""
    try:
        text = body.decode("utf-8", errors="replace")
    except Exception:
        text = repr(body[:BODY_SNIPPET_CHARS * 2])
    if BODY_SANITIZE_ENABLED:
        text = _sanitize_snippet(text)
    text = _re.sub(r"\s+", " ", text).strip()
    if len(text) > BODY_SNIPPET_CHARS:
        text = text[:BODY_SNIPPET_CHARS] + "…"
    return digest, text



# Response headers surfaced for failed URLs in the step summary. Content-Type
# distinguishes an HTML error page from a JSON API error; Server / X-Cache /
# CF-Ray / Age pinpoint which layer (origin vs CDN) served the response;
# Retry-After tells us if the server is asking us to back off; Cache-Control
# and Location explain stuck 3xx/304 loops. Comma-separated env override.
_DEFAULT_RESPONSE_HEADERS = [
    "Content-Type", "Content-Length", "Server", "Retry-After",
    "Cache-Control", "Age", "Location", "X-Cache", "CF-Ray", "Via",
]
RESPONSE_HEADERS: list[str] = [
    h.strip() for h in os.environ.get(
        "RESPONSE_HEADERS", ",".join(_DEFAULT_RESPONSE_HEADERS)
    ).split(",") if h.strip()
]
# Response header values that likely carry secrets — mask before rendering.
_SENSITIVE_RESPONSE_HEADER_SUBSTR = ("set-cookie", "authorization", "token", "secret", "api-key", "apikey")

def _pick_response_headers(headers) -> dict[str, str]:
    """Extract the configured response headers, preserving the requested order."""
    if not headers:
        return {}
    out: dict[str, str] = {}
    for name in RESPONSE_HEADERS:
        val = headers.get(name)
        if val:
            out[name] = val
    return out

def _render_response_headers_md(headers: dict[str, str]) -> str:
    if not headers:
        return ""
    parts = []
    for name, val in headers.items():
        low = name.lower()
        shown = _mask(val) if any(s in low for s in _SENSITIVE_RESPONSE_HEADER_SUBSTR) else val
        parts.append(f"`{name}: {_md_cell(shown)}`")
    return " · ".join(parts)


# Coarse error taxonomy so the summary distinguishes "server was slow" from
# "server rejected us" from "we never reached the server". Kinds:
#   timeout           — request exceeded TIMEOUT_SECONDS
#   dns               — hostname failed to resolve
#   tls               — SSL/TLS handshake or cert validation failed
#   connection_reset  — peer sent RST mid-stream
#   connection_refused— nothing listening on that port
#   connection_error  — other socket-level failure (broken pipe, unreachable)
#   http_status       — got an HTTP response but the code isn't in ACCEPT_STATUS
#   body_too_small    — 2xx but body < MIN_BODY_BYTES (likely SPA error shell)
#   ok                — probe succeeded
#   unknown           — none of the above patterns matched
def _classify_error(err: str, status: int | None) -> str:
    if not err:
        return "ok"
    low = err.lower()
    if "body" in low and "< min" in low:
        return "body_too_small"
    if status is not None and low.startswith("http "):
        return "http_status"
    if "timeout" in low or "timed out" in low:
        return "timeout"
    if any(s in low for s in (
        "name or service not known", "nodename nor servname",
        "getaddrinfo", "temporary failure in name resolution",
        "no address associated", "name resolution",
    )):
        return "dns"
    if any(s in low for s in (
        "ssl", "tls", "certificate", "cert verify", "handshake",
        "sslerror", "sslcertverificationerror",
    )):
        return "tls"
    if "connection reset" in low or "connectionresete" in low:
        return "connection_reset"
    if "connection refused" in low or "connectionrefused" in low:
        return "connection_refused"
    if any(s in low for s in (
        "connection", "broken pipe", "network is unreachable",
        "no route to host", "host is down", "urlerror",
    )):
        return "connection_error"
    return "unknown"


_ERROR_KIND_LABELS: dict[str, str] = {
    "ok": "✅ ok",
    "timeout": "⏱ timeout",
    "dns": "🌐 dns",
    "tls": "🔒 tls",
    "connection_reset": "🔌 reset",
    "connection_refused": "🚫 refused",
    "connection_error": "🔗 net",
    "http_status": "📄 http",
    "body_too_small": "📉 body",
    "unknown": "❓ unknown",
}


# HTTP status classification is orthogonal to error_kind: it says what the
# server returned, while error_kind says why we treated the probe as failed
# (a 200 with a tiny body still fails via `body_too_small`, and a transport
# error has no status at all).
_STATUS_CLASS_LABELS: dict[str, str] = {
    "none": "🚧 none",   # transport failure — no HTTP response at all
    "1xx": "ℹ️ 1xx",
    "2xx": "🟢 2xx",
    "3xx": "🔀 3xx",
    "4xx": "🟠 4xx",
    "5xx": "🔴 5xx",
    "xxx": "❓ xxx",
}


def _classify_status(status: int | None) -> str:
    """Bucket an HTTP status into `2xx`/`3xx`/`4xx`/`5xx`/`none`."""
    if status is None:
        return "none"
    if 100 <= status < 600:
        return f"{status // 100}xx"
    return "xxx"


def _status_class_retryable(status: int | None) -> bool:
    """Return True when the HTTP status/code is in RETRYABLE_STATUS_CLASSES."""
    if status is None or not RETRYABLE_STATUS_CLASSES:
        return False
    return _classify_status(status) in RETRYABLE_STATUS_CLASSES or str(status) in RETRYABLE_STATUS_CLASSES






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
    last_body: bytes = b""
    attempts = 0

    def _evaluate(status: int, body_bytes: int, ms: float, http_method: str, body: bytes) -> dict | None:
        nonlocal last_err, last_status, last_bytes, last_ms, last_method, last_body
        last_status, last_bytes, last_ms, last_method, last_body = status, body_bytes, ms, http_method, body
        if status not in accepted:
            last_err = f"HTTP {status} not in accept set {sorted(accepted)}"
            return None
        if 200 <= status < 300 and body_bytes > 0 and body_bytes < min_bytes:
            last_err = f"body {body_bytes}B < min {min_bytes}B (likely error page)"
            return None
        last_err = ""
        return {"url": url, "ok": True, "status": status, "bytes": body_bytes,
                "ms": ms, "attempts": attempts, "error": "", "method": http_method,
                "error_kind": "ok", "status_class": _classify_status(status)}


    def _do_request(http_method: str) -> tuple[int | None, int, float, str, bytes, dict[str, str], str]:
        """Issue one request. Returns (status, size_bytes, ms, error, body, headers, content_type).

        For HEAD, body is always b"" (no body). For GET, body carries whatever
        the server returned so failed probes can surface a snippet + hash.
        `headers` is the filtered response-header dict (see RESPONSE_HEADERS).
        `content_type` is the raw Content-Type response header (used to decide
        whether a body snippet is safe to render).
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
                resp_headers = _pick_response_headers(r.headers)
                content_type = r.headers.get("Content-Type", "")
                if http_method == "HEAD":
                    return r.status, int(r.headers.get("Content-Length") or 0), \
                        (time.perf_counter() - t0) * 1000, "", b"", resp_headers, content_type
                body = r.read()
                return r.status, len(body), (time.perf_counter() - t0) * 1000, "", body, resp_headers, content_type
        except urllib.error.HTTPError as e:
            ms = (time.perf_counter() - t0) * 1000
            resp_headers = _pick_response_headers(e.headers) if e.headers else {}
            content_type = e.headers.get("Content-Type", "") if e.headers else ""
            if http_method == "HEAD":
                size = int(e.headers.get("Content-Length") or 0) if e.headers else 0
                return e.code, size, ms, f"HTTP {e.code}", b"", resp_headers, content_type
            try:
                body = e.read() or b""
            except Exception:
                body = b""
            return e.code, len(body), ms, f"HTTP {e.code}", body, resp_headers, content_type
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            ms = (time.perf_counter() - t0) * 1000
            return None, 0, ms, f"{type(e).__name__}: {e}", b"", {}, ""

    last_headers: dict[str, str] = {}
    last_content_type = ""
    attempt_kinds: list[str] = []
    stopped_early = False
    for attempt in range(1, RETRIES + 1):
        attempts = attempt

        first_method = "HEAD" if method_mode in ("HEAD", "HEAD_THEN_GET") else "GET"
        status, size, ms, err, body, resp_headers, content_type = _do_request(first_method)
        if resp_headers:
            last_headers = resp_headers
        if content_type:
            last_content_type = content_type

        if status is not None:
            ok = _evaluate(status, size, ms, first_method, body)
            if ok:
                ok["attempt_kinds"] = attempt_kinds + ["ok"]
                ok["final_kind"] = "ok"
                return ok

        if method_mode == "HEAD_THEN_GET" and first_method == "HEAD":
            status2, size2, ms2, err2, body2, resp_headers2, content_type2 = _do_request("GET")
            if resp_headers2:
                last_headers = resp_headers2
            if content_type2:
                last_content_type = content_type2
            if status2 is not None:
                ok2 = _evaluate(status2, size2, ms2, "GET", body2)
                if ok2:
                    ok2["attempt_kinds"] = attempt_kinds + ["ok"]
                    ok2["final_kind"] = "ok"
                    return ok2
                # Use the GET result as the attempt's classified outcome.
                status, err = status2, last_err
            elif err2:
                last_err = err2
                last_ms = ms2
                status, err = None, err2

        elif status is None:
            last_err = err
            last_ms = ms

        # Classify this attempt so we can (a) decide whether to retry and
        # (b) show the per-attempt trail in the result.
        this_kind = _classify_error(err or last_err or "", status)
        attempt_kinds.append(this_kind)

        if this_kind not in RETRYABLE_ERROR_KINDS and not _status_class_retryable(status):
            # Deterministic failure — stop burning retries and backoff time.
            # A status class/code listed in RETRYABLE_STATUS_CLASSES overrides
            # this so e.g. 429/503 can still be retried.
            stopped_early = True
            break


        if attempt < RETRIES:
            time.sleep(_backoff_delay(attempt))

    body_hash, body_snippet = _body_preview(last_body, last_content_type)

    err_msg = last_err or "unknown error"
    final_kind = _classify_error(err_msg, last_status)
    return {"url": url, "ok": False, "status": last_status, "bytes": last_bytes,
            "ms": last_ms, "attempts": attempts,
            "error": err_msg, "method": last_method or method_mode,
            "body_hash": body_hash, "body_snippet": body_snippet,
            "response_headers": last_headers,
            "error_kind": final_kind,
            "final_kind": final_kind,
            "status_class": _classify_status(last_status),
            "attempt_kinds": attempt_kinds,
            "stopped_early": stopped_early}





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



# Latency buckets in ms. Chosen to separate "fast local", "healthy remote",
# "slow", and "near-timeout" so infra-shaped failures stand out from content.
def _fmt_ms_label(ms: float) -> str:
    """Human-friendly bucket edge label — ms below 1000, seconds above."""
    if ms >= 1000:
        v = ms / 1000.0
        s = f"{v:.1f}".rstrip("0").rstrip(".")
        return f"{s}s"
    return f"{int(ms)}"


def _build_latency_buckets() -> list[tuple[str, float]]:
    """Assemble the latency histogram edges from env.

    Two mutually exclusive knobs, evaluated in order:
      LATENCY_BUCKETS    explicit comma-separated upper bounds in ms
                         (e.g. `50,100,250,500,1000,5000`). Wins if set.
      LATENCY_BIN_SIZE   uniform bin width in ms; requires LATENCY_MAX_MS
      LATENCY_MAX_MS     highest finite edge; anything slower falls into
                         the always-present `+` overflow bucket
    The overflow bucket (`float('inf')`) is always appended so no sample
    is ever dropped from the histogram/heatmap.
    """
    raw = (os.environ.get("LATENCY_BUCKETS") or "").strip()
    edges: list[float] = []
    if raw:
        for tok in raw.split(","):
            tok = tok.strip()
            if not tok:
                continue
            try:
                v = float(tok)
            except ValueError:
                continue
            if v > 0:
                edges.append(v)
    else:
        bin_size = _num("LATENCY_BIN_SIZE", 0, minimum=0)
        max_ms = _num("LATENCY_MAX_MS", 0, minimum=0)
        if bin_size > 0 and max_ms > 0:
            v = bin_size
            while v <= max_ms + 1e-6:
                edges.append(v)
                v += bin_size

    if not edges:
        # Default kept in sync with the historical baseline so unchanged
        # runs render exactly as before.
        edges = [100, 250, 500, 1000, 2500, 5000, 10000]

    edges = sorted(set(edges))
    buckets: list[tuple[str, float]] = []
    prev = 0.0
    for e in edges:
        buckets.append((f"{_fmt_ms_label(prev)}–{_fmt_ms_label(e)}", e))
        prev = e
    buckets.append((f"{_fmt_ms_label(prev)}+", float("inf")))
    return buckets


_LATENCY_BUCKETS: list[tuple[str, float]] = _build_latency_buckets()

# Sort order for the summary error_kind × status_class combo table.
# `default` keeps the historical view (non-ok rows first, then count desc).
# Other fields are sorted by the configured metric with `desc` by default
# (highest count / success rate / failure share at the top).
_SORT_COMBOS_BY_OPTIONS = {"default", "count", "success_rate", "failures_pct"}
_SORT_COMBOS_BY = (os.environ.get("SORT_COMBOS_BY") or "default").strip().lower()
if _SORT_COMBOS_BY not in _SORT_COMBOS_BY_OPTIONS:
    print(f"preflight: warning: invalid SORT_COMBOS_BY={_SORT_COMBOS_BY!r}; using default", file=sys.stderr)
    _SORT_COMBOS_BY = "default"
_SORT_COMBOS_ORDER = (os.environ.get("SORT_COMBOS_ORDER") or "desc").strip().lower()
if _SORT_COMBOS_ORDER not in {"asc", "desc"}:
    print(f"preflight: warning: invalid SORT_COMBOS_ORDER={_SORT_COMBOS_ORDER!r}; using desc", file=sys.stderr)
    _SORT_COMBOS_ORDER = "desc"

# Rate bar rendering mode. `success` (default) fills cells left-to-right with
# 🟩 up to success%; `failure` fills them with 🟥 up to failure%. Also accepts
# CLI flags --rate-bar=success|failure so the toggle is discoverable from --help.
_RATE_BAR_MODE_OPTIONS = {"success", "failure"}
def _resolve_rate_bar_mode() -> str:
    for arg in sys.argv[1:]:
        if arg.startswith("--rate-bar="):
            v = arg.split("=", 1)[1].strip().lower()
            if v in _RATE_BAR_MODE_OPTIONS:
                return v
            print(f"preflight: warning: invalid --rate-bar={v!r}; using success", file=sys.stderr)
            return "success"
    v = (os.environ.get("RATE_BAR_MODE") or "success").strip().lower()
    if v not in _RATE_BAR_MODE_OPTIONS:
        print(f"preflight: warning: invalid RATE_BAR_MODE={v!r}; using success", file=sys.stderr)
        return "success"
    return v
_RATE_BAR_MODE = _resolve_rate_bar_mode()

# Combo-table quick filters. Grammar (predicates AND-combined):
#   <metric><op><value>   metric ∈ {success, failure}
#                         op     ∈ {>=, <=, >, <, =, ==}
#                         value  ∈ [0, 100]
# Predicates come from env `COMBO_FILTERS` (";"- or ","-separated) and
# repeated CLI `--combo-filter=...` flags; both sources merge. Example:
#   COMBO_FILTERS="success>=80;failure<=20"  → only combos with
#   success ≥ 80% AND failure ≤ 20%. An empty spec means "no filter".
_COMBO_FILTER_OPS = {
    ">=": lambda a, b: a >= b,
    "<=": lambda a, b: a <= b,
    ">":  lambda a, b: a >  b,
    "<":  lambda a, b: a <  b,
    "==": lambda a, b: abs(a - b) < 1e-9,
    "=":  lambda a, b: abs(a - b) < 1e-9,
}
def _parse_combo_filters() -> list[tuple[str, str, float, str]]:
    """Return list of (metric, op, value, raw) predicates. Invalid entries
    are warned to stderr and skipped so a typo never silently hides rows."""
    raw_specs: list[str] = []
    env = (os.environ.get("COMBO_FILTERS") or "").strip()
    if env:
        raw_specs += [p for p in env.replace(",", ";").split(";") if p.strip()]
    for arg in sys.argv[1:]:
        if arg.startswith("--combo-filter="):
            raw_specs.append(arg.split("=", 1)[1])
    parsed: list[tuple[str, str, float, str]] = []
    for spec in raw_specs:
        s = spec.strip().lower().replace(" ", "")
        if not s:
            continue
        op_found = None
        # Longest op first so ">=" is not shadowed by ">".
        for op in (">=", "<=", "==", ">", "<", "="):
            idx = s.find(op)
            if idx > 0:
                op_found = (op, idx)
                break
        if not op_found:
            print(f"preflight: warning: ignoring COMBO filter {spec!r} (no operator)", file=sys.stderr)
            continue
        op, idx = op_found
        metric = s[:idx]
        val_s = s[idx + len(op):]
        if metric not in {"success", "failure"}:
            print(f"preflight: warning: ignoring COMBO filter {spec!r} "
                  f"(metric must be success|failure, got {metric!r})", file=sys.stderr)
            continue
        try:
            val = float(val_s.rstrip("%"))
        except ValueError:
            print(f"preflight: warning: ignoring COMBO filter {spec!r} "
                  f"(value {val_s!r} is not numeric)", file=sys.stderr)
            continue
        if not (0.0 <= val <= 100.0):
            print(f"preflight: warning: ignoring COMBO filter {spec!r} "
                  f"(value must be in [0, 100])", file=sys.stderr)
            continue
        parsed.append((metric, op, val, spec.strip()))
    return parsed
_COMBO_FILTERS = _parse_combo_filters()

def _combo_row_matches_filters(success_pct: float) -> bool:
    """AND-combine every configured predicate. Empty filter list = keep all."""
    failure_pct = 100.0 - success_pct
    for metric, op, val, _raw in _COMBO_FILTERS:
        actual = success_pct if metric == "success" else failure_pct
        if not _COMBO_FILTER_OPS[op](actual, val):
            return False
    return True



def _bucket_for(ms: float) -> int:
    for i, (_, hi) in enumerate(_LATENCY_BUCKETS):
        if ms < hi:
            return i
    return len(_LATENCY_BUCKETS) - 1


def _render_latency_histogram(results: list[dict]) -> list[str]:
    """Return Markdown lines for a per-error_kind latency histogram.

    One row per bucket, one column per observed kind. Cells show the count
    and a short ASCII bar scaled to the max cell in the whole table so
    distribution shape is visible at a glance.
    """
    if not results:
        return []
    from collections import defaultdict

    # kind -> bucket_idx -> count
    grid: dict[str, list[int]] = defaultdict(lambda: [0] * len(_LATENCY_BUCKETS))
    for r in results:
        kind = r.get("error_kind") or ("ok" if r["ok"] else "unknown")
        grid[kind][_bucket_for(float(r.get("ms") or 0))] += 1

    # Stable order: ok first, then by total count desc.
    kinds = sorted(grid.keys(),
                   key=lambda k: (k != "ok", -sum(grid[k]), k))
    max_cell = max((max(row) for row in grid.values()), default=0)
    if max_cell == 0:
        return []

    def bar(n: int) -> str:
        if n <= 0:
            return ""
        width = max(1, round((n / max_cell) * 8))
        return "█" * width

    header_labels = [_ERROR_KIND_LABELS.get(k, k) for k in kinds]
    lines = [
        "",
        "#### Latency distribution by error kind",
        "",
        "| Bucket (ms) | " + " | ".join(header_labels) + " |",
        "| :--- | " + " | ".join([":---"] * len(kinds)) + " |",
    ]
    for i, (label, _) in enumerate(_LATENCY_BUCKETS):
        cells = []
        for k in kinds:
            n = grid[k][i]
            cells.append(f"{n} {bar(n)}".strip() if n else "·")
        lines.append(f"| {label} | " + " | ".join(cells) + " |")
    lines.append("")
    return lines


def _render_latency_heatmap(results: list[dict]) -> list[str]:
    """Latency histogram grouped by both error_kind and status_class.

    Same buckets as the per-kind histogram, but columns are split by
    status_class so transport failures (`none`) are shown separately from
    HTTP-level failures (`4xx`, `5xx`, etc.). This makes it obvious whether
    e.g. 5xx responses are slow (backend struggling) or fast (a denied/waf
    response), while timeouts/DNS/TLS remain in the `none` column.
    """
    if not results:
        return []
    from collections import defaultdict

    # (error_kind, status_class) -> bucket_idx -> count
    grid: dict[tuple[str, str], list[int]] = defaultdict(lambda: [0] * len(_LATENCY_BUCKETS))
    for r in results:
        kind = r.get("error_kind") or ("ok" if r["ok"] else "unknown")
        status_class = r.get("status_class") or _classify_status(r.get("status"))
        grid[(kind, status_class)][_bucket_for(float(r.get("ms") or 0))] += 1

    # Stable order: ok first, then by total count desc, then alphabetically.
    keys = sorted(grid.keys(),
                  key=lambda k: (k[0] != "ok", -sum(grid[k]), k[0], k[1]))
    max_cell = max((max(row) for row in grid.values()), default=0)
    if max_cell == 0:
        return []

    def bar(n: int) -> str:
        if n <= 0:
            return ""
        width = max(1, round((n / max_cell) * 8))
        return "█" * width

    header_labels = [
        f"{_ERROR_KIND_LABELS.get(k, k)} ({_STATUS_CLASS_LABELS.get(c, c)})"
        for k, c in keys
    ]
    lines = [
        "",
        "#### Latency distribution by error kind × status class",
        "",
        "| Bucket (ms) | " + " | ".join(header_labels) + " |",
        "| :--- | " + " | ".join([":---"] * len(keys)) + " |",
    ]
    for i, (label, _) in enumerate(_LATENCY_BUCKETS):
        cells = []
        for k in keys:
            n = grid[k][i]
            cells.append(f"{n} {bar(n)}".strip() if n else "·")
        lines.append(f"| {label} | " + " | ".join(cells) + " |")
    lines.append("")
    return lines




def _group_key_for(url: str) -> str:
    """Derive a 'solution / section' group key from a URL path.

    Uses `/solutions/<slug>` when present (so per-solution failures cluster),
    otherwise falls back to the first two path segments (e.g. `/en/pricing`).
    Returns `/` for the root URL.
    """
    from urllib.parse import urlparse
    path = urlparse(url).path or "/"
    parts = [p for p in path.split("/") if p]
    if "solutions" in parts:
        i = parts.index("solutions")
        tail = parts[i + 1] if i + 1 < len(parts) else ""
        return f"/solutions/{tail}" if tail else "/solutions"
    if not parts:
        return "/"
    return "/" + "/".join(parts[:2])


def _render_top_offenders(results: list[dict], top_n: int) -> list[str]:
    """Rank URLs and path groups by failure count + retry attempts.

    Two tables:
      1. Top URLs — one row per URL, sorted by (failed, attempts desc, ms desc).
         Highlights individual endpoints that burned the most retry budget.
      2. Top solution/section groups — aggregates failures and total attempts
         per `_group_key_for(url)` bucket so a systemic issue (e.g. an entire
         /solutions/<slug> tree failing) is visible even when no single URL
         dominates.
    Only rendered when there is at least one failure or attempts>1 row.
    """
    from collections import defaultdict
    interesting = [r for r in results if not r.get("ok") or (r.get("attempts") or 1) > 1]
    if not interesting:
        return []

    lines: list[str] = ["", f"#### Top repeat offenders (top {top_n})", ""]

    # --- Per-URL ranking ---
    url_rows = sorted(
        interesting,
        key=lambda r: (0 if r.get("ok") else -1,
                       -(r.get("attempts") or 1),
                       -(r.get("ms") or 0)),
    )[:top_n]
    lines += [
        "| URL | Failures | Attempts | Kind | Status |",
        "| --- | ---: | ---: | :---: | :---: |",
    ]
    for r in url_rows:
        rel = r["url"].replace(BASE, "") or r["url"]
        failed = 0 if r.get("ok") else 1
        kind = _ERROR_KIND_LABELS.get(r.get("error_kind") or "unknown",
                                       r.get("error_kind") or "—")
        sc = r.get("status_class") or _classify_status(r.get("status"))
        sc_label = _STATUS_CLASS_LABELS.get(sc, sc)
        lines.append(
            f"| [{_md_cell(rel)}]({r['url']}) | {failed} | "
            f"{r.get('attempts') or 1} | {kind} | {sc_label} |"
        )

    # --- Per-group ranking ---
    groups: dict[str, dict[str, int]] = defaultdict(
        lambda: {"failed": 0, "attempts": 0, "total": 0})
    for r in results:
        g = groups[_group_key_for(r["url"])]
        g["total"] += 1
        g["attempts"] += r.get("attempts") or 1
        if not r.get("ok"):
            g["failed"] += 1
    group_rows = sorted(
        ((k, v) for k, v in groups.items() if v["failed"] or v["attempts"] > v["total"]),
        key=lambda kv: (-kv[1]["failed"], -kv[1]["attempts"], kv[0]),
    )[:top_n]
    if group_rows:
        lines += [
            "",
            "| Section | Failures | Total attempts | URLs |",
            "| --- | ---: | ---: | ---: |",
        ]
        for k, v in group_rows:
            lines.append(
                f"| `{k}` | {v['failed']} | {v['attempts']} | {v['total']} |"
            )
    lines.append("")
    return lines


def _overall_rate_line(
    display: list[dict],
    results: list[dict],
    filter_scope: str,
) -> str:
    """Single-line overall success/failure rate, with delta vs unfiltered."""
    display_total = len(display)
    ok_count = sum(1 for r in display if r["ok"])
    if not display_total:
        return "**Overall:** no rows in filtered view"
    display_success_rate = 100.0 * ok_count / display_total
    display_failure_rate = 100.0 - display_success_rate
    line = (
        f"**Overall:** {display_success_rate:.1f}% success rate, "
        f"{display_failure_rate:.1f}% failure rate"
    )
    if filter_scope != "all" and results:
        total = len(results)
        total_ok = sum(1 for r in results if r["ok"])
        total_success_rate = 100.0 * total_ok / total
        total_failure_rate = 100.0 - total_success_rate
        d_success = display_success_rate - total_success_rate
        d_failure = display_failure_rate - total_failure_rate
        sign_s = "+" if d_success >= 0 else ""
        sign_f = "+" if d_failure >= 0 else ""
        line += (
            f" · Δ vs unfiltered: success {sign_s}{d_success:.1f}pp, "
            f"failure {sign_f}{d_failure:.1f}pp"
        )
    return line

def _parse_summary_filter_presets() -> dict[str, str]:
    """Return {name: filter_expression} from SUMMARY_FILTER_PRESETS.

    Two accepted formats (JSON wins if both are present):
      SUMMARY_FILTER_PRESETS_JSON='{"server":"status_class=5xx",
                                    "transport":"error_kind=timeout,tls,dns"}'
      SUMMARY_FILTER_PRESETS='server::status_class=5xx
                              ||transport::error_kind=timeout,tls,dns'
    Preset names are lower-cased; empty entries are dropped.
    """
    raw_json = (os.environ.get("SUMMARY_FILTER_PRESETS_JSON") or "").strip()
    presets: dict[str, str] = {}
    if raw_json:
        try:
            import json as _json
            data = _json.loads(raw_json)
            if isinstance(data, dict):
                for k, v in data.items():
                    if isinstance(k, str) and isinstance(v, str) and k.strip() and v.strip():
                        presets[k.strip().lower()] = v.strip()
        except Exception:
            pass
    raw = (os.environ.get("SUMMARY_FILTER_PRESETS") or "").strip()
    if raw:
        for entry in raw.split("||"):
            name, sep, expr = entry.partition("::")
            if sep and name.strip() and expr.strip():
                presets.setdefault(name.strip().lower(), expr.strip())
    return presets


def _resolve_summary_filter(raw_filter: str,
                            presets: dict[str, str]) -> tuple[str, str | None]:
    """Expand a preset reference into a real filter expression.

    Returns (expression, preset_name_or_None). Accepted preset references:
      SUMMARY_FILTER="preset:server"   → looks up presets["server"]
      SUMMARY_FILTER="@server"         → same, shorthand
      SUMMARY_FILTER="server"          → resolved if it matches a preset name
                                         AND is not a reserved keyword.
    """
    expr = (raw_filter or "all").strip()
    if not expr:
        return "all", None
    low = expr.lower()
    preset_name: str | None = None
    if low.startswith("preset:"):
        preset_name = low[len("preset:"):].strip()
    elif low.startswith("@"):
        preset_name = low[1:].strip()
    elif low in presets and low not in ("all", "failures"):
        preset_name = low
    if preset_name and preset_name in presets:
        return presets[preset_name], preset_name
    return expr, None


def write_step_summary(results: list[dict]) -> None:
    """Append a Markdown table of results to $GITHUB_STEP_SUMMARY."""
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return

    # SUMMARY_FILTER reuses the RESULTS_INCLUDE grammar so the on-screen
    # breakdown and per-URL table can be narrowed to specific error_kinds
    # / status_classes without affecting the exported CSV/JSON. Named
    # presets defined via SUMMARY_FILTER_PRESETS[_JSON] can be selected
    # with `SUMMARY_FILTER=preset:<name>` (or `@<name>`) so users switch
    # between saved scenarios without re-typing the whole expression.
    presets = _parse_summary_filter_presets()
    raw_filter = (os.environ.get("SUMMARY_FILTER") or "all").strip()
    resolved_filter, active_preset = _resolve_summary_filter(raw_filter, presets)
    filtered, filter_scope = _filter_results_for_export(results, resolved_filter)
    total = len(results)
    display = filtered if filter_scope != "all" else results


    ok_count = sum(1 for r in display if r["ok"])
    total_ms = sum(r["ms"] for r in display)
    slowest = max((r["ms"] for r in display), default=0.0)
    lines = [
        "## Preflight — site + sitemap reachable",
        "",
        _overall_rate_line(display, results, filter_scope),
        "",
        f"_Probed **{total}** URL(s) at `{BASE}` "
        f"(timeout `{TIMEOUT}s`, retries `{RETRIES}`, "
        f"backoff `{BACKOFF_BASE:g}s × {BACKOFF_FACTOR:g}` cap `{BACKOFF_MAX:g}s`, "
        f"min body `{DEFAULT_MIN_BYTES}B`, accept `{','.join(str(s) for s in sorted(ACCEPT_STATUS))}`, "
        f"method `{METHOD}`, follow-redirects `{str(FOLLOW_REDIRECTS).lower()}`)._",


        "",
        f"- UA: `{USER_AGENT}`",
        f"- Custom headers: {_render_headers_md(CUSTOM_HEADERS)}",
        f"- **{ok_count}/{len(display)}** healthy"
        + (f" _(filtered from {total})_" if filter_scope != "all" else ""),
        f"- Total wall time: **{total_ms:.0f} ms**",
        f"- Slowest response: **{slowest:.0f} ms**",
        f"- Retry kinds: `{','.join(sorted(RETRYABLE_ERROR_KINDS)) or 'none'}` "
        f"(status classes/codes: `{','.join(sorted(RETRYABLE_STATUS_CLASSES)) or 'none'}`)",
    ]
    if filter_scope != "all":
        preset_note = f" _(preset `{active_preset}`)_" if active_preset else ""
        lines.append(f"- Summary filter: `{filter_scope}`{preset_note} "
                     f"(showing {len(display)} of {total} row(s))")
    if presets:
        preset_list = ", ".join(
            f"`{name}` → `{expr}`" for name, expr in sorted(presets.items())
        )
        lines.append(
            f"- Saved filter presets ({len(presets)}): {preset_list}. "
            f"Select with `SUMMARY_FILTER=preset:<name>` or `@<name>`."
        )



    # Failure-kind breakdown: shows at a glance whether the run is dominated
    # by timeouts (latency), DNS/TLS (infra) or HTTP errors (app/content).
    from collections import Counter
    kinds = Counter(r.get("error_kind") or ("ok" if r["ok"] else "unknown")
                    for r in display if not r["ok"])
    if kinds:
        parts = [f"{_ERROR_KIND_LABELS.get(k, k)} × **{n}**"
                 for k, n in kinds.most_common()]
        lines.append(f"- Failure kinds: {' · '.join(parts)}")

    # HTTP status classification is separate from error_kind so a reader can
    # tell "the server answered 4xx/5xx" from "we never got a response"
    # (`none` = transport failure — DNS/TLS/timeout/reset). Covers all
    # results, not just failures, so 2xx/3xx counts are visible too.
    status_classes = Counter(
        r.get("status_class") or _classify_status(r.get("status")) for r in display
    )
    if status_classes:
        order = ["2xx", "3xx", "4xx", "5xx", "1xx", "xxx", "none"]
        ordered = sorted(status_classes.items(),
                         key=lambda kv: (order.index(kv[0]) if kv[0] in order else 99, kv[0]))
        parts = [f"{_STATUS_CLASS_LABELS.get(k, k)} × **{n}**" for k, n in ordered]
        lines.append(f"- HTTP status classes: {' · '.join(parts)}")

    # Combined error_kind × status_class breakdown: shows which transport
    # failures (timeout, dns, tls, reset) sit next to `none` status class vs
    # which HTTP-level errors carry 4xx/5xx. A transport error with `none`
    # means the server never responded; a transport error with `4xx` would
    # hint at a misclassified HTTP refusal or WAF behavior.
    if kinds:
        combo = Counter(
            (r.get("error_kind") or "unknown",
             r.get("status_class") or _classify_status(r.get("status")))
            for r in display if not r["ok"]
        )
        # Combos across ALL rows too, so ok/2xx appears with its success share
        # and each failure combo is anchored against the full run.
        combo_all = Counter(
            (r.get("error_kind") or ("ok" if r["ok"] else "unknown"),
             r.get("status_class") or _classify_status(r.get("status")))
            for r in display
        )
        # Latency percentiles per combo — reuse _build_breakdown_rows so the
        # summary numbers match the CSV/JSON export exactly. Skipped when
        # percentiles are disabled.
        pctile_index = {}
        if not _DISABLE_PERCENTILES:
            pctile_index = {
                (r["error_kind"], r["status_class"]): r
                for r in _build_breakdown_rows(display)
            }
        total_all = max(len(display), 1)
        total_fail = max(sum(combo.values()), 1)
        combo_rows_all = _sort_combo_rows(combo_all, combo, total_all, total_fail)
        # Quick filters: keep only combos whose success/failure rate matches
        # every configured predicate (see _parse_combo_filters). Applied here
        # rather than at aggregation time so overall_fail_pct and totals stay
        # anchored to the full run — the filter only hides table rows.
        if _COMBO_FILTERS:
            combo_rows = [r for r in combo_rows_all
                          if _combo_row_matches_filters(r[4])]
            hidden = len(combo_rows_all) - len(combo_rows)
            filter_desc = ", ".join(f"`{raw}`" for _, _, _, raw in _COMBO_FILTERS)
        else:
            combo_rows = combo_rows_all
            hidden = 0
            filter_desc = ""
        overall_fail_pct = 100.0 * sum(combo.values()) / total_all
        lines.append("")
        heading = (
            f"- Breakdown by kind × status class "
            f"(overall failure rate **{overall_fail_pct:.1f}%**)"
        )
        if _COMBO_FILTERS:
            heading += (
                f" — filters: {filter_desc} "
                f"(showing {len(combo_rows)} of {len(combo_rows_all)} combo(s)"
                f"{f', {hidden} hidden' if hidden else ''}):"
            )
        else:
            heading += ":"
        lines.append(heading)
        # Inline sparkline width (chars) for the success/failure bar column.
        # 10 keeps each 10% ≈ 1 block so a reader can eyeball the split at
        # a glance without the column dominating the table.
        bar_w = 10
        if _DISABLE_PERCENTILES:
            header = (
                "| Kind | Status class | Count | Failed | Success rate "
                "| Rate bar | % of all | % of failures |"
            )
            separator = "| --- | :---: | ---: | ---: | ---: | :--- | ---: | ---: |"
        else:
            header = (
                "| Kind | Status class | Count | Failed | Success rate "
                "| Rate bar | % of all | % of failures | p50 (ms) | p95 (ms) | p99 (ms) |"
            )
            separator = (
                "| --- | :---: | ---: | ---: | ---: | :--- | ---: | ---: | ---: | ---: | ---: |"
            )
        lines += ["", header, separator]
        if not combo_rows:
            # Placeholder row keeps the table syntactically valid when every
            # combo is filtered out — otherwise GFM renders a broken table.
            empty_cells = 8 if _DISABLE_PERCENTILES else 11
            lines.append("| " + " | ".join(["_no combo matches active filters_"]
                                            + ["—"] * (empty_cells - 1)) + " |")
        for kind, status_class, n, failed, success_pct, share_fail in combo_rows:
            share_all = 100.0 * n / total_all
            kind_label = _ERROR_KIND_LABELS.get(kind, kind)
            class_label = _STATUS_CLASS_LABELS.get(status_class, status_class)
            pr = pctile_index.get((kind, status_class), {})
            # Bar: mode-dependent fill. In `success` mode 🟩 grows left→right
            # to success%; in `failure` mode 🟥 grows left→right to failure%.
            # Rounding rule is symmetric so both modes agree on cell counts.
            failure_pct = 100.0 - success_pct
            if _RATE_BAR_MODE == "failure":
                fail_cells = int(round(failure_pct / 100 * bar_w))
                success_cells = bar_w - fail_cells
                bar_glyphs = "🟥" * fail_cells + "🟩" * success_cells
            else:
                success_cells = int(round(success_pct / 100 * bar_w))
                fail_cells = bar_w - success_cells
                bar_glyphs = "🟩" * success_cells + "🟥" * fail_cells
            # Wrap in <span title="..."> so GitHub renders a hover tooltip
            # with the exact success/failure percentages plus raw counts —
            # the rounded blocks in the bar always lose precision.
            tooltip = (
                f"Success rate: {success_pct:.2f}% ({n - failed}/{n})"
                f" • Failure rate: {failure_pct:.2f}% ({failed}/{n})"
            )
            bar = f'<span title="{tooltip}">{bar_glyphs}</span>'
            row = (
                f"| {kind_label} | {class_label} | {n} | {failed} "
                f"| {success_pct:.1f}% | {bar} | {share_all:.1f}% "
                f"| {share_fail:.1f}%"
            )
            if not _DISABLE_PERCENTILES:
                row += (
                    f" | {pr.get('ms_p50', 0):.0f} | {pr.get('ms_p95', 0):.0f} "
                    f"| {pr.get('ms_p99', 0):.0f} |"
                )
            else:
                row += " |"
            lines.append(row)
        # Legend under the table so readers understand what the Rate bar
        # encodes without reverse-engineering the glyphs. The threshold line
        # documents the rounding rule used above, which is what turns e.g.
        # 94.9% into 9🟩/1🟥.
        mode_label = "failure rate" if _RATE_BAR_MODE == "failure" else "success rate"
        fill_glyph = "🟥" if _RATE_BAR_MODE == "failure" else "🟩"
        rest_glyph = "🟩" if _RATE_BAR_MODE == "failure" else "🟥"
        lines += [
            "",
            f"<sub>Rate bar legend (mode: **{_RATE_BAR_MODE}** — "
            f"set `RATE_BAR_MODE=success|failure` or `--rate-bar=success|failure` to switch): "
            f"{fill_glyph} fills left→right to {mode_label}; "
            f"{rest_glyph} fills the remainder. "
            f"Each bar is {bar_w} cell(s); one cell ≈ {100 // bar_w}% "
            f"(cells = round({mode_label.split()[0]}% / {100 // bar_w})). "
            f"Hover a bar to see the exact success/failure rate and raw counts.</sub>",
            "",
        ]

    # Latency histogram grouped by error_kind: makes it obvious whether e.g.
    # timeouts cluster at the timeout ceiling, TLS failures fail fast, or DNS
    # errors have their own bimodal shape vs healthy `ok` responses.
    lines += _render_latency_histogram(display)

    # Heatmap grouping latency by both error_kind and status_class: separates
    # HTTP-level failures (4xx/5xx) from transport failures (none) so their
    # latency shapes are not averaged together.
    lines += _render_latency_heatmap(display)

    # Top repeat offenders: surface which URLs (and which solution/path
    # groups) burned the most retry attempts or produced failures, so a
    # reader can jump straight to the worst actors without scanning the
    # full per-URL table. Env-tunable via TOP_OFFENDERS (default 5, 0
    # disables the section).
    top_n = int(_num("TOP_OFFENDERS", 5, cast=int, minimum=0))
    if top_n > 0:
        lines += _render_top_offenders(display, top_n)



    lines += [
        "",
        "| Status | Kind | URL | Method | HTTP | Time (ms) | Size | Attempts | Notes |",
        "| :---: | :---: | --- | :---: | ---: | ---: | ---: | ---: | --- |",
    ]
    for r in sorted(display, key=lambda x: (x["ok"], -x["ms"])):
        marker = "✅" if r["ok"] else "❌"
        rel = r["url"].replace(BASE, "") or r["url"]
        http = r["status"] if r["status"] is not None else "—"
        size = f"{r['bytes']:,} B" if r["bytes"] else "—"
        note = _md_cell(r["error"]) if r["error"] else "ok"
        meth = r.get("method") or METHOD
        kind = _ERROR_KIND_LABELS.get(r.get("error_kind") or ("ok" if r["ok"] else "unknown"),
                                       r.get("error_kind") or "—")
        lines.append(
            f"| {marker} | {kind} | [{_md_cell(rel)}]({r['url']}) | `{meth}` "
            f"| `{http}` | {r['ms']:.0f} | {size} | {r['attempts']} | {note} |"
        )
    lines.append("")

    # Deep-dive block for failures: body hash + snippet so the reader can tell
    # "this is the CDN's HTML error page again" from "a new failure mode" or
    # "the request went through but latency was the killer".
    failures_with_detail = [r for r in display if not r["ok"] and (
        r.get("body_hash") or r.get("body_snippet") or r.get("response_headers"))]
    if failures_with_detail:
        lines.append("### Failed response bodies")
        lines.append("")
        lines.append("_Preview of what the server actually returned. Same hash across"
                     " runs = same error page; empty snippet = no body (transport error,"
                     " HEAD request, or binary response). Response headers help pinpoint"
                     " the source"
                     " (origin vs CDN, cache hit, Retry-After, redirect target)._")
        lines.append("")
        for r in failures_with_detail:
            rel = r["url"].replace(BASE, "") or r["url"]
            hash_part = f"`sha256:{r['body_hash']}`" if r.get("body_hash") else "_no hash_"
            snippet = r.get("body_snippet") or ""
            headers_md = _render_response_headers_md(r.get("response_headers") or {})
            lines.append(f"**{_md_cell(rel)}** — {hash_part} · `{r['bytes']:,} B` · `{r['ms']:.0f} ms`")
            if headers_md:
                lines.append("")
                lines.append(f"Response headers: {headers_md}")
            if snippet:
                # Fenced block avoids Markdown interpreting HTML/pipes in the snippet.
                lines.append("")
                lines.append("```text")
                lines.append(snippet)
                lines.append("```")
            lines.append("")

    with open(path, "a", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")


# Columns exported to CSV. Order is stable so downstream analysis (spreadsheet
# pivots, `duckdb read_csv_auto`, pandas) sees the same schema across runs.
_CSV_COLUMNS: list[str] = [
    "url", "ok", "method", "status", "status_class",
    "error_kind", "final_kind", "error",
    "ms", "bytes", "attempts", "attempt_kinds", "stopped_early",
    "body_hash", "body_snippet", "content_type",
    "response_headers",
]




def _flatten_for_csv(r: dict) -> dict:
    """Coerce a result row into flat, CSV-safe scalar values."""
    headers = r.get("response_headers") or {}
    # Serialize headers as `k: v; k: v` — keeps the CSV single-row per URL
    # and stays greppable without needing a JSON parser.
    hdr_str = "; ".join(f"{k}: {v}" for k, v in headers.items()) if headers else ""
    ct = headers.get("Content-Type") or headers.get("content-type") or ""
    row = {c: "" for c in _CSV_COLUMNS}
    row.update({
        "url": r.get("url", ""),
        "ok": "true" if r.get("ok") else "false",
        "method": r.get("method") or "",
        "status": "" if r.get("status") is None else r.get("status"),
        "status_class": r.get("status_class") or _classify_status(r.get("status")),
        "error_kind": r.get("error_kind") or "",

        "final_kind": r.get("final_kind") or r.get("error_kind") or "",
        "error": r.get("error") or "",
        "ms": f"{float(r.get('ms') or 0):.1f}",
        "bytes": r.get("bytes") or 0,
        "attempts": r.get("attempts") or 0,
        "attempt_kinds": ">".join(r.get("attempt_kinds") or []),
        "stopped_early": "true" if r.get("stopped_early") else "false",

        "body_hash": r.get("body_hash") or "",
        # Collapse newlines so the snippet stays in one CSV cell.
        "body_snippet": (r.get("body_snippet") or "").replace("\r", " ").replace("\n", " "),
        "content_type": ct,
        "response_headers": hdr_str,
    })
    return row


def _filter_results_for_export(
    results: list[dict], raw_scope: str
) -> tuple[list[dict], str]:
    """Apply the RESULTS_INCLUDE grammar and return (rows, normalized_scope).

    Grammar (clauses separated by `;`, matched with logical OR):
      all                              → every row
      failures                         → ok is false
      status_class=4xx,5xx             → row["status_class"] in set
      error_kind=timeout,tls           → row["error_kind"] in set
      combo=http:5xx,timeout:none      → (error_kind, status_class) pair matches

    Unknown clauses are ignored (fall through to matching nothing for that
    clause); if every clause is unknown/empty the scope collapses to `all`
    so we never silently emit an empty file.
    """
    scope = (raw_scope or "all").strip()
    if not scope or scope.lower() == "all":
        return list(results), "all"
    if scope.lower() == "failures":
        return [r for r in results if not r.get("ok")], "failures"

    status_classes: set[str] = set()
    error_kinds: set[str] = set()
    combos: set[tuple[str, str]] = set()
    known = False
    for clause in scope.split(";"):
        clause = clause.strip()
        if not clause or "=" not in clause:
            continue
        key, _, value = clause.partition("=")
        key = key.strip().lower()
        parts = [v.strip().lower() for v in value.split(",") if v.strip()]
        if key in ("status_class", "status"):
            status_classes.update(parts)
            known = True
        elif key in ("error_kind", "kind"):
            error_kinds.update(parts)
            known = True
        elif key == "combo":
            for p in parts:
                k, _, s = p.partition(":")
                if k and s:
                    combos.add((k.strip(), s.strip()))
            known = True

    if not known:
        return list(results), "all"

    def matches(r: dict) -> bool:
        sc = str(r.get("status_class") or "").lower()
        ek = str(r.get("error_kind") or "").lower()
        if status_classes and sc in status_classes:
            return True
        if error_kinds and ek in error_kinds:
            return True
        if combos and (ek, sc) in combos:
            return True
        return False

    return [r for r in results if matches(r)], scope


def _percentile(sorted_values: list[float], pct: float) -> float:
    """Nearest-rank percentile over an already-sorted, non-empty list.

    Nearest-rank keeps the returned value equal to an observed sample (no
    interpolation), which is what we want for latency buckets: p95 must
    reflect a real request, not a synthetic average between two.
    """
    if not sorted_values:
        return 0.0
    if len(sorted_values) == 1:
        return sorted_values[0]
    k = max(0, min(len(sorted_values) - 1,
                   int(round((pct / 100.0) * (len(sorted_values) - 1)))))
    return sorted_values[k]


def _build_breakdown_rows(results: list[dict]) -> list[dict]:
    """Aggregate results into (error_kind, status_class) rows for export.

    Each row carries counts, share (%), attempt totals, and latency stats
    (avg, max, p50/p95/p99) so the CSV/JSON is directly analyzable without
    re-deriving anything from the per-URL export.
    """
    from collections import defaultdict
    buckets: dict[tuple[str, str], dict] = defaultdict(
        lambda: {"count": 0, "failed": 0, "attempts": 0, "ms": []})
    for r in results:
        kind = r.get("error_kind") or ("ok" if r.get("ok") else "unknown")
        sc = r.get("status_class") or _classify_status(r.get("status"))
        b = buckets[(kind, sc)]
        b["count"] += 1
        b["attempts"] += r.get("attempts") or 1
        b["ms"].append(float(r.get("ms") or 0))
        if not r.get("ok"):
            b["failed"] += 1
    total = max(len(results), 1)
    total_failed = max(sum(b["failed"] for b in buckets.values()), 1)
    rows = []
    for (kind, sc), b in buckets.items():
        ms_sorted = sorted(b["ms"])
        ms_total = sum(ms_sorted)
        rows.append({
            "error_kind": kind,
            "status_class": sc,
            "count": b["count"],
            "failed": b["failed"],
            # success_rate_pct + failure_rate_pct + share_pct + failures_pct
            # mirror the summary combo table 1:1 so CSV consumers can
            # reproduce the same view (including the Rate bar tooltip's
            # exact success/failure rates) without recomputing:
            #   success_rate_pct  → "Success rate" column & tooltip's success%
            #   failure_rate_pct  → tooltip's failure% (= 100 - success_rate_pct)
            #   share_pct         → "% of all" column
            #   failures_pct      → "% of failures" column
            "success_rate_pct": round(100 * (b["count"] - b["failed"]) / b["count"], 2)
                if b["count"] else 0.0,
            "failure_rate_pct": round(100 * b["failed"] / b["count"], 2)
                if b["count"] else 0.0,
            "share_pct": round(100 * b["count"] / total, 2),
            "failures_pct": round(100 * b["failed"] / total_failed, 2)
                if b["failed"] else 0.0,
            "attempts_total": b["attempts"],
            "attempts_avg": round(b["attempts"] / b["count"], 2),
            "ms_avg": round(ms_total / b["count"], 1),
            "ms_max": round(ms_sorted[-1], 1),
            "ms_p50": round(_percentile(ms_sorted, 50), 1),
            "ms_p95": round(_percentile(ms_sorted, 95), 1),
            "ms_p99": round(_percentile(ms_sorted, 99), 1),
        })
    rows.sort(key=lambda r: (-r["failed"], -r["count"],
                             r["error_kind"], r["status_class"]))
    return rows


_BREAKDOWN_COLUMNS = [
    "error_kind", "status_class", "count", "failed",
    "success_rate_pct", "failure_rate_pct", "share_pct", "failures_pct",
    "attempts_total", "attempts_avg",
    "ms_avg", "ms_p50", "ms_p95", "ms_p99", "ms_max",
]


def _sort_combo_rows(
    combo_all: Counter,
    combo: Counter,
    total_all: int,
    total_fail: int,
) -> list[tuple[str, str, int, int, float, float]]:
    """Return the summary combo table rows in the configured sort order.

    Each tuple is (kind, status_class, count, failed, success_pct, failures_pct).
    """
    rows: list[tuple[str, str, int, int, float, float]] = []
    for (kind, status_class), n in combo_all.items():
        failed = combo.get((kind, status_class), 0) if kind != "ok" else 0
        success_pct = 100.0 * (n - failed) / n if n else 0.0
        failures_pct = 100.0 * failed / total_fail if failed else 0.0
        rows.append((kind, status_class, n, failed, success_pct, failures_pct))

    if _SORT_COMBOS_BY == "default":
        # Historical order: non-ok combos first, then largest count, then label.
        rows.sort(key=lambda r: (0 if r[0] == "ok" else -1, -r[2], r[0], r[1]))
    else:
        if _SORT_COMBOS_BY == "count":
            primary = lambda r: r[2]
        elif _SORT_COMBOS_BY == "success_rate":
            primary = lambda r: r[4]
        else:  # failures_pct
            primary = lambda r: r[5]
        if _SORT_COMBOS_ORDER == "asc":
            rows.sort(key=lambda r: (primary(r), r[0], r[1]))
        else:
            rows.sort(key=lambda r: (-primary(r), r[0], r[1]))
    return rows


def export_results(results: list[dict]) -> None:
    """Write results as CSV / JSON artifacts for post-run analysis.

    Paths are opt-in via env so the script stays side-effect free by default:
      RESULTS_CSV_PATH     write full per-URL CSV (recommended for CI artifacts)
      RESULTS_JSON_PATH    also write results as pretty JSON
      RESULTS_INCLUDE      filter rows on disk (see grammar in module docstring)
      BREAKDOWN_CSV_PATH   write the error_kind × status_class breakdown as CSV
      BREAKDOWN_JSON_PATH  same breakdown as JSON (list of dicts)
      HEATMAP_CSV_PATH     write the latency heatmap bin counts as CSV
                           (one row per error_kind × status_class combo,
                           one column per latency bucket)
      HEATMAP_JSON_PATH    same heatmap as JSON for offline analysis; each
                           entry is {error_kind, status_class, total,
                           buckets: [{label, lo_ms, hi_ms, count}, ...]}
    All files are also linked from $GITHUB_STEP_SUMMARY when set.
    """
    import csv
    import json

    csv_path = os.environ.get("RESULTS_CSV_PATH", "").strip()
    json_path = os.environ.get("RESULTS_JSON_PATH", "").strip()
    bd_csv = os.environ.get("BREAKDOWN_CSV_PATH", "").strip()
    bd_json = os.environ.get("BREAKDOWN_JSON_PATH", "").strip()
    heatmap_csv = os.environ.get("HEATMAP_CSV_PATH", "").strip()
    heatmap_json = os.environ.get("HEATMAP_JSON_PATH", "").strip()
    if not any((csv_path, json_path, bd_csv, bd_json, heatmap_csv, heatmap_json)):
        return

    raw_scope = (os.environ.get("RESULTS_INCLUDE") or "all").strip()
    rows, scope = _filter_results_for_export(results, raw_scope)

    written: list[str] = []
    if csv_path:
        os.makedirs(os.path.dirname(csv_path) or ".", exist_ok=True)
        with open(csv_path, "w", encoding="utf-8", newline="") as fh:
            writer = csv.DictWriter(fh, fieldnames=_CSV_COLUMNS)
            writer.writeheader()
            for r in rows:
                writer.writerow(_flatten_for_csv(r))
        written.append(csv_path)
        print(f"Wrote results CSV → {csv_path} ({len(rows)} row(s), scope={scope})")

    if json_path:
        os.makedirs(os.path.dirname(json_path) or ".", exist_ok=True)
        with open(json_path, "w", encoding="utf-8") as fh:
            json.dump(rows, fh, ensure_ascii=False, indent=2, default=str)
        written.append(json_path)
        print(f"Wrote results JSON → {json_path} ({len(rows)} row(s), scope={scope})")

    # Breakdown artifacts are always derived from the FULL result set so the
    # aggregate totals remain meaningful even when RESULTS_INCLUDE narrows
    # the per-URL export to a subset. Skipped entirely when percentiles are
    # disabled, because the breakdown's primary value is the p50/p95/p99 data.
    breakdown_written: list[str] = []
    if bd_csv or bd_json:
        if _DISABLE_PERCENTILES:
            print("preflight: breakdown export skipped because DISABLE_PERCENTILES is set")
        else:
            breakdown = _build_breakdown_rows(results)
            if bd_csv:
                os.makedirs(os.path.dirname(bd_csv) or ".", exist_ok=True)
                with open(bd_csv, "w", encoding="utf-8", newline="") as fh:
                    writer = csv.DictWriter(fh, fieldnames=_BREAKDOWN_COLUMNS)
                    writer.writeheader()
                    for r in breakdown:
                        writer.writerow(r)
                breakdown_written.append(bd_csv)
                print(f"Wrote breakdown CSV → {bd_csv} ({len(breakdown)} row(s))")
            if bd_json:
                os.makedirs(os.path.dirname(bd_json) or ".", exist_ok=True)
                with open(bd_json, "w", encoding="utf-8") as fh:
                    json.dump(breakdown, fh, ensure_ascii=False, indent=2, default=str)
                breakdown_written.append(bd_json)
                print(f"Wrote breakdown JSON → {bd_json} ({len(breakdown)} row(s))")

    # Heatmap CSV: one row per (error_kind, status_class), one column per
    # latency bucket, plus a `total` column. Always derived from the FULL
    # result set for the same reason as breakdown_written above.
    #
    # Skipped entirely when DISABLE_HEATMAP_EXPORT is set to avoid the extra
    # binning work and the heatmap/breakdown consistency validation.
    heatmap_written: list[str] = []
    if _DISABLE_HEATMAP_EXPORT:
        if heatmap_csv or heatmap_json:
            print("preflight: heatmap export skipped because DISABLE_HEATMAP_EXPORT is set")
    elif heatmap_csv or heatmap_json:
        from collections import defaultdict
        grid: dict[tuple[str, str], list[int]] = defaultdict(
            lambda: [0] * len(_LATENCY_BUCKETS))
        for r in results:
            kind = r.get("error_kind") or ("ok" if r.get("ok") else "unknown")
            sc = r.get("status_class") or _classify_status(r.get("status"))
            grid[(kind, sc)][_bucket_for(float(r.get("ms") or 0))] += 1
        bucket_labels = [lbl for lbl, _ in _LATENCY_BUCKETS]
        sorted_grid = sorted(
            grid.items(),
            key=lambda kv: (0 if kv[0][0] == "ok" else -1,
                            -sum(kv[1]), kv[0][0], kv[0][1]),
        )

        # Validation: bucket counts per (error_kind, status_class) must sum
        # to the same total as the corresponding breakdown row `count`.
        # Mismatches indicate a classification/bucketing bug — surface them
        # loudly so the exported artifacts are never silently inconsistent.
        # Skipped when percentiles are disabled (breakdown is not built) or
        # when heatmap validation is explicitly disabled via env/CLI.
        if not _DISABLE_PERCENTILES and not _DISABLE_HEATMAP_VALIDATION:
            breakdown_by_combo = {
                (r["error_kind"], r["status_class"]): r["count"]
                for r in _build_breakdown_rows(results)
            }
            heatmap_by_combo = {k: sum(v) for k, v in grid.items()}
            mismatches: list[str] = []
            for combo, hcount in heatmap_by_combo.items():
                bcount = breakdown_by_combo.get(combo)
                if bcount is None:
                    mismatches.append(
                        f"{combo[0]}×{combo[1]}: heatmap={hcount}, breakdown=<missing>")
                elif bcount != hcount:
                    mismatches.append(
                        f"{combo[0]}×{combo[1]}: heatmap={hcount}, breakdown={bcount}")
            for combo in breakdown_by_combo.keys() - heatmap_by_combo.keys():
                mismatches.append(
                    f"{combo[0]}×{combo[1]}: heatmap=<missing>, breakdown={breakdown_by_combo[combo]}")
            if mismatches:
                msg = ("preflight: heatmap/breakdown totals mismatch:\n  "
                       + "\n  ".join(mismatches))
                print(msg, file=sys.stderr)
                raise AssertionError(msg)
            print(f"Heatmap validation OK: {len(heatmap_by_combo)} combo(s) "
                  f"match breakdown totals ({sum(heatmap_by_combo.values())} row(s))")
        if heatmap_csv:
            os.makedirs(os.path.dirname(heatmap_csv) or ".", exist_ok=True)
            with open(heatmap_csv, "w", encoding="utf-8", newline="") as fh:
                writer = csv.writer(fh)
                writer.writerow(["error_kind", "status_class", *bucket_labels, "total"])
                for (kind, sc), counts in sorted_grid:
                    writer.writerow([kind, sc, *counts, sum(counts)])
            heatmap_written.append(heatmap_csv)
            print(f"Wrote heatmap CSV → {heatmap_csv} ({len(grid)} combo(s), "
                  f"{len(bucket_labels)} bucket(s))")
        if heatmap_json:
            # Bucket edges come from _LATENCY_BUCKETS: [(label, upper_ms), ...]
            # in ascending order; lo_ms is the previous bucket's upper (0 for
            # the first). The final bucket is open-ended so hi_ms is null.
            bucket_meta: list[tuple[str, float, float | None]] = []
            prev = 0.0
            for i, (lbl, upper) in enumerate(_LATENCY_BUCKETS):
                is_last = i == len(_LATENCY_BUCKETS) - 1
                hi = None if is_last else float(upper)
                bucket_meta.append((lbl, prev, hi))
                prev = float(upper)
            payload = [
                {
                    "error_kind": kind,
                    "status_class": sc,
                    "total": sum(counts),
                    "buckets": [
                        {"label": lbl, "lo_ms": lo, "hi_ms": hi, "count": counts[i]}
                        for i, (lbl, lo, hi) in enumerate(bucket_meta)
                    ],
                }
                for (kind, sc), counts in sorted_grid
            ]
            os.makedirs(os.path.dirname(heatmap_json) or ".", exist_ok=True)
            with open(heatmap_json, "w", encoding="utf-8") as fh:
                json.dump(payload, fh, ensure_ascii=False, indent=2, default=str)
            heatmap_written.append(heatmap_json)
            print(f"Wrote heatmap JSON → {heatmap_json} ({len(grid)} combo(s), "
                  f"{len(bucket_labels)} bucket(s))")

        # Compact stdout preview: top-N non-zero bins per combo so operators
        # can sanity-check the export without opening the CSV/JSON. Tunable
        # via HEATMAP_PREVIEW_TOP (default 3, set to 0 to disable).
        try:
            preview_top = int(os.environ.get("HEATMAP_PREVIEW_TOP", "3"))
        except ValueError:
            preview_top = 3
        if preview_top > 0 and sorted_grid:
            print(f"Heatmap preview (top {preview_top} bin(s) per combo):")
            for (kind, sc), counts in sorted_grid:
                total = sum(counts)
                if not total:
                    continue
                ranked = sorted(
                    ((counts[i], bucket_labels[i]) for i in range(len(counts)) if counts[i]),
                    key=lambda x: (-x[0], x[1]),
                )[:preview_top]
                bins = ", ".join(
                    f"{lbl}={c} ({c * 100.0 / total:.0f}%)" for c, lbl in ranked
                )
                print(f"  {kind:<10} {sc:<4} n={total:<4} {bins}")

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    heatmap_expected_but_disabled = _DISABLE_HEATMAP_EXPORT and (
        os.environ.get("HEATMAP_CSV_PATH", "").strip()
        or os.environ.get("HEATMAP_JSON_PATH", "").strip()
    )
    if summary_path and (written or breakdown_written or heatmap_written or heatmap_expected_but_disabled):
        with open(summary_path, "a", encoding="utf-8") as fh:
            fh.write("\n### Result artifacts\n\n")
            if written:
                fh.write(f"_Scope: **{scope}** ({len(rows)} of {len(results)} row(s))._\n\n")
                for p in written:
                    fh.write(f"- `{p}`\n")
            if breakdown_written:
                fh.write("\n_Breakdown (error_kind × status_class, full result set):_\n\n")
                for p in breakdown_written:
                    fh.write(f"- `{p}`\n")
            if heatmap_written:
                fh.write("\n_Latency heatmap bin counts (error_kind × status_class × bucket):_\n\n")
                for p in heatmap_written:
                    fh.write(f"- [`{p}`]({p})\n")
            elif heatmap_expected_but_disabled:
                fh.write(
                    "\n⚠️ _Latency heatmap export was **disabled** "
                    "(`DISABLE_HEATMAP_EXPORT=true` or `--disable-heatmap-export`). "
                    "HEATMAP CSV/JSON files were not generated._\n"
                )
            fh.write("\n")


def main() -> int:
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__)
        return 0

    global _DISABLE_PERCENTILES
    if "--disable-percentiles" in sys.argv:
        _DISABLE_PERCENTILES = True
        sys.argv.remove("--disable-percentiles")

    global _DISABLE_HEATMAP_EXPORT
    if "--disable-heatmap-export" in sys.argv:
        _DISABLE_HEATMAP_EXPORT = True
        sys.argv.remove("--disable-heatmap-export")

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
        kind = r.get("error_kind") or ("ok" if r["ok"] else "unknown")
        trail = ">".join(r.get("attempt_kinds") or []) or "-"
        stop = " (stopped early)" if r.get("stopped_early") else ""
        print(f"  {marker} [{meth} {http} {kind}] {r['ms']:6.0f}ms "
              f"attempts={r['attempts']} trail={trail}{stop}  {r['url']} — {detail}")


    # Per-combo latency percentiles, printed unless explicitly disabled.
    # Disabling saves a small amount of runtime and keeps the summary shorter
    # when only pass/fail data is needed.
    if not _DISABLE_PERCENTILES:
        breakdown = _build_breakdown_rows(results)
        if breakdown:
            print("\nLatency by error_kind × status_class "
                  "(count/failed  avg  p50 / p95 / p99  max):")
            for row in breakdown:
                print(f"  {row['error_kind']:>16s} × {row['status_class']:<4s} "
                      f"{row['count']:>3d}/{row['failed']:<3d}  "
                      f"avg {row['ms_avg']:>7.1f}ms  "
                      f"p50 {row['ms_p50']:>7.1f}  "
                      f"p95 {row['ms_p95']:>7.1f}  "
                      f"p99 {row['ms_p99']:>7.1f}  "
                      f"max {row['ms_max']:>7.1f}")

    write_step_summary(results)
    export_results(results)


    failures = [r for r in results if not r["ok"]]
    if failures:
        for r in failures:
            if IN_GHA:
                kind = r.get("error_kind") or "unknown"
                print(
                    f"::error title=Preflight {kind}::{r['url']} "
                    f"[HTTP {r['status']}] {r['ms']:.0f}ms — {r['error']}",
                    flush=True,
                )
        print(f"\nPreflight FAILED: {len(failures)}/{len(results)} URL(s) unhealthy.")
        return 1

    print(f"\nPreflight OK: all {len(results)} URL(s) reachable.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

