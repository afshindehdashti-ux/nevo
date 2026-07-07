# Mail Hub at `/admin/mails`

A super-admin-only mail center inside the existing admin shell, split into three tabs.

## 1. Log Dashboard (`/admin/mails` — default tab)

Read-only monitoring of every email your app sends (auth + app emails). Data source: existing `email_send_log` table, deduped by `message_id`.

Includes all six required dashboard features:
- Time range: Last 24h / 7d / 30d + custom picker (default 7d)
- Template filter (multi-select of all distinct `template_name`)
- Status filter (All / Sent / Failed / Suppressed) with color badges
- Summary stat cards: total unique / sent / failed / suppressed
- Sortable, paginated table (50/page): Template, Recipient, Status, Timestamp, Error
- Row click → detail drawer with full metadata + error trace

Extras:
- Suppressed emails panel (from `suppressed_emails`) with reason + date
- "Resend" button on failed rows (re-queues via existing send route)

## 2. Compose & Send (`/admin/mails/compose`)

Admin composer to send app emails to any customer/lead/contact/partner.

- Recipient picker: search across `customers`, `contacts`, `leads`, `partners` (or free-form email)
- Template picker: choose any registered React Email template OR "Custom message"
- Template data fields render dynamically from the template's `previewData` shape
- Custom message mode: subject + rich text body (uses a generic `admin-broadcast` template we'll add)
- Preview pane (calls existing `/lovable/email/transactional/preview`)
- Send → POSTs to `/lovable/email/transactional/send` with idempotency key `admin-manual-<uuid>`
- One recipient per send (Lovable rule: no bulk). For multi-recipient, sends sequentially with progress + logs each in `email_send_log`

## 3. Inbox (`/admin/mails/inbox`)

**Important caveat:** Lovable's built-in email system is send-only — it does not receive mail. To read incoming email to `@nevoindustrial.com` addresses, we need one of:

- **Option A (recommended): Gmail connector** — connects YOUR business Gmail (e.g. info@nevoindustrial.com if it's a Google Workspace mailbox) via the built-in Google Mail connector. Full read/reply/label support through the Lovable gateway. Works only if that mailbox is on Google Workspace.
- **Option B: IMAP integration** — custom code + credentials for a non-Gmail mailbox. More work, less reliable.
- **Option C: skip inbox for now** — ship dashboard + compose, add inbox later.

Assuming **Option A**: I'll wire the Gmail connector and build:
- Thread list (INBOX label, unread first, search, pagination)
- Thread reader with full message HTML
- Reply / reply-all / forward (uses `gmail.send`)
- Mark read / archive / trash (uses `gmail.modify`)
- Label sidebar

If your business mailbox isn't Google Workspace, tell me and we'll do B or C.

## Access control

- All routes under `_authenticated/admin/mails*`
- Guarded by existing `AdminRouteGuard` requiring `super_admin` role
- Compose + Inbox actions also re-check role server-side before hitting Gmail/send routes

## Technical details

Files to add:
- `src/routes/_authenticated/admin.mails.tsx` — layout with tabs + Outlet
- `src/routes/_authenticated/admin.mails.index.tsx` — log dashboard
- `src/routes/_authenticated/admin.mails.compose.tsx` — composer
- `src/routes/_authenticated/admin.mails.inbox.tsx` — Gmail inbox list
- `src/routes/_authenticated/admin.mails.inbox.$threadId.tsx` — thread reader
- `src/lib/mail-hub.functions.ts` — `listEmailLogs`, `getEmailLogDetail`, `listSuppressed`, `resendEmail`, `searchRecipients`, `listGmailThreads`, `getGmailThread`, `sendGmailReply`, `modifyGmailMessage` (all `requireSupabaseAuth` + `has_role('super_admin')` check)
- `src/lib/email-templates/admin-broadcast.tsx` — generic admin-authored email template
- Sidebar link added to `AdminSidebar` for "Mail Hub"

No new DB tables needed — reuses `email_send_log`, `suppressed_emails`, `customers`, `contacts`, `leads`, `partners`.

If you pick Option A for inbox, I'll trigger the Gmail connector link during implementation.

## Confirm

1. Inbox option: **A** (Gmail connector), **B** (IMAP — tell me the mailbox provider), or **C** (skip)?
2. Which mailbox address should the inbox connect to?
