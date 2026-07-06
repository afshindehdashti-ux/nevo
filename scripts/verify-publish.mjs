#!/usr/bin/env node
/**
 * Automated publish verification.
 *
 * Polls the production URL (and /api/public/health) after a publish to
 * confirm the new build is live. Retries with exponential backoff and
 * exits non-zero on persistent failure so CI / scripts can react.
 *
 * Usage:
 *   node scripts/verify-publish.mjs
 *   node scripts/verify-publish.mjs --url https://nevo-engineering-hub.lovable.app
 *   node scripts/verify-publish.mjs --url https://example.com --attempts 20 --interval 15
 */

const DEFAULT_URL = process.env.PUBLISH_URL || "https://nevo-engineering-hub.lovable.app";
const DEFAULT_ATTEMPTS = Number(process.env.PUBLISH_ATTEMPTS || 12);
const DEFAULT_INTERVAL = Number(process.env.PUBLISH_INTERVAL || 15); // seconds
const HEALTH_PATH = "/api/public/health";

function parseArgs(argv) {
  const args = { url: DEFAULT_URL, attempts: DEFAULT_ATTEMPTS, interval: DEFAULT_INTERVAL };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") args.url = argv[++i];
    else if (a === "--attempts") args.attempts = Number(argv[++i]);
    else if (a === "--interval") args.interval = Number(argv[++i]);
    else if (a === "--help" || a === "-h") {
      console.log("Usage: verify-publish.mjs [--url URL] [--attempts N] [--interval SECONDS]");
      process.exit(0);
    }
  }
  return args;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "nevo-publish-verifier/1.0" },
    });
    const body = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, body: body.slice(0, 500), finalUrl: res.url };
  } catch (err) {
    return { ok: false, status: 0, body: "", error: err?.message || String(err) };
  } finally {
    clearTimeout(t);
  }
}

function classify(result, expectJson = false) {
  if (result.status === 0) return `network error: ${result.error}`;
  if (result.status === 404) return "404 Not Found — build likely not yet deployed";
  if (result.status === 307 || result.status === 308)
    return `${result.status} redirect — old build still cached`;
  if (result.status >= 500) return `${result.status} server error`;
  if (!result.ok) return `${result.status} unexpected status`;
  if (expectJson) {
    try {
      const j = JSON.parse(result.body);
      if (!j.ok) return "health endpoint returned ok:false";
    } catch {
      return "health endpoint did not return JSON";
    }
  }
  return null;
}

async function verifyOnce(baseUrl) {
  const [root, health] = await Promise.all([
    probe(baseUrl),
    probe(baseUrl.replace(/\/$/, "") + HEALTH_PATH),
  ]);
  const rootErr = classify(root);
  const healthErr = classify(health, true);
  return { root, health, rootErr, healthErr, ok: !rootErr && !healthErr };
}

async function main() {
  const { url, attempts, interval } = parseArgs(process.argv.slice(2));
  const base = url.replace(/\/$/, "");
  console.log(`[verify-publish] target=${base} attempts=${attempts} interval=${interval}s`);

  const failures = [];
  for (let i = 1; i <= attempts; i++) {
    const t0 = Date.now();
    const r = await verifyOnce(base);
    const dt = Date.now() - t0;
    if (r.ok) {
      console.log(
        `[verify-publish] ✅ attempt ${i}/${attempts} — root=${r.root.status} health=${r.health.status} (${dt}ms)`,
      );
      console.log(`[verify-publish] health body: ${r.health.body.trim()}`);
      console.log("[verify-publish] production is live and responding.");
      process.exit(0);
    }
    const msg = [r.rootErr && `root: ${r.rootErr}`, r.healthErr && `health: ${r.healthErr}`]
      .filter(Boolean)
      .join(" | ");
    failures.push({ attempt: i, msg });
    console.warn(`[verify-publish] ⚠️  attempt ${i}/${attempts} failed — ${msg}`);
    if (i < attempts) {
      const wait = Math.min(interval * 1000 * Math.pow(1.2, i - 1), 60_000);
      await sleep(wait);
    }
  }

  console.error("[verify-publish] ❌ production did not respond correctly after all retries.");
  console.error("[verify-publish] failure summary:");
  for (const f of failures.slice(-5)) console.error(`  #${f.attempt}: ${f.msg}`);
  console.error("[verify-publish] next steps:");
  console.error("  1. Confirm the publish finished (Publish → Update in Lovable).");
  console.error("  2. Re-run: node scripts/verify-publish.mjs");
  console.error(`  3. Manually check: curl -i ${base}${HEALTH_PATH}`);
  process.exit(1);
}

main().catch((err) => {
  console.error("[verify-publish] fatal:", err);
  process.exit(2);
});
