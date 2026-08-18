#!/usr/bin/env python3
"""Visual regression: authenticated admin shell — overlays & z-index.

Why this exists
---------------
The admin shell (CrmSidebar + sticky header + AiAssistDrawer launcher) stacks
several independently-positioned layers. Two regression classes have already
bitten this app:

  1. Public marketing chrome leaking into /admin, /crm, /backoffice
     (AIAssistantLauncher, StickyMobileCTA, CookieConsent) — bottom-anchored
     `fixed` elements that sit on top of the sidebar footer.
  2. z-index drift — the sticky header (`z-10`), the desktop sidebar
     (`z-10` + rail `z-20`), the mobile sheet, the AI Assist launcher
     (`z-40`) and toasts all live in one stacking soup. A bumped z-index or a
     new full-width `fixed` bar silently covers sidebar navigation.

This harness pins both the *pixels* of the shell and the *hit-testability* of
its interactive regions, at every breakpoint, in both sidebar states.

What it checks, per case (breakpoint x sidebar state):
  1. PIXEL BASELINE — screenshot of the sidebar (mobile: the open sheet)
     compared against the approved PNG in
     tests/visual/baselines/admin-layout-overlays/. The volatile profile block
     in the footer is masked, so baselines don't depend on which account
     minted the session.
  2. OCCLUSION — `elementFromPoint` at the corners/centre of the sidebar
     footer, header, rail, trigger and the first/last menu buttons must
     resolve to a node inside that region. Anything else is an overlay
     covering admin chrome.
  3. STACKING INVENTORY — every visible `fixed`/`sticky` element that
     intersects the sidebar rect is listed with its z-index; the case fails on
     any element that is not in ALLOWED_OVERLAYS. New overlays are opt-in, not
     opt-out.
  4. LEAKED PUBLIC CHROME — the marketing CTA selectors must not exist at all.

Determinism
-----------
Animations/transitions are disabled, `prefers-reduced-motion` is forced, the
Supabase REST calls that back the dashboard are stubbed with empty arrays, and
the footer profile text is masked before capture.

Usage
-----
    # dev server must be running (default http://localhost:8080)
    python3 scripts/visual/admin-layout-overlays.py

    # approve intentional visual changes
    UPDATE_BASELINES=1 python3 scripts/visual/admin-layout-overlays.py

Auth: needs an authenticated admin session. Either
  - LOVABLE_BROWSER_AUTH_STATUS=injected (session env vars present), or
  - a minted session file at ~/.cache/lovable-auth/session.json
    (override with LOVABLE_SESSION_FILE).

Exit codes: 0 pass, 1 visual/overlay/stacking regression, 2 harness error.
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
BASELINES = ROOT / "tests" / "visual" / "baselines" / "admin-layout-overlays"
ARTIFACTS = ROOT / "tests" / "visual" / "diffs" / "admin-layout-overlays"
BASE_URL = os.environ.get("VISUAL_BASE_URL", "http://localhost:8080")
ROUTE = os.environ.get("VISUAL_ADMIN_ROUTE", "/admin")
UPDATE = os.environ.get("UPDATE_BASELINES") == "1"

MAX_MEAN_DIFF = 2.0

# `state` drives what we do before capturing:
#   sheet     — mobile: open the off-canvas sidebar via the trigger
#   expanded  — desktop default
#   collapsed — desktop, icon rail (trigger toggled once)
BREAKPOINTS = [
    {"name": "mobile", "width": 390, "height": 844, "states": ["sheet"]},
    {"name": "tablet", "width": 768, "height": 900, "states": ["expanded", "collapsed"]},
    {"name": "laptop", "width": 1280, "height": 900, "states": ["expanded", "collapsed"]},
    {"name": "wide", "width": 1536, "height": 960, "states": ["expanded", "collapsed"]},
]

# Regions that must stay clickable, per sidebar state. The mobile sheet
# deliberately covers the app header and its own trigger behind the scrim, so
# those two regions are only asserted in the desktop states.
# (label, selector, required, states)
ALL_STATES = ("sheet", "expanded", "collapsed")
DESKTOP_STATES = ("expanded", "collapsed")
HIT_REGIONS = [
    ("sidebar footer", '[data-sidebar="footer"]', True, ALL_STATES),
    ("sidebar header", '[data-sidebar="header"]', True, ALL_STATES),
    ("first nav link", '[data-sidebar="menu"] a', True, ALL_STATES),
    ("last nav link", '[data-sidebar="menu"] a:last-of-type', True, ALL_STATES),
    ("sidebar trigger", '[data-sidebar="trigger"]', True, DESKTOP_STATES),
    ("app header", "header.sticky", True, DESKTOP_STATES),
]

# Public marketing chrome — must never exist on an admin route. Keep in sync
# with e2e/backend-cta-gate.spec.ts.
LEAK_SELECTORS = [
    '[data-testid="ai-assistant-launcher"]',
    '[data-testid="sticky-mobile-cta"]',
    '[aria-label*="Ask" i][aria-label*="engineer" i]',
    '[aria-label="WhatsApp"]',
    '[aria-label="Cookie consent"]',
]

# Fixed/sticky layers that are *allowed* to intersect the sidebar. Matched
# against the element's own selector-ish signature computed in the page.
# Anything else fails the case — adding a new overlay is a deliberate edit here.
ALLOWED_OVERLAYS = {
    "sidebar-gap",  # the desktop sidebar's own width spacer
    "sidebar-container",  # the desktop sidebar itself
    "sidebar-sheet",  # mobile off-canvas sheet
    "sidebar-sheet-overlay",  # its scrim
    "sidebar-rail",  # drag rail
    "app-header",  # sticky admin header
    "toaster",  # sonner region (top-right, non-blocking)
  "ai-assist-launcher",  # admin-only AI Assist FAB (bottom-right, z-40)
}

DISABLE_MOTION_CSS = """
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
"""

# Hides the session-dependent profile block so baselines are account-agnostic.
MASK_PROFILE_CSS = """
  [data-sidebar="footer"] p { color: transparent !important; }
  [data-sidebar="footer"] p::after {
    content: '████████';
    color: rgba(127,127,127,0.6);
  }
"""

# Classifies every visible fixed/sticky layer and hit-tests the given regions.
INSPECT_JS = r"""
(regions) => {
  // This shadcn sidebar predates data-slot: the mobile variant is a Radix
  // dialog panel carrying data-mobile="true", the desktop variant is a
  // `fixed` wrapper around the [data-sidebar="sidebar"] inner column.
  const sidebar =
    document.querySelector('[data-sidebar="sidebar"][data-mobile="true"]') ||
    document.querySelector('[data-sidebar="sidebar"]');
  const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;

  const signature = (el) => {
    const sb = el.getAttribute('data-sidebar');
    if (sb === 'rail') return 'sidebar-rail';
    if (el.getAttribute('data-mobile') === 'true') return 'sidebar-sheet';
    if (el.getAttribute('data-radix-focus-guard') !== null) return 'sidebar-sheet';
    if (el.closest('[data-sidebar="sidebar"][data-mobile="true"]')) return 'sidebar-sheet';
    if (el.getAttribute('aria-hidden') === 'true' && /bg-black\//.test(String(el.className)))
      return 'sidebar-sheet-overlay';
    if (sb === 'sidebar' || el.querySelector(':scope > [data-sidebar="sidebar"]'))
      return 'sidebar-container';
    if (el.tagName === 'HEADER') return 'app-header';
    if (el.getAttribute('aria-label') === 'Open AI Assistant') return 'ai-assist-launcher';
    if (el.closest('[data-sonner-toaster]') || el.hasAttribute('data-sonner-toaster'))
      return 'toaster';
    return null;
  };

  const overlaps = (a, b) =>
    a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

  // --- stacking inventory ---
  const layers = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (!overlaps(r, sidebarRect)) continue;
    layers.push({
      signature: signature(el),
      tag: el.tagName.toLowerCase(),
      zIndex: cs.zIndex,
      position: cs.position,
      pointerEvents: cs.pointerEvents,
      className: String(el.className || '').slice(0, 120),
      rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
    });
  }

  // --- hit tests ---
  const hits = [];
  for (const [label, selector, required] of regions) {
    const el = document.querySelector(selector);
    if (!el) { hits.push({ label, selector, missing: true, required }); continue; }
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) {
      hits.push({ label, selector, hidden: true, required });
      continue;
    }
    const pts = [
      [r.left + 4, r.top + 4],
      [r.left + r.width / 2, r.top + r.height / 2],
      [r.right - 4, r.bottom - 4],
    ];
    const covered = [];
    for (const [x, y] of pts) {
      const hit = document.elementFromPoint(x, y);
      if (!hit || !(el === hit || el.contains(hit))) {
        covered.push({
          x: Math.round(x),
          y: Math.round(y),
          by: hit ? hit.tagName.toLowerCase() : 'nothing',
          className: hit ? String(hit.className || '').slice(0, 90) : '',
          zIndex: hit ? getComputedStyle(hit).zIndex : '',
        });
      }
    }
    hits.push({ label, selector, required, covered, rect:
      [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] });
  }

  return { sidebar: !!sidebar, layers, hits,
           scrollWidth: document.documentElement.scrollWidth,
           innerWidth: window.innerWidth };
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
        await context.add_cookies([dict(c, url=BASE_URL) for c in session["cookies"]])
    await page.goto(BASE_URL, wait_until="domcontentloaded")
    if session["storage_key"] and session["session_json"]:
        await page.evaluate(
            "([k, v]) => window.localStorage.setItem(k, v)",
            [session["storage_key"], session["session_json"]],
        )


# --------------------------------------------------------------------------- #
# capture
# --------------------------------------------------------------------------- #
async def stub_rest(page) -> None:
    """Empty-but-valid REST responses so dashboard widgets settle instantly."""

    async def handler(route: Route) -> None:
        await route.fulfill(
            status=200,
            headers={"content-type": "application/json", "content-range": "0-0/0"},
            body="[]",
        )

    await page.route("**/rest/v1/**", handler)


async def prepare_state(page, state: str) -> None:
    trigger = page.locator('[data-sidebar="trigger"]').first
    if state == "sheet":
        await trigger.click()
        await page.wait_for_selector(
            '[data-sidebar="sidebar"][data-mobile="true"]', timeout=10_000
        )
    elif state == "collapsed":
        await trigger.click()
        await page.wait_for_function(
            """() => document.querySelector('[data-sidebar="sidebar"]')
                    ?.closest('.group')?.getAttribute('data-state') === 'collapsed'""",
            timeout=10_000,
        )
    await page.wait_for_timeout(400)


async def capture(context, vp: dict, state: str) -> tuple[str, Path | None, list[str]]:
    case = f"{vp['name']}-{vp['width']}-{state}"
    failures: list[str] = []
    page = await context.new_page()
    await page.set_viewport_size({"width": vp["width"], "height": vp["height"]})
    await page.emulate_media(color_scheme="dark", reduced_motion="reduce")
    await stub_rest(page)

    await page.goto(f"{BASE_URL}{ROUTE}", wait_until="domcontentloaded")
    await page.wait_for_selector('[data-sidebar="trigger"]', timeout=20_000)
    await page.add_style_tag(content=DISABLE_MOTION_CSS)
    await page.add_style_tag(content=MASK_PROFILE_CSS)
    await prepare_state(page, state)

    # --- leaked public chrome ----------------------------------------------
    for selector in LEAK_SELECTORS:
        count = await page.locator(selector).count()
        if count:
            failures.append(f"{case}: public chrome leaked into admin — {selector} x{count}")

    regions = [
        [label, selector, required]
        for label, selector, required, states in HIT_REGIONS
        if state in states
    ]
    info = await page.evaluate(INSPECT_JS, regions)

    if not info["sidebar"]:
        failures.append(f"{case}: no sidebar element found — shell markup changed")
        await page.close()
        return case, None, failures

    # --- occlusion ----------------------------------------------------------
    for hit in info["hits"]:
        if hit.get("missing") or hit.get("hidden"):
            if hit["required"]:
                failures.append(
                    f"{case}: required region {hit['label']!r} ({hit['selector']}) "
                    f"{'missing from DOM' if hit.get('missing') else 'has zero size'}"
                )
            continue
        for c in hit.get("covered", []):
            failures.append(
                f"{case}: {hit['label']} covered at ({c['x']},{c['y']}) by "
                f"<{c['by']}> z-index {c['zIndex'] or 'auto'} class={c['className']!r}"
            )

    # --- stacking inventory -------------------------------------------------
    for layer in info["layers"]:
        if layer["signature"] in ALLOWED_OVERLAYS:
            continue
        failures.append(
            f"{case}: unexpected {layer['position']} layer over the sidebar — "
            f"<{layer['tag']}> z-index {layer['zIndex']} rect {layer['rect']} "
            f"class={layer['className']!r}. If intentional, add a signature to "
            f"ALLOWED_OVERLAYS."
        )

    # --- overflow -----------------------------------------------------------
    if info["scrollWidth"] > info["innerWidth"] + 1:
        failures.append(
            f"{case}: horizontal overflow — scrollWidth {info['scrollWidth']}px > "
            f"viewport {info['innerWidth']}px"
        )

    # --- pixels -------------------------------------------------------------
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS / f"{case}.layers.json").write_text(json.dumps(info, indent=2))
    target = page.locator(
        '[data-sidebar="sidebar"][data-mobile="true"]'
        if state == "sheet"
        else '[data-sidebar="sidebar"]'
    ).first
    actual = ARTIFACTS / f"{case}.actual.png"
    await target.screenshot(path=str(actual))
    await page.close()
    return case, actual, failures


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
    total = sum(i % 256 * v for i, v in enumerate(hist))
    mean = total / (a.size[0] * a.size[1] * 3)
    if mean > MAX_MEAN_DIFF:
        out = ARTIFACTS / f"{case}.diff.png"
        diff.point(lambda v: min(255, v * 6)).save(out)
        return f"{case}: mean pixel diff {mean:.3f} > {MAX_MEAN_DIFF} (see {out.relative_to(ROOT)})"
    print(f"  [pixels] {case}: mean diff {mean:.3f}")
    return None


async def main() -> int:
    session = load_session()
    failures: list[str] = []
    cases = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
            device_scale_factor=1,
            reduced_motion="reduce",
            color_scheme="dark",
        )
        page = await context.new_page()
        await restore_session(context, page, session)
        await page.close()

        for vp in BREAKPOINTS:
            for state in vp["states"]:
                cases += 1
                case, actual, live_failures = await capture(context, vp, state)
                print(f"[capture] {case}")
                failures.extend(live_failures)
                if actual is not None:
                    pixel_failure = compare_pixels(case, actual)
                    if pixel_failure:
                        failures.append(pixel_failure)

        await browser.close()

    if UPDATE:
        print("\nBaselines refreshed — review the PNGs before committing.")
        return 1 if any("covered" in f or "leaked" in f for f in failures) else 0

    if failures:
        print("\nADMIN LAYOUT REGRESSION(S) DETECTED:")
        for f in failures:
            print(f"  - {f}")
        print(f"\nArtifacts: {ARTIFACTS.relative_to(ROOT)}")
        return 1

    print(f"\nOK — {cases} breakpoint/state cases clean (pixels, occlusion, stacking).")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(asyncio.run(main()))
    except SystemExit:
        raise
    except Exception as exc:  # harness error, not a product regression
        print(f"HARNESS ERROR: {exc}")
        sys.exit(2)
