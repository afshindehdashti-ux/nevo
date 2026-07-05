import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/crm/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/tasks")({
  head: () => ({ meta: [{ title: "Tasks — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminPlaceholder
      title="Tasks"
      description="Manage Tasks in the NEVO Industrial back office."
    />
  ),
});
