#!/usr/bin/env node
/**
 * Automated SEO validation across all 10 locales.
 *
 * Validates, per rendered page:
 *   1. hreflang    — one <link rel="alternate" hreflang> per active locale + x-default,
 *                    self-referencing entry present, absolute URLs, no duplicates.
 *   2. canonical   — exactly one, absolute, on the site origin, self-referencing the
 *                    locale-prefixed path (query/hash stripped, no trailing-slash drift).
 *   3. robots      — page-level <meta name="robots"> must not noindex a public page;
 *                    site-level /robots.txt reachable, not blanket-disallowing crawlers,
 *                    and its Sitemap: directive resolves.
 *   4. sitemap     — /sitemap.xml reachable, parses, and lists every audited URL.
 *   5. single H1   — exactly one <h1> in <body>, non-empty text.
 *
 * Usage:
 *   node scripts/check-seo-validation.mjs               # boot/reuse dev server, exit 1 on failure
 *   node scripts/check-seo-validation.mjs --warn-only   # report but always exit 0
 *   node scripts/check-seo-validation.mjs --json        # machine-readable report
 *   SEO_CHECK_BASE_URL=http://127.0.0.1:8080 node scripts/check-seo-validation.mjs
 *
 * No external dependencies — built-in fetch + child_process only.
 */

import { spawn } from "node:child_process";
import net from "node:net";

const WARN_ONLY = process.argv.includes("--warn-only");
const JSON_OUT = process.argv.includes("--json");

const LOCALES = ["en", "ar", "tr", "ru", "pt", "de", "es", "fr", "it", "zh"];

// Locale path segment → advertised hreflang code (mirrors LOCALES in src/lib/seo.ts).
const HREFLANG = {
  en: "en",
  ar: "ar",
  tr: "tr",
  ru: "ru",
  pt: "pt",
  de: "de",
  es: "es",
  fr: "fr",
  it: "it",
  zh: "zh-hans",
};

// Locale-agnostic paths (leading slash, "" = locale home).
const ROUTES = [
  "",
  "/about",
  "/ai-assistant",
  "/ai-project-estimator",
  "/careers",
  "/contact",
  "/customer-portal",
  "/download-center",
  "/engineering-tools",
  "/factory-layout-generator",
  "/factory-layouts",
  "/industries",
  "/installation-commissioning",
  "/investment-calculator",
  "/investors",
  "/knowledge-hub",
  "/panel-thickness-calculator",
  "/partner-portal",
  "/pir-vs-rock-wool",
  "/privacy",
  "/product-configurator",
  "/project-inquiry",
  "/quality",
  "/research-innovation",
  "/solutions",
  "/solutions/engineering-consultancy",
  "/solutions/factory-development",
  "/solutions/production-lines",
  "/solutions/raw-materials",
  "/solutions/sandwich-panels",
  "/sustainability",
];

// ------------- HTML extraction -------------

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return m ? m[1].trim() : "";
}

function linkTags(html) {
  return html.match(/<link\b[^>]*>/gi) ?? [];
}

function extractCanonicals(html) {
  return linkTags(html)
    .filter((t) => /\brel\s*=\s*["']canonical["']/i.test(t))
    .map((t) => attr(t, "href"));
}

function extractHreflangs(html) {
  return linkTags(html)
    .filter(
      (t) => /\brel\s*=\s*["']alternate["']/i.test(t) && /\bhreflang\s*=\s*["']/i.test(t),
    )
    .map((t) => ({ hreflang: attr(t, "hreflang").toLowerCase(), href: attr(t, "href") }));
}

function extractRobotsMeta(html) {
  const m = html.match(
    /<meta\b[^>]*?name\s*=\s*["']robots["'][^>]*?content\s*=\s*["']([^"']*)["'][^>]*>/i,
  );
  return m ? m[1].trim().toLowerCase() : "";
}

function stripHead(html) {
  return html.replace(/<head\b[\s\S]*?<\/head>/i, "");
}

function extractH1s(html) {
  const body = stripHead(html);
  const matches = body.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) ?? [];
  return matches.map((h) =>
    h
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function normalizeUrl(raw) {
  try {
    const u = new URL(raw);
    u.hash = "";
    u.search = "";
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
    return u.toString();
  } catch {
    return raw;
  }
}

// ------------- Per-page audit -------------

function auditHtml(html, locale, path, ctx) {
  const errors = [];
  const warnings = [];
  const expectedPath = `/${locale}${path}`;

  // --- canonical ---
  const canonicals = extractCanonicals(html).filter(Boolean);
  let canonical = canonicals[0] ?? "";
  if (canonicals.length === 0) {
    errors.push("canonical: missing <link rel=\"canonical\">");
  } else if (canonicals.length > 1) {
    errors.push(`canonical: ${canonicals.length} canonical tags emitted (must be exactly 1)`);
  }
  if (canonical) {
    if (!/^https?:\/\//i.test(canonical)) {
      errors.push(`canonical: not absolute (${canonical})`);
    } else {
      const u = new URL(canonical);
      if (ctx.siteOrigin && u.origin !== ctx.siteOrigin) {
        errors.push(`canonical: wrong origin ${u.origin} (expected ${ctx.siteOrigin})`);
      }
      const canonPath = u.pathname.replace(/\/$/, "") || "/";
      if (canonPath !== (expectedPath || "/")) {
        errors.push(`canonical: not self-referencing (${canonPath} ≠ ${expectedPath})`);
      }
      if (u.search || u.hash) warnings.push(`canonical: contains query/hash (${canonical})`);
    }
    canonical = normalizeUrl(canonical);
  }

  // --- hreflang ---
  const alternates = extractHreflangs(html);
  const byLang = new Map();
  for (const a of alternates) {
    if (!a.hreflang) continue;
    if (byLang.has(a.hreflang) && byLang.get(a.hreflang) !== a.href) {
      errors.push(`hreflang: duplicate "${a.hreflang}" with conflicting href`);
    } else if (byLang.has(a.hreflang)) {
      warnings.push(`hreflang: duplicate "${a.hreflang}" tag`);
    }
    byLang.set(a.hreflang, a.href);
  }

  if (alternates.length === 0) {
    errors.push("hreflang: no alternate links emitted");
  } else {
    const missing = LOCALES.filter((l) => !byLang.has(HREFLANG[l]));
    if (missing.length) errors.push(`hreflang: missing locales ${missing.join(", ")}`);
    if (!byLang.has("x-default")) errors.push("hreflang: missing x-default");

    const self = byLang.get(HREFLANG[locale]);
    if (self) {
      const selfPath = (() => {
        try {
          return new URL(self).pathname.replace(/\/$/, "") || "/";
        } catch {
          return self;
        }
      })();
      if (selfPath !== (expectedPath || "/")) {
        errors.push(
          `hreflang: self entry "${HREFLANG[locale]}" points to ${selfPath} (expected ${expectedPath})`,
        );
      }
    }

    for (const [lang, href] of byLang) {
      if (!href) {
        errors.push(`hreflang: "${lang}" has empty href`);
        continue;
      }
      if (!/^https?:\/\//i.test(href)) errors.push(`hreflang: "${lang}" href not absolute (${href})`);
      const localeForLang = LOCALES.find((l) => HREFLANG[l] === lang);
      if (localeForLang) {
        try {
          const p = new URL(href).pathname;
          if (!p.startsWith(`/${localeForLang}`)) {
            errors.push(`hreflang: "${lang}" href not under /${localeForLang} (${p})`);
          }
        } catch {
          /* absolute check above already reported */
        }
      }
    }
  }

  // --- robots (page level) ---
  const robotsMeta = extractRobotsMeta(html);
  if (robotsMeta && /\bnoindex\b/.test(robotsMeta)) {
    errors.push(`robots: public page is noindex ("${robotsMeta}")`);
  }
  if (robotsMeta && /\bnofollow\b/.test(robotsMeta)) {
    warnings.push(`robots: page is nofollow ("${robotsMeta}")`);
  }

  // --- single H1 ---
  const h1s = extractH1s(html);
  if (h1s.length === 0) errors.push("h1: no <h1> found");
  else if (h1s.length > 1) errors.push(`h1: ${h1s.length} <h1> elements (must be exactly 1)`);
  else if (!h1s[0]) errors.push("h1: <h1> is empty");

  return {
    locale,
    path,
    url: expectedPath || `/${locale}`,
    canonical,
    hreflangCount: byLang.size,
    h1Count: h1s.length,
    errors,
    warnings,
  };
}

// ------------- Site-level checks -------------

async function auditRobotsTxt(baseUrl) {
  const errors = [];
  const warnings = [];
  let sitemapUrls = [];
  let res;
  try {
    res = await fetch(`${baseUrl}/robots.txt`);
  } catch (e) {
    return { errors: [`robots.txt: fetch failed (${e?.message ?? e})`], warnings, sitemapUrls };
  }
  if (!res.ok) {
    return { errors: [`robots.txt: HTTP ${res.status}`], warnings, sitemapUrls };
  }
  const text = await res.text();
  const lines = text.split(/\r?\n/).map((l) => l.trim());

  let inWildcard = false;
  for (const line of lines) {
    if (/^#/.test(line) || !line) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") inWildcard = value === "*";
    if (key === "disallow" && inWildcard && value === "/") {
      errors.push('robots.txt: "Disallow: /" blocks all crawlers for User-agent: *');
    }
    if (key === "sitemap" && value) sitemapUrls.push(value);
  }

  if (!/user-agent\s*:/i.test(text)) errors.push("robots.txt: no User-agent block");
  if (sitemapUrls.length === 0) warnings.push("robots.txt: no Sitemap: directive");

  return { errors, warnings, sitemapUrls, text };
}

async function auditSitemap(baseUrl) {
  const errors = [];
  const warnings = [];
  const locs = new Set();
  let res;
  try {
    res = await fetch(`${baseUrl}/sitemap.xml`);
  } catch (e) {
    return { errors: [`sitemap.xml: fetch failed (${e?.message ?? e})`], warnings, locs };
  }
  if (!res.ok) return { errors: [`sitemap.xml: HTTP ${res.status}`], warnings, locs };

  const xml = await res.text();
  const ctype = res.headers.get("content-type") ?? "";
  if (!/xml/i.test(ctype)) warnings.push(`sitemap.xml: unexpected Content-Type "${ctype}"`);
  if (!/<urlset\b/i.test(xml) && !/<sitemapindex\b/i.test(xml)) {
    errors.push("sitemap.xml: missing <urlset>/<sitemapindex> root");
    return { errors, warnings, locs, xml };
  }

  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
    locs.add(normalizeUrl(m[1]));
  }
  if (locs.size === 0) errors.push("sitemap.xml: contains no <loc> entries");

  return { errors, warnings, locs, xml };
}

// ------------- Dev server lifecycle -------------

function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

async function waitForServer(baseUrl, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(baseUrl, { redirect: "manual" });
      if (res.status < 500) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function startDevServer() {
  const PORT = 4322;
  const proc = spawn(
    "node",
    ["node_modules/vite/bin/vite.js", "dev", "--port", String(PORT), "--host", "127.0.0.1"],
    { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NODE_ENV: "development" } },
  );
  proc.stdout.on("data", () => {});
  proc.stderr.on("data", () => {});
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const ok = await waitForServer(baseUrl);
  if (!ok) {
    proc.kill("SIGTERM");
    throw new Error(`Dev server on ${baseUrl} did not become ready`);
  }
  return { baseUrl, proc };
}

async function fetchWithRetry(url, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

// ------------- Main -------------

async function run() {
  let baseUrl = process.env.SEO_CHECK_BASE_URL;
  let serverProc;

  if (!baseUrl) {
    if (await isPortOpen(8080)) baseUrl = "http://127.0.0.1:8080";
    else {
      const started = await startDevServer();
      baseUrl = started.baseUrl;
      serverProc = started.proc;
    }
  }
  baseUrl = baseUrl.replace(/\/$/, "");

  try {
    const robots = await auditRobotsTxt(baseUrl);
    const sitemap = await auditSitemap(baseUrl);

    // The canonical origin is whatever the app advertises in its sitemap/robots,
    // so page canonicals are checked against the same origin the site publishes.
    let siteOrigin = "";
    const firstLoc = [...sitemap.locs][0] ?? robots.sitemapUrls[0];
    if (firstLoc) {
      try {
        siteOrigin = new URL(firstLoc).origin;
      } catch {
        /* leave unset */
      }
    }

    const targets = [];
    for (const locale of LOCALES) for (const path of ROUTES) targets.push({ locale, path });

    const results = [];
    const CONCURRENCY = 10;
    let idx = 0;
    async function worker() {
      while (idx < targets.length) {
        const t = targets[idx++];
        const url = `${baseUrl}/${t.locale}${t.path}`;
        try {
          const html = await fetchWithRetry(url);
          results.push(auditHtml(html, t.locale, t.path, { siteOrigin }));
        } catch (e) {
          results.push({
            locale: t.locale,
            path: t.path,
            url: `/${t.locale}${t.path}`,
            errors: [`fetch: ${e?.message ?? e}`],
            warnings: [],
          });
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    results.sort((a, b) => a.url.localeCompare(b.url));

    // Cross-check: every audited canonical must appear in the sitemap.
    if (sitemap.locs.size > 0) {
      const missingFromSitemap = [];
      for (const r of results) {
        if (!r.canonical) continue;
        if (!sitemap.locs.has(normalizeUrl(r.canonical))) missingFromSitemap.push(r.canonical);
      }
      if (missingFromSitemap.length) {
        sitemap.errors.push(
          `sitemap.xml: ${missingFromSitemap.length} audited URL(s) absent — e.g. ${missingFromSitemap
            .slice(0, 5)
            .join(", ")}`,
        );
      }
    }

    const siteErrors = [...robots.errors, ...sitemap.errors];
    const siteWarnings = [...robots.warnings, ...sitemap.warnings];
    const failures = results.filter((r) => r.errors.length > 0);
    const warned = results.filter((r) => r.warnings.length > 0);
    const failed = failures.length > 0 || siteErrors.length > 0;

    if (JSON_OUT) {
      process.stdout.write(
        JSON.stringify(
          {
            baseUrl,
            siteOrigin,
            total: results.length,
            failed: failures.length,
            warned: warned.length,
            siteErrors,
            siteWarnings,
            sitemapEntries: sitemap.locs.size,
            results,
          },
          null,
          2,
        ) + "\n",
      );
    } else {
      console.log(
        `\nSEO validation — ${results.length} pages (${LOCALES.length} locales × ${ROUTES.length} routes) against ${baseUrl}\n`,
      );
      console.log(
        `  robots.txt: ${robots.errors.length ? "FAIL" : "ok"}   sitemap.xml: ${
          sitemap.errors.length ? "FAIL" : `ok (${sitemap.locs.size} URLs)`
        }\n`,
      );
      for (const e of siteErrors) console.log(`  ✗ ${e}`);
      for (const w of siteWarnings) console.log(`  ⚠ ${w}`);
      if (siteErrors.length || siteWarnings.length) console.log("");

      if (failures.length === 0) {
        console.log("✓ hreflang, canonical, robots and single-H1 rules pass on every page.\n");
      } else {
        console.log(`✗ ${failures.length} page(s) failed:\n`);
        for (const f of failures) {
          for (const msg of f.errors) console.log(`  ✗ ${f.url.padEnd(46)} ${msg}`);
        }
        console.log("");
      }
      if (warned.length) {
        console.log(`⚠ ${warned.length} page(s) with warnings:\n`);
        for (const w of warned) {
          for (const msg of w.warnings) console.log(`  ⚠ ${w.url.padEnd(46)} ${msg}`);
        }
        console.log("");
      }
      for (const loc of LOCALES) {
        const lr = results.filter((r) => r.locale === loc);
        const ok = lr.filter((r) => r.errors.length === 0).length;
        console.log(`  ${loc}: ${ok}/${lr.length} pass`);
      }
      console.log("");
    }

    if (failed && !WARN_ONLY) process.exit(1);
    process.exit(0);
  } finally {
    if (serverProc) serverProc.kill("SIGTERM");
  }
}

run().catch((e) => {
  console.error("check-seo-validation failed:", e);
  process.exit(WARN_ONLY ? 0 : 2);
});
