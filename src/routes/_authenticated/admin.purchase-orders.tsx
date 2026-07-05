import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/crm/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/purchase-orders")({
  head: () => ({ meta: [{ title: "Purchase Orders — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminPlaceholder
      title="Purchase Orders"
      description="Manage Purchase Orders in the NEVO Industrial back office."
    />
  ),
});
