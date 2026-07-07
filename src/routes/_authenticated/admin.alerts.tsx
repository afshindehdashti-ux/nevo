import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow, format } from "date-fns";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Filter,
  Inbox,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useIsSuperAdmin } from "@/lib/crm-hooks";
import { AccessDenied } from "@/components/crm/AccessDenied";
import {
  listAlerts,
  getAlertDetail,
  type AlertRow,
  type AlertStatus,
} from "@/lib/alerts.functions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const Route = createFileRoute("/_authenticated/admin/alerts")({
  head: () => ({
    meta: [
      { title: "Backend Alerts — NEVO CRM" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AlertsPage,
});

const STATUS_OPTIONS: AlertStatus[] = ["dlq", "failed", "bounced", "complained"];
const WINDOWS: Array<{ label: string; hours: number }> = [
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
];

function statusColor(status: string) {
  switch (status) {
    case "dlq":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-transparent";
    case "failed":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-transparent";
    case "bounced":
      return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-transparent";
    case "complained":
      return "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-transparent";
    default:
      return "";
  }
}

function AlertsPage() {
  const isSuperAdmin = useIsSuperAdmin();
  const fetchAlerts = useServerFn(listAlerts);
  const fetchDetail = useServerFn(getAlertDetail);

  const [hours, setHours] = useState(24);
  const [statuses, setStatuses] = useState<AlertStatus[]>([...STATUS_OPTIONS]);
  const [template, setTemplate] = useState<string>("__all");
  const [search, setSearch] = useState("");
  const [openMsg, setOpenMsg] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["alerts", hours, statuses, template, search],
    enabled: isSuperAdmin,
    queryFn: () =>
      fetchAlerts({
        data: {
          hours,
          statuses,
          template: template === "__all" ? null : template,
          search: search || null,
        },
      }),
    refetchInterval: 30_000,
  });

  const detail = useQuery({
    queryKey: ["alert-detail", openMsg],
    enabled: !!openMsg && isSuperAdmin,
    queryFn: () => fetchDetail({ data: { messageId: openMsg! } }),
  });

  const data = q.data;
  const rows = data?.rows ?? [];
  const counts = data?.counts;

  const queueDlqTotal = useMemo(
    () =>
      (data?.queues.auth_emails_dlq ?? 0) +
      (data?.queues.transactional_emails_dlq ?? 0),
    [data],
  );

  if (!isSuperAdmin) return <AccessDenied />;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" /> Backend Alerts
          </h1>
          <p className="text-sm text-muted-foreground">
            Recent backend failures and dead-letter queue events. Auto-refresh
            every 30s.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => q.refetch()}
          disabled={q.isFetching}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {q.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to load alerts</AlertTitle>
          <AlertDescription>
            {q.error instanceof Error ? q.error.message : String(q.error)}
          </AlertDescription>
        </Alert>
      )}

      {queueDlqTotal > 0 && (
        <Alert variant="destructive">
          <Inbox className="h-4 w-4" />
          <AlertTitle>
            Dead-letter queue holds {queueDlqTotal} message
            {queueDlqTotal === 1 ? "" : "s"}
          </AlertTitle>
          <AlertDescription>
            {data?.queues.auth_emails_dlq ?? 0} auth ·{" "}
            {data?.queues.transactional_emails_dlq ?? 0} transactional. Retries
            exhausted for these messages.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MiniStat label="Total" value={counts?.total ?? 0} />
        <MiniStat
          label="DLQ"
          value={counts?.dlq ?? 0}
          tone={(counts?.dlq ?? 0) > 0 ? "bad" : undefined}
        />
        <MiniStat
          label="Failed"
          value={counts?.failed ?? 0}
          tone={(counts?.failed ?? 0) > 0 ? "warn" : undefined}
        />
        <MiniStat label="Bounced" value={counts?.bounced ?? 0} />
        <MiniStat label="Complained" value={counts?.complained ?? 0} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
          <CardDescription>
            Refine by time window, event type, template or free text.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Window</div>
            <ToggleGroup
              type="single"
              value={String(hours)}
              onValueChange={(v) => v && setHours(Number(v))}
              variant="outline"
              size="sm"
            >
              {WINDOWS.map((w) => (
                <ToggleGroupItem key={w.hours} value={String(w.hours)}>
                  {w.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Event type</div>
            <ToggleGroup
              type="multiple"
              value={statuses}
              onValueChange={(v) =>
                setStatuses(
                  v.length ? (v as AlertStatus[]) : [...STATUS_OPTIONS],
                )
              }
              variant="outline"
              size="sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <ToggleGroupItem key={s} value={s} className="capitalize">
                  {s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-1 min-w-[200px]">
            <div className="text-xs text-muted-foreground">Template</div>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All templates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All templates</SelectItem>
                {(data?.templates ?? []).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 flex-1 min-w-[220px]">
            <div className="text-xs text-muted-foreground">Search</div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Recipient, error, message id…"
                className="pl-8 h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Events</CardTitle>
          <CardDescription>
            {q.isLoading
              ? "Loading…"
              : `${rows.length} shown · window ${hours}h`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              <CheckCircle2 className="inline h-4 w-4 mr-1 text-emerald-500" />
              No matching alerts.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow
                    key={r.message_id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setOpenMsg(r.message_id)}
                  >
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`capitalize gap-1 ${statusColor(r.status)}`}
                      >
                        <XCircle className="h-3 w-3" /> {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.template_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.recipient_email ?? "—"}
                    </TableCell>
                    <TableCell
                      className="text-xs max-w-sm truncate"
                      title={r.error_message ?? ""}
                    >
                      {r.error_message ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMsg(r.message_id);
                        }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!openMsg} onOpenChange={(o) => !o && setOpenMsg(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Alert detail</SheetTitle>
            <SheetDescription className="font-mono text-xs break-all">
              {openMsg}
            </SheetDescription>
          </SheetHeader>

          {detail.isLoading ? (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : detail.data ? (
            <DetailBody
              row={rows.find((r) => r.message_id === openMsg) ?? null}
              detail={detail.data}
            />
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              No history found.
            </p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailBody({
  row,
  detail,
}: {
  row: AlertRow | null;
  detail: Awaited<ReturnType<typeof getAlertDetail>>;
}) {
  const latest = detail.latest ?? row;
  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Status">
          {latest ? (
            <Badge className={`capitalize ${statusColor(latest.status)}`}>
              {latest.status}
            </Badge>
          ) : (
            "—"
          )}
        </Field>
        <Field label="Template">
          <span className="font-mono text-xs">
            {latest?.template_name ?? "—"}
          </span>
        </Field>
        <Field label="Recipient">{latest?.recipient_email ?? "—"}</Field>
        <Field label="Last event">
          {latest?.created_at
            ? format(new Date(latest.created_at), "PPpp")
            : "—"}
        </Field>
      </div>

      {latest?.error_message && (
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Error message
          </div>
          <pre className="text-xs bg-muted rounded-md p-3 whitespace-pre-wrap break-all">
            {latest.error_message}
          </pre>
        </div>
      )}

      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Timeline ({detail.timeline.length})
        </div>
        <ol className="space-y-2">
          {detail.timeline.map((t) => (
            <li
              key={t.id}
              className="border rounded-md p-2 text-xs bg-card space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge
                  className={`capitalize ${statusColor(t.status)}`}
                  variant="outline"
                >
                  {t.status}
                </Badge>
                <span className="text-muted-foreground">
                  {format(new Date(t.created_at), "PPpp")}
                </span>
              </div>
              {t.error_message && (
                <div className="text-rose-600 dark:text-rose-400 break-words">
                  {t.error_message}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {latest?.metadata && Object.keys(latest.metadata).length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Metadata
          </div>
          <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-72">
            {JSON.stringify(latest.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warn" | "bad";
}) {
  const color =
    tone === "bad"
      ? "text-rose-600 dark:text-rose-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-foreground";
  return (
    <div className="rounded-md border bg-card p-3">
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
