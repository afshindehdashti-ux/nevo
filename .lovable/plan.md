# IMAP Inbox for /admin/mails/inbox

## Credentials

Store as backend secrets (not in DB, not in code):
- `IMAP_HOST` (e.g. `imap.gmail.com`, `imap.hostinger.com`)
- `IMAP_PORT` (e.g. `993`)
- `IMAP_USER` (full email address)
- `IMAP_PASSWORD` (app password / mailbox password)
- `IMAP_TLS` (`true`/`false`, default `true`)

Requested via the secret prompt after you approve this plan — I don't hardcode or ask for them in chat.

## Backend

New file `src/lib/imap-inbox.functions.ts` — server functions guarded by `requireSupabaseAuth` + `has_role('super_admin')`:

- `listImapMessages({ mailbox?, limit?, offset?, search? })` — connects, opens mailbox (default `INBOX`), returns latest N envelopes: `uid, from, to, subject, date, snippet, flags, hasAttachments`.
- `getImapMessage({ uid, mailbox? })` — fetches full message: headers, text/html body, attachment metadata.
- `markImapMessage({ uid, seen?, flagged?, mailbox? })` — flag / mark read.
- `deleteImapMessage({ uid, mailbox? })` — move to Trash.
- `listImapMailboxes()` — list folders (INBOX, Sent, Drafts, Trash, custom).

Library: `imapflow` (modern, promise-based, uses Node `net`/`tls` which are supported under nodejs_compat). Each call opens a short-lived connection and closes it — no persistent pool (Workers are stateless).

Reply / send: reuse existing `/lovable/email/transactional/send` pipeline. Optional: append sent copy to IMAP `Sent` folder via `imapflow.append()`.

## Frontend

Rewrite `src/routes/_authenticated/admin.mails.inbox.tsx`:

- Left pane: mailbox folder list + message list (subject, from, date, unread dot).
- Right pane: selected message viewer (sanitized HTML via DOMPurify, or plain text fallback), attachments list, action bar (Reply, Mark unread, Delete).
- Reply drawer: prefilled To/Subject, composer, sends via existing transactional endpoint.
- Search box (server-side IMAP search on subject/from).
- Pagination / "Load more".
- Loading + empty + error states. If secrets missing, show a "Configure IMAP" empty state.

Data fetching: TanStack Query with `useSuspenseQuery`, keyed by mailbox + page + search.

## Runtime caveats

- IMAP over raw TCP from the Worker runtime is supported but not battle-tested for every provider; if a provider blocks non-interactive IMAP (Gmail requires an App Password + IMAP enabled), the connection will fail with a clear error surfaced in the UI.
- Large mailboxes: we only fetch envelopes for the current page, never the full mailbox.
- No push/IDLE — inbox refreshes on manual reload or a 60s polling interval.

## Files

- add `src/lib/imap-inbox.functions.ts`
- add `src/lib/imap-client.server.ts` (imapflow wrapper)
- edit `src/routes/_authenticated/admin.mails.inbox.tsx`
- add `imapflow`, `dompurify`, `isomorphic-dompurify` via `bun add`
- request 5 secrets above
