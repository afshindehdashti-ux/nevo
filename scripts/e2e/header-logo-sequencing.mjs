#!/usr/bin/env node
/**
 * End-to-end test: header logo telemetry sequencing.
 *
 * Forces the primary PNG + CDN fallback image loads to fail, then asserts
 * that the client-monitor forwards a well-ordered header.logo.* sequence
 * to /api/public/client-log:
 *
 *   1. header.logo.error   stage=primary-light-png    (non-terminal)
 *   2. header.logo.error   stage=fallback-cdn-full    (non-terminal)
 *   3. header.logo.render  variant=fallback-inline-svg (terminal render)
 *
 * The test verifies:
 *   - all three events reach /api/public/client-log
 *   - they arrive in the exact stage/variant order above
 *   - their client timestamps (extra.ts / extra.clientTs) are monotonic
 *   - no render event fires BEFORE the two error stages
 *   - a single correlationId is shared across the sequence
 *   - each POST is HTTP 2xx (server accepts the batch)
 *
 * Run:
 *   node scripts/e2e/header-logo-sequencing.mjs
 *   node scripts/e2e/header-logo-sequencing.mjs --url=http://localhost:8080
 *
 * Exit codes: 0 pass, 1 assertion failure, 2 harness error.
 */
import { chromium } from "playwright";

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  }),
);
const URL = args.get("url") ?? "http://localhost:8080";

/** @type {Array<{ entry: any; receivedAt: number }>} */
const loggedEntries = [];
/** @type {Array<{ status: number; count: number; at: number }>} */
const postResponses = [];
const failures = [];
const assert = (cond, msg) => {
  if (!cond) failures.push(msg);
};

let browser;
try {
  const launchOpts = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    launchOpts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  browser = await chromium.launch(launchOpts);
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  // Fail every nevo-logo raster load so the fallback chain runs to completion.
  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();
    if (req.resourceType() === "image" && /nevo-logo/i.test(url) && !url.startsWith("data:")) {
      await route.abort("failed");
      return;
    }
    await route.continue();
  });

  // Capture every telemetry batch POSTed by the client monitor, in wall-clock
  // arrival order. We tag each entry with its batch's receivedAt so we can
  // fall back to arrival order if the entry itself lacks a timestamp.
  page.on("request", (req) => {
    if (req.method() !== "POST") return;
    if (!req.url().includes("/api/public/client-log")) return;
    try {
      const body = req.postData();
      if (!body) return;
      const parsed = JSON.parse(body);
      if (!Array.isArray(parsed?.entries)) return;
      const receivedAt = Date.now();
      for (const entry of parsed.entries) loggedEntries.push({ entry, receivedAt });
    } catch {
      /* ignore malformed batches */
    }
  });

  // Confirm the server accepts each batch (HTTP 2xx).
  page.on("response", async (res) => {
    if (res.request().method() !== "POST") return;
    if (!res.url().includes("/api/public/client-log")) return;
    let count = 0;
    try {
      const body = res.request().postData();
      if (body) {
        const parsed = JSON.parse(body);
        if (Array.isArray(parsed?.entries)) count = parsed.entries.length;
      }
    } catch {
      /* ignore */
    }
    postResponses.push({ status: res.status(), count, at: Date.now() });
  });

  await page.goto(URL, { waitUntil: "domcontentloaded" });

  // The SSR-rendered <img> starts loading before React hydrates, so the
  // initial error can miss React's onError. Wait for hydration, then poke
  // src to trigger a fresh load that React observes and drives through
  // the fallback cascade.
  const logo = page.locator('[data-testid="header-logo"]').first();
  await logo.waitFor({ state: "attached", timeout: 15_000 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const img = document.querySelector('[data-testid="header-logo"]');
    if (!(img instanceof HTMLImageElement)) return;
    const src = img.src;
    img.src = "";
    img.src = src;
  });

  // Wait until the DOM reflects the terminal SVG fallback.
  const deadline = Date.now() + 15_000;
  let lastState = null;
  while (Date.now() < deadline) {
    lastState = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="header-logo"]');
      if (!(el instanceof HTMLImageElement)) return null;
      return {
        variant: el.dataset.logoVariant,
        step: el.dataset.fallbackStep,
        currentSrc: el.currentSrc,
        complete: el.complete,
        naturalWidth: el.naturalWidth,
      };
    });
    if (
      lastState &&
      lastState.variant === "fallback-svg" &&
      lastState.currentSrc.startsWith("data:image/svg+xml") &&
      lastState.complete &&
      lastState.naturalWidth > 0
    )
      break;
    await page.waitForTimeout(250);
  }
  if (!lastState || lastState.variant !== "fallback-svg") {
    console.error("Logo never reached SVG fallback. Last observed:", lastState);
    throw new Error("logo fallback chain did not complete");
  }

  // Force a flush so the batch is not still buffered in the client monitor.
  // The monitor listens for visibilitychange=hidden and pagehide as beacon
  // triggers; toggling visibility flushes without navigating away.
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  // Also wait past the 5s batch timer as a belt-and-suspenders.
  await page.waitForTimeout(6500);

  // ---- Assertions -------------------------------------------------------

  const logoEvents = loggedEntries.filter(
    ({ entry }) =>
      entry?.message === "header.logo.error" || entry?.message === "header.logo.render",
  );

  // 1) Every POST that carried a batch was accepted by the server.
  const badPost = postResponses.find((r) => r.status < 200 || r.status >= 300);
  assert(!badPost, `all /api/public/client-log POSTs must be 2xx (got ${badPost?.status})`);
  assert(postResponses.length > 0, "expected at least one /api/public/client-log POST");

  // 2) The three expected events exist.
  const idxPrimary = logoEvents.findIndex(
    ({ entry }) =>
      entry.message === "header.logo.error" && entry.extra?.stage === "primary-light-png",
  );
  const idxCdn = logoEvents.findIndex(
    ({ entry }) =>
      entry.message === "header.logo.error" && entry.extra?.stage === "fallback-cdn-full",
  );
  const idxRender = logoEvents.findIndex(
    ({ entry }) =>
      entry.message === "header.logo.render" && entry.extra?.variant === "fallback-inline-svg",
  );
  assert(idxPrimary !== -1, "expected header.logo.error stage=primary-light-png");
  assert(idxCdn !== -1, "expected header.logo.error stage=fallback-cdn-full");
  assert(idxRender !== -1, "expected header.logo.render variant=fallback-inline-svg");

  // 3) Per-stage sequencing: primary error → cdn error → svg render.
  if (idxPrimary !== -1 && idxCdn !== -1 && idxRender !== -1) {
    assert(
      idxPrimary < idxCdn,
      `primary-light-png (idx=${idxPrimary}) must precede fallback-cdn-full (idx=${idxCdn})`,
    );
    assert(
      idxCdn < idxRender,
      `fallback-cdn-full (idx=${idxCdn}) must precede terminal render (idx=${idxRender})`,
    );

    // 4) No terminal render was emitted BEFORE the errors — guards against
    //    a race where the SVG fallback logs before the failed stages.
    const earlyRender = logoEvents
      .slice(0, idxPrimary)
      .some(({ entry }) => entry.message === "header.logo.render");
    assert(!earlyRender, "no render event may fire before the first error stage");

    // 5) Monotonic client timestamps. Client-log entries carry `ts` (ISO)
    //    from the monitor plus `extra.clientTs` from the logo emitter; use
    //    whichever is present, falling back to arrival wall clock.
    const tsOf = (rec) => {
      const e = rec.entry;
      const raw = e?.extra?.clientTs ?? e?.ts ?? rec.receivedAt;
      const n = typeof raw === "number" ? raw : Date.parse(String(raw));
      return Number.isFinite(n) ? n : rec.receivedAt;
    };
    const tPrimary = tsOf(logoEvents[idxPrimary]);
    const tCdn = tsOf(logoEvents[idxCdn]);
    const tRender = tsOf(logoEvents[idxRender]);
    assert(tPrimary <= tCdn, `timestamps must be monotonic: primary(${tPrimary}) <= cdn(${tCdn})`);
    assert(tCdn <= tRender, `timestamps must be monotonic: cdn(${tCdn}) <= render(${tRender})`);

    // 6) Shared correlationId across the whole sequence.
    const cid = logoEvents[idxRender].entry.extra?.correlationId;
    assert(typeof cid === "string" && cid.length > 0, "render event must include correlationId");
    assert(
      logoEvents[idxPrimary].entry.extra?.correlationId === cid,
      "primary error correlationId must match render",
    );
    assert(
      logoEvents[idxCdn].entry.extra?.correlationId === cid,
      "cdn error correlationId must match render",
    );

    // 7) Extra fields the ingest / DB schema depends on are present.
    for (const [label, rec] of [
      ["primary", logoEvents[idxPrimary]],
      ["cdn", logoEvents[idxCdn]],
      ["render", logoEvents[idxRender]],
    ]) {
      const ex = rec.entry.extra ?? {};
      assert(
        typeof ex.stage === "string" || label === "render",
        `${label} entry must have extra.stage`,
      );
      assert(typeof ex.correlationId === "string", `${label} entry must have extra.correlationId`);
    }
  }

  await browser.close();

  if (failures.length) {
    console.error("❌ header-logo-sequencing e2e failed:");
    for (const f of failures) console.error("  - " + f);
    console.error("\nCollected logo events (in arrival order):");
    console.error(
      JSON.stringify(
        logoEvents.map((r) => r.entry),
        null,
        2,
      ),
    );
    console.error("\nPOST responses:");
    console.error(JSON.stringify(postResponses, null, 2));
    process.exit(1);
  }

  console.log("✅ header-logo-sequencing e2e passed");
  console.log(
    `   batches=${postResponses.length} entries=${loggedEntries.length} logo-events=${logoEvents.length}`,
  );
  console.log(`   order: primary-light-png → fallback-cdn-full → fallback-inline-svg`);
} catch (err) {
  console.error("Harness error:", err);
  if (browser) await browser.close().catch(() => {});
  process.exit(2);
}
