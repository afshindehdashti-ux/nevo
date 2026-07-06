import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type LogoEventFilters = {
  from?: string; // ISO
  to?: string; // ISO
  eventType?: "all" | "render" | "error";
  variant?: string | null;
  minWidth?: number | null;
  maxWidth?: number | null;
  bucket?: "minute" | "hour" | "day";
};

async function ensureAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Role check failed");
  if (!data) throw new Error("Forbidden: admin role required");
}

function normalize(input: unknown): Required<LogoEventFilters> {
  const i = (input && typeof input === "object" ? input : {}) as LogoEventFilters;
  const now = Date.now();
  const to = i.to ? new Date(i.to).toISOString() : new Date(now).toISOString();
  const from = i.from
    ? new Date(i.from).toISOString()
    : new Date(now - 24 * 60 * 60 * 1000).toISOString();
  return {
    from,
    to,
    eventType: i.eventType === "render" || i.eventType === "error" ? i.eventType : "all",
    variant: typeof i.variant === "string" && i.variant.length > 0 ? i.variant : null,
    minWidth: typeof i.minWidth === "number" ? i.minWidth : null,
    maxWidth: typeof i.maxWidth === "number" ? i.maxWidth : null,
    bucket: i.bucket === "minute" || i.bucket === "day" ? i.bucket : "hour",
  };
}

export const getLogoEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: LogoEventFilters | undefined) => data ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const f = normalize(data);

    let q = supabase
      .from("header_logo_events")
      .select(
        "id, event_type, variant, stage, device_width, dpr, correlation_id, sample_rate, src, next_src, natural_width, natural_height, online, route, url, ua, release, ip, client_ts, created_at",
      )
      .gte("created_at", f.from)
      .lte("created_at", f.to)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (f.eventType !== "all") q = q.eq("event_type", f.eventType);
    if (f.variant) q = q.eq("variant", f.variant);
    if (f.minWidth != null) q = q.gte("device_width", f.minWidth);
    if (f.maxWidth != null) q = q.lte("device_width", f.maxWidth);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Distinct variants for filter dropdown (within the same window)
    const variants = Array.from(
      new Set((rows ?? []).map((r) => r.variant).filter(Boolean)),
    ) as string[];

    return {
      filters: f,
      rows: rows ?? [],
      variants,
    };
  });

export const isCurrentUserAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) return { admin: false };
    return { admin: !!data };
  });
