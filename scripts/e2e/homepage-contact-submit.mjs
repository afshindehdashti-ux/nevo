#!/usr/bin/env node
/**
 * End-to-end test: submit the homepage contact form with a valid email
 * and verify a success toast appears (and the form is reset).
 *
 * Run:
 *   node scripts/e2e/homepage-contact-submit.mjs
 *   node scripts/e2e/homepage-contact-submit.mjs --url=http://localhost:8080
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
const LOCALE = args.get("locale") ?? "en";

const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.new_context
    ? await browser.new_context({ viewport: { width: 1280, height: 1800 } })
    : await browser.newContext({ viewport: { width: 1280, height: 1800 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto(`${URL}/${LOCALE}`, { waitUntil: "domcontentloaded" });

  // Dismiss cookie banner if present (best-effort).
  try {
    const decline = page.getByRole("button", { name: /decline|accept/i }).first();
    await decline.click({ timeout: 1500 });
  } catch {
    /* no banner */
  }

  // Scroll the contact form into view.
  await page.locator("#contact").scrollIntoViewIfNeeded();
  const form = page.locator("#contact form").first();
  await form.waitFor({ state: "visible", timeout: 10_000 });

  // Fill the required fields with valid values.
  const email = `qa+${Date.now()}@nevoindustrial.com`;
  await form.locator('input[name="name"]').fill("QA Bot");
  await form.locator('input[name="email"]').fill(email);
  await form
    .locator('textarea[name="message"]')
    .fill("Automated end-to-end verification of the homepage contact form submission path.");

  // Submit and wait for the success toast rendered by Sonner.
  const submit = form.getByRole("button", { name: /send|submit|inquiry|contact/i }).first();
  await submit.click();

  // Sonner renders toasts in an [aria-live] region with data-sonner-toast items.
  const toast = page.locator("[data-sonner-toast]").first();
  let toastText = "";
  try {
    await toast.waitFor({ state: "visible", timeout: 10_000 });
    toastText = (await toast.innerText()).trim();
  } catch {
    // fallthrough — assertion will report the failure below
  }

  assert(
    toastText.length > 0,
    `No toast appeared after submitting the homepage contact form (email=${email}).`,
  );

  // A validation failure would surface a "required" or "valid" message; a
  // success toast uses the localized inquiry-submitted copy. Reject anything
  // that clearly indicates a validation or delivery failure.
  const lower = toastText.toLowerCase();
  assert(
    !/required|invalid|valid email|please review|error|failed|too many/i.test(lower),
    `Toast looked like a failure, not a success: ${JSON.stringify(toastText)}`,
  );

  // The form should reset on success — the email input should now be empty.
  const emailAfter = await form.locator('input[name="email"]').inputValue();
  assert(
    emailAfter === "",
    `Expected the form to reset after success, but email is still ${JSON.stringify(emailAfter)}.`,
  );

  // Report console errors as soft context (do not fail the run for HMR/vite noise).
  const noisy = /vite|hydrated|hydration|websocket|hmr/i;
  const meaningful = consoleErrors.filter((e) => !noisy.test(e));
  if (meaningful.length) {
    console.warn(`Console errors during run:\n  - ${meaningful.join("\n  - ")}`);
  }

  if (failures.length) {
    console.error(`FAIL homepage-contact-submit (${failures.length}):`);
    for (const f of failures) console.error(`  - ${f}`);
    console.error(`Last toast text: ${JSON.stringify(toastText)}`);
    process.exit(1);
  }

  console.log(`PASS homepage-contact-submit — toast: ${JSON.stringify(toastText)}`);
  process.exit(0);
} catch (err) {
  console.error("Harness error:", err?.stack ?? err);
  process.exit(2);
} finally {
  if (browser) await browser.close();
}
