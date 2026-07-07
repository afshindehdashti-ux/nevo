import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Target,
  TrendingUp,
  Truck,
  Factory,
  Ship,
  PackageCheck,
  FileText,
  Receipt,
  Percent,
  AlertCircle,
  DollarSign,
  LineChart,
  CheckSquare,
  Package,
  Boxes,
  FileCheck,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { useMyProfile, useCurrentUser } from "@/lib/crm-hooks";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [{ title: "Dashboard — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: Dashboard,
});

type Tone = "default" | "success" | "warn" | "danger";
type Metric = {
  label: string;
  value: number | null;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  to?: string;
  currency?: boolean;
};

function toneClass(tone?: Tone) {
  switch (tone) {
    case "success":
      return "text-emerald-600 dark:text-emerald-400";
    case "warn":
      return "text-amber-600 dark:text-amber-400";
    case "danger":
      return "text-rose-600 dark:text-rose-400";
    default:
      return "text-foreground";
  }
}

/** Count helper — returns null on error so the UI can show em-dash instead of 0. */
async function countRows(
  table: Parameters<typeof supabase.from>[0],
  build?: (q: ReturnType<typeof supabase.from>) => any,
) {
  const base = supabase.from(table).select("id", { count: "exact", head: true });
  const { count, error } = await (build ? build(base) : base);
  if (error) return null;
  return count ?? 0;
}

function useDashboardData() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startIso = startOfMonth.toISOString();
  const today = new Date().toISOString().slice(0, 10);

  return useQuery({
    queryKey: ["admin-dashboard", startIso],
    queryFn: async () => {
      const [
        customers,
        suppliers,
        products,
        newLeads,
        openOpportunities,
        activeOrders,
        inProduction,
        inShipment,
        deliveredThisMonth,
        pendingProformas,
        pendingInvoices,
        overdueInvoices,
        pendingCommissions,
        documentsPending,
        overdueTasks,
        tasksDueToday,
        importsThisWeek,
        unpaidRows,
        paidThisMonthRows,
        revenueThisMonthRows,
        recentActivity,
        recentImports,
        upcomingTasks,
      ] = await Promise.all([
        countRows("customers", (q) => q.eq("is_active", true)),
        countRows("suppliers", (q) => q.eq("is_active", true)),
        countRows("products", (q) => q.eq("is_active", true)),
        countRows("leads", (q) => q.in("status", ["new", "contacted", "qualified", "proposal", "negotiation"])),
        countRows("opportunities", (q) => q.in("stage", ["prospecting", "qualification", "proposal", "negotiation"])),
        countRows("orders", (q) => q.in("status", ["draft", "confirmed", "in_production", "ready_to_ship"])),
        countRows("orders", (q) => q.eq("status", "in_production")),
        countRows("shipments", (q) => q.eq("status", "in_transit")),
        countRows("shipments", (q) => q.eq("status", "delivered").gte("delivered_at", startIso)),
        countRows("invoices", (q) => q.eq("type", "proforma").in("status", ["draft", "issued"])),
        countRows("invoices", (q) => q.eq("type", "commercial").in("status", ["draft", "issued", "partially_paid"])),
        countRows("invoices", (q) => q.eq("status", "overdue")),
        countRows("partner_commissions", (q) => q.in("status", ["pending", "approved"])),
        countRows("doc_intel_documents", (q) => q.eq("status", "pending_approval")),
        countRows("tasks", (q) => q.in("status", ["open", "in_progress"]).lt("due_date", today)),
        countRows("tasks", (q) => q.in("status", ["open", "in_progress"]).eq("due_date", today)),
        countRows("import_jobs", (q) => q.gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString())),
        supabase
          .from("invoices")
          .select("balance,currency")
          .eq("type", "commercial")
          .in("status", ["issued", "partially_paid", "overdue"]),
        supabase
          .from("payments")
          .select("amount,currency")
          .gte("paid_at", startIso.slice(0, 10)),
        supabase
          .from("invoices")
          .select("total,currency")
          .eq("type", "commercial")
          .gte("issue_date", startIso.slice(0, 10)),
        supabase
          .from("activity_logs")
          .select("id,action,entity_type,entity_id,created_at,metadata,user_id")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("import_jobs")
          .select("id,import_type,file_name,status,total_rows,success_rows,failed_rows,created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("tasks")
          .select("id,title,status,priority,due_date,assigned_to")
          .in("status", ["open", "in_progress"])
          .lte("due_date", today)
          .order("due_date", { ascending: true })
          .limit(6),
      ]);

      const sumByCurrency = (
        rows: { amount?: number | null; total?: number | null; balance?: number | null; currency: string }[] | null,
        key: "amount" | "total" | "balance",
      ) => {
        const map = new Map<string, number>();
        (rows ?? []).forEach((r) => {
          const v = Number((r as any)[key] ?? 0);
          if (!v) return;
          map.set(r.currency, (map.get(r.currency) ?? 0) + v);
        });
        return map;
      };

      return {
        counts: {
          customers,
          suppliers,
          products,
          newLeads,
          openOpportunities,
          activeOrders,
          inProduction,
          inShipment,
          deliveredThisMonth,
          pendingProformas,
          pendingInvoices,
          overdueInvoices,
          pendingCommissions,
          documentsPending,
          overdueTasks,
          tasksDueToday,
          importsThisWeek,
        },
        unpaidByCurrency: sumByCurrency(unpaidRows.data as any, "balance"),
        paidByCurrency: sumByCurrency(paidThisMonthRows.data as any, "amount"),
        revenueByCurrency: sumByCurrency(revenueThisMonthRows.data as any, "total"),
        recentActivity: recentActivity.data ?? [],
        recentImports: recentImports.data ?? [],
        upcomingTasks: upcomingTasks.data ?? [],
      };
    },
    staleTime: 30_000,
  });
}

function formatMoneyMap(map: Map<string, number>) {
  if (map.size === 0) return "—";
  return Array.from(map.entries())
    .map(([ccy, v]) => `${ccy} ${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)
    .join(" · ");
}

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString();
}

function Dashboard() {
  const { data: profile } = useMyProfile();
  const { data: user } = useCurrentUser();
  const { data, isLoading, error } = useDashboardData();
  const name = profile?.full_name || user?.email?.split("@")[0] || "Team";
  const c = data?.counts;

  const metrics: Metric[] = [
    { label: "Active Customers", value: c?.customers ?? null, icon: Users, tone: "success", to: "/admin/customers" },
    { label: "Active Suppliers", value: c?.suppliers ?? null, icon: Package, to: "/admin/suppliers" },
    { label: "Active Products", value: c?.products ?? null, icon: Boxes, to: "/admin/products" },
    { label: "Active Leads", value: c?.newLeads ?? null, icon: Target, to: "/admin/leads" },
    { label: "Open Opportunities", value: c?.openOpportunities ?? null, icon: TrendingUp, to: "/admin/opportunities" },
    { label: "Active Orders", value: c?.activeOrders ?? null, icon: Truck, to: "/admin/orders" },
    { label: "In Production", value: c?.inProduction ?? null, icon: Factory, to: "/admin/orders" },
    { label: "In Shipment", value: c?.inShipment ?? null, icon: Ship, to: "/admin/shipments" },
    { label: "Delivered (Month)", value: c?.deliveredThisMonth ?? null, icon: PackageCheck, tone: "success", to: "/admin/shipments" },
    { label: "Pending Proformas", value: c?.pendingProformas ?? null, icon: FileText, to: "/admin/proforma-invoices" },
    { label: "Pending Invoices", value: c?.pendingInvoices ?? null, icon: Receipt, tone: "warn", to: "/admin/invoices" },
    { label: "Overdue Invoices", value: c?.overdueInvoices ?? null, icon: AlertCircle, tone: "danger", to: "/admin/invoices" },
    { label: "Pending Commission", value: c?.pendingCommissions ?? null, icon: Percent, tone: "warn", to: "/admin/commission-invoices" },
    { label: "Docs Pending Approval", value: c?.documentsPending ?? null, icon: FileCheck, tone: "warn", to: "/admin/document-intelligence" },
    { label: "Overdue Tasks", value: c?.overdueTasks ?? null, icon: AlertTriangle, tone: "danger", to: "/admin/tasks" },
    { label: "Tasks Due Today", value: c?.tasksDueToday ?? null, icon: CheckSquare, to: "/admin/tasks" },
    { label: "Imports This Week", value: c?.importsThisWeek ?? null, icon: Upload, to: "/admin/import" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            NEVO Industrial · Back Office
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Welcome back, {name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time overview of customers, orders, invoices and commissions.
          </p>
        </div>
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
          Live data
        </Badge>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Failed to load dashboard data. {(error as Error).message}
          </CardContent>
        </Card>
      )}

      {/* Metric cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {metrics.map((m) => {
          const inner = (
            <Card className="border-border/60 hover:border-border transition-colors h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {m.label}
                  </span>
                  <m.icon className={`h-4 w-4 ${toneClass(m.tone)}`} />
                </div>
                <div className={`text-xl font-semibold ${toneClass(m.tone)}`}>
                  {isLoading ? <Skeleton className="h-6 w-16" /> : fmt(m.value)}
                </div>
                {m.hint && <p className="text-[11px] text-muted-foreground mt-1">{m.hint}</p>}
              </CardContent>
            </Card>
          );
          return m.to ? (
            <Link key={m.label} to={m.to}>
              {inner}
            </Link>
          ) : (
            <div key={m.label}>{inner}</div>
          );
        })}
      </section>

      {/* Money cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Unpaid Balance
              </span>
              <AlertCircle className={`h-4 w-4 ${toneClass("danger")}`} />
            </div>
            <div className={`text-xl font-semibold ${toneClass("danger")}`}>
              {isLoading ? <Skeleton className="h-6 w-40" /> : formatMoneyMap(data?.unpaidByCurrency ?? new Map())}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Paid This Month
              </span>
              <DollarSign className={`h-4 w-4 ${toneClass("success")}`} />
            </div>
            <div className={`text-xl font-semibold ${toneClass("success")}`}>
              {isLoading ? <Skeleton className="h-6 w-40" /> : formatMoneyMap(data?.paidByCurrency ?? new Map())}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Revenue This Month
              </span>
              <LineChart className="h-4 w-4 text-foreground" />
            </div>
            <div className="text-xl font-semibold">
              {isLoading ? <Skeleton className="h-6 w-40" /> : formatMoneyMap(data?.revenueByCurrency ?? new Map())}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Activity + Tasks + Imports */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tasks due today & overdue</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (data?.upcomingTasks ?? []).length === 0 ? (
              <p className="text-muted-foreground">Nothing due — you're clear.</p>
            ) : (
              <ul className="space-y-2">
                {data!.upcomingTasks.map((t: any) => (
                  <li key={t.id} className="flex items-start gap-2">
                    <CheckSquare className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <Link to="/admin/tasks" className="hover:underline block truncate">
                        {t.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {t.priority ? `${t.priority} · ` : ""}
                        due {t.due_date}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (data?.recentActivity ?? []).length === 0 ? (
              <p className="text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {data!.recentActivity.map((a: any) => (
                  <li key={a.id} className="text-sm">
                    <span className="font-medium capitalize">{a.action}</span>{" "}
                    <span className="text-muted-foreground">{a.entity_type}</span>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent imports</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (data?.recentImports ?? []).length === 0 ? (
              <div className="text-muted-foreground">
                No imports yet.{" "}
                <Link to="/admin/import" className="text-emerald-600 hover:underline">
                  Start one
                </Link>
                .
              </div>
            ) : (
              <ul className="space-y-2">
                {data!.recentImports.map((j: any) => (
                  <li key={j.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to="/admin/import" className="font-medium hover:underline block truncate">
                        {j.import_type}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{j.file_name}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {j.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
