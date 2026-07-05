import { useMyRoles, type AppRole } from "./crm-hooks";

export function useHasAnyRole(roles: AppRole[]): boolean {
  const { data } = useMyRoles();
  const mine = data ?? [];
  return mine.some((r) => roles.includes(r));
}

export function useCanEditCustomers() {
  return useHasAnyRole(["super_admin", "management", "sales", "operations"]);
}
export function useCanEditSuppliers() {
  return useHasAnyRole(["super_admin", "management", "operations"]);
}
export function useCanEditProducts() {
  return useHasAnyRole(["super_admin", "management", "operations", "sales"]);
}
export function useCanDeleteMasters() {
  return useHasAnyRole(["super_admin", "management"]);
}
