import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GuideMeButton } from "@/components/ai/GuideMeButton";
import { ListErrorState } from "@/components/admin/ListErrorState";
import { ListEmptyState } from "@/components/admin/ListEmptyState";
import { formatDate, formatMoney } from "@/lib/crm-money";
import { buildSelect } from "@/lib/supabase-select";

const COMMISSIONS_SELECT = buildSelect(
  "partner_commissions",
  ["id", "amount", "currency", "status", "earned_at", "paid_at", "created_at"],
  [
    { as: "partner", table: "partners", columns: ["company_name"] },
    { as: "customer", table: "customers", columns: ["name"] },
  ],
);


export const Route = createFileRoute("/_authenticated/admin/commission-invoices")({
  head: () => ({
    meta: [{ title: "Commission Invoices — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: CommissionInvoicesList,
});

function CommissionInvoicesList() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["partner-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_commissions")
        .select(COMMISSIONS_SELECT)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 15_000,
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Finance</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Commission Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Partner commissions earned against customer orders and invoices.
          </p>
        </div>
        <GuideMeButton sectionId="commission-invoice" />
      </header>

      {error ? (
        <ListErrorState
          resource="commissions"
          error={error}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : isLoading ? (
        <div data-testid="list-skeleton" aria-busy="true" aria-live="polite" className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <ListEmptyState
          icon={Percent}
          title="No commissions yet"
          description="Commissions accrue automatically when partner-linked customer orders are confirmed and invoiced. New entries will appear here for review and payout."
        />
      ) : (
        <div className="border border-border rounded-md overflow-hidden bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Partner</th>
                <th className="text-left px-3 py-2">Customer</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Amount</th>
                <th className="text-left px-3 py-2">Earned</th>
                <th className="text-left px-3 py-2">Paid</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((c: any) => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{c.partner?.company_name ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.customer?.name ?? "—"}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="capitalize">{c.status ?? "pending"}</Badge></td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(Number(c.amount ?? 0), c.currency ?? "EUR")}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.earned_at ? formatDate(c.earned_at) : "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.paid_at ? formatDate(c.paid_at) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
