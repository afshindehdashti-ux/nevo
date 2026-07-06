import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = Database["public"]["Enums"]["app_role"];

// Priority order: highest-privilege / most-specific role wins.
const ROLE_LANDING: Array<{ role: AppRole; to: string }> = [
  { role: "super_admin", to: "/admin" },
  { role: "management", to: "/admin" },
  { role: "sales", to: "/admin/leads" },
  { role: "operations", to: "/admin/orders" },
  { role: "finance", to: "/admin/invoices" },
  { role: "read_only", to: "/admin/reports" },
];

export function landingForRoles(roles: AppRole[]): string {
  for (const entry of ROLE_LANDING) {
    if (roles.includes(entry.role)) return entry.to;
  }
  return "/admin";
}

/**
 * Resolve the correct post-login landing route for the currently signed-in user.
 * - Staff (any row in user_roles) → role-based admin area.
 * - Customer users → /customer-portal.
 * - Partner users → /partner-portal.
 * - Otherwise → /admin (which will bounce non-staff appropriately).
 */
export async function resolveLandingRoute(userId: string): Promise<string> {
  const [rolesRes, customerRes, partnerRes] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("customer_users").select("customer_id").eq("user_id", userId).limit(1),
    supabase.from("partner_users").select("partner_id").eq("user_id", userId).limit(1),
  ]);

  const roles = (rolesRes.data ?? []).map((r) => r.role as AppRole);
  if (roles.length > 0) return landingForRoles(roles);

  if ((customerRes.data ?? []).length > 0) return "/customer-portal";
  if ((partnerRes.data ?? []).length > 0) return "/partner-portal";

  return "/admin";
}
