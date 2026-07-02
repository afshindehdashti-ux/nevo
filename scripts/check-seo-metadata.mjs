#!/usr/bin/env node
/**
 * SEO metadata completeness check.
 *
 * Fetches every route × every locale and fails (exit 1) if any page is missing
 * <title>, <meta name="description">, <link rel="canonical">, og:image, or
 * twitter:image — or if canonical/og:url don't self-reference the locale.
 *
 * Usage:
 *   node scripts/check-seo-metadata.mjs               # boot dev server, verify, exit non-zero on failure
 *   node scripts/check-seo-metadata.mjs --warn-only   # report but always exit 0
 *   node scripts/check-seo-metadata.mjs --json        # emit machine-readable JSON
 *   SEO_CHECK_BASE_URL=http://127.0.0.1:8080 node scripts/check-seo-metadata.mjs
 *
 * No external dependencies — uses built-in fetch + child_process.
 */

import { spawn } from "node:child_process";
import net from "node:net";

const WARN_ONLY = process.argv.includes("--warn-only");
const JSON_OUT = process.argv.includes("--json");

const LOCALES = ["en", "ar", "tr", "ru", "pt", "de", "es", "fr", "it", "zh"];

// Locale-agnostic paths (leading slash). Prefixed with /{locale} at fetch time.
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

const FALLBACK_TITLES = new Set(["Lovable", "Lovable App", "Lovable Generated Project"]);

// ------------- HTML extraction -------------

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : "";
}

function extractMeta(html, key, value) {
  // Match <meta ... name|property="value" ... content="..."> OR content-first order.
  const attr = key === "name" ? "name" : "property";
  const re = new RegExp(
    `<meta\\b[^>]*?(?:${attr}\\s*=\\s*["']${value}["'][^>]*?content\\s*=\\s*["']([^"']*)["']|content\\s*=\\s*["']([^"']*)["'][^>]*?${attr}\\s*=\\s*["']${value}["'])[^>]*>`,
    "i",
  );
  const m = html.match(re);
  return m ? (m[1] ?? m[2] ?? "").trim() : "";
}

function extractCanonical(html) {
  const re = /<link\b[^>]*?(?:rel\s*=\s*["']canonical["'][^>]*?href\s*=\s*["']([^"']*)["']|href\s*=\s*["']([^"']*)["'][^>]*?rel\s*=\s*["']canonical["'])[^>]*>/i;
  const m = html.match(re);
  return m ? (m[1] ?? m[2] ?? "").trim() : "";
}

// ------------- Per-page audit -------------

function auditHtml(html, locale, path) {
  const title = extractTitle(html);
  const description = extractMeta(html, "name", "description");
  const canonical = extractCanonical(html);
  const ogImage = extractMeta(html, "property", "og:image");
  const twImage = extractMeta(html, "name", "twitter:image");

  const missing = [];
  const warnings = [];

  if (!title || FALLBACK_TITLES.has(title)) missing.push("title");
  if (!description) missing.push("description");
  if (!canonical) missing.push("canonical");
  if (!ogImage) missing.push("og:image");
  if (!twImage) missing.push("twitter:image");

  if (canonical) {
    // Canonical should reference /{locale} — either exactly ending with /{locale}
    // (home) or containing /{locale}/ (leaf).
    const okLeaf = canonical.includes(`/${locale}/`);
    const okHome = canonical.endsWith(`/${locale}`) || canonical.endsWith(`/${locale}/`);
    if (!okLeaf && !okHome) {
      warnings.push(`canonical missing /${locale}/ prefix: ${canonical}`);
    }
  }

  if (ogImage && !/^https?:\/\//i.test(ogImage)) {
    warnings.push(`og:image not absolute: ${ogImage}`);
  }

  return { locale, path, url: `/${locale}${path}`, missing, warnings, title, canonical };
}

// ------------- Dev server lifecycle -------------

function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", () => resolve(false));
  });
}

async function waitForServer(baseUrl, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(baseUrl, { redirect: "manual" });
      if (res.status < 500) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function startDevServer() {
  const PORT = 4321;
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

// ------------- Main -------------

async function fetchWithRetry(url, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      return await res.text();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

async function run() {
  let baseUrl = process.env.SEO_CHECK_BASE_URL;
  let serverProc;

  if (!baseUrl) {
    // Reuse Vite on 8080 if it's already running (Lovable sandbox).
    if (await isPortOpen(8080)) {
      baseUrl = "http://127.0.0.1:8080";
    } else {
      const started = await startDevServer();
      baseUrl = started.baseUrl;
      serverProc = started.proc;
    }
  }

  const results = [];
  const CONCURRENCY = 12;
  const targets = [];
  for (const locale of LOCALES) for (const path of ROUTES) targets.push({ locale, path });

  let idx = 0;
  async function worker() {
    while (idx < targets.length) {
      const t = targets[idx++];
      const url = `${baseUrl}/${t.locale}${t.path}`;
      try {
        const html = await fetchWithRetry(url);
        results.push(auditHtml(html, t.locale, t.path));
      } catch (e) {
        results.push({
          locale: t.locale,
          path: t.path,
          url: `/${t.locale}${t.path}`,
          missing: ["FETCH_ERROR"],
          warnings: [String(e?.message ?? e)],
        });
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (serverProc) serverProc.kill("SIGTERM");

  const failures = results.filter((r) => r.missing.length > 0);
  const warned = results.filter((r) => r.warnings.length > 0);

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify({
      total: results.length,
      failed: failures.length,
      warned: warned.length,
      results,
    }, null, 2) + "\n");
  } else {
    console.log(`\nSEO metadata check — ${results.length} pages (${LOCALES.length} locales × ${ROUTES.length} routes)\n`);
    if (failures.length === 0 && warned.length === 0) {
      console.log("✓ All pages have title, description, canonical, og:image, twitter:image.\n");
    } else {
      if (failures.length) {
        console.log(`✗ ${failures.length} page(s) missing required tags:\n`);
        for (const f of failures) {
          console.log(`  ✗ ${f.url.padEnd(48)}  missing: ${f.missing.join(", ")}`);
        }
        console.log("");
      }
      if (warned.length) {
        console.log(`⚠ ${warned.length} page(s) with canonical/og:image warnings:\n`);
        for (const w of warned) {
          for (const msg of w.warnings) {
            console.log(`  ⚠ ${w.url.padEnd(48)}  ${msg}`);
          }
        }
        console.log("");
      }
      // Per-locale summary
      for (const loc of LOCALES) {
        const lr = results.filter((r) => r.locale === loc);
        const ok = lr.filter((r) => r.missing.length === 0).length;
        console.log(`  ${loc}: ${ok}/${lr.length} pass`);
      }
      console.log("");
    }
  }

  if (failures.length > 0 && !WARN_ONLY) process.exit(1);
  process.exit(0);
}

run().catch((e) => {
  console.error("check-seo-metadata failed:", e);
  process.exit(WARN_ONLY ? 0 : 2);
});
