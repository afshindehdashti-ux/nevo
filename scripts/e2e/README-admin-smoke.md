# Admin list smoke test

`admin-list-smoke.py` verifies that the three admin list pages
(`/admin/opportunities`, `/admin/commission-invoices`,
`/admin/purchase-orders`) render seeded records instead of the
`ListErrorState` "Failed to load" card.

## Files

- `seed-admin-smoke.sql` — idempotent seed (fixed UUIDs, `SMOKE-TEST` prefix).
- `cleanup-admin-smoke.sql` — deletes exactly the seeded rows.
- `admin-list-smoke.py` — Playwright driver.

## Run

```bash
# One-shot: seed, verify, keep rows
python3 scripts/e2e/admin-list-smoke.py

# Seed, verify, then remove seed data
python3 scripts/e2e/admin-list-smoke.py --cleanup
```

Requires:

- Dev server on `http://localhost:8080`.
- `PG*` env vars available for `psql` (Lovable sandbox provides these).
- `LOVABLE_BROWSER_AUTH_STATUS=injected`. If it's `signed_out`, sign in
  once through the preview so a session is minted, then re-run.

Screenshots are written to `/tmp/browser/admin-smoke/screenshots/`.
Exit code is `0` when all three pages pass, `1` otherwise.
