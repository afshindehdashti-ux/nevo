# Finance normalization rules

All display, calculation, and PDF code paths for **quotations, proforma
invoices, invoices, and payments** MUST read money fields through the
helpers in [`src/lib/finance-normalization.ts`](../src/lib/finance-normalization.ts).
Direct property access like `row.balance`, `row.total`, or `row.grand_total`
is forbidden in read paths and is enforced in CI by
[`scripts/check-finance-normalization.mjs`](../scripts/check-finance-normalization.mjs)
(GitHub workflow: `.github/workflows/check-finance-normalization.yml`,
package script: `pnpm check:finance-normalization`).

## Why

Finance rows come from three tables with three different column sets:

| Table               | Total column  | Paid column   | Balance column |
| ------------------- | ------------- | ------------- | -------------- |
| `invoices`          | `total`       | `amount_paid` | `balance`      |
| `proforma_invoices` | `grand_total` | `amount_paid` | `balance_due`  |
| `quotations`        | `total`       | —             | —              |

Reading columns directly means every call site has to remember which
variant it is looking at, coerce nulls, and re-derive `total − paid` when
the stored `balance` is missing. The helpers hide those differences so
KPIs, tables, PDFs, and AI summaries always agree.

## The helpers

```ts
import {
  customerDisplayName,
  customerBillingAddress,
  customerVatNumber,
  financePaidAmount,
  financeTotalAmount,
  financeBalanceDue,
} from "@/lib/finance-normalization";
```

| Helper                      | Reads (in order)                                      | Returns                     | Replaces                                       |
| --------------------------- | ----------------------------------------------------- | --------------------------- | ---------------------------------------------- |
| `customerDisplayName(c)`    | `company_name` → `name` → `email`                     | `string` (`"—"` on empty)   | ad-hoc `c.name ?? c.company_name ?? "—"`       |
| `customerBillingAddress(c)` | `billing_address` → `address`                         | `string \| null`            | direct reads of `billing_address` / `address`  |
| `customerVatNumber(c)`      | `vat_number` (trimmed)                                | `string \| null`            | direct reads / empty-string checks             |
| `financeTotalAmount(row)`   | `grand_total` → `total`                               | `number` (0 on missing/NaN) | `Number(row.total)`, `Number(row.grand_total)` |
| `financePaidAmount(row)`    | `amount_paid` → `paid_amount`                         | `number` (0 on missing/NaN) | `Number(row.amount_paid ?? 0)`                 |
| `financeBalanceDue(row)`    | stored `balance_due` → `balance`; else `total − paid` | `number` (never negative)   | `Number(row.balance)`, `total − paid` inline   |

All numeric helpers coerce strings, treat `null` / `undefined` / `""` as 0,
and `financeBalanceDue` clamps at 0 so partial over-payments never render a
negative balance in the UI.

### Inputs

The helpers accept any object shape as long as the relevant fields are
present. Callers do not need to widen row types; the helper parameter
types (`CustomerDisplay`, `FinanceBalance`) are intersection-compatible
with the generated Supabase row types.

### Outputs

- Customer helpers: `string` or `string | null` — feed into JSX / PDF text
  as-is; render `null` as a skipped line, not the literal word "null".
- Money helpers: plain `number` — pass into `formatMoney(value, currency)`
  or arithmetic. Never format a helper output with `.toString()` alone —
  use `formatMoney` so currency + locale stay consistent.

## Display-only files (MUST use helpers)

Any read for UI, PDF, email, or AI summary:

- `src/lib/invoice-pdf.ts`, `src/lib/proforma-invoice-pdf.ts`,
  `src/lib/quotation-pdf.ts`, `src/lib/proforma-pdf-e2e.ts`
- `src/routes/_authenticated/admin.invoices.tsx`,
  `admin.invoices.$id.tsx`, `admin.proforma-invoices.tsx`,
  `admin.proforma-invoices.$id.tsx`, `admin.quotations.tsx`,
  `admin.quotations.$id.tsx`, `admin.quotations.$id.print.tsx`,
  `admin.payments.tsx`, `admin.customers.$id.tsx`, `admin.reports.tsx`,
  `portal.tsx`
- `src/lib/ai-assistant.functions.ts` (AI-generated summaries — they are
  display strings even though they live in a server function)

## Write / schema contracts (direct column names allowed)

Direct column names are required when the code is _writing_ the columns or
_naming_ them in a Supabase query builder / generated type. The CI guard
allow-lists these on the same line:

- Supabase query builder calls: `.select("total, balance_due, ...")`,
  `.update({ amount_paid: x })`, `.insert(...)`, `.upsert(...)`,
  `.eq("balance_due", 0)`, `.order("grand_total")`, `.gt`, `.lt`, etc.
- TypeScript row/interface field declarations: `grand_total: number`,
  `balance_due: number | null`.
- The `totals` local returned by `computeInvoiceTotals` in
  `src/lib/invoice-pdf.ts` — it is a computed object, not a DB row, and is
  explicitly allow-listed by identifier name (`totals`).
- Backend integrity suites that assert against stored column values as
  ground truth:
  [`src/components/crm/SystemHealthPage.tsx`](../src/components/crm/SystemHealthPage.tsx),
  [`src/lib/erp-qa.functions.ts`](../src/lib/erp-qa.functions.ts).
- Generated Supabase types: `src/integrations/supabase/types.ts`.
- Any `*.test.ts(x)` file and files under `__tests__/` directories.

## Escape hatch

If you have a genuinely legitimate direct read that the heuristics above
can't detect (extremely rare), append `// finance-allow` to the same line.
Explain why in a nearby comment — the guard trusts you, code review
shouldn't.

```ts
// legacy CSV export mirrors the DB column names verbatim
row.balance_due, // finance-allow
```

## When adding a new finance surface

1. Query the DB columns you need in your `.select(...)` (direct names are
   fine here — write contract).
2. In every display / calculation site, call the matching helper
   (`financeTotalAmount`, `financePaidAmount`, `financeBalanceDue`,
   `customerDisplayName`, etc.).
3. Run `pnpm check:finance-normalization` locally before pushing. CI runs
   it on every PR.
4. If the helpers don't yet cover the field you need (e.g. a new
   `advance_paid` column), extend
   [`src/lib/finance-normalization.ts`](../src/lib/finance-normalization.ts)
   and its
   [unit tests](../src/lib/__tests__/finance-normalization.test.ts) — do
   NOT reach into the raw column at the call site.
