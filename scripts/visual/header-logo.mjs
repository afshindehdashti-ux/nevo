#!/usr/bin/env node
/**
 * Lightweight visual regression test for the mobile sticky header logo.
 *
 * Captures three element screenshots on a mobile viewport:
 *   1. initial page load (transparent header over hero)
 *   2. after scrolling (solid sticky header)
 *   3. with the mobile menu open (menu overlay logo)
 *
 * Modes:
 *   node scripts/visual/header-logo.mjs                 # compare vs baseline
 *   node scripts/visual/header-logo.mjs --update        # (re)write baselines
 *
 * Options:
 *   --url=<http://...>       target URL (default http://localhost:8080)
 *   --threshold=<0-1>        max mean per-channel diff (default 0.02 = 2%)
 *   --engine=chromium|webkit browser engine (default chromium)
 *
 * Exit codes: 0 pass, 1 pixel-diff regression, 2 harness error.
 */
import { chromium, webkit } from "playwright";
import { PNG } from "pngjs";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const BASELINE_DIR = join(ROOT, "tests", "visual", "baseline");
const DIFF_DIR = join(ROOT, "tests", "visual", "diff");

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  }),
);
const UPDATE = args.get("update") === "true";
const URL = args.get("url") ?? "http://localhost:8080";
const THRESHOLD = Number(args.get("threshold") ?? "0.02");
const ENGINE = args.get("engine") ?? "chromium";

mkdirSync(BASELINE_DIR, { recursive: true });
mkdirSync(DIFF_DIR, { recursive: true });

const LOGO_SELECTOR = 'img[alt="NEVO Industrial"]';

async function captureStates() {
  const launcher = ENGINE === "webkit" ? webkit : chromium;
  const launchOpts = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    launchOpts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  const browser = await launcher.launch(launchOpts);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(LOGO_SELECTOR, { state: "visible", timeout: 8000 });
  await page.waitForTimeout(800);

  const shots = {};

  // 1. Initial (transparent header)
  shots.initial = await page.locator(LOGO_SELECTOR).first().screenshot();

  // 2. Scrolled (solid sticky header)
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(500);
  shots.scrolled = await page.locator(LOGO_SELECTOR).first().screenshot();

  // 3. Menu open — the visible logo is the mobile-menu overlay's logo
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const menuBtn = page.locator('header button[aria-label*="menu" i]').first();
  await menuBtn.click();
  await page.waitForTimeout(500);
  // Prefer a logo inside a dialog/overlay if present, else fall back to first
  const overlayLogo = page.locator(
    `[role="dialog"] ${LOGO_SELECTOR}, [data-mobile-menu] ${LOGO_SELECTOR}`,
  );
  const menuLogo = (await overlayLogo.count())
    ? overlayLogo.first()
    : page.locator(LOGO_SELECTOR).last();
  shots.menuOpen = await menuLogo.screenshot();

  await browser.close();
  return shots;
}

/** Mean per-channel absolute difference, 0–1. Returns Infinity if size differs. */
function pixelDiff(aBuf, bBuf) {
  const a = PNG.sync.read(aBuf);
  const b = PNG.sync.read(bBuf);
  if (a.width !== b.width || a.height !== b.height) return { diff: Infinity, a, b };
  let total = 0;
  const n = a.data.length;
  for (let i = 0; i < n; i += 4) {
    total += Math.abs(a.data[i] - b.data[i]);
    total += Math.abs(a.data[i + 1] - b.data[i + 1]);
    total += Math.abs(a.data[i + 2] - b.data[i + 2]);
  }
  const diff = total / ((n / 4) * 3 * 255);
  return { diff, a, b };
}

function writeDiffImage(a, b, outPath) {
  const { width, height } = a;
  const out = new PNG({ width, height });
  for (let i = 0; i < a.data.length; i += 4) {
    const d =
      Math.abs(a.data[i] - b.data[i]) +
      Math.abs(a.data[i + 1] - b.data[i + 1]) +
      Math.abs(a.data[i + 2] - b.data[i + 2]);
    const v = Math.min(255, d);
    out.data[i] = v;
    out.data[i + 1] = 0;
    out.data[i + 2] = 0;
    out.data[i + 3] = 255;
  }
  writeFileSync(outPath, PNG.sync.write(out));
}

async function main() {
  const shots = await captureStates();
  const states = Object.keys(shots);
  let failed = 0;

  for (const state of states) {
    const baseFile = join(BASELINE_DIR, `header-logo-${state}.png`);
    const shot = shots[state];

    if (UPDATE || !existsSync(baseFile)) {
      writeFileSync(baseFile, shot);
      console.log(`  ✎ baseline written: header-logo-${state}.png`);
      continue;
    }

    const baseline = readFileSync(baseFile);
    const { diff, a, b } = pixelDiff(baseline, shot);
    const pct = (diff * 100).toFixed(3);

    if (diff > THRESHOLD) {
      failed++;
      const diffPath = join(DIFF_DIR, `header-logo-${state}.diff.png`);
      const actualPath = join(DIFF_DIR, `header-logo-${state}.actual.png`);
      writeFileSync(actualPath, shot);
      if (Number.isFinite(diff)) writeDiffImage(a, b, diffPath);
      console.log(
        `  ✗ ${state}: ${pct}% mean channel diff (> ${(THRESHOLD * 100).toFixed(1)}%) → ${diffPath}`,
      );
    } else {
      console.log(`  ✓ ${state}: ${pct}% mean channel diff`);
    }
  }

  if (failed > 0) {
    console.error(
      `\nVisual regression: ${failed}/${states.length} state(s) exceeded threshold.`,
    );
    console.error("Review diffs in tests/visual/diff/ then rerun with --update if intentional.");
    process.exit(1);
  }
  console.log(`\nAll ${states.length} header-logo states within tolerance.`);
}

main().catch((err) => {
  console.error("visual-test harness error:", err);
  process.exit(2);
});
