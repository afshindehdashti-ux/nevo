import { createFileRoute } from "@tanstack/react-router";
import { SystemHealthPage } from "@/components/crm/SystemHealthPage";

export const Route = createFileRoute("/_authenticated/admin/system-health")({
  head: () => ({
    meta: [
      { title: "System Health & QA Center — NEVO CRM" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SystemHealthPage,
});
