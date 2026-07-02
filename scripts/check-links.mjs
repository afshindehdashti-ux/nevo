#!/usr/bin/env node
/**
 * Static route/link/sitemap checker for NEVO Industrial.
 *
 * Runs offline (no dev server needed) so it's safe in CI.
 * Fails (exit 1) on any of:
 *   - Internal link (Link `to=`, `href="/..."`, `navigate("/...")`) that
 *     doesn't resolve to a known route or configured redirect.
 *   - Sitemap entry that doesn't map to a route file.
 *   - Route file that's missing from the sitemap (excluding
 *     opt-out list: dynamic APIs, redirect-only routes, portals, etc.).
 *
 * Emits machine + human readable reports into `reports/link-check/`:
 *   - report.json   (structured findings — consumed by CI)
 *   - report.html   (standalone artifact for humans)
 *   - summary.md    (PR comment body)
 *
 * Usage: node scripts/check-links.mjs
 */
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const ROOT = process.cwd();
const ROUTES_DIR = join(ROOT, "src/routes");
const SRC_DIR = join(ROOT, "src");
const OUT_DIR = join(ROOT, "reports/link-check");
const IGNORE_FILE = join(ROOT, ".linkcheckignore");
const CONFIG_FILE = join(ROOT, "link-check.config.json");

// -------- Allowlist / ignore loading ----------
// Two sources are merged:
//   1. `.linkcheckignore` — plain text, one link pattern per line, `#` comments.
//   2. `link-check.config.json` — structured overrides:
//        {
//          "ignoreLinks":          ["/preview/*", "/blog/**"],
//          "ignoreFiles":          ["src/experimental/**"],
//          "ignoreSitemapMissing": ["/internal-tool"],
//          "ignoreSitemapExtra":   ["/legacy-redirect"],
//          "redirects":            { "/old": "/new" },
//          "redirectPrefixes":     { "/old/": "/new/" }
//        }
// Patterns are glob-ish: `*` matches within a segment, `**` matches across.
function globToRegExp(glob) {
  let src = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") { src += ".*"; i++; }
      else src += "[^/]*";
    } else if (/[.+?^${}()|[\]\\]/.test(c)) src += "\\" + c;
    else src += c;
  }
  return new RegExp("^" + src + "$");
}
function loadIgnoreFile(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*$/, "").trim())
    .filter(Boolean);
}
function loadConfig(path) {
  if (!existsSync(path)) return {};
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (e) {
    console.error(`✗ Failed to parse ${relative(ROOT, path)}: ${e.message}`);
    process.exit(2);
  }
}
const fileIgnorePatterns = loadIgnoreFile(IGNORE_FILE);
const config = loadConfig(CONFIG_FILE);
const ignoreLinkREs = [...fileIgnorePatterns, ...(config.ignoreLinks ?? [])].map(globToRegExp);
const ignoreFileREs = (config.ignoreFiles ?? []).map(globToRegExp);
const ignoreSitemapMissing = new Set(config.ignoreSitemapMissing ?? []);
const ignoreSitemapExtra = new Set(config.ignoreSitemapExtra ?? []);
const ignoreExternalREs = (config.ignoreExternal ?? []).map(globToRegExp);
const usedPatterns = new Set();
function matchAny(res, value) {
  for (const re of res) if (re.test(value)) { usedPatterns.add(re.source); return true; }
  return false;
}
const isIgnoredLink = (l) => matchAny(ignoreLinkREs, l);
const isIgnoredFile = (f) => matchAny(ignoreFileREs, f);
const isIgnoredExternal = (u) => matchAny(ignoreExternalREs, u);

// -------- External checker config ----------
// CLI/env knobs:
//   --no-external          Skip external URL validation entirely.
//   --external-only        Only run external checks (skip internal + sitemap).
//   EXTERNAL_TIMEOUT_MS    Per-request timeout (default 10_000).
//   EXTERNAL_RETRIES       Retry attempts on network error / 5xx (default 2).
//   EXTERNAL_CONCURRENCY   Parallel in-flight requests (default 8).
const args = new Set(process.argv.slice(2));
const externalCfg = {
  enabled: !args.has("--no-external"),
  timeoutMs: Number(process.env.EXTERNAL_TIMEOUT_MS) || (config.external?.timeoutMs ?? 10_000),
  retries: Number(process.env.EXTERNAL_RETRIES) || (config.external?.retries ?? 2),
  concurrency:
    Number(process.env.EXTERNAL_CONCURRENCY) || (config.external?.concurrency ?? 8),
  userAgent:
    config.external?.userAgent ??
    "NEVO-LinkCheck/1.0 (+https://nevoindustrial.com)",
  // Some servers return 403/405 to bots — treat these as OK when configured.
  acceptStatuses: new Set(config.external?.acceptStatuses ?? [200, 201, 202, 203, 204, 206, 301, 302, 303, 307, 308]),
};
const internalEnabled = !args.has("--external-only");


// -------- Route discovery (mirrors TanStack file-based routing) ----------
function fileToRoute(file) {
  let name = file.replace(/\.(tsx?|jsx?)$/, "");
  if (name === "__root") return null;
  if (name === "index") return "/";
  const DOT = "\u0000DOT\u0000";
  name = name.replace(/\[\.\]/g, DOT);
  name = name.replace(/\.index$/, "");
  if (name.endsWith(".$") || name === "$") {
    const base = name === "$" ? "" : name.slice(0, -2);
    return ("/" + base.replace(/\./g, "/") + "/*").replaceAll(DOT, ".");
  }
  return ("/" + name.replace(/\./g, "/")).replaceAll(DOT, ".");
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (/\.(t|j)sx?$/.test(entry)) out.push(full);
  }
  return out;
}

const routeFiles = walk(ROUTES_DIR)
  .map((f) => ({ file: f, rel: relative(ROUTES_DIR, f) }))
  .filter(({ rel }) => rel !== "" && !rel.startsWith("api/"));

const knownRoutes = new Set();
const wildcards = [];
for (const { rel } of routeFiles) {
  const r = fileToRoute(rel);
  if (!r) continue;
  if (r.endsWith("/*")) wildcards.push(r.slice(0, -2));
  else knownRoutes.add(r);
}

const REDIRECTS = { "/knowledge": "/knowledge-hub", ...(config.redirects ?? {}) };
const REDIRECT_PREFIXES = { "/knowledge/": "/knowledge-hub/", ...(config.redirectPrefixes ?? {}) };

function resolveLink(path) {
  const clean = path.split("#")[0].split("?")[0] || "/";
  if (REDIRECTS[clean]) return { ok: true, redirected: REDIRECTS[clean] };
  for (const [from, to] of Object.entries(REDIRECT_PREFIXES)) {
    if (clean.startsWith(from))
      return { ok: true, redirected: to + clean.slice(from.length) };
  }
  if (knownRoutes.has(clean)) return { ok: true };
  if (wildcards.some((w) => clean === w || clean.startsWith(w + "/")))
    return { ok: true };
  return { ok: false };
}

// -------- Link extraction --------
const LINK_PATTERNS = [
  /\bto=\{?["'`](\/[a-zA-Z0-9\-_/#?.]*)["'`]\}?/g,
  /\bhref=\{?["'`](\/[a-zA-Z0-9\-_/#?.]*)["'`]\}?/g,
  /\bnavigate\(\s*\{?\s*(?:to:\s*)?["'`](\/[a-zA-Z0-9\-_/#?.]*)["'`]/g,
];

const srcFiles = walk(SRC_DIR).filter((f) => /\.(t|j)sx?$/.test(f));

/** @type {{link:string, file:string, line:number, kind:'dead'|'redirect', redirectedTo?:string}[]} */
const errors = [];
const warnings = [];

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text[i] === "\n") line++;
  return line;
}

let ignoredLinkCount = 0;
let ignoredExternalCount = 0;
/** @type {Map<string, {url:string, occurrences:{file:string,line:number}[]}>} */
const externalUrls = new Map();
const EXTERNAL_RE = /\bhttps?:\/\/[^\s"'`<>()\\]+/g;

if (internalEnabled) {
  for (const file of srcFiles) {
    const relFile = relative(ROOT, file);
    if (isIgnoredFile(relFile)) continue;
    const text = readFileSync(file, "utf8");
    for (const pattern of LINK_PATTERNS) {
      pattern.lastIndex = 0;
      let m;
      while ((m = pattern.exec(text))) {
        const raw = m[1];
        if (raw.startsWith("//")) continue;
        if (raw.startsWith("/api/")) continue;
        if (raw.match(/\.(png|jpg|jpeg|svg|webp|pdf|xml|txt|ico|json|mp4|webm)$/i))
          continue;
        if (isIgnoredLink(raw)) { ignoredLinkCount++; continue; }
        const result = resolveLink(raw);
        const line = lineOf(text, m.index);
        if (!result.ok) {
          errors.push({ link: raw, file: relFile, line, kind: "dead" });
        } else if (result.redirected) {
          warnings.push({
            link: raw,
            file: relFile,
            line,
            kind: "redirect",
            redirectedTo: result.redirected,
          });
        }
      }
    }
  }
}

// -------- External URL discovery ----------
if (externalCfg.enabled) {
  for (const file of srcFiles) {
    const relFile = relative(ROOT, file);
    if (isIgnoredFile(relFile)) continue;
    const text = readFileSync(file, "utf8");
    EXTERNAL_RE.lastIndex = 0;
    let m;
    while ((m = EXTERNAL_RE.exec(text))) {
      // Strip trailing punctuation that commonly clings to URLs in source.
      let url = m[0].replace(/[),.;:!?]+$/g, "");
      // Skip obvious asset URLs — they were already excluded for internal.
      if (/\.(png|jpg|jpeg|svg|webp|gif|ico|mp4|webm|woff2?)(\?|$)/i.test(url)) continue;
      // Skip localhost / example / placeholder hosts.
      if (/^https?:\/\/(localhost|127\.|0\.0\.0\.0|example\.(com|org|net))/i.test(url))
        continue;
      if (isIgnoredExternal(url)) { ignoredExternalCount++; continue; }
      const line = lineOf(text, m.index);
      const entry = externalUrls.get(url) ?? { url, occurrences: [] };
      entry.occurrences.push({ file: relFile, line });
      externalUrls.set(url, entry);
    }
  }
}


// -------- Sitemap parity --------
/** @type {Set<string>} */
const sitemapPaths = new Set();
/** @type {Map<string, number>} */
const sitemapPathCounts = new Map();
/** @type {{path:string, reason:string}[]} */
const sitemapErrors = [];
if (internalEnabled) {
  const sitemapSrc = readFileSync(join(ROUTES_DIR, "sitemap[.]xml.ts"), "utf8");
  const pathRe = /path:\s*["'`](\/[^"'`]*)["'`]/g;
  let sm;
  while ((sm = pathRe.exec(sitemapSrc))) {
    sitemapPaths.add(sm[1]);
    sitemapPathCounts.set(sm[1], (sitemapPathCounts.get(sm[1]) ?? 0) + 1);
  }
  const SITEMAP_EXCLUDE = new Set(["/*", "/knowledge", "/knowledge/*", "/sitemap.xml"]);
  for (const [p, count] of sitemapPathCounts) {
    if (count > 1)
      sitemapErrors.push({ path: p, reason: `listed ${count}× in sitemap (must be unique)` });
  }
  for (const p of sitemapPaths) {
    if (ignoreSitemapExtra.has(p)) continue;
    if (!knownRoutes.has(p))
      sitemapErrors.push({ path: p, reason: "listed in sitemap but no matching route file" });
  }
  for (const r of knownRoutes) {
    if (SITEMAP_EXCLUDE.has(r)) continue;
    if (ignoreSitemapMissing.has(r)) continue;
    if (!sitemapPaths.has(r))
      sitemapErrors.push({ path: r, reason: "route exists but is missing from sitemap" });
  }
}

// -------- Canonical <-> route parity --------
// For every static, indexable route file:
//   • exactly one `rel: "canonical"` link entry must exist in head()
//   • its href must self-reference the route path (absolute or relative)
//   • the route must appear exactly once in the sitemap (checked above)
// Dynamic routes ($param, splat) build canonical from loader data — we only
// require that at least one canonical entry is declared.
/** @type {{route:string, file:string, reason:string, found?:string}[]} */
const canonicalErrors = [];
if (internalEnabled) {
  const CANONICAL_SKIP = new Set(["/*", "/sitemap.xml", "/knowledge", "/knowledge/*"]);
  const CANONICAL_RE = /rel:\s*["'`]canonical["'`]\s*,\s*href:\s*(?:`([^`]+)`|["']([^"']+)["'])/g;
  const SITE_ORIGIN = /^https?:\/\/[^/]+/;
  for (const { file, rel } of routeFiles) {
    const routePath = fileToRoute(rel);
    if (!routePath) continue;
    if (CANONICAL_SKIP.has(routePath)) continue;
    if (ignoreSitemapMissing.has(routePath)) continue;
    const isDynamic = routePath.includes("$") || routePath.endsWith("/*");
    const relFile = relative(ROOT, file);
    const text = readFileSync(file, "utf8");
    CANONICAL_RE.lastIndex = 0;
    /** @type {string[]} */
    const hrefs = [];
    let cm;
    while ((cm = CANONICAL_RE.exec(text))) hrefs.push(cm[1] ?? cm[2]);

    if (hrefs.length === 0) {
      canonicalErrors.push({ route: routePath, file: relFile, reason: "missing <link rel=\"canonical\"> in head()" });
      continue;
    }
    if (hrefs.length > 1) {
      canonicalErrors.push({
        route: routePath, file: relFile,
        reason: `${hrefs.length} canonical entries declared (expected exactly 1)`,
        found: hrefs.join(", "),
      });
      continue;
    }
    if (isDynamic) continue; // dynamic routes: presence is enough
    const href = hrefs[0].replace(SITE_ORIGIN, "").replace(/\/$/, "") || "/";
    const expected = routePath;
    if (href !== expected) {
      canonicalErrors.push({
        route: routePath, file: relFile,
        reason: `canonical points to "${href}" but route is "${expected}" (must self-reference)`,
        found: hrefs[0],
      });
    }
  }
}


// -------- External URL validation ----------
/** @type {{url:string, status:number|null, error:string|null, attempts:number, occurrences:{file:string,line:number}[]}[]} */
const externalFailures = [];
let externalOkCount = 0;
async function checkOne(entry) {
  const { timeoutMs, retries, userAgent, acceptStatuses } = externalCfg;
  let lastErr = null;
  let lastStatus = null;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      // HEAD first, fall back to GET on 405/403/404 (some CDNs disallow HEAD).
      let res = await fetch(entry.url, {
        method: "HEAD",
        redirect: "follow",
        signal: ctrl.signal,
        headers: { "user-agent": userAgent, accept: "*/*" },
      });
      if ([403, 404, 405, 501].includes(res.status)) {
        res = await fetch(entry.url, {
          method: "GET",
          redirect: "follow",
          signal: ctrl.signal,
          headers: { "user-agent": userAgent, accept: "*/*" },
        });
      }
      clearTimeout(timer);
      lastStatus = res.status;
      if (acceptStatuses.has(res.status)) return { ok: true, status: res.status, attempts: attempt };
      // Retry 5xx / 429; hard-fail other 4xx.
      if (res.status >= 500 || res.status === 429) { lastErr = `HTTP ${res.status}`; continue; }
      return { ok: false, status: res.status, error: `HTTP ${res.status}`, attempts: attempt };
    } catch (e) {
      clearTimeout(timer);
      lastErr = e.name === "AbortError" ? `timeout after ${timeoutMs}ms` : String(e.message || e);
    }
    // small backoff
    await new Promise((r) => setTimeout(r, 250 * attempt));
  }
  return { ok: false, status: lastStatus, error: lastErr, attempts: retries + 1 };
}

async function runExternalChecks() {
  const items = [...externalUrls.values()];
  if (!items.length) return;
  console.log(`\nChecking ${items.length} external URL(s) (concurrency=${externalCfg.concurrency}, timeout=${externalCfg.timeoutMs}ms, retries=${externalCfg.retries})…`);
  let idx = 0;
  const workers = Array.from({ length: Math.min(externalCfg.concurrency, items.length) }, async () => {
    while (idx < items.length) {
      const entry = items[idx++];
      const res = await checkOne(entry);
      if (res.ok) externalOkCount++;
      else externalFailures.push({
        url: entry.url,
        status: res.status,
        error: res.error,
        attempts: res.attempts,
        occurrences: entry.occurrences,
      });
    }
  });
  await Promise.all(workers);
}
await runExternalChecks();

// Warn about ignore patterns that never matched anything (stale entries).
const allDeclared = [
  ...fileIgnorePatterns,
  ...(config.ignoreLinks ?? []),
  ...(config.ignoreFiles ?? []),
  ...(config.ignoreExternal ?? []),
];
const staleIgnorePatterns = allDeclared.filter(
  (p) => !usedPatterns.has(globToRegExp(p).source),
);


// -------- Reports --------
const totalErrors =
  errors.length + sitemapErrors.length + externalFailures.length + canonicalErrors.length;
const passed = totalErrors === 0;
const generatedAt = new Date().toISOString();
const commit = process.env.GITHUB_SHA || "";
const branch = process.env.GITHUB_REF_NAME || "";

const report = {
  generatedAt,
  commit,
  branch,
  passed,
  counts: {
    routes: knownRoutes.size,
    sitemapEntries: sitemapPaths.size,
    deadLinks: errors.length,
    redirectWarnings: warnings.length,
    sitemapErrors: sitemapErrors.length,
    canonicalErrors: canonicalErrors.length,
    ignoredLinks: ignoredLinkCount,
    externalChecked: externalUrls.size,
    externalOk: externalOkCount,
    externalFailed: externalFailures.length,
    externalIgnored: ignoredExternalCount,
  },
  deadLinks: errors,
  redirectWarnings: warnings,
  sitemapErrors,
  canonicalErrors,
  externalFailures: externalFailures.map((f) => ({
    ...f,
    // Flatten first occurrence for table rendering.
    firstFile: f.occurrences[0]?.file ?? "",
    firstLine: f.occurrences[0]?.line ?? "",
    occurrenceCount: f.occurrences.length,
  })),
  external: {
    enabled: externalCfg.enabled,
    timeoutMs: externalCfg.timeoutMs,
    retries: externalCfg.retries,
    concurrency: externalCfg.concurrency,
  },
  ignore: {
    linkPatterns: [...fileIgnorePatterns, ...(config.ignoreLinks ?? [])],
    filePatterns: config.ignoreFiles ?? [],
    externalPatterns: config.ignoreExternal ?? [],
    sitemapMissing: [...ignoreSitemapMissing],
    sitemapExtra: [...ignoreSitemapExtra],
    stalePatterns: staleIgnorePatterns,
  },
};

function ensureDir(p) {
  mkdirSync(dirname(p), { recursive: true });
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function htmlReport(r) {
  const rows = (arr, cols) =>
    arr.length
      ? `<table><thead><tr>${cols
          .map((c) => `<th>${esc(c.label)}</th>`)
          .join("")}</tr></thead><tbody>${arr
          .map(
            (row) =>
              `<tr>${cols
                .map((c) => `<td>${esc(row[c.key] ?? "")}</td>`)
                .join("")}</tr>`,
          )
          .join("")}</tbody></table>`
      : `<p class="empty">None 🎉</p>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>NEVO Link Check Report</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 14px/1.5 system-ui, sans-serif; margin: 2rem auto; max-width: 1080px; padding: 0 1rem; }
  h1 { margin-bottom: .25rem; }
  .meta { color: #666; font-size: 12px; margin-bottom: 2rem; }
  .badge { display:inline-block; padding: 2px 10px; border-radius: 999px; font-weight: 600; font-size: 12px; }
  .pass { background: #10b981; color: white; }
  .fail { background: #ef4444; color: white; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: .75rem; margin: 1rem 0 2rem; }
  .card { border: 1px solid #ddd; border-radius: 8px; padding: .75rem 1rem; }
  .card b { font-size: 1.5rem; display: block; }
  table { width: 100%; border-collapse: collapse; margin: .5rem 0 1.5rem; font-size: 13px; }
  th, td { border-bottom: 1px solid #eee; padding: .5rem .6rem; text-align: left; vertical-align: top; }
  th { background: #f7f7f7; }
  code { background: #f2f2f2; padding: 1px 5px; border-radius: 4px; }
  .empty { color: #6a6; }
  h2 { margin-top: 2rem; }
</style></head><body>
<h1>NEVO Link Check <span class="badge ${r.passed ? "pass" : "fail"}">${r.passed ? "PASS" : "FAIL"}</span></h1>
<div class="meta">Generated ${esc(r.generatedAt)}${r.commit ? ` • commit <code>${esc(r.commit.slice(0, 7))}</code>` : ""}${r.branch ? ` • branch <code>${esc(r.branch)}</code>` : ""}</div>
<div class="cards">
  <div class="card"><b>${r.counts.routes}</b>routes</div>
  <div class="card"><b>${r.counts.sitemapEntries}</b>sitemap entries</div>
  <div class="card"><b>${r.counts.deadLinks}</b>dead links</div>
  <div class="card"><b>${r.counts.redirectWarnings}</b>redirect warnings</div>
  <div class="card"><b>${r.counts.sitemapErrors}</b>sitemap issues</div>
  <div class="card"><b>${r.counts.canonicalErrors}</b>canonical issues</div>
  <div class="card"><b>${r.counts.externalChecked}</b>external checked</div>
  <div class="card"><b>${r.counts.externalFailed}</b>external failed</div>
</div>
<h2>Dead internal links (${r.deadLinks.length})</h2>
${rows(r.deadLinks, [
  { key: "link", label: "Link" },
  { key: "file", label: "Source file" },
  { key: "line", label: "Line" },
])}
<h2>Sitemap issues (${r.sitemapErrors.length})</h2>
${rows(r.sitemapErrors, [
  { key: "path", label: "Path" },
  { key: "reason", label: "Reason" },
])}
<h2>Canonical &lt;-&gt; route issues (${r.canonicalErrors.length})</h2>
${rows(r.canonicalErrors, [
  { key: "route", label: "Route" },
  { key: "file", label: "Route file" },
  { key: "reason", label: "Reason" },
  { key: "found", label: "Found" },
])}
<h2>External URL failures (${r.externalFailures.length} of ${r.counts.externalChecked} checked)</h2>
${rows(r.externalFailures, [
  { key: "url", label: "URL" },
  { key: "status", label: "Status" },
  { key: "error", label: "Error" },
  { key: "attempts", label: "Attempts" },
  { key: "firstFile", label: "First seen in" },
  { key: "firstLine", label: "Line" },
  { key: "occurrenceCount", label: "# refs" },
])}
<h2>301 redirect warnings (${r.redirectWarnings.length})</h2>
${rows(r.redirectWarnings, [
  { key: "link", label: "Link" },
  { key: "redirectedTo", label: "Prefer" },
  { key: "file", label: "Source file" },
  { key: "line", label: "Line" },
])}
</body></html>`;
}

function mdSummary(r) {
  const status = r.passed ? "✅ **PASS**" : "❌ **FAIL**";
  const lines = [];
  lines.push(`<!-- nevo-link-check -->`);
  lines.push(`## 🔗 NEVO Link Check — ${status}`);
  lines.push("");
  lines.push(
    `| Routes | Sitemap | Dead links | Redirects | Sitemap issues | Canonical issues | External ok/fail |`,
  );
  lines.push(`| ---: | ---: | ---: | ---: | ---: | ---: | ---: |`);
  lines.push(
    `| ${r.counts.routes} | ${r.counts.sitemapEntries} | **${r.counts.deadLinks}** | ${r.counts.redirectWarnings} | **${r.counts.sitemapErrors}** | **${r.counts.canonicalErrors}** | ${r.counts.externalOk}/**${r.counts.externalFailed}** |`,
  );
  lines.push("");
  if (r.deadLinks.length) {
    lines.push(`### ❌ Dead internal links (${r.deadLinks.length})`);
    lines.push("");
    lines.push(`| Link | Source file:line |`);
    lines.push(`| --- | --- |`);
    for (const e of r.deadLinks.slice(0, 50))
      lines.push(`| \`${e.link}\` | \`${e.file}:${e.line}\` |`);
    if (r.deadLinks.length > 50)
      lines.push(`| … | _${r.deadLinks.length - 50} more, see artifact_ |`);
    lines.push("");
  }
  if (r.sitemapErrors.length) {
    lines.push(`### 🗺️ Sitemap issues (${r.sitemapErrors.length})`);
    lines.push("");
    lines.push(`| Path | Reason |`);
    lines.push(`| --- | --- |`);
    for (const e of r.sitemapErrors) lines.push(`| \`${e.path}\` | ${e.reason} |`);
    lines.push("");
  }
  if (r.canonicalErrors.length) {
    lines.push(`### 🧭 Canonical ↔ route issues (${r.canonicalErrors.length})`);
    lines.push("");
    lines.push(`| Route | File | Reason | Found |`);
    lines.push(`| --- | --- | --- | --- |`);
    for (const c of r.canonicalErrors.slice(0, 50))
      lines.push(
        `| \`${c.route}\` | \`${c.file}\` | ${c.reason} | ${c.found ? `\`${c.found}\`` : ""} |`,
      );
    if (r.canonicalErrors.length > 50)
      lines.push(`| … | | _${r.canonicalErrors.length - 50} more_ | |`);
    lines.push("");
  if (r.externalFailures.length) {
    lines.push(`### 🌐 External URL failures (${r.externalFailures.length})`);
    lines.push("");
    lines.push(`| URL | Status | Error | First seen | Refs |`);
    lines.push(`| --- | ---: | --- | --- | ---: |`);
    for (const f of r.externalFailures.slice(0, 50))
      lines.push(
        `| ${f.url} | ${f.status ?? "—"} | ${f.error ?? ""} | \`${f.firstFile}:${f.firstLine}\` | ${f.occurrenceCount} |`,
      );
    if (r.externalFailures.length > 50)
      lines.push(`| … | | | | _${r.externalFailures.length - 50} more_ |`);
    lines.push("");
  }
  if (r.redirectWarnings.length) {
    lines.push(
      `<details><summary>⚠️ ${r.redirectWarnings.length} redirect warning(s)</summary>`,
    );
    lines.push("");
    lines.push(`| Link | Prefer | Source file:line |`);
    lines.push(`| --- | --- | --- |`);
    for (const w of r.redirectWarnings)
      lines.push(
        `| \`${w.link}\` | \`${w.redirectedTo}\` | \`${w.file}:${w.line}\` |`,
      );
    lines.push("");
    lines.push(`</details>`);
    lines.push("");
  }
  if (r.counts.ignoredLinks || r.ignore.stalePatterns.length) {
    lines.push(
      `_${r.counts.ignoredLinks} link occurrence(s) allowlisted via \`.linkcheckignore\` / \`link-check.config.json\`._`,
    );
    if (r.ignore.stalePatterns.length) {
      lines.push("");
      lines.push(
        `> ⚠️ Stale ignore pattern(s) never matched — consider removing: ${r.ignore.stalePatterns.map((p) => `\`${p}\``).join(", ")}`,
      );
    }
    lines.push("");
  }
  lines.push(`_Full HTML + JSON reports are attached as workflow artifacts._`);
  return lines.join("\n");
}

const jsonPath = join(OUT_DIR, "report.json");
const htmlPath = join(OUT_DIR, "report.html");
const mdPath = join(OUT_DIR, "summary.md");
ensureDir(jsonPath);
writeFileSync(jsonPath, JSON.stringify(report, null, 2));
writeFileSync(htmlPath, htmlReport(report));
writeFileSync(mdPath, mdSummary(report));

// -------- Console output --------
if (ignoredLinkCount) {
  console.log(`\nAllowlisted ${ignoredLinkCount} link occurrence(s) via ignore config.`);
}
if (staleIgnorePatterns.length) {
  console.log("\nStale ignore patterns (never matched — consider removing):");
  for (const p of staleIgnorePatterns) console.log(`  • ${p}`);
}
if (warnings.length) {
  console.log("\nWarnings:");
  for (const w of warnings)
    console.log(
      `  ⚠ Link "${w.link}" in ${w.file}:${w.line} hits 301 → prefer "${w.redirectedTo}"`,
    );
}
if (errors.length || sitemapErrors.length || externalFailures.length || canonicalErrors.length) {
  console.log("\nErrors:");
  for (const e of errors)
    console.log(`  ✗ Dead internal link "${e.link}" in ${e.file}:${e.line}`);
  for (const s of sitemapErrors) console.log(`  ✗ Sitemap ${s.path} — ${s.reason}`);
  for (const c of canonicalErrors)
    console.log(`  ✗ Canonical ${c.route} (${c.file}) — ${c.reason}${c.found ? ` [found: ${c.found}]` : ""}`);
  for (const f of externalFailures) {
    const first = f.occurrences[0];
    console.log(
      `  ✗ External ${f.url} → ${f.status ?? "no response"}${f.error ? ` (${f.error})` : ""} — first seen ${first?.file}:${first?.line}${f.occurrences.length > 1 ? ` (+${f.occurrences.length - 1} more)` : ""}`,
    );
  }
  console.log(
    `\n✗ Link check failed: ${totalErrors} error(s), ${warnings.length} warning(s), ${ignoredLinkCount + ignoredExternalCount} ignored.`,
  );
  console.log(`Reports written to ${relative(ROOT, OUT_DIR)}/`);
  process.exit(1);
}
console.log(
  `\n✓ Link check passed: ${knownRoutes.size} routes, ${sitemapPaths.size} sitemap entries, ${externalOkCount}/${externalUrls.size} external OK, ${warnings.length} warning(s), ${ignoredLinkCount + ignoredExternalCount} ignored.`,
);
console.log(`Reports written to ${relative(ROOT, OUT_DIR)}/`);
