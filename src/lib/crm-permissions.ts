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
export function useCanEditOrders() {
  return useHasAnyRole(["super_admin", "management", "sales", "operations"]);
}
export function useCanEditInvoices() {
  return useHasAnyRole(["super_admin", "management", "finance"]);
}
export function useCanEditPayments() {
  return useHasAnyRole(["super_admin", "management", "finance"]);
}
export function useCanEditShipments() {
  return useHasAnyRole(["super_admin", "management", "operations"]);
}
export function useCanUploadDocuments() {
  return useHasAnyRole(["super_admin", "management", "sales", "operations", "finance"]);
}
export function useCanApproveDocIntel() {
  return useHasAnyRole(["super_admin", "management"]);
}
export function useCanUseDocIntel() {
  return useHasAnyRole([
    "super_admin",
    "management",
    "sales",
    "operations",
    "finance",
    "read_only",
  ]);
}
export function useCanPurgeInvoicePdfVersions() {
  return useHasAnyRole(["super_admin", "management", "finance"]);
}
