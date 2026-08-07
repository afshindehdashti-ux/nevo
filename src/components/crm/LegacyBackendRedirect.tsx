import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/lib/crm-hooks";
import { resolveLandingRoute } from "@/lib/role-landing";

export function LegacyBackendRedirect() {
  const userQuery = useCurrentUser();

  useEffect(() => {
    if (userQuery.isLoading) return;

    if (userQuery.error || !userQuery.data) {
      window.location.replace("/admin/login");
      return;
    }

    let cancelled = false;
    resolveLandingRoute(userQuery.data.id)
      .then((to) => {
        if (!cancelled) window.location.replace(to);
      })
      .catch(() => {
        if (!cancelled) window.location.replace("/admin");
      });

    return () => {
      cancelled = true;
    };
  }, [userQuery.data, userQuery.error, userQuery.isLoading]);

  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Redirecting…
    </div>
  );
}
