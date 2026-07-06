import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsSuperAdmin, useMyRoles } from "@/lib/crm-hooks";
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
import { ShieldAlert, ScrollText, Search, Download } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "super_admin", label: "Super Admin" },
  { value: "management", label: "Management" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "read_only", label: "Read Only" },
  { value: "none", label: "No role / system" },
];

type LogRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const ACTION_OPTIONS = [
  "all",
  "sign_in",
  "delete",
  "update",
  "approve",
  "create",
] as const;
const ENTITY_OPTIONS = [
  "all",
  "auth",
  "customers",
  "suppliers",
  "products",
  "project_inquiries",
  "solutions_inspection",
  "user_roles",
  "profiles",
] as const;


export const Route = createFileRoute("/_authenticated/admin/activity")({
  head: () => ({
    meta: [{ title: "Activity Log — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const isSuperAdmin = useIsSuperAdmin();
  const { isLoading: rolesLoading } = useMyRoles();

  const [actor, setActor] = useState<string>("all");
  const [action, setAction] = useState<string>("all");
  const [entity, setEntity] = useState<string>("all");
  const [role, setRole] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LogRow | null>(null);

  const logsQ = useQuery({
    enabled: isSuperAdmin,
    queryKey: ["activity-logs", { actor, action, entity, dateFrom, dateTo }],
    queryFn: async () => {
      let q = supabase
        .from("activity_logs")
        .select("id,user_id,action,entity_type,entity_id,metadata,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (actor !== "all") q = actor === "system" ? q.is("user_id", null) : q.eq("user_id", actor);
      if (action !== "all") q = q.eq("action", action);
      if (entity !== "all") q = q.eq("entity_type", entity);
      if (dateFrom) q = q.gte("created_at", new Date(dateFrom).toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        q = q.lte("created_at", end.toISOString());
      }

  const logsQ = useQuery({
    enabled: isSuperAdmin,
    queryKey: ["activity-logs", { actor, action, entity }],
    queryFn: async () => {
      let q = supabase
        .from("activity_logs")
        .select("id,user_id,action,entity_type,entity_id,metadata,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (actor !== "all") q = actor === "system" ? q.is("user_id", null) : q.eq("user_id", actor);
      if (action !== "all") q = q.eq("action", action);
      if (entity !== "all") q = q.eq("entity_type", entity);
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
    queryKey: ["activity-log-actors", actorIds.sort().join(",")],
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
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const meta = JSON.stringify(r.metadata).toLowerCase();
      return (
        (r.entity_id ?? "").toLowerCase().includes(q) ||
        (r.entity_type ?? "").toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q) ||
        meta.includes(q)
      );
    });
  }, [logsQ.data, search]);

  if (rolesLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Checking permissions…</div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Restricted</AlertTitle>
          <AlertDescription>
            The activity audit log is available to Super Admins only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Activity Log</h1>
          <p className="text-sm text-muted-foreground">
            Every important action across the CRM — creates, edits, approvals, deletes.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Narrow the log by actor, action type or record type. Showing latest 500 matches.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <Label>Actor</Label>
            <Select value={actor} onValueChange={setActor}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {actorOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((a) => (
                  <SelectItem key={a} value={a}>{a === "all" ? "All actions" : a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Record type</Label>
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENTITY_OPTIONS.map((e) => (
                  <SelectItem key={e} value={e}>{e === "all" ? "All record types" : e}</SelectItem>
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
                placeholder="id, snapshot, metadata…"
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
              <AlertTitle>Failed to load logs</AlertTitle>
              <AlertDescription>{(logsQ.error as Error).message}</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Record type</TableHead>
                  <TableHead>Record / IP</TableHead>
                  <TableHead className="w-[100px] text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 && !logsQ.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No matching activity.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => {
                    const ip =
                      row.action === "sign_in"
                        ? (row.metadata as { ip?: string | null })?.ip ?? null
                        : null;
                    const country =
                      row.action === "sign_in"
                        ? (row.metadata as { country?: string | null })?.country ?? null
                        : null;
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(row.created_at), "yyyy-MM-dd HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          {row.user_id
                            ? profilesQ.data?.get(row.user_id) ?? (
                                <span className="font-mono text-xs">
                                  {row.user_id.slice(0, 8)}…
                                </span>
                              )
                            : <span className="text-muted-foreground italic">system</span>}
                        </TableCell>
                        <TableCell>
                          <ActionBadge action={row.action} />
                        </TableCell>
                        <TableCell className="text-sm">{row.entity_type ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {ip ? (
                            <span>
                              {ip}
                              {country ? (
                                <span className="ml-1 text-muted-foreground">({country})</span>
                              ) : null}
                            </span>
                          ) : row.entity_id ? (
                            `${row.entity_id.slice(0, 8)}…`
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelected(row)}>
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

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Activity entry</DialogTitle>
            <DialogDescription>
              {selected
                ? `${selected.action} on ${selected.entity_type ?? "unknown"} · ${format(
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
                  {selected.user_id
                    ? profilesQ.data?.get(selected.user_id) ?? selected.user_id
                    : "system"}
                </MetaField>
                <MetaField label="Record ID">{selected.entity_id ?? "—"}</MetaField>
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
    </div>
  );
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1 font-mono text-xs break-all">{children}</div>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const variant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    delete: "destructive",
    approve: "default",
    update: "secondary",
    create: "outline",
    sign_in: "default",
  };
  return <Badge variant={variant[action] ?? "outline"}>{action}</Badge>;
}

