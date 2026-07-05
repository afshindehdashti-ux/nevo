import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/crm/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  head: () => ({ meta: [{ title: "Leads — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminPlaceholder
      title="Leads"
      description="Manage Leads in the NEVO Industrial back office."
    />
  ),
});
