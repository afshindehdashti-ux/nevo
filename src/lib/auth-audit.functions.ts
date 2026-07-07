import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Records an admin sign-in event to `activity_logs` with the caller's IP address
 * and user agent, captured server-side from the request. Called once per session
 * from the admin layout after the client establishes a session.
 */
export const logAdminSignIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const req = getRequest();
    const h = req?.headers;

    // Best-effort client IP: honor common proxy headers, fall back to socket peer.
    const rawFwd =
      h?.get("cf-connecting-ip") ||
      h?.get("x-real-ip") ||
      h?.get("x-forwarded-for") ||
      "";
    const ip = rawFwd.split(",")[0]?.trim() || null;
    const userAgent = h?.get("user-agent") || null;
    const country =
      h?.get("cf-ipcountry") || h?.get("x-vercel-ip-country") || null;

    // Update last_login_at on the profile (best-effort).
    await context.supabase
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nowIso = new Date().toISOString();
    const { error } = await supabaseAdmin.from("activity_logs").insert({
      user_id: context.userId,
      action: "sign_in",
      entity_type: "auth",
      entity_id: context.userId,
      metadata: {
        ip,
        user_agent: userAgent,
        country,
        at: nowIso,
      },
    });
    if (error) throw new Error(error.message);

    // New-country detection: alert if this country hasn't been seen for this
    // user before. Best-effort; failures are logged and do not block sign-in.
    if (country) {
      try {
        const { data: prior } = await supabaseAdmin
          .from("activity_logs")
          .select("id, metadata, created_at")
          .eq("user_id", context.userId)
          .eq("action", "sign_in")
          .eq("entity_type", "auth")
          .order("created_at", { ascending: false })
          .limit(200);
        const rows = (prior ?? []) as Array<{
          metadata: Record<string, unknown> | null;
          created_at: string;
        }>;
        const priorCountries = new Set(
          rows
            .slice(1) // exclude the row we just inserted
            .map((r) => (r.metadata?.country as string | null | undefined) ?? null)
            .filter((v): v is string => !!v),
        );
        const hasPriorSignIns = rows.length > 1;
        if (hasPriorSignIns && !priorCountries.has(country)) {
          const { enqueueSecurityAlert } = await import("@/lib/security-alerts.server");
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("full_name")
            .eq("id", context.userId)
            .maybeSingle();
          const name =
            (profile as { full_name?: string | null } | null)?.full_name ??
            context.userId;
          void enqueueSecurityAlert({
            kind: "new_country_sign_in",
            dedupKey: `new-country:${context.userId}:${country}`,
            dedupWindowMinutes: 24 * 60,
            userId: context.userId,
            headline: `${name} signed in from a new country: ${country}`,
            summary:
              "A back-office user just signed in from a country they haven't used before. " +
              "Confirm this is expected — if not, revoke sessions and reset credentials.",
            details: [
              { label: "User", value: String(name) },
              { label: "Country", value: country },
              { label: "IP", value: ip ?? "unknown" },
              {
                label: "Previously seen countries",
                value: [...priorCountries].join(", ") || "none",
              },
            ],
          });
        }
      } catch (err) {
        console.warn("new-country alert check failed", err);
      }
    }

    return { ok: true, ip, country };
  });

export type SignInEvent = {
  id: string;
  at: string;
  ip: string | null;
  user_agent: string | null;
  country: string | null;
};

/**
 * Returns the current user's recent admin sign-in events (from activity_logs).
 * Ordered most-recent first. Limited to 10 rows.
 */
export const getMySignInHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SignInEvent[]> => {
    const { data, error } = await context.supabase
      .from("activity_logs")
      .select("id, created_at, metadata")
      .eq("user_id", context.userId)
      .eq("action", "sign_in")
      .eq("entity_type", "auth")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => {
      const md = (r.metadata ?? {}) as Record<string, unknown>;
      return {
        id: r.id as string,
        at: (md.at as string) || (r.created_at as string),
        ip: (md.ip as string | null) ?? null,
        user_agent: (md.user_agent as string | null) ?? null,
        country: (md.country as string | null) ?? null,
      };
    });
  });
