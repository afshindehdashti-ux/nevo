import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/crm/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/files")({
  head: () => ({ meta: [{ title: "Files — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminPlaceholder
      title="Files"
      description="Manage Files in the NEVO Industrial back office."
    />
  ),
});
