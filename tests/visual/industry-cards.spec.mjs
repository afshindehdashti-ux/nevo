// Visual regression test for the Industries page cards.
// - Launches Chromium against the local dev server (http://localhost:8080).
// - Screenshots every industry card on desktop (1280) and mobile (390).
// - Compares each screenshot against the approved baseline in
//   tests/visual/baselines/<viewport>/card-<NN>.png using pixelmatch.
// - On first run (or when UPDATE_BASELINES=1) it writes baselines instead
//   of comparing, so the CI-checked images become the "approved" set.
//
// Run:      node tests/visual/industry-cards.spec.mjs
// Update:   UPDATE_BASELINES=1 node tests/visual/industry-cards.spec.mjs
//
// Requires: playwright, pixelmatch, pngjs (dev deps).

import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL ?? "http://localhost:8080";
const ROUTE = "/en/industries";
const UPDATE = process.env.UPDATE_BASELINES === "1";
// Fail if more than 0.5% of pixels differ per card.
const MAX_DIFF_RATIO = 0.005;

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 1800 },
  { name: "mobile", width: 390, height: 1800 },
];

const BASELINES = path.join(__dirname, "baselines");
const DIFFS = path.join(__dirname, "diffs");

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function readPng(file) {
  return PNG.sync.read(await fs.readFile(file));
}

async function screenshotCards(page, viewport, outDir) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`${BASE_URL}${ROUTE}`, { waitUntil: "networkidle" });
  // Disable motion + reveal offscreen animated cards.
  await page.addStyleTag({
    content: `*,*::before,*::after{animation:none!important;transition:none!important}
              [data-testid="industry-card"]{opacity:1!important;transform:none!important}`,
  });
  // Scroll through so lazy images load.
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle");

  const cards = await page.locator('[data-testid="industry-card"]').all();
  if (cards.length === 0) throw new Error("No industry cards found");

  const files = [];
  for (let i = 0; i < cards.length; i++) {
    const idx = String(i + 1).padStart(2, "0");
    const file = path.join(outDir, `card-${idx}.png`);
    await cards[i].scrollIntoViewIfNeeded();
    // Wait for image inside the card to fully decode.
    await cards[i].locator("img").first().evaluate((img) =>
      img.complete ? Promise.resolve() : img.decode().catch(() => {})
    );
    await cards[i].screenshot({ path: file });
    files.push({ idx, file });
  }
  return files;
}

async function compare(actualFile, baselineFile, diffFile) {
  const a = await readPng(actualFile);
  const b = await readPng(baselineFile);
  if (a.width !== b.width || a.height !== b.height) {
    return { ok: false, reason: `size mismatch ${a.width}x${a.height} vs ${b.width}x${b.height}`, ratio: 1 };
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const px = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
    threshold: 0.15,
  });
  const ratio = px / (a.width * a.height);
  if (ratio > MAX_DIFF_RATIO) {
    await fs.writeFile(diffFile, PNG.sync.write(diff));
    return { ok: false, reason: `${(ratio * 100).toFixed(3)}% pixels differ`, ratio };
  }
  return { ok: true, ratio };
}

async function main() {
  await ensureDir(BASELINES);
  await ensureDir(DIFFS);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const failures = [];
  for (const vp of VIEWPORTS) {
    const baselineDir = path.join(BASELINES, vp.name);
    const actualDir = path.join(DIFFS, vp.name, "actual");
    const diffDir = path.join(DIFFS, vp.name, "diff");
    await ensureDir(baselineDir);
    await ensureDir(actualDir);
    await ensureDir(diffDir);

    const files = await screenshotCards(page, vp, actualDir);
    for (const { idx, file } of files) {
      const baseline = path.join(baselineDir, `card-${idx}.png`);
      const exists = await fs.access(baseline).then(() => true).catch(() => false);
      if (!exists || UPDATE) {
        await fs.copyFile(file, baseline);
        console.log(`[${vp.name}] baseline ${UPDATE ? "updated" : "written"}: card-${idx}.png`);
        continue;
      }
      const res = await compare(file, baseline, path.join(diffDir, `card-${idx}.png`));
      if (res.ok) {
        console.log(`[${vp.name}] card-${idx}.png OK (${(res.ratio * 100).toFixed(3)}%)`);
      } else {
        console.error(`[${vp.name}] card-${idx}.png FAIL — ${res.reason}`);
        failures.push(`${vp.name}/card-${idx}.png`);
      }
    }
  }

  await browser.close();

  if (failures.length) {
    console.error(`\nVisual regression FAILED for ${failures.length} card(s):`);
    for (const f of failures) console.error(`  - ${f}`);
    console.error(`Review diffs under tests/visual/diffs/. If the change is intentional, rerun with UPDATE_BASELINES=1.`);
    process.exit(1);
  }
  console.log("\nVisual regression passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
