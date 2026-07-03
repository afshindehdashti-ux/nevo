import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await ctx.route("**/*", async (route) => {
  const req = route.request();
  const url = req.url();
  if (req.resourceType() === "image" && /nevo-logo/i.test(url) && !url.startsWith("data:")) {
    await route.abort("failed");
    return;
  }
  await route.continue();
});
page.on("console", (m) => console.log("PAGE:", m.type(), m.text().slice(0, 300)));
await page.goto("http://localhost:8080", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
await page.evaluate(() => {
  const el = document.querySelector('[data-testid="header-logo"]');
  const src = el.src;
  console.log("BEFORE poke, src=", src, "variant=", el.dataset.logoVariant, "complete=", el.complete, "nw=", el.naturalWidth);
  el.src = "";
  el.src = src;
});
await page.waitForTimeout(3000);
const state = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="header-logo"]');
  return { variant: el.dataset.logoVariant, step: el.dataset.fallbackStep, currentSrc: el.currentSrc.slice(0, 200), naturalWidth: el.naturalWidth };
});
console.log("AFTER:", JSON.stringify(state, null, 2));
await browser.close();
