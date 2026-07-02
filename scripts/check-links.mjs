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
 * Usage: node scripts/check-links.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const ROUTES_DIR = join(ROOT, "src/routes");
const SRC_DIR = join(ROOT, "src");

// -------- Route discovery (mirrors TanStack file-based routing) ----------
function fileToRoute(file) {
  let name = file.replace(/\.(tsx?|jsx?)$/, "");
  if (name === "__root") return null;
  if (name === "index") return "/";
  // Protect "[.]" escaped literal dots before dot→slash conversion.
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
  // Skip generated tree and API routes (server-only, not linkable pages)
  .filter(({ rel }) => rel !== "" && !rel.startsWith("api/"));

const knownRoutes = new Set();
const wildcards = []; // routes that match a prefix
for (const { rel } of routeFiles) {
  const r = fileToRoute(rel);
  if (!r) continue;
  if (r.endsWith("/*")) {
    wildcards.push(r.slice(0, -2)); // prefix
  } else {
    knownRoutes.add(r);
  }
}

// Configured 301 redirects (source → target). Keep in sync with route files.
const REDIRECTS = {
  "/knowledge": "/knowledge-hub",
};
const REDIRECT_PREFIXES = {
  "/knowledge/": "/knowledge-hub/",
};

function resolveLink(path) {
  // strip query + hash
  const clean = path.split("#")[0].split("?")[0] || "/";
  if (REDIRECTS[clean]) return { ok: true, redirected: REDIRECTS[clean] };
  for (const [from, to] of Object.entries(REDIRECT_PREFIXES)) {
    if (clean.startsWith(from)) return { ok: true, redirected: to + clean.slice(from.length) };
  }
  if (knownRoutes.has(clean)) return { ok: true };
  if (wildcards.some((w) => clean === w || clean.startsWith(w + "/"))) return { ok: true };
  return { ok: false };
}

// -------- Link extraction --------
const LINK_PATTERNS = [
  // <Link to="/x">, to={"/x"}
  /\bto=\{?["'`](\/[a-zA-Z0-9\-_/#?.]*)["'`]\}?/g,
  // href="/x" (internal only; skip http, mailto, tel, #, protocol-relative)
  /\bhref=\{?["'`](\/[a-zA-Z0-9\-_/#?.]*)["'`]\}?/g,
  // navigate("/x"), router.navigate({ to: "/x" })
  /\bnavigate\(\s*\{?\s*(?:to:\s*)?["'`](\/[a-zA-Z0-9\-_/#?.]*)["'`]/g,
];

const srcFiles = walk(SRC_DIR).filter((f) => /\.(t|j)sx?$/.test(f));

const errors = [];
const warnings = [];

for (const file of srcFiles) {
  const text = readFileSync(file, "utf8");
  for (const pattern of LINK_PATTERNS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(text))) {
      const raw = m[1];
      // Skip obvious non-routes
      if (raw.startsWith("//")) continue;
      if (raw.startsWith("/api/")) continue; // server routes
      if (raw.match(/\.(png|jpg|jpeg|svg|webp|pdf|xml|txt|ico|json|mp4|webm)$/i)) continue;
      const result = resolveLink(raw);
      if (!result.ok) {
        errors.push(`✗ Dead internal link "${raw}" in ${relative(ROOT, file)}`);
      } else if (result.redirected) {
        warnings.push(
          `⚠ Link "${raw}" in ${relative(ROOT, file)} hits 301 → prefer "${result.redirected}"`,
        );
      }
    }
  }
}

// -------- Sitemap parity --------
const sitemapSrc = readFileSync(join(ROUTES_DIR, "sitemap[.]xml.ts"), "utf8");
const sitemapPaths = new Set();
const pathRe = /path:\s*["'`](\/[^"'`]*)["'`]/g;
let sm;
while ((sm = pathRe.exec(sitemapSrc))) sitemapPaths.add(sm[1]);

// Routes intentionally excluded from the public sitemap
const SITEMAP_EXCLUDE = new Set([
  "/*",
  "/knowledge",
  "/knowledge/*",
  "/sitemap.xml",
]);

for (const p of sitemapPaths) {
  if (!knownRoutes.has(p)) {
    errors.push(`✗ Sitemap lists "${p}" but no route file matches`);
  }
}

for (const r of knownRoutes) {
  if (SITEMAP_EXCLUDE.has(r)) continue;
  if (!sitemapPaths.has(r)) {
    errors.push(`✗ Route "${r}" is missing from sitemap`);
  }
}

// -------- Report --------
if (warnings.length) {
  console.log("\nWarnings:");
  for (const w of warnings) console.log("  " + w);
}
if (errors.length) {
  console.log("\nErrors:");
  for (const e of errors) console.log("  " + e);
  console.log(`\n✗ Link check failed: ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(
  `\n✓ Link check passed: ${knownRoutes.size} routes, ${sitemapPaths.size} sitemap entries, ${warnings.length} warning(s).`,
);
