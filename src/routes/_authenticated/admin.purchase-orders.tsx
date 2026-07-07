import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GuideMeButton } from "@/components/ai/GuideMeButton";
import { formatDate, formatMoney } from "@/lib/crm-money";

export const Route = createFileRoute("/_authenticated/admin/purchase-orders")({
  head: () => ({
    meta: [{ title: "Purchase Orders — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: PurchaseOrdersList,
});

function PurchaseOrdersList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,status,order_date,requested_delivery,currency,total,customer:customers(company_name)")
        .order("order_date", { ascending: false })
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
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Operations</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Confirmed customer purchase orders currently in the operations pipeline.
          </p>
        </div>
        <GuideMeButton sectionId="purchase-order" />
      </header>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Failed to load purchase orders. {(error as Error).message}
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
            No purchase orders yet.
          </CardContent>
        </Card>
      ) : (
        <div className="border border-border rounded-md overflow-hidden bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">PO #</th>
                <th className="text-left px-3 py-2">Customer</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Order date</th>
                <th className="text-left px-3 py-2">Requested delivery</th>
                <th className="text-right px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((o: any) => (
                <tr key={o.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{o.order_number}</td>
                  <td className="px-3 py-2 text-muted-foreground">{o.customer?.company_name ?? "—"}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="capitalize">{o.status}</Badge></td>
                  <td className="px-3 py-2 text-muted-foreground">{o.order_date ? formatDate(o.order_date) : "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{o.requested_delivery ? formatDate(o.requested_delivery) : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(Number(o.total ?? 0), o.currency ?? "EUR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
