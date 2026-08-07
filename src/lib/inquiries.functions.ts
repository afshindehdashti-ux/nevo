import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// ---------- Schemas ----------

const InquirySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional().nullable(),
  company: z.string().trim().max(200).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  application: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().max(5000).optional().nullable(),
  source_page: z.string().trim().max(300).optional().nullable(),
  calculator_state: z
    .unknown()
    .optional()
    .nullable()
    .superRefine((val, ctx) => {
      if (val === null || val === undefined) return;
      let serialized: string;
      try {
        serialized = JSON.stringify(val);
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "calculator_state not serializable" });
        return;
      }
      if (!serialized) return;
      if (serialized.length > 32_000) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "calculator_state too large" });
      }
    }),
  // Honeypot — must be empty
  website: z.string().max(0).optional().nullable(),
});

const DownloadSchema = z.object({
  document_id: z.string().trim().min(1).max(200),
  document_title: z.string().trim().max(300).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  source_page: z.string().trim().max(300).optional().nullable(),
  status: z.enum(["start", "success", "failure"]).default("success"),
  filename: z.string().trim().max(300).optional().nullable(),
  duration_ms: z.number().int().min(0).max(600_000).optional().nullable(),
  error_message: z.string().trim().max(500).optional().nullable(),
});

// ---------- Helpers ----------

function serverClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function requestMeta(): { ip: string | null; ua: string | null } {
  try {
    const req = getRequest();
    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const ua = req.headers.get("user-agent");
    return { ip, ua };
  } catch {
    return { ip: null, ua: null };
  }
}

// ---------- Server functions ----------

export const submitInquiry = createServerFn({ method: "POST" })
  .validator((data: unknown) => InquirySchema.parse(data))
  .handler(async ({ data }) => {
    // Honeypot: silently succeed to fool bots.
    if (data.website && data.website.length > 0) {
      return { ok: true as const };
    }
    const meta = requestMeta();
    const supabase = serverClient();
    const { data: inserted, error } = await supabase
      .from("project_inquiries")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        company: data.company ?? null,
        country: data.country ?? null,
        application: data.application ?? null,
        message: data.message ?? null,
        source_page: data.source_page ?? null,
        calculator_state: (data.calculator_state as never) ?? null,
        ip: meta.ip,
        user_agent: meta.ua,
      })
      .select("id")
      .single();
    if (error) {
      // Don't leak DB details to the client
      throw new Error("Failed to submit inquiry");
    }
    const inquiryId = (inserted as { id: string } | null)?.id ?? null;
    const referenceId = inquiryId ? `INQ-${inquiryId.slice(0, 8).toUpperCase()}` : undefined;
    const submittedAt = new Date().toISOString();

    // Fire confirmation to customer + notification to internal team.
    // Failures are logged but never block the customer response.
    try {
      const { enqueueTransactionalEmail } = await import("@/lib/email-enqueue.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // Resolve team recipient(s): company_settings.email, else fallback.
      let teamRecipient = "info@nevoindustrial.com";
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: settings } = await (supabaseAdmin as any)
          .from("company_settings")
          .select("email")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const email = settings?.email?.trim();
        if (email) teamRecipient = email;
      } catch (err) {
        console.warn("submitInquiry: company_settings lookup failed", err);
      }

      const siteUrl = process.env.APP_URL || process.env.SITE_URL || "https://nevoindustrial.com";

      const jobs: Array<Promise<unknown>> = [];

      // 1) Customer confirmation
      jobs.push(
        enqueueTransactionalEmail({
          templateName: "inquiry-confirmation",
          recipientEmail: data.email,
          idempotencyKey: inquiryId
            ? `inquiry-confirm-${inquiryId}`
            : `inquiry-confirm-${data.email.toLowerCase()}-${Date.now()}`,
          templateData: {
            name: data.name,
            company: data.company ?? undefined,
            country: data.country ?? undefined,
            application: data.application ?? undefined,
            message: data.message ?? undefined,
            referenceId,
            submittedAt,
          },
        }),
      );

      // 2) Internal team notification
      jobs.push(
        enqueueTransactionalEmail({
          templateName: "inquiry-notification",
          recipientEmail: teamRecipient,
          idempotencyKey: inquiryId
            ? `inquiry-notify-${inquiryId}`
            : `inquiry-notify-${data.email.toLowerCase()}-${Date.now()}`,
          templateData: {
            name: data.name,
            email: data.email,
            phone: data.phone ?? undefined,
            company: data.company ?? undefined,
            country: data.country ?? undefined,
            application: data.application ?? undefined,
            message: data.message ?? undefined,
            sourcePage: data.source_page ?? undefined,
            referenceId,
            submittedAt,
            adminUrl: `${siteUrl}/admin/leads`,
          },
        }),
      );

      const results = await Promise.allSettled(jobs);
      results.forEach((r, i) => {
        const label = i === 0 ? "customer confirmation" : "team notification";
        if (r.status === "rejected") {
          console.error(`submitInquiry: ${label} threw`, r.reason);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const res = r.value as any;
          if (res && res.ok === false) {
            console.warn(`submitInquiry: ${label} not queued`, res.reason, res.message);
          }
        }
      });
    } catch (err) {
      console.error("submitInquiry: email dispatch error", err);
    }

    return { ok: true as const, referenceId };
  });

export const logDownload = createServerFn({ method: "POST" })
  .validator((data: unknown) => DownloadSchema.parse(data))
  .handler(async ({ data }) => {
    const meta = requestMeta();
    const supabase = serverClient();
    const { error } = await supabase.from("download_events").insert({
      document_id: data.document_id,
      document_title: data.document_title ?? null,
      category: data.category ?? null,
      source_page: data.source_page ?? null,
      status: data.status,
      filename: data.filename ?? null,
      duration_ms: data.duration_ms ?? null,
      error_message: data.error_message ?? null,
      ip: meta.ip,
      user_agent: meta.ua,
    });
    if (error) {
      // Log-only — don't block downloads on failure
      return { ok: false as const };
    }
    return { ok: true as const };
  });
