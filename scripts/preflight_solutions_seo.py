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
                "error_kind": "ok"}

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
                    return ok2
            elif err2:
                last_err = err2

        elif status is None:
            last_err = err
            last_ms = ms

        if attempt < RETRIES:
            time.sleep(_backoff_delay(attempt))

    body_hash, body_snippet = _body_preview(last_body, last_content_type)

    err_msg = last_err or "unknown error"
    return {"url": url, "ok": False, "status": last_status, "bytes": last_bytes,
            "ms": last_ms, "attempts": attempts,
            "error": err_msg, "method": last_method or method_mode,
            "body_hash": body_hash, "body_snippet": body_snippet,
            "response_headers": last_headers,
            "error_kind": _classify_error(err_msg, last_status)}



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
    ]

    # Failure-kind breakdown: shows at a glance whether the run is dominated
    # by timeouts (latency), DNS/TLS (infra) or HTTP errors (app/content).
    from collections import Counter
    kinds = Counter(r.get("error_kind") or ("ok" if r["ok"] else "unknown")
                    for r in results if not r["ok"])
    if kinds:
        parts = [f"{_ERROR_KIND_LABELS.get(k, k)} × **{n}**"
                 for k, n in kinds.most_common()]
        lines.append(f"- Failure kinds: {' · '.join(parts)}")

    lines += [
        "",
        "| Status | Kind | URL | Method | HTTP | Time (ms) | Size | Attempts | Notes |",
        "| :---: | :---: | --- | :---: | ---: | ---: | ---: | ---: | --- |",
    ]
    for r in sorted(results, key=lambda x: (x["ok"], -x["ms"])):
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
    failures_with_detail = [r for r in results if not r["ok"] and (
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
        kind = r.get("error_kind") or ("ok" if r["ok"] else "unknown")
        print(f"  {marker} [{meth} {http} {kind}] {r['ms']:6.0f}ms  {r['url']} — {detail}")

    write_step_summary(results)

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

