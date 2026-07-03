#!/usr/bin/env python3
"""Visual regression test for the /industries page cards.

Screenshots every industry card at desktop (1280) and mobile (390) viewports
and compares each against the approved baseline in
tests/visual/baselines/<viewport>/card-NN.png.

Usage:
    # dev server must be running on http://localhost:8080
    python tests/visual/industry_cards_test.py

    # regenerate baselines after an intentional change
    UPDATE_BASELINES=1 python tests/visual/industry_cards_test.py

Exit code 0 on pass, 1 on any regression. Diffs are written under
tests/visual/diffs/<viewport>/ for review.
"""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from PIL import Image, ImageChops
from playwright.async_api import async_playwright

ROOT = Path(__file__).parent
BASELINES = ROOT / "baselines"
DIFFS = ROOT / "diffs"
BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080")
ROUTE = "/en/industries"
UPDATE = os.environ.get("UPDATE_BASELINES") == "1"
# Fail if the mean per-channel pixel difference exceeds this (0..255 scale).
MAX_MEAN_DIFF = 2.0

VIEWPORTS = [
    {"name": "desktop", "width": 1280, "height": 1800},
    {"name": "mobile", "width": 390, "height": 1800},
]


def image_diff(a_path: Path, b_path: Path, diff_out: Path) -> tuple[bool, str]:
    a = Image.open(a_path).convert("RGB")
    b = Image.open(b_path).convert("RGB")
    if a.size != b.size:
        return False, f"size mismatch {a.size} vs {b.size}"
    diff = ImageChops.difference(a, b)
    # Mean per-channel diff.
    stat = diff.getdata()
    total = 0
    count = 0
    for px in stat:
        total += px[0] + px[1] + px[2]
        count += 3
    mean = total / count
    if mean > MAX_MEAN_DIFF:
        diff_out.parent.mkdir(parents=True, exist_ok=True)
        # Amplify for human review.
        amp = diff.point(lambda v: min(255, v * 6))
        amp.save(diff_out)
        return False, f"mean pixel diff {mean:.3f} > {MAX_MEAN_DIFF}"
    return True, f"mean diff {mean:.3f}"


async def screenshot_cards(page, viewport, out_dir: Path) -> list[tuple[str, Path]]:
    await page.set_viewport_size({"width": viewport["width"], "height": viewport["height"]})
    await page.goto(f"{BASE_URL}{ROUTE}", wait_until="networkidle")
    # Kill animations and force cards visible even without in-view trigger.
    await page.add_style_tag(content="""
        *,*::before,*::after{animation:none!important;transition:none!important}
        [data-testid="industry-card"]{opacity:1!important;transform:none!important}
    """)
    # Scroll through so lazy images load.
    await page.evaluate("""async () => {
        const step = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 100));
        }
        window.scrollTo(0, 0);
    }""")
    await page.wait_for_load_state("networkidle")

    cards = page.locator('[data-testid="industry-card"]')
    n = await cards.count()
    if n == 0:
        raise RuntimeError("No industry cards found on the page")

    out_dir.mkdir(parents=True, exist_ok=True)
    files = []
    for i in range(n):
        card = cards.nth(i)
        await card.scroll_into_view_if_needed()
        # Wait for image decode.
        await card.locator("img").first.evaluate(
            "img => img.complete ? null : img.decode().catch(()=>{})"
        )
        idx = f"{i + 1:02d}"
        path = out_dir / f"card-{idx}.png"
        await card.screenshot(path=str(path))
        files.append((idx, path))
    return files


async def main() -> int:
    BASELINES.mkdir(parents=True, exist_ok=True)
    DIFFS.mkdir(parents=True, exist_ok=True)

    failures: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(reduced_motion="reduce", device_scale_factor=1)
        page = await context.new_page()

        for vp in VIEWPORTS:
            baseline_dir = BASELINES / vp["name"]
            actual_dir = DIFFS / vp["name"] / "actual"
            diff_dir = DIFFS / vp["name"] / "diff"
            baseline_dir.mkdir(parents=True, exist_ok=True)

            files = await screenshot_cards(page, vp, actual_dir)
            for idx, actual in files:
                baseline = baseline_dir / f"card-{idx}.png"
                if UPDATE or not baseline.exists():
                    baseline.write_bytes(actual.read_bytes())
                    print(f"[{vp['name']}] baseline "
                          f"{'updated' if UPDATE else 'written'}: card-{idx}.png")
                    continue
                ok, msg = image_diff(actual, baseline, diff_dir / f"card-{idx}.png")
                tag = "OK  " if ok else "FAIL"
                print(f"[{vp['name']}] {tag} card-{idx}.png — {msg}")
                if not ok:
                    failures.append(f"{vp['name']}/card-{idx}.png")

        await browser.close()

    if failures:
        print(f"\nVisual regression FAILED for {len(failures)} card(s):")
        for f in failures:
            print(f"  - {f}")
        print("Review diffs in tests/visual/diffs/. "
              "If the change is intentional, rerun with UPDATE_BASELINES=1.")
        return 1
    print("\nVisual regression passed.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
