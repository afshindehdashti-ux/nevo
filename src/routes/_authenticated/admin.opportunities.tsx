import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListErrorState } from "@/components/admin/ListErrorState";
import { ListEmptyState } from "@/components/admin/ListEmptyState";
import { formatDate, formatMoney } from "@/lib/crm-money";
import { buildSelect } from "@/lib/supabase-select";

// Type-checked against Database types — `customers.company_name` would fail
// tsc here instead of at runtime with a "column does not exist" error.
const OPPORTUNITIES_SELECT = buildSelect(
  "opportunities",
  ["id", "name", "stage", "amount", "currency", "probability", "expected_close_date", "created_at"],
  [
    { as: "customer", table: "customers", columns: ["name"] },
    { as: "partner", table: "partners", columns: ["company_name"] },
  ],
);



export const Route = createFileRoute("/_authenticated/admin/opportunities")({
  head: () => ({
    meta: [{ title: "Opportunities — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: OpportunitiesList,
});

function OpportunitiesList() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["opportunities-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select(OPPORTUNITIES_SELECT)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 15_000,
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">CRM</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Opportunities</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pipeline of open and closed deals across NEVO Industrial.
        </p>
      </header>

      {error ? (
        <ListErrorState
          resource="opportunities"
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
          icon={Target}
          title="No opportunities yet"
          description="Deals you create — either manually or from a qualified lead — will show up here with stage, value, and expected close date."
        />
      ) : (
        <div className="border border-border rounded-md overflow-hidden bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Customer</th>
                <th className="text-left px-3 py-2">Partner</th>
                <th className="text-left px-3 py-2">Stage</th>
                <th className="text-right px-3 py-2">Amount</th>
                <th className="text-right px-3 py-2">Prob.</th>
                <th className="text-left px-3 py-2">Close</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((o: any) => (
                <tr key={o.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{o.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{o.customer?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{o.partner?.company_name ?? "—"}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="capitalize">{o.stage}</Badge></td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(Number(o.amount ?? 0), o.currency ?? "EUR")}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{o.probability ?? 0}%</td>
                  <td className="px-3 py-2 text-muted-foreground">{o.expected_close_date ? formatDate(o.expected_close_date) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
