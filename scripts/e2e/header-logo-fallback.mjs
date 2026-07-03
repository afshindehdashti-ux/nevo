#!/usr/bin/env node
/**
 * End-to-end test: force the primary header logo (and its CDN fallback) to
 * fail loading, then verify that:
 *
 *   1. The <img data-testid="header-logo"> ends up rendering the inline SVG
 *      data URI (the terminal fallback) with data-logo-variant="fallback-svg".
 *   2. The inline SVG actually decodes (naturalWidth > 0) so the sticky
 *      header stays visually readable.
 *   3. The client telemetry batch POSTed to /api/public/client-log contains:
 *        - a header.logo.error with stage "primary-light-png"
 *        - a header.logo.error with stage "fallback-cdn-full"
 *        - a terminal header.logo.render with variant "fallback-inline-svg"
 *      All three sharing the same correlationId.
 *
 * Run:
 *   node scripts/e2e/header-logo-fallback.mjs
 *   node scripts/e2e/header-logo-fallback.mjs --url=http://localhost:8080
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

/** @type {Array<{ level: string; message: string; extra?: any }>} */
const loggedEntries = [];
const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

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

  // 1) Force every image request for the NEVO logo raster (primary bundled
  //    PNG + CDN fallback pointer) to fail. Only abort actual image loads —
  //    Vite's `?import` JS module requests share the same path and must be
  //    served normally or the whole SiteHeader chunk fails to load.
  //    The inline SVG is a data: URI so it is never a network request.
  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();
    if (req.resourceType() === "image" && /nevo-logo/i.test(url) && !url.startsWith("data:")) {
      await route.abort("failed");
      return;
    }
    await route.continue();
  });

  // 2) Capture every telemetry batch POSTed by the client monitor so we can
  //    assert on the events the header emits during the fallback chain.
  page.on("request", (req) => {
    if (req.method() !== "POST") return;
    if (!req.url().includes("/api/public/client-log")) return;
    try {
      const body = req.postData();
      if (!body) return;
      const parsed = JSON.parse(body);
      if (Array.isArray(parsed?.entries)) loggedEntries.push(...parsed.entries);
    } catch {
      /* ignore malformed batches */
    }
  });

  await page.goto(URL, { waitUntil: "domcontentloaded" });

  // Wait for the fallback chain to run to completion. The image's onError
  // handler synchronously reassigns .src twice; by the time the data: URI
  // decodes, data-logo-variant must be "fallback-svg".
  const logo = page.locator('[data-testid="header-logo"]').first();
  await logo.waitFor({ state: "attached", timeout: 15_000 });

  // The SSR-served HTML starts loading the <img> before React hydrates, so
  // the initial load error fires *before* React attaches its onError
  // listener and gets dropped. Wait for hydration, then re-poke the src to
  // trigger a fresh (still-intercepted) request that React can observe.
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const img = document.querySelector('[data-testid="header-logo"]');
    if (!(img instanceof HTMLImageElement)) return;
    const src = img.src;
    img.removeAttribute("src");
    img.src = src;
  });


  await page.waitForFunction(
    () => {
      const el = document.querySelector('[data-testid="header-logo"]');
      if (!(el instanceof HTMLImageElement)) return false;
      return el.dataset.logoVariant === "fallback-svg"
        && el.currentSrc.startsWith("data:image/svg+xml")
        && el.complete
        && el.naturalWidth > 0;
    },
    null,
    { timeout: 15_000 },
  );


  const state = await logo.evaluate((el) => {
    const img = /** @type {HTMLImageElement} */ (el);
    return {
      variant: img.dataset.logoVariant,
      fallbackStep: img.dataset.fallbackStep,
      currentSrc: img.currentSrc,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      visible: img.getBoundingClientRect().width > 0,
    };
  });

  assert(state.variant === "fallback-svg", `logo variant should be fallback-svg, got ${state.variant}`);
  assert(state.fallbackStep === "2", `fallback step should be 2, got ${state.fallbackStep}`);
  assert(state.currentSrc.startsWith("data:image/svg+xml"), "logo src should be inline SVG data URI");
  assert(state.naturalWidth > 0 && state.naturalHeight > 0, "inline SVG must decode with non-zero dimensions");
  assert(state.visible, "logo must remain visibly laid out after fallback");

  // Flush any pending telemetry batch (client-monitor batches with a small
  // debounce, so nudge a visibility change to force a beacon flush).
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(1500);

  const logoEvents = loggedEntries.filter(
    (e) => e?.message === "header.logo.error" || e?.message === "header.logo.render",
  );
  const errPrimary = logoEvents.find(
    (e) => e.message === "header.logo.error" && e.extra?.stage === "primary-light-png",
  );
  const errCdn = logoEvents.find(
    (e) => e.message === "header.logo.error" && e.extra?.stage === "fallback-cdn-full",
  );
  const renderSvg = logoEvents.find(
    (e) => e.message === "header.logo.render" && e.extra?.variant === "fallback-inline-svg",
  );

  assert(!!errPrimary, "expected header.logo.error with stage=primary-light-png");
  assert(!!errCdn, "expected header.logo.error with stage=fallback-cdn-full");
  assert(!!renderSvg, "expected header.logo.render with variant=fallback-inline-svg");

  if (errPrimary && errCdn && renderSvg) {
    const cid = renderSvg.extra?.correlationId;
    assert(typeof cid === "string" && cid.length > 0, "render event must include correlationId");
    assert(errPrimary.extra?.correlationId === cid, "primary error correlationId must match render");
    assert(errCdn.extra?.correlationId === cid, "cdn error correlationId must match render");
  }

  await browser.close();

  if (failures.length) {
    console.error("❌ header-logo-fallback e2e failed:");
    for (const f of failures) console.error("  - " + f);
    console.error("\nCollected logo events:");
    console.error(JSON.stringify(logoEvents, null, 2));
    console.error("\nLogo DOM state:");
    console.error(JSON.stringify(state, null, 2));
    process.exit(1);
  }

  console.log("✅ header-logo-fallback e2e passed");
  console.log(`   variant=${state.variant} step=${state.fallbackStep} natural=${state.naturalWidth}x${state.naturalHeight}`);
  console.log(`   events: primary-fail=✓ cdn-fail=✓ svg-render=✓ (cid=${renderSvg.extra?.correlationId})`);
} catch (err) {
  console.error("Harness error:", err);
  if (browser) await browser.close().catch(() => {});
  process.exit(2);
}
