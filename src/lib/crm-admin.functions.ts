import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

async function sendWelcomeEmail(params: {
  recipientEmail: string;
  fullName: string;
  role: string;
  invitedBy?: string | null;
  userId: string;
}) {
  try {
    const req = getRequest();
    const authHeader = req?.headers.get("authorization") ?? req?.headers.get("Authorization");
    const host = req?.headers.get("host");
    const proto = req?.headers.get("x-forwarded-proto") ?? "https";
    if (!authHeader || !host) return;
    const siteUrl = process.env.APP_URL || process.env.SITE_URL || "https://nevoindustrial.com";
    const res = await fetch(`${proto}://${host}/lovable/email/transactional/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        templateName: "welcome",
        recipientEmail: params.recipientEmail,
        idempotencyKey: `welcome-${params.userId}`,
        templateData: {
          fullName: params.fullName,
          role: params.role,
          invitedBy: params.invitedBy ?? undefined,
          loginUrl: `${siteUrl}/admin/login`,
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`welcome email send failed [${res.status}]: ${body}`);
    }
  } catch (err) {
    console.error("welcome email send error", err);
  }
}


const inviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(200),
  jobTitle: z.string().max(200).optional().nullable(),
  role: z.enum(["super_admin", "management", "sales", "operations", "finance", "read_only"]),
});

const resetSchema = z.object({ email: z.string().email() });

async function assertSuperAdmin(ctx: { supabase: SupabaseClient<Database>; userId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (ctx.supabase as any).rpc("has_role", {
    _user_id: ctx.userId,
    _role: "super_admin" as AppRole,
  });
  if (error) throw new Error("Permission check failed");
  if (!data) throw new Error("Forbidden: super admin only");
}

export const inviteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => inviteSchema.parse(raw))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const siteUrl = process.env.APP_URL || process.env.SITE_URL || "https://nevoindustrial.com";

    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: `${siteUrl}/admin/login`,
      data: { full_name: data.fullName, job_title: data.jobTitle ?? null },
    });
    if (error) throw new Error(error.message);
    const userId = invited.user?.id;
    if (!userId) throw new Error("Invite created but no user id returned");

    // Ensure profile fields
    await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        full_name: data.fullName,
        job_title: data.jobTitle ?? null,
        is_active: true,
      },
      { onConflict: "id" },
    );

    // Replace roles with the requested one
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (roleErr) throw new Error(roleErr.message);

    await supabaseAdmin.from("activity_logs").insert({
      user_id: context.userId,
      action: "user_invited",
      entity_type: "auth_user",
      entity_id: userId,
      metadata: { email: data.email, role: data.role },
    });

    // Look up the inviter's display name for the welcome email
    let invitedBy: string | null = null;
    const { data: inviter } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();
    invitedBy = inviter?.full_name ?? null;

    // Fire-and-forget welcome email (does not block the invite response)
    await sendWelcomeEmail({
      recipientEmail: data.email,
      fullName: data.fullName,
      role: data.role,
      invitedBy,
      userId,
    });

    return { ok: true, userId };
  });

export const sendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => resetSchema.parse(raw))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const siteUrl = process.env.APP_URL || process.env.SITE_URL || "https://nevoindustrial.com";
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${siteUrl}/admin/login`,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
