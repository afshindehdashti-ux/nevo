import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for E2E tests that must exercise a real browser page
 * load (hard refresh / deep link). Unit tests continue to run under Vitest.
 *
 * The dev server is started on port 4173 (Vite preview default) and the
 * tests navigate to it via `baseURL`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["list"], ["junit", { outputFile: "reports/playwright/junit.xml" }]]
    : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    // A viewport that catches both desktop launcher and mobile CTA.
    viewport: { width: 390, height: 844 },
  },
  projects: [
    { name: "chromium-mobile", use: { ...devices["Pixel 7"] } },
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev -- --port 4173 --host 127.0.0.1 --strictPort",
        url: "http://127.0.0.1:4173/en",
        reuseExistingServer: !process.env.CI,
        timeout: 480_000,
      },
});
