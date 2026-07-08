# NEVO Industrial ERP Backend — Phased Rebuild Plan

This is a very large, multi-week scope. To keep quality high and avoid a single mega-change that breaks the running app, I'll deliver it in **sequential phases**, each one shippable and testable on its own. I'll pause after each phase for your approval before starting the next.

Below is the phase order, what changes in each, and where I need decisions from you before Phase 1.

---

## Guiding principles (apply to every phase)

- No mock data. Everything persists in the database.
- Every new/changed table gets RLS + `GRANT` + `created_by`/`updated_by`/timestamps + role-based policies.
- Documents (Quotation, PI, CI, PO, Commission) unify into `finance_documents` + `finance_document_items`. Existing `quotations`, `invoices`, `proforma_invoices`, `orders`, `partner_commissions` tables stay as compatibility views/back-fills so current UI keeps working during migration.
- Numbering is DB-side (sequences + function), never frontend.
- PDFs generated server-side via a server function, stored in Supabase Storage, tracked in `document_files`.
- All state changes write to `activity_logs`.

---

## Phase order

### Phase 1 — DB Audit + ERP Core Schema
- Audit existing tables (customers, suppliers, products, quotations, invoices, orders, partner_commissions, payments, etc.).
- Create unified schema: `finance_documents`, `finance_document_items`, `document_files`, `number_sequences`, `inventory_items`, `inventory_movements`, `email_log`, `imports`.
- Add missing `created_by`/`updated_by` on existing tables.
- Write DB function `next_document_number(doc_type)` replacing scattered per-type sequences.
- Back-fill existing quotations/invoices/orders into `finance_documents` (read-only shim views for now).
- **Deliverable:** migration + audit report. No UI change yet.

### Phase 2 — Finance Document Engine (server functions)
- New server functions: `createDocument`, `updateDocument`, `addItem`, `removeItem`, `recalcTotals`, `changeStatus`, `convertDocument` (QTN→PI→CI, supplier→PO).
- Triggers recalc totals on item change; enforce non-zero totals on issue.
- Activity log entries for every state change.

### Phase 3 — Manual spreadsheet entry UI
- Excel-like editor component reused across Quotation / PI / CI / PO create+edit pages.
- Row add/delete/duplicate/reorder, auto-calc, draft save, edit later.

### Phase 4 — PDF Generator
- Server function `generateDocumentPdf(document_id)` → renders NEVO-branded PDF (React-PDF or Puppeteer-free HTML→PDF, TBD by runtime constraints — likely `@react-pdf/renderer` since Worker runtime blocks Puppeteer).
- Uploads to Storage bucket `documents/`, records in `document_files`.
- Preview / Download / Regenerate actions on every document page.
- Blocks generation if required fields missing or total ≤ 0.

### Phase 5 — Document Conversion
- One-click Convert buttons (QTN→PI, QTN→CI, PI→CI, PO from supplier).
- Copies items, links `source_document_id`, updates source status, logs activity.

### Phase 6 — Import Center
- New `/admin/imports` route with wizard: pick type → upload CSV/XLSX or paste → preview → map columns → validate → confirm → save.
- Parser server function per type (customers, suppliers, products, inventory, quotations, PI, CI, PO).
- "Import Data" button surfaced on each list page.

### Phase 7 — Email Center
- Uses existing Resend connection + email queue.
- "Email PDF" dialog on every document (subject/body editable, PDF auto-attached).
- Logs to `email_log` + `email_send_log`.
- Settings page for provider fallback config.

### Phase 8 — CRM Integration
- Customer profile tabs: Quotations, PIs, CIs, Payments, Emails, Activity, PDFs, totals.
- Supplier profile tabs: POs, Inventory received, Emails, Activity, PDFs, totals.

### Phase 9 — Inventory
- Stock in/out/adjust/reserve; PO receipt increases stock, CI shipment decreases (toggle).
- Movement history + low-stock alerts.

### Phase 10 — Payments
- Extend payments to cover supplier payables + partial/paid/overdue rollups.
- Dashboard: receivables / payables / overdue.

### Phase 11 — Role Permissions Audit
- Verify Admin / Finance / Sales / Procurement / Viewer scopes across all new routes + server fns via existing `has_role` / `has_any_role`.

### Phase 12 — ERP QA Center
- Rebuild System Health page into full ERP QA: DB checks + end-to-end flow tests (create customer → quotation → PDF → convert → PI → CI → payment → PO → inventory receipt).
- Each test PASS/FAIL/WARN + fix hint + copy-report + JSON export (already partially in place).

### Phase 13 — Seed & Full QA Run
- Seed Al Noor Construction LLC, Mersin Chemical Supplier Ltd, 5 products.
- Run the 20-step manual QA script end-to-end, produce technical report.

---

## Decisions I need from you before starting Phase 1

The rest of the plan hinges on these — please pick before I begin so I don't have to redo migrations later.

1. **Existing data**: keep and migrate current `quotations` / `invoices` / `proforma_invoices` / `orders` rows into the new `finance_documents` table, or start clean and archive the old tables?
2. **PDF engine**: `@react-pdf/renderer` (works on the Cloudflare Worker runtime, but layout is code-based) or HTML template rendered with a Worker-compatible HTML→PDF library (nicer templates, larger bundle)?
3. **Storage bucket for PDFs**: create a new private `documents` bucket with signed-URL downloads (recommended), or reuse an existing one?
4. **Scope confirmation**: do you want me to proceed one phase per turn with your approval between phases (safer, ~13 turns), or batch Phases 1–4 into one large delivery (faster, higher risk of breakage)?

Once you answer these four, I'll start Phase 1 immediately: full DB audit + core schema migration.
