"""
Visual regression: admin list page loading & empty states do not shift layout.

Goal: catch layout-shift regressions where one admin list page renders its
loading skeleton or empty card at a different x/width/height than the others.
The house contract (docs/admin-list-states.md) says every page uses the same
shell — this test proves it geometrically instead of trusting reviewers.

Strategy per page:
  1. Restore the managed Supabase browser session (same pattern as
     scripts/e2e/admin-list-smoke.py).
  2. Intercept the Supabase REST call for the page's table via `page.route`:
       - LOADING scenario  → never fulfill (pending forever)
       - EMPTY   scenario  → fulfill with `[]`
  3. Measure the bounding box of the state region:
       - loading: `[data-testid="list-skeleton"]`
       - empty:   `[role="status"]` card (ListEmptyState)
     Plus the first skeleton row's height.
  4. Screenshot the state region under /tmp/browser/admin-list-visual/.
  5. Compare across pages: x, width, and skeleton row height must match
     within ±1px. Empty-card width must also match within ±1px.

We deliberately do NOT pixel-diff the screenshots — icon and copy legitimately
differ per resource. Layout geometry is the invariant.

Preconditions:
  - Dev server at http://localhost:8080.
  - LOVABLE_BROWSER_AUTH_STATUS == "injected" (sign in via preview once).

Usage:
  python3 scripts/visual/admin-list-layout.py
  python3 scripts/visual/admin-list-layout.py --update   # refresh baseline JSON

Exit codes: 0 pass, 1 layout drift, 2 harness error.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

from playwright.async_api import Route, async_playwright

BASE_URL = os.environ.get("VISUAL_BASE_URL", "http://localhost:8080")
SHOTS_DIR = Path("/tmp/browser/admin-list-visual")
SHOTS_DIR.mkdir(parents=True, exist_ok=True)

BASELINE_PATH = Path(__file__).resolve().parent / "admin-list-layout.baseline.json"
TOLERANCE_PX = 1.0  # sub-pixel drift from font metrics is fine

# (route path, Supabase table name the page queries)
PAGES = [
    ("/admin/opportunities",       "opportunities"),
    ("/admin/commission-invoices", "commission_invoices"),
    ("/admin/purchase-orders",     "purchase_orders"),
]

UPDATE = "--update" in sys.argv


async def restore_session(context, page) -> None:
    status = os.environ.get("LOVABLE_BROWSER_AUTH_STATUS", "")
    if status != "injected":
        raise SystemExit(
            f"LOVABLE_BROWSER_AUTH_STATUS={status!r} — sign in via the preview "
            "once so a session is minted, then re-run."
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


def install_supabase_intercept(page, table: str, mode: str):
    """Route the Supabase REST call for `table` to loading (hang) or empty ([]).

    Matches PostgREST URLs like `.../rest/v1/<table>?select=...`. Other REST
    calls on the same page (e.g. joined lookups) fall through untouched so
    the app boots normally.
    """
    pattern = f"**/rest/v1/{table}*"

    async def handler(route: Route) -> None:
        if mode == "loading":
            # Never fulfill — the query stays in `isLoading` forever and the
            # skeleton branch renders. Playwright cancels on browser close.
            await asyncio.sleep(30)
            try:
                await route.abort()
            except Exception:
                pass
        else:
            await route.fulfill(
                status=200,
                headers={
                    "content-type": "application/json",
                    "content-range": "0-0/0",
                },
                body="[]",
            )

    return page.route(pattern, handler)


async def measure_region(page, selector: str) -> dict:
    loc = page.locator(selector).first
    await loc.wait_for(state="visible", timeout: 8000)  # noqa: E999 — see below
    box = await loc.bounding_box()
    if not box:
        raise RuntimeError(f"no bounding box for {selector}")
    return {"x": round(box["x"], 2), "y": round(box["y"], 2),
            "width": round(box["width"], 2), "height": round(box["height"], 2)}
