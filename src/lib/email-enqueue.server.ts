// Server-only helper: render a registered React Email template and enqueue it
// for the process-email-queue dispatcher. Bypasses JWT — callers must handle
// authorization themselves before invoking.
import * as React from "react";
import { render } from "./email-render.server";
import { createClient } from "@supabase/supabase-js";
import { TEMPLATES } from "./email-templates/registry";

const SITE_NAME = "nevo-industrial-hub";
const SENDER_DOMAIN = "notify.nevoindustrial.com";
const FROM_DOMAIN = "notify.nevoindustrial.com";

function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  return `${local[0]}***@${domain}`;
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface EnqueueOptions {
  templateName: string;
  recipientEmail: string;
  idempotencyKey?: string;
  templateData?: Record<string, any>;
}

export type EnqueueResult =
  | { ok: true; queued: true; messageId: string }
  | {
      ok: false;
      reason:
        | "email_suppressed"
        | "unknown_template"
        | "render_failed"
        | "enqueue_failed"
        | "config_error"
        | "suppression_check_failed";
      message?: string;
    };

export async function enqueueTransactionalEmail(opts: EnqueueOptions): Promise<EnqueueResult> {
  const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("enqueueTransactionalEmail: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return { ok: false, reason: "config_error" };
  }

  const template = TEMPLATES[opts.templateName];
  if (!template) {
    return {
      ok: false,
      reason: "unknown_template",
      message: `Template '${opts.templateName}' not registered`,
    };
  }

  const recipient = (template.to || opts.recipientEmail || "").trim();
  if (!recipient) {
    return { ok: false, reason: "unknown_template", message: "no recipient" };
  }

  const supabase = createClient(url, serviceKey);
  const messageId = crypto.randomUUID();
  const idempotencyKey = opts.idempotencyKey || messageId;
  const templateData = opts.templateData ?? {};
  const normalized = recipient.toLowerCase();

  // Suppression check (fail-closed)
  const { data: suppressed, error: suppErr } = await supabase
    .from("suppressed_emails")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();
  if (suppErr) {
    console.error("Suppression check failed", suppErr);
    return { ok: false, reason: "suppression_check_failed" };
  }
  if (suppressed) {
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: opts.templateName,
      recipient_email: recipient,
      status: "suppressed",
    });
    return { ok: false, reason: "email_suppressed" };
  }

  // Unsubscribe token
  let unsubscribeToken = "";
  const { data: existing } = await supabase
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalized)
    .maybeSingle();
  if (existing && !existing.used_at) {
    unsubscribeToken = existing.token;
  } else if (!existing) {
    unsubscribeToken = generateToken();
    await supabase
      .from("email_unsubscribe_tokens")
      .upsert(
        { token: unsubscribeToken, email: normalized },
        { onConflict: "email", ignoreDuplicates: true },
      );
    const { data: stored } = await supabase
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", normalized)
      .maybeSingle();
    if (stored) unsubscribeToken = stored.token;
  }

  // Render
  let html: string, plainText: string, resolvedSubject: string;
  try {
    const element = React.createElement(template.component, templateData);
    html = await render(element);
    plainText = await render(element, { plainText: true });
    resolvedSubject =
      typeof template.subject === "function" ? template.subject(templateData) : template.subject;
  } catch (err) {
    console.error("render failed", err);
    return { ok: false, reason: "render_failed" };
  }

  await supabase.from("email_send_log").insert({
    message_id: messageId,
    template_name: opts.templateName,
    recipient_email: recipient,
    status: "pending",
  });

  const { error: enqErr } = await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: recipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: resolvedSubject,
      html,
      text: plainText,
      purpose: "transactional",
      label: opts.templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  });
  if (enqErr) {
    console.error("enqueue failed", enqErr);
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: opts.templateName,
      recipient_email: recipient,
      status: "failed",
      error_message: "Failed to enqueue email",
    });
    return { ok: false, reason: "enqueue_failed" };
  }

  console.log("Transactional email enqueued", {
    templateName: opts.templateName,
    recipient_redacted: redactEmail(recipient),
  });
  return { ok: true, queued: true, messageId };
}
