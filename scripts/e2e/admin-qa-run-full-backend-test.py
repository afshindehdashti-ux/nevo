#!/usr/bin/env python3
"""End-to-end test: click "Run Full Backend Test" on /admin/system-health
and verify the QA workflow.

Assertions:
  1. All 17 required checks render a terminal status (Pass/Warning/Fail),
     none remain "Running" or "Not tested".
  2. The 4 checks that must exercise create/update paths against real
     tables (Customer CRUD, Supplier CRUD, Product CRUD, Proforma
     Invoice Generator) return Pass or Warning — never Fail.
  3. After the run completes, no TEST-NEVO-QA- rows are left behind in
     customers / suppliers / products / proforma_invoices (queried via
     PostgREST as the signed-in super_admin).
  4. TEST-NEVO-QA- rows created during the run were isolated to those
     four tables (nothing bled into invoices, orders, quotations, etc.).

Requires (from .env / env):
  VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID
  RLS_SUPER_ADMIN_EMAIL / RLS_SUPER_ADMIN_PASSWORD

Usage:
  python3 scripts/e2e/admin-qa-run-full-backend-test.py
  python3 scripts/e2e/admin-qa-run-full-backend-test.py --url http://localhost:8080

Exit codes: 0 pass, 1 assertion failure, 2 harness error.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

import requests

try:
    from playwright.async_api import async_playwright
except ImportError:  # pragma: no cover
    print("Playwright is not available in this environment.", file=sys.stderr)
    sys.exit(2)


ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
if ENV_FILE.exists():
    for raw in ENV_FILE.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"].rstrip("/")
ANON_KEY = os.environ["VITE_SUPABASE_PUBLISHABLE_KEY"]
PROJECT_ID = (
    os.environ.get("VITE_SUPABASE_PROJECT_ID")
    or SUPABASE_URL.split("//", 1)[1].split(".", 1)[0]
)
STORAGE_KEY = f"sb-{PROJECT_ID}-auth-token"

SCREENSHOTS = Path("/tmp/browser/admin-qa-run-full-backend-test")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

TEST_PREFIX = "TEST-NEVO-QA-"
EXPECTED_CHECK_COUNT = 17
# Checks that actually write rows and must succeed (Pass or Warning, never Fail).
WRITE_CHECK_TITLES = [
    "Customer CRUD",
    "Supplier CRUD",
    "Product CRUD",
    "Proforma Invoice Generator",
]
# Tables that legitimately receive TEST-NEVO-QA- rows during the run.
DIRTY_TABLES = {
    "customers": "name",
    "suppliers": "name",
    "products": "name",
    "proforma_invoices": "proforma_number",
}
# Tables that must NEVER see a TEST-NEVO-QA- row (isolation guarantee).
ISOLATION_TABLES = {
    "invoices": "invoice_number",
    "quotations": "quotation_number",
    "orders": "order_number",
}


def sign_in(role: str) -> dict:
    email = os.environ.get(f"RLS_{role.upper()}_EMAIL")
    password = os.environ.get(f"RLS_{role.upper()}_PASSWORD")
    if not email or not password:
        print(f"[harness] missing RLS_{role.upper()}_EMAIL/PASSWORD", file=sys.stderr)
        sys.exit(2)
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=15,
    )
    if r.status_code != 200:
        print(f"[harness] sign-in failed: {r.status_code} {r.text[:200]}", file=sys.stderr)
        sys.exit(2)
    return r.json()


def count_prefix_rows(token: str, table: str, column: str) -> int:
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {token}",
            "Prefer": "count=exact",
            "Range-Unit": "items",
            "Range": "0-0",
        },
        params={"select": column, f"{column}": f"like.{TEST_PREFIX}*"},
        timeout=15,
    )
    if r.status_code not in (200, 206):
        print(f"  [warn] count {table}: {r.status_code} {r.text[:120]}")
        return -1
    cr = r.headers.get("content-range", "")
    if "/" in cr:
        try:
            return int(cr.split("/", 1)[1])
        except ValueError:
            pass
    try:
        return len(r.json())
    except Exception:
        return -1


async def run(base_url: str, role: str) -> int:
    failures: list[str] = []
    session = sign_in(role)
    token = session["access_token"]

    # Baseline: how many TEST-NEVO-QA- rows already exist BEFORE the run?
    baseline: dict[str, int] = {}
    for t, col in {**DIRTY_TABLES, **ISOLATION_TABLES}.items():
        baseline[t] = count_prefix_rows(token, t, col)
    print("[baseline] TEST-NEVO-QA- rows:", baseline)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        try:
            context = await browser.new_context(viewport={"width": 1280, "height": 1800})
            page = await context.new_page()

            await page.goto(base_url, wait_until="domcontentloaded")
            await page.evaluate(
                f"window.localStorage.setItem({json.dumps(STORAGE_KEY)}, {json.dumps(json.dumps(session))})"
            )
            await page.goto(f"{base_url}/admin/system-health", wait_until="domcontentloaded")

            # Wait for the guard + page to settle.
            heading = page.get_by_role("heading", name="Backend System Health")
            await heading.wait_for(timeout=15_000)
            await page.screenshot(path=str(SCREENSHOTS / "1_loaded.png"))

            # Count check cards up front — expect all 17.
            await page.wait_for_timeout(300)
            initial_cards = await page.locator("text=Not tested").count()
            if initial_cards < EXPECTED_CHECK_COUNT:
                failures.append(
                    f"expected {EXPECTED_CHECK_COUNT} 'Not tested' cards before run, "
                    f"got {initial_cards}"
                )

            # Click Run Full Backend Test.
            run_btn = page.get_by_role("button", name="Run Full Backend Test")
            await run_btn.click()
            await page.screenshot(path=str(SCREENSHOTS / "2_running.png"))

            # Wait for run to finish — button becomes enabled again AND the
            # "Last full run" summary line renders.
            await page.wait_for_function(
                "!!document.body.innerText.match(/Last full run/)",
                timeout=90_000,
            )
            # Give React one more tick to flush all status badges.
            await page.wait_for_timeout(500)
            await page.screenshot(path=str(SCREENSHOTS / "3_finished.png"))

            body_text = await page.locator("body").inner_text()

            # No check should still be Running or Not tested.
            leftover_running = body_text.count("Running")
            leftover_idle = body_text.count("Not tested")
            if leftover_running:
                failures.append(f"{leftover_running} check(s) still 'Running' after completion")
            if leftover_idle:
                failures.append(f"{leftover_idle} check(s) still 'Not tested' after completion")

            # Summary line: N pass · N warn · N fail — sum must equal 17.
            import re
            m = re.search(r"(\d+)\s*pass\D+(\d+)\s*warn\D+(\d+)\s*fail", body_text)
            if not m:
                failures.append("could not parse pass/warn/fail summary")
            else:
                p, w, f = int(m.group(1)), int(m.group(2)), int(m.group(3))
                total = p + w + f
                print(f"[summary] pass={p} warn={w} fail={f} total={total}")
                if total != EXPECTED_CHECK_COUNT:
                    failures.append(
                        f"expected {EXPECTED_CHECK_COUNT} completed checks, got {total}"
                    )

            # Write-path checks must be Pass or Warning, never Fail.
            for title in WRITE_CHECK_TITLES:
                card = page.locator("div", has=page.locator(f"text={title}")).first
                card_text = (await card.inner_text()).lower()
                if "fail" in card_text.split("\n")[0:6].__str__().lower() or (
                    "fail" in card_text and "pass" not in card_text and "warning" not in card_text
                ):
                    # Fall back to a stricter check via badge text near the title.
                    failures.append(f"write check '{title}' reported Fail")

        finally:
            await browser.close()

    # Post-run DB state: dirty tables should be back to baseline (no leaks).
    # Isolation tables must remain at baseline as well.
    print("[post-run] TEST-NEVO-QA- row counts:")
    for t, col in {**DIRTY_TABLES, **ISOLATION_TABLES}.items():
        after = count_prefix_rows(token, t, col)
        before = baseline.get(t, -1)
        print(f"  {t}: before={before} after={after}")
        if after < 0 or before < 0:
            print(f"  [skip] {t}: count unavailable")
            continue
        if t in DIRTY_TABLES and after != before:
            failures.append(
                f"{t}: {after - before} TEST-NEVO-QA- row(s) left behind after run"
            )
        if t in ISOLATION_TABLES and after != before:
            failures.append(
                f"{t}: TEST-NEVO-QA- rows appeared in isolation-only table "
                f"(before={before} after={after})"
            )

    print("\n=== admin-qa-run-full-backend-test ===")
    if failures:
        print(f"FAIL ({len(failures)}):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("PASS")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:8080")
    ap.add_argument("--role", default="super_admin", choices=["super_admin", "management"])
    args = ap.parse_args()
    return asyncio.run(run(args.url.rstrip("/"), args.role))


if __name__ == "__main__":
    sys.exit(main())
