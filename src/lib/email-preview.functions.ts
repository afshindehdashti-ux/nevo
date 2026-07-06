import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Preview data used for auth email templates when rendering internally.
 * Mirrors the samples used by the Lovable auth email preview route so
 * the admin preview matches what test-sends produce.
 */
const SAMPLE_EMAIL = "user@example.test";
const SAMPLE_URL = "https://www.nevoindustrial.com";

const AUTH_SAMPLE_DATA: Record<string, Record<string, unknown>> = {
  signup: {
    siteName: "NEVO Industrial",
    siteUrl: SAMPLE_URL,
    recipient: SAMPLE_EMAIL,
    confirmationUrl: `${SAMPLE_URL}/auth/confirm?token=example`,
  },
  magiclink: {
    siteName: "NEVO Industrial",
    confirmationUrl: `${SAMPLE_URL}/auth/magic?token=example`,
  },
  recovery: {
    siteName: "NEVO Industrial",
    confirmationUrl: `${SAMPLE_URL}/reset-password?token=example`,
  },
  invite: {
    siteName: "NEVO Industrial",
    siteUrl: SAMPLE_URL,
    confirmationUrl: `${SAMPLE_URL}/auth/invite?token=example`,
  },
  email_change: {
    siteName: "NEVO Industrial",
    oldEmail: SAMPLE_EMAIL,
    email: SAMPLE_EMAIL,
    newEmail: "new-user@example.test",
    confirmationUrl: `${SAMPLE_URL}/auth/email-change?token=example`,
  },
  reauthentication: { token: "123456" },
};

export interface EmailPreviewMeta {
  name: string;
  displayName: string;
  category: "auth" | "app";
  subject: string;
}

/** List every previewable template (auth + app) with resolved subjects. */
export const listEmailPreviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmailPreviewMeta[]> => {
    await assertAdmin(context);

    const { TEMPLATES } = await import("@/lib/email-templates/registry");

    const authTemplates: EmailPreviewMeta[] = [
      { name: "signup", displayName: "Signup confirmation", category: "auth", subject: "Confirm your email" },
      { name: "invite", displayName: "Invitation", category: "auth", subject: "You've been invited" },
      { name: "magiclink", displayName: "Magic link", category: "auth", subject: "Your login link" },
      { name: "recovery", displayName: "Password recovery", category: "auth", subject: "Reset your password" },
      { name: "email_change", displayName: "Email change", category: "auth", subject: "Confirm your new email" },
      { name: "reauthentication", displayName: "Reauthentication", category: "auth", subject: "Your verification code" },
    ];

    const appTemplates: EmailPreviewMeta[] = Object.entries(TEMPLATES).map(([name, entry]) => {
      const previewData = entry.previewData ?? {};
      const subject =
        typeof entry.subject === "function" ? entry.subject(previewData) : entry.subject;
      return {
        name,
        displayName: entry.displayName ?? name,
        category: "app" as const,
        subject,
      };
    });

    return [...authTemplates, ...appTemplates];
  });

/** Render a single template to HTML using its sample/preview data. */
export const renderEmailPreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ name: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ html: string; subject: string }> => {
    await assertAdmin(context);

    const React = await import("react");
    const { render } = await import("@react-email/render");
    const { TEMPLATES } = await import("@/lib/email-templates/registry");

    // Auth templates
    if (data.name in AUTH_SAMPLE_DATA || AUTH_TEMPLATE_LOADERS[data.name]) {
      const load = AUTH_TEMPLATE_LOADERS[data.name];
      if (!load) throw new Error(`Unknown auth template: ${data.name}`);
      const Component = await load();
      const props = AUTH_SAMPLE_DATA[data.name] ?? {};
      const html = await render(React.createElement(Component, props));
      return { html, subject: AUTH_SUBJECTS[data.name] ?? "Notification" };
    }

    const entry = TEMPLATES[data.name];
    if (!entry) throw new Error(`Unknown template: ${data.name}`);
    const previewData = entry.previewData ?? {};
    const html = await render(React.createElement(entry.component, previewData));
    const subject =
      typeof entry.subject === "function" ? entry.subject(previewData) : entry.subject;
    return { html, subject };
  });

const AUTH_TEMPLATE_LOADERS: Record<string, () => Promise<React.ComponentType<any>>> = {
  signup: async () => (await import("@/lib/email-templates/signup")).SignupEmail,
  invite: async () => (await import("@/lib/email-templates/invite")).InviteEmail,
  magiclink: async () => (await import("@/lib/email-templates/magic-link")).MagicLinkEmail,
  recovery: async () => (await import("@/lib/email-templates/recovery")).RecoveryEmail,
  email_change: async () => (await import("@/lib/email-templates/email-change")).EmailChangeEmail,
  reauthentication: async () =>
    (await import("@/lib/email-templates/reauthentication")).ReauthenticationEmail,
};

const AUTH_SUBJECTS: Record<string, string> = {
  signup: "Confirm your email",
  invite: "You've been invited",
  magiclink: "Your login link",
  recovery: "Reset your password",
  email_change: "Confirm your new email",
  reauthentication: "Your verification code",
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden");
}
