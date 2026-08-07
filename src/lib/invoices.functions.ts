import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { customerDisplayName, type CustomerDisplay } from "@/lib/finance-normalization";

const schema = z.object({
  invoiceId: z.string().uuid(),
  storagePath: z.string().min(1).max(500),
  recipientEmail: z.string().email(),
  message: z.string().max(2000).optional().nullable(),
});

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Email a Proforma / Commercial invoice PDF to the customer.
 * The client uploads the PDF to the `crm-docs` bucket and passes the
 * storage path. This function:
 *   1. Loads the invoice for context (number, totals, kind, customer name).
 *   2. Mints a 7-day signed URL for the uploaded PDF.
 *   3. Enqueues the `invoice-share` email via the transactional send route.
 *   4. Logs the send to activity_logs so we can audit "sent to X".
 */
export const emailInvoicePdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => schema.parse(raw))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = context.supabase as any;

    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select(
        "id, invoice_number, type, currency, total, issue_date, due_date, customer_id, customers(name, company_name, email)",
      )
      .eq("id", data.invoiceId)
      .maybeSingle();
    if (invErr || !invoice) {
      return { ok: false as const, reason: "invoice_not_found" };
    }

    // Sanity-check that the storage path lives in a namespace tied to this
    // invoice — we require the client to prefix uploads with `invoices/<id>/`.
    const expectedPrefix = `invoices/${data.invoiceId}/`;
    if (!data.storagePath.startsWith(expectedPrefix)) {
      return { ok: false as const, reason: "invalid_storage_path" };
    }

    const { data: signed, error: signErr } = await supabase.storage
      .from("crm-docs")
      .createSignedUrl(data.storagePath, SIGNED_URL_TTL_SECONDS, {
        download: `Invoice-${invoice.invoice_number ?? invoice.id.slice(0, 8)}.pdf`,
      });
    if (signErr || !signed?.signedUrl) {
      return { ok: false as const, reason: "signed_url_failed" };
    }

    const req = getRequest();
    const authHeader = req?.headers.get("authorization") ?? req?.headers.get("Authorization");
    const host = req?.headers.get("host");
    const proto = req?.headers.get("x-forwarded-proto") ?? "https";
    if (!authHeader || !host) {
      return { ok: false as const, reason: "no_request_context" };
    }

    const customer = invoice.customers as CustomerDisplay | null;
    const invoiceKind: "proforma" | "commercial" =
      invoice.type === "commercial" ? "commercial" : "proforma";

    // Look up the sender's display name for the email closing.
    let senderName: string | null = null;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", context.userId)
        .maybeSingle();
      senderName = profile?.full_name ?? null;
    } catch {
      /* non-fatal */
    }

    try {
      const res = await fetch(`${proto}://${host}/lovable/email/transactional/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          templateName: "invoice-share",
          recipientEmail: data.recipientEmail,
          // One idempotency key per (invoice, storage upload) so re-sending
          // a freshly re-generated PDF is not deduped, but a double-click
          // on the same click is.
          idempotencyKey: `invoice-share-${invoice.id}-${data.storagePath}`,
          templateData: {
            customerName: customerDisplayName(customer),
            invoiceNumber: invoice.invoice_number ?? undefined,
            invoiceKind,
            currency: invoice.currency ?? "USD",
            total: invoice.total ?? undefined,
            issueDate: invoice.issue_date ?? undefined,
            dueDate: invoice.due_date ?? undefined,
            downloadUrl: signed.signedUrl,
            expiresInHours: Math.floor(SIGNED_URL_TTL_SECONDS / 3600),
            message: data.message ?? undefined,
            senderName: senderName ?? undefined,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`invoice share email failed [${res.status}]: ${body}`);
        return { ok: false as const, reason: "send_failed" };
      }
    } catch (err) {
      console.error("invoice share email error", err);
      return { ok: false as const, reason: "exception" };
    }

    // Audit trail — best-effort; do not fail the request if this errors.
    try {
      await supabase.from("activity_logs").insert({
        user_id: context.userId,
        action: "email_sent",
        entity_type: invoiceKind === "commercial" ? "invoice" : "proforma",
        entity_id: invoice.id,
        metadata: {
          recipient: data.recipientEmail,
          storage_path: data.storagePath,
          invoice_number: invoice.invoice_number,
          expires_in_hours: Math.floor(SIGNED_URL_TTL_SECONDS / 3600),
        },
      });
    } catch (err) {
      console.warn("invoice share activity log failed", err);
    }

    return {
      ok: true as const,
      expiresInHours: Math.floor(SIGNED_URL_TTL_SECONDS / 3600),
    };
  });
