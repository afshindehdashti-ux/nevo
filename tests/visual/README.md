# Visual Regression — Industry Cards

Screenshots every card on `/en/industries` at desktop (1280) and mobile (390) and compares them to the approved baselines in `baselines/`.

## Run

```bash
# dev server must be running at http://localhost:8080
python tests/visual/industry_cards_test.py
```

- **First run** (no baselines): writes `tests/visual/baselines/{desktop,mobile}/card-NN.png`. Commit those as the approved set.
- **Later runs**: fail if any card's mean per-channel pixel diff exceeds 2/255. Actual + diff PNGs land under `tests/visual/diffs/`.

## Update baselines after an intentional change

```bash
UPDATE_BASELINES=1 python tests/visual/industry_cards_test.py
```

Review the updated baselines before committing.

## Notes

- Animations and Framer Motion `opacity/transform` are neutralized during capture.
- `prefers-reduced-motion` is forced via the Playwright context.
- Each card is captured through its own `data-testid="industry-card"` element, so unrelated layout shifts elsewhere on the page don't trigger diffs.
- Baselines are viewport-specific because card widths differ between mobile and desktop.
