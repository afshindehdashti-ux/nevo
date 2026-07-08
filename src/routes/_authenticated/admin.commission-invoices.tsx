import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GuideMeButton } from "@/components/ai/GuideMeButton";
import { formatDate, formatMoney } from "@/lib/crm-money";

export const Route = createFileRoute("/_authenticated/admin/commission-invoices")({
  head: () => ({
    meta: [{ title: "Commission Invoices — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: CommissionInvoicesList,
});

function CommissionInvoicesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_commissions")
        .select("id,amount,currency,status,earned_at,paid_at,partner:partners(company_name),customer:customers(name),created_at")
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
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Failed to load commissions. {(error as Error).message}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No partner commissions yet.
          </CardContent>
        </Card>
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
                  <td className="px-3 py-2 text-muted-foreground">{c.customer?.company_name ?? "—"}</td>
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
