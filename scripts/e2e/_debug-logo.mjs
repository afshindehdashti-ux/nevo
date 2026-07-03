import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const aborted = [];
await ctx.route("**/*", async (route) => {
  const req = route.request();
  const url = req.url();
  if (req.resourceType() === "image" && /nevo-logo/i.test(url) && !url.startsWith("data:")) {
    aborted.push(url);
    await route.abort("failed");
    return;
  }
  await route.continue();
});
page.on("console", (m) => console.log("PAGE:", m.type(), m.text().slice(0, 200)));
page.on("requestfailed", (r) => { if (/nevo-logo/.test(r.url())) console.log("FAILED:", r.url()); });
await page.goto("http://localhost:8080", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
const state = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="header-logo"]');
  if (!el) return { exists: false };
  return { exists: true, variant: el.dataset.logoVariant, step: el.dataset.fallbackStep, currentSrc: el.currentSrc.slice(0, 200), naturalWidth: el.naturalWidth, complete: el.complete };
});
console.log("STATE:", JSON.stringify(state, null, 2));
console.log("ABORTED:", aborted);
await browser.close();
