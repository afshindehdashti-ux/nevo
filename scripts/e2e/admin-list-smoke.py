"""
Playwright smoke test for the three admin list pages.

Flow:
  1. Seed deterministic rows into Supabase via psql (idempotent).
  2. Restore the managed Supabase browser session from LOVABLE_BROWSER_*
     env vars (see AGENTS "browser-use" guidance).
  3. Navigate to each admin list page, assert:
       - no "Failed to load" error card is rendered
       - the seeded row text appears in the table body
  4. Screenshot each page under /tmp/browser/admin-smoke/screenshots/.

Preconditions:
  - Dev server running at http://localhost:8080 (already the case in the
    Lovable sandbox).
  - PG* env vars set for psql (Lovable exec provides these).
  - LOVABLE_BROWSER_AUTH_STATUS == "injected". If it is "signed_out",
    sign in via the preview once so a session is minted, then re-run.

Usage:
  python3 scripts/e2e/admin-list-smoke.py
  python3 scripts/e2e/admin-list-smoke.py --cleanup   # remove seed rows after
"""
from __future__ import annotations

import asyncio
import json
import os
import subprocess
import sys
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent
SEED_SQL = ROOT / "seed-admin-smoke.sql"
CLEANUP_SQL = ROOT / "cleanup-admin-smoke.sql"
SCREENSHOTS = Path("/tmp/browser/admin-smoke/screenshots")
BASE_URL = os.environ.get("SMOKE_BASE_URL", "http://localhost:8080")

# Route + the seeded text we expect to see in the rendered table.
PAGES = [
    ("/admin/opportunities",       "SMOKE-TEST Opportunity"),
    ("/admin/commission-invoices", "SMOKE-TEST Partner"),
    ("/admin/purchase-orders",     "SMOKE-TEST-PO-0001"),
]


def run_sql(path: Path) -> None:
    print(f"[sql] {path.name}")
    subprocess.run(["psql", "-v", "ON_ERROR_STOP=1", "-f", str(path)], check=True)


async def restore_session(context, page) -> None:
    status = os.environ.get("LOVABLE_BROWSER_AUTH_STATUS", "")
    if status != "injected":
        raise SystemExit(
            f"LOVABLE_BROWSER_AUTH_STATUS={status!r} — sign in via the "
            "preview to mint a session, then re-run this smoke test."
        )
    cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")

    if cookies_json:
        cookies = json.loads(cookies_json)
        for c in cookies:
            c["url"] = BASE_URL
        await context.add_cookies(cookies)

    await page.goto(BASE_URL, wait_until="domcontentloaded")
    if storage_key and session_json:
        await page.evaluate(
            "([k, v]) => window.localStorage.setItem(k, v)",
            [storage_key, session_json],
        )


async def check_page(page, route: str, expected_text: str) -> tuple[bool, str]:
    url = f"{BASE_URL}{route}"
    await page.goto(url, wait_until="domcontentloaded")
    # Wait until either an alert (error card) OR a tbody row appears.
    try:
        await page.wait_for_selector(
            "[role='alert'], table tbody tr", timeout=10_000
        )
    except Exception as exc:
        return False, f"no alert or row appeared: {exc}"

    error_count = await page.locator("[role='alert']").count()
    row_count = await page.locator("table tbody tr").count()
    found_text = await page.get_by_text(expected_text, exact=False).count()

    slug = route.strip("/").replace("/", "_")
    shot = SCREENSHOTS / f"{slug}.png"
    await page.screenshot(path=str(shot))

    if error_count > 0:
        return False, f"error card rendered ({error_count}); rows={row_count}"
    if row_count == 0:
        return False, "table rendered no rows"
    if found_text == 0:
        return False, f"seeded text {expected_text!r} not visible in DOM"
    return True, f"rows={row_count}, screenshot={shot}"


async def main() -> int:
    cleanup = "--cleanup" in sys.argv
    SCREENSHOTS.mkdir(parents=True, exist_ok=True)

    run_sql(SEED_SQL)

    results: list[tuple[str, bool, str]] = []
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1280, "height": 1800}
            )
            page = await context.new_page()
            await restore_session(context, page)

            for route, expected in PAGES:
                ok, detail = await check_page(page, route, expected)
                results.append((route, ok, detail))
                print(f"[{'PASS' if ok else 'FAIL'}] {route} — {detail}")

            await browser.close()
    finally:
        if cleanup:
            run_sql(CLEANUP_SQL)

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} pages passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
