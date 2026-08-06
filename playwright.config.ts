import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const macChromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const configuredBrowserPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
const localBrowserPath =
  configuredBrowserPath ||
  (process.platform === "darwin" && existsSync(macChromePath) ? macChromePath : undefined);

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
    launchOptions: localBrowserPath ? { executablePath: localBrowserPath } : undefined,
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
        url: "http://127.0.0.1:4173",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
