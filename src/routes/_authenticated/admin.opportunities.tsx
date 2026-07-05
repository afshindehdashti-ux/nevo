import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/crm/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminPlaceholder
      title="Opportunities"
      description="Manage Opportunities in the NEVO Industrial back office."
    />
  ),
});
