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

  ARTIFACT_BASE_URL    optional base URL for the artifact index. When set, the
                        summary shows a "Copy absolute URLs" toggle that copies
                        `${ARTIFACT_BASE_URL}/${artifact_filename}` instead of the
                        local file path. The local file path remains the default.
  ARTIFACT_CSV_INCLUDE_URL
                       opt-in ("1"/"true"/"yes"/"on"): when ARTIFACT_BASE_URL is
                       also set, the "Copy links (CSV)" export gains a third
                       `url` column carrying the absolute URL alongside the
                       existing `label` and `path` columns.
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

  VALIDATION_JSON_PATH  path to write a JSON report of the heatmap/breakdown
                        consistency check. Contains every error_kind × status_class
                        combo with `expected` (breakdown count), `actual` (heatmap
                        count), `delta`, and per-combo `status`
                        (`ok`/`mismatch`/`missing_in_heatmap`/`missing_in_breakdown`),
                        plus top-level `ok`, `mismatch_count`, and `total_combos`.
                        Written even when `--disable-heatmap-validation` is set
                        (the AssertionError is still skipped). Same effect as
                        passing `--validation-json=PATH` on the command line.

  CLI flags:
    --help, -h                Print this help text and exit.
    --disable-percentiles     Skip p50/p95/p99 latency breakdowns and exports.
    --disable-heatmap-export  Skip heatmap CSV/JSON export and validation.
    --disable-heatmap-validation
                              Skip heatmap/breakdown consistency validation only.
    --heatmap-preview-top=N   Number of top non-zero buckets to preview per combo
                              (default 3; set 0 to disable).
    --validation-json=PATH    Write per-combo expected-vs-actual validation report.
    --reset-filters           Clear every quick combo filter (`COMBO_FILTERS` /
                              `--combo-filter=`) and `SUMMARY_FILTER`, restoring
                              the full unfiltered breakdown table. Env equivalent:
                              `RESET_FILTERS=true`.
    --combo-filter-mode=MODE  How to combine multiple combo predicates. `all`
                              (default) = AND (intersection); `any` = OR (union,
                              show rows matching any selected range). Aliases:
                              `and`/`intersection`, `or`/`union`. Env equivalent:
                              `COMBO_FILTER_MODE=any|all`.
    --filtered-combos-csv=PATH
                              Export ONLY the currently filtered combo rows
                              (post `COMBO_FILTERS` / `--combo-filter-mode` /
                              `--reset-filters`) to CSV with columns:
                              error_kind, status_class, count, failed,
                              success_pct, failure_pct, share_all_pct,
                              share_failures_pct (+ ms_avg/p50/p95/p99/max
                              unless `--disable-percentiles`). Distinct from
                              `BREAKDOWN_CSV_PATH`, which always exports the
                              full unfiltered aggregation. Env equivalent:
                              `FILTERED_COMBOS_CSV_PATH=PATH`.



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
import io, os, sys, time, urllib.request, urllib.error
import hashlib

from pathlib import Path
from urllib.parse import urlparse, urlunparse
import html
import json
import csv
import zipfile as _zipfile


# Shared source of truth for locales / paths — same list drives
# verify_solutions_seo.py, so preflight coverage tracks the audit matrix.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from solutions_seo_config import (  # noqa: E402
    LOCALES as ALL_LOCALES,
    PATHS as ALL_PATHS,
    CORE_PATHS,
    preflight_sample,
)


def _normalize_artifact_base_url(raw: str) -> str:
    """Validate and normalize ARTIFACT_BASE_URL so absolute links are well-formed.

    Removes whitespace, collapses repeated path slashes, strips trailing slashes,
    and rejects values that are not a valid http/https URL. Returns an empty
    string when the value is missing or invalid, which disables absolute links.
    """
    url = raw.strip()
    if not url:
        return ""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        print(
            f"preflight: warning: ARTIFACT_BASE_URL has no http/https scheme ({raw!r}); "
            "absolute artifact links disabled",
            file=sys.stderr,
        )
        return ""
    if not parsed.netloc:
        print(
            f"preflight: warning: ARTIFACT_BASE_URL has no host ({raw!r}); "
            "absolute artifact links disabled",
            file=sys.stderr,
        )
        return ""
    # Collapse repeated slashes in the path while keeping a single leading slash.
    path_parts = [part for part in parsed.path.split("/") if part]
    path = "/" + "/".join(path_parts) if path_parts else ""
    normalized = urlunparse(
        (parsed.scheme, parsed.netloc, path, parsed.params, parsed.query, parsed.fragment)
    )
    return normalized.rstrip("/")


BASE = os.environ.get("BASE_URL", "http://127.0.0.1:8080").rstrip("/")
ARTIFACT_BASE_URL = _normalize_artifact_base_url(os.environ.get("ARTIFACT_BASE_URL", ""))
# Opt-in: when ARTIFACT_BASE_URL is set, include an extra `url` column in the
# "Copy links (CSV)" export alongside the relative `path` column so downstream
# tools get both the on-disk path and the shareable URL in one row.
ARTIFACT_CSV_INCLUDE_URL = os.environ.get(
    "ARTIFACT_CSV_INCLUDE_URL", ""
).strip().lower() in ("1", "true", "yes", "on")

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
def _reset_filters_requested() -> bool:
    """Return True when the user asked to clear every quick combo filter and
    the summary filter, restoring the full unfiltered table. Trigger via env
    `RESET_FILTERS=true|1|yes|on` or CLI `--reset-filters`."""
    if os.environ.get("RESET_FILTERS", "").strip().lower() in ("1", "true", "yes", "on"):
        return True
    return "--reset-filters" in sys.argv


def _parse_combo_filters() -> list[tuple[str, str, float, str]]:
    """Return list of (metric, op, value, raw) predicates. Invalid entries
    are warned to stderr and skipped so a typo never silently hides rows.

    When `--reset-filters` / `RESET_FILTERS=true` is set, every configured
    combo filter is dropped so the full unfiltered table is restored."""
    if _reset_filters_requested():
        # Consume any --combo-filter= args so they don't pollute later parsing,
        # and print a note so the operator can see why filters were ignored.
        dropped: list[str] = []
        env = (os.environ.get("COMBO_FILTERS") or "").strip()
        if env:
            dropped.append(f"COMBO_FILTERS={env!r}")
        for arg in list(sys.argv[1:]):
            if arg.startswith("--combo-filter="):
                dropped.append(arg)
        if dropped:
            print(
                "preflight: --reset-filters active — clearing combo filters: "
                + ", ".join(dropped),
                file=sys.stderr,
            )
        return []
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
_FILTERS_RESET = _reset_filters_requested()


def _parse_combo_filter_mode() -> str:
    """Return `"any"` or `"all"`. Default `"all"` (AND-combine predicates).
    Trigger OR-combine via env `COMBO_FILTER_MODE=any` or CLI
    `--combo-filter-mode=any` (aliases: `or`, `union`)."""
    raw = (os.environ.get("COMBO_FILTER_MODE") or "").strip().lower()
    for arg in sys.argv[1:]:
        if arg.startswith("--combo-filter-mode="):
            raw = arg.split("=", 1)[1].strip().lower()
    if raw in ("any", "or", "union"):
        return "any"
    if raw in ("", "all", "and", "intersection"):
        return "all"
    print(
        f"preflight: warning: unknown COMBO_FILTER_MODE {raw!r} — "
        "expected any|or|union or all|and|intersection; falling back to 'all'",
        file=sys.stderr,
    )
    return "all"
_COMBO_FILTER_MODE = _parse_combo_filter_mode()


def _combo_row_matches_filters(success_pct: float) -> bool:
    """Combine every configured predicate per `_COMBO_FILTER_MODE`. Empty
    filter list = keep all. `all` = AND (default), `any` = OR — a row is
    kept when at least one predicate matches, so overlapping ranges act as
    a union rather than an intersection."""
    if not _COMBO_FILTERS:
        return True
    failure_pct = 100.0 - success_pct
    if _COMBO_FILTER_MODE == "any":
        for metric, op, val, _raw in _COMBO_FILTERS:
            actual = success_pct if metric == "success" else failure_pct
            if _COMBO_FILTER_OPS[op](actual, val):
                return True
        return False
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
    if _FILTERS_RESET:
        raw_filter = "all"
        active_preset = None
        resolved_filter = "all"
    else:
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
    if _FILTERS_RESET:
        lines.append(
            "- 🔄 Filters reset: quick combo filters and summary filter cleared "
            "(via `--reset-filters` / `RESET_FILTERS=true`) — showing the full "
            f"unfiltered table ({total} row(s))."
        )
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

        # Export the CURRENTLY FILTERED combo rows on demand. Distinct from
        # BREAKDOWN_CSV_PATH (which always exports the full unfiltered
        # aggregation) — this reflects exactly what the on-screen table shows
        # so an operator can share a spreadsheet matching the filtered view.
        filtered_csv_path = (
            os.environ.get("FILTERED_COMBOS_CSV_PATH") or ""
        ).strip()
        if filtered_csv_path:
            import csv as _csv
            os.makedirs(os.path.dirname(filtered_csv_path) or ".", exist_ok=True)
            base_cols = [
                "error_kind", "status_class", "count", "failed",
                "success_pct", "failure_pct",
                "share_all_pct", "share_failures_pct",
            ]
            extra_cols = [] if _DISABLE_PERCENTILES else [
                "ms_avg", "ms_p50", "ms_p95", "ms_p99", "ms_max",
            ]
            with open(filtered_csv_path, "w", encoding="utf-8", newline="") as _fh:
                _w = _csv.writer(_fh)
                _w.writerow(base_cols + extra_cols)
                for kind, status_class, n, failed, success_pct, share_fail in combo_rows:
                    share_all = 100.0 * n / total_all
                    failure_pct = 100.0 - success_pct
                    row = [
                        kind, status_class, n, failed,
                        f"{success_pct:.2f}", f"{failure_pct:.2f}",
                        f"{share_all:.2f}", f"{share_fail:.2f}",
                    ]
                    if not _DISABLE_PERCENTILES:
                        pr = pctile_index.get((kind, status_class), {})
                        row += [
                            f"{pr.get('ms_avg', 0):.2f}",
                            f"{pr.get('ms_p50', 0):.2f}",
                            f"{pr.get('ms_p95', 0):.2f}",
                            f"{pr.get('ms_p99', 0):.2f}",
                            f"{pr.get('ms_max', 0):.2f}",
                        ]
                    _w.writerow(row)
            active = (
                f"{len(_COMBO_FILTERS)} filter(s), mode={_COMBO_FILTER_MODE}"
                if _COMBO_FILTERS else "no filters (full view)"
            )
            print(
                f"Wrote filtered combos CSV → {filtered_csv_path} "
                f"({len(combo_rows)} row(s); {active})"
            )

        lines.append("")
        heading = (
            f"- Breakdown by kind × status class "
            f"(overall failure rate **{overall_fail_pct:.1f}%**)"
        )
        if _COMBO_FILTERS:
            join_word = "OR" if _COMBO_FILTER_MODE == "any" else "AND"
            heading += (
                f" — filters ({join_word}-combined, mode `{_COMBO_FILTER_MODE}`): "
                f"{filter_desc} "
                f"(showing {len(combo_rows)} of {len(combo_rows_all)} combo(s)"
                f"{f', {hidden} hidden' if hidden else ''}):"
            )
        else:
            heading += ":"
        lines.append(heading)

        # Aggregated rollup over ONLY the visible (post-filter) combo rows so
        # readers can see the success/failure rate of the subset they're
        # actually looking at — the heading's overall_fail_pct is anchored to
        # the full run and does not change when filters narrow the table.
        visible_count = sum(r[2] for r in combo_rows)
        visible_failed = sum(r[3] for r in combo_rows)
        visible_ok = visible_count - visible_failed
        if visible_count > 0:
            vis_success_pct = 100.0 * visible_ok / visible_count
            vis_failure_pct = 100.0 - vis_success_pct
        else:
            vis_success_pct = 0.0
            vis_failure_pct = 0.0
        scope_note = (
            f"{len(combo_rows)} of {len(combo_rows_all)} combo(s) visible"
            if _COMBO_FILTERS else
            f"all {len(combo_rows_all)} combo(s)"
        )
        lines.append(
            f"  - _Visible rollup ({scope_note}): "
            f"**{visible_count}** row(s), **{visible_ok}** ok / "
            f"**{visible_failed}** failed — "
            f"success **{vis_success_pct:.1f}%**, "
            f"failure **{vis_failure_pct:.1f}%**._"
        )
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


def _human_size(size: int) -> str:
    """Return a human-readable byte size string."""
    if size < 1024:
        return f"{size} B"
    elif size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"
    elif size < 1024 * 1024 * 1024:
        return f"{size / (1024 * 1024):.1f} MB"
    else:
        return f"{size / (1024 * 1024 * 1024):.1f} GB"


def _artifact_url(path: str) -> str | None:
    """Return an absolute artifact URL if ARTIFACT_BASE_URL is set, else None."""
    if not ARTIFACT_BASE_URL:
        return None
    return f"{ARTIFACT_BASE_URL}/{os.path.basename(path)}"


# Inline JS toast shown after copying a single artifact link. Self-contained so
# it works in any markdown viewer that executes onclick handlers.
_CLIPBOARD_TOAST_SINGLE = (
    ".then(() => { showCopyToast('Copied link' + (this.dataset.label ? ' for ' + this.dataset.label : '')); })"
    ".catch(() => { showCopyToast('Could not copy — check clipboard permissions'); })"
)

# Inline JS toast shown after copying multiple artifact links. The count is
# derived from the data-links attribute at click time; data-context supplies an
# optional label such as the group title or "all artifacts".
_CLIPBOARD_TOAST_MULTI = (
    ".then(() => { "
    "const ctx = this.dataset.context || ''; "
    "const n = this.dataset.links.split('\\n').length; "
    "showCopyToast('Copied ' + n + ' link' + (n === 1 ? '' : 's') + (ctx ? ' for ' + ctx : '')); "
    "})"
    ".catch(() => { showCopyToast('Could not copy — check clipboard permissions'); })"
)

# Inline JS toast shown after copying a Markdown bullet list. The count is
# derived from the data-markdown attribute at click time; data-context supplies
# an optional group label.
_CLIPBOARD_TOAST_MARKDOWN = (
    ".then(() => { "
    "const ctx = this.dataset.context || ''; "
    "const n = this.dataset.markdown.split('\\n').length; "
    "showCopyToast('Copied ' + n + ' markdown link' + (n === 1 ? '' : 's') + (ctx ? ' for ' + ctx : '')); "
    "})"
    ".catch(() => { showCopyToast('Could not copy — check clipboard permissions'); })"
)

# Inline JS toast shown after copying all artifact paths as a JSON array. The
# count is read from a data-count attribute; the actual JSON payload lives in
# data-json.
_CLIPBOARD_TOAST_JSON = (
    ".then(() => { "
    "const n = parseInt(this.dataset.count || '0', 10); "
    "showCopyToast('Copied ' + n + ' artifact path' + (n === 1 ? '' : 's') + ' as JSON'); "
    "})"
    ".catch(() => { showCopyToast('Could not copy — check clipboard permissions'); })"
)

# Inline JS toast shown after copying all artifact links as CSV. The count is
# read from a data-count attribute; the actual CSV payload lives in data-csv.
_CLIPBOARD_TOAST_CSV = (
    ".then(() => { "
    "const n = parseInt(this.dataset.count || '0', 10); "
    "showCopyToast('Copied ' + n + ' link' + (n === 1 ? '' : 's') + ' as CSV'); "
    "})"
    ".catch(() => { showCopyToast('Could not copy — check clipboard permissions'); })"
)


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
    validation_json = os.environ.get("VALIDATION_JSON_PATH", "").strip()
    if not any((csv_path, json_path, bd_csv, bd_json, heatmap_csv, heatmap_json, validation_json)):
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
        if heatmap_csv or heatmap_json or validation_json:
            print("preflight: heatmap export skipped because DISABLE_HEATMAP_EXPORT is set")
    elif heatmap_csv or heatmap_json or validation_json:
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
        if not _DISABLE_PERCENTILES and (not _DISABLE_HEATMAP_VALIDATION or validation_json):
            breakdown_by_combo = {
                (r["error_kind"], r["status_class"]): r["count"]
                for r in _build_breakdown_rows(results)
            }
            heatmap_by_combo = {k: sum(v) for k, v in grid.items()}
            # Precompute bucket edges (lo_ms, hi_ms) once so mismatch reports
            # can point at the specific buckets whose counts contribute to a
            # divergence — the total-only message doesn't tell an operator
            # where the offending rows landed.
            bucket_edges: list[tuple[str, float, float | None]] = []
            _prev = 0.0
            for _i, (_lbl, _upper) in enumerate(_LATENCY_BUCKETS):
                _is_last = _i == len(_LATENCY_BUCKETS) - 1
                bucket_edges.append(
                    (_lbl, _prev, None if _is_last else float(_upper)))
                _prev = float(_upper)

            def _fmt_edge(v: float) -> str:
                # Integer-ish edges render without trailing ".0" for readability.
                return f"{int(v)}" if float(v).is_integer() else f"{v}"

            def _nonzero_bucket_report(counts: list[int]) -> list[dict]:
                out: list[dict] = []
                for i, (lbl, lo, hi) in enumerate(bucket_edges):
                    if counts[i]:
                        out.append({
                            "label": lbl,
                            "lo_ms": lo,
                            "hi_ms": hi,
                            "count": counts[i],
                        })
                return out

            def _fmt_bucket_hint(counts: list[int]) -> str:
                parts = []
                for b in _nonzero_bucket_report(counts):
                    hi = "∞" if b["hi_ms"] is None else _fmt_edge(b["hi_ms"])
                    parts.append(
                        f"{b['label']} ({_fmt_edge(b['lo_ms'])}–{hi}ms)={b['count']}")
                return ", ".join(parts) if parts else "<no non-zero buckets>"

            # Third source of truth: recount combos directly from `results`
            # using the same fallback logic as the heatmap grid. This catches
            # divergences that agree between heatmap and breakdown but drift
            # from the actual per-row data (e.g. a classification helper that
            # silently changed).
            from collections import defaultdict as _dd
            raw_by_combo: dict[tuple[str, str], int] = _dd(int)
            for r in results:
                _kind = r.get("error_kind") or ("ok" if r.get("ok") else "unknown")
                _sc = r.get("status_class") or _classify_status(r.get("status"))
                raw_by_combo[(_kind, _sc)] += 1

            mismatches: list[str] = []
            combo_report: list[dict] = []
            all_combos = (set(heatmap_by_combo)
                          | set(breakdown_by_combo)
                          | set(raw_by_combo))
            for combo in sorted(all_combos):
                hcount = heatmap_by_combo.get(combo)
                bcount = breakdown_by_combo.get(combo)
                rcount = raw_by_combo.get(combo)
                buckets_hint = (_fmt_bucket_hint(grid[combo])
                                if combo in grid else "<no heatmap buckets>")
                sources = {
                    "heatmap": hcount,
                    "breakdown": bcount,
                    "raw": rcount,
                }
                present_values = {v for v in sources.values() if v is not None}
                missing = [name for name, v in sources.items() if v is None]

                if missing:
                    status = "missing_" + "_".join(missing)
                elif len(present_values) > 1:
                    status = "mismatch"
                else:
                    status = "ok"

                if status != "ok":
                    parts = [
                        f"heatmap={hcount if hcount is not None else '<missing>'}",
                        f"breakdown={bcount if bcount is not None else '<missing>'}",
                        f"raw={rcount if rcount is not None else '<missing>'}",
                    ]
                    deltas = []
                    if hcount is not None and bcount is not None and hcount != bcount:
                        deltas.append(f"heatmap-breakdown={hcount - bcount}")
                    if hcount is not None and rcount is not None and hcount != rcount:
                        deltas.append(f"heatmap-raw={hcount - rcount}")
                    if bcount is not None and rcount is not None and bcount != rcount:
                        deltas.append(f"breakdown-raw={bcount - rcount}")
                    delta_hint = f" ({', '.join(deltas)})" if deltas else ""
                    mismatches.append(
                        f"{combo[0]}×{combo[1]}: {', '.join(parts)}{delta_hint} — "
                        f"heatmap buckets: {buckets_hint}")

                entry = {
                    "error_kind": combo[0],
                    "status_class": combo[1],
                    "expected": bcount,
                    "actual": hcount,
                    "raw": rcount,
                    "delta": (None if hcount is None or bcount is None
                              else hcount - bcount),
                    "delta_vs_raw": (None if hcount is None or rcount is None
                                     else hcount - rcount),
                    "breakdown_vs_raw": (None if bcount is None or rcount is None
                                         else bcount - rcount),
                    "status": status,
                }
                if status != "ok" and combo in grid:
                    entry["diverging_buckets"] = _nonzero_bucket_report(grid[combo])
                combo_report.append(entry)

            if validation_json:
                from datetime import datetime, timezone
                payload = {
                    "ok": not mismatches,
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "total_combos": len(combo_report),
                    "mismatch_count": len(mismatches),
                    "combos": combo_report,
                }
                os.makedirs(os.path.dirname(validation_json) or ".", exist_ok=True)
                with open(validation_json, "w", encoding="utf-8") as fh:
                    json.dump(payload, fh, ensure_ascii=False, indent=2, default=str)
                print(f"Wrote validation JSON → {validation_json} "
                      f"({len(combo_report)} combo(s), {len(mismatches)} mismatch(es))")

            if not _DISABLE_HEATMAP_VALIDATION:
                if mismatches:
                    msg = ("preflight: heatmap/breakdown/raw totals mismatch:\n  "
                           + "\n  ".join(mismatches))
                    print(msg, file=sys.stderr)
                    raise AssertionError(msg)
                print(f"Heatmap validation OK: {len(heatmap_by_combo)} combo(s) "
                      f"match breakdown and raw totals "
                      f"({sum(heatmap_by_combo.values())} row(s))")
        elif validation_json:
            print("preflight: VALIDATION_JSON_PATH set but breakdown is disabled "
                  "(DISABLE_PERCENTILES); skipping validation JSON")
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
        # can sanity-check the export without opening the CSV/JSON. Defaults to
        # _HEATMAP_PREVIEW_TOP (3); set to 0 to disable the preview entirely.
        preview_top = _HEATMAP_PREVIEW_TOP
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
    # Extra artifacts written outside this function; picked up by path so the
    # index reflects everything the run produced in one place.
    validation_json_path = os.environ.get("VALIDATION_JSON_PATH", "").strip()
    filtered_combos_path = os.environ.get("FILTERED_COMBOS_CSV_PATH", "").strip()
    extra_written: list[tuple[str, str]] = []
    if validation_json_path and os.path.exists(validation_json_path):
        extra_written.append(("Heatmap validation report (JSON)", validation_json_path))
    if filtered_combos_path and os.path.exists(filtered_combos_path):
        extra_written.append(("Filtered combos (post-filter CSV)", filtered_combos_path))

    any_artifact = bool(
        written or breakdown_written or heatmap_written
        or heatmap_expected_but_disabled or extra_written
    )
    if summary_path and any_artifact:
        # Group each artifact under a labeled section, always as clickable
        # links (`[label](path)`) so operators can jump straight to a file
        # from the PR summary. Every group also reports its count so the
        # index doubles as a per-run manifest.
        groups: list[tuple[str, list[tuple[str, str]]]] = []
        if written:
            groups.append((
                f"Per-URL results — _scope: **{scope}** "
                f"({len(rows)} of {len(results)} row(s))_",
                [(os.path.basename(p), p) for p in written],
            ))
        if breakdown_written:
            groups.append((
                "Breakdown (error_kind × status_class, full result set)",
                [(os.path.basename(p), p) for p in breakdown_written],
            ))
        if heatmap_written:
            groups.append((
                "Latency heatmap bin counts (error_kind × status_class × bucket)",
                [(os.path.basename(p), p) for p in heatmap_written],
            ))
        if extra_written:
            groups.append((
                "Validation & filtered exports",
                [(label, p) for label, p in extra_written],
            ))

        total_files = sum(len(items) for _, items in groups)
        with open(summary_path, "a", encoding="utf-8") as fh:
            fh.write(
                f"\n### Artifacts index ({total_files} file"
                f"{'s' if total_files != 1 else ''})\n\n"
            )
            all_paths = [
                path
                for _, items in groups
                for _, path in items
            ]
            all_existing_paths = [
                path
                for path in all_paths
                if os.path.exists(path)
            ]
            fh.write(
                '<div class="artifact-index">\n'
                '<div id="artifact-copy-live" aria-live="polite" aria-atomic="true" '
                'style="position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;">\n'
                '</div>\n'
                '<style>'
                '.artifact-index button:focus-visible, '
                '.artifact-index input:focus-visible, '
                '.artifact-index select:focus-visible { '
                'outline: 2px solid #3b82f6; outline-offset: 2px; '
                '}'
                '.artifact-item { cursor: pointer; }'
                '.artifact-item.is-active { outline: 2px solid #3b82f6; outline-offset: 2px; border-radius: 4px; }'
                '#artifact-drawer-backdrop { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.35); z-index:9998; }'
                '#artifact-drawer { display:none; position:fixed; top:0; right:0; height:100vh; width:min(420px, 100vw); background:#fff; color:#111; box-shadow:-4px 0 16px rgba(0,0,0,0.2); z-index:9999; overflow:auto; padding:16px 18px; font-family:sans-serif; font-size:14px; line-height:1.45; box-sizing:border-box; }'
                '#artifact-drawer.is-open, #artifact-drawer-backdrop.is-open { display:block; }'
                '#artifact-drawer h3 { margin:0 0 8px; font-size:16px; word-break:break-word; }'
                '#artifact-drawer dl { display:grid; grid-template-columns:auto 1fr; gap:6px 12px; margin:12px 0; }'
                '#artifact-drawer dt { font-weight:600; color:#374151; }'
                '#artifact-drawer dd { margin:0; word-break:break-all; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px; }'
                '#artifact-drawer .artifact-drawer-actions { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; }'
                '#artifact-drawer .artifact-drawer-close { position:absolute; top:10px; right:12px; background:transparent; border:0; font-size:22px; line-height:1; cursor:pointer; }'
                '@media (prefers-color-scheme: dark) { #artifact-drawer { background:#111827; color:#f3f4f6; } #artifact-drawer dt { color:#d1d5db; } }'
                '.visually-hidden { position:absolute !important; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }'
                '.artifact-select:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }'
                '.artifact-select-label { cursor: pointer; display:inline-block; padding:2px; }'
                '</style>\n'
                '<div id="artifact-drawer-backdrop" onclick="closeArtifactDrawer()"></div>\n'
                '<aside id="artifact-drawer" role="dialog" aria-modal="true" aria-labelledby="artifact-drawer-title" tabindex="-1">\n'
                '<button type="button" class="artifact-drawer-close" aria-label="Close preview" onclick="closeArtifactDrawer()">×</button>\n'
                '<h3 id="artifact-drawer-title">Artifact preview</h3>\n'
                '<dl id="artifact-drawer-meta"></dl>\n'
                '<div class="artifact-drawer-actions" id="artifact-drawer-actions"></div>\n'
                '</aside>\n\n'

            )
            total_existing_count = len(all_existing_paths)
            total_existing_size = sum(
                os.path.getsize(p) for p in all_existing_paths
            )
            total_size_str = _human_size(total_existing_size)
            group_filter_options = "".join(
                f'<option value="{group_index}">'
                f'{html.escape(title.replace("**", "").replace("_", ""), quote=True)}</option>'
                for group_index, (title, _) in enumerate(groups)
            )
            type_filter_options = "".join(
                f'<option value="{html.escape(ext, quote=True)}">'
                f'{html.escape(ext, quote=True)}</option>'
                for ext in sorted(
                    {
                        (os.path.splitext(path)[1].lower() or "none")
                        for _, items in groups
                        for _, path in items
                    }
                )
            )
            fh.write(
                f'<p><strong>{total_existing_count} file'
                f'{"s" if total_existing_count != 1 else ""}</strong>, '
                f'<strong>{total_size_str}</strong> total</p>\n\n'
                '<p><label for="artifact-sort">Sort by:</label> '
                '<select id="artifact-sort" class="artifact-sort" '
                'onchange="sortArtifactGroups()">'
                '<option value="original">Original order</option>'
                '<option value="name">Name</option>'
                '<option value="count">File count</option>'
                '<option value="size">Total size</option>'
                '</select> '
                '<button type="button" id="artifact-sort-dir" '
                'class="artifact-sort-dir" onclick="toggleSortDirection()" '
                'aria-label="Toggle sort direction">Asc</button></p>\n\n'
                '<p><label for="artifact-item-sort">Sort items by:</label> '
                '<select id="artifact-item-sort" class="artifact-item-sort" '
                'onchange="sortArtifactItems()">'
                '<option value="original">Original order</option>'
                '<option value="filename">Filename</option>'
                '<option value="group">Group</option>'
                '<option value="type">Type</option>'
                '<option value="mtime">Last updated</option>'
                '</select> '
                '<button type="button" id="artifact-item-sort-dir" '
                'class="artifact-item-sort-dir" onclick="toggleItemSortDirection()" '
                'aria-label="Toggle item sort direction">Asc</button></p>\n\n'

                '<p><label for="artifact-filter">Show:</label> '
                '<select id="artifact-filter" class="artifact-filter" '
                'onchange="filterArtifactItems()">'
                '<option value="all">All</option>'
                '<option value="existing">Only existing</option>'
                '<option value="missing">Only missing</option>'
                '</select></p>\n\n'
                '<p><label for="artifact-group-filter">Group:</label> '
                '<select id="artifact-group-filter" class="artifact-group-filter" '
                'onchange="filterArtifactItems()">'
                '<option value="all">All groups</option>'
                f'{group_filter_options}'
                '</select></p>\n\n'
                '<p><label for="artifact-type-filter">Type:</label> '
                '<select id="artifact-type-filter" class="artifact-type-filter" '
                'onchange="filterArtifactItems()">'
                '<option value="all">All types</option>'
                f'{type_filter_options}'
                '</select></p>\n\n'
                + (
                    '<p><label for="artifact-url-toggle">'
                    '<input type="checkbox" id="artifact-url-toggle" class="artifact-url-toggle" '
                    'role="switch" aria-checked="false" '
                    'aria-describedby="artifact-url-toggle-desc" '
                    'onchange="updateArtifactUrlMode()"> '
                    'Copy absolute URLs</label> '
                    '(<span class="artifact-url-mode">file paths</span>)'
                    '<span id="artifact-url-toggle-desc" class="visually-hidden"> '
                    'When enabled, copied links use the full site URL instead of relative file paths.</span></p>\n\n'
                    if ARTIFACT_BASE_URL else ""
                )
                + '<script>'
                'function showCopyToast(message) { '
                'const live = document.getElementById("artifact-copy-live"); '
                'if (live) { live.textContent = message; setTimeout(() => { live.textContent = ""; }, 1000); } '
                'const t = document.createElement("div"); '
                't.textContent = message; '
                'const isSmall = window.innerWidth <= 480; '
                'const position = isSmall ? "top:16px;" : "bottom:max(16px,env(safe-area-inset-bottom));"; '
                't.style.cssText = "position:fixed;" + position + "left:50%;transform:translateX(-50%);max-width:calc(100vw - 32px);width:max-content;background:#1f2937;color:#fff;padding:10px 14px;border-radius:6px;z-index:9999;font-family:sans-serif;font-size:14px;line-height:1.4;box-shadow:0 4px 12px rgba(0,0,0,0.25);pointer-events:none;"; '
                'document.body.appendChild(t); '
                'setTimeout(() => t.remove(), 2000); '
                '} '
                'function artifactDownload(href) { '
                'const a = document.createElement("a"); '
                'a.href = href; '
                'a.download = href; '
                'a.style.display = "none"; '
                'document.body.appendChild(a); '
                'a.click(); '
                'a.remove(); '
                '} '
                'function artifactDownloadWithToast(href, label) { '
                'artifactDownload(href); '
                'showCopyToast("Downloading " + (label || href.split("/").pop() || "file")); '
                '} '
                 'function persistArtifactSort(key, dir) { '
                 'try { localStorage.setItem("artifactSort", key); localStorage.setItem("artifactSortDir", dir); } catch (e) {} '
                 'try { const url = new URL(window.location.href); '
                 'if (key && key !== "original") { url.searchParams.set("sort", key); } else { url.searchParams.delete("sort"); } '
                 'if (dir && dir !== "asc") { url.searchParams.set("dir", dir); } else { url.searchParams.delete("dir"); } '
                 'window.history.replaceState({}, "", url); } catch (e) {} '
                 '} '
                 'function sortArtifactGroups() { '
                 'const key = document.getElementById("artifact-sort").value; '
                 'const dirBtn = document.getElementById("artifact-sort-dir"); '
                 'const dir = dirBtn.dataset.dir || "asc"; '
                 'const container = document.querySelector(".artifact-index"); '
                 'const groups = Array.from(container.querySelectorAll(".artifact-group")); '
                 'if (key === "original") { '
                 'groups.sort((a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index)); '
                 '} else { '
                 'groups.sort((a, b) => { '
                 'let cmp = 0; '
                 'if (key === "name") cmp = a.dataset.name.localeCompare(b.dataset.name); '
                 'else if (key === "count") cmp = parseInt(a.dataset.count) - parseInt(b.dataset.count); '
                 'else if (key === "size") cmp = parseInt(a.dataset.size) - parseInt(b.dataset.size); '
                 'return dir === "asc" ? cmp : -cmp; '
                 '}); '
                 '} '
                 'groups.forEach(g => container.appendChild(g)); '
                 'persistArtifactSort(key, dir); '
                 '} '
                 'function toggleSortDirection() { '
                 'const btn = document.getElementById("artifact-sort-dir"); '
                 'const current = btn.dataset.dir || "asc"; '
                 'const next = current === "asc" ? "desc" : "asc"; '
                 'btn.dataset.dir = next; '
                 'btn.textContent = next === "asc" ? "Asc" : "Desc"; '
                 'sortArtifactGroups(); '
                 '} '
                 'function restoreArtifactSort() { '
                 'const sel = document.getElementById("artifact-sort"); '
                 'const btn = document.getElementById("artifact-sort-dir"); '
                 'if (!sel || !btn) return; '
                 'let key = null, dir = null; '
                 'try { const params = new URLSearchParams(window.location.search); '
                 'key = params.get("sort"); dir = params.get("dir"); } catch (e) {} '
                 'try { if (!key) key = localStorage.getItem("artifactSort"); '
                 'if (!dir) dir = localStorage.getItem("artifactSortDir"); } catch (e) {} '
                 'const validKeys = ["original", "name", "count", "size"]; '
                 'if (key && validKeys.indexOf(key) !== -1) sel.value = key; '
                 'if (dir === "asc" || dir === "desc") { btn.dataset.dir = dir; btn.textContent = dir === "asc" ? "Asc" : "Desc"; } '
                 'if ((key && validKeys.indexOf(key) !== -1) || dir === "asc" || dir === "desc") sortArtifactGroups(); '
                 '} '
                 'if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", restoreArtifactSort); } else { restoreArtifactSort(); } '
                 'function persistArtifactItemSort(key, dir) { '
                 'try { localStorage.setItem("artifactItemSort", key); localStorage.setItem("artifactItemSortDir", dir); } catch (e) {} '
                 'try { const url = new URL(window.location.href); '
                 'if (key && key !== "original") { url.searchParams.set("isort", key); } else { url.searchParams.delete("isort"); } '
                 'if (dir && dir !== "asc") { url.searchParams.set("idir", dir); } else { url.searchParams.delete("idir"); } '
                 'window.history.replaceState({}, "", url); } catch (e) {} '
                 '} '
                 'function sortArtifactItems() { '
                 'const sel = document.getElementById("artifact-item-sort"); '
                 'const btn = document.getElementById("artifact-item-sort-dir"); '
                 'if (!sel || !btn) return; '
                 'const key = sel.value; '
                 'const dir = btn.dataset.dir || "asc"; '
                 'const container = document.querySelector(".artifact-index"); '
                 'container.querySelectorAll(".artifact-group").forEach(g => { '
                 'const items = Array.from(g.querySelectorAll(".artifact-item")); '
                 'items.sort((a, b) => { '
                 'let cmp = 0; '
                 'if (key === "original") { cmp = (a.dataset.originalIndex || "").localeCompare(b.dataset.originalIndex || ""); } '
                 'else if (key === "filename") { cmp = (a.dataset.filename || "").localeCompare(b.dataset.filename || "", undefined, {numeric: true, sensitivity: "base"}); } '
                 'else if (key === "group") { cmp = (a.dataset.groupName || "").localeCompare(b.dataset.groupName || "") || (a.dataset.originalIndex || "").localeCompare(b.dataset.originalIndex || ""); } '
                 'else if (key === "type") { cmp = (a.dataset.type || "").localeCompare(b.dataset.type || "") || (a.dataset.filename || "").localeCompare(b.dataset.filename || ""); } '
                 'else if (key === "mtime") { cmp = (parseInt(a.dataset.mtime || "0", 10)) - (parseInt(b.dataset.mtime || "0", 10)); } '
                 'return dir === "asc" ? cmp : -cmp; '
                 '}); '
                 'items.forEach(el => g.appendChild(el)); '
                 '}); '
                 'persistArtifactItemSort(key, dir); '
                 '} '
                 'function toggleItemSortDirection() { '
                 'const btn = document.getElementById("artifact-item-sort-dir"); '
                 'const current = btn.dataset.dir || "asc"; '
                 'const next = current === "asc" ? "desc" : "asc"; '
                 'btn.dataset.dir = next; '
                 'btn.textContent = next === "asc" ? "Asc" : "Desc"; '
                 'sortArtifactItems(); '
                 '} '
                 'function restoreArtifactItemSort() { '
                 'const sel = document.getElementById("artifact-item-sort"); '
                 'const btn = document.getElementById("artifact-item-sort-dir"); '
                 'if (!sel || !btn) return; '
                 'let key = null, dir = null; '
                 'try { const params = new URLSearchParams(window.location.search); '
                 'key = params.get("isort"); dir = params.get("idir"); } catch (e) {} '
                 'try { if (!key) key = localStorage.getItem("artifactItemSort"); '
                 'if (!dir) dir = localStorage.getItem("artifactItemSortDir"); } catch (e) {} '
                 'const validKeys = ["original", "filename", "group", "type", "mtime"]; '
                 'if (key && validKeys.indexOf(key) !== -1) sel.value = key; '
                 'if (dir === "asc" || dir === "desc") { btn.dataset.dir = dir; btn.textContent = dir === "asc" ? "Asc" : "Desc"; } '
                 'if ((key && validKeys.indexOf(key) !== -1) || dir === "asc" || dir === "desc") sortArtifactItems(); '
                 '} '
                 'if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", restoreArtifactItemSort); } else { restoreArtifactItemSort(); } '



                'function filterArtifactItems() { '
                'const mode = document.getElementById("artifact-filter").value; '
                'const group = document.getElementById("artifact-group-filter").value; '
                'const type = document.getElementById("artifact-type-filter").value; '
                'const q = document.querySelector(".artifact-search").value.toLowerCase(); '
                'const container = document.querySelector(".artifact-index"); '
                'container.querySelectorAll(".artifact-group").forEach(g => { '
                'let visible = 0; '
                'const matchesGroup = group === "all" || g.dataset.index === group; '
                'g.querySelectorAll(".artifact-item").forEach(el => { '
                'const label = (el.dataset.label || "").toLowerCase(); '
                'const path = (el.dataset.path || "").toLowerCase(); '
                'const itemType = (el.dataset.type || "").toLowerCase(); '
                'const matchesSearch = !q || label.includes(q) || path.includes(q) || el.textContent.toLowerCase().includes(q); '
                'const matchesMode = mode === "all" || (mode === "existing" && el.dataset.existing === "true") || (mode === "missing" && el.dataset.existing === "false"); '
                'const matchesType = type === "all" || itemType === type; '
                'const show = matchesGroup && matchesSearch && matchesMode && matchesType; '
                'el.style.display = show ? "" : "none"; '
                'if (show) visible++; '
                '}); '
                'g.style.display = visible > 0 ? "" : "none"; '
                 '}); '
                 'persistArtifactFilters(); '
                  '} '
                  'let _artifactRestoring = false; '
                  'function persistArtifactFilters() { '
                  'if (typeof _artifactRestoring !== "undefined" && _artifactRestoring) return; '
                  'try { '
                 'const mode = document.getElementById("artifact-filter"); '
                 'const group = document.getElementById("artifact-group-filter"); '
                 'const type = document.getElementById("artifact-type-filter"); '
                 'const search = document.querySelector(".artifact-search"); '
                 'const abs = document.getElementById("artifact-url-toggle"); '
                 'const url = new URL(window.location.href); '
                 'const setOrDelete = (k, v, def) => { if (v && v !== def) url.searchParams.set(k, v); else url.searchParams.delete(k); }; '
                 'setOrDelete("filter", mode ? mode.value : "", "all"); '
                 'setOrDelete("group", group ? group.value : "", "all"); '
                 'setOrDelete("type", type ? type.value : "", "all"); '
                 'setOrDelete("q", search ? search.value : "", ""); '
                  'if (abs && abs.checked) url.searchParams.set("abs", "1"); else url.searchParams.delete("abs"); '
                  'const delimSel = document.getElementById("artifact-csv-delimiter"); '
                  'if (delimSel) { if (delimSel.value === ";") url.searchParams.set("csvdelim", ";"); else url.searchParams.delete("csvdelim"); } '
                 'window.history.replaceState({}, "", url); '
                 'try { '
                 'if (mode) localStorage.setItem("artifactFilter", mode.value); '
                 'if (group) localStorage.setItem("artifactGroupFilter", group.value); '
                 'if (type) localStorage.setItem("artifactTypeFilter", type.value); '
                 'if (search) localStorage.setItem("artifactSearch", search.value); '
                  'if (abs) localStorage.setItem("artifactAbsUrl", abs.checked ? "1" : "0"); '
                  'if (delimSel) localStorage.setItem("artifactCsvDelim", delimSel.value); '
                 '} catch (e) {} '
                 '} catch (e) {} '
                 '} '
                  'function restoreArtifactFilters() { '
                  '_artifactRestoring = true; '
                  'try { '
                 'const mode = document.getElementById("artifact-filter"); '
                 'const group = document.getElementById("artifact-group-filter"); '
                 'const type = document.getElementById("artifact-type-filter"); '
                 'const search = document.querySelector(".artifact-search"); '
                 'const abs = document.getElementById("artifact-url-toggle"); '
                 'let params = null; '
                 'try { params = new URLSearchParams(window.location.search); } catch (e) {} '
                 'const readFor = (paramKey, storageKey) => { '
                 'let v = null; if (params) v = params.get(paramKey); '
                 'if (v === null) { try { v = localStorage.getItem(storageKey); } catch (e) {} } '
                 'return v; '
                 '}; '
                 'const setSel = (el, v) => { if (!el || v === null || v === undefined) return; '
                 'const opt = Array.from(el.options).find(o => o.value === v); '
                 'if (opt) el.value = v; '
                 '}; '
                 'setSel(mode, readFor("filter", "artifactFilter")); '
                 'setSel(group, readFor("group", "artifactGroupFilter")); '
                 'setSel(type, readFor("type", "artifactTypeFilter")); '
                 'const q = readFor("q", "artifactSearch"); '
                 'if (search && q !== null) search.value = q; '
                  'const absVal = readFor("abs", "artifactAbsUrl"); '
                  'if (abs && absVal !== null) { '
                  'abs.checked = absVal === "1" || absVal === "true"; '
                  'abs.setAttribute("aria-checked", abs.checked ? "true" : "false"); '
                  'document.querySelectorAll(".artifact-url-mode").forEach(el => { el.textContent = abs.checked ? "absolute URLs" : "file paths"; }); '
                   '} '
                   'const delimSel = document.getElementById("artifact-csv-delimiter"); '
                   'const delimVal = readFor("csvdelim", "artifactCsvDelim"); '
                   'if (delimSel && delimVal !== null) { setSel(delimSel, delimVal); } '
                   'if (typeof filterArtifactItems === "function") filterArtifactItems(); '
                  '} catch (e) {} finally { _artifactRestoring = false; } '
                  '} '
                 'if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", restoreArtifactFilters); } else { restoreArtifactFilters(); } '
                  'function updateArtifactUrlMode() { '
                  'const toggle = document.getElementById("artifact-url-toggle"); '
                  'if (toggle) { '
                  'const state = toggle.checked ? "true" : "false"; '
                  'toggle.setAttribute("aria-checked", state); '
                  'document.querySelectorAll(".artifact-url-mode").forEach(el => { '
                  'el.textContent = toggle.checked ? "absolute URLs" : "file paths"; '
                  '}); '
                  '} '
                  'persistArtifactFilters(); '
                  '} '

                'function copyDisplayedArtifactLinks() { '
                'const useUrl = document.getElementById("artifact-url-toggle") && document.getElementById("artifact-url-toggle").checked; '
                'const container = document.querySelector(".artifact-index"); '
                'const visible = Array.from(container.querySelectorAll(".artifact-item")).filter(el => el.style.display !== "none"); '
                'const paths = visible.map(el => useUrl && el.dataset.url ? el.dataset.url : el.dataset.path).filter(Boolean); '
                'if (paths.length === 0) { showCopyToast("No visible artifact links — adjust filters or select items"); return; } '
                'navigator.clipboard.writeText(paths.join("\\n")).then(() => { '
                'showCopyToast("Copied " + paths.length + " link" + (paths.length === 1 ? "" : "s")); '
                '}).catch(() => { showCopyToast("Could not copy — check clipboard permissions"); }); '
                '} '
                'function pickArtifactCsvPayload(btn) { '
                'const useUrl = document.getElementById("artifact-url-toggle") && document.getElementById("artifact-url-toggle").checked; '
                'const delimSel = document.getElementById("artifact-csv-delimiter"); '
                'const useSemi = delimSel && delimSel.value === ";"; '
                'let key; '
                'if (useUrl && useSemi && btn.dataset.csvUrlSemi) key = "csvUrlSemi"; '
                'else if (useUrl && btn.dataset.csvUrl) key = "csvUrl"; '
                'else if (useSemi && btn.dataset.csvSemi) key = "csvSemi"; '
                'else key = "csv"; '
                'return btn.dataset[key] || ""; '
                '} '
                'function downloadArtifactCsv(btn) { '
                'const raw = pickArtifactCsvPayload(btn); '
                'if (!raw) return; '
                'const csv = raw.replace(/\\r?\\n/g, "\\r\\n"); '
                'const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); '
                'const url = URL.createObjectURL(blob); '
                'const a = document.createElement("a"); '
                'a.href = url; '
                'a.download = btn.dataset.filename || "artifact-links.csv"; '
                'document.body.appendChild(a); a.click(); a.remove(); '
                'setTimeout(() => URL.revokeObjectURL(url), 1000); '
                'const n = parseInt(btn.dataset.count || "0", 10); '
                'showCopyToast("Downloaded " + n + " link" + (n === 1 ? "" : "s") + " as CSV"); '
                '} '
                'function getSelectedArtifactItems() { '
                'const container = document.querySelector(".artifact-index"); '
                'return Array.from(container.querySelectorAll(".artifact-select:checked")) '
                '.map(cb => cb.closest(".artifact-item")) '
                '.filter(el => el && el.dataset.existing === "true"); '
                '} '
                'function selectAllVisibleArtifacts(checked) { '
                'const container = document.querySelector(".artifact-index"); '
                'container.querySelectorAll(".artifact-item").forEach(el => { '
                'if (el.style.display === "none") return; '
                'const cb = el.querySelector(".artifact-select"); '
                'if (cb) cb.checked = checked; '
                '}); '
                'updateSelectionCount(); saveArtifactSelection(); '
                '} '
                'function selectAllArtifacts(checked) { '
                'const container = document.querySelector(".artifact-index"); '
                'if (!container) return; '
                'let n = 0; '
                'container.querySelectorAll(".artifact-item").forEach(el => { '
                'if (el.dataset.existing !== "true") return; '
                'const cb = el.querySelector(".artifact-select"); '
                'if (cb) { cb.checked = checked; n++; } '
                '}); '
                'updateSelectionCount(); saveArtifactSelection(); '
                'showCopyToast((checked ? "Selected " : "Deselected ") + n + " result" + (n === 1 ? "" : "s") + " across all pages"); '
                '} '
                'function clearArtifactSelection() { '
                'document.querySelectorAll(".artifact-select").forEach(cb => { cb.checked = false; }); '
                'updateSelectionCount(); '
                'try { localStorage.removeItem(ARTIFACT_SELECTION_KEY); } catch (e) {} '
                '} '
                'var ARTIFACT_LAST_OPENED_KEY = "preflight.artifact.lastOpened.v1"; '
                'function saveLastOpenedArtifact(path) { '
                'try { if (path) localStorage.setItem(ARTIFACT_LAST_OPENED_KEY, path); } catch (e) {} '
                '} '
                'function loadLastOpenedArtifact() { '
                'try { return localStorage.getItem(ARTIFACT_LAST_OPENED_KEY) || ""; } catch (e) { return ""; } '
                '} '
                'function clearLastOpenedArtifact() { '
                'try { localStorage.removeItem(ARTIFACT_LAST_OPENED_KEY); } catch (e) {} '
                '} '
                'var ARTIFACT_SELECTION_KEY = "preflight.artifact.selection.v1"; '
                'function loadStoredArtifactSelection() { '
                'try { const raw = localStorage.getItem(ARTIFACT_SELECTION_KEY); '
                'if (!raw) return new Set(); '
                'const arr = JSON.parse(raw); '
                'return new Set(Array.isArray(arr) ? arr : []); '
                '} catch (e) { return new Set(); } '
                '} '
                'function saveArtifactSelection() { '
                'try { '
                'const keys = Array.from(document.querySelectorAll(".artifact-item")) '
                '.filter(el => { const cb = el.querySelector(".artifact-select"); return cb && cb.checked; }) '
                '.map(el => el.dataset.path || el.dataset.filename || "") '
                '.filter(Boolean); '
                'localStorage.setItem(ARTIFACT_SELECTION_KEY, JSON.stringify(keys)); '
                '} catch (e) {} '
                '} '
                'function restoreArtifactSelection() { '
                'const stored = loadStoredArtifactSelection(); '
                'if (!stored.size) { updateSelectionCount(); return; } '
                'let restored = 0, missing = 0; '
                'const seen = new Set(); '
                'document.querySelectorAll(".artifact-item").forEach(el => { '
                'const key = el.dataset.path || el.dataset.filename || ""; '
                'if (!key) return; '
                'if (stored.has(key) && el.dataset.existing === "true") { '
                'const cb = el.querySelector(".artifact-select"); '
                'if (cb) { cb.checked = true; restored++; seen.add(key); } '
                '} '
                '}); '
                'stored.forEach(k => { if (!seen.has(k)) missing++; }); '
                'updateSelectionCount(); '
                'if (missing > 0) { '
                'try { localStorage.setItem(ARTIFACT_SELECTION_KEY, JSON.stringify(Array.from(seen))); } catch (e) {} '
                '} '
                'if (restored > 0) { showCopyToast("Restored " + restored + " previously selected artifact" + (restored === 1 ? "" : "s")); } '
                '} '
                'if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", restoreArtifactSelection); } else { restoreArtifactSelection(); } '
                'function updateSelectionCount() { '
                'const n = document.querySelectorAll(".artifact-select:checked").length; '
                'const total = document.querySelectorAll(".artifact-item[data-existing=\\"true\\"] .artifact-select").length; '
                'const text = total > 0 ? (n + " of " + total + " artifact" + (total === 1 ? "" : "s") + " selected") : (n + " selected"); '
                'document.querySelectorAll(".artifact-selection-count").forEach(el => { el.textContent = text; }); '
                '} '
                'function copySelectedArtifacts(format) { '
                'const useUrl = document.getElementById("artifact-url-toggle") && document.getElementById("artifact-url-toggle").checked; '
                'const items = getSelectedArtifactItems(); '
                'if (items.length === 0) { showCopyToast("No artifacts selected — select items first, then copy"); return; } '
                'const rows = items.map(el => ({ '
                'label: el.dataset.label || "", '
                'path: (useUrl && el.dataset.url) ? el.dataset.url : (el.dataset.path || "") '
                '})); '
                'let payload = ""; '
                'if (format === "markdown") { '
                'payload = rows.map(r => "- [" + r.label + "](" + r.path + ")").join("\\n"); '
                '} else if (format === "json") { '
                'payload = JSON.stringify(rows, null, 2); '
                '} else if (format === "csv") { '
                'const delimSel = document.getElementById("artifact-csv-delimiter"); '
                'const delim = (delimSel && delimSel.value === ";") ? ";" : ","; '
                'const esc = v => { const s = String(v == null ? "" : v); return /[",\\n\\r]/.test(s) ? "\\"" + s.replace(/"/g, "\\"\\"") + "\\"" : s; }; '
                'payload = "label" + delim + "path\\r\\n" + rows.map(r => esc(r.label) + delim + esc(r.path)).join("\\r\\n") + "\\r\\n"; '
                '} else { return; } '
                'navigator.clipboard.writeText(payload).then(() => { '
                'showCopyToast("Copied " + rows.length + " selected artifact" + (rows.length === 1 ? "" : "s") + " as " + format.toUpperCase()); '
                '}).catch(() => { showCopyToast("Could not copy — check clipboard permissions"); }); '
                '} '
                'document.addEventListener("change", function(e) { '
                'if (e.target && e.target.classList && e.target.classList.contains("artifact-select")) { updateSelectionCount(); saveArtifactSelection(); } '
                '}); '
                'var _artifactLastCheckbox = null; '
                'document.addEventListener("click", function(e) { '
                'const cb = e.target && e.target.classList && e.target.classList.contains("artifact-select") ? e.target : null; '
                'if (!cb) return; '
                'const all = Array.from(document.querySelectorAll(".artifact-item[data-existing=\\"true\\"] .artifact-select")); '
                'if (e.shiftKey && _artifactLastCheckbox && all.includes(_artifactLastCheckbox) && _artifactLastCheckbox !== cb) { '
                'const a = all.indexOf(_artifactLastCheckbox), b = all.indexOf(cb); '
                'const [lo, hi] = a < b ? [a, b] : [b, a]; '
                'const state = cb.checked; '
                'for (let i = lo; i <= hi; i++) { all[i].checked = state; } '
                'updateSelectionCount(); saveArtifactSelection(); '
                'showCopyToast((state ? "Selected " : "Deselected ") + (hi - lo + 1) + " artifact" + (hi - lo === 0 ? "" : "s") + " in range"); '
                '} '
                '_artifactLastCheckbox = cb; '
                '}, true); '
                'document.addEventListener("keydown", function(e) { '
                'const inIndex = e.target && e.target.closest && e.target.closest(".artifact-index"); '
                'if (!inIndex) return; '
                'const isTypingField = /^(input|textarea|select)$/i.test(e.target.tagName) && e.target.type !== "checkbox"; '
                'if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A") && !isTypingField) { '
                'e.preventDefault(); selectAllVisibleArtifacts(true); '
                '} else if (e.key === "Escape" && !isTypingField) { '
                'if (document.querySelectorAll(".artifact-select:checked").length > 0) { e.preventDefault(); clearArtifactSelection(); showCopyToast("Selection cleared"); } '
                '} '
                '}); '
                'function downloadBlobPayload(filename, mime, payload) { '
                'const blob = new Blob([payload], {type: mime}); '
                'const url = URL.createObjectURL(blob); '
                'const a = document.createElement("a"); '
                'a.href = url; a.download = filename; a.style.display = "none"; '
                'document.body.appendChild(a); a.click(); a.remove(); '
                'setTimeout(() => URL.revokeObjectURL(url), 1000); '
                '} '
                'function exportSelectedManifest(format) { '
                'const useUrl = document.getElementById("artifact-url-toggle") && document.getElementById("artifact-url-toggle").checked; '
                'const items = getSelectedArtifactItems(); '
                'if (items.length === 0) { showCopyToast("No artifacts selected — select items first, then export"); return; } '
                'const rows = items.map(el => ({ '
                'group: el.dataset.groupName || "", '
                'label: el.dataset.label || "", '
                'filename: el.dataset.filename || "", '
                'path: (useUrl && el.dataset.url) ? el.dataset.url : (el.dataset.path || ""), '
                'type: el.dataset.type || "", '
                'mtime: parseInt(el.dataset.mtime || "0", 10) '
                '})); '
                'if (format === "json") { '
                'downloadBlobPayload("artifacts_selection.json", "application/json", JSON.stringify(rows, null, 2)); '
                '} else { '
                'const delimSel = document.getElementById("artifact-csv-delimiter"); '
                'const delim = (delimSel && delimSel.value === ";") ? ";" : ","; '
                'const esc = v => { const s = String(v == null ? "" : v); return /[",\\n\\r]/.test(s) ? "\\"" + s.replace(/"/g, "\\"\\"") + "\\"" : s; }; '
                'const header = ["group","label","filename","path","type","mtime"]; '
                'const body = rows.map(r => header.map(k => esc(r[k])).join(delim)).join("\\r\\n"); '
                'downloadBlobPayload("artifacts_selection.csv", "text/csv", header.join(delim) + "\\r\\n" + body + "\\r\\n"); '
                '} '
                'showCopyToast("Exported " + rows.length + " selected item" + (rows.length === 1 ? "" : "s") + " as " + format.toUpperCase()); '
                '} '
                'function downloadSelectedArtifacts() { '
                'const items = getSelectedArtifactItems(); '
                'if (items.length === 0) { showCopyToast("No artifacts selected — select items first, then download"); return; } '
                'let i = 0; '
                'items.forEach(el => { '
                'const href = el.dataset.path; '
                'if (!href) return; '
                'setTimeout(() => artifactDownload(href), i * 250); '
                'i++; '
                '}); '
                'showCopyToast("Downloading " + items.length + " file" + (items.length === 1 ? "" : "s")); '
                '} '
                'function formatMtime(ts) { '
                'if (!ts) return ""; '
                'try { return new Date(ts * 1000).toLocaleString(); } catch (e) { return String(ts); } '
                '} '
                'function formatSize(bytes) { '
                'const n = parseInt(bytes || "0", 10); if (!n) return "0 B"; '
                'if (n < 1024) return n + " B"; '
                'if (n < 1048576) return (n/1024).toFixed(1) + " KB"; '
                'if (n < 1073741824) return (n/1048576).toFixed(1) + " MB"; '
                'return (n/1073741824).toFixed(1) + " GB"; '
                '} '
                'let _artifactDrawerPrevFocus = null; '
                'function openArtifactDrawer(el) { '
                'if (!el) return; '
                'const drawer = document.getElementById("artifact-drawer"); '
                'const backdrop = document.getElementById("artifact-drawer-backdrop"); '
                'const title = document.getElementById("artifact-drawer-title"); '
                'const meta = document.getElementById("artifact-drawer-meta"); '
                'const actions = document.getElementById("artifact-drawer-actions"); '
                'if (!drawer || !meta) return; '
                'document.querySelectorAll(".artifact-item.is-active").forEach(x => x.classList.remove("is-active")); '
                'el.classList.add("is-active"); '
                'const label = el.dataset.label || el.dataset.filename || "Artifact"; '
                'const path = el.dataset.path || ""; '
                'saveLastOpenedArtifact(path); '
                'const filename = el.dataset.filename || ""; '
                'const group = el.dataset.groupName || ""; '
                'const type = el.dataset.type || ""; '
                'const existing = el.dataset.existing === "true"; '
                'const url = el.dataset.url || ""; '
                'const size = existing ? formatSize(el.dataset.mtime ? undefined : undefined) : ""; '
                'title.textContent = label; '
                'const rows = [ '
                '["Label", label], '
                '["Filename", filename], '
                '["Group", group], '
                '["Type", type], '
                '["Path", path], '
                '["Last updated", formatMtime(parseInt(el.dataset.mtime || "0", 10))], '
                '["Status", existing ? "Available" : "Missing"] '
                ']; '
                'if (url) rows.push(["Absolute URL", url]); '
                'meta.innerHTML = rows.filter(r => r[1]).map(r => '
                '"<dt>" + r[0] + "</dt><dd>" + String(r[1]).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") + "</dd>" '
                ').join(""); '
                'actions.innerHTML = ""; '
                'if (existing && path) { '
                'const open = document.createElement("a"); '
                'open.href = path; open.target = "_blank"; open.rel = "noopener noreferrer"; '
                'open.innerHTML = "<button type=\\"button\\">Open</button>"; '
                'actions.appendChild(open); '
                'const dl = document.createElement("button"); '
                'dl.type = "button"; dl.textContent = "Download"; '
                'dl.onclick = () => { artifactDownload(path); showCopyToast("Downloading " + (label || path.split("/").pop() || "file")); }; '
                'actions.appendChild(dl); '
                'const cp = document.createElement("button"); '
                'cp.type = "button"; cp.textContent = "Copy link"; '
                'cp.onclick = () => { '
                'const useUrl = document.getElementById("artifact-url-toggle") && document.getElementById("artifact-url-toggle").checked; '
                'const val = (useUrl && url) ? url : path; '
                'navigator.clipboard.writeText(val).then(() => showCopyToast("Copied link" + (label ? " for " + label : ""))).catch(() => showCopyToast("Could not copy — check clipboard permissions")); '
                '}; '
                'actions.appendChild(cp); '
                'const share = document.createElement("button"); '
                'share.type = "button"; share.textContent = "Copy share link"; '
                'share.onclick = () => { '
                'const shareUrl = new URL(window.location.href); '
                'shareUrl.searchParams.set("preview", path); '
                'navigator.clipboard.writeText(shareUrl.toString()).then(() => showCopyToast("Copied share link")).catch(() => showCopyToast("Could not copy — check clipboard permissions")); '
                '}; '
                'actions.appendChild(share); '
                '} '
                '_artifactDrawerPrevFocus = document.activeElement; '
                'backdrop.classList.add("is-open"); '
                'drawer.classList.add("is-open"); '
                'setTimeout(() => { const f = _artifactDrawerFocusables(); (f[0] || drawer).focus(); }, 0); '
                '} '
                'function _artifactDrawerFocusables() { '
                'const drawer = document.getElementById("artifact-drawer"); '
                'if (!drawer) return []; '
                'const sel = \'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])\'; '
                'return Array.from(drawer.querySelectorAll(sel)).filter(el => !el.hasAttribute("disabled") && el.getClientRects().length > 0); '
                '} '
                'function closeArtifactDrawer() { '
                'const drawer = document.getElementById("artifact-drawer"); '
                'const backdrop = document.getElementById("artifact-drawer-backdrop"); '
                'if (drawer) drawer.classList.remove("is-open"); '
                'if (backdrop) backdrop.classList.remove("is-open"); '
                'document.querySelectorAll(".artifact-item.is-active").forEach(x => x.classList.remove("is-active")); '
                'clearLastOpenedArtifact(); '
                'if (_artifactDrawerPrevFocus && _artifactDrawerPrevFocus.focus) { try { _artifactDrawerPrevFocus.focus(); } catch (e) {} } '
                '} '
                'function _isArtifactDrawerOpen() { const d = document.getElementById("artifact-drawer"); return !!(d && d.classList.contains("is-open")); } '
                'document.addEventListener("keydown", function(e) { '
                'if (!_isArtifactDrawerOpen()) return; '
                'if (e.key === "Escape") { e.preventDefault(); closeArtifactDrawer(); return; } '
                'if (e.key === "Tab") { '
                'const f = _artifactDrawerFocusables(); '
                'if (!f.length) { e.preventDefault(); const d = document.getElementById("artifact-drawer"); if (d) d.focus(); return; } '
                'const first = f[0], last = f[f.length - 1]; '
                'const active = document.activeElement; '
                'const drawer = document.getElementById("artifact-drawer"); '
                'if (drawer && !drawer.contains(active)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; } '
                'if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); } '
                'else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); } '
                'return; '
                '} '
                'if ((e.key === "Enter" || e.key === " " || e.key === "Spacebar") && e.target && e.target.tagName === "BUTTON") { '
                'e.preventDefault(); e.target.click(); '
                '} '
                '}); '
                'document.addEventListener("click", function(e) { '
                'const item = e.target.closest && e.target.closest(".artifact-item"); '
                'if (!item) return; '
                'if (e.target.closest("a, button, input, label, select, textarea")) return; '
                'openArtifactDrawer(item); '
                '}); '
                'function _openArtifactDrawerItem(item) { '
                'const mode = document.getElementById("artifact-filter"); '
                'const group = document.getElementById("artifact-group-filter"); '
                'const type = document.getElementById("artifact-type-filter"); '
                'const search = document.querySelector(".artifact-search"); '
                'if (mode) mode.value = "all"; '
                'if (group) group.value = "all"; '
                'if (type) type.value = "all"; '
                'if (search) search.value = ""; '
                'filterArtifactItems(); '
                'openArtifactDrawer(item); '
                'setTimeout(() => item.scrollIntoView({ behavior: "smooth", block: "center" }), 100); '
                '} '
                'function openArtifactDrawerFromUrl() { '
                'try { '
                'const params = new URLSearchParams(window.location.search); '
                'const preview = params.get("preview"); '
                'if (preview) { '
                'const target = decodeURIComponent(preview); '
                'const item = Array.from(document.querySelectorAll(".artifact-item")).find(el => (el.dataset.path || "") === target || (el.dataset.filename || "") === target); '
                'if (!item) { showCopyToast("Could not find artifact to preview"); return; } '
                '_openArtifactDrawerItem(item); '
                'return; '
                '} '
                'const stored = loadLastOpenedArtifact(); '
                'if (stored) { '
                'const item = Array.from(document.querySelectorAll(".artifact-item")).find(el => (el.dataset.path || "") === stored || (el.dataset.filename || "") === stored); '
                'if (item) _openArtifactDrawerItem(item); '
                'else clearLastOpenedArtifact(); '
                '} '
                '} catch (e) {} '
                '} '
                'if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", openArtifactDrawerFromUrl); } else { openArtifactDrawerFromUrl(); } '
                '</script>\n\n'

            )


            if all_paths:
                all_links = "\n".join(all_paths)
                all_links_url = "\n".join(
                    _artifact_url(path) or path for path in all_paths
                )
                all_items_json = [
                    {"label": label, "path": path}
                    for _, items in groups
                    for label, path in items
                ]
                all_items_json_url = [
                    {"label": label, "path": _artifact_url(path) or path}
                    for _, items in groups
                    for label, path in items
                ]
                json_str = json.dumps(all_items_json)
                json_url_str = json.dumps(all_items_json_url)
                csv_include_url = bool(ARTIFACT_BASE_URL) and ARTIFACT_CSV_INCLUDE_URL
                csv_columns = ["label", "path", "url"] if csv_include_url else ["label", "path"]

                def _render_csv(items_rel, items_abs, delim):
                    buf = io.StringIO()
                    w = csv.writer(buf, delimiter=delim)
                    w.writerow(csv_columns)
                    for rel_item, abs_item in zip(items_rel, items_abs):
                        if csv_include_url:
                            w.writerow([rel_item["label"], rel_item["path"], abs_item["path"]])
                        else:
                            w.writerow([rel_item["label"], rel_item["path"]])
                    return buf.getvalue()

                def _render_csv_abs(items_abs, delim):
                    buf = io.StringIO()
                    w = csv.writer(buf, delimiter=delim)
                    w.writerow(csv_columns)
                    for abs_item in items_abs:
                        if csv_include_url:
                            w.writerow([abs_item["label"], abs_item["path"], abs_item["path"]])
                        else:
                            w.writerow([abs_item["label"], abs_item["path"]])
                    return buf.getvalue()

                csv_str = _render_csv(all_items_json, all_items_json_url, ",")
                csv_url_str = _render_csv_abs(all_items_json_url, ",")
                csv_semi_str = _render_csv(all_items_json, all_items_json_url, ";")
                csv_url_semi_str = _render_csv_abs(all_items_json_url, ";")
                links_url_data_attr = (
                    f' data-links-url="{html.escape(all_links_url, quote=True)}"'
                    if ARTIFACT_BASE_URL else ""
                )
                json_url_data_attr = (
                    f' data-json-url="{html.escape(json_url_str, quote=True)}"'
                    if ARTIFACT_BASE_URL else ""
                )
                csv_url_data_attr = (
                    f' data-csv-url="{html.escape(csv_url_str, quote=True)}"'
                    f' data-csv-url-semi="{html.escape(csv_url_semi_str, quote=True)}"'
                    if ARTIFACT_BASE_URL else ""
                )
                csv_semi_data_attr = f' data-csv-semi="{html.escape(csv_semi_str, quote=True)}"'
                fh.write(
                    '<button type="button" '
                    'aria-label="Copy all artifact links" '
                    'data-context="all artifacts" '
                    f'onclick="const useUrl = document.getElementById(\'artifact-url-toggle\')?.checked; navigator.clipboard.writeText(useUrl && this.dataset.linksUrl ? this.dataset.linksUrl : this.dataset.links){_CLIPBOARD_TOAST_MULTI}" '
                    f'data-links="{html.escape(all_links, quote=True)}"{links_url_data_attr}>Copy all links</button>\n\n'
                )
                fh.write(
                    '<button type="button" '
                    'aria-label="Copy all displayed artifact links" '
                    'onclick="copyDisplayedArtifactLinks()">Copy all displayed links</button>\n\n'
                )
                fh.write(
                    '<button type="button" '
                    'aria-label="Copy all artifact paths as JSON" '
                    f'data-count="{len(all_items_json)}" '
                    f'onclick="const useUrl = document.getElementById(\'artifact-url-toggle\')?.checked; navigator.clipboard.writeText(useUrl && this.dataset.jsonUrl ? this.dataset.jsonUrl : this.dataset.json){_CLIPBOARD_TOAST_JSON}" '
                    f'data-json="{html.escape(json_str, quote=True)}"{json_url_data_attr}>Copy links (JSON)</button>\n\n'
                )
                fh.write(
                    '<label for="artifact-csv-delimiter" style="margin-right:6px;">CSV delimiter:</label>'
                    '<select id="artifact-csv-delimiter" '
                    'aria-label="CSV delimiter for Copy links (CSV) and Download CSV" '
                    'onchange="persistArtifactFilters()">'
                    '<option value=",">Comma (,)</option>'
                    '<option value=";">Semicolon (;)</option>'
                    '</select> '
                )
                fh.write(
                    '<button type="button" '
                    'aria-label="Copy all artifact links as CSV" '
                    f'data-count="{len(all_items_json)}" '
                    'onclick="const raw = pickArtifactCsvPayload(this); '
                    f'navigator.clipboard.writeText(raw.replace(/\\r?\\n/g, \'\\r\\n\')){_CLIPBOARD_TOAST_CSV}" '
                    f'data-csv="{html.escape(csv_str, quote=True)}"{csv_semi_data_attr}{csv_url_data_attr}>Copy links (CSV)</button>\n\n'
                )
                fh.write(
                    '<button type="button" '
                    'aria-label="Download all artifact links as CSV file" '
                    f'data-count="{len(all_items_json)}" '
                    'data-filename="artifact-links.csv" '
                    'onclick="downloadArtifactCsv(this)" '
                    f'data-csv="{html.escape(csv_str, quote=True)}"{csv_semi_data_attr}{csv_url_data_attr}>Download CSV</button>\n\n'
                )
                fh.write(
                    '<div class="artifact-selection-controls" role="group" '
                    'aria-label="Artifact selection actions" '
                    'aria-describedby="artifact-selection-help" '
                    'style="margin-top:8px;">\n'
                    '<strong>Selected:</strong> '
                    '<span class="artifact-selection-count" '
                    'role="status" aria-live="polite" aria-atomic="true">0 selected</span> '
                    '<span id="artifact-selection-help" class="visually-hidden">'
                    'Use Tab to move between artifacts, Space to toggle a checkbox, '
                    'Shift+Click to select a range, Ctrl or Cmd plus A to select all visible, '
                    'and Escape to clear the selection.'
                    '</span> '
                    '<button type="button" aria-label="Select all visible artifacts" '
                    'aria-keyshortcuts="Control+A Meta+A" '
                    'onclick="selectAllVisibleArtifacts(true)">Select all visible</button> '
                    '<button type="button" aria-label="Select all artifact results across every page, ignoring filters and pagination" '
                    'onclick="selectAllArtifacts(true)">Select all results</button> '
                    '<button type="button" aria-label="Clear artifact selection" '
                    'aria-keyshortcuts="Escape" '
                    'onclick="clearArtifactSelection()">Clear selection</button> '
                    '<button type="button" aria-label="Copy selected artifact links as Markdown" '
                    'onclick="copySelectedArtifacts(\'markdown\')">Copy selected (Markdown)</button> '
                    '<button type="button" aria-label="Copy selected artifact links as JSON" '
                    'onclick="copySelectedArtifacts(\'json\')">Copy selected (JSON)</button> '
                    '<button type="button" aria-label="Copy selected artifact links as CSV" '
                    'onclick="copySelectedArtifacts(\'csv\')">Copy selected (CSV)</button> '
                    '<button type="button" aria-label="Export manifest for selected artifacts as CSV" '
                    'onclick="exportSelectedManifest(\'csv\')">Export selected manifest (CSV)</button> '
                    '<button type="button" aria-label="Export manifest for selected artifacts as JSON" '
                    'onclick="exportSelectedManifest(\'json\')">Export selected manifest (JSON)</button> '
                    '<button type="button" aria-label="Download selected artifact files" '
                    'onclick="downloadSelectedArtifacts()">Download selected files</button>\n'
                    '</div>\n\n'

                )

            summary_dir = os.path.dirname(summary_path) or "."
            if all_existing_paths:
                bundle_path = os.path.join(
                    summary_dir,
                    "artifacts_bundle.zip",
                )
                try:
                    seen_arcnames: set[str] = set()
                    with _zipfile.ZipFile(
                        bundle_path, "w", _zipfile.ZIP_DEFLATED
                    ) as zf:
                        for p in all_existing_paths:
                            arc = os.path.basename(p)
                            base, ext = os.path.splitext(arc)
                            i = 1
                            while arc in seen_arcnames:
                                arc = f"{base}_{i}{ext}"
                                i += 1
                            seen_arcnames.add(arc)
                            zf.write(p, arcname=arc)
                    bundle_size_str = _human_size(
                        os.path.getsize(bundle_path)
                    )
                    bundle_href = html.escape(
                        os.path.basename(bundle_path), quote=True
                    )
                    fh.write(
                        '<button type="button" '
                        f'aria-label="Download all available artifacts as a zip archive" '
                        f'data-href="{bundle_href}" '
                        f'data-label="all artifacts" '
                        f'onclick="artifactDownloadWithToast(this.dataset.href, this.dataset.label)">'
                        f'Download all ({total_existing_count} '
                        f'file{"s" if total_existing_count != 1 else ""}, '
                        f'{bundle_size_str} zip)</button>\n\n'
                    )
                except OSError:
                    pass
                manifest_rows = []
                for title, items in groups:
                    for label, path in items:
                        if not os.path.exists(path):
                            continue
                        try:
                            size = os.path.getsize(path)
                            mtime = os.path.getmtime(path)
                        except OSError:
                            size = 0
                            mtime = 0
                        sha256 = ""
                        try:
                            h = hashlib.sha256()
                            with open(path, "rb") as _fh:
                                for chunk in iter(lambda: _fh.read(65536), b""):
                                    h.update(chunk)
                            sha256 = h.hexdigest()
                        except OSError:
                            sha256 = ""
                        manifest_rows.append(
                            {
                                "group": title,
                                "filename": os.path.basename(path),
                                "size": size,
                                "mtime": time.strftime(
                                    "%Y-%m-%d %H:%M:%S", time.localtime(mtime)
                                ) if mtime else "",
                                "sha256": sha256,
                            }
                        )
                try:
                    csv_manifest_path = os.path.join(
                        summary_dir, "artifacts_manifest.csv"
                    )
                    with open(
                        csv_manifest_path, "w", newline="", encoding="utf-8"
                    ) as f:
                        writer = csv.writer(f)
                        writer.writerow(["group", "filename", "size", "mtime", "sha256"])
                        for row in manifest_rows:
                            writer.writerow(
                                [
                                    row["group"],
                                    row["filename"],
                                    row["size"],
                                    row["mtime"],
                                    row["sha256"],
                                ]

                            )
                    json_manifest_path = os.path.join(
                        summary_dir, "artifacts_manifest.json"
                    )
                    with open(json_manifest_path, "w", encoding="utf-8") as f:
                        json.dump(manifest_rows, f, indent=2)
                    xlsx_manifest_path = os.path.join(
                        summary_dir, "artifacts_manifest.xlsx"
                    )
                    xlsx_written = False
                    try:
                        from openpyxl import Workbook as _Workbook
                        from openpyxl.styles import Font as _Font
                        wb = _Workbook()
                        ws = wb.active
                        ws.title = "Artifacts"
                        headers = ["group", "filename", "size", "mtime", "sha256"]
                        ws.append(headers)
                        for c in ws[1]:
                            c.font = _Font(bold=True)
                        for row in manifest_rows:
                            ws.append([
                                row["group"],
                                row["filename"],
                                row["size"],
                                row["mtime"],
                                row["sha256"],
                            ])
                        widths = {"A": 32, "B": 40, "C": 12, "D": 22, "E": 66}
                        for col, w in widths.items():
                            ws.column_dimensions[col].width = w
                        ws.freeze_panes = "A2"
                        try:
                            ws.auto_filter.ref = ws.dimensions
                        except Exception:
                            pass
                        wb.save(xlsx_manifest_path)
                        xlsx_written = True
                    except Exception:
                        xlsx_written = False
                    csv_href = html.escape(
                        os.path.basename(csv_manifest_path), quote=True
                    )
                    json_href = html.escape(
                        os.path.basename(json_manifest_path), quote=True
                    )
                    fh.write(
                        '<button type="button" '
                        f'aria-label="Download artifact manifest as CSV" '
                        f'data-href="{csv_href}" '
                        f'data-label="manifest CSV" '
                        'onclick="artifactDownloadWithToast(this.dataset.href, this.dataset.label)">'
                        'Export manifest CSV</button> '
                    )
                    fh.write(
                        '<button type="button" '
                        f'aria-label="Download artifact manifest as JSON" '
                        f'data-href="{json_href}" '
                        f'data-label="manifest JSON" '
                        'onclick="artifactDownloadWithToast(this.dataset.href, this.dataset.label)">'
                        'Export manifest JSON</button> '
                    )
                    if xlsx_written:
                        xlsx_href = html.escape(
                            os.path.basename(xlsx_manifest_path), quote=True
                        )
                        fh.write(
                            '<button type="button" '
                            f'aria-label="Download artifact manifest as XLSX" '
                            f'data-href="{xlsx_href}" '
                            f'data-label="manifest XLSX" '
                            'onclick="artifactDownloadWithToast(this.dataset.href, this.dataset.label)">'
                            'Export manifest XLSX</button>\n\n'
                        )
                    else:
                        fh.write("\n\n")

                except OSError:
                    pass
            fh.write(
                '<input type="text" class="artifact-search" '
                'placeholder="Search artifacts by name or path..." '
                'oninput="filterArtifactItems()">\n\n'
            )
            missing_artifacts: list[tuple[str, str]] = []
            for group_index, (title, items) in enumerate(groups):
                is_heatmap_group = "Latency heatmap" in title
                group_count = 0
                group_size = 0
                for _, path in items:
                    if os.path.exists(path):
                        group_count += 1
                        try:
                            group_size += os.path.getsize(path)
                        except OSError:
                            pass
                group_size_str = _human_size(group_size)
                aria_title = title.replace("**", "").replace("_", "")
                fh.write(
                    f'<div class="artifact-group" '
                    f'data-index="{group_index}" '
                    f'data-name="{html.escape(aria_title, quote=True)}" '
                    f'data-count="{group_count}" '
                    f'data-size="{group_size}">\n'
                    f'<p><em>{title}</em> — '
                    f'<strong>{group_count} file{"s" if group_count != 1 else ""}</strong>, '
                    f'<strong>{group_size_str}</strong></p>\n\n'
                )
                existing_items = [
                    (label, path) for label, path in items if os.path.exists(path)
                ]
                if existing_items:
                    all_links = "\n".join(path for _, path in existing_items)
                    all_links_url = "\n".join(
                        _artifact_url(path) or path for _, path in existing_items
                    )
                    url_data_attr = (
                        f' data-links-url="{html.escape(all_links_url, quote=True)}"'
                        if ARTIFACT_BASE_URL else ""
                    )
                    fh.write(
                        '<button type="button" '
                        f'aria-label="Copy links for {html.escape(aria_title, quote=True)}" '
                        f'data-context="{html.escape(aria_title, quote=True)}" '
                        f'onclick="const useUrl = document.getElementById(\'artifact-url-toggle\')?.checked; navigator.clipboard.writeText(useUrl && this.dataset.linksUrl ? this.dataset.linksUrl : this.dataset.links){_CLIPBOARD_TOAST_MULTI}" '
                        f'data-links="{html.escape(all_links, quote=True)}"{url_data_attr}>Copy links</button> '
                    )
                    group_zip_path = os.path.join(
                        summary_dir, f"artifacts_group_{group_index}.zip"
                    )
                    try:
                        seen_arcnames: set[str] = set()
                        with _zipfile.ZipFile(
                            group_zip_path, "w", _zipfile.ZIP_DEFLATED
                        ) as zf:
                            for _, p in existing_items:
                                arc = os.path.basename(p)
                                base, ext = os.path.splitext(arc)
                                i = 1
                                while arc in seen_arcnames:
                                    arc = f"{base}_{i}{ext}"
                                    i += 1
                                seen_arcnames.add(arc)
                                zf.write(p, arcname=arc)
                        group_zip_size_str = _human_size(
                            os.path.getsize(group_zip_path)
                        )
                        group_zip_href = html.escape(
                            os.path.basename(group_zip_path), quote=True
                        )
                        fh.write(
                            f'<a href="{group_zip_href}" download '
                            f'aria-label="Download ZIP for {html.escape(aria_title, quote=True)}">'
                            f'Download ZIP ({len(existing_items)} '
                            f'file{"s" if len(existing_items) != 1 else ""}, '
                            f'{group_zip_size_str})</a>\n\n'
                        )
                    except OSError:
                        pass
                    markdown_links = "\n".join(
                        f"- [{label}]({path})"
                        for label, path in existing_items
                    )
                    markdown_links_url = "\n".join(
                        f"- [{label}]({_artifact_url(path) or path})"
                        for label, path in existing_items
                    )
                    markdown_url_data_attr = (
                        f' data-markdown-url="{html.escape(markdown_links_url, quote=True)}"'
                        if ARTIFACT_BASE_URL else ""
                    )
                    fh.write(
                        '<button type="button" '
                        f'aria-label="Copy Markdown links for {html.escape(aria_title, quote=True)}" '
                        f'data-context="{html.escape(aria_title, quote=True)}" '
                        f'onclick="const useUrl = document.getElementById(\'artifact-url-toggle\')?.checked; navigator.clipboard.writeText(useUrl && this.dataset.markdownUrl ? this.dataset.markdownUrl : this.dataset.markdown){_CLIPBOARD_TOAST_MARKDOWN}" '
                        f'data-markdown="{html.escape(markdown_links, quote=True)}"{markdown_url_data_attr}>Copy as Markdown</button>\n\n'
                    )
                for item_pos, (label, path) in enumerate(items):
                    file_type = os.path.splitext(path)[1].lower() or "none"
                    url = _artifact_url(path)
                    url_attr = f' data-url="{html.escape(url, quote=True)}"' if url else ""
                    exists = os.path.exists(path)
                    if not exists:
                        missing_artifacts.append((label, path))
                    filename = os.path.basename(path)
                    try:
                        item_mtime = int(os.path.getmtime(path)) if exists else 0
                    except OSError:
                        item_mtime = 0
                    sort_attrs = (
                        f' data-filename="{html.escape(filename, quote=True)}"'
                        f' data-mtime="{item_mtime}"'
                        f' data-group-name="{html.escape(aria_title, quote=True)}"'
                        f' data-original-index="{group_index}-{item_pos:06d}"'
                    )
                    if is_heatmap_group:
                        if exists:
                            try:
                                size = os.path.getsize(path)
                                mtime = os.path.getmtime(path)
                                size_str = _human_size(size)
                                mtime_str = time.strftime(
                                    "%Y-%m-%d %H:%M:%S", time.localtime(mtime)
                                )
                                meta = f"({size_str} · {mtime_str})"
                            except OSError:
                                meta = ""
                            fh.write(
                                f'<div class="artifact-item" '
                                f'data-group="{group_index}" '
                                f'data-type="{html.escape(file_type, quote=True)}" '
                                f'data-label="{html.escape(label, quote=True)}" '
                                f'data-path="{html.escape(path, quote=True)}" '
                                f'data-existing="true"{url_attr}{sort_attrs}>\n'
                                f'<label class="artifact-select-label" aria-label="Select {html.escape(label, quote=True)}">'
                                f'<input type="checkbox" class="artifact-select"> </label>'
                                f'<a href="{html.escape(path, quote=True)}" target="_blank" rel="noopener noreferrer">'
                                f'<button type="button" aria-label="Open {html.escape(label, quote=True)}">Open</button></a> '
                                '<button type="button" '
                                f'aria-label="Download {html.escape(label, quote=True)}" '
                                f'data-href="{html.escape(path, quote=True)}" '
                                f'data-label="{html.escape(label, quote=True)}" '
                                'onclick="artifactDownloadWithToast(this.dataset.href, this.dataset.label)">'
                                f'Download {html.escape(label)}</button> '
                                f'{meta} '
                                '<button type="button" '
                                f'aria-label="Copy link for {html.escape(label, quote=True)}" '
                                f'onclick="const useUrl = document.getElementById(\'artifact-url-toggle\')?.checked; navigator.clipboard.writeText(useUrl && this.dataset.url ? this.dataset.url : this.dataset.link){_CLIPBOARD_TOAST_SINGLE}" '
                                f'data-link="{html.escape(path, quote=True)}" data-label="{html.escape(label, quote=True)}"{url_attr}>Copy link</button>\n'
                                "</div>\n"
                            )
                        else:
                            fh.write(
                                f'<div class="artifact-item" '
                                f'data-group="{group_index}" '
                                f'data-type="{html.escape(file_type, quote=True)}" '
                                f'data-label="{html.escape(label, quote=True)}" '
                                f'data-path="{html.escape(path, quote=True)}" '
                                f'data-existing="false"{sort_attrs}>\n'
                                f"⚠️ <code>{html.escape(label)}</code> (missing) — expected at "
                                f"<code>{html.escape(path)}</code>\n"
                                "</div>\n"
                            )
                    else:
                        if exists:
                            fh.write(
                                f'<div class="artifact-item" '
                                f'data-group="{group_index}" '
                                f'data-type="{html.escape(file_type, quote=True)}" '
                                f'data-label="{html.escape(label, quote=True)}" '
                                f'data-path="{html.escape(path, quote=True)}" '
                                f'data-existing="true"{url_attr}{sort_attrs}>\n'
                                f'<label class="artifact-select-label" aria-label="Select {html.escape(label, quote=True)}">'
                                f'<input type="checkbox" class="artifact-select"> </label>'
                                f'<a href="{html.escape(path, quote=True)}" target="_blank" rel="noopener noreferrer">'
                                f'<button type="button" aria-label="Open {html.escape(label, quote=True)}">Open</button></a> '
                                f'<a href="{html.escape(path, quote=True)}">{html.escape(label)}</a> '
                                '<button type="button" '
                                f'aria-label="Download {html.escape(label, quote=True)}" '
                                f'data-href="{html.escape(path, quote=True)}" '
                                f'data-label="{html.escape(label, quote=True)}" '
                                'onclick="artifactDownloadWithToast(this.dataset.href, this.dataset.label)">'
                                'Download</button> '
                                '<button type="button" '
                                f'aria-label="Copy link for {html.escape(label, quote=True)}" '
                                f'onclick="const useUrl = document.getElementById(\'artifact-url-toggle\')?.checked; navigator.clipboard.writeText(useUrl && this.dataset.url ? this.dataset.url : this.dataset.link){_CLIPBOARD_TOAST_SINGLE}" '
                                f'data-link="{html.escape(path, quote=True)}" data-label="{html.escape(label, quote=True)}"{url_attr}>Copy link</button>\n'
                                "</div>\n"
                            )
                        else:
                            fh.write(
                                f'<div class="artifact-item" '
                                f'data-group="{group_index}" '
                                f'data-type="{html.escape(file_type, quote=True)}" '
                                f'data-label="{html.escape(label, quote=True)}" '
                                f'data-path="{html.escape(path, quote=True)}" '
                                f'data-existing="false"{sort_attrs}>\n'
                                f"⚠️ <code>{html.escape(label)}</code> (missing) — expected at "
                                f"<code>{html.escape(path)}</code>\n"

                                "</div>\n"
                            )
                fh.write("</div>\n")
            fh.write("</div>\n\n")
            if missing_artifacts:
                fh.write(
                    "> ⚠️ _The following artifact(s) were not found on disk and may need to be regenerated:_\n"
                )
                for label, path in missing_artifacts:
                    fh.write(f"> - `{label}` → `{path}`\n")
                fh.write("\n")
            if heatmap_expected_but_disabled and not heatmap_written:
                fh.write(
                    "> ⚠️ _Latency heatmap export was **disabled** "
                    "(`DISABLE_HEATMAP_EXPORT=true` or `--disable-heatmap-export`). "
                    "HEATMAP CSV/JSON files were not generated._\n\n"
                )



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

    global _DISABLE_HEATMAP_VALIDATION
    if "--disable-heatmap-validation" in sys.argv:
        _DISABLE_HEATMAP_VALIDATION = True
        sys.argv.remove("--disable-heatmap-validation")

    global _HEATMAP_PREVIEW_TOP
    preview_top_value: str | None = None
    for i, arg in enumerate(list(sys.argv)):
        if arg.startswith("--heatmap-preview-top="):
            preview_top_value = arg.split("=", 1)[1]
            sys.argv.remove(arg)
            break
        elif arg == "--heatmap-preview-top":
            if i + 1 >= len(sys.argv):
                print("preflight: --heatmap-preview-top requires a value", file=sys.stderr)
                return 2
            preview_top_value = sys.argv[i + 1]
            sys.argv.pop(i + 1)
            sys.argv.pop(i)
            break
    if preview_top_value is not None:
        try:
            _HEATMAP_PREVIEW_TOP = int(preview_top_value)
            if _HEATMAP_PREVIEW_TOP < 0:
                print(
                    f"preflight: --heatmap-preview-top must be >= 0, got {preview_top_value}",
                    file=sys.stderr,
                )
                return 2
        except ValueError:
            print(
                f"preflight: --heatmap-preview-top must be an integer, got {preview_top_value}",
                file=sys.stderr,
            )
            return 2

    validation_json_value: str | None = None
    for i, arg in enumerate(list(sys.argv)):
        if arg.startswith("--validation-json="):
            validation_json_value = arg.split("=", 1)[1]
            sys.argv.remove(arg)
            break
        elif arg == "--validation-json":
            if i + 1 >= len(sys.argv):
                print("preflight: --validation-json requires a value", file=sys.stderr)
                return 2
            validation_json_value = sys.argv[i + 1]
            sys.argv.pop(i + 1)
            sys.argv.pop(i)
            break
    if validation_json_value is not None:
        if not validation_json_value.strip():
            print("preflight: --validation-json path must not be empty", file=sys.stderr)
            return 2
        os.environ["VALIDATION_JSON_PATH"] = validation_json_value

    filtered_combos_value: str | None = None
    for i, arg in enumerate(list(sys.argv)):
        if arg.startswith("--filtered-combos-csv="):
            filtered_combos_value = arg.split("=", 1)[1]
            sys.argv.remove(arg)
            break
        elif arg == "--filtered-combos-csv":
            if i + 1 >= len(sys.argv):
                print("preflight: --filtered-combos-csv requires a value", file=sys.stderr)
                return 2
            filtered_combos_value = sys.argv[i + 1]
            sys.argv.pop(i + 1)
            sys.argv.pop(i)
            break
    if filtered_combos_value is not None:
        if not filtered_combos_value.strip():
            print("preflight: --filtered-combos-csv path must not be empty", file=sys.stderr)
            return 2
        os.environ["FILTERED_COMBOS_CSV_PATH"] = filtered_combos_value




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

