# RLS role-matrix integration test

`rls-role-matrix.py` signs in as one user per app role and verifies that
Supabase RLS lets each role read the protected reference tables
(`customers`, `suppliers`, `products`) while blocking writes for roles
that should not have them — most importantly `read_only`.

## Setup (one-time)

Create six auth users through the admin UI (`/admin/users`) — one per
role. A single test domain works fine, e.g.
`rls-super_admin@nevo.test`. Assign each user exactly one role in
`user_roles`.

Export credentials for the script:

```bash
export RLS_SUPER_ADMIN_EMAIL=... RLS_SUPER_ADMIN_PASSWORD=...
export RLS_MANAGEMENT_EMAIL=...  RLS_MANAGEMENT_PASSWORD=...
export RLS_SALES_EMAIL=...       RLS_SALES_PASSWORD=...
export RLS_OPERATIONS_EMAIL=...  RLS_OPERATIONS_PASSWORD=...
export RLS_FINANCE_EMAIL=...     RLS_FINANCE_PASSWORD=...
export RLS_READ_ONLY_EMAIL=...   RLS_READ_ONLY_PASSWORD=...
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are auto-loaded
from `.env`.

## Run

```bash
python3 scripts/e2e/rls-role-matrix.py
```

Exit code `0` if the matrix matches the expected policy grid:

| Role        | customers | suppliers | products |
| ----------- | :-------: | :-------: | :------: |
| super_admin |    R/W    |    R/W    |   R/W    |
| management  |    R/W    |    R/W    |   R/W    |
| sales       |    R/W    |     R     |   R/W    |
| operations  |    R/W    |    R/W    |   R/W    |
| finance     |     R     |     R     |    R     |
| read_only   |     R     |     R     |    R     |

Any deviation prints a `FAIL:` list and exits `1`. A `!` in the matrix
is an RLS breach (write persisted when it should have been blocked).

Cleanup is inline: every successful probe insert is followed by a
delete keyed on the returned id, so the tables stay clean.
