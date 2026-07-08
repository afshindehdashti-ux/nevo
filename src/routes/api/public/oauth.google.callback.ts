import { createFileRoute } from "@tanstack/react-router";
import { withMethodGuards } from "@/lib/api-http";

// Google OAuth 2.0 callback for the Mailbox Gmail flow.
// Public route: the state nonce (created and stored by an authenticated
// super_admin via startGmailOAuth) is the CSRF protection. We look up the
// mailbox connection by state, exchange the code for tokens using the stored
// client id/secret, persist the refresh_token, and redirect back to the
// settings page.

function redirectBack(origin: string, status: "ok" | "error", reason?: string) {
  const url = new URL("/admin/mails/settings", origin);
  url.searchParams.set("gmail", status);
  if (reason) url.searchParams.set("reason", reason.slice(0, 300));
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

export const Route = createFileRoute("/api/public/oauth/google/callback")({
  server: {
    handlers: withMethodGuards({
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = url.origin;
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error");
        if (err) return redirectBack(origin, "error", err);
        if (!code || !state) return redirectBack(origin, "error", "missing_code_or_state");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: row, error: findErr } = await supabaseAdmin
          .from("mailbox_connections")
          .select("*")
          .eq("gmail_oauth_state" as any, state)
          .maybeSingle();
        if (findErr || !row) return redirectBack(origin, "error", "invalid_state");

        const r: any = row;
        const redirectUri = r.gmail_redirect_uri || `${origin}/api/public/oauth/google/callback`;

        try {
          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              code,
              client_id: r.gmail_client_id,
              client_secret: r.gmail_client_secret,
              redirect_uri: redirectUri,
              grant_type: "authorization_code",
            }),
          });
          const tokenJson: any = await tokenRes.json();
          if (!tokenRes.ok) {
            const msg = tokenJson?.error_description || tokenJson?.error || `token_exchange_${tokenRes.status}`;
            await supabaseAdmin
              .from("mailbox_connections")
              .update({
                gmail_oauth_state: null,
                last_test_ok: false,
                last_test_error: msg,
                last_test_at: new Date().toISOString(),
              } as any)
              .eq("id", r.id);
            return redirectBack(origin, "error", msg);
          }

          // Fetch authorized email
          let authorizedEmail: string | null = null;
          try {
            const uiRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
              headers: { Authorization: `Bearer ${tokenJson.access_token}` },
            });
            if (uiRes.ok) {
              const ui: any = await uiRes.json();
              authorizedEmail = ui?.email ?? null;
            }
          } catch {}

          const expiresAt = tokenJson.expires_in
            ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000).toISOString()
            : null;

          const update: any = {
            gmail_access_token: tokenJson.access_token ?? null,
            gmail_token_expires_at: expiresAt,
            gmail_scope: tokenJson.scope ?? null,
            gmail_authorized_email: authorizedEmail,
            gmail_oauth_state: null,
            last_test_ok: true,
            last_test_error: null,
            last_test_at: new Date().toISOString(),
          };
          // refresh_token only returned on first consent — preserve existing if absent
          if (tokenJson.refresh_token) update.gmail_refresh_token = tokenJson.refresh_token;

          const { error: upErr } = await supabaseAdmin
            .from("mailbox_connections")
            .update(update)
            .eq("id", r.id);
          if (upErr) return redirectBack(origin, "error", upErr.message);

          return redirectBack(origin, "ok");
        } catch (e: any) {
          return redirectBack(origin, "error", e?.message ?? "callback_failed");
        }
      },
    }),
  },
});
