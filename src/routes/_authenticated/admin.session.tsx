import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useMyRoles, useMyProfile, type AppRole } from "@/lib/crm-hooks";
import { getMySignInHistory } from "@/lib/auth-audit.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Mail,
  LogOut,
  RefreshCw,
  Globe,
  Monitor,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/session")({
  head: () => ({
    meta: [
      { title: "Session status — NEVO CRM" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SessionStatusPage,
});

const ROLE_LABEL: Partial<Record<AppRole, string>> = {
  super_admin: "Super Admin",
  management: "Management",
  sales: "Sales",
  operations: "Operations",
  finance: "Finance",
  read_only: "Read Only",
  admin: "Admin",
  moderator: "Moderator",
  user: "User",
};

const ROLE_TONE: Partial<Record<AppRole, string>> = {
  super_admin: "bg-primary/10 text-accent border-primary/30",
  management: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  sales: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  operations: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  finance: "bg-purple-500/10 text-purple-700 border-purple-500/30",
  read_only: "bg-muted text-muted-foreground border-border",
  admin: "bg-primary/10 text-accent border-primary/30",
  moderator: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  user: "bg-muted text-muted-foreground border-border",
};


function fmt(ts?: string | number | null): string {
  if (!ts) return "—";
  try {
    const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
    return d.toLocaleString();
  } catch {
    return String(ts);
  }
}

function SessionStatusPage() {
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: roles, isLoading: rolesLoading, refetch: refetchRoles } = useMyRoles();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const [sessionInfo, setSessionInfo] = useState<{
    expires_at: number | null;
    provider: string | null;
    last_sign_in_at: string | null;
    created_at: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const s = data.session;
      setSessionInfo({
        expires_at: s?.expires_at ?? null,
        provider: s?.user.app_metadata?.provider ?? null,
        last_sign_in_at: s?.user.last_sign_in_at ?? null,
        created_at: s?.user.created_at ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const {
    data: history,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["crm", "sign-in-history", user?.id],
    enabled: !!user?.id,
    queryFn: () => getMySignInHistory(),
    staleTime: 30_000,
  });

  const mine: AppRole[] = roles ?? [];
  const isSuper = mine.includes("super_admin");
  const isAdminTier = isSuper || mine.includes("management");
  const loading = userLoading || rolesLoading || profileLoading;
  const currentEvent = history?.[0] ?? null;

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true } as any);
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Session status</h1>
          <p className="text-sm text-muted-foreground">
            Confirms your identity, role, and active session after sign-in.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { refetchRoles(); refetchHistory(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Status banner */}
      <Card
        className={
          isSuper
            ? "border-primary/40 bg-primary/5"
            : isAdminTier
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-border"
        }
      >
        <CardContent className="p-4 flex items-center gap-3">
          {loading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : isSuper ? (
            <ShieldCheck className="h-8 w-8 text-accent" />
          ) : isAdminTier ? (
            <ShieldCheck className="h-8 w-8 text-amber-600" />
          ) : mine.length > 0 ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          ) : (
            <ShieldAlert className="h-8 w-8 text-destructive" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {loading
                ? "Checking your session…"
                : isSuper
                  ? "Signed in as Super Admin"
                  : isAdminTier
                    ? "Signed in with administrative access"
                    : mine.length > 0
                      ? "Signed in with limited access"
                      : "Signed in — no role assigned"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email ?? "—"} · session active
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>Signed-in user identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Full name" value={profile?.full_name ?? "—"} />
            <Row
              label="Email"
              value={
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {user?.email ?? "—"}
                </span>
              }
            />
            <Row label="Job title" value={profile?.job_title ?? "—"} />
            <Row label="User ID" value={<code className="text-xs">{user?.id ?? "—"}</code>} />
            <Row
              label="Account active"
              value={
                profile?.is_active === false ? (
                  <Badge variant="destructive">Disabled</Badge>
                ) : (
                  <Badge variant="secondary">Yes</Badge>
                )
              }
            />
          </CardContent>
        </Card>

        {/* Roles */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Roles</CardTitle>
            <CardDescription>Granted via user_roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rolesLoading ? (
              <Skeleton className="h-6 w-40" />
            ) : mine.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No roles assigned. Ask a Super Admin to grant you access from Admin → Users.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mine.map((r) => (
                  <span
                    key={r}
                    className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${ROLE_TONE[r] ?? "bg-muted text-muted-foreground border-border"}`}
                  >
                    {ROLE_LABEL[r] ?? r}
                  </span>
                ))}

              </div>
            )}
            <div className="pt-2 text-xs text-muted-foreground space-y-1">
              <div>Super Admin: {isSuper ? "yes" : "no"}</div>
              <div>Administrative tier: {isAdminTier ? "yes" : "no"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Session */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Session</CardTitle>
            <CardDescription>Active Supabase auth session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              label="Provider"
              value={sessionInfo?.provider ?? "email"}
            />
            <Row
              label="Last sign-in"
              value={
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {fmt(sessionInfo?.last_sign_in_at)}
                </span>
              }
            />
            <Row label="Account created" value={fmt(sessionInfo?.created_at)} />
            <Row label="Session expires" value={fmt(sessionInfo?.expires_at)} />
            <Row
              label="Last login (audited)"
              value={fmt(profile?.last_login_at ?? currentEvent?.at ?? null)}
            />
            <Row
              label="IP address"
              value={
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <code className="text-xs">{currentEvent?.ip ?? "—"}</code>
                  {currentEvent?.country && (
                    <Badge variant="secondary" className="ml-1">{currentEvent.country}</Badge>
                  )}
                </span>
              }
            />
            <Row
              label="User agent"
              value={
                <span className="inline-flex items-start gap-1 text-xs text-muted-foreground break-all">
                  <Monitor className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{currentEvent?.user_agent ?? "—"}</span>
                </span>
              }
            />
          </CardContent>
        </Card>

        {/* Recent sign-in history */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent sign-ins</CardTitle>
            <CardDescription>Last 10 audited sign-in events for this account</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            ) : !history || history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sign-in events recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="text-left font-medium py-2 pr-4">When</th>
                      <th className="text-left font-medium py-2 pr-4">IP</th>
                      <th className="text-left font-medium py-2 pr-4">Country</th>
                      <th className="text-left font-medium py-2">User agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((e) => (
                      <tr key={e.id} className="border-b border-border/60 last:border-0 align-top">
                        <td className="py-2 pr-4 whitespace-nowrap">{fmt(e.at)}</td>
                        <td className="py-2 pr-4"><code className="text-xs">{e.ip ?? "—"}</code></td>
                        <td className="py-2 pr-4">{e.country ?? "—"}</td>
                        <td className="py-2 text-xs text-muted-foreground break-all max-w-[24rem]">
                          {e.user_agent ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      <div className="flex justify-end gap-2 pt-2">
        <Button asChild variant="outline">
          <Link to="/admin">Back to dashboard</Link>
        </Button>
        {isSuper && (
          <Button asChild>
            <Link to="/admin/users">Manage users</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium break-all">{value}</span>
    </div>
  );
}
