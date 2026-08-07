// SMS alerts for critical backend failures.
// Uses Twilio directly (Basic auth) and a dedup table so repeated failures of
// the same kind don't spam the on-call phone.
//
// Server-only. Never import from client or route/component modules directly;
// load inside a server route handler.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { retryWithBackoff, isTransientHttpStatus } from "@/lib/retry.server";

export type SmsAlertResult =
  | { ok: true; sid: string; deduped: false }
  | { ok: true; deduped: true; reason: "within-window"; suppressedCount: number }
  | { ok: false; reason: "missing-config" | "twilio-error" | "dedup-error"; message: string };

interface SendCriticalSmsInput {
  /** Stable dedup identity — same key within the window is suppressed. */
  dedupKey: string;
  /** SMS body (Twilio hard-caps around 1600 chars; keep it short). */
  message: string;
  /** Optional metadata stored on the dedup row for auditing. */
  payload?: Record<string, unknown>;
  /** Override the default dedup window from SMS_ALERT_DEDUP_MINUTES. */
  dedupMinutes?: number;
}

const DEFAULT_DEDUP_MINUTES = 185;

function getDedupMinutes(override?: number): number {
  if (typeof override === "number" && override > 0) return override;
  const raw = process.env.SMS_ALERT_DEDUP_MINUTES;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DEDUP_MINUTES;
}

/**
 * Send a critical-failure SMS via Twilio with a rolling dedup window.
 * Returns `deduped: true` when the same `dedupKey` was sent within the window.
 */
export async function sendCriticalSms(input: SendCriticalSmsInput): Promise<SmsAlertResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const toNumber = process.env.SMS_ALERT_TO;

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    return {
      ok: false,
      reason: "missing-config",
      message:
        "Twilio env vars missing (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, SMS_ALERT_TO)",
    };
  }

  const windowMinutes = getDedupMinutes(input.dedupMinutes);
  const windowStart = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  // Dedup check + record. Uses `upsert` with a conditional read: if a row
  // exists inside the window we bump the counter and skip sending.
  const { data: existing, error: readErr } = await supabaseAdmin
    .from("sms_alert_dedup")
    .select("dedup_key, last_sent_at, send_count")
    .eq("dedup_key", input.dedupKey)
    .maybeSingle();

  if (readErr) {
    console.error("sms-alert dedup read failed", readErr);
    return { ok: false, reason: "dedup-error", message: readErr.message };
  }

  if (existing && existing.last_sent_at && existing.last_sent_at > windowStart) {
    // Suppress: still within window. Track the suppressed hit for visibility.
    const { error: bumpErr } = await supabaseAdmin
      .from("sms_alert_dedup")
      .update({
        send_count: (existing.send_count ?? 1) + 1,
        last_payload: (input.payload ?? {}) as any,
      })
      .eq("dedup_key", input.dedupKey);
    if (bumpErr) console.warn("sms-alert dedup bump failed", bumpErr);
    return {
      ok: true,
      deduped: true,
      reason: "within-window",
      suppressedCount: (existing.send_count ?? 1) + 1,
    };
  }

  // Send via Twilio REST API.
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    To: toNumber,
    From: fromNumber,
    Body: input.message.slice(0, 1500),
  });
  const basic = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  // Retry with exponential backoff on network errors and transient HTTP status
  // (408/425/429/5xx). Non-transient errors (e.g. 400 bad number, 401 auth)
  // return immediately without retrying.
  type TwilioAttempt =
    | { ok: true; sid: string }
    | { ok: false; transient: boolean; status: number; text: string; message: string };

  let sid = "";
  try {
    const { result } = await retryWithBackoff<TwilioAttempt>(
      async () => {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Basic ${basic}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
          });
          const text = await res.text();
          if (!res.ok) {
            return {
              ok: false,
              transient: isTransientHttpStatus(res.status),
              status: res.status,
              text,
              message: `HTTP ${res.status}: ${text}`,
            };
          }
          let attemptSid = "";
          try {
            const parsed = JSON.parse(text) as { sid?: string };
            attemptSid = parsed.sid ?? "";
          } catch {
            // ignore — success without parseable body
          }
          return { ok: true, sid: attemptSid };
        } catch (err) {
          // Network / DNS / abort — always transient; rethrow so retry helper
          // treats it as a throw and backs off.
          throw err instanceof Error ? err : new Error(String(err));
        }
      },
      {
        label: "twilio-send",
        maxAttempts: 4,
        baseDelayMs: 300,
        maxDelayMs: 4000,
        isTransient: (r) => r.ok === false && r.transient,
      },
    );
    if (!result.ok) {
      console.error(`Twilio send failed [${result.status}]: ${result.text}`);
      return { ok: false, reason: "twilio-error", message: result.message };
    }
    sid = result.sid;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Twilio fetch threw after retries", message);
    return { ok: false, reason: "twilio-error", message };
  }

  // Record the send. Upsert so a first-time key inserts, existing (expired) key resets.
  const now = new Date().toISOString();
  const { error: upsertErr } = await supabaseAdmin.from("sms_alert_dedup").upsert(
    {
      dedup_key: input.dedupKey,
      first_sent_at: existing ? (existing.last_sent_at ?? now) : now,
      last_sent_at: now,
      send_count: 1,
      last_payload: (input.payload ?? {}) as any,
    },
    { onConflict: "dedup_key" },
  );
  if (upsertErr) console.warn("sms-alert dedup upsert failed", upsertErr);

  return { ok: true, sid, deduped: false };
}
