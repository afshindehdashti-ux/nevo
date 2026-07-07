#!/usr/bin/env python3
"""End-to-end test: submit the homepage contact form with a valid email
and verify a success toast appears (and the form is reset).

Run:
    python3 scripts/e2e/homepage_contact_submit.py
    python3 scripts/e2e/homepage_contact_submit.py --url http://localhost:8080 --locale en

Exit codes: 0 pass, 1 assertion failure, 2 harness error.

Uses the sandbox's pre-installed Playwright + bundled Chromium. No project
dependency is added; run this against a locally-running dev server.
"""
from __future__ import annotations

import argparse
import asyncio
import re
import sys
import time
from pathlib import Path

try:
    from playwright.async_api import async_playwright
except ImportError:  # pragma: no cover - harness error
    print("Playwright is not available in this environment.", file=sys.stderr)
    sys.exit(2)


SCREENSHOTS = Path("/tmp/browser/homepage-contact-submit")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

NOISY_CONSOLE = re.compile(r"vite|hydrated|hydration|websocket|hmr", re.IGNORECASE)
FAILURE_TOAST = re.compile(
    r"required|invalid|valid email|please review|error|failed|too many",
    re.IGNORECASE,
)


async def run(url: str, locale: str) -> int:
    failures: list[str] = []

    def check(cond: bool, msg: str) -> None:
        if not cond:
            failures.append(msg)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        console_errors: list[str] = []
        page.on(
            "console",
            lambda msg: console_errors.append(msg.text) if msg.type == "error" else None,
        )

        await page.goto(f"{url}/{locale}", wait_until="domcontentloaded")
        await page.screenshot(path=str(SCREENSHOTS / "1_loaded.png"))

        # Best-effort cookie banner dismissal.
        try:
            await page.get_by_role("button", name=re.compile(r"decline|accept", re.I)).first.click(
                timeout=1500
            )
        except Exception:
            pass

        contact = page.locator("#contact")
        await contact.scroll_into_view_if_needed()
        form = page.locator("#contact form").first
        await form.wait_for(state="visible", timeout=10_000)

        email = f"qa+{int(time.time() * 1000)}@nevoindustrial.com"
        await form.locator('input[name="name"]').fill("QA Bot")
        await form.locator('input[name="email"]').fill(email)
        await form.locator('textarea[name="message"]').fill(
            "Automated end-to-end verification of the homepage contact form submission path."
        )
        await page.screenshot(path=str(SCREENSHOTS / "2_filled.png"))

        submit = form.get_by_role(
            "button", name=re.compile(r"send|submit|inquiry|contact", re.I)
        ).first
        await submit.click()

        toast_text = ""
        toast = page.locator("[data-sonner-toast]").first
        try:
            await toast.wait_for(state="visible", timeout=10_000)
            toast_text = (await toast.inner_text()).strip()
        except Exception:
            pass

        await page.screenshot(path=str(SCREENSHOTS / "3_after_submit.png"))

        check(
            bool(toast_text),
            f"No toast appeared after submitting the homepage contact form (email={email}).",
        )
        check(
            not FAILURE_TOAST.search(toast_text),
            f"Toast looked like a failure, not a success: {toast_text!r}",
        )

        email_after = await form.locator('input[name="email"]').input_value()
        check(
            email_after == "",
            f"Expected the form to reset after success, but email is still {email_after!r}.",
        )

        meaningful = [e for e in console_errors if not NOISY_CONSOLE.search(e)]
        if meaningful:
            print("Console errors during run:")
            for err in meaningful:
                print(f"  - {err}")

        await browser.close()

    if failures:
        print(f"FAIL homepage-contact-submit ({len(failures)}):", file=sys.stderr)
        for f in failures:
            print(f"  - {f}", file=sys.stderr)
        print(f"Screenshots saved to {SCREENSHOTS}", file=sys.stderr)
        return 1

    print(f"PASS homepage-contact-submit — toast: {toast_text!r}")
    print(f"Screenshots saved to {SCREENSHOTS}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--url", default="http://localhost:8080")
    ap.add_argument("--locale", default="en")
    args = ap.parse_args()
    try:
        return asyncio.run(run(args.url, args.locale))
    except Exception as exc:  # pragma: no cover
        print(f"Harness error: {exc!r}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
