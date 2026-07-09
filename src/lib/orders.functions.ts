import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeAudit } from "./audit-log";

const schema = z.object({
  orderId: z.string().uuid(),
});

export const sendOrderConfirmation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => schema.parse(raw))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error } = await (context.supabase as any)
      .from("orders")
      .select(
        "id, order_number, order_date, currency, total, requested_delivery, notes, customer:customers ( name, email )",
      )
      .eq("id", data.orderId)
      .maybeSingle();
    if (error || !order) return { ok: false as const, reason: "order_not_found" };

    const customer = order.customer as { name?: string | null; email?: string | null } | null;
    const recipient = customer?.email?.trim();
    if (!recipient) return { ok: false as const, reason: "no_customer_email" };

    try {
      const req = getRequest();
      const authHeader =
        req?.headers.get("authorization") ?? req?.headers.get("Authorization");
      const host = req?.headers.get("host");
      const proto = req?.headers.get("x-forwarded-proto") ?? "https";
      if (!authHeader || !host) return { ok: false as const, reason: "no_request_context" };

      const siteUrl =
        process.env.APP_URL || process.env.SITE_URL || "https://nevoindustrial.com";

      const res = await fetch(`${proto}://${host}/lovable/email/transactional/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          templateName: "order-confirmation",
          recipientEmail: recipient,
          idempotencyKey: `order-confirmation-${order.id}`,
          templateData: {
            customerName: customer?.name ?? undefined,
            orderNumber: order.order_number ?? undefined,
            orderDate: order.order_date ?? undefined,
            currency: order.currency ?? "USD",
            total: order.total ?? undefined,
            requestedDelivery: order.requested_delivery ?? undefined,
            notes: order.notes ?? undefined,
            portalUrl: `${siteUrl}/portal`,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`order confirmation email failed [${res.status}]: ${body}`);
        return { ok: false as const, reason: "send_failed" };
      }
      await writeAudit(context.supabase, {
        user_id: context.userId,
        action: "send_confirmation",
        entity_type: "order",
        entity_id: order.id,
        metadata: { recipient, order_number: order.order_number ?? null },
      });
      return { ok: true as const };
    } catch (err) {
      console.error("order confirmation email error", err);
      return { ok: false as const, reason: "exception" };
    }
  });
