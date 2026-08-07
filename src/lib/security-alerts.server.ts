// Server-only helper: enqueue a security alert email and record it in
// activity_logs. The activity_logs row doubles as a dedup marker — callers
// pass a dedupKey and window; if a row already exists in the window it
// silently skips.
import { createClient } from "@supabase/supabase-js";
import { enqueueTransactionalEmail } from "./email-enqueue.server";
import { retryWithBackoff } from "./retry.server";
import type { SecurityAlertKind } from "./email-templates/security-alert";

const TEMPLATE_NAME = "security-alert";

export interface SecurityAlertInput {
  kind: SecurityAlertKind;
  /** Stable key identifying this logical event; used for dedup. */
  dedupKey: string;
  /** Suppress if an alert with the same dedupKey fired within this window. */
  dedupWindowMinutes?: number;
  headline: string;
  summary: string;
  details?: Array<{ label: string; value: string }>;
  /** Optional user_id to attach to the activity_logs row. */
  userId?: string | null;
}

export type SecurityAlertResult =
  | { ok: true; sent: true; messageId: string; dedupKey: string }
  | { ok: true; sent: false; reason: "duplicate"; dedupKey: string }
  | { ok: false; reason: string; message?: string; dedupKey: string };

function adminClient() {
  const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function enqueueSecurityAlert(
  input: SecurityAlertInput,
): Promise<SecurityAlertResult> {
  const admin = adminClient();
  if (!admin) {
    return { ok: false, reason: "config_error", dedupKey: input.dedupKey };
  }

  const windowMin = Math.max(1, input.dedupWindowMinutes ?? 10);
  const windowStart = new Date(Date.now() - windowMin * 60_000).toISOString();

  // Dedup: has an alert with this dedupKey fired inside the window?
  try {
    const { data: recent } = await admin
      .from("activity_logs")
      .select("id, metadata, created_at")
      .eq("action", "security_alert")
      .eq("entity_type", input.kind)
      .gte("created_at", windowStart)
      .limit(20);
    const dup = (recent ?? []).some(
      (r: any) => (r?.metadata?.dedup_key as string | undefined) === input.dedupKey,
    );
    if (dup) {
      return { ok: true, sent: false, reason: "duplicate", dedupKey: input.dedupKey };
    }
  } catch (err) {
    console.warn("security-alert dedup check failed", err);
  }

  const occurredAt = new Date().toISOString();

  const { result } = await retryWithBackoff(
    () =>
      enqueueTransactionalEmail({
        templateName: TEMPLATE_NAME,
        recipientEmail: "info@nevoindustrial.com",
        idempotencyKey: `security-alert-${input.dedupKey}`,
        templateData: {
          kind: input.kind,
          headline: input.headline,
          summary: input.summary,
          details: input.details ?? [],
          occurredAt,
        },
      }),
    {
      label: "security-alert-enqueue",
      maxAttempts: 4,
      baseDelayMs: 250,
      maxDelayMs: 3000,
      isTransient: (r) => r.ok === false,
    },
  );

  if (!result.ok) {
    console.error("security-alert enqueue failed", { dedupKey: input.dedupKey, result });
    return {
      ok: false,
      reason: result.reason,
      message: result.message,
      dedupKey: input.dedupKey,
    };
  }

  // Record the alert (used as dedup marker and audit trail).
  try {
    await admin.from("activity_logs").insert({
      user_id: input.userId ?? null,
      action: "security_alert",
      entity_type: input.kind,
      entity_id: input.dedupKey,
      metadata: {
        dedup_key: input.dedupKey,
        headline: input.headline,
        summary: input.summary,
        details: input.details ?? [],
        message_id: result.messageId,
        sent_at: occurredAt,
      },
    });
  } catch (err) {
    console.warn("security-alert activity_logs insert failed", err);
  }

  return { ok: true, sent: true, messageId: result.messageId, dedupKey: input.dedupKey };
}
