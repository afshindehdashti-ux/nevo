import { createFileRoute } from "@tanstack/react-router";
import { withMethodGuards } from "@/lib/api-http";
import { timingSafeEqualText } from "@/lib/api-security";
import { z } from "zod";

/**
 * Self-disabling bootstrap endpoint for the very first Super Admin.
 *
 * Callable only while there are ZERO super_admin rows in user_roles and a
 * server-only BOOTSTRAP_SUPER_ADMIN_TOKEN is configured and supplied.
 * Once a Super Admin exists, this endpoint returns 409 forever.
 * After bootstrap, ongoing invites go through the authenticated
 * `inviteTeamMember` server function (Super Admin only).
 */
const schema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1).max(200),
});

export const Route = createFileRoute("/api/public/bootstrap-super-admin")({
  server: {
    handlers: withMethodGuards({
      POST: async ({ request }) => {
        const bootstrapToken = process.env.BOOTSTRAP_SUPER_ADMIN_TOKEN;
        if (!bootstrapToken) {
          return new Response("Bootstrap is disabled. Configure BOOTSTRAP_SUPER_ADMIN_TOKEN.", {
            status: 503,
          });
        }
        if (!timingSafeEqualText(request.headers.get("x-bootstrap-token") ?? "", bootstrapToken)) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return new Response("Invalid input", { status: 400 });
        }
        const { email, full_name } = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Gate: refuse if any super_admin already exists.
        const { count, error: countErr } = await supabaseAdmin
          .from("user_roles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "super_admin");
        if (countErr) {
          return new Response(`Check failed: ${countErr.message}`, { status: 500 });
        }
        if ((count ?? 0) > 0) {
          return new Response("A Super Admin already exists. Bootstrap disabled.", {
            status: 409,
          });
        }

        const siteUrl = process.env.APP_URL || process.env.SITE_URL || "https://nevoindustrial.com";

        // If the auth user already exists, look them up; otherwise invite.
        let userId: string | null = null;
        const { data: invited, error: inviteErr } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${siteUrl}/admin/login`,
            data: { full_name },
          });
        if (inviteErr) {
          // If the user already exists, fetch id via listUsers filter.
          const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 200,
          });
          if (listErr) {
            return new Response(`Lookup failed: ${listErr.message}`, { status: 500 });
          }
          const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
          if (!found) {
            return new Response(`Invite failed: ${inviteErr.message}`, { status: 500 });
          }
          userId = found.id;
        } else {
          userId = invited.user?.id ?? null;
        }
        if (!userId) return new Response("No user id resolved", { status: 500 });

        await supabaseAdmin
          .from("profiles")
          .upsert({ id: userId, full_name, is_active: true }, { onConflict: "id" });

        const { error: roleErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: "super_admin" });
        if (roleErr && !roleErr.message.includes("duplicate")) {
          return new Response(`Role grant failed: ${roleErr.message}`, { status: 500 });
        }

        await supabaseAdmin.from("activity_logs").insert({
          user_id: userId,
          action: "bootstrap_super_admin",
          entity_type: "auth_user",
          entity_id: userId,
          metadata: { email, via: "bootstrap-endpoint" },
        });

        return Response.json({ ok: true, userId, email });
      },
    }),
  },
});
