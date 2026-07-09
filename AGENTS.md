<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Finance normalization

All display, calculation, PDF, and AI-summary code paths for quotations,
proforma invoices, invoices, and payments MUST read money and customer
fields through the helpers in `src/lib/finance-normalization.ts`
(`financeTotalAmount`, `financePaidAmount`, `financeBalanceDue`,
`customerDisplayName`, `customerBillingAddress`, `customerVatNumber`).

Direct column reads (`row.balance`, `row.total`, `row.grand_total`,
`row.amount_paid`, `row.balance_due`) are only allowed in write/schema
contracts: Supabase query builder calls, type declarations, generated
types, backend integrity suites (`SystemHealthPage`, `erp-qa.functions.ts`),
and tests. Enforced in CI by `pnpm check:finance-normalization`.

Full rules and rationale: [`docs/finance-normalization.md`](docs/finance-normalization.md).
