import { useLocation } from "@tanstack/react-router";
import { useMyRoles } from "@/lib/crm-hooks";
import { canAccessAdminPath } from "@/lib/admin-access";
import { landingForRoles } from "@/lib/role-landing";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

/**
 * Client-side guard around every /admin child route. Enforces role-based
 * access per CRM_NAV + admin-access rules. Fails closed for unknown paths.
 */
export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data: roles, isLoading } = useMyRoles();

  if (isLoading || !roles) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Checking access…</div>
    );
  }

  if (roles.length === 0) {
    return <AccessDenied reason="Your account has no assigned roles. Contact a Super Admin." />;
  }

  if (!canAccessAdminPath(location.pathname, roles)) {
    const fallback = landingForRoles(roles);
    return (
      <AccessDenied
        reason="You don't have permission to view this area."
        fallback={fallback}
      />
    );
  }

  return <>{children}</>;
}

function AccessDenied({ reason, fallback }: { reason: string; fallback?: string }) {
  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="border border-border rounded-lg bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <ShieldAlert className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Access denied</h1>
        </div>
        <p className="text-sm text-muted-foreground">{reason}</p>
        {fallback && (
          <Button asChild size="sm">
            <Link to={fallback}>Go to your dashboard</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
