# Finance backend rewrite

You chose "full rewrite to your spec." Before I run migrations, I need you to sign off on this plan — the changes are destructive and will break several working modules until every dependency is updated. Everything below matches the field names / table names in your brief.

## Impact summary (please read)

Modules that currently depend on the existing `invoices` (with `type='proforma'|'commercial'`) and `customers.name` shape and will need code changes or will temporarily break:

- `orders → invoice` generation (`src/lib/orders.functions.ts`, order detail actions)
- `payments` (`src/routes/_authenticated/admin.payments.tsx`, `payments` table FK to invoices)
- `partner_commissions` (`invoice_id` FK, `auto_request_commission_approval`)
- `approvals` (`auto_request_invoice_approval` trigger, `decide_approval_request` switch on `entity_type in ('proforma','invoice')`)
- `invoice_import_jobs`, `invoice_pdf_versions`, `ai_documents.related_invoice_id`
- `quotations.converted_invoice_id`, quotation → invoice conversion
- AI features: `InvoiceAiCheckButton`, `ai-summary.functions.ts` for invoices
- CRM sidebar, guide content, telemetry (`ADMIN_LIST_RESOURCES` includes `invoices`, `proforma_invoices`, etc.)
- PDF: `src/lib/invoice-pdf.ts` (all field names change)
- Customer-facing portal (`customer-portal.functions.ts`) — reads invoices for `is_customer_user`
- Every place that reads `customers.name`, `customers.address`, `invoices.vat_amount`, `invoice_items.vat_pct/discount_pct`

Existing production data (all rows in `invoices`, `invoice_items`, `customers.name`, etc.) must be migrated. If we don't, the app loses history.

## Migration strategy

1. **Additive column adds first**, no drops. Keep old columns as aliases so the app doesn't break mid-deploy.
   - `customers`: add `company_name` (copy from `name`), `billing_address` (copy from `address`). Keep `name`/`address` as generated columns mirroring the new ones, so legacy code keeps working.
2. **Create the two new tables** exactly per your spec:
   - `proforma_invoices` + `proforma_invoice_items`
   - Their sequences and numbering triggers (`PRO-YYYY-0001`, `INV-YYYY-0001`, sequential, atomic via `nextval`).
3. **Backfill**: `insert into proforma_invoices ... from invoices where type = 'proforma'`, same for items. Preserve ids so `converted_invoice_id`-style links keep working.
4. **Reshape `invoices`** per your spec: add `proforma_invoice_id`, `payment_status`, `discount_total`, `tax_total`, `paid_amount`, `balance`, `payment_terms`, `approved_by`. Drop `type` (only commercial remains). Rename `vat_amount → tax_total`, `amount_paid → paid_amount`. Backfill numeric fields from items.
5. **Reshape `invoice_items`** per your spec: add `discount`, `tax_rate`, `sort_order`, `line_total`. Rename `discount_pct → discount`, `vat_pct → tax_rate`, `position → sort_order`.
6. **RLS**: rewrite policies to your matrix — `super_admin`, `management`, `finance` full; `sales` create-only for quotations/proformas, cannot mark paid; customers see own approved/sent only. `has_role`/`has_any_role` already exist.
7. **Total-calc trigger**: replace `recalc_invoice_totals` with a trigger that runs your formula (`line_subtotal / line_discount_amount / line_taxable / line_tax / line_total → sums → payments → balance → payment_status`). Same for a new `recalc_proforma_totals`.
8. **Activity logs**: add triggers on `proforma_invoices` and `invoices` for created/updated/approved/sent/converted/paid; add a helper `log_finance_event(...)`.
9. **Convert-proforma-to-invoice**: `convert_proforma_to_invoice(_proforma_id)` SECURITY DEFINER RPC that copies fields/items, sets `invoice.proforma_invoice_id`, sets proforma `status = 'converted_to_invoice'`, logs activity.

## App code changes

- Rewrite `src/lib/invoice-pdf.ts` to read the new field names (`company_name`, `billing_address`, `discount_total`, `tax_total`, `paid_amount`, `balance`, `payment_terms`, `delivery_terms`, `valid_until`).
- Rewrite `src/lib/invoices.functions.ts` and add `src/lib/proforma-invoices.functions.ts`.
- **New UI (unavoidable)**: `/admin/invoices/new` and `/admin/proforma-invoices/new` with customer picker (searches `customers`), line-item editor with live totals, validation per your list (rules 4 and 5), submit. Your rule "Do not add new UI" is incompatible with your rules 6 and 7 which explicitly require these flows — I'm interpreting the ban as "no unrequested UI." Confirm.
- Update `admin.invoices.$id.tsx` and `admin.proforma-invoices.$id.tsx` detail pages to read new fields and expose Approve / Mark sent / Convert to invoice / Add payment / Download PDF actions.
- Update every query that reads invoices to project `customers ( company_name, email, phone, billing_address, country )`.
- Update orders → invoice generation, payments page, commissions, approvals switch to use new tables/fields.
- Update `ADMIN_LIST_RESOURCES` and telemetry.
- Update `src/integrations/supabase/types.ts` regenerates after migration approval.

## Test data + acceptance run

After deploy I'll:

1. Insert `NEVO Test Customer LLC` into `customers`.
2. Drive Playwright: create proforma with 2 items → verify list + detail + PDF → convert to invoice → verify new invoice → add payment → verify `balance` and `payment_status`.
3. Screenshot each step and attach.
4. Run `bun run lint`, `bunx vitest run`, and the admin-list telemetry check.

## Estimated blast radius

~15–20 files edited, 1 large migration, 2 new routes, 1 new server-function module, PDF generator rewrite. Realistic first-cut ETA is several hours of work; there **will** be follow-up fixes as I find modules still reading the old shape.

## Confirm before I start

1. **Proceed with destructive rename+backfill of `customers.name → company_name` and `customers.address → billing_address`?** (I'll keep `name`/`address` as generated aliases so nothing else breaks.)
2. **Confirm the two new create routes are OK** despite "no new UI." They're required by your rules 6 and 7.
3. **OK to run this in one big migration**, or split into 4 (schema add → backfill → app code → drop old columns much later)? I recommend the 4-step split; safer to roll back.

Reply "go" (single migration) or "split" (4 steps) or edits, and I'll start.
