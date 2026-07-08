# Phase 1 — Quotation Full Loop

Scope confirmed: existing tables (`quotations`, `quotation_items`, `customers`, `products`), Resend for email. Proforma, Commercial Invoice, and PO come in later phases.

## What I found in the current app

- `/admin/quotations` list query is correct — it shows exactly what's in DB. There is **one** quotation row (`QTN-NEVO-2026-0010`) with no customer, no items, `subtotal=0`, `total=0`. So "blank customer, USD 0" is real data, not a UI bug.
- Root cause: `NewQuotationDialog` (or older flow) inserts empty draft rows. Fix: gate creation through `createQuotationWithItems` only — no empty drafts.
- Numbering trigger, VAT recalc trigger, discount-approval trigger, and `quotation_number_seq` already exist and work.
- No PDF generator, no import, no email, no "Send to customer" action wired up.

## Deliverables (this phase)

### 1. Kill empty drafts
- Remove/replace the "New quotation" path that inserts blank rows.
- One-shot dialog: pick customer, dates, currency, add ≥1 line → server validates → insert header + items in one call (`createQuotationWithItems`, already exists).
- Cleanup: delete the existing empty `QTN-NEVO-2026-0010` (or leave it; user's call — I'll leave it and let them delete).

### 2. Fix the list page
- Show `customers.company_name` (fallback to `name`) so it's never blank when a customer exists.
- Add columns: PDF badge (generated / not), items count.
- Row actions: Open, Duplicate, Delete draft, Convert to proforma (if `approved`/`accepted`).

### 3. Spreadsheet-like line-item editor on `/admin/quotations/$id`
- Editable grid: description, HS code, qty, unit, unit price, discount %, VAT %, line total (computed).
- Add / delete / duplicate / reorder rows.
- Live subtotal / discount / VAT / grand total.
- Save persists via existing `upsertQuotationItem` / `deleteQuotationItem`; trigger recomputes header totals.

### 4. Import Center (Quotations only in this phase)
- New route `/admin/quotations/import`.
- Accept CSV + XLSX (SheetJS `xlsx` — already usable, will `bun add xlsx` if missing).
- Column mapper: file header → canonical field (description, hs_code, qty, unit, unit_price, discount_pct, currency).
- Preview table with per-row validation (missing qty, non-numeric price, etc.).
- On confirm: pick/create customer, set dates/currency, insert quotation + all valid items in one server fn.
- Central "Import Center" page can be a follow-up; this phase surfaces the button from `/admin/quotations`.

### 5. NEVO-branded PDF
- New `src/lib/quotation-pdf.ts` using `jspdf` + `jspdf-autotable` (matches existing invoice-pdf.ts stack).
- Sections: NEVO logo/header, doc number + status, issue date + valid-until, seller (from `company_settings`), bill-to (customer), items table (desc, HS, qty, unit, unit price, discount, line total), totals block (subtotal / discount / VAT / grand total), incoterms / payment terms / delivery terms / notes, bank details, signature block, footer.
- "Preview PDF" and "Download PDF" buttons on the edit page.
- Refuse to generate when required fields missing (customer, ≥1 item, quantities>0, unit prices set) — clear error listing what's missing.

### 6. Email PDF via Resend
- Connect Resend via `standard_connectors--connect` (I'll do it in the same turn; user confirms in UI).
- New server fn `emailQuotation({id, to, subject, message})`:
  1. Load quotation + items + customer.
  2. Generate PDF server-side (same generator, running under Node buffer).
  3. POST to Resend gateway with PDF as base64 attachment.
  4. Log to `activity_logs` with `action='email_sent'`, entity_type='quotation'.
  5. Bump status to `sent` if currently `draft`/`approved`.
- Dialog on edit page: prefilled to customer email, editable subject/body, "Send" button.

### 7. Convert (already partially built)
- `convertQuotationToProforma` server fn already exists and works. Just surface it as a button on the edit page (only when status is `approved` or `accepted`). Toast + redirect to new proforma.

### 8. Validation guard rails
- Server-side: `createQuotationWithItems` already requires customer + ≥1 item.
- Add: quantity>0 and unit_price≥0 (currently allows 0/0).
- Client-side: form uses same zod schema shared from `import-schemas.ts` extension.

### 9. System Health check for quotation
- Add QA test in `SystemHealthPage`: create draft → add item → generate PDF (in-memory, don't persist) → convert to proforma → cleanup. PASS/FAIL/WARNING.

## Out of scope (later phases)
- Proforma / Commercial Invoice / Purchase Order UI rebuild.
- Central Import Center dashboard.
- Revision system (`Rev. 0`, `Rev. 1`).
- Role-based permission granularity beyond current `has_staff_role`.
- Payment status tracking on quotations (they don't have payments).
- Email templates management UI.

## Technical notes

- Files touched:
  - `src/routes/_authenticated/admin.quotations.tsx` (list improvements)
  - `src/routes/_authenticated/admin.quotations.$id.tsx` (editor + PDF/email/convert buttons)
  - `src/routes/_authenticated/admin.quotations.import.tsx` (new)
  - `src/components/crm/NewQuotationDialog.tsx` (require line items)
  - `src/lib/quotations.functions.ts` (add `emailQuotation`, `importQuotation`)
  - `src/lib/quotation-pdf.ts` (new)
  - `src/components/crm/SystemHealthPage.tsx` (add quotation e2e test)
- New deps: `xlsx` (if not present), reuse `jspdf`, `jspdf-autotable`.
- No DB migration required — existing schema is sufficient for quotations. `hs_code` column already exists on `quotation_items` (verified via schema).
- Resend requires the user to link the connector via the popup — I'll trigger it and continue once connected.

## Estimated turns

Given size, I'll deliver in **3 sub-turns after approval**:
1. List + editor + validation + kill-empty-drafts + delete existing blank row helper.
2. PDF generator + import wizard.
3. Resend wiring + email dialog + convert button + system-health check.

Approve to start with sub-turn 1.
