import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  Database,
  Mail,
  Server,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useIsSuperAdmin } from "@/lib/crm-hooks";
import { AccessDenied } from "@/components/crm/AccessDenied";
import { getBackendHealth } from "@/lib/backend-health.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/_authenticated/admin/backend-health")({
  head: () => ({
    meta: [
      { title: "Backend Health — NEVO CRM" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BackendHealthPage,
});

type Health = Awaited<ReturnType<typeof getBackendHealth>>;

function StatusPill({
  ok,
  okLabel = "Healthy",
  badLabel = "Down",
}: {
  ok: boolean;
  okLabel?: string;
  badLabel?: string;
}) {
  return ok ? (
    <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 border-transparent gap-1">
      <CheckCircle2 className="h-3 w-3" /> {okLabel}
    </Badge>
  ) : (
    <Badge className="bg-rose-500/15 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400 border-transparent gap-1">
      <XCircle className="h-3 w-3" /> {badLabel}
    </Badge>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  hint,
  right,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" /> {title}
        </CardTitle>
        {right}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function BackendHealthPage() {
  const isSuperAdmin = useIsSuperAdmin();
  const fetchHealth = useServerFn(getBackendHealth);

  const q = useQuery<Health>({
    queryKey: ["backend-health"],
    enabled: isSuperAdmin,
    queryFn: () => fetchHealth(),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  if (!isSuperAdmin) return <AccessDenied />;

  const h = q.data;
  const loading = q.isLoading && !h;

  const dbOk = h?.database.ok ?? false;
  const apiOk = h?.api.ok ?? false;
  const cronOk = h?.cron.scheduled ?? false;
  const dlqCount =
    (h?.queues.auth_emails_dlq ?? 0) + (h?.queues.transactional_emails_dlq ?? 0);
  const queueDepth =
    (h?.queues.auth_emails ?? 0) + (h?.queues.transactional_emails ?? 0);
  const emailFailed = (h?.email.stats.dlq ?? 0) + (h?.email.stats.failed ?? 0);
  const emailTotal = h?.email.stats.total ?? 0;
  const successRate =
    emailTotal > 0
      ? Math.round(((h?.email.stats.sent ?? 0) / emailTotal) * 100)
      : null;

  const retryUntil = h?.email.state?.retry_after_until
    ? new Date(h.email.state.retry_after_until)
    : null;
  const rateLimited = !!retryUntil && retryUntil.getTime() > Date.now();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6" /> Backend Health
          </h1>
          <p className="text-sm text-muted-foreground">
            Live status of database, API, message queues and email delivery.
            {h && (
              <>
                {" "}Updated{" "}
                <span className="font-medium">
                  {formatDistanceToNow(new Date(h.generatedAt), { addSuffix: true })}
                </span>
                . Auto-refresh every 10s.
              </>
            )}
          </p>
        </div>
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

      {q.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to load health snapshot</AlertTitle>
          <AlertDescription>
            {q.error instanceof Error ? q.error.message : String(q.error)}
          </AlertDescription>
        </Alert>
      )}

      {dlqCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Dead-letter queue has {dlqCount} message{dlqCount === 1 ? "" : "s"}</AlertTitle>
          <AlertDescription>
            One or more emails failed after all retries. Review recent failures below.
          </AlertDescription>
        </Alert>
      )}

      {rateLimited && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Email sender is rate-limited</AlertTitle>
          <AlertDescription>
            Provider asked us to back off. Sending resumes{" "}
            {formatDistanceToNow(retryUntil!, { addSuffix: true })}.
          </AlertDescription>
        </Alert>
      )}

      {/* Top status grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Database}
          title="Database"
          value={loading ? <Skeleton className="h-7 w-20" /> : <StatusPill ok={dbOk} />}
          hint={
            h?.database.latencyMs != null
              ? `Round-trip ${h.database.latencyMs} ms`
              : h?.database.error ?? undefined
          }
        />
        <StatCard
          icon={Server}
          title="API"
          value={loading ? <Skeleton className="h-7 w-20" /> : <StatusPill ok={apiOk} />}
          hint={h ? `Handler executed in ${h.api.elapsedMs} ms` : undefined}
        />
        <StatCard
          icon={Inbox}
          title="Queue depth"
          value={loading ? <Skeleton className="h-7 w-14" /> : queueDepth}
          hint={
            h
              ? `${h.queues.auth_emails} auth · ${h.queues.transactional_emails} app`
              : undefined
          }
          right={
            !loading && (
              <StatusPill
                ok={cronOk}
                okLabel="Cron on"
                badLabel="No cron"
              />
            )
          }
        />
        <StatCard
          icon={Mail}
          title="Email (24h)"
          value={
            loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <>
                {h?.email.stats.sent ?? 0}
                <span className="text-base text-muted-foreground"> / {emailTotal}</span>
              </>
            )
          }
          hint={
            successRate != null
              ? `${successRate}% delivered · ${emailFailed} failed`
              : "No email activity yet"
          }
        />
      </div>

      {/* Detail panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Message queues</CardTitle>
            <CardDescription>
              Live pgmq depth. DLQ &gt; 0 means retries were exhausted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Queue</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">DLQ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Auth emails</TableCell>
                  <TableCell className="text-right">
                    {h?.queues.auth_emails ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DlqCell n={h?.queues.auth_emails_dlq ?? 0} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Transactional emails</TableCell>
                  <TableCell className="text-right">
                    {h?.queues.transactional_emails ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DlqCell n={h?.queues.transactional_emails_dlq ?? 0} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Cron job</span>
              <StatusPill ok={cronOk} okLabel="scheduled" badLabel="unscheduled" />
              {h?.cron.schedule && <span>({h.cron.schedule})</span>}
            </div>
            {h?.metricsError && (
              <p className="text-xs text-rose-500 mt-2">{h.metricsError}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email delivery (last 24h)</CardTitle>
            <CardDescription>
              Deduplicated by message. Latest status per email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                <MiniStat label="Sent" value={h?.email.stats.sent ?? 0} tone="ok" />
                <MiniStat label="Pending" value={h?.email.stats.pending ?? 0} />
                <MiniStat
                  label="Failed"
                  value={h?.email.stats.failed ?? 0}
                  tone={(h?.email.stats.failed ?? 0) > 0 ? "warn" : undefined}
                />
                <MiniStat
                  label="DLQ"
                  value={h?.email.stats.dlq ?? 0}
                  tone={(h?.email.stats.dlq ?? 0) > 0 ? "bad" : undefined}
                />
                <MiniStat label="Suppressed" value={h?.email.stats.suppressed ?? 0} />
                <MiniStat label="Bounced" value={h?.email.stats.bounced ?? 0} />
              </div>
            )}
            {h?.email.state && (
              <div className="text-xs text-muted-foreground border-t pt-3">
                Throughput: batch {h.email.state.batch_size} · delay{" "}
                {h.email.state.send_delay_ms}ms
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent failures</CardTitle>
          <CardDescription>
            Latest failed, DLQ, bounced or complained emails in the last 24h.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : (h?.email.recentFailures.length ?? 0) === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              <CheckCircle2 className="inline h-4 w-4 mr-1 text-emerald-500" />
              No failures in the last 24 hours.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {h!.email.recentFailures.map((f, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {f.template_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">{f.recipient_email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="capitalize">
                        {f.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-md truncate" title={f.error_message ?? ""}>
                      {f.error_message ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DlqCell({ n }: { n: number }) {
  if (n === 0) return <span className="text-muted-foreground">0</span>;
  return (
    <span className="text-rose-600 dark:text-rose-400 font-semibold">{n}</span>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn" | "bad";
}) {
  const color =
    tone === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "bad"
          ? "text-rose-600 dark:text-rose-400"
          : "text-foreground";
  return (
    <div className="rounded-md border bg-card p-2">
      <div className={`text-xl font-semibold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
