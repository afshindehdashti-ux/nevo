import { withMethodGuards } from "@/lib/api-http";
// Backend alert endpoint — receives DLQ notifications from the database
// trigger `notify_email_dlq` on public.email_send_log and enqueues a branded
// alert email to the operations mailbox. Bearer-protected with the same
// service-role key used by the queue processor.
import { createFileRoute } from "@tanstack/react-router";

const ALERT_TEMPLATE = "email-dlq-alert";

export const Route = createFileRoute("/api/public/alerts/email-dlq")({
  server: {
    handlers: withMethodGuards({
      POST: async ({ request }) => {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
          return Response.json({ error: "server misconfigured" }, { status: 500 });
        }

        const auth = request.headers.get("Authorization") ?? "";
        const provided = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
        if (!provided || provided !== serviceKey) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }

        let body: {
          message_id?: string | null;
          template_name?: string | null;
          recipient_email?: string | null;
          error_message?: string | null;
          failed_at?: string | null;
          metadata?: Record<string, unknown> | null;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid json" }, { status: 400 });
        }

        // Never alert about the alert itself — prevents an alert loop if the
        // alert email ever DLQs (it will still be logged and visible in
        // email_send_log with status='dlq').
        if (body.template_name === ALERT_TEMPLATE) {
          return Response.json({ skipped: true, reason: "alert-template" });
        }

        const { enqueueTransactionalEmail } = await import("@/lib/email-enqueue.server");
        const { retryWithBackoff } = await import("@/lib/retry.server");
        // Retry the enqueue on transient failures (DB blip, network hiccup).
        // Idempotency key ensures a partially-succeeded enqueue doesn't double-send.
        const { result } = await retryWithBackoff(
          () =>
            enqueueTransactionalEmail({
              templateName: ALERT_TEMPLATE,
              recipientEmail: "info@nevoindustrial.com",
              idempotencyKey: body.message_id ? `email-dlq-alert-${body.message_id}` : undefined,
              templateData: {
                messageId: body.message_id ?? undefined,
                templateName: body.template_name ?? undefined,
                recipientEmail: body.recipient_email ?? undefined,
                errorMessage: body.error_message ?? undefined,
                failedAt: body.failed_at ?? new Date().toISOString(),
                metadata: body.metadata ?? undefined,
              },
            }),
          {
            label: "email-dlq-enqueue",
            maxAttempts: 4,
            baseDelayMs: 250,
            maxDelayMs: 3000,
            isTransient: (r) => r.ok === false,
          },
        );

        if (!result.ok) {
          console.error("email-dlq alert enqueue failed", result);
        }

        // Fire critical SMS in parallel — dedup keyed by template so a
        // storm of failures for one template only pages once per window.
        const { sendCriticalSms } = await import("@/lib/sms-alerts.server");
        const dedupKey = `email-dlq:${body.template_name ?? "unknown"}`;
        const smsBody =
          `[NEVO] Email DLQ: ${body.template_name ?? "unknown"}` +
          ` -> ${body.recipient_email ?? "unknown"}` +
          (body.error_message ? ` | ${String(body.error_message).slice(0, 180)}` : "");
        const sms = await sendCriticalSms({
          dedupKey,
          message: smsBody,
          payload: {
            message_id: body.message_id,
            template_name: body.template_name,
            recipient_email: body.recipient_email,
            error_message: body.error_message,
            failed_at: body.failed_at,
          },
        });
        if (!sms.ok) {
          console.error("email-dlq sms alert failed", sms);
        }

        if (!result.ok) {
          return Response.json(
            { ok: false, reason: result.reason, message: result.message, sms },
            { status: 502 },
          );
        }

        return Response.json({ ok: true, messageId: result.messageId, sms });
      },
    }),
  },
});
