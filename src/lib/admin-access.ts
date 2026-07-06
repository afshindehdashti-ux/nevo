import { CRM_NAV, type AppRole, type CrmNavItem } from "@/lib/crm-nav";

const ALL_STAFF: AppRole[] = ["management", "sales", "operations", "finance", "read_only"];

/** Extra rules for paths not represented in CRM_NAV (detail routes, admin-only utilities). */
type Rule = { match: (path: string) => boolean; allowedRoles?: AppRole[]; requiresSuperAdmin?: boolean };

const EXTRA_RULES: Rule[] = [
  // Always-allowed for any signed-in staff/admin
  { match: (p) => p === "/admin/change-password", allowedRoles: [...ALL_STAFF] },
  // Super-admin utilities not represented as nav items
  { match: (p) => p === "/admin/session", requiresSuperAdmin: true },
  { match: (p) => p.startsWith("/admin/users"), requiresSuperAdmin: true },
  { match: (p) => p === "/admin/document-access", requiresSuperAdmin: true },
];

function matchNavItem(pathname: string): CrmNavItem | null {
  let best: CrmNavItem | null = null;
  for (const group of CRM_NAV) {
    for (const item of group.items) {
      if (pathname === item.url || pathname.startsWith(item.url + "/")) {
        if (!best || item.url.length > best.url.length) best = item;
      }
    }
  }
  return best;
}

/**
 * Decide whether a user with `roles` can access `pathname` under /admin.
 * Fails closed: unknown /admin/* paths require super_admin.
 */
export function canAccessAdminPath(pathname: string, roles: AppRole[]): boolean {
  const isSuper = roles.includes("super_admin");
  if (isSuper) return true;

  for (const rule of EXTRA_RULES) {
    if (!rule.match(pathname)) continue;
    if (rule.requiresSuperAdmin) return false;
    if (!rule.allowedRoles || rule.allowedRoles.length === 0) return true;
    return rule.allowedRoles.some((r) => roles.includes(r));
  }

  const item = matchNavItem(pathname);
  if (item) {
    if (item.requiresSuperAdmin) return false;
    if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
    return item.allowedRoles.some((r) => roles.includes(r));
  }

  // Unknown admin path → fail closed
  return false;
}
