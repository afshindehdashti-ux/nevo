import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/crm/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminPlaceholder
      title="Reports"
      description="Manage Reports in the NEVO Industrial back office."
    />
  ),
});
