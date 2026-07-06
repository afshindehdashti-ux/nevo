import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsSuperAdmin } from "@/lib/crm-hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Activity,
  UserPlus,
  ScrollText,
  Settings,
  Boxes,
  Package,
  Truck,
  Target,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_LABEL: Partial<Record<AppRole, string>> = {
  super_admin: "Super Admin",
  management: "Management",
  sales: "Sales",
  operations: "Operations",
  finance: "Finance",
  read_only: "Read Only",
};
const ROLE_ORDER: AppRole[] = [
  "super_admin",
  "management",
  "sales",
  "operations",
  "finance",
  "read_only",
];

export const Route = createFileRoute("/_authenticated/admin/control-panel")({
  head: () => ({
    meta: [
      { title: "Super Admin Control Panel — NEVO CRM" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ControlPanel,
});

function ControlPanel() {
  const isSuperAdmin = useIsSuperAdmin();

  const profilesQ = useQuery({
    queryKey: ["cp", "profiles"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, is_active, last_login_at, job_title, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rolesQ = useQuery({
    queryKey: ["cp", "roles"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data ?? [];
    },
  });

  const activityQ = useQuery({
    queryKey: ["cp", "activity-recent"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, user_id, action, entity_type, entity_id, created_at")
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });

  const counts = useQuery({
    queryKey: ["cp", "counts"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const tables = [
        "customers",
        "suppliers",
        "products",
        "project_inquiries",
      ] as const;
      const results = await Promise.all(
        tables.map(async (t) => {
          const { count, error } = await supabase
            .from(t)
            .select("id", { count: "exact", head: true });
          if (error) throw error;
          return [t, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(results) as Record<(typeof tables)[number], number>;
    },
  });

  const roleStats = useMemo(() => {
    const map = new Map<AppRole, number>();
    for (const r of rolesQ.data ?? []) {
      map.set(r.role as AppRole, (map.get(r.role as AppRole) ?? 0) + 1);
    }
    return map;
  }, [rolesQ.data]);

  const activeUsers = (profilesQ.data ?? []).filter((p) => p.is_active).length;
  const disabledUsers = (profilesQ.data ?? []).filter((p) => !p.is_active).length;
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of profilesQ.data ?? []) m.set(p.id, p.full_name || "—");
    return m;
  }, [profilesQ.data]);

  if (!isSuperAdmin) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Restricted area</AlertTitle>
          <AlertDescription>
            The control panel is available to Super Admins only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-widest font-semibold">
            <ShieldCheck className="h-4 w-4" /> Super Admin
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Control Panel</h1>
          <p className="text-sm text-muted-foreground">
            Top-level overview of users, roles, activity, and back-office data.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild size="sm" className="gap-2">
            <Link to="/admin/users/invite">
              <UserPlus className="h-4 w-4" /> Invite user
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link to="/admin/users">
              <Users className="h-4 w-4" /> Users & roles
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link to="/admin/activity">
              <ScrollText className="h-4 w-4" /> Activity log
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link to="/admin/settings">
              <Settings className="h-4 w-4" /> Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active users"
          value={profilesQ.isLoading ? null : activeUsers}
          hint={`${disabledUsers} disabled`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Super Admins"
          value={rolesQ.isLoading ? null : roleStats.get("super_admin") ?? 0}
          hint="Highest access tier"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Customers"
          value={counts.isLoading ? null : counts.data?.customers ?? 0}
          hint="Records in CRM"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Inquiries"
          value={counts.isLoading ? null : counts.data?.project_inquiries ?? 0}
          hint="Total received"
          icon={<Target className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Role breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Roles
            </CardTitle>
            <CardDescription>Assigned across the team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ROLE_ORDER.map((r) => (
              <div
                key={r}
                className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0"
              >
                <span>{ROLE_LABEL[r]}</span>
                <Badge variant={r === "super_admin" ? "default" : "secondary"}>
                  {roleStats.get(r) ?? 0}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" /> Recent activity
              </CardTitle>
              <CardDescription>Last 15 audited events</CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link to="/admin/activity">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityQ.isLoading && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-16 w-full" />
                    </TableCell>
                  </TableRow>
                )}
                {activityQ.data?.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.user_id ? nameById.get(row.user_id) || "Unknown" : (
                        <span className="text-muted-foreground italic">system</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {row.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.entity_type || "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {activityQ.data?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-6 text-sm"
                    >
                      No recent activity.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Backend snapshot */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Back office data</CardTitle>
          <CardDescription>Quick jump into each module</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ModuleLink
            to="/admin/customers"
            label="Customers"
            count={counts.data?.customers}
            icon={<Users className="h-4 w-4" />}
          />
          <ModuleLink
            to="/admin/suppliers"
            label="Suppliers"
            count={counts.data?.suppliers}
            icon={<Package className="h-4 w-4" />}
          />
          <ModuleLink
            to="/admin/products"
            label="Products"
            count={counts.data?.products}
            icon={<Boxes className="h-4 w-4" />}
          />
          <ModuleLink
            to="/admin/orders"
            label="Orders"
            icon={<Truck className="h-4 w-4" />}
          />
          <ModuleLink
            to="/admin/proforma-invoices"
            label="Proforma"
            icon={<FileText className="h-4 w-4" />}
          />
          <ModuleLink
            to="/admin/invoices"
            label="Invoices"
            icon={<FileText className="h-4 w-4" />}
          />
          <ModuleLink
            to="/admin/leads"
            label="Leads"
            icon={<Target className="h-4 w-4" />}
          />
          <ModuleLink
            to="/admin/reports"
            label="Reports"
            icon={<Activity className="h-4 w-4" />}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number | null;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider">
          <span>{label}</span>
          {icon}
        </div>
        <div className="text-3xl font-semibold mt-2">
          {value === null ? <Skeleton className="h-8 w-16" /> : value.toLocaleString()}
        </div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function ModuleLink({
  to,
  label,
  count,
  icon,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  to: any;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-md border border-border bg-background/60 px-3 py-3 hover:bg-accent transition-colors"
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </span>
      {typeof count === "number" && (
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      )}
    </Link>
  );
}
