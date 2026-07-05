import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/crm/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/invoices")({
  head: () => ({ meta: [{ title: "Invoices — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminPlaceholder
      title="Invoices"
      description="Manage Invoices in the NEVO Industrial back office."
    />
  ),
});
