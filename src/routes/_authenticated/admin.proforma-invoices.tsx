import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/crm/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/proforma-invoices")({
  head: () => ({
    meta: [{ title: "Proforma Invoices — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <AdminPlaceholder
      title="Proforma Invoices"
      description="Manage Proforma Invoices in the NEVO Industrial back office."
    />
  ),
});
