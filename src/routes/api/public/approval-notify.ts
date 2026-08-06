import { withMethodGuards } from "@/lib/api-http";
import { timingSafeEqualText } from "@/lib/api-security";
import * as React from "react";
import { render } from "@react-email/render";
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SITE_NAME = "nevo-industrial-hub";
const SENDER_DOMAIN = "notify.nevoindustrial.com";
const FROM_DOMAIN = "notify.nevoindustrial.com";
const APP_URL = "https://www.nevoindustrial.com";
const TEMPLATE_NAME = "approval-notification";

const ENTITY_TYPE_LABEL: Record<string, string> = {
  proforma: "Proforma invoice",
  invoice: "Invoice",
  commission_invoice: "Commission invoice",
  document: "Sensitive document",
  quotation_discount: "Quotation discount",
};

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function redact(email: string): string {
  const [l, d] = email.split("@");
  if (!l || !d) return "***";
  return `${l[0]}***@${d}`;
}

async function resolveEntityLabel(
  admin: any,
  entityType: string,
  entityId: string,
): Promise<string | null> {
  try {
    if (entityType === "proforma" || entityType === "invoice") {
      const { data } = await admin
        .from("invoices")
        .select("invoice_number, total, currency")
        .eq("id", entityId)
        .maybeSingle();
      if (!data) return null;
      const d = data as any;
      return `${d.invoice_number ?? "(draft)"} · ${d.currency} ${Number(d.total).toLocaleString()}`;
    }
    if (entityType === "commission_invoice") {
      const { data } = await admin
        .from("partner_commissions")
        .select("amount, currency, partners(company_name)")
        .eq("id", entityId)
        .maybeSingle();
      if (!data) return null;
      const d = data as any;
      return `${d.partners?.company_name ?? "Partner"} · ${d.currency} ${Number(d.amount).toLocaleString()}`;
    }
    if (entityType === "document") {
      const { data } = await admin
        .from("doc_intel_documents")
        .select("title, original_filename, confidentiality_level")
        .eq("id", entityId)
        .maybeSingle();
      if (!data) return null;
      const d = data as any;
      return `${d.title || d.original_filename || "Document"}${d.confidentiality_level ? ` · ${d.confidentiality_level}` : ""}`;
    }
    if (entityType === "quotation_discount") {
      const { data } = await admin
        .from("quotations")
        .select("quotation_number, total, currency")
        .eq("id", entityId)
        .maybeSingle();
      if (!data) return null;
      const d = data as any;
      return `${d.quotation_number ?? "(draft)"} · ${d.currency} ${Number(d.total).toLocaleString()}`;
    }
  } catch (err) {
    console.warn("resolveEntityLabel failed", err);
  }
  return null;
}

async function resolveEmail(admin: any, userId: string): Promise<string | null> {
  try {
    const { data, error } = await (admin as any).auth.admin.getUserById(userId);
    if (error) return null;
    return (data?.user?.email as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function resolveName(admin: any, userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null;
  try {
    const { data } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    return ((data as any)?.full_name as string | null | undefined) ?? null;
  } catch {
    return null;
  }
}

async function enqueueForRecipient(
  admin: any,
  recipient: string,
  subject: string,
  html: string,
  text: string,
) {
  const normalized = recipient.toLowerCase();

  // Suppression check
  const { data: suppressed } = await admin
    .from("suppressed_emails")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();
  if (suppressed) {
    console.log("approval-notify: recipient suppressed", { recipient: redact(recipient) });
    return { queued: false, reason: "suppressed" as const };
  }

  // Get/create unsubscribe token
  let token: string;
  const { data: existing } = await admin
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalized)
    .maybeSingle();
  if (existing && !(existing as any).used_at) {
    token = (existing as any).token;
  } else if (!existing) {
    token = generateToken();
    await admin
      .from("email_unsubscribe_tokens")
      .upsert({ token, email: normalized }, { onConflict: "email", ignoreDuplicates: true });
    const { data: stored } = await admin
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", normalized)
      .maybeSingle();
    token = ((stored as any)?.token as string) || token;
  } else {
    return { queued: false, reason: "token-used" as const };
  }

  const messageId = crypto.randomUUID();

  await admin.from("email_send_log").insert({
    message_id: messageId,
    template_name: TEMPLATE_NAME,
    recipient_email: recipient,
    status: "pending",
  });

  const { error: enqueueError } = await admin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: recipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: "transactional",
      label: TEMPLATE_NAME,
      idempotency_key: messageId,
      unsubscribe_token: token,
      queued_at: new Date().toISOString(),
    },
  } as any);

  if (enqueueError) {
    console.error("approval-notify: enqueue failed", enqueueError);
    await admin.from("email_send_log").insert({
      message_id: messageId,
      template_name: TEMPLATE_NAME,
      recipient_email: recipient,
      status: "failed",
      error_message: "enqueue failed",
    });
    return { queued: false, reason: "enqueue-failed" as const };
  }

  return { queued: true, reason: "ok" as const };
}

export const Route = createFileRoute("/api/public/approval-notify")({
  server: {
    handlers: withMethodGuards({
      POST: async ({ request }) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) {
          return Response.json({ error: "server misconfigured" }, { status: 500 });
        }

        // Bearer must equal the service-role key (same secret used by the DB trigger via vault)
        const auth = request.headers.get("Authorization") ?? "";
        const provided = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
        if (!provided || !timingSafeEqualText(provided, serviceKey)) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }

        let body: { request_id?: string; event?: string; status?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid json" }, { status: 400 });
        }
        const requestId = body.request_id;
        const event = body.event;
        if (!requestId || (event !== "submitted" && event !== "decision")) {
          return Response.json({ error: "invalid payload" }, { status: 400 });
        }

        const admin = createClient(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: req, error: reqErr } = await admin
          .from("approval_requests")
          .select(
            "id, entity_type, entity_id, status, reason, requested_by, decided_by, decision_notes",
          )
          .eq("id", requestId)
          .maybeSingle();
        if (reqErr || !req) {
          return Response.json({ error: "request not found" }, { status: 404 });
        }
        const r = req as any;

        // Kind derivation
        let kind: "submitted" | "approved" | "rejected" | "cancelled";
        if (event === "submitted") kind = "submitted";
        else if (r.status === "approved") kind = "approved";
        else if (r.status === "rejected") kind = "rejected";
        else if (r.status === "cancelled") kind = "cancelled";
        else return Response.json({ skipped: true, reason: "non-terminal status" });

        // Recipients: management + finance for all events; also include requester on decisions
        const { data: roleRows, error: roleErr } = await admin
          .from("user_roles")
          .select("user_id")
          .in("role", ["super_admin", "management", "finance"]);
        if (roleErr) {
          return Response.json({ error: "role lookup failed" }, { status: 500 });
        }

        const recipientIds = new Set<string>();
        for (const row of (roleRows ?? []) as any[]) recipientIds.add(row.user_id);
        if (kind !== "submitted" && r.requested_by) recipientIds.add(r.requested_by);
        // Do not spam decider with their own decision
        if (r.decided_by) recipientIds.delete(r.decided_by);

        // Resolve emails
        const recipientEmails = new Set<string>();
        for (const uid of recipientIds) {
          const email = await resolveEmail(admin, uid);
          if (email) recipientEmails.add(email);
        }

        if (recipientEmails.size === 0) {
          return Response.json({ ok: true, queued: 0, note: "no recipients" });
        }

        const [entityLabel, requesterName, deciderName] = await Promise.all([
          resolveEntityLabel(admin, r.entity_type, r.entity_id),
          resolveName(admin, r.requested_by),
          resolveName(admin, r.decided_by),
        ]);

        const templateData = {
          kind,
          entityTypeLabel: ENTITY_TYPE_LABEL[r.entity_type] ?? "Approval request",
          entityLabel,
          reason: r.reason,
          requesterName,
          deciderName,
          notes: r.decision_notes,
          approvalUrl: `${APP_URL}/admin/approvals`,
        };

        const entry = TEMPLATES[TEMPLATE_NAME];
        if (!entry) {
          return Response.json({ error: "template missing" }, { status: 500 });
        }
        const element = React.createElement(entry.component, templateData);
        const html = await render(element);
        const text = await render(element, { plainText: true });
        const subject =
          typeof entry.subject === "function" ? entry.subject(templateData) : entry.subject;

        let queued = 0;
        let skipped = 0;
        for (const recipient of recipientEmails) {
          const res = await enqueueForRecipient(admin, recipient, subject, html, text);
          if (res.queued) queued++;
          else skipped++;
        }

        console.log("approval-notify processed", {
          request_id: requestId,
          kind,
          queued,
          skipped,
        });

        // High-risk security alert: every rejection of a pending request also
        // pages the security recipient. Dedup keyed by request id so retries
        // of this endpoint don't re-alert.
        if (kind === "rejected") {
          try {
            const { enqueueSecurityAlert } = await import("@/lib/security-alerts.server");
            void enqueueSecurityAlert({
              kind: "approval_rejected",
              dedupKey: `approval-rejected:${requestId}`,
              dedupWindowMinutes: 24 * 60,
              userId: r.decided_by ?? null,
              headline: `${ENTITY_TYPE_LABEL[r.entity_type] ?? "Approval request"} rejected${entityLabel ? ` — ${entityLabel}` : ""}`,
              summary:
                "An approval request was rejected. Confirm the rejection was intended and review the requester and decider below.",
              details: [
                {
                  label: "Type",
                  value: ENTITY_TYPE_LABEL[r.entity_type] ?? r.entity_type,
                },
                ...(entityLabel ? [{ label: "Item", value: entityLabel }] : []),
                ...(requesterName ? [{ label: "Requested by", value: requesterName }] : []),
                ...(deciderName ? [{ label: "Rejected by", value: deciderName }] : []),
                ...(r.reason ? [{ label: "Original reason", value: String(r.reason) }] : []),
                ...(r.decision_notes
                  ? [{ label: "Decision notes", value: String(r.decision_notes) }]
                  : []),
              ],
            });
          } catch (err) {
            console.warn("approval rejection security-alert failed", err);
          }
        }

        return Response.json({ ok: true, queued, skipped });
      },
    }),
  },
});
