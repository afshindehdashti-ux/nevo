#!/usr/bin/env python3
"""End-to-end access-matrix test for /admin/system-health and /admin/qa-center.

For each seeded role, sign in via the Supabase Auth REST API, inject the
resulting session into the browser's localStorage, then navigate to each
admin route and assert what the user should see:

    super_admin, management  -> can view the page  ("System Health" heading)
    sales, operations,
    finance, read_only       -> "Access denied" panel

Reuses the RLS_<ROLE>_EMAIL / RLS_<ROLE>_PASSWORD env vars documented in
scripts/e2e/README-rls-role-matrix.md, plus VITE_SUPABASE_URL /
VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_PROJECT_ID from .env.

Usage:
    python3 scripts/e2e/admin-system-health-access.py
    python3 scripts/e2e/admin-system-health-access.py --url http://localhost:8080

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
PROJECT_ID = os.environ.get("VITE_SUPABASE_PROJECT_ID") or SUPABASE_URL.split("//", 1)[1].split(".", 1)[0]
STORAGE_KEY = f"sb-{PROJECT_ID}-auth-token"

SCREENSHOTS = Path("/tmp/browser/admin-system-health-access")
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

ROUTES = ["/admin/system-health", "/admin/qa-center"]
ALLOWED_ROLES = {"super_admin", "management"}
DENIED_ROLES = {"sales", "operations", "finance", "read_only"}
ALL_ROLES = ALLOWED_ROLES | DENIED_ROLES


def sign_in(role: str) -> dict | None:
    email = os.environ.get(f"RLS_{role.upper()}_EMAIL")
    password = os.environ.get(f"RLS_{role.upper()}_PASSWORD")
    if not email or not password:
        print(f"[skip] {role}: RLS_{role.upper()}_EMAIL/PASSWORD not set")
        return None
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=15,
    )
    if r.status_code != 200:
        print(f"[fail] sign-in {role}: {r.status_code} {r.text[:200]}")
        return None
    return r.json()


async def check_role(pw, base_url: str, role: str, session: dict, failures: list[str]) -> None:
    expected_allowed = role in ALLOWED_ROLES
    browser = await pw.chromium.launch(headless=True)
    try:
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        # Prime origin, then set the Supabase session in localStorage.
        await page.goto(base_url, wait_until="domcontentloaded")
        await page.evaluate(
            f"window.localStorage.setItem({json.dumps(STORAGE_KEY)}, {json.dumps(json.dumps(session))})"
        )

        for route in ROUTES:
            await page.goto(f"{base_url}{route}", wait_until="domcontentloaded")
            # Wait for guard to resolve (roles query + render).
            try:
                await page.wait_for_function(
                    "!document.body.innerText.includes('Checking access')",
                    timeout=15_000,
                )
            except Exception:
                pass
            await page.wait_for_timeout(500)

            body = (await page.locator("body").inner_text()).lower()
            slug = route.strip("/").replace("/", "_")
            await page.screenshot(path=str(SCREENSHOTS / f"{role}_{slug}.png"))

            denied = "access denied" in body
            has_page = "system health" in body or "run full backend test" in body

            if expected_allowed:
                if not has_page or denied:
                    failures.append(
                        f"{role} @ {route}: expected page, got "
                        f"{'denied' if denied else 'no page marker'}"
                    )
                else:
                    print(f"[ok] {role} @ {route}: page visible")
            else:
                if not denied:
                    failures.append(
                        f"{role} @ {route}: expected Access denied, "
                        f"got {'page' if has_page else 'unknown state'}"
                    )
                else:
                    print(f"[ok] {role} @ {route}: access denied")
    finally:
        await browser.close()


async def run(base_url: str) -> int:
    failures: list[str] = []
    async with async_playwright() as pw:
        for role in sorted(ALL_ROLES):
            session = sign_in(role)
            if session is None:
                failures.append(f"{role}: missing credentials or sign-in failed")
                continue
            await check_role(pw, base_url, role, session, failures)

    print("\n=== admin-system-health-access ===")
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
    args = ap.parse_args()
    return asyncio.run(run(args.url.rstrip("/")))


if __name__ == "__main__":
    sys.exit(main())
