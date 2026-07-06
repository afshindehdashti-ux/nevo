import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const LeadInput = z.object({
  full_name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().max(200).nullable().optional(),
  phone: z.string().max(60).nullable().optional(),
  country: z.string().max(120).nullable().optional(),
  project_type: z.string().max(200).nullable().optional(),
  message: z.string().max(4000).nullable().optional(),
  session_id: z.string().max(120).nullable().optional(),
});

/**
 * Public endpoint (no auth) — accepts a lead captured by the NEVO AI Engineer
 * chat when a visitor shows buying intent. Creates a project_inquiries row.
 */
export const submitAssistantLead = createServerFn({ method: "POST" })
  .inputValidator((v) => LeadInput.parse(v))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Supabase not configured");

    const supabase = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data: row, error } = await supabase
      .from("project_inquiries")
      .insert({
        full_name: data.full_name,
        email: data.email,
        company: data.company ?? null,
        phone: data.phone ?? null,
        country: data.country ?? null,
        project_type: data.project_type ?? null,
        message: data.message ?? null,
        source: "ai_assistant",
        status: "new",
        metadata: data.session_id ? { session_id: data.session_id } : {},
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (data.session_id) {
      await supabase
        .from("ai_assistant_conversations")
        .update({ lead_captured: true, inquiry_id: row?.id ?? null })
        .eq("session_id", data.session_id);
    }
    return { id: row?.id ?? null };
  });
