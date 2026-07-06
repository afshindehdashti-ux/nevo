import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/crm/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/commission-invoices")({
  head: () => ({
    meta: [{ title: "Commission Invoices — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <AdminPlaceholder
      title="Commission Invoices"
      description="Manage Commission Invoices in the NEVO Industrial back office."
    />
  ),
});
