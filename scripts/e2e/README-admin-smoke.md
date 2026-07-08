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
- `PG*` env vars for `psql` pointing at a role that can INSERT into
  `public.customers`, `partners`, `opportunities`, `orders`, and
  `partner_commissions` (service role / local dev DB owner). The default
  Lovable sandbox exec role is read-only for public tables, so the seed
  step must be run from an environment that has write access — typically
  a local checkout with the Supabase service credentials exported as
  `PGHOST`/`PGUSER`/`PGPASSWORD`/`PGDATABASE`.
- `LOVABLE_BROWSER_AUTH_STATUS=injected`. If it's `signed_out`, sign in
  once through the preview so a session is minted, then re-run.

If you can't run the seed from your shell, apply
`seed-admin-smoke.sql` via a one-off migration in a staging environment
and then run the script with `SMOKE_SKIP_SEED=1` to skip the psql step.

Screenshots are written to `/tmp/browser/admin-smoke/screenshots/`.
Exit code is `0` when all three pages pass, `1` otherwise.
