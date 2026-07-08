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
       - LOADING scenario  -> never fulfill (pending forever)
       - EMPTY   scenario  -> fulfill with `[]`
  3. Measure the bounding box of the state region:
       - loading: `[data-testid="list-skeleton"]`
       - empty:   `[role="status"]` card (ListEmptyState)
     Plus the first skeleton row's height.
  4. Screenshot the state region under /tmp/browser/admin-list-visual/.
  5. Compare across pages: x, width, and skeleton row height must match
     within +/-1px. Empty-card width must also match within +/-1px.

We deliberately do NOT pixel-diff the screenshots -- icon and copy legitimately
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
            f"LOVABLE_BROWSER_AUTH_STATUS={status!r} -- sign in via the preview "
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
    calls on the same page (joined lookups, etc.) fall through untouched so
    the app boots normally.
    """
    pattern = f"**/rest/v1/{table}*"

    async def handler(route: Route) -> None:
        if mode == "loading":
            # Never fulfill -- the query stays in `isLoading` forever and the
            # skeleton branch renders. Playwright cancels on browser close.
            try:
                await asyncio.sleep(30)
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


async def measure(page, selector: str, timeout_ms: int = 8000) -> dict:
    loc = page.locator(selector).first
    await loc.wait_for(state="visible", timeout=timeout_ms)
    box = await loc.bounding_box()
    if not box:
        raise RuntimeError(f"no bounding box for {selector}")
    return {
        "x": round(box["x"], 2),
        "y": round(box["y"], 2),
        "width": round(box["width"], 2),
        "height": round(box["height"], 2),
    }


async def capture_page(context, route_path: str, table: str) -> dict:
    """Load one admin page twice (loading, empty) and return measurements."""
    result: dict = {"route": route_path, "table": table}

    # ---- LOADING scenario ---------------------------------------------------
    page = await context.new_page()
    await install_supabase_intercept(page, table, mode="loading")
    await page.goto(f"{BASE_URL}{route_path}", wait_until="domcontentloaded")
    skeleton = await measure(page, '[data-testid="list-skeleton"]')
    first_row = await measure(page, '[data-testid="list-skeleton"] > *:first-child')
    aria_busy = await page.locator('[data-testid="list-skeleton"]').first.get_attribute("aria-busy")
    await page.locator('[data-testid="list-skeleton"]').first.screenshot(
        path=str(SHOTS_DIR / f"loading__{route_path.strip('/').replace('/', '_')}.png")
    )
    result["loading"] = {"container": skeleton, "row": first_row, "aria_busy": aria_busy}
    await page.close()

    # ---- EMPTY scenario -----------------------------------------------------
    page = await context.new_page()
    await install_supabase_intercept(page, table, mode="empty")
    await page.goto(f"{BASE_URL}{route_path}", wait_until="domcontentloaded")
    # ListEmptyState renders role="status"; scope to <main> to avoid <html role="status"> false hits.
    empty = await measure(page, 'main [role="status"], [role="status"]:not(html):not(body)')
    await page.locator('[role="status"]').first.screenshot(
        path=str(SHOTS_DIR / f"empty__{route_path.strip('/').replace('/', '_')}.png")
    )
    result["empty"] = {"container": empty}
    await page.close()

    return result


def compare(measurements: list[dict]) -> list[str]:
    """Return a list of human-readable drift errors (empty == pass)."""
    errors: list[str] = []

    def group(field_path: list[str]) -> dict[str, float]:
        out = {}
        for m in measurements:
            v = m
            for k in field_path:
                v = v[k]
            out[m["route"]] = v
        return out

    def check(label: str, values: dict[str, float]) -> None:
        vs = list(values.values())
        drift = max(vs) - min(vs)
        if drift > TOLERANCE_PX:
            detail = ", ".join(f"{r}={v}" for r, v in values.items())
            errors.append(f"{label} drifts by {drift:.2f}px (>{TOLERANCE_PX}px): {detail}")

    # Loading skeleton must line up horizontally and rows must match height.
    check("loading.container.x",      group(["loading", "container", "x"]))
    check("loading.container.width",  group(["loading", "container", "width"]))
    check("loading.row.height",       group(["loading", "row", "height"]))

    # Empty card must line up horizontally and share the same width.
    check("empty.container.x",        group(["empty", "container", "x"]))
    check("empty.container.width",    group(["empty", "container", "width"]))

    # Contract: skeleton always exposes aria-busy="true".
    for m in measurements:
        if m["loading"]["aria_busy"] != "true":
            errors.append(f'{m["route"]}: aria-busy on skeleton is '
                          f'{m["loading"]["aria_busy"]!r}, expected "true"')

    return errors


def check_baseline(measurements: list[dict]) -> list[str]:
    """Optional per-page baseline check (guards against a same-shift-everywhere regression)."""
    if not BASELINE_PATH.exists():
        return []
    baseline = json.loads(BASELINE_PATH.read_text())
    errors: list[str] = []
    for m in measurements:
        b = baseline.get(m["route"])
        if not b:
            continue
        for scenario in ("loading", "empty"):
            for k, v in b[scenario]["container"].items():
                cur = m[scenario]["container"][k]
                if abs(cur - v) > TOLERANCE_PX:
                    errors.append(
                        f"{m['route']} {scenario}.container.{k}: "
                        f"baseline={v}, current={cur} (drift {abs(cur - v):.2f}px)"
                    )
    return errors


async def main() -> int:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()
        await restore_session(context, page)
        await page.close()

        measurements: list[dict] = []
        for route_path, table in PAGES:
            print(f"[measure] {route_path}")
            measurements.append(await capture_page(context, route_path, table))

        await browser.close()

    (SHOTS_DIR / "measurements.json").write_text(json.dumps(measurements, indent=2))

    if UPDATE:
        baseline = {m["route"]: {"loading": m["loading"], "empty": m["empty"]}
                    for m in measurements}
        BASELINE_PATH.write_text(json.dumps(baseline, indent=2))
        print(f"[update] wrote baseline -> {BASELINE_PATH}")
        return 0

    errors = compare(measurements) + check_baseline(measurements)
    if errors:
        print("LAYOUT DRIFT DETECTED:")
        for e in errors:
            print(f"  - {e}")
        print(f"\nArtifacts: {SHOTS_DIR}")
        return 1

    print(f"OK -- {len(PAGES)} pages, loading + empty layouts consistent.")
    print(f"Artifacts: {SHOTS_DIR}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(asyncio.run(main()))
    except SystemExit:
        raise
    except Exception as exc:  # noqa: BLE001
        print(f"HARNESS ERROR: {exc}", file=sys.stderr)
        sys.exit(2)
