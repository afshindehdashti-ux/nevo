import { useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useCurrentUser, useMyRoles } from "@/lib/crm-hooks";
import { canAccessAdminPath } from "@/lib/admin-access";
import { landingForRoles } from "@/lib/role-landing";
import { ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const isDev = import.meta.env.DEV;
const dlog = (...args: unknown[]) => {
  if (isDev) console.log("[AdminRouteGuard]", ...args);
};

/**
 * Client-side guard around every /admin child route. Enforces role-based
 * access per CRM_NAV + admin-access rules. Fails closed for unknown paths.
 */
export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const userQ = useCurrentUser();
  const rolesQ = useMyRoles();
  const [timedOut, setTimedOut] = useState(false);

  const stillChecking =
    userQ.isLoading ||
    (!!userQ.data && (rolesQ.isLoading || rolesQ.isFetching) && !rolesQ.data && !rolesQ.error);

  useEffect(() => {
    if (!stillChecking) {
      setTimedOut(false);
      return;
    }
    const t = window.setTimeout(() => setTimedOut(true), 5000);
    return () => window.clearTimeout(t);
  }, [stillChecking]);

  // Not signed in → send to the CRM sign-in route.
  useEffect(() => {
    if (!userQ.isLoading && !userQ.error && !userQ.data) {
      dlog("no user, redirecting to /admin/login");
      window.location.replace("/admin/login");
    }
  }, [userQ.isLoading, userQ.error, userQ.data]);

  if (userQ.isLoading || (stillChecking && !timedOut)) {
    return (
      <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking access…
      </div>
    );
  }

  if (userQ.error) {
    const msg = userQ.error instanceof Error ? userQ.error.message : String(userQ.error);
    dlog("user query error", userQ.error);
    return (
      <ErrorPanel
        title="Could not verify your session"
        message={msg}
        onRetry={() => userQ.refetch()}
        onSignOut
      />
    );
  }

  if (!userQ.data) {
    return <div className="p-6 text-sm text-muted-foreground">Redirecting to sign in…</div>;
  }

  if (stillChecking && timedOut) {
    return (
      <ErrorPanel
        title="Access check timed out"
        message="We could not verify your permissions within 5 seconds."
        onRetry={() => {
          setTimedOut(false);
          rolesQ.refetch();
        }}
      />
    );
  }

  if (rolesQ.error) {
    const msg = rolesQ.error instanceof Error ? rolesQ.error.message : String(rolesQ.error);
    dlog("roles query error", rolesQ.error);
    return (
      <ErrorPanel
        title="Could not load your roles"
        message={msg}
        onRetry={() => rolesQ.refetch()}
        onSignOut
      />
    );
  }

  const roles = rolesQ.data ?? [];
  dlog("resolved roles", roles, "path", location.pathname);

  if (roles.length === 0) {
    return <AccessDenied reason="Your account has no assigned admin role." showSignOut />;
  }

  if (!canAccessAdminPath(location.pathname, roles)) {
    const fallback = landingForRoles(roles);
    return (
      <AccessDenied reason="You don't have permission to view this area." fallback={fallback} />
    );
  }

  return <>{children}</>;
}

function AccessDenied({
  reason,
  fallback,
  showSignOut,
}: {
  reason: string;
  fallback?: string;
  showSignOut?: boolean;
}) {
  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="border border-border rounded-lg bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <ShieldAlert className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Access denied</h1>
        </div>
        <p className="text-sm text-muted-foreground">{reason}</p>
        <div className="flex gap-2">
          {fallback && (
            <Button asChild size="sm">
              <a href={fallback}>Go to your dashboard</a>
            </Button>
          )}
          {showSignOut && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.replace("/admin/login");
              }}
            >
              Sign out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorPanel({
  title,
  message,
  onRetry,
  onSignOut,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  onSignOut?: boolean;
}) {
  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="border border-destructive/40 rounded-lg bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words bg-muted/50 rounded p-3">
          {message}
        </pre>
        <div className="flex gap-2">
          <Button size="sm" onClick={onRetry}>
            Retry
          </Button>
          {onSignOut && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.replace("/auth");
              }}
            >
              Sign out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
