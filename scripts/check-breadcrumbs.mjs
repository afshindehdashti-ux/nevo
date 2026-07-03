#!/usr/bin/env node
/**
 * BreadcrumbList JSON-LD validator for Solutions routes.
 *
 * Fetches each Solutions page (all locales), extracts every
 * <script type="application/ld+json">, and validates any
 * BreadcrumbList schema against Google's requirements:
 *   - @context = https://schema.org (or http://…)
 *   - @type    = BreadcrumbList
 *   - itemListElement is a non-empty array
 *   - each entry is @type ListItem with numeric position starting at 1
 *     and monotonically increasing
 *   - each entry has non-empty name and absolute http(s):// item URL
 *   - at least one BreadcrumbList exists per page
 *
 * Exits 1 on any failure, 0 on success. --warn-only always exits 0.
 * --json emits a machine-readable report.
 *
 * Usage:
 *   node scripts/check-breadcrumbs.mjs
 *   node scripts/check-breadcrumbs.mjs --warn-only
 *   node scripts/check-breadcrumbs.mjs --json
 *   SEO_CHECK_BASE_URL=https://nevo-engineering-hub.lovable.app node scripts/check-breadcrumbs.mjs
 */

import { spawn } from "node:child_process";
import net from "node:net";

const WARN_ONLY = process.argv.includes("--warn-only");
const JSON_OUT = process.argv.includes("--json");

const LOCALES = ["en", "ar", "tr", "ru", "pt", "de", "es", "fr", "it", "zh"];

const SOLUTIONS_ROUTES = [
  "/solutions",
  "/solutions/sandwich-panels",
  "/solutions/production-lines",
  "/solutions/raw-materials",
  "/solutions/factory-development",
  "/solutions/engineering-consultancy",
];

// ------------- JSON-LD extraction -------------

function extractJsonLdBlocks(html) {
  const blocks = [];
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const it of items) blocks.push(it);
    } catch (e) {
      blocks.push({ __parseError: String(e?.message ?? e), __raw: raw.slice(0, 200) });
    }
  }
  return blocks;
}

function isAbsoluteHttp(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

function validateBreadcrumb(bc) {
  const errors = [];
  const ctx = bc["@context"];
  if (ctx !== "https://schema.org" && ctx !== "http://schema.org") {
    errors.push(`@context must be https://schema.org (got ${JSON.stringify(ctx)})`);
  }
  if (bc["@type"] !== "BreadcrumbList") {
    errors.push(`@type must be BreadcrumbList (got ${JSON.stringify(bc["@type"])})`);
  }
  const items = bc.itemListElement;
  if (!Array.isArray(items) || items.length === 0) {
    errors.push("itemListElement must be a non-empty array");
    return errors;
  }
  let expectedPos = 1;
  items.forEach((li, i) => {
    const label = `itemListElement[${i}]`;
    if (!li || typeof li !== "object") { errors.push(`${label} not an object`); return; }
    if (li["@type"] !== "ListItem") errors.push(`${label}.@type must be ListItem`);
    if (typeof li.position !== "number" || !Number.isFinite(li.position)) {
      errors.push(`${label}.position must be a number`);
    } else if (li.position !== expectedPos) {
      errors.push(`${label}.position must be ${expectedPos} (got ${li.position})`);
    }
    expectedPos = (typeof li.position === "number" ? li.position : expectedPos) + 1;
    if (typeof li.name !== "string" || !li.name.trim()) {
      errors.push(`${label}.name must be a non-empty string`);
    }
    // item is required except optionally on the last entry (Google allows omitting).
    const isLast = i === items.length - 1;
    if (li.item == null) {
      if (!isLast) errors.push(`${label}.item required except on last entry`);
    } else {
      const url = typeof li.item === "string" ? li.item : li.item?.["@id"];
      if (!isAbsoluteHttp(url)) {
        errors.push(`${label}.item must be an absolute http(s) URL (got ${JSON.stringify(li.item)})`);
      }
    }
  });
  return errors;
}

function auditPage(html, locale, path) {
  const blocks = extractJsonLdBlocks(html);
  const parseErrors = blocks.filter((b) => b.__parseError).map((b) => b.__parseError);
  const breadcrumbs = blocks.filter((b) => b["@type"] === "BreadcrumbList");

  const failures = [];
  if (parseErrors.length) failures.push(`JSON parse errors: ${parseErrors.join("; ")}`);
  if (breadcrumbs.length === 0) failures.push("no BreadcrumbList JSON-LD found");

  breadcrumbs.forEach((bc, i) => {
    const errs = validateBreadcrumb(bc);
    for (const e of errs) failures.push(`BreadcrumbList[${i}]: ${e}`);
  });

  return {
    url: `/${locale}${path}`,
    locale,
    path,
    breadcrumbCount: breadcrumbs.length,
    failures,
  };
}

// ------------- Dev server lifecycle (mirrors check-seo-metadata) -------------

function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const s = net.createConnection({ port, host });
    s.once("connect", () => { s.destroy(); resolve(true); });
    s.once("error", () => resolve(false));
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
  if (!ok) { proc.kill("SIGTERM"); throw new Error(`Dev server on ${baseUrl} did not become ready`); }
  return { baseUrl, proc };
}

async function fetchWithRetry(url, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" },
      });
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
    if (await isPortOpen(8080)) {
      baseUrl = "http://127.0.0.1:8080";
    } else {
      const started = await startDevServer();
      baseUrl = started.baseUrl;
      serverProc = started.proc;
    }
  }

  const targets = [];
  for (const locale of LOCALES) for (const path of SOLUTIONS_ROUTES) targets.push({ locale, path });

  const results = [];
  const CONCURRENCY = 8;
  let idx = 0;
  async function worker() {
    while (idx < targets.length) {
      const t = targets[idx++];
      const url = `${baseUrl}/${t.locale}${t.path}`;
      try {
        const html = await fetchWithRetry(url);
        results.push(auditPage(html, t.locale, t.path));
      } catch (e) {
        results.push({
          url: `/${t.locale}${t.path}`,
          locale: t.locale,
          path: t.path,
          breadcrumbCount: 0,
          failures: [`FETCH_ERROR: ${e?.message ?? e}`],
        });
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (serverProc) serverProc.kill("SIGTERM");

  results.sort((a, b) => a.url.localeCompare(b.url));
  const failed = results.filter((r) => r.failures.length > 0);

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify({
      base: baseUrl,
      total: results.length,
      failed: failed.length,
      results,
    }, null, 2) + "\n");
  } else {
    console.log(`\nBreadcrumbList JSON-LD check — ${results.length} pages ` +
      `(${LOCALES.length} locales × ${SOLUTIONS_ROUTES.length} Solutions routes) @ ${baseUrl}\n`);
    if (failed.length === 0) {
      console.log(`✓ All ${results.length} pages have a valid BreadcrumbList with absolute URLs.\n`);
    } else {
      console.log(`✗ ${failed.length} page(s) failed:\n`);
      for (const f of failed) {
        console.log(`  ✗ ${f.url}`);
        for (const msg of f.failures) console.log(`      ${msg}`);
      }
      console.log("");
    }
  }

  if (failed.length > 0 && !WARN_ONLY) process.exit(1);
  process.exit(0);
}

run().catch((e) => {
  console.error("check-breadcrumbs failed:", e);
  process.exit(WARN_ONLY ? 0 : 2);
});
