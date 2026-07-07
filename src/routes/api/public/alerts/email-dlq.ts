// Backend alert endpoint — receives DLQ notifications from the database
// trigger `notify_email_dlq` on public.email_send_log and enqueues a branded
// alert email to the operations mailbox. Bearer-protected with the same
// service-role key used by the queue processor.
import { createFileRoute } from '@tanstack/react-router'

const ALERT_TEMPLATE = 'email-dlq-alert'

export const Route = createFileRoute('/api/public/alerts/email-dlq')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!serviceKey) {
          return Response.json({ error: 'server misconfigured' }, { status: 500 })
        }

        const auth = request.headers.get('Authorization') ?? ''
        const provided = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
        if (!provided || provided !== serviceKey) {
          return Response.json({ error: 'unauthorized' }, { status: 401 })
        }

        let body: {
          message_id?: string | null
          template_name?: string | null
          recipient_email?: string | null
          error_message?: string | null
          failed_at?: string | null
          metadata?: Record<string, unknown> | null
        }
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'invalid json' }, { status: 400 })
        }

        // Never alert about the alert itself — prevents an alert loop if the
        // alert email ever DLQs (it will still be logged and visible in
        // email_send_log with status='dlq').
        if (body.template_name === ALERT_TEMPLATE) {
          return Response.json({ skipped: true, reason: 'alert-template' })
        }

        const { enqueueTransactionalEmail } = await import('@/lib/email-enqueue.server')
        const result = await enqueueTransactionalEmail({
          templateName: ALERT_TEMPLATE,
          recipientEmail: 'info@nevoindustrial.com',
          idempotencyKey: body.message_id
            ? `email-dlq-alert-${body.message_id}`
            : undefined,
          templateData: {
            messageId: body.message_id ?? undefined,
            templateName: body.template_name ?? undefined,
            recipientEmail: body.recipient_email ?? undefined,
            errorMessage: body.error_message ?? undefined,
            failedAt: body.failed_at ?? new Date().toISOString(),
            metadata: body.metadata ?? undefined,
          },
        })

        if (!result.ok) {
          console.error('email-dlq alert enqueue failed', result)
          return Response.json(
            { ok: false, reason: result.reason, message: result.message },
            { status: 502 },
          )
        }

        return Response.json({ ok: true, messageId: result.messageId })
      },
    },
  },
})
