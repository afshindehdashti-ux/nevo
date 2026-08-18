#!/usr/bin/env python3
"""Visual regression: /admin/invoices in dark + light themes at key breakpoints.

Why this exists
---------------
The invoices list is the most layout-dense admin screen (responsive toolbar,
mobile card list, desktop table with horizontal scroll, pagination bar,
skeletons, empty states). Recent fixes covered mobile overflow, focus rings,
tooltip/dropdown clipping and currency contrast — this harness pins those
results so a future refactor cannot silently regress them.

What it checks, per (theme x breakpoint) combination:
  1. PIXEL BASELINE — screenshot of <main> compared against the approved PNG in
     tests/visual/baselines/admin-invoices/. Fails when the mean per-channel
     diff exceeds MAX_MEAN_DIFF.
  2. OVERFLOW — document.scrollWidth must not exceed the viewport width
     (the mobile-overflow regression class).
  3. CONTRAST — WCAG 2.1 contrast ratio of the page title, muted helper copy,
     invoice links, table/card money cells and status badges against their
     effective background. Fails below 4.5:1 (3.0:1 for large/bold text).

Determinism
-----------
The Supabase REST call for `invoices` is intercepted and fulfilled with a fixed
fixture, so baselines never drift with real database content. Animations and
transitions are disabled, `prefers-reduced-motion` is forced, and the clock is
not read by the fixture rows (all dates are literals).

Themes
------
The app ships a single dark palette; `.dark` is a Tailwind class alias
(src/styles.css). "light" = no `.dark` class + `prefers-color-scheme: light`,
"dark" = `.dark` on <html> + `prefers-color-scheme: dark`. Capturing both keeps
the harness honest if a real light palette is ever introduced, and today it
guards the `dark:`-gated logo swap and any media-query styling.

Usage
-----
    # dev server must be running (default http://localhost:8080)
    python3 scripts/visual/admin-invoices-visual.py

    # approve intentional visual changes
    UPDATE_BASELINES=1 python3 scripts/visual/admin-invoices-visual.py

Auth: needs an authenticated admin session. Either
  - LOVABLE_BROWSER_AUTH_STATUS=injected (session env vars present), or
  - a minted session file at ~/.cache/lovable-auth/session.json
    (override with LOVABLE_SESSION_FILE).

Exit codes: 0 pass, 1 visual/contrast/overflow regression, 2 harness error.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

from PIL import Image, ImageChops
from playwright.async_api import Route, async_playwright

ROOT = Path(__file__).resolve().parents[2]
BASELINES = ROOT / "tests" / "visual" / "baselines" / "admin-invoices"
ARTIFACTS = ROOT / "tests" / "visual" / "diffs" / "admin-invoices"
BASE_URL = os.environ.get("VISUAL_BASE_URL", "http://localhost:8080")
ROUTE = "/admin/invoices"
UPDATE = os.environ.get("UPDATE_BASELINES") == "1"

# Mean per-channel pixel difference (0..255) tolerated before failing.
MAX_MEAN_DIFF = 2.0

BREAKPOINTS = [
    {"name": "mobile", "width": 390, "height": 1000},
    {"name": "tablet", "width": 768, "height": 1000},
    {"name": "laptop", "width": 1280, "height": 1000},
    {"name": "wide", "width": 1536, "height": 1000},
]
THEMES = ["dark", "light"]

# Fixed rows so baselines never depend on live data. Field names mirror what
# the finance normalization helpers read (grand_total/total, balance_due).
INVOICE_FIXTURE = [
    {
        "id": "11111111-1111-4111-8111-111111111111",
        "invoice_number": "INV-NEVO-2026-0001",
        "type": "commercial",
        "status": "sent",
        "issue_date": "2026-01-12",
        "due_date": "2026-02-11",
        "currency": "USD",
        "grand_total": 128400.5,
        "amount_paid": 40000,
        "balance_due": 88400.5,
        "order_id": None,
        "customers": {
            "name": "Ahmed Al Balushi",
            "company_name": "Al Noor Construction LLC",
            "email": "ops@alnoor.example",
        },
    },
    {
        "id": "22222222-2222-4222-8222-222222222222",
        "invoice_number": "INV-NEVO-2026-0002",
        "type": "commercial",
        "status": "paid",
        "issue_date": "2026-01-05",
        "due_date": "2026-01-20",
        "currency": "USD",
        "grand_total": 9750,
        "amount_paid": 9750,
        "balance_due": 0,
        "order_id": None,
        "customers": {
            "name": "Maria Costa",
            "company_name": "Gulf Steelworks",
            "email": "finance@gulfsteel.example",
        },
    },
    {
        "id": "33333333-3333-4333-8333-333333333333",
        "invoice_number": "INV-NEVO-2026-0003",
        "type": "commercial",
        "status": "overdue",
        "issue_date": "2025-11-28",
        "due_date": "2025-12-28",
        "currency": "EUR",
        "grand_total": 54320,
        "amount_paid": 0,
        "balance_due": 54320,
        "order_id": None,
        "customers": {
            "name": None,
            "company_name": "Muscat Petrochem",
            "email": "ap@muscatpetro.example",
        },
    },
]

# (label, CSS selector, is_large_text) — contrast probes.
CONTRAST_PROBES = [
    ("page title", "main h1", True),
    ("page description", "main h1 ~ p, main p.text-muted-foreground", False),
    ("invoice link", 'main a[href*="/admin/invoices/"]', False),
    ("status badge", "main [data-slot='badge'], main .inline-flex.rounded-full", False),
    ("money cell", "main .tabular-nums", False),
    ("secondary label", "main th, main dt", False),
]
MIN_RATIO_NORMAL = 4.5
MIN_RATIO_LARGE = 3.0
# Guard against every probe silently failing to match after a markup change.
MIN_RESOLVED_PROBES = 4

DISABLE_MOTION_CSS = """
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
"""

# Executed in-page: computes the WCAG contrast ratio of an element's text
# against the first non-transparent ancestor background.
CONTRAST_JS = """
(selector) => {
  const el = document.querySelector(selector);
  if (!el) return null;
  const parse = (c) => {
    const m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const cs = getComputedStyle(el);
  const fg = parse(cs.color);
  let node = el, bg = null;
  while (node && node !== document.documentElement.parentNode) {
    const c = parse(getComputedStyle(node).backgroundColor);
    if (c && c.a > 0.95) { bg = c; break; }
    node = node.parentElement;
  }
  if (!fg || !bg) return null;
  // Flatten a translucent foreground over the resolved background.
  const flat = {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
  };
  const l1 = lum(flat), l2 = lum(bg);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return {
    ratio: Math.round(ratio * 100) / 100,
    color: cs.color,
    background: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
    fontSize: parseFloat(cs.fontSize),
    fontWeight: cs.fontWeight,
    text: (el.textContent || "").trim().slice(0, 40),
  };
}
"""


# --------------------------------------------------------------------------- #
# session
# --------------------------------------------------------------------------- #
def load_session() -> dict:
    """Return {cookies, storage_key, session_json} from env or minted file."""
    if os.environ.get("LOVABLE_BROWSER_AUTH_STATUS") == "injected":
        return {
            "cookies": json.loads(os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON") or "[]"),
            "storage_key": os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"),
            "session_json": os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON"),
        }

    path = Path(
        os.environ.get("LOVABLE_SESSION_FILE", "~/.cache/lovable-auth/session.json")
    ).expanduser()
    if path.exists():
        minted = json.loads(path.read_text())
        return {
            "cookies": minted.get("cookies", []),
            "storage_key": minted["storage_key"],
            "session_json": json.dumps(minted["session"]),
        }

    raise SystemExit(
        "No admin session available. Sign in via the Lovable preview (so the "
        "session env vars are injected) or mint one with `lovable auth-session "
        "--json`, then re-run."
    )


async def restore_session(context, page, session: dict) -> None:
    if session["cookies"]:
        cookies = [dict(c, url=BASE_URL) for c in session["cookies"]]
        await context.add_cookies(cookies)
    await page.goto(BASE_URL, wait_until="domcontentloaded")
    if session["storage_key"] and session["session_json"]:
        await page.evaluate(
            "([k, v]) => window.localStorage.setItem(k, v)",
            [session["storage_key"], session["session_json"]],
        )


# --------------------------------------------------------------------------- #
# capture
# --------------------------------------------------------------------------- #
async def install_invoice_fixture(page) -> None:
    async def handler(route: Route) -> None:
        await route.fulfill(
            status=200,
            headers={
                "content-type": "application/json",
                "content-range": f"0-{len(INVOICE_FIXTURE) - 1}/{len(INVOICE_FIXTURE)}",
            },
            body=json.dumps(INVOICE_FIXTURE),
        )

    await page.route("**/rest/v1/invoices*", handler)


async def capture(context, theme: str, vp: dict) -> tuple[Path, list[str]]:
    """Screenshot <main> for one theme/breakpoint and run the live assertions."""
    failures: list[str] = []
    page = await context.new_page()
    await page.set_viewport_size({"width": vp["width"], "height": vp["height"]})
    await page.emulate_media(color_scheme=theme, reduced_motion="reduce")
    await install_invoice_fixture(page)
    await page.add_init_script(
        f"""
        document.addEventListener('DOMContentLoaded', () => {{
          document.documentElement.classList.{'add' if theme == 'dark' else 'remove'}('dark');
        }});
        """
    )

    await page.goto(f"{BASE_URL}{ROUTE}", wait_until="domcontentloaded")
    await page.wait_for_selector("main h1", timeout=15_000)
    # Wait for the fixture rows to paint (first invoice number is unique).
    # Both the mobile card list and the desktop table render the same invoice
    # number, with the other branch hidden — wait for a *visible* occurrence.
    await page.wait_for_function(
        """(needle) => [...document.querySelectorAll('main a')].some(
             (a) => a.textContent.trim() === needle && a.getClientRects().length > 0)""",
        arg=INVOICE_FIXTURE[0]["invoice_number"],
        timeout=15_000,
    )
    await page.add_style_tag(content=DISABLE_MOTION_CSS)
    await page.evaluate(
        "(cls) => document.documentElement.classList.toggle('dark', cls)", theme == "dark"
    )
    await page.wait_for_timeout(400)

    case = f"{theme}-{vp['name']}-{vp['width']}"

    # --- overflow -----------------------------------------------------------
    metrics = await page.evaluate(
        "() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })"
    )
    if metrics["sw"] > metrics["iw"] + 1:
        failures.append(
            f"{case}: horizontal overflow — scrollWidth {metrics['sw']}px > viewport "
            f"{metrics['iw']}px"
        )

    # --- contrast -----------------------------------------------------------
    resolved_probes = 0
    for label, selector, is_large in CONTRAST_PROBES:
        info = await page.evaluate(CONTRAST_JS, selector)
        if not info:
            continue  # probe not rendered at this breakpoint (e.g. table-only cell)
        resolved_probes += 1
        large = is_large or info["fontSize"] >= 24 or (
            info["fontSize"] >= 18.66 and int(float(info["fontWeight"])) >= 700
        )
        minimum = MIN_RATIO_LARGE if large else MIN_RATIO_NORMAL
        if info["ratio"] < minimum:
            failures.append(
                f"{case}: {label} contrast {info['ratio']}:1 < {minimum}:1 "
                f"({info['color']} on {info['background']}, text={info['text']!r})"
            )

    # Selector rot would silently disable the contrast gate — require a floor.
    if resolved_probes < MIN_RESOLVED_PROBES:
        failures.append(
            f"{case}: only {resolved_probes}/{len(CONTRAST_PROBES)} contrast probes "
            f"resolved (expected >= {MIN_RESOLVED_PROBES}) — selectors likely stale"
        )

    # --- pixels -------------------------------------------------------------
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    actual = ARTIFACTS / f"{case}.actual.png"
    await page.locator("main").first.screenshot(path=str(actual))
    await page.close()
    return actual, failures


def compare_pixels(case: str, actual: Path) -> str | None:
    baseline = BASELINES / f"{case}.png"
    if UPDATE or not baseline.exists():
        BASELINES.mkdir(parents=True, exist_ok=True)
        Image.open(actual).save(baseline)
        print(f"  [baseline] wrote {baseline.relative_to(ROOT)}")
        return None

    a = Image.open(baseline).convert("RGB")
    b = Image.open(actual).convert("RGB")
    if a.size != b.size:
        return f"{case}: size changed {a.size} -> {b.size} (layout regression)"
    diff = ImageChops.difference(a, b)
    hist = diff.histogram()
    # Mean per-channel difference across all three channels.
    total = sum(i % 256 * v for i, v in enumerate(hist))
    count = a.size[0] * a.size[1] * 3
    mean = total / count
    if mean > MAX_MEAN_DIFF:
        out = ARTIFACTS / f"{case}.diff.png"
        diff.point(lambda v: min(255, v * 6)).save(out)
        return (
            f"{case}: mean pixel diff {mean:.3f} > {MAX_MEAN_DIFF} "
            f"(see {out.relative_to(ROOT)})"
        )
    print(f"  [pixels] {case}: mean diff {mean:.3f}")
    return None


async def main() -> int:
    session = load_session()
    failures: list[str] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 1000},
            device_scale_factor=1,
            reduced_motion="reduce",
        )
        page = await context.new_page()
        await restore_session(context, page, session)
        await page.close()

        for theme in THEMES:
            for vp in BREAKPOINTS:
                case = f"{theme}-{vp['name']}-{vp['width']}"
                print(f"[capture] {case}")
                actual, live_failures = await capture(context, theme, vp)
                failures.extend(live_failures)
                pixel_failure = compare_pixels(case, actual)
                if pixel_failure:
                    failures.append(pixel_failure)

        await browser.close()

    if UPDATE:
        print("\nBaselines refreshed — review the PNGs before committing.")
        return 0

    if failures:
        print("\nVISUAL REGRESSION(S) DETECTED:")
        for f in failures:
            print(f"  - {f}")
        print(f"\nArtifacts: {ARTIFACTS.relative_to(ROOT)}")
        return 1

    print(f"\nOK — {len(THEMES) * len(BREAKPOINTS)} theme/breakpoint combinations clean.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(asyncio.run(main()))
    except SystemExit:
        raise
    except Exception as exc:  # harness error, not a product regression
        print(f"HARNESS ERROR: {exc}")
        sys.exit(2)
