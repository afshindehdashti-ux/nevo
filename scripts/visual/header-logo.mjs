#!/usr/bin/env node
/**
 * Visual regression test for the mobile sticky header logo.
 *
 * Purpose: catch color regressions where the white NEVO wordmark or the green
 * accent (triangle + "INDUSTRIAL") disappear from the logo — the exact class
 * of bug that was fixed previously (white ink washed out to gray/invisible on
 * a dark header).
 *
 * Strategy: capture an element screenshot of the logo in three states, then
 * verify the color signature of each shot — count "white" pixels (bright,
 * near-neutral) and "NEVO green" pixels (mid-lightness green hue). If either
 * count drops below its floor, the logo is failing visually and the test
 * fails with a saved artifact for inspection.
 *
 * This is intentionally more robust than pixel-exact diffing: it doesn't
 * false-alarm on hero image re-compression or menu animation timing, but it
 * DOES fail loudly if the logo colors ever change.
 *
 * Usage:
 *   npm run test:visual                         # assert + save shots
 *   node scripts/visual/header-logo.mjs --engine=webkit
 *
 * Options:
 *   --url=<http://...>       target URL (default http://localhost:8080)
 *   --engine=chromium|webkit browser engine (default chromium)
 *
 * Exit codes: 0 pass, 1 color regression, 2 harness error.
 */
import { chromium, webkit } from "playwright";
import { PNG } from "pngjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const SHOTS_DIR = join(ROOT, "tests", "visual", "snapshots");
mkdirSync(SHOTS_DIR, { recursive: true });

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  }),
);
const URL = args.get("url") ?? "http://localhost:8080";
const ENGINE = args.get("engine") ?? "chromium";

const LOGO_SELECTOR = 'img[alt="NEVO Industrial"]';

async function captureStates() {
  const launcher = ENGINE === "webkit" ? webkit : chromium;
  const launchOpts = { headless: true };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH && ENGINE === "chromium") {
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
  shots.initial = await page.locator(LOGO_SELECTOR).first().screenshot();

  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(600);
  shots.scrolled = await page.locator(LOGO_SELECTOR).first().screenshot();

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const menuBtn = page.locator('header button[aria-label*="menu" i]').first();
  await menuBtn.click();
  await page.waitForTimeout(600);
  // Pick the first NEVO logo that is actually inside the current viewport
  // (mobile menu overlay renders its own logo at the top of the panel).
  const menuLogo = page.locator(LOGO_SELECTOR).filter({
    hasNot: page.locator(":scope:not(:visible)"),
  });
  const handles = await menuLogo.elementHandles();
  let target = null;
  for (const h of handles) {
    const box = await h.boundingBox();
    if (box && box.y >= 0 && box.y < 200 && box.width > 60) {
      target = h;
      break;
    }
  }
  if (!target) throw new Error("No visible menu-open logo found in viewport");
  shots.menuOpen = await target.screenshot();

  await browser.close();
  return shots;
}

/**
 * Analyse a logo screenshot and return the fraction of pixels that are
 * "white ink" (bright + neutral) and "NEVO green" (green hue in mid range).
 * Alpha 0 pixels are ignored so anti-aliasing/edges don't skew the ratio.
 */
function colorSignature(buf) {
  const png = PNG.sync.read(buf);
  const { data, width, height } = png;
  let visible = 0;
  let white = 0;
  let green = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 32) continue;
    visible++;
    // White ink: bright and roughly neutral (small channel spread).
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max > 210 && max - min < 30) white++;
    // NEVO green (~ oklch(0.72 0.155 158) ≈ #2FA36B..#4CD08A). Green dominant,
    // clearly above red and blue, and mid-lightness.
    if (g > 90 && g < 230 && g > r + 25 && g > b + 15 && r < 180) green++;
  }
  return {
    width,
    height,
    visible,
    whiteRatio: white / visible,
    greenRatio: green / visible,
  };
}

// Per-state minimums. Menu-open logo is bigger → same ratio thresholds apply.
// Floors chosen well below observed values to catch regressions without flaking.
const THRESHOLDS = {
  initial:  { minWhite: 0.05, minGreen: 0.005 },
  scrolled: { minWhite: 0.05, minGreen: 0.005 },
  menuOpen: { minWhite: 0.05, minGreen: 0.005 },
};

async function main() {
  const shots = await captureStates();
  let failed = 0;
  const rows = [];

  for (const [state, buf] of Object.entries(shots)) {
    writeFileSync(join(SHOTS_DIR, `header-logo-${state}.png`), buf);
    const sig = colorSignature(buf);
    const t = THRESHOLDS[state];
    const okWhite = sig.whiteRatio >= t.minWhite;
    const okGreen = sig.greenRatio >= t.minGreen;
    const ok = okWhite && okGreen;
    if (!ok) failed++;
    rows.push({ state, sig, okWhite, okGreen, ok });
  }

  console.log("State       size        white%   green%   result");
  console.log("─".repeat(56));
  for (const r of rows) {
    const size = `${r.sig.width}x${r.sig.height}`.padEnd(11);
    const w = (r.sig.whiteRatio * 100).toFixed(2).padStart(6);
    const g = (r.sig.greenRatio * 100).toFixed(2).padStart(6);
    const mark = r.ok ? "✓ pass" : `✗ fail (white=${r.okWhite} green=${r.okGreen})`;
    console.log(`${r.state.padEnd(11)} ${size} ${w}%  ${g}%   ${mark}`);
  }

  console.log(`\nSnapshots saved to tests/visual/snapshots/`);
  if (failed > 0) {
    console.error(
      `\nLogo color regression: ${failed}/${rows.length} state(s) missing expected white or green ink.`,
    );
    console.error("Inspect the snapshot PNGs — the NEVO wordmark or green accent has changed.");
    process.exit(1);
  }
  console.log(`All ${rows.length} states have the expected white + green color signature.`);
}

main().catch((err) => {
  console.error("visual-test harness error:", err);
  process.exit(2);
});
