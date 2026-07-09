import { test, expect, type Page } from "@playwright/test";

/**
 * Hard-refresh E2E for the backend-route CTA gate.
 *
 * Regression source: finding ab462d1d ("Marketing chat & mobile CTA leak
 * into admin pages after in-app navigation"). Unit tests cover client-side
 * transitions; this suite covers the *other* half of the risk surface —
 * a fresh page load where the SSR HTML paints before any JS runs. The
 * launcher and sticky CTA must never appear in that initial paint on
 * /admin, /crm, or /backoffice.
 *
 * These tests inspect the DOM immediately after the response arrives
 * (`domcontentloaded` — before any client hydration) AND again after
 * network idle to catch both SSR flashes and post-hydration flashes.
 */

const BACKEND_PATHS = [
  "/admin",
  "/admin/",
  "/admin/dashboard",
  "/admin/orders?tab=open&page=2",
  "/crm",
  "/crm/",
  "/crm/leads",
  "/backoffice",
  "/backoffice/",
  "/backoffice/tools",
];

// Selectors that must NEVER be present on backend routes. Keep in sync with
// AIAssistantLauncher.tsx (aria-label from home.aiLauncher.askEngineer) and
// StickyMobileCTA.tsx (aria-label "WhatsApp"). testids are added as a
// defensive alternative for future-proofing.
const CTA_SELECTORS = [
  '[data-testid="ai-assistant-launcher"]',
  '[data-testid="sticky-mobile-cta"]',
  '[aria-label*="Ask" i][aria-label*="engineer" i]',
  '[aria-label="WhatsApp"]',
];

async function assertNoCtas(page: Page, when: string) {
  for (const selector of CTA_SELECTORS) {
    const count = await page.locator(selector).count();
    expect(
      count,
      `Expected 0 matches for ${selector} ${when} but found ${count}`,
    ).toBe(0);
  }
}

test.describe("Backend routes: CTAs never appear on hard refresh", () => {
  for (const path of BACKEND_PATHS) {
    test(`hard-refresh on ${path} shows no public CTAs`, async ({ page }) => {
      // Backend routes gate on auth; unauthenticated users get redirected
      // to /auth. Either outcome is fine for this test — the assertion is
      // "no public marketing chrome" on the resulting page — but we
      // explicitly follow redirects and re-check.
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response, `no response for ${path}`).not.toBeNull();

      // 1) Initial paint (before hydration completes).
      await assertNoCtas(page, `on initial paint of ${path}`);

      // 2) After the network settles and React hydrates.
      await page.waitForLoadState("networkidle");
      await assertNoCtas(page, `after hydration of ${path}`);

      // 3) A short additional wait to catch any late-mounting portal that
      // renders the launcher after an async check finishes.
      await page.waitForTimeout(500);
      await assertNoCtas(page, `500ms post-hydration on ${path}`);
    });
  }
});
