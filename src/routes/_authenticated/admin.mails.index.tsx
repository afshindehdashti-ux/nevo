import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listEmailLogs, type EmailLogFilters } from "@/lib/mail-hub.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/mails/")({
  component: MailLogDashboard,
});

type Row = {
  id: string | number;
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string | null;
  error_message: string | null;
  metadata: unknown;
  created_at: string;
};

const RANGES = [
  { label: "24h", ms: 24 * 3600_000 },
  { label: "7d", ms: 7 * 86400_000 },
  { label: "30d", ms: 30 * 86400_000 },
];

function statusBadge(status: string | null) {
  const s = (status ?? "").toLowerCase();
  if (s === "sent") return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">Sent</Badge>;
  if (s === "failed" || s === "dlq" || s === "bounced") return <Badge variant="destructive">Failed</Badge>;
  if (s === "suppressed") return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">Suppressed</Badge>;
  if (s === "pending") return <Badge variant="secondary">Pending</Badge>;
  if (s === "complained") return <Badge variant="destructive">Complained</Badge>;
  return <Badge variant="outline">{status ?? "—"}</Badge>;
}

function MailLogDashboard() {
  const fetchLogs = useServerFn(listEmailLogs);
  const [rangeMs, setRangeMs] = useState<number>(7 * 86400_000);
  const [template, setTemplate] = useState<string>("all");
  const [status, setStatus] = useState<EmailLogFilters["status"]>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Row | null>(null);

  // Debounce search
  useMemo(() => {
    const h = setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0);
    }, 250);
    return () => clearTimeout(h);
  }, [search]);

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - rangeMs);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [rangeMs]);

  const query = useQuery({
    queryKey: ["mail-logs", range.from, range.to, template, status, debouncedSearch, offset],
    queryFn: () =>
      fetchLogs({
        data: {
          from: range.from,
          to: range.to,
          template: template === "all" ? null : template,
          status,
          search: debouncedSearch || null,
          limit: 50,
          offset,
        },
      }),
    staleTime: 15_000,
  });

  const data = query.data;
  const rows = (data?.rows ?? []) as unknown as Row[];
  const stats = data?.stats ?? { total: 0, sent: 0, failed: 0, suppressed: 0, pending: 0 };
  const templates = data?.templates ?? [];

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} tone="default" />
        <StatCard label="Sent" value={stats.sent} tone="green" />
        <StatCard label="Failed" value={stats.failed} tone="red" />
        <StatCard label="Suppressed" value={stats.suppressed} tone="amber" />
        <StatCard label="Pending" value={stats.pending} tone="blue" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 bg-muted/40 border border-border rounded-lg p-3">
        <div className="flex items-center gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.label}
              size="sm"
              variant={rangeMs === r.ms ? "default" : "outline"}
              onClick={() => { setRangeMs(r.ms); setOffset(0); }}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Template</Label>
          <Select value={template} onValueChange={(v) => { setTemplate(v); setOffset(0); }}>
            <SelectTrigger className="h-8 w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All templates</SelectItem>
              {templates.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={(v) => { setStatus(v as EmailLogFilters["status"]); setOffset(0); }}>
            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="suppressed">Suppressed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Recipient</Label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email…" className="h-8" />
        </div>
        <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
          {query.isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg bg-background overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Template</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-44">Timestamp</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : query.error ? (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-destructive py-8">{(query.error as Error).message}</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No emails in this range.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id} onClick={() => setSelected(r)} className="cursor-pointer">
                <TableCell className="text-xs font-mono">{r.template_name ?? "—"}</TableCell>
                <TableCell className="text-sm">{r.recipient_email ?? "—"}</TableCell>
                <TableCell>{statusBadge(r.status)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, HH:mm:ss")}</TableCell>
                <TableCell className="text-xs text-destructive truncate max-w-[300px]">{r.error_message ?? ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {rows.length} of {stats.total}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>Prev</Button>
          <Button size="sm" variant="outline" disabled={offset + 50 >= stats.total} onClick={() => setOffset(offset + 50)}>Next</Button>
        </div>
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Email detail</SheetTitle>
            <SheetDescription className="text-xs font-mono">{selected?.message_id}</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-3 text-sm">
              <DetailRow label="Template" value={selected.template_name ?? "—"} />
              <DetailRow label="Recipient" value={selected.recipient_email ?? "—"} />
              <DetailRow label="Status" value={<div>{statusBadge(selected.status)}</div>} />
              <DetailRow label="Timestamp" value={format(new Date(selected.created_at), "PPpp")} />
              {selected.error_message && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Error</div>
                  <pre className="text-xs bg-destructive/10 text-destructive p-2 rounded whitespace-pre-wrap">{selected.error_message}</pre>
                </div>
              )}
              {!!selected.metadata && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Metadata</div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(selected.metadata as unknown, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "default" | "green" | "red" | "amber" | "blue" }) {
  const toneClass = {
    default: "border-border",
    green: "border-emerald-200 bg-emerald-50/50",
    red: "border-red-200 bg-red-50/50",
    amber: "border-amber-200 bg-amber-50/50",
    blue: "border-blue-200 bg-blue-50/50",
  }[tone];
  return (
    <div className={`border rounded-lg p-3 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm text-right">{value}</div>
    </div>
  );
}
