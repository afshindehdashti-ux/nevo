import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Target, TrendingUp, Truck, Factory, Ship, PackageCheck,
  FileText, Receipt, Percent, AlertCircle, DollarSign, LineChart, CheckSquare,
  Package, Boxes,
} from "lucide-react";
import { useMyProfile, useCurrentUser } from "@/lib/crm-hooks";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

type Metric = { label: string; value: string; hint?: string; icon: React.ComponentType<{ className?: string }>; tone?: "default" | "success" | "warn" | "danger" };

function toneClass(tone?: Metric["tone"]) {
  switch (tone) {
    case "success": return "text-emerald-600 dark:text-emerald-400";
    case "warn": return "text-amber-600 dark:text-amber-400";
    case "danger": return "text-rose-600 dark:text-rose-400";
    default: return "text-foreground";
  }
}

function useDashboardCounts() {
  return useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: async () => {
      const [c, s, p] = await Promise.all([
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("suppliers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      return {
        customers: c.count ?? 0,
        suppliers: s.count ?? 0,
        products: p.count ?? 0,
      };
    },
    staleTime: 30_000,
  });
}


function Dashboard() {
  const { data: profile } = useMyProfile();
  const { data: user } = useCurrentUser();
  const name = profile?.full_name || user?.email?.split("@")[0] || "Team";

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">NEVO Industrial · Back Office</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Welcome back, {name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time overview of customers, orders, invoices and commissions.
          </p>
        </div>
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
          Phase 1 · Foundation
        </Badge>
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {METRICS.map((m) => (
          <Card key={m.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {m.label}
                </span>
                <m.icon className={`h-4 w-4 ${toneClass(m.tone)}`} />
              </div>
              <div className={`text-xl font-semibold ${toneClass(m.tone)}`}>{m.value}</div>
              {m.hint && <p className="text-[11px] text-muted-foreground mt-1">{m.hint}</p>}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sales pipeline</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            Pipeline chart ships with the Leads & Opportunities module.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <div className="flex items-start gap-2">
              <CheckSquare className="h-4 w-4 text-emerald-500 mt-0.5" />
              <div>
                <p className="text-foreground">CRM foundation activated</p>
                <p className="text-xs">Authentication, roles, dashboard and settings are live.</p>
              </div>
            </div>
            <p className="text-xs">Feed populates as customers, orders and invoices are added in the next phase.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
