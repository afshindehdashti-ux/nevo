import type { ReactNode } from "react";
import { useMyRoles, type AppRole } from "@/lib/crm-hooks";
import { AccessDenied } from "./AccessDenied";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  allow: AppRole[];
  children: ReactNode;
}

/**
 * Client-side role gate for admin sub-pages. The `_authenticated` layout already
 * enforces sign-in; this narrows access to specific roles and renders an
 * Access Denied panel otherwise.
 */
export function RoleGuard({ allow, children }: Props) {
  const { data: roles, isLoading } = useMyRoles();

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const mine = roles ?? [];
  // super_admin always passes
  if (mine.includes("super_admin")) return <>{children}</>;
  if (mine.some((r) => allow.includes(r))) return <>{children}</>;
  return <AccessDenied />;
}
