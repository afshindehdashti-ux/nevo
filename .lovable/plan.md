
## What ships this turn

A protected internal AI Assistant with four surfaces, wired to Lovable AI Gateway with `openai/gpt-5-mini` via the Responses API for chat/structured checks and `openai/text-embedding-3-small` for RAG.

Non-goals (queued for follow-up turns): training center, quick-action mutations, AI settings page, saved answers, WhatsApp/email drafters.

---

### 1. Chat page — `/admin/ai-assistant`

- Sidebar of past sessions (create / rename / delete), main chat pane, right panel of cited sources for the last answer.
- AI Elements composition (`Conversation`, `Message`, `MessageResponse`, `PromptInput`, `Shimmer`), streaming via `useChat` + `DefaultChatTransport`.
- Model calls happen in `src/routes/api/ai/chat.ts` (server route). Reads `LOVABLE_API_KEY` inside the handler, uses `openai/gpt-5-mini`.
- Every assistant reply persists to `ai_chat_messages` in `onFinish` with the citations it used.
- Role gate: Super Admin / Management / Sales / Operations / Finance / Read Only — Read Only cannot upload docs or use invoice AI Check.

### 2. Knowledge Base — `/admin/ai-assistant/knowledge-base`

- Upload UI (PDF / DOCX / XLSX / CSV / TXT / images) → private Supabase Storage bucket `ai-knowledge`.
- Server function `ingestKnowledgeDocument` extracts text (PDF via `unpdf`, DOCX via `mammoth`, XLSX/CSV via `xlsx`, images via note-only stub for Phase 1), chunks ~1000 chars with 150 overlap, embeds each chunk with `openai/text-embedding-3-small` (1536 dims), inserts into `ai_document_chunks`.
- List/delete UI with filters: category, access level, linked entity, tag search.
- Metadata form: title, category (enum), description, access level, linked customer / supplier / order / invoice (async selects), tags, status.
- RLS: reads gated by `has_any_role` matching the row's `access_level`; ingest/delete for Management/Super Admin only.

### 3. Floating "AI Assist" drawer — every backend page

- Small button in root `_authenticated` layout (bottom-right). Opens a `Sheet` containing a scoped chat that posts to `/api/ai/chat` with an extra `context` payload: `{ module, route, record_id, record_summary }`.
- The current route derives `module + record_id` from URL; a lightweight `getRecordSummary` server fn returns a safe summary (customer/supplier/order/invoice) scoped by RLS.
- Drawer conversations are ephemeral by default (not stored) with an "Attach summary to record" button that inserts into `ai_actions_log` — actual mutations queued for later.

### 4. Invoice AI Check

- `AI Check` button on the invoice detail page (proforma / commercial / commission) for Management / Finance / Super Admin.
- Calls `checkInvoiceIntegrity` server fn: pulls the invoice + items + customer/supplier via RLS, runs `generateText` with `Output.object` (strict json_schema, provider built with `structuredOutputs: true`) using `openai/gpt-5-mini`.
- Returns a structured list: `{ severity, field, message, suggestion }[]`. Rendered as a dialog; no auto-mutation, "Apply suggestion" chips are display-only in Phase 1.

---

### Database (one migration)

New tables — all in `public`, RLS on, GRANTs included:

- `ai_documents` — title, category (enum), description, file_url, file_type, byte_size, access_level (enum), related_customer_id, related_supplier_id, related_order_id, related_invoice_id, tags text[], uploaded_by, status, timestamps.
- `ai_document_chunks` — document_id fk, chunk_index, chunk_text, page_number, metadata jsonb, `embedding vector(1536)`, HNSW index on `embedding vector_cosine_ops`.
- `ai_chat_sessions` — user_id, title, related_module, related_record_id, timestamps.
- `ai_chat_messages` — session_id fk, user_id, role (user/assistant/system), content, parts jsonb (UIMessage parts), sources jsonb, tokens_in/out, created_at.
- `ai_actions_log` — user_id, action_type, related_module, related_record_id, ai_summary, metadata, created_at.
- Enums: `ai_document_category`, `ai_document_access_level`, `ai_document_status`, `ai_chat_role`.
- SQL fn `match_ai_chunks(query_embedding vector(1536), match_count int, allowed_levels text[], user_id uuid)` — SECURITY DEFINER, returns top-k chunks the caller is allowed to see, joins to document metadata for citations.

RLS:
- `ai_documents` / `ai_document_chunks`: SELECT where `has_any_role(uid, access_map[access_level])`; INSERT/DELETE for Management/Super Admin.
- `ai_chat_sessions` / `ai_chat_messages`: owner-only (`auth.uid() = user_id`).
- `ai_actions_log`: owner INSERT, staff SELECT.

Existing `ai_assistant_conversations` table is untouched (may be from an earlier feature) — Phase 1 uses the new tables.

### Storage

- Create private bucket `ai-knowledge` via `supabase--storage_create_bucket`.
- RLS on `storage.objects`: Management/Super Admin upload; readable by any authenticated user whose role matches the document's access level (looked up via the row's `file_url` path pattern).

### Secrets

- `LOVABLE_API_KEY` already present. No user-provided secrets required.

### New / changed files

- Migration (via `supabase--migration`).
- `src/lib/ai-gateway.server.ts` — provider helper (chat + structured + embeddings).
- `src/lib/ai-assistant.functions.ts` — `listChatSessions`, `createChatSession`, `getChatSession`, `deleteChatSession`, `saveChatMessage`, `ingestKnowledgeDocument`, `listKnowledgeDocuments`, `deleteKnowledgeDocument`, `getRecordSummary`, `checkInvoiceIntegrity`, `logAiAction`.
- `src/lib/ai-assistant.server.ts` — chunking, embedding, retrieval helpers (server-only).
- `src/routes/api/ai/chat.ts` — streaming chat route (RAG retrieval + Responses API, cites sources).
- `src/routes/_authenticated/admin.ai-assistant.tsx` — layout with sidebar + `<Outlet />`.
- `src/routes/_authenticated/admin.ai-assistant.index.tsx` — chat surface.
- `src/routes/_authenticated/admin.ai-assistant.knowledge-base.tsx` — upload + list.
- `src/components/ai/AiAssistDrawer.tsx` — global drawer, mounted in `_authenticated` layout.
- `src/components/ai/InvoiceAiCheckButton.tsx` — button + result dialog, wired into `admin.invoices.$id.tsx`.
- `src/components/ai/` supporting UI (SourcesPanel, KnowledgeUpload, ChatSessionList).
- Sidebar link added to `src/lib/crm-nav.ts` under Administration.
- AI Elements install: `bun x ai-elements@latest add conversation message prompt-input shimmer tool`.
- `bun add ai @ai-sdk/react @ai-sdk/openai-compatible unpdf mammoth xlsx`.

### Technical details

- Chat route: build `openai/gpt-5-mini` via `createLovableAiGatewayProvider(key, runId, { structuredOutputs: true })`, retrieve top-8 chunks with `match_ai_chunks` using the query's embedding, inject as a `system` message with numbered citations, stream via `streamText.toUIMessageStreamResponse({ originalMessages, onFinish })`. On finish, persist assistant message + cited chunk ids + document titles in `ai_chat_messages.sources`.
- Context drawer uses the same route with `context.system_addendum` merged into the system prompt (module + safe record summary).
- Invoice AI Check uses `generateText` with `Output.object` schema `{ findings: Array<{ severity: 'info'|'warning'|'error', field: string, message: string, suggestion: string | null }> }`, wrapped in the `NoObjectGeneratedError.isInstance` fallback.
- Embeddings called through the same gateway helper against `/v1/embeddings` — one request per batch of ≤ 96 chunks, respecting the 300k token cap.
- All model calls read `process.env.LOVABLE_API_KEY` inside handlers; `attachSupabaseAuth` already registered in `src/start.ts` handles bearer forwarding for server fns.
- `_authenticated` layout is integration-managed and untouched; the drawer is mounted via a small wrapper component imported by existing child routes that opt in (or from `__root.tsx` behind `useLocation` check for `_authenticated` prefix — final placement decided during implementation without altering the managed file).

### Verification before finishing

- Migration applied, `bunx tsgo --noEmit` and `bun run build` clean.
- Manual smoke: create a session, ask a question with no docs (fallback prompt), upload a small text file, re-ask and confirm citation appears, open the drawer on an invoice page and see AI reference the invoice number, click AI Check on an invoice and see structured findings.
- Confirm anonymous users cannot reach `/admin/ai-assistant` (already gated by `_authenticated`) and that a Sales user cannot see a Finance-only doc.

### Rough size

~9 new files, 1 migration, 1 modified route (`admin.invoices.$id.tsx`), 1 modified nav file. Expect several hundred lines of route/handler code plus the ingest pipeline. Realistically this is at the edge of one turn — I'll commit table + chat + knowledge base + drawer + AI Check together and cut smaller polish (per-role AI Settings page, training center, quick-action confirm flow) into follow-ups you can approve next.
