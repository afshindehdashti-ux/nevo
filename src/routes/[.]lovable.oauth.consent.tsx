import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

// Beta helpers on supabase.auth.oauth are not yet in the SDK types.
interface AuthorizationDetails {
  redirect_url?: string;
  redirect_to?: string;
  client?: { name?: string; redirect_uri?: string } | null;
  scope?: string;
}
interface AuthOAuth {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
}
const authOAuth = (supabase.auth as unknown as { oauth: AuthOAuth }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // Browser-only: the Supabase client reads its session from localStorage,
  // which is absent on the SSR pass.
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await authOAuth.getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md space-y-2">
        <h1 className="text-lg font-semibold">Authorization error</h1>
        <p className="text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await authOAuth.approveAuthorization(authorization_id)
      : await authOAuth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "an external app";

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md border border-border rounded-lg p-6 bg-card shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-xs uppercase tracking-widest font-semibold">
            NEVO Agent Integration
          </span>
        </div>
        <div>
          <h1 className="text-xl font-semibold">Connect {clientName} to NEVO</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clientName} will be able to call this app's enabled tools while you are signed in. This
            does not bypass NEVO's permissions or backend policies.
          </p>
        </div>
        {details?.scope && (
          <p className="text-xs text-muted-foreground">
            Requested access: <code>{details.scope}</code>
          </p>
        )}
        {details?.client?.redirect_uri && (
          <p className="text-xs text-muted-foreground break-all">
            Redirect: <code>{details.client.redirect_uri}</code>
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
            {busy ? "Please wait…" : "Approve"}
          </Button>
          <Button
            disabled={busy}
            onClick={() => decide(false)}
            variant="outline"
            className="flex-1"
          >
            Cancel connection
          </Button>
        </div>
      </div>
    </main>
  );
}
