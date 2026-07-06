# NEVO Document Intelligence Assistant

A functional admin workflow: upload → AI analyze → human review → approve → route to correct library/portal. Not a mockup.

## Scope (this build)

- Admin surface at `/admin/document-intelligence` (Upload, Pending Review, Library, Detail drawer, Audit + Versions).
- Real Supabase schema, storage buckets, RLS, server functions, and Lovable AI analysis.
- Portal read surfaces wired to the same data (Customer Portal project docs, Partner Portal resources, Download Center public/on-request).
- Reuses existing `customers` table. Adds `partners` and `projects` (minimal) since they don't exist.

Out of scope (call out, don't build): OCR for scanned images, full-text search infra (uses ILIKE + tags), request-access email flow (button + audit only), doc preview beyond signed URL.

## Database (one migration)

New tables in `public` with GRANTs → RLS → policies in the required order:

- `partners` (company_name, country, partner_type)
- `projects` (project_name, customer_id → customers, country, project_type, status)
- `doc_intel_documents` (namespaced to avoid clashing with existing `documents` table used by CRM):
  - original_filename, stored_filename, title, summary, document_type, category, language
  - customer_id, partner_id, project_id (nullable FKs)
  - destination, folder_path, file_url, storage_bucket, mime_type, file_size
  - confidentiality_level (`public|internal|confidential|restricted`)
  - portal_visibility (`none|customer|partner|public|on_request`)
  - status (`uploaded|analyzed|pending_approval|approved|routed|rejected`)
  - ai_confidence numeric, ai_reasoning text
  - user_note text, intended_destination text
  - uploaded_by, approved_by, timestamps
- `doc_intel_tags` (document_id, tag)
- `doc_intel_versions` (document_id, version_number, file_url, filename, change_note, created_by)
- `doc_intel_audit_logs` (document_id, actor_id, action, details jsonb)
- `doc_intel_extractions` (document_id, raw_text, extracted_json, model_name)

RLS model (uses existing `has_role` / `has_any_role`):
- Admin/management/operations/sales/engineering roles: full read; write gated per role. Approvals restricted to `super_admin` + `management`.
- `authenticated` users can read a `doc_intel_documents` row only when:
  - `status='approved'` AND (`portal_visibility='public'` OR `on_request`), OR
  - `portal_visibility='customer'` AND row's customer matches a `customer_contacts`/profile mapping (fallback: staff-only until customer↔user mapping is added), OR
  - `portal_visibility='partner'` AND partner mapping likewise.
- Since customer/partner ↔ auth.uid mapping isn't in the schema today, portal visibility for external users defers to staff read + explicit `public` bucket URLs. Public/on-request items ALSO exposed via anon SELECT policy scoped to `portal_visibility IN ('public','on_request') AND status='approved'` with safe columns.

Reused function: `set_updated_at`, `stamp_updated_by`, `log_row_delete`.

## Storage

Four buckets via `supabase--storage_create_bucket`:
- `documents-originals` (private) — every upload lands here first.
- `documents-routed` (private) — internal libraries after approval.
- `documents-private` (private) — customer/partner-scoped routed files.
- `documents-public` (public) — Download Center public files only.

RLS on `storage.objects`:
- Staff (has_any_role of internal roles): read/write all four buckets.
- `documents-public` SELECT open to anon.
- Others: no direct access; downloads use signed URLs from server functions.

## Server functions (client-safe `src/lib/*.functions.ts`)

All under `requireSupabaseAuth`, role-checked inside handlers.

1. `analyzeDocument({ documentId })`
   - Loads row, downloads original from storage (service-role, loaded inside handler), extracts text:
     - PDF: `pdfjs-dist` legacy build (Worker-compatible).
     - DOCX: `mammoth`.
     - XLSX/CSV: `xlsx`.
     - TXT: utf-8 read.
     - Unsupported/image: mark extraction empty, still call AI with user_note only, flag low confidence.
   - Calls Lovable AI Gateway via `@ai-sdk/openai-compatible` (existing `src/lib/ai-gateway.server.ts`) using `google/gemini-2.5-flash` with `generateText` + `Output.object` (Zod schema mirroring the required JSON).
   - Uses the exact system prompt + user prompt template from the spec.
   - Persists `doc_intel_extractions`, updates document with AI fields, status → `analyzed` (or `pending_approval` when confidence < 0.85 or sensitive category).
   - Returns full AI JSON.

2. `approveDocument({ documentId, edited, action: 'approve'|'reject'|'send_to_review' })`
   - Enforces: contracts/NDAs/invoices/legal/compliance → cannot bypass human review (still require explicit approve action by admin/management, but never auto-approve).
   - On approve:
     - Chooses target bucket from `portal_visibility`:
       - `public` → `documents-public`
       - `customer|partner|on_request` → `documents-private`
       - else → `documents-routed`
     - Copies object from `documents-originals` to `<bucket>/<folder_path>/<recommended_filename>` (server-side copy via download+upload with service role).
     - Updates row (file_url = signed/public URL, stored_filename, folder_path, status='routed', approved_by, approved_at).
     - Inserts `doc_intel_versions` v1, replaces tags, writes audit log.

3. `listDocuments(filters)` — status/category/customer/partner/project/destination/confidentiality/search (ILIKE on title+summary+tags).
4. `getDocument(id)` — metadata + tags + versions + audit + extraction.
5. `signDocumentUrl(id)` — returns signed URL (60s) after checking read access.
6. `requestDocumentAccess(id)` — inserts audit log entry, notifies (audit only for now).

Upload path:
- Client uploads directly to `documents-originals` via `supabase.storage` (RLS lets staff insert). Then calls `createDocumentRow({ path, filename, mime, size, user_note, customer_id, partner_id, project_id, intended_destination, confidentiality })` server fn to insert row (status=`uploaded`) and immediately kick off `analyzeDocument`.

## Admin UI — `/admin/document-intelligence`

Route: `src/routes/_authenticated/admin.document-intelligence.tsx` + child tabs via query param (kept single-page for simplicity).

Sections:
- **Upload panel** — drag/drop (react-dropzone already? if not, plain input), multi-file, note textarea, dropdowns (customer/partner/project/destination/confidentiality). Progress states: Uploading → Extracting → Analyzing → Ready.
- **AI Review panel** — appears per file after analysis. Shows recommended filename, category, summary, destination, tags, visibility, confidence bar, reasoning. All fields editable. Buttons: Approve & Route, Edit Metadata (save without approve), Send to Manual Review, Reject.
- **Pending Approval queue** — table filtered to `status IN ('analyzed','pending_approval')`.
- **Document Library table** — all statuses, filters, search. Columns per spec. Row actions: View / Download / Approve / Reject / New Version.
- **Detail drawer** — metadata, tags, versions, audit trail, AI extraction JSON viewer.
- **Status badges** using existing badge system.

Registered in `src/lib/crm-nav.ts` under a new "Document Intelligence" group (visible to admin/management/operations/sales/engineering/finance per role visibility rules).

## Portal integration (read-only surfaces)

Wire into existing pages, additive only:
- `$lang.customer-portal.tsx`: add "Project Documents" section listing approved `portal_visibility='customer'` items grouped by category (proposals, technical, drawings, QC, installation, shipping). Since customer↔user mapping isn't in place, gate to signed-in staff preview + note the mapping requirement.
- `$lang.partner-portal.tsx`: add "Approved Resources" list (`portal_visibility='partner' AND status='approved'`).
- `$lang.download-center.tsx`: add "AI-Routed Public Documents" section (`portal_visibility='public' AND status='approved'`) with public bucket URLs; on-request items show "Request Access" button calling `requestDocumentAccess`.

## Routing / confidentiality rules (server-enforced)

Inside `approveDocument` handler:
- Categories `Contract|NDA|Invoice|Compliance Certificate|Quality Control Report` → force `requires_human_approval=true`; block `portal_visibility='public'`.
- `confidence_score < 0.85` → status stays `pending_approval` until admin overrides.
- No route to `documents-public` unless explicit admin approval + `portal_visibility='public'`.

## Dependencies to add

`pdfjs-dist`, `mammoth`, `xlsx` (already present? — check first; xlsx is used by reports).

## Files to create/edit

New:
- migration
- `src/lib/doc-intel.schema.ts` (Zod)
- `src/lib/doc-intel.functions.ts` (all server fns, admin loads `client.server` inside handlers)
- `src/lib/doc-intel-extract.server.ts` (text extraction)
- `src/lib/doc-intel-prompt.server.ts` (system + user prompt builders)
- `src/routes/_authenticated/admin.document-intelligence.tsx`
- `src/components/crm/doc-intel/UploadPanel.tsx`
- `src/components/crm/doc-intel/AIReviewCard.tsx`
- `src/components/crm/doc-intel/DocumentTable.tsx`
- `src/components/crm/doc-intel/DocumentDetailDrawer.tsx`

Edit:
- `src/lib/crm-nav.ts` (nav entry)
- `src/lib/crm-permissions.ts` (`useCanApproveDocuments`, `useCanUploadDocIntel`)
- `$lang.customer-portal.tsx`, `$lang.partner-portal.tsx`, `$lang.download-center.tsx` (portal sections)

## Assumptions / trade-offs

- Uses `google/gemini-2.5-flash` (fast, multimodal, sufficient for classification). Not `gpt-*` since Lovable AI Gateway defaults + cost.
- No OCR: scanned PDFs get empty text + low confidence + forced human review.
- Customer/partner ↔ auth.uid mapping doesn't exist; portal read policies for external users are staff-visible + public-bucket-only until that mapping is added (called out in UI).
- Full-text search = ILIKE (no `pg_trgm` / tsvector index this pass).
- Table named `doc_intel_documents` to avoid colliding with the existing CRM `documents` table.

Approve and I'll build it end to end.
