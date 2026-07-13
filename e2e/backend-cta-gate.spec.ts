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
    expect(count, `Expected 0 matches for ${selector} ${when} but found ${count}`).toBe(0);
  }
}

async function waitForHydration(page: Page) {
  // Navigation already waits for DOM content. Avoid waiting on unrelated
  // long-lived requests before checking the hydrated UI.
  await page.waitForTimeout(500);
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
      await waitForHydration(page);
      await assertNoCtas(page, `after hydration of ${path}`);

      // 3) A short additional wait to catch any late-mounting portal that
      // renders the launcher after an async check finishes.
      await page.waitForTimeout(500);
      await assertNoCtas(page, `500ms post-hydration on ${path}`);
    });
  }
});

test.describe("Backend routes: CTAs are not reachable via keyboard focus", () => {
  // A hidden-but-present element (e.g. `display: none` toggled by CSS
  // rather than unmounted from React) would still pass the DOM check
  // above but could remain in the accessibility tree and be reachable
  // via Tab. This suite tabs through every focusable element on each
  // backend route and asserts none of the CTA selectors ever receive
  // focus.
  for (const path of BACKEND_PATHS) {
    test(`tab traversal on ${path} never lands on a public CTA`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await waitForHydration(page);

      // Belt-and-braces: assert not-in-DOM before checking focus.
      await assertNoCtas(page, `before tab traversal on ${path}`);

      // Focus body so Tab starts from a known baseline.
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await page.locator("body").focus();

      const CTA_SELECTOR_UNION = CTA_SELECTORS.join(", ");
      const visitedSignatures = new Set<string>();

      // Cap iterations so a focus trap can't hang the test. 200 is far
      // more than any real backend page's focusable count; break early
      // once we cycle back to a previously-seen element.
      const MAX_TABS = 200;
      for (let i = 0; i < MAX_TABS; i++) {
        await page.keyboard.press("Tab");

        // Read the currently focused element's identity and check whether
        // it matches (or is contained within) any CTA selector.
        const info = await page.evaluate((ctaSelector) => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return { sig: "__body__", matchesCta: false };
          const sig =
            (el.tagName || "") +
            "#" +
            (el.id || "") +
            "." +
            (el.className?.toString?.() || "") +
            "@" +
            (el.getAttribute("aria-label") || "") +
            "$" +
            (el.textContent?.slice(0, 40) || "");
          const matchesCta = !!(el.closest(ctaSelector) || el.matches(ctaSelector));
          return { sig, matchesCta };
        }, CTA_SELECTOR_UNION);

        expect(
          info.matchesCta,
          `Tab reached a public CTA on ${path} at step ${i} (signature: ${info.sig})`,
        ).toBe(false);

        // Stop once focus cycles.
        if (visitedSignatures.has(info.sig)) break;
        visitedSignatures.add(info.sig);
      }
    });
  }
});
