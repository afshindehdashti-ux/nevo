import { createFileRoute } from "@tanstack/react-router";
import { withMethodGuards } from "@/lib/api-http";
import { timingSafeEqualText } from "@/lib/api-security";
import {
  assertAllowedOrigin,
  assertRateLimit,
  corsHeaders,
  jsonError,
  timingSafeEqualText,
} from "@/lib/api-security";
import { z } from "zod";

/**
 * Self-disabling bootstrap endpoint for the very first Super Admin.
 *
 * Callable only while there are ZERO super_admin rows in user_roles and only
 * with the one-time NEVO_BOOTSTRAP_TOKEN. Once a Super Admin exists, this
 * endpoint returns 409 forever. After bootstrap, ongoing invites go through
 * the authenticated `inviteTeamMember` server function (Super Admin only).
 */
const schema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1).max(200),
});

function hasValidBootstrapToken(request: Request): boolean {
  const expected = process.env.NEVO_BOOTSTRAP_TOKEN;
  if (!expected) return false;
  const provided = request.headers.get("x-bootstrap-token") ?? "";
  return timingSafeEqualText(provided, expected);
}

export const Route = createFileRoute("/api/public/bootstrap-super-admin")({
  server: {
    handlers: withMethodGuards({
      OPTIONS: async ({ request }) => {
        const headers = corsHeaders(request);
        const blocked = assertAllowedOrigin(request, headers);
        if (blocked) return blocked;
        return new Response(null, { status: 204, headers });
      },
      POST: async ({ request }) => {
        const headers = corsHeaders(request);
        const blocked = assertAllowedOrigin(request, headers);
        if (blocked) return blocked;
        const limited = assertRateLimit(request, "bootstrap-super-admin", {
          limit: 3,
          windowMs: 10 * 60_000,
        });
        if (limited) return limited;

        if (!process.env.NEVO_BOOTSTRAP_TOKEN)
          return jsonError(503, "bootstrap_not_configured", undefined, headers);
        if (!hasValidBootstrapToken(request))
          return jsonError(401, "invalid_bootstrap_token", undefined, headers);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonError(400, "invalid_json", undefined, headers);
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success)
          return jsonError(400, "validation_failed", { details: parsed.error.flatten() }, headers);
        const { email, full_name } = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { count, error: countErr } = await supabaseAdmin
          .from("user_roles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "super_admin");
        if (countErr) {
          console.error("bootstrap-super-admin: role check failed", countErr);
          return jsonError(500, "bootstrap_check_failed", undefined, headers);
        }
        if ((count ?? 0) > 0) return jsonError(409, "bootstrap_disabled", undefined, headers);

        const siteUrl = process.env.APP_URL || process.env.SITE_URL || "https://nevoindustrial.com";

        let userId: string | null = null;
        const { data: invited, error: inviteErr } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${siteUrl}/admin/login`,
            data: { full_name },
          });
        if (inviteErr) {
          const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 200,
          });
          if (listErr) return jsonError(500, "user_lookup_failed", undefined, headers);
          const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
          if (!found) return jsonError(500, "invite_failed", undefined, headers);
          userId = found.id;
        } else {
          userId = invited.user?.id ?? null;
        }
        if (!userId) return jsonError(500, "user_id_not_resolved", undefined, headers);

        await supabaseAdmin
          .from("profiles")
          .upsert({ id: userId, full_name, is_active: true }, { onConflict: "id" });

        const { error: roleErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: "super_admin" });
        if (roleErr && !roleErr.message.includes("duplicate"))
          return jsonError(500, "role_grant_failed", undefined, headers);

        await supabaseAdmin.from("activity_logs").insert({
          user_id: userId,
          action: "bootstrap_super_admin",
          entity_type: "auth_user",
          entity_id: userId,
          metadata: { email, via: "bootstrap-endpoint" },
        });

        return Response.json({ ok: true, userId, email }, { headers });
      },
    }),
  },
});
