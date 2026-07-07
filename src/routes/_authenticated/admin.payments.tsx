import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MasterListShell } from "@/components/crm/MasterListShell";
import { GuideMeButton } from "@/components/ai/GuideMeButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/crm-money";
import { paymentMethodLabel } from "@/lib/crm-status";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => ({ meta: [{ title: "Payments — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["payments-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, invoices(invoice_number, customer_id, customers(name))")
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((p) => {
      const inv = p.invoices as {
        invoice_number?: string;
        customers?: { name?: string } | null;
      } | null;
      const cName = inv?.customers?.name || "";
      const invNo = inv?.invoice_number || "";
      return (
        cName.toLowerCase().includes(q) ||
        invNo.toLowerCase().includes(q) ||
        (p.reference || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const total = filtered.reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <MasterListShell
      title="Payments"
      description="All payments received against invoices."
      count={rows.length}
      search={search}
      onSearchChange={setSearch}
      canCreate={false}
      onCreate={() => {}}
    >
      <div className="p-3 border-b flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          Record payments from an{" "}
          <Link to="/admin/invoices" className="text-primary hover:underline">
            invoice
          </Link>
          .
        </span>
        <span className="text-muted-foreground">
          Total shown: <span className="font-medium text-foreground">{total.toFixed(2)}</span>
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  {rows.length === 0 ? "No payments recorded yet." : "No matches."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => {
              const inv = p.invoices as {
                invoice_number?: string;
                customers?: { name?: string } | null;
              } | null;
              return (
                <TableRow key={p.id}>
                  <TableCell>{formatDate(p.received_at)}</TableCell>
                  <TableCell>
                    <Link
                      to="/admin/invoices/$id"
                      params={{ id: p.invoice_id }}
                      className="text-primary hover:underline"
                    >
                      {inv?.invoice_number || p.invoice_id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>{inv?.customers?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{paymentMethodLabel(p.method)}</Badge>
                  </TableCell>
                  <TableCell>{p.reference || "—"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(p.amount, p.currency)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </MasterListShell>
  );
}
