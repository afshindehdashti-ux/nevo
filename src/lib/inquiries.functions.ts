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
  calculator_state: z.unknown().optional().nullable(),
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
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
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
  .inputValidator((data: unknown) => InquirySchema.parse(data))
  .handler(async ({ data }) => {
    // Honeypot: silently succeed to fool bots.
    if (data.website && data.website.length > 0) {
      return { ok: true as const };
    }
    const meta = requestMeta();
    const supabase = serverClient();
    const { error } = await supabase.from("project_inquiries").insert({
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
    });
    if (error) {
      // Don't leak DB details to the client
      throw new Error("Failed to submit inquiry");
    }
    return { ok: true as const };
  });

export const logDownload = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DownloadSchema.parse(data))
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
