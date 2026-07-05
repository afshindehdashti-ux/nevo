import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/crm/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/suppliers")({
  head: () => ({ meta: [{ title: "Suppliers — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminPlaceholder
      title="Suppliers"
      description="Manage Suppliers in the NEVO Industrial back office."
    />
  ),
});
