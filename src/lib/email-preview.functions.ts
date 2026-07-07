import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE_NAME = "nevo-industrial-hub";
const SENDER_DOMAIN = "notify.nevoindustrial.com";
const FROM_DOMAIN = "notify.nevoindustrial.com";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Preview data used for auth email templates when rendering internally.
 * Mirrors the samples used by the Lovable auth email preview route so
 * the admin preview matches what test-sends produce.
 */
const SAMPLE_EMAIL = "user@example.test";
const SAMPLE_URL = "https://www.nevoindustrial.com";

const AUTH_SAMPLE_DATA: Record<string, Record<string, string>> = {
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
  /** Default preview data — used to seed the override form on the client. */
  defaultData: Record<string, string | number | boolean | null>;
}

/** List every previewable template (auth + app) with resolved subjects. */
export const listEmailPreviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmailPreviewMeta[]> => {
    await assertAdmin(context);

    const { TEMPLATES } = await import("@/lib/email-templates/registry");

    const authTemplates: EmailPreviewMeta[] = [
      { name: "signup", displayName: "Signup confirmation", category: "auth", subject: "Confirm your email", defaultData: AUTH_SAMPLE_DATA.signup },
      { name: "invite", displayName: "Invitation", category: "auth", subject: "You've been invited", defaultData: AUTH_SAMPLE_DATA.invite },
      { name: "magiclink", displayName: "Magic link", category: "auth", subject: "Your login link", defaultData: AUTH_SAMPLE_DATA.magiclink },
      { name: "recovery", displayName: "Password recovery", category: "auth", subject: "Reset your password", defaultData: AUTH_SAMPLE_DATA.recovery },
      { name: "email_change", displayName: "Email change", category: "auth", subject: "Confirm your new email", defaultData: AUTH_SAMPLE_DATA.email_change },
      { name: "reauthentication", displayName: "Reauthentication", category: "auth", subject: "Your verification code", defaultData: AUTH_SAMPLE_DATA.reauthentication },
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
        defaultData: flattenScalar(previewData),
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

/** Send a real test email of the selected template to a specified address. */
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({
      name: z.string().min(1),
      recipientEmail: z.string().email(),
    }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ success: boolean; messageId: string }> => {
    await assertAdmin(context);

    const React = await import("react");
    const { render } = await import("@react-email/render");
    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    const { createClient } = await import("@supabase/supabase-js");

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error("Server misconfigured");
    const admin = createClient(supabaseUrl, serviceKey);

    const isAuth = !!AUTH_TEMPLATE_LOADERS[data.name];
    let html: string;
    let text: string;
    let subject: string;

    if (isAuth) {
      const Component = await AUTH_TEMPLATE_LOADERS[data.name]!();
      const props = { ...(AUTH_SAMPLE_DATA[data.name] ?? {}), recipient: data.recipientEmail, email: data.recipientEmail };
      const element = React.createElement(Component, props);
      html = await render(element);
      text = await render(element, { plainText: true });
      subject = AUTH_SUBJECTS[data.name] ?? "Notification";
    } else {
      const entry = TEMPLATES[data.name];
      if (!entry) throw new Error(`Unknown template: ${data.name}`);
      const previewData = entry.previewData ?? {};
      const element = React.createElement(entry.component, previewData);
      html = await render(element);
      text = await render(element, { plainText: true });
      subject = typeof entry.subject === "function" ? entry.subject(previewData) : entry.subject;
    }

    const normalizedEmail = data.recipientEmail.toLowerCase();

    // Suppression check
    const { data: suppressed } = await admin
      .from("suppressed_emails")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (suppressed) throw new Error("Recipient is on the suppression list");

    // Get or create unsubscribe token
    let unsubscribeToken: string;
    const { data: existing } = await admin
      .from("email_unsubscribe_tokens")
      .select("token, used_at")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (existing && !existing.used_at) {
      unsubscribeToken = existing.token;
    } else {
      unsubscribeToken = generateToken();
      await admin
        .from("email_unsubscribe_tokens")
        .upsert({ token: unsubscribeToken, email: normalizedEmail }, { onConflict: "email", ignoreDuplicates: true });
      const { data: stored } = await admin
        .from("email_unsubscribe_tokens")
        .select("token")
        .eq("email", normalizedEmail)
        .maybeSingle();
      if (stored?.token) unsubscribeToken = stored.token;
    }

    const messageId = crypto.randomUUID();
    const testSubject = `[TEST] ${subject}`;
    const queueName = isAuth ? "auth_emails" : "transactional_emails";
    const label = isAuth ? `test-${data.name}` : data.name;

    await admin.from("email_send_log").insert({
      message_id: messageId,
      template_name: data.name,
      recipient_email: data.recipientEmail,
      status: "pending",
    });

    const { error: enqueueError } = await admin.rpc("enqueue_email", {
      queue_name: queueName,
      payload: {
        message_id: messageId,
        to: data.recipientEmail,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: testSubject,
        html,
        text,
        purpose: isAuth ? "auth" : "transactional",
        label,
        idempotency_key: messageId,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      await admin.from("email_send_log").insert({
        message_id: messageId,
        template_name: data.name,
        recipient_email: data.recipientEmail,
        status: "failed",
        error_message: enqueueError.message,
      });
      throw new Error(`Failed to enqueue: ${enqueueError.message}`);
    }

    return { success: true, messageId };
  });
