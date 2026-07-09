## Goal
Ship a real, workable ERP backend layer with consistent CRUD across the four finance document types, wire the UI to it, then get all 17 System Health checks green.

## Decision: source of truth
Keep the **type-specific tables** (`quotations`, `proforma_invoices`, `invoices`, `orders` + their item tables). Reasons:
- Every existing UI page (quotations, proforma, invoices, orders) already reads/writes them.
- DB triggers for numbering, totals recalc, approvals, status history are all wired to these tables.
- `finance_documents` is unused by the live pages and duplicates functionality.

`finance_documents` stays untouched (do not drop — the import center writes to it), but no new work goes there.

## Phase 2 — Server functions (this turn)
Create four sibling files with identical shapes:
- `src/lib/quotations.functions.ts` — add missing `recalcQuotationTotals` (rest already exists)
- `src/lib/proforma-invoices.functions.ts` — new
- `src/lib/commercial-invoices.functions.ts` — new
- `src/lib/purchase-orders.functions.ts` — new

Each exports:
```
list / get / create / updateHeader
addItem / updateItem / removeItem
recalcTotals / saveAll / delete
```

Rules for every fn:
- `.middleware([requireSupabaseAuth])`
- zod `inputValidator`
- `created_by` / `updated_by` from `context.userId`
- After any item mutation, call `recalcTotals` (belt-and-braces on top of DB triggers)
- Write `activity_logs` on create / delete / status change
- Return plain DTOs (no SDK objects)

Math (shared):
```text
line_total = round(qty * unit_price * (1 - discount_pct/100), 2)
subtotal   = sum(line_total)
vat        = round(subtotal * vat_rate/100, 2)
total      = subtotal + vat
```

## Phase 3 — UI wiring
Migrate the finance pages to call the new server fns instead of hitting Supabase directly from the client:
- Proforma create / edit / delete / add-line
- Commercial invoice create / edit / delete
- Purchase order create / edit / delete
- Keep quotations as-is (already using its `.functions.ts`)

Existing PDF, email, and conversion fns stay untouched.

## Phase 4 — Get 17/17 System Health checks green
- Run `/admin/system-health` → Run Full Backend Test
- For each Fail/Warning, diagnose and fix (RLS grant, missing fn, wrong shape, etc.)
- Re-run until 17/17 pass and no `TEST-NEVO-QA-` rows leak

## Out of scope
- No schema migrations unless a health check exposes a real gap
- No PDF, email, or conversion changes
- No `finance_documents` refactor
- No design/UI redesign

## Verification per phase
- Phase 2: `tsgo` typecheck clean + build passes
- Phase 3: manual smoke on one doc of each type
- Phase 4: Playwright script `admin-qa-run-full-backend-test.py` returns exit 0

Approve and I'll start with Phase 2 (the three new `.functions.ts` files + `recalcQuotationTotals`), then move to Phase 3 and Phase 4 in follow-up turns.