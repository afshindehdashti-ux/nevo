import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/lib/crm-hooks";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedOutlet,
});

function AuthenticatedOutlet() {
  const userQuery = useCurrentUser();

  useEffect(() => {
    if (!userQuery.isLoading && (userQuery.error || !userQuery.data)) {
      window.location.replace("/admin/login");
    }
  }, [userQuery.data, userQuery.error, userQuery.isLoading]);

  if (!userQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking access…
      </div>
    );
  }

  return <Outlet />;
}
