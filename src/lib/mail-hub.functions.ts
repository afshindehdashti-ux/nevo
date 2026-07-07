import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

async function ensureAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["super_admin", "management"])
    .maybeSingle();
  if (error) throw new Error("Role check failed: " + error.message);
  if (!data) throw new Error("Forbidden: super_admin or management role required");
}

// ============ LOG DASHBOARD ============

export type EmailLogFilters = {
  from?: string;
  to?: string;
  template?: string | null;
  status?: "all" | "sent" | "failed" | "suppressed" | "pending" | "dlq";
  search?: string | null;
  limit?: number;
  offset?: number;
};

export const listEmailLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: EmailLogFilters | undefined) => data ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    const now = Date.now();
    const fromIso = data.from ? new Date(data.from).toISOString() : new Date(now - 7 * 86400_000).toISOString();
    const toIso = data.to ? new Date(data.to).toISOString() : new Date(now).toISOString();
    const limit = Math.min(Math.max(data.limit ?? 50, 1), 200);
    const offset = Math.max(data.offset ?? 0, 0);

    // Pull broad set then dedup in JS by message_id (latest per id).
    let q = supabase
      .from("email_send_log")
      .select("id, message_id, template_name, recipient_email, status, error_message, metadata, created_at")
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (data.template) q = q.eq("template_name", data.template);
    if (data.search) q = q.ilike("recipient_email", `%${data.search}%`);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const dedupMap = new Map<string, typeof rows[number]>();
    for (const r of rows ?? []) {
      const key = r.message_id ?? String(r.id);
      if (!dedupMap.has(key)) dedupMap.set(key, r);
    }
    let deduped = Array.from(dedupMap.values());

    if (data.status && data.status !== "all") {
      if (data.status === "failed") {
        deduped = deduped.filter((r) => r.status === "failed" || r.status === "dlq" || r.status === "bounced");
      } else {
        deduped = deduped.filter((r) => r.status === data.status);
      }
    }

    const total = deduped.length;
    const sent = deduped.filter((r) => r.status === "sent").length;
    const failed = deduped.filter((r) => r.status === "failed" || r.status === "dlq" || r.status === "bounced").length;
    const suppressed = deduped.filter((r) => r.status === "suppressed").length;
    const pending = deduped.filter((r) => r.status === "pending").length;

    const page = deduped.slice(offset, offset + limit);

    // Distinct templates from the raw window (for filter dropdown)
    const templates = Array.from(new Set((rows ?? []).map((r) => r.template_name).filter(Boolean))) as string[];

    return {
      rows: page,
      total,
      stats: { total, sent, failed, suppressed, pending },
      templates,
      range: { from: fromIso, to: toIso },
    };
  });

export const listSuppressed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("suppressed_emails")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

export const removeSuppression = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("suppressed_emails")
      .delete()
      .eq("email", data.email.toLowerCase());
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ RECIPIENT SEARCH ============

export const searchRecipients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const q = data.q.trim();
    if (!q) return { results: [] };
    const like = `%${q}%`;

    type R = { source: string; label: string; email: string; sublabel?: string };
    const out: R[] = [];

    const [customersR, contactsR, leadsR, partnersR] = await Promise.all([
      context.supabase.from("customers").select("id, name, email").or(`name.ilike.${like},email.ilike.${like}`).limit(10),
      context.supabase.from("contacts").select("id, full_name, email, customer_id").or(`full_name.ilike.${like},email.ilike.${like}`).limit(10),
      context.supabase.from("leads").select("id, name, email").or(`name.ilike.${like},email.ilike.${like}`).limit(10),
      context.supabase.from("partners").select("id, company_name, contact_email").or(`company_name.ilike.${like},contact_email.ilike.${like}`).limit(10),
    ]);

    for (const c of customersR.data ?? []) {
      if (c.email) out.push({ source: "customer", label: c.name ?? c.email, email: c.email });
    }
    for (const c of contactsR.data ?? []) {
      if (c.email) out.push({ source: "contact", label: c.full_name ?? c.email, email: c.email });
    }
    for (const l of leadsR.data ?? []) {
      if (l.email) out.push({ source: "lead", label: l.name ?? l.email, email: l.email });
    }
    for (const p of partnersR.data ?? []) {
      if (p.contact_email) out.push({ source: "partner", label: p.company_name ?? p.contact_email, email: p.contact_email });
    }
    return { results: out };
  });

// ============ TEMPLATE METADATA ============

export const listEmailTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    return {
      templates: Object.entries(TEMPLATES).map(([name, t]) => ({
        name,
        displayName: t.displayName ?? name,
        previewData: t.previewData ?? {},
        fixedRecipient: t.to ?? null,
      })),
    };
  });
