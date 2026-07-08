
# Smart Invoice Importer

Add a protected feature that lets NEVO staff upload old invoices (XLSX, XLS, CSV, DOCX, PDF, PNG, JPG, JPEG), extract the fields with AI, review + correct them, and create a **Draft** Proforma or Commercial Invoice in NEVO's existing format. Nothing on the public site changes; nothing is auto-sent or auto-approved.

This is a large feature. I'll ship it in **five reviewable phases**, each independently useful and safe to stop after. Everything lives under `/_authenticated/` and reuses existing tables (`customers`, `products`, `invoices`, `invoice_items`, `orders`) — the importer only adds staging tables and never mutates production records without an explicit "Create Draft" click.

---

## Phase 1 — Foundations (schema, storage, RLS)

**Tables** (new, all in `public`, all RLS-on, staff-only):
- `invoice_import_jobs` — one row per upload; tracks `status` (`uploaded | processing | ready_for_review | draft_created | failed | cancelled`), `import_type`, `related_customer_id`, `related_order_id`, `created_invoice_id`, `overall_confidence`.
- `invoice_import_files` — original uploaded file(s) metadata + storage path.
- `invoice_import_extracted_data` — `raw_text`, `extracted_json`, `mapped_json`, `confidence_scores`, `validation_warnings` (1-to-1 with job).
- `invoice_import_audit_log` — every action (upload, extract, edit, create-draft, cancel).

**Storage bucket**: `invoice-imports` (private), path `{user_id}/{job_id}/{filename}`. Signed URLs only.

**Roles** (via existing `has_role` / `app_role`): allow `super_admin`, `management`, `sales`, `finance`; block `read_only` and `operations` (operations can VIEW jobs linked to their orders but not create).

**Grants + policies**: standard `authenticated` + `service_role` grants, plus role-scoped policies using `has_role`. No `anon`.

Deliverable at end of phase 1: migration reviewed and applied, bucket created, no UI yet.

---

## Phase 2 — Upload + extraction pipeline (server)

**Server functions** (`src/lib/invoice-import.functions.ts`, `.server.ts` helpers):
- `createImportJob({ file, importType, relatedCustomerId?, relatedOrderId? })` — validates file type/size (≤20 MB), uploads to storage via signed upload, inserts `invoice_import_jobs` + `invoice_import_files`, returns `jobId`.
- `runExtraction({ jobId })` — status → `processing`, dispatches per file type, writes result, status → `ready_for_review` or `failed`.
- `getImportJob({ jobId })` — returns job + extracted + mapped JSON for the review UI.
- `updateMappedData({ jobId, mapped })` — user edits during review.
- `cancelImportJob({ jobId })`.

All use `.middleware([requireSupabaseAuth])` and re-check role with `has_role` inside the handler.

**Extractors** (per file type, all server-side):
- **XLSX/XLS/CSV** — `exceljs` / `papaparse`. Detect header key/value pairs, item table (by header row heuristics: `qty`, `unit price`, `description`), totals block.
- **DOCX** — `mammoth` for text + `docx4js` tables (or plain XML fallback shipped in the docs skill).
- **PDF (text)** — `pdf-parse`. If extracted text is thin (< 200 chars) or scanned, fall through to OCR.
- **PDF (scanned) / PNG / JPG** — send the file (base64) to Lovable AI Gateway as an `image_url` block with a Gemini vision model (`google/gemini-2.5-flash` for cost, `google/gemini-2.5-pro` fallback). Prompt requests strict JSON matching our schema with per-field `confidence` (0–1).

**AI normalisation step** (all file types): feed the raw structured guess to `google/gemini-2.5-flash` with our target schema and Zod-validated output — normalises currency codes, dates, VAT %, line items. Assigns a `confidence` per field.

**Runtime note**: no `child_process`, no `sharp`, no native binaries — all extractors are pure JS or delegate to the AI Gateway. Fits Cloudflare Workers.

Deliverable: unit tests hitting extractors with 1 fixture per file type; integration test that mocks the AI Gateway.

---

## Phase 3 — Review UI + validation

**Route**: `src/routes/_authenticated/admin.invoice-imports.$jobId.tsx` (review) and `admin.invoice-imports.tsx` (history list — reuses the existing `ListErrorState` / `ListEmptyState` / skeleton pattern documented in `docs/admin-list-states.md`).

**Modal component**: `<ImportFromFileModal />` in `src/components/invoice-import/` with:
- Drag-and-drop + browse (accepts the 8 file types only, ≤20 MB).
- Import-as picker: Proforma, Commercial, Customer + Invoice, Order + Invoice, Draft Only.
- Optional "link to existing customer / order" search boxes.
- Progress steps: Uploading → Reading → Extracting → Mapping → Checking totals → Ready.

**Review page layout**:
- Left: original file preview (image inline, PDF via `<iframe src=signedUrl>`, DOCX/XLSX show a "Download original" button + parsed text summary).
- Right: form of extracted fields — every field editable, yellow background if `confidence < 0.8`, red if `< 0.6`, required badge on critical fields (customer, date, currency, ≥1 item, qty, unit price, grand total).
- Bottom: item table (add/remove/edit rows).
- Customer matcher: server fn `matchCustomer` searches by name/email/phone/VAT and returns exact / possible / none, with a "Create new" toggle.
- Product matcher: similar via SKU/name.

**Validation** (`src/lib/invoice-import-validate.ts`, shared client+server):
- Math: `qty × unit_price = line_total`; `subtotal = Σ line_total`; `grand_total = subtotal − discount + vat`.
- Warnings for currency/VAT/duplicate invoice number/missing bank/etc.
- If imported total ≠ calculated, show side-by-side + choose imported / calculated / manual.
- Blocks "Create Draft" until every critical field is present and non-critical warnings acknowledged.

Buttons: **Re-run extraction**, **Save as Draft** (persists edits without creating invoice), **Create NEVO Invoice**, **Cancel**.

---

## Phase 4 — Wire into existing modules + PDF

**Buttons — `Import From File`** placed next to existing "New …" buttons on:
- Proforma Invoices list, Commercial Invoices list (both filtered variants of `admin.invoices`),
- Customer profile (`admin.customers.$id.tsx` — Documents / Invoices tab),
- Order page (`admin.orders.$id.tsx` — Related Documents),
- AI Assistant → new sub-route `/_authenticated/admin.ai-assistant.document-check.tsx`.

**Create Draft flow** (`createInvoiceFromImport` server fn):
1. Validate mapped data server-side (re-runs the same rules).
2. If `create_customer`, upsert into `customers`; if match, link.
3. Upsert `products` for new items; link `invoice_items.product_id` where matched, otherwise leave as free-text line with description/price.
4. Insert `invoices` with `status = 'draft'`, `type = 'proforma' | 'commercial'`, auto-numbered (`PI-NEVO-YYYY-#####` / `INV-NEVO-YYYY-#####` — allocator function in DB with advisory lock).
5. Store the imported original number in `invoices.original_document_reference` (new nullable column, added in Phase 1 migration).
6. Update job: `status='draft_created'`, `created_invoice_id`.
7. Audit-log the creation.

Nothing is auto-sent, auto-approved, or auto-paid.

**PDF**: reuse the existing NEVO invoice PDF renderer (whatever `invoice_pdf_versions` currently uses). The importer produces a normal `invoices` row, so preview/download/convert-to-order all work through the existing pipeline. Company header/logo/footer come from `company_settings` (already populated with the NEVO details in the prompt).

---

## Phase 5 — AI Check + polish

- **AI Check button** on the review page → server fn `aiCheckImport({ jobId })` sends the mapped JSON + validation warnings to the AI Gateway with a rubric prompt; returns markdown list of: missing fields, low-confidence fields, calc issues, possible duplicate customer, product-match issues, currency/VAT/payment-term warnings, and recommended corrections. Rendered in a right-side drawer.
- Assistant slash commands: `/extract-invoice`, `/check-invoice`, `/missing-fields`, `/vat-check`, `/match-customer`, `/convert-to-nevo`, `/explain-warnings` — each maps to a server fn already built above.
- **Import History** page finalised with statuses, filters, and row actions (View original, View extracted, Continue review, Create invoice, Delete, Re-run).
- Telemetry: reuse `logClientEvent` / `reportClientError` — events `invoice_import_uploaded`, `_extracted`, `_review_opened`, `_draft_created`, `_failed`, `_ai_checked`.

---

## Out-of-scope for this feature (explicit)

- Public-site changes: none.
- Existing invoice records: untouched; the importer only inserts new drafts.
- Emailing / approval / payment marking: unchanged, still manual.
- Bulk import (multi-file at once): possible later; single-file per job for v1.
- Non-English OCR quality: Gemini handles Arabic/EN reasonably; other scripts best-effort.

## Technical section (for reviewers)

- Stack: TanStack Start server functions (`createServerFn`, `requireSupabaseAuth`), never Supabase Edge Functions for app-internal work.
- Secrets: `LOVABLE_API_KEY` (auto), no other API keys. Ensure via `ai_gateway--create` at start of Phase 2.
- Packages: `exceljs`, `papaparse`, `mammoth`, `pdf-parse`, `zod` (already present). All Worker-compatible.
- Files: server-only extractors live in `src/lib/invoice-import/*.server.ts`; server fns in `src/lib/invoice-import.functions.ts`; components in `src/components/invoice-import/`.
- Follows the existing admin-list state contract from `docs/admin-list-states.md`.
- Shared `classifyListState` used for the Import History table.

## Confirmations before I start

1. Ship in the 5 phases above, one migration+PR per phase, or roll it into fewer/more?
2. AI model default: `google/gemini-2.5-flash` for cost, escalate to `google/gemini-2.5-pro` on low confidence — OK, or force one model?
3. `original_document_reference` as a new nullable column on `invoices` — any objection to adding it in Phase 1?
4. Operations role: read-only on jobs linked to their orders, no create — matches the prompt's "cannot create invoice unless permitted"?
