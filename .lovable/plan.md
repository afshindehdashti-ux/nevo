# NEVO Backend Upgrade Plan

Reusing existing routes, NEVO brand shell, Supabase schema, `_authenticated` gate, activity_logs, PDF generator, and doc-intel plumbing. No new UI shells — extend what's there.

## Phase 1 — Customer Portal (real data)
**Route:** existing `$lang.customer-portal.tsx`
- Add auth gate: sign in via existing `/auth`, then match user via `customer_users` mapping.
- Server fns in `src/lib/customer-portal.functions.ts` (RLS via `requireSupabaseAuth` + `is_customer_user`):
  - `getMyCustomerContext` → customer profile, contact, balance
  - `getMyOrders`, `getMyInvoices`, `getMyProformas`, `getMyShipments`, `getMyDocuments`
  - `getMyDocumentSignedUrl` (documents-private bucket, log to `download_events`)
- Portal UI: tabs — Overview (KPIs: open orders, balance due, in-transit shipments, latest docs) · Orders · Invoices · Shipments · Documents · Profile. Reuse `Card`, `Table`, `Badge` from admin.

## Phase 2 — AI Assistant (real backend)
**Route:** existing `$lang.ai-assistant.tsx`
- Server route `src/routes/api/ai-assistant.ts` — streaming `useChat` endpoint via Lovable AI Gateway (`google/gemini-2.5-flash`).
- System prompt loaded server-side with NEVO context: solutions list, industries, product categories (fetched from `products`/`solutions_inspection`), contact + factory-layout tool links.
- Tool-lite behavior via prompt: when user shows buying intent, model asks for name/email/company/need and returns a JSON block → client posts to `submitAssistantLead` server fn which inserts into `project_inquiries` (source='ai_assistant') and triggers existing lead pipeline.
- Conversation persisted in `localStorage` only (no new table); rate-limit by IP via existing `email_send_state`-style guard using in-memory + 429 fallback.

## Phase 3 — Quotations module + shared PDF
**New table:** `quotations` + `quotation_items` (mirrors invoices shape; status: draft/sent/accepted/rejected/expired/converted).
- Server fns: create/update/send/convert-to-proforma/convert-to-invoice.
- PDF: reuse existing invoice PDF generator (`src/lib/pdf/*` if present, else extend) → NEVO-branded template with logo from `company_settings`, numbering via new sequence `quotation_number_seq` + `next_quotation_number()`.
- Admin route: `/admin/quotations` list + `/admin/quotations/$id` editor (mirror `admin.invoices.tsx` layout).

## Phase 4 — Communication Center (polymorphic timeline)
**New table:** `communications (id, entity_type, entity_id, kind[note|email|call|meeting|file], subject, body, direction[in|out], user_id, occurred_at, metadata, attachments jsonb)`.
- RLS: admins full; scoped read for customer/partner via existing `is_customer_user`/`is_partner_user` when `entity_type='customer'|'partner'` and matches.
- Component `<CommunicationTimeline entityType entityId />` reused across `admin.customers.$id`, `admin.leads.$id`, `admin.orders.$id`, `admin.projects` (future).

## Phase 5 — Tasks & Approvals workflow
- Extend existing `tasks` table (columns: assigned_to, due_date, status, priority, entity_type, entity_id, approval_required, approved_by, approved_at) — add missing via migration.
- Approval chain on quotations/proformas/invoices: `status='pending_approval'` blocks send until `has_role('admin')` clicks Approve → uses existing `log_status_approval` trigger.
- Admin `/admin/tasks` upgraded to real board (kanban by status) + due-date filter + email placeholder (log-only for now).

## Phase 6 — Wiring & polish
- Add nav links in sidebar (`admin.tsx`) for Quotations.
- CSV export helper on quotations + communications.
- Update `admin.reports.tsx` with Quotation win-rate and Communication volume reports.
- Verify build + type-check after each phase.

## Technical notes
- All new tables: `GRANT` block + RLS + `set_updated_at` + `stamp_updated_by` triggers + `log_row_delete` where relevant.
- Reuse existing `Section`, `PageHeader`, `DataTable`, `EmptyState`, `StatusBadge` primitives (verified present in codebase).
- No new brand tokens — pull from `src/index.css` / existing shell.
- Partner Portal deferred (user picked Customer Portal only for now); communications table designed to accept `entity_type='partner'` when it comes.

Total: ~1 migration + ~20 new/edited files. I'll execute phases in sequence, run typecheck between each.