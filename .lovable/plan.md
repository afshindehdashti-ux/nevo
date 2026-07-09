## Phase 2 — Document CRUD server functions

Goal: give each of the four document types a consistent, complete server-function API for create / edit header / add-line / update-line / remove-line / delete / recalc totals / save-as-final. Today only **quotations** has this. Proforma, commercial invoices, and purchase orders have only fragments (email, status change) or none at all.

### What exists today

| Type | Header table | Items table | Server fns today | Recalc |
|---|---|---|---|---|
| Quotation | `quotations` | `quotation_items` | Full CRUD in `quotations.functions.ts` | DB trigger `recalc_quotation_totals` |
| Proforma invoice | `proforma_invoices` | `proforma_invoice_items` | None (UI hits Supabase directly) | DB trigger `proforma_item_compute_line_total` (line-level only) |
| Commercial invoice | `invoices` | `invoice_items` | Only `emailInvoicePdf` | DB trigger `recalc_invoice_totals` (payments-driven, no items) |
| Purchase order | `orders` | `order_items` | Only `sendOrderConfirmation` | None |

`finance_documents` is a parallel unified table with its own CRUD — leave it alone; Phase 2 targets the type-specific tables the current UI already uses.

### Deliverables

New files:

- `src/lib/proforma-invoices.functions.ts`
- `src/lib/commercial-invoices.functions.ts`
- `src/lib/purchase-orders.functions.ts`

Additions to existing files:

- `src/lib/quotations.functions.ts` — add a `recalcQuotationTotals` server fn that reads items and updates the header (belt-and-braces alongside the trigger, and safe fallback if the trigger is bypassed).

Each new file exports the same shape:

```
list<Type>()                       // list rows (headers only)
get<Type>({ id })                  // header + items
create<Type>({ header, items })    // insert header + items, single txn feel
update<Type>Header({ id, patch })  // header-only edits (dates, terms, status)
add<Type>Item({ doc_id, item })    // insert one line
update<Type>Item({ id, patch })    // edit qty/price/discount/description
remove<Type>Item({ id })           // delete one line
recalc<Type>Totals({ id })         // recompute subtotal / vat / total from items
save<Type>({ id, header, items })  // atomic replace-all: header + full items array
delete<Type>({ id })               // soft/hard delete parent + items
```

Every function:

- Uses `.middleware([requireSupabaseAuth])` — no public writes.
- Validates input with `zod`.
- Sets `created_by` / `updated_by` from `context.userId`.
- On item mutations, calls `recalc<Type>Totals` after so totals never drift, even when a DB trigger already exists (for consistency across all four types).
- Writes an `activity_logs` row on create / delete / status change (mirroring the existing quotations audit trail).

### Recalc math (shared)

```
line_total   = round(qty * unit_price * (1 - discount_pct/100), 2)
subtotal     = round(sum(line_total), 2)
vat_amount   = round(subtotal * vat_rate/100, 2)
total        = round(subtotal + vat_amount, 2)
```

Purchase orders use the same shape but write `subtotal` / `tax_amount` / `total` per the `orders` schema. Proforma line totals are set by the DB trigger; the recalc fn re-sums from the trigger-computed `line_total` values.

### Out of scope for Phase 2

- No PDF regeneration (already own module).
- No emailing (already own fns).
- No conversion between types (already own fns for quote→proforma→commercial).
- No new tables or columns — pure server-fn layer over today's schema.
- No UI wiring changes yet; Phase 3 will migrate the existing pages to these fns.

### Verification

Add `runDocumentCrudE2e` in `erp-qa.functions.ts` (small): for each of the four types, `create → add item → update item → recalc → assert totals → delete`, with unique run marker and guaranteed cleanup. New button in the ERP Finance Diagnostic panel.

### Risk / notes

- Item mutations execute the trigger AND the app-side recalc. That's intentional — the recalc is idempotent and cheap; it protects against trigger drift and gives the server fns identical semantics across the four types.
- `save<Type>` is an atomic "replace all items" flow: delete items where `id NOT IN (kept)`, upsert the rest, then recalc. Same pattern the proforma UI already uses inline.
- No schema migration needed. All grants and RLS already exist on these tables.

Once you approve, I'll implement the three new `.functions.ts` files, add `recalcQuotationTotals` to the existing one, and drop in the diagnostic e2e.