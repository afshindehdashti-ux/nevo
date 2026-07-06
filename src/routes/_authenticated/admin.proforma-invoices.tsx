import { createFileRoute } from "@tanstack/react-router";
import { InvoicesList } from "./admin.invoices";

export const Route = createFileRoute("/_authenticated/admin/proforma-invoices")({
  head: () => ({
    meta: [{ title: "Proforma Invoices — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <InvoicesList type="proforma" title="Proforma Invoices" />,
});
