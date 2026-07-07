import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { resolveLandingRoute } from "@/lib/role-landing";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Sign in — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const to = await resolveLandingRoute(data.user.id);
        navigate({ to });
      }
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (resetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setInfo("If that email is registered, a reset link has been sent.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const to = data.user ? await resolveLandingRoute(data.user.id) : "/admin";
        navigate({ to });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
      // Fire-and-forget: report failed sign-in so the backend can log and,
      // if this email crosses the threshold, page the security recipient.
      if (!resetMode && email) {
        try {
          void fetch("/api/public/alerts/sign-in-failed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, reason: message }),
            keepalive: true,
          });
        } catch {
          /* ignore — best-effort */
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 border border-border rounded-lg p-6 bg-card shadow-sm"
      >
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-xs uppercase tracking-widest font-semibold">NEVO Back Office</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold">{resetMode ? "Reset password" : "Sign in"}</h1>
          <p className="text-sm text-muted-foreground">
            Internal access only. Accounts are created by invitation from a Super Admin.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        {!resetMode && (
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {info && <p className="text-sm text-muted-foreground">{info}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Please wait…" : resetMode ? "Send reset link" : "Sign in"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setResetMode(!resetMode);
            setError(null);
            setInfo(null);
          }}
          className="text-xs text-muted-foreground hover:text-foreground underline block w-full text-center"
        >
          {resetMode ? "Back to sign in" : "Forgot your password?"}
        </button>
        <p className="text-[11px] text-muted-foreground text-center border-t border-border pt-3">
          Not a NEVO team member? This portal is not open to the public.
        </p>
      </form>
    </div>
  );
}
