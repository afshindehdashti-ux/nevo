# Visual Regression — Industry Cards

Screenshots every card on `/en/industries` at desktop (1280) and mobile (390) viewports and compares them to the approved baselines committed under `baselines/`.

## Run

```bash
# make sure the dev server is running (http://localhost:8080)
node tests/visual/industry-cards.spec.mjs
```

- First run (no baselines): writes `tests/visual/baselines/{desktop,mobile}/card-NN.png`. Commit those as the approved set.
- Subsequent runs: fails if any card differs by more than 0.5% of pixels. Failing runs write the actual + diff PNGs under `tests/visual/diffs/`.

## Update baselines (after an intentional design/image change)

```bash
UPDATE_BASELINES=1 node tests/visual/industry-cards.spec.mjs
```

Then review the updated PNGs before committing.

## Notes

- Animations and transitions are disabled during capture; motion-driven `opacity/transform` on cards is neutralized so offscreen cards render fully.
- `prefers-reduced-motion` is forced via the Playwright context.
- Each card is captured via its own `data-testid="industry-card"` element screenshot, so layout shifts elsewhere on the page don't cause false diffs.
