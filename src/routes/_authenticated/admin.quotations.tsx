import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listQuotations } from "@/lib/quotations.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NewQuotationDialog } from "@/components/crm/NewQuotationDialog";

export const Route = createFileRoute("/_authenticated/admin/quotations")({
  head: () => ({ meta: [{ title: "Quotations — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: QuotationsPage,
});

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending_approval: "secondary",
  approved: "secondary",
  sent: "default",
  accepted: "default",
  rejected: "destructive",
  expired: "outline",
  converted: "default",
  void: "outline",
};

function QuotationsPage() {
  const listFn = useServerFn(listQuotations);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["quotations"],
    queryFn: () => listFn(),
  });

  return (
    <div className="p-6 space-y-4 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quotations</h1>
          <p className="text-sm text-muted-foreground">
            Draft, approve, and send NEVO-branded quotations. Accepted quotations convert to
            proforma or commercial invoices.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New quotation
        </Button>
      </div>

      <NewQuotationDialog open={dialogOpen} onOpenChange={setDialogOpen} />


      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="w-16 text-right">Items</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Valid until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No quotations yet. Click <b>New quotation</b> to create one.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r: any) => {
              const customerName =
                r.customers?.company_name || r.customers?.name || (r.customer_id ? "(unnamed)" : "—");
              const itemsCount = Array.isArray(r.quotation_items)
                ? Number(r.quotation_items[0]?.count ?? 0)
                : 0;
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.quotation_number ?? "—"}</TableCell>
                  <TableCell>{customerName}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs">{itemsCount}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.issue_date
                      ? formatDistanceToNow(new Date(r.issue_date), { addSuffix: true })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs">{r.valid_until ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor[r.status] ?? "outline"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.currency} {Number(r.total ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/admin/quotations/$id" params={{ id: r.id }}>
                          Open
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link to="/admin/quotations/$id" params={{ id: r.id }}>
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
