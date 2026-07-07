import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsSuperAdmin, useMyRoles } from "@/lib/crm-hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Download,
  Search,
  LogIn,
  UserCog,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

/**
 * Security Audit — filtered view of activity_logs focused on
 * security-sensitive events emitted by SECURITY DEFINER functions:
 *   - sign_in (auth-audit server fn)
 *   - approve / reject / cancel (decide_approval_request)
 *   - delete (log_row_delete trigger on privileged tables)
 *   - role changes on user_roles
 * Super Admin only. Includes filters + CSV export.
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

const CATEGORIES = [
  { value: "all", label: "All security events" },
  { value: "sign_in", label: "Sign-ins" },
  { value: "approvals", label: "Approvals (approve/reject/cancel)" },
  { value: "role_changes", label: "Role changes" },
  { value: "deletes", label: "Deletes (audited tables)" },
] as const;

const CATEGORY_FILTER: Record<
  (typeof CATEGORIES)[number]["value"],
  (r: LogRow) => boolean
> = {
  all: () => true,
  sign_in: (r) => r.action === "sign_in",
  approvals: (r) =>
    ["approve", "reject", "cancel"].includes(r.action) ||
    (r.entity_type ?? "").startsWith("approval:"),
  role_changes: (r) => r.entity_type === "user_roles",
  deletes: (r) => r.action === "delete",
};

export const Route = createFileRoute("/_authenticated/admin/security-audit")({
  head: () => ({
    meta: [
      { title: "Security Audit — NEVO CRM" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SecurityAuditPage,
});

function SecurityAuditPage() {
  const isSuperAdmin = useIsSuperAdmin();
  const { isLoading: rolesLoading } = useMyRoles();
  const queryClient = useQueryClient();

  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]["value"]>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [actor, setActor] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LogRow | null>(null);
  const [actorDetail, setActorDetail] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "off">(
    "connecting",
  );

  // Real-time refresh — subscribe to inserts on activity_logs and invalidate
  // the audit query whenever a security-significant event lands. Filtering on
  // `action=in.(...)` at the server keeps this quiet: no traffic for ordinary
  // approvals-log/updated-by chatter that doesn't belong on this page.
  useEffect(() => {
    if (!isSuperAdmin) return;
    const channel = supabase
      .channel("security-audit-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_logs",
          filter: "action=in.(sign_in,approve,reject,cancel,delete)",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["security-audit"] });
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setLiveStatus("live");
        else if (status === "CHANNEL_ERROR" || status === "CLOSED")
          setLiveStatus("off");
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSuperAdmin, queryClient]);

  const logsQ = useQuery({
    enabled: isSuperAdmin,
    queryKey: ["security-audit", { category, dateFrom, dateTo, actor }],
    queryFn: async () => {
      let q = supabase
        .from("activity_logs")
        .select("id,user_id,action,entity_type,entity_id,metadata,created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      // Server-side pre-filter for the categories that map to a single column
      if (category === "sign_in") q = q.eq("action", "sign_in");
      else if (category === "role_changes") q = q.eq("entity_type", "user_roles");
      else if (category === "deletes") q = q.eq("action", "delete");
      else if (category === "approvals")
        q = q.in("action", ["approve", "reject", "cancel"]);
      else {
        // "all" — only security-significant actions
        q = q.in("action", [
          "sign_in",
          "approve",
          "reject",
          "cancel",
          "delete",
        ]);
      }

      if (actor !== "all")
        q = actor === "system" ? q.is("user_id", null) : q.eq("user_id", actor);
      if (dateFrom) q = q.gte("created_at", new Date(dateFrom).toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        q = q.lte("created_at", end.toISOString());
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as LogRow[];
    },
  });

  const actorIds = useMemo(() => {
    const ids = new Set<string>();
    logsQ.data?.forEach((l) => l.user_id && ids.add(l.user_id));
    return Array.from(ids);
  }, [logsQ.data]);

  const profilesQ = useQuery({
    enabled: isSuperAdmin && actorIds.length > 0,
    queryKey: ["security-audit-actors", actorIds.sort().join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", actorIds);
      if (error) throw error;
      const map = new Map<string, string>();
      (data ?? []).forEach((p) => map.set(p.id, p.full_name ?? p.id));
      return map;
    },
  });

  const actorOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: "all", label: "All actors" },
      { value: "system", label: "System (no user)" },
    ];
    profilesQ.data?.forEach((label, id) => opts.push({ value: id, label }));
    return opts;
  }, [profilesQ.data]);

  const filteredRows = useMemo(() => {
    const rows = logsQ.data ?? [];
    const passesCategory = CATEGORY_FILTER[category];
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (!passesCategory(r)) return false;
      if (!q) return true;
      const meta = JSON.stringify(r.metadata).toLowerCase();
      return (
        (r.entity_id ?? "").toLowerCase().includes(q) ||
        (r.entity_type ?? "").toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q) ||
        meta.includes(q)
      );
    });
  }, [logsQ.data, category, search]);

  const stats = useMemo(() => {
    const s = { signIn: 0, approvals: 0, deletes: 0, roleChanges: 0 };
    for (const r of filteredRows) {
      if (r.action === "sign_in") s.signIn++;
      if (["approve", "reject", "cancel"].includes(r.action)) s.approvals++;
      if (r.action === "delete") s.deletes++;
      if (r.entity_type === "user_roles") s.roleChanges++;
    }
    return s;
  }, [filteredRows]);

  function exportCsv() {
    // Mirror the on-screen table exactly: same columns, same formatting,
    // and only the rows currently visible after filters + search.
    const header = ["When", "Actor", "Event", "Scope", "IP / Detail"];
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [header.map(escape).join(",")];
    filteredRows.forEach((r) => {
      const md = r.metadata as {
        ip?: string | null;
        country?: string | null;
      };
      const when = format(new Date(r.created_at), "yyyy-MM-dd HH:mm:ss");
      const actor = r.user_id
        ? (profilesQ.data?.get(r.user_id) ?? r.user_id)
        : "system";
      const event = EVENT_LABELS[r.action] ?? r.action;
      const scope = r.entity_id
        ? `${r.entity_type ?? "—"} (${r.entity_id})`
        : (r.entity_type ?? "—");
      const ipDetail =
        r.action === "sign_in" && md?.ip
          ? md.country
            ? `${md.ip} (${md.country})`
            : md.ip
          : "—";
      lines.push([when, actor, event, scope, ipDetail].map(escape).join(","));
    });
    // BOM so Excel opens UTF-8 correctly.
    const blob = new Blob(["\ufeff" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-audit-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (rolesLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Checking permissions…
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Restricted</AlertTitle>
          <AlertDescription>
            The security audit log is available to Super Admins only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">Security Audit</h1>
            <p className="text-sm text-muted-foreground">
              Sign-ins, approvals, role changes and deletes recorded by
              privileged server functions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              "inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border " +
              (liveStatus === "live"
                ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                : liveStatus === "connecting"
                  ? "border-muted-foreground/30 text-muted-foreground"
                  : "border-destructive/40 text-destructive")
            }
            aria-live="polite"
          >
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (liveStatus === "live"
                  ? "bg-emerald-500 animate-pulse"
                  : liveStatus === "connecting"
                    ? "bg-muted-foreground/60"
                    : "bg-destructive")
              }
            />
            {liveStatus === "live"
              ? "Live"
              : liveStatus === "connecting"
                ? "Connecting…"
                : "Offline"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={!filteredRows.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MiniStat icon={LogIn} label="Sign-ins" value={stats.signIn} />
        <MiniStat
          icon={CheckCircle2}
          label="Approval decisions"
          value={stats.approvals}
        />
        <MiniStat icon={UserCog} label="Role changes" value={stats.roleChanges} />
        <MiniStat icon={Trash2} label="Deletes" value={stats.deletes} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Latest 1,000 security-significant entries.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Actor</Label>
            <Select value={actor} onValueChange={setActor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actorOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="id, IP, metadata…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {logsQ.isLoading ? "Loading…" : `${filteredRows.length} entries`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logsQ.error ? (
            <Alert variant="destructive">
              <AlertTitle>Failed to load audit log</AlertTitle>
              <AlertDescription>
                {(logsQ.error as Error).message}
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[170px]">When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>IP / Detail</TableHead>
                  <TableHead className="w-[80px] text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 && !logsQ.isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No matching security events.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => {
                    const md = row.metadata as {
                      ip?: string | null;
                      country?: string | null;
                    };
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-mono text-xs">
                            {format(
                              new Date(row.created_at),
                              "yyyy-MM-dd HH:mm:ss",
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(row.created_at), {
                              addSuffix: true,
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.user_id ? (
                            <button
                              type="button"
                              onClick={() => setActorDetail(row.user_id)}
                              className="text-left text-primary hover:underline focus:outline-none focus:underline"
                              title="View actor profile and recent events"
                            >
                              {profilesQ.data?.get(row.user_id) ?? (
                                <span className="font-mono text-xs">
                                  {row.user_id.slice(0, 8)}…
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="text-muted-foreground italic">
                              system
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <EventBadge action={row.action} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {row.entity_type ?? "—"}
                          {row.entity_id && (
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {row.entity_id.slice(0, 8)}…
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.action === "sign_in" && md?.ip ? (
                            <span>
                              {md.ip}
                              {md.country ? (
                                <span className="ml-1 text-muted-foreground">
                                  ({md.country})
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelected(row)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Security event</DialogTitle>
            <DialogDescription>
              {selected
                ? `${selected.action} · ${selected.entity_type ?? "—"} · ${format(
                    new Date(selected.created_at),
                    "PPpp",
                  )}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <MetaField label="Actor">
                  {selected.user_id ? (
                    <button
                      type="button"
                      onClick={() => setActorDetail(selected.user_id)}
                      className="text-left text-primary hover:underline"
                    >
                      {profilesQ.data?.get(selected.user_id) ??
                        selected.user_id}
                    </button>
                  ) : (
                    "system"
                  )}
                </MetaField>
                <MetaField label="Record ID">
                  {selected.entity_id ?? "—"}
                </MetaField>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Metadata & snapshot
                </Label>
                <pre className="mt-2 max-h-[420px] overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(selected.metadata, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ActorDetailDialog
        userId={actorDetail}
        onOpenChange={(open) => !open && setActorDetail(null)}
        onFilterByActor={(id) => {
          setActor(id);
          setActorDetail(null);
        }}
        onViewEvent={(row) => {
          setActorDetail(null);
          setSelected(row);
        }}
      />
    </div>
  );
}

function MetaField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1 font-mono text-xs break-all">{children}</div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

const EVENT_LABELS: Record<string, string> = {
  sign_in: "sign in",
  approve: "approve",
  reject: "reject",
  cancel: "cancel",
  delete: "delete",
};

function EventBadge({ action }: { action: string }) {
  const map: Record<
    string,
    { icon: React.ComponentType<{ className?: string }>; cls: string }
  > = {
    sign_in: {
      icon: LogIn,
      cls: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    },
    approve: {
      icon: CheckCircle2,
      cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    reject: {
      icon: XCircle,
      cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    },
    cancel: {
      icon: XCircle,
      cls: "bg-muted text-muted-foreground",
    },
    delete: {
      icon: Trash2,
      cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    },
  };
  const cfg = map[action] ?? { icon: ShieldCheck, cls: "bg-muted text-muted-foreground" };
  const Icon = cfg.icon;
  const label = EVENT_LABELS[action] ?? action;
  return (
    <Badge className={`gap-1 border-transparent ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function ActorDetailDialog({
  userId,
  onOpenChange,
  onFilterByActor,
  onViewEvent,
}: {
  userId: string | null;
  onOpenChange: (open: boolean) => void;
  onFilterByActor: (id: string) => void;
  onViewEvent: (row: LogRow) => void;
}) {
  const profileQ = useQuery({
    enabled: !!userId,
    queryKey: ["security-audit-actor-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, job_title, phone, created_at, last_login_at, is_active")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const rolesQ = useQuery({
    enabled: !!userId,
    queryKey: ["security-audit-actor-roles", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as string);
    },
  });

  const eventsQ = useQuery({
    enabled: !!userId,
    queryKey: ["security-audit-actor-events", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id,user_id,action,entity_type,entity_id,metadata,created_at")
        .eq("user_id", userId!)
        .in("action", ["sign_in", "approve", "reject", "cancel", "delete"])
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data ?? []) as LogRow[];
    },
  });

  const profile = profileQ.data as
    | {
        id: string;
        full_name: string | null;
        email: string | null;
        phone: string | null;
        created_at: string | null;
      }
    | null
    | undefined;

  return (
    <Dialog open={!!userId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Actor profile</DialogTitle>
          <DialogDescription>
            Recent security events attributed to this user.
          </DialogDescription>
        </DialogHeader>

        {!userId ? null : profileQ.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading profile…</div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <MetaField label="Name">{profile?.full_name ?? "—"}</MetaField>
              <MetaField label="Email">{profile?.email ?? "—"}</MetaField>
              <MetaField label="Phone">{profile?.phone ?? "—"}</MetaField>
              <MetaField label="User ID">{userId}</MetaField>
              <MetaField label="Joined">
                {profile?.created_at
                  ? format(new Date(profile.created_at), "PPpp")
                  : "—"}
              </MetaField>
              <MetaField label="Roles">
                {rolesQ.data && rolesQ.data.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {rolesQ.data.map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">
                        {r}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  "—"
                )}
              </MetaField>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/admin/users">Manage in Users & Roles</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onFilterByActor(userId)}
              >
                Filter audit by this actor
              </Button>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Recent security events (25 most recent)
              </Label>
              <div className="mt-2 max-h-[360px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">When</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead className="w-[70px] text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventsQ.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                          Loading…
                        </TableCell>
                      </TableRow>
                    ) : (eventsQ.data ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                          No security events recorded for this user.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (eventsQ.data ?? []).map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-nowrap font-mono text-xs">
                            {format(new Date(row.created_at), "yyyy-MM-dd HH:mm")}
                            <div className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(row.created_at), {
                                addSuffix: true,
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <EventBadge action={row.action} />
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.entity_type ?? "—"}
                            {row.entity_id && (
                              <div className="font-mono text-[10px] text-muted-foreground">
                                {row.entity_id.slice(0, 8)}…
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewEvent(row)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
