import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileSpreadsheet, RefreshCw, Search, Loader2 } from "lucide-react";
import { GuideMeButton } from "@/components/ai/GuideMeButton";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/report-exports";
import { formatDate } from "@/lib/crm-money";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  head: () => ({
    meta: [{ title: "Leads — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: LeadsPage,
});

// Lead pipeline statuses (stored as free-text `status` on project_inquiries)
export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "quotation_preparing",
  "proposal_sent",
  "negotiation",
  "won",
  "converted",
  "lost",
  "archived",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  quotation_preparing: "Quotation prep",
  proposal_sent: "Proposal sent",
  negotiation: "Negotiation",
  won: "Won",
  converted: "Converted",
  lost: "Lost",
  archived: "Archived",
  approved: "Approved",
};

const STATUS_TONE: Record<string, string> = {
  new: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  contacted: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  qualified: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  quotation_preparing: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  proposal_sent: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  negotiation: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  won: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  converted: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-600/40",
  lost: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  archived: "bg-muted text-muted-foreground border-border",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
};

const PRIORITY_TONE: Record<string, string> = {
  urgent: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  normal: "bg-muted text-muted-foreground border-border",
  low: "bg-muted/50 text-muted-foreground border-border",
};

type Inquiry = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  application: string | null;
  message: string | null;
  source_page: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  internal_score: number | null;
  next_action_date: string | null;
  project_type: string | null;
  budget_range: string | null;
  timeline: string | null;
  converted_customer_id: string | null;
  converted_project_id: string | null;
};

function LeadsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const { data: leads = [], isLoading, refetch } = useQuery<Inquiry[]>({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_inquiries")
        .select(
          "id,created_at,name,email,phone,company,country,application,message,source_page,status,priority,assigned_to,internal_score,next_action_date,project_type,budget_range,timeline,converted_customer_id,converted_project_id",
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Inquiry[];
    },
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["leads-staff"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name")
        .eq("is_active", true)
        .order("full_name");
      return data ?? [];
    },
    staleTime: 60_000,
  });
  const staffById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of staff) m.set(s.id, s.full_name ?? "Unnamed");
    return m;
  }, [staff]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter === "open") {
        if (["won", "converted", "lost", "archived"].includes(l.status)) return false;
      } else if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (priorityFilter !== "all" && (l.priority ?? "normal") !== priorityFilter) return false;
      if (!needle) return true;
      return (
        l.name.toLowerCase().includes(needle) ||
        l.email.toLowerCase().includes(needle) ||
        (l.company ?? "").toLowerCase().includes(needle) ||
        (l.country ?? "").toLowerCase().includes(needle) ||
        (l.application ?? "").toLowerCase().includes(needle)
      );
    });
  }, [leads, q, statusFilter, priorityFilter]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of leads) m[l.status] = (m[l.status] ?? 0) + 1;
    return m;
  }, [leads]);

  const kpi = useMemo(() => {
    const open = leads.filter(
      (l) => !["won", "converted", "lost", "archived"].includes(l.status),
    );
    const urgent = open.filter((l) => l.priority === "urgent" || l.priority === "high").length;
    const unassigned = open.filter((l) => !l.assigned_to).length;
    const overdue = open.filter(
      (l) => l.next_action_date && new Date(l.next_action_date) < new Date(),
    ).length;
    return { open: open.length, urgent, unassigned, overdue };
  }, [leads]);

  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<Inquiry> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("project_inquiries").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  function handleExport() {
    if (!filtered.length) {
      toast.error("No leads to export");
      return;
    }
    exportToExcel({
      filename: `nevo-leads-${new Date().toISOString().slice(0, 10)}`,
      sheetName: "Leads",
      columns: [
        { key: "created_at", header: "Received", format: (v) => formatDate(v as string) },
        { key: "name", header: "Contact" },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone" },
        { key: "company", header: "Company" },
        { key: "country", header: "Country" },
        { key: "application", header: "Application" },
        { key: "status", header: "Status", format: (v) => STATUS_LABEL[String(v)] ?? String(v) },
        { key: "priority", header: "Priority" },
        {
          key: "assigned_to",
          header: "Assigned",
          format: (v) => (v ? (staffById.get(String(v)) ?? "—") : "—"),
        },
        { key: "internal_score", header: "Score" },
        { key: "next_action_date", header: "Next action" },
        { key: "budget_range", header: "Budget" },
        { key: "timeline", header: "Timeline" },
      ],
      rows: filtered as unknown as Record<string, unknown>[],
      meta: {
        Generated: new Date().toISOString(),
        Filter: statusFilter,
        Rows: filtered.length,
      },
    });
    toast.success(`Exported ${filtered.length} leads`);
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            NEVO Command Center · Sales
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Leads pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inquiries from the public website, calculators, and forms. Qualify, assign, and convert
            into customers or projects.
          </p>
        </div>
        <div className="flex gap-2">
          <GuideMeButton sectionId="leads" />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Open leads" value={kpi.open} />
        <Kpi label="High / urgent" value={kpi.urgent} tone="warn" />
        <Kpi label="Unassigned" value={kpi.unassigned} tone="warn" />
        <Kpi label="Overdue follow-ups" value={kpi.overdue} tone="danger" />
      </div>

      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, company, country…"
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open only</SelectItem>
                <SelectItem value="all">All statuses</SelectItem>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="board">Pipeline board</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-10 text-center text-muted-foreground">
                  <Loader2 className="inline h-4 w-4 mr-2 animate-spin" /> Loading leads…
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Received</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Company / country</TableHead>
                      <TableHead>Interest</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Next action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                          No leads match the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                    {filtered.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDate(l.created_at)}
                        </TableCell>
                        <TableCell>
                          <Link
                            to="/admin/leads/$id"
                            params={{ id: l.id }}
                            className="text-primary hover:underline font-medium"
                          >
                            {l.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">{l.email}</div>
                        </TableCell>
                        <TableCell>
                          <div>{l.company || "—"}</div>
                          <div className="text-xs text-muted-foreground">{l.country || "—"}</div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {l.application || l.project_type || "—"}
                          {l.budget_range && (
                            <div className="text-xs text-muted-foreground">{l.budget_range}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={l.status}
                            onValueChange={(v) =>
                              updateMutation.mutate({ id: l.id, status: v })
                            }
                          >
                            <SelectTrigger className="h-7 w-[160px] px-2">
                              <StatusChip status={l.status} />
                            </SelectTrigger>
                            <SelectContent>
                              {LEAD_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {STATUS_LABEL[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={l.priority ?? "normal"}
                            onValueChange={(v) =>
                              updateMutation.mutate({ id: l.id, priority: v })
                            }
                          >
                            <SelectTrigger className="h-7 w-[110px] px-2">
                              <Badge
                                variant="outline"
                                className={PRIORITY_TONE[l.priority ?? "normal"]}
                              >
                                {(l.priority ?? "normal").toUpperCase()}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="urgent">Urgent</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={l.assigned_to ?? "none"}
                            onValueChange={(v) =>
                              updateMutation.mutate({
                                id: l.id,
                                assigned_to: v === "none" ? null : v,
                              })
                            }
                          >
                            <SelectTrigger className="h-7 w-[160px] px-2 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">— Unassigned —</SelectItem>
                              {staff.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {l.next_action_date ? (
                            <span
                              className={
                                new Date(l.next_action_date) < new Date()
                                  ? "text-rose-600 dark:text-rose-400 font-medium"
                                  : ""
                              }
                            >
                              {formatDate(l.next_action_date)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="board">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {(
              [
                "new",
                "contacted",
                "qualified",
                "quotation_preparing",
                "proposal_sent",
                "negotiation",
                "won",
                "converted",
                "lost",
              ] as LeadStatus[]
            ).map((s) => {
              const items = filtered.filter((l) => l.status === s);
              return (
                <Card key={s} className="border-border/70">
                  <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wide">
                      {STATUS_LABEL[s]}
                    </CardTitle>
                    <Badge variant="secondary" className="h-5 text-[10px]">
                      {counts[s] ?? 0}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-2 space-y-2 max-h-[560px] overflow-auto">
                    {items.length === 0 && (
                      <div className="text-[11px] text-muted-foreground py-2 text-center">
                        Empty
                      </div>
                    )}
                    {items.slice(0, 30).map((l) => (
                      <Link
                        key={l.id}
                        to="/admin/leads/$id"
                        params={{ id: l.id }}
                        className="block rounded-md border border-border bg-background p-2.5 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {l.company || l.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1 py-0 ${PRIORITY_TONE[l.priority ?? "normal"]}`}
                          >
                            {(l.priority ?? "normal").slice(0, 1).toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {l.country || "—"} · {l.application || "General"}
                        </p>
                        <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                          <span>{formatDate(l.created_at)}</span>
                          <span>
                            {l.assigned_to ? staffById.get(l.assigned_to) : "Unassigned"}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warn" | "danger";
}) {
  const cls =
    tone === "danger"
      ? "text-rose-600 dark:text-rose-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={`text-2xl font-semibold mt-1 ${cls}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusChip({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`${STATUS_TONE[status] ?? ""} text-[10px]`}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
