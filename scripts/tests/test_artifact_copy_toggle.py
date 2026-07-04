"""Playwright e2e: verify every artifact-index copy button honours the
"Copy absolute URLs" toggle.

Covered buttons:
  - single per-item "Copy link"
  - per-group "Copy links"
  - per-group "Copy as Markdown"
  - "Copy all links" (all artifacts)
  - "Copy links (JSON)"
  - "Copy links (CSV)"
  - "Copy all displayed links"

For each button we click once with the toggle OFF (expect relative file
paths) and once with the toggle ON (expect absolute URLs derived from
ARTIFACT_BASE_URL), then read `navigator.clipboard` back to assert the
payload switched correctly.

Runner (standalone, no pytest):

    python3 scripts/tests/test_artifact_copy_toggle.py
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
import tempfile
from pathlib import Path

# Set ARTIFACT_BASE_URL BEFORE importing preflight — it is read at module load.
ARTIFACT_BASE_URL = "https://example.com/artifacts"
os.environ["ARTIFACT_BASE_URL"] = ARTIFACT_BASE_URL

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import preflight_solutions_seo as p  # noqa: E402


def _make_results() -> list[dict]:
    return [
        {"ok": True, "ms": 12, "status": 200, "error_kind": "ok",
         "status_class": "2xx", "attempts": 1, "url": "https://a.test/"},
        {"ok": False, "ms": 900, "status": 503, "error_kind": "http",
         "status_class": "5xx", "attempts": 2, "url": "https://b.test/"},
    ]


def _generate_summary_html(tmpdir: Path) -> Path:
    """Run export_results into a temp dir, wrap the summary content as HTML."""
    csv_path = tmpdir / "results.csv"
    json_path = tmpdir / "results.json"
    bd_csv = tmpdir / "breakdown.csv"
    summary_path = tmpdir / "summary.md"

    os.environ["RESULTS_CSV_PATH"] = str(csv_path)
    os.environ["RESULTS_JSON_PATH"] = str(json_path)
    os.environ["BREAKDOWN_CSV_PATH"] = str(bd_csv)
    os.environ["GITHUB_STEP_SUMMARY"] = str(summary_path)
    # Keep the run cheap and predictable.
    os.environ["DISABLE_HEATMAP_EXPORT"] = "true"
    p._DISABLE_HEATMAP_EXPORT = True

    p.export_results(_make_results())

    body = summary_path.read_text(encoding="utf-8")
    html_path = tmpdir / "summary.html"
    html_path.write_text(
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<title>test</title></head><body>\n"
        # showCopyToast is defined elsewhere in the real page; stub it so
        # button onclick handlers do not throw.
        "<script>window.showCopyToast = function(){};</script>\n"
        + body
        + "\n</body></html>",
        encoding="utf-8",
    )
    return html_path


async def _read_clipboard(page) -> str:
    return await page.evaluate("navigator.clipboard.readText()")


async def _click_and_read(page, selector: str) -> str:
    await page.evaluate("navigator.clipboard.writeText('')")
    await page.locator(selector).first.click()
    # Clipboard writes are async inside the onclick handler.
    for _ in range(20):
        text = await _read_clipboard(page)
        if text:
            return text
        await asyncio.sleep(0.05)
    return await _read_clipboard(page)


async def _set_toggle(page, on: bool) -> None:
    checked = await page.evaluate(
        "document.getElementById('artifact-url-toggle').checked"
    )
    if checked != on:
        await page.locator("#artifact-url-toggle").click()
    state = await page.evaluate(
        "document.getElementById('artifact-url-toggle').checked"
    )
    assert state is on, f"toggle failed to reach state={on}"


def _assert_all_relative(payload: str, base_url: str, label: str) -> None:
    assert base_url not in payload, (
        f"{label}: expected relative paths, got payload containing {base_url!r}:\n{payload}"
    )


def _assert_all_absolute(payload: str, base_url: str, label: str) -> None:
    assert base_url in payload, (
        f"{label}: expected absolute URLs (base={base_url}), got:\n{payload}"
    )


async def _run(html_path: Path) -> None:
    from playwright.async_api import async_playwright

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 1800}
        )
        # Grant clipboard permissions for file:// origin.
        await context.grant_permissions(
            ["clipboard-read", "clipboard-write"]
        )
        page = await context.new_page()
        await page.goto(html_path.as_uri(), wait_until="domcontentloaded")

        # Sanity: page rendered the toggle + at least one item + copy buttons.
        await page.wait_for_selector("#artifact-url-toggle")
        await page.wait_for_selector(".artifact-item")

        cases = [
            # (label, selector) — one representative selector per button flavour.
            ("single Copy link",
             ".artifact-item button[aria-label^='Copy link for']"),
            ("group Copy links",
             ".artifact-index button[aria-label^='Copy links for']"),
            ("group Copy as Markdown",
             ".artifact-index button[aria-label^='Copy Markdown links for']"),
            ("Copy all links",
             "button[aria-label='Copy all artifact links']"),
            ("Copy links (JSON)",
             "button[aria-label='Copy all artifact paths as JSON']"),
            ("Copy links (CSV)",
             "button[aria-label='Copy all artifact links as CSV']"),
            ("Copy all displayed links",
             "button[aria-label='Copy all displayed artifact links']"),
        ]

        for label, selector in cases:
            # Toggle OFF → relative paths only.
            await _set_toggle(page, False)
            rel = await _click_and_read(page, selector)
            assert rel, f"{label}: empty clipboard when toggle off"
            _assert_all_relative(rel, ARTIFACT_BASE_URL, label + " [off]")

            # Toggle ON → absolute URLs.
            await _set_toggle(page, True)
            abs_ = await _click_and_read(page, selector)
            assert abs_, f"{label}: empty clipboard when toggle on"
            _assert_all_absolute(abs_, ARTIFACT_BASE_URL, label + " [on]")

            assert rel != abs_, (
                f"{label}: payload did not change when toggle flipped"
            )
            print(f"  ok — {label}")

        # RFC 4180 check for the Python-fed CSV button: after HTML attribute
        # normalization strips CR, the onclick handler must restore CRLF and
        # csv.writer must have already escaped commas/quotes/newlines in
        # labels + paths.
        await _set_toggle(page, False)
        # Inject a row with tricky content, then re-copy.
        csv_payload = await page.evaluate(
            r"""async () => {
              const btn = document.querySelector("button[aria-label='Copy all artifact links as CSV']");
              const q = String.fromCharCode(34);   // "
              const cr = String.fromCharCode(13);  // \r
              const lf = String.fromCharCode(10);  // \n
              const nl = cr + lf;
              // Build tricky payload from char codes to avoid embedding a triple-quote.
              const tricky =
                "label,path" + nl +
                q + "weird, name" + q + "," + q + "path with " + q+q + "quotes" + q+q + q + nl +
                q + "multi" + lf + "line" + q + ",x" + nl;
              btn.dataset.csv = tricky;
              await navigator.clipboard.writeText('');
              btn.click();
              await new Promise(r => setTimeout(r, 100));
              return navigator.clipboard.readText();
            }"""
        )
        assert "\r\n" in csv_payload, (
            f"CSV clipboard payload lost CRLF line terminators:\n{csv_payload!r}"
        )
        assert '"weird, name"' in csv_payload, "comma-in-field not quoted"
        # Doubled internal quotes: field `path with "quotes"` becomes
        # `"path with ""quotes"""` (two-quote before "quotes", three-quote after).
        assert '""quotes"""' in csv_payload, "internal quotes not doubled"
        assert '"multi' in csv_payload and 'line"' in csv_payload, (
            "newline-in-field not quoted"
        )
        print("  ok — CSV RFC 4180 escaping preserved through DOM roundtrip")

        # Delimiter toggle: switching to ';' must produce a semicolon-delimited
        # CSV payload and back to ',' must restore the comma variant.
        async def _copy_csv_with(delim: str) -> str:
            await page.evaluate(
                f"const s=document.getElementById('artifact-csv-delimiter');"
                f"s.value={delim!r}; s.dispatchEvent(new Event('change'));"
                "navigator.clipboard.writeText('');"
            )
            await page.locator(
                "button[aria-label='Copy all artifact links as CSV']"
            ).click()
            for _ in range(20):
                text = await _read_clipboard(page)
                if text:
                    return text
                await asyncio.sleep(0.05)
            return await _read_clipboard(page)

        await _set_toggle(page, False)
        comma_payload = await _copy_csv_with(",")
        semi_payload = await _copy_csv_with(";")
        header_line = semi_payload.split("\r\n", 1)[0]
        assert header_line.startswith("label;path"), (
            f"semicolon delimiter not applied to header: {header_line!r}"
        )
        assert "," not in header_line, (
            f"header still contains comma after semicolon switch: {header_line!r}"
        )
        assert comma_payload.split("\r\n", 1)[0].startswith("label,path"), (
            "comma delimiter regressed"
        )
        print("  ok — CSV delimiter toggle (comma ↔ semicolon)")

        await browser.close()


def main() -> int:
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        html_path = _generate_summary_html(tmp)
        # Sanity-check the fixture actually contains what we plan to test.
        html = html_path.read_text(encoding="utf-8")
        for needle in (
            "artifact-url-toggle",
            "Copy all artifact links",
            "Copy all displayed artifact links",
            "Copy all artifact paths as JSON",
            "Copy all artifact links as CSV",
            "Copy Markdown links for",
            "Copy link for",
        ):
            assert needle in html, f"fixture missing marker: {needle!r}"
        asyncio.run(_run(html_path))
    print("test_artifact_copy_toggle: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
