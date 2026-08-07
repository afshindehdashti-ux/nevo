import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsSuperAdmin } from "@/lib/crm-hooks";
import { AccessDenied } from "@/components/crm/AccessDenied";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Filter,
  CheckCircle2,
  LogIn,
  LogOut,
  Trash2,
  XCircle,
  Bell,
  KeyRound,
  ExternalLink,
  Download,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { downloadCsv, downloadPdf } from "@/lib/security-export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Security Alerts dashboard — a focused, at-a-glance view of recent
 * security-relevant events (failed sign-ins, anomaly alerts, session
 * revocations, sign-outs of all sessions, rejections, deletes on audited
 * tables). For the full audit trail with sign-ins/approvals/role changes,
 * use Security Audit. Super Admin only.
 */

type LogRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type AlertType =
  "sign_in_failed" | "security_alert" | "revoke_session" | "sign_out_all" | "reject" | "delete";

const ALERT_TYPES: AlertType[] = [
  "sign_in_failed",
  "security_alert",
  "revoke_session",
  "sign_out_all",
  "reject",
  "delete",
];

const TYPE_META: Record<
  AlertType,
  { label: string; severity: "high" | "medium" | "low"; Icon: typeof Bell }
> = {
  sign_in_failed: { label: "Failed sign-in", severity: "medium", Icon: LogIn },
  security_alert: { label: "Security alert", severity: "high", Icon: ShieldAlert },
  revoke_session: { label: "Session revoked", severity: "medium", Icon: KeyRound },
  sign_out_all: { label: "All sessions signed out", severity: "medium", Icon: LogOut },
  reject: { label: "Approval rejected", severity: "low", Icon: XCircle },
  delete: { label: "Audited delete", severity: "high", Icon: Trash2 },
};

const RANGES = [
  { value: "1h", label: "1h", hours: 1 },
  { value: "24h", label: "24h", hours: 24 },
  { value: "7d", label: "7d", hours: 24 * 7 },
  { value: "30d", label: "30d", hours: 24 * 30 },
] as const;

const SEVERITY_COLOR: Record<"high" | "medium" | "low", string> = {
  high: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-transparent",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-transparent",
  low: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-transparent",
};

export const Route = createFileRoute("/_authenticated/admin/security-alerts")({
  head: () => ({
    meta: [{ title: "Security Alerts — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: SecurityAlertsPage,
});

function SecurityAlertsPage() {
  const isSuperAdmin = useIsSuperAdmin();

  const [range, setRange] = useState<(typeof RANGES)[number]["value"]>("24h");
  const [types, setTypes] = useState<AlertType[]>([...ALERT_TYPES]);
  const [severity, setSeverity] = useState<"all" | "high" | "medium" | "low">("all");
  const [openRow, setOpenRow] = useState<LogRow | null>(null);

  const hours = RANGES.find((r) => r.value === range)?.hours ?? 24;

  const q = useQuery({
    queryKey: ["security-alerts", hours],
    enabled: isSuperAdmin,
    refetchInterval: 30_000,
    queryFn: async () => {
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id,user_id,action,entity_type,entity_id,metadata,created_at")
        .in("action", ALERT_TYPES)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as LogRow[];
    },
  });

  const actorIds = useMemo(
    () => Array.from(new Set((q.data ?? []).map((r) => r.user_id).filter(Boolean) as string[])),
    [q.data],
  );

  const actors = useQuery({
    queryKey: ["security-alerts-actors", actorIds],
    enabled: isSuperAdmin && actorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", actorIds);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name])) as Record<
        string,
        string | null
      >;
    },
  });

  const filtered = useMemo(() => {
    const typeSet = new Set(types);
    return (q.data ?? []).filter((r) => {
      if (!typeSet.has(r.action as AlertType)) return false;
      if (severity !== "all") {
        const sev = TYPE_META[r.action as AlertType]?.severity;
        if (sev !== severity) return false;
      }
      return true;
    });
  }, [q.data, types, severity]);

  const counts = useMemo(() => {
    const c: Record<AlertType, number> = {
      sign_in_failed: 0,
      security_alert: 0,
      revoke_session: 0,
      sign_out_all: 0,
      reject: 0,
      delete: 0,
    };
    for (const r of q.data ?? []) {
      if (r.action in c) c[r.action as AlertType]++;
    }
    return c;
  }, [q.data]);

  const totalHigh = counts.security_alert + counts.delete;

  const EXPORT_COLUMNS = [
    { header: "When", key: "when" },
    { header: "Type", key: "type" },
    { header: "Severity", key: "severity" },
    { header: "Actor", key: "actor" },
    { header: "Entity type", key: "entity_type" },
    { header: "Entity id", key: "entity_id" },
    { header: "Metadata", key: "metadata" },
  ];

  function exportAlerts(kind: "csv" | "pdf") {
    const rows = filtered.map((r) => {
      const meta = TYPE_META[r.action as AlertType];
      const actorName = r.user_id ? (actors.data?.[r.user_id] ?? r.user_id) : "system";
      return {
        when: format(new Date(r.created_at), "yyyy-MM-dd HH:mm:ss"),
        type: meta?.label ?? r.action,
        severity: meta?.severity ?? "low",
        actor: actorName,
        entity_type: r.entity_type ?? "—",
        entity_id: r.entity_id ?? "—",
        metadata: r.metadata && Object.keys(r.metadata).length ? JSON.stringify(r.metadata) : "",
      };
    });
    if (kind === "csv") {
      downloadCsv("security-alerts", EXPORT_COLUMNS, rows);
    } else {
      downloadPdf("security-alerts", `NEVO CRM — Security Alerts (${range})`, EXPORT_COLUMNS, rows);
    }
  }

  if (!isSuperAdmin) return <AccessDenied />;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" /> Security Alerts
          </h1>
          <p className="text-sm text-muted-foreground">
            Recent security events across auth, sessions, approvals and audited deletes.
            Auto-refresh every 30s.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/admin/security-audit">
              <ShieldCheck className="h-4 w-4" /> Full audit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={filtered.length === 0}
              >
                <Download className="h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportAlerts("csv")}>Download CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAlerts("pdf")}>Download PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => q.refetch()}
            disabled={q.isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile
          label="High severity"
          value={totalHigh}
          tone={totalHigh > 0 ? "bad" : undefined}
        />
        {ALERT_TYPES.map((t) => (
          <StatTile key={t} label={TYPE_META[t].label} value={counts[t]} />
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
          <CardDescription>Filter by time range, alert type or severity.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Time range</div>
            <ToggleGroup
              type="single"
              value={range}
              onValueChange={(v) => v && setRange(v as typeof range)}
              variant="outline"
              size="sm"
            >
              {RANGES.map((r) => (
                <ToggleGroupItem key={r.value} value={r.value}>
                  {r.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Alert type</div>
            <ToggleGroup
              type="multiple"
              value={types}
              onValueChange={(v) => setTypes(v.length ? (v as AlertType[]) : [...ALERT_TYPES])}
              variant="outline"
              size="sm"
              className="flex-wrap justify-start"
            >
              {ALERT_TYPES.map((t) => (
                <ToggleGroupItem key={t} value={t}>
                  {TYPE_META[t].label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-1 min-w-[180px]">
            <div className="text-xs text-muted-foreground">Severity</div>
            <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Events</CardTitle>
          <CardDescription>
            {q.isLoading ? "Loading…" : `${filtered.length} shown · window ${range} · limit 500`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : q.error ? (
            <div className="text-sm text-destructive py-8 text-center">
              Failed to load: {q.error instanceof Error ? q.error.message : String(q.error)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              <CheckCircle2 className="inline h-4 w-4 mr-1 text-emerald-500" />
              No matching security alerts in the selected window.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const meta = TYPE_META[r.action as AlertType];
                  const Icon = meta?.Icon ?? Bell;
                  const actorName = r.user_id
                    ? (actors.data?.[r.user_id] ?? r.user_id.slice(0, 8))
                    : "system";
                  return (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setOpenRow(r)}
                    >
                      <TableCell
                        className="whitespace-nowrap text-xs text-muted-foreground"
                        title={format(new Date(r.created_at), "PPpp")}
                      >
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Icon className="h-3.5 w-3.5" />
                          {meta?.label ?? r.action}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`capitalize ${SEVERITY_COLOR[meta?.severity ?? "low"]}`}>
                          {meta?.severity ?? "low"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{actorName}</TableCell>
                      <TableCell className="text-xs">
                        <span className="font-mono">{r.entity_type ?? "—"}</span>
                        {r.entity_id ? (
                          <span className="text-muted-foreground">
                            {" "}
                            · {r.entity_id.slice(0, 8)}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenRow(r);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!openRow} onOpenChange={(o) => !o && setOpenRow(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              {openRow
                ? (TYPE_META[openRow.action as AlertType]?.label ?? openRow.action)
                : "Event"}
            </DialogTitle>
            <DialogDescription>
              {openRow ? format(new Date(openRow.created_at), "PPpp") : ""}
            </DialogDescription>
          </DialogHeader>
          {openRow && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Actor">
                  {openRow.user_id ? (actors.data?.[openRow.user_id] ?? openRow.user_id) : "system"}
                </Field>
                <Field label="Severity">
                  <Badge
                    className={`capitalize ${SEVERITY_COLOR[TYPE_META[openRow.action as AlertType]?.severity ?? "low"]}`}
                  >
                    {TYPE_META[openRow.action as AlertType]?.severity ?? "low"}
                  </Badge>
                </Field>
                <Field label="Entity type">
                  <span className="font-mono text-xs">{openRow.entity_type ?? "—"}</span>
                </Field>
                <Field label="Entity id">
                  <span className="font-mono text-xs break-all">{openRow.entity_id ?? "—"}</span>
                </Field>
              </div>
              {openRow.metadata && Object.keys(openRow.metadata).length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Metadata
                  </div>
                  <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-72">
                    {JSON.stringify(openRow.metadata, null, 2)}
                  </pre>
                </div>
              )}
              <div className="flex justify-end">
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link to="/admin/security-audit">
                    Open in Security Audit <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone?: "bad" | "warn" }) {
  const toneClass =
    tone === "bad"
      ? "text-rose-600 dark:text-rose-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "";
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground truncate" title={label}>
          {label}
        </div>
        <div className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
