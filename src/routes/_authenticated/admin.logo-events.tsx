import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getLogoEvents,
  isCurrentUserAdmin,
  type LogoEventFilters,
} from "@/lib/logo-events.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/logo-events")({
  head: () => ({
    meta: [{ title: "Logo Telemetry — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: LogoEventsAdmin,
});

const BUCKET_MS: Record<NonNullable<LogoEventFilters["bucket"]>, number> = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
};

const WIDTH_BUCKETS: Array<{ label: string; min: number; max: number }> = [
  { label: "<380", min: 0, max: 379 },
  { label: "380–480", min: 380, max: 480 },
  { label: "481–768", min: 481, max: 768 },
  { label: "769–1024", min: 769, max: 1024 },
  { label: "1025–1440", min: 1025, max: 1440 },
  { label: ">1440", min: 1441, max: 99999 },
];

type Row = {
  id: number;
  event_type: "render" | "error";
  variant: string | null;
  stage: string | null;
  device_width: number | null;
  correlation_id: string | null;
  src: string | null;
  next_src: string | null;
  created_at: string;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function LogoEventsAdmin() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(isCurrentUserAdmin);
  const fetchEvents = useServerFn(getLogoEvents);

  const adminQ = useQuery({ queryKey: ["is-admin"], queryFn: () => checkAdmin() });

  const now = Date.now();
  const [from, setFrom] = useState<string>(
    toLocalInput(new Date(now - 24 * 3600 * 1000).toISOString()),
  );
  const [to, setTo] = useState<string>(toLocalInput(new Date(now).toISOString()));
  const [eventType, setEventType] = useState<"all" | "render" | "error">("all");
  const [variant, setVariant] = useState<string>("");
  const [minWidth, setMinWidth] = useState<string>("");
  const [maxWidth, setMaxWidth] = useState<string>("");
  const [bucket, setBucket] = useState<"minute" | "hour" | "day">("hour");

  const filters: LogoEventFilters = useMemo(
    () => ({
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
      eventType,
      variant: variant || null,
      minWidth: minWidth ? Number(minWidth) : null,
      maxWidth: maxWidth ? Number(maxWidth) : null,
      bucket,
    }),
    [from, to, eventType, variant, minWidth, maxWidth, bucket],
  );

  const eventsQ = useQuery({
    queryKey: ["logo-events", filters],
    queryFn: () => fetchEvents({ data: filters }),
    enabled: !!adminQ.data?.admin,
  });

  const signOut = useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
    onSuccess: () => navigate({ to: "/auth" }),
  });

  if (adminQ.isLoading) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </Shell>
    );
  }
  if (!adminQ.data?.admin) {
    return (
      <Shell>
        <div className="border border-border rounded-lg p-6 bg-card space-y-3 max-w-lg">
          <h2 className="text-lg font-semibold">Not authorized</h2>
          <p className="text-sm text-muted-foreground">
            Your account isn't an admin. Ask a project owner to grant you the <code>admin</code>{" "}
            role in Lovable Cloud (insert a row in <code>user_roles</code> with your user id and
            role <code>admin</code>).
          </p>
          <Button variant="outline" onClick={() => signOut.mutate()}>
            Sign out
          </Button>
        </div>
      </Shell>
    );
  }

  const rows = (eventsQ.data?.rows ?? []) as Row[];
  const variants = eventsQ.data?.variants ?? [];

  // Time-series aggregation
  const bucketMs = BUCKET_MS[bucket];
  const seriesMap = new Map<number, { t: number; render: number; error: number }>();
  for (const r of rows) {
    const ts = new Date(r.created_at).getTime();
    const t = Math.floor(ts / bucketMs) * bucketMs;
    const cur = seriesMap.get(t) ?? { t, render: 0, error: 0 };
    cur[r.event_type] += 1;
    seriesMap.set(t, cur);
  }
  const series = Array.from(seriesMap.values())
    .sort((a, b) => a.t - b.t)
    .map((p) => ({
      ...p,
      label: format(p.t, bucket === "day" ? "MMM d" : bucket === "hour" ? "MMM d HH:00" : "HH:mm"),
    }));

  // Variant breakdown
  const variantMap = new Map<string, { variant: string; render: number; error: number }>();
  for (const r of rows) {
    const v = r.variant ?? "(unknown)";
    const cur = variantMap.get(v) ?? { variant: v, render: 0, error: 0 };
    cur[r.event_type] += 1;
    variantMap.set(v, cur);
  }
  const byVariant = Array.from(variantMap.values()).sort(
    (a, b) => b.render + b.error - (a.render + a.error),
  );

  // Device width buckets
  const widthCounts = WIDTH_BUCKETS.map((b) => ({ label: b.label, render: 0, error: 0 }));
  for (const r of rows) {
    const w = r.device_width;
    if (w == null) continue;
    const idx = WIDTH_BUCKETS.findIndex((b) => w >= b.min && w <= b.max);
    if (idx >= 0) widthCounts[idx][r.event_type] += 1;
  }

  const totals = rows.reduce(
    (acc, r) => {
      acc[r.event_type] += 1;
      return acc;
    },
    { render: 0, error: 0 },
  );
  const errorRate =
    totals.render + totals.error > 0
      ? ((totals.error / (totals.render + totals.error)) * 100).toFixed(1)
      : "0.0";

  return (
    <Shell>
      <div className="flex flex-wrap items-end gap-3 p-4 border border-border rounded-lg bg-card">
        <div className="space-y-1">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">To</Label>
          <Input id="to" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Event type</Label>
          <Select value={eventType} onValueChange={(v) => setEventType(v as any)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="render">Render</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Variant</Label>
          <Select
            value={variant || "__all"}
            onValueChange={(v) => setVariant(v === "__all" ? "" : v)}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All variants</SelectItem>
              {(variants as string[]).map((v: string) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="minw">Min width</Label>
          <Input
            id="minw"
            type="number"
            className="w-24"
            value={minWidth}
            onChange={(e) => setMinWidth(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="maxw">Max width</Label>
          <Input
            id="maxw"
            type="number"
            className="w-24"
            value={maxWidth}
            onChange={(e) => setMaxWidth(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Bucket</Label>
          <Select value={bucket} onValueChange={(v) => setBucket(v as any)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minute">Minute</SelectItem>
              <SelectItem value="hour">Hour</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => eventsQ.refetch()} disabled={eventsQ.isFetching}>
            {eventsQ.isFetching ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="ghost" onClick={() => signOut.mutate()}>
            Sign out
          </Button>
        </div>
      </div>

      {eventsQ.isError && (
        <p className="text-sm text-destructive">
          Failed to load: {(eventsQ.error as Error).message}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat label="Total events" value={rows.length} />
        <Stat label="Renders" value={totals.render} accent="text-emerald-600" />
        <Stat
          label="Errors"
          value={totals.error}
          accent="text-red-600"
          sub={`${errorRate}% error rate`}
        />
      </div>

      <Panel title="Events over time">
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="render" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="error" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="By variant">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={byVariant}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="variant"
                  fontSize={11}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="render" fill="#10b981" stackId="s" />
                <Bar dataKey="error" fill="#ef4444" stackId="s" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="By device width">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={widthCounts}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="render" fill="#10b981" stackId="s" />
                <Bar dataKey="error" fill="#ef4444" stackId="s" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title={`Recent events (${Math.min(rows.length, 100)} of ${rows.length})`}>
        <div className="overflow-auto max-h-96 border border-border rounded">
          <table className="w-full text-xs">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="text-left p-2">Time</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Variant</th>
                <th className="text-left p-2">Stage</th>
                <th className="text-right p-2">Width</th>
                <th className="text-left p-2">Correlation</th>
                <th className="text-left p-2">Src</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-2 whitespace-nowrap">
                    {format(new Date(r.created_at), "MMM d HH:mm:ss")}
                  </td>
                  <td
                    className={`p-2 ${r.event_type === "error" ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {r.event_type}
                  </td>
                  <td className="p-2">{r.variant ?? "—"}</td>
                  <td className="p-2">{r.stage ?? "—"}</td>
                  <td className="p-2 text-right">{r.device_width ?? "—"}</td>
                  <td
                    className="p-2 font-mono text-[10px] truncate max-w-[140px]"
                    title={r.correlation_id ?? undefined}
                  >
                    {r.correlation_id ?? "—"}
                  </td>
                  <td className="p-2 truncate max-w-[280px]" title={r.src ?? undefined}>
                    {r.src ?? "—"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !eventsQ.isFetching && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No events in this window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Header logo telemetry</h1>
          <p className="text-sm text-muted-foreground">
            Renders vs errors, by variant, device width, and time.
          </p>
        </div>
      </header>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: number | string;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-3xl font-semibold mt-1 ${accent ?? ""}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border rounded-lg p-4 bg-card space-y-2">
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}
