import { createFileRoute } from "@tanstack/react-router";
import { SystemHealthPage } from "@/components/crm/SystemHealthPage";

export const Route = createFileRoute("/_authenticated/admin/qa-center")({
  head: () => ({
    meta: [
      { title: "QA Center — NEVO CRM" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SystemHealthPage,
});
