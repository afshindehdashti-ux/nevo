import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  exportToExcel,
  exportToPDF,
  fmtDate,
  fmtMoney,
  type ReportColumn,
} from "@/lib/report-exports";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({
    meta: [{ title: "Reports — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: ReportsPage,
});

type ReportKey =
  | "customers"
  | "leads_pipeline"
  | "sales_orders"
  | "invoices_ar"
  | "payments"
  | "ar_aging";

const REPORTS: Record<ReportKey, { label: string; description: string }> = {
  customers: {
    label: "Customer Directory",
    description: "All customers with contact, currency, and status.",
  },
  leads_pipeline: {
    label: "Leads Pipeline",
    description: "Project inquiries by status, priority, and assignee.",
  },
  sales_orders: {
    label: "Sales Orders",
    description: "Orders by status and date, with totals per customer.",
  },
  invoices_ar: {
    label: "Invoices & A/R",
    description: "Issued invoices with paid and outstanding balances.",
  },
  payments: {
    label: "Payments Received",
    description: "All recorded payments with method and reference.",
  },
  ar_aging: {
    label: "A/R Aging",
    description: "Outstanding invoice balances bucketed by days overdue.",
  },
};

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function ReportsPage() {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [report, setReport] = useState<ReportKey>("sales_orders");
  const [from, setFrom] = useState(ymd(monthAgo));
  const [to, setTo] = useState(ymd(today));
  const [status, setStatus] = useState<string>("all");

  const query = useQuery({
    queryKey: ["report", report, from, to, status],
    queryFn: () => fetchReport(report, { from, to, status }),
  });

  const cfg = useMemo(() => getConfig(report), [report]);

  const meta = {
    Report: REPORTS[report].label,
    "Date range": report === "customers" ? "n/a" : `${from} → ${to}`,
    "Status filter": status === "all" ? "All" : status,
    Rows: query.data?.length ?? 0,
  };

  function handleExport(kind: "pdf" | "excel") {
    const rows = query.data ?? [];
    if (!rows.length) {
      toast.error("No rows to export");
      return;
    }
    const base = `nevo-${report}-${ymd(new Date())}`;
    try {
      if (kind === "excel") {
        exportToExcel({
          filename: base,
          sheetName: REPORTS[report].label,
          columns: cfg.columns as ReportColumn<Record<string, unknown>>[],
          rows: rows as Record<string, unknown>[],
          meta,
        });
      } else {
        exportToPDF({
          filename: base,
          title: `NEVO Industrial — ${REPORTS[report].label}`,
          subtitle: REPORTS[report].description,
          columns: cfg.columns as ReportColumn<Record<string, unknown>>[],
          rows: rows as Record<string, unknown>[],
          meta,
          orientation: cfg.orientation ?? "landscape",
        });
      }
      toast.success(`Exported ${rows.length} rows`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Export failed";
      toast.error(msg);
    }
  }

  const statusOptions = cfg.statusOptions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate operational and financial reports. Export to PDF or Excel.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2 md:col-span-2">
              <Label>Report type</Label>
              <Select value={report} onValueChange={(v) => setReport(v as ReportKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(REPORTS) as ReportKey[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {REPORTS[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{REPORTS[report].description}</p>
            </div>

            <div className="space-y-2">
              <Label>From</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                disabled={report === "customers"}
              />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={report === "customers"}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={setStatus}
                disabled={!statusOptions.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport("pdf")}
              disabled={query.isLoading || !query.data?.length}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("excel")}
              disabled={query.isLoading || !query.data?.length}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button variant="ghost" onClick={() => query.refetch()}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{REPORTS[report].label}</CardTitle>
          <Badge variant="secondary">{query.data?.length ?? 0} rows</Badge>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : query.error ? (
            <p className="text-sm text-destructive">
              {(query.error as Error).message ?? "Failed to load report"}
            </p>
          ) : !query.data?.length ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No data matches the current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {cfg.columns.map((c) => (
                      <TableHead
                        key={c.key}
                        className={c.align === "right" ? "text-right" : ""}
                      >
                        {c.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(query.data as Record<string, unknown>[]).slice(0, 200).map((row, i) => (
                    <TableRow key={i}>
                      {cfg.columns.map((c) => {
                        const raw = row[c.key];
                        const val = c.format
                          ? c.format(raw, row)
                          : raw == null
                            ? ""
                            : String(raw);
                        return (
                          <TableCell
                            key={c.key}
                            className={c.align === "right" ? "text-right tabular-nums" : ""}
                          >
                            {val}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(query.data?.length ?? 0) > 200 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Preview limited to 200 rows. Export to see all {query.data?.length}.
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- config ----------

type ReportConfig = {
  columns: ReportColumn<Record<string, unknown>>[];
  statusOptions?: string[];
  orientation?: "portrait" | "landscape";
};

function getConfig(report: ReportKey): ReportConfig {
  switch (report) {
    case "customers":
      return {
        columns: [
          { key: "name", header: "Name" },
          { key: "contact_person", header: "Contact" },
          { key: "email", header: "Email" },
          { key: "phone", header: "Phone" },
          { key: "country", header: "Country" },
          { key: "currency", header: "Ccy" },
          { key: "payment_terms", header: "Terms" },
          {
            key: "is_active",
            header: "Active",
            format: (v) => (v ? "Yes" : "No"),
          },
          { key: "created_at", header: "Created", format: fmtDate },
        ],
      };
    case "leads_pipeline":
      return {
        statusOptions: [
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
        ],
        columns: [
          { key: "created_at", header: "Received", format: fmtDate },
          { key: "name", header: "Contact" },
          { key: "email", header: "Email" },
          { key: "company", header: "Company" },
          { key: "country", header: "Country" },
          { key: "application", header: "Interest" },
          { key: "status", header: "Status" },
          { key: "priority", header: "Priority" },
          { key: "assignee_name", header: "Assigned" },
          { key: "internal_score", header: "Score", align: "right" },
          { key: "next_action_date", header: "Next action", format: fmtDate },
          { key: "budget_range", header: "Budget" },
        ],
      };
    case "sales_orders":
      return {
        statusOptions: [
          "draft",
          "confirmed",
          "in_production",
          "ready_to_ship",
          "shipped",
          "delivered",
          "cancelled",
        ],
        columns: [
          { key: "order_number", header: "Order #" },
          { key: "order_date", header: "Date", format: fmtDate },
          { key: "customer_name", header: "Customer" },
          { key: "status", header: "Status" },
          { key: "currency", header: "Ccy" },
          {
            key: "subtotal",
            header: "Subtotal",
            align: "right",
            format: (v, r) => fmtMoney(v, String(r.currency ?? "USD")),
          },
          {
            key: "vat_amount",
            header: "VAT",
            align: "right",
            format: (v, r) => fmtMoney(v, String(r.currency ?? "USD")),
          },
          {
            key: "total",
            header: "Total",
            align: "right",
            format: (v, r) => fmtMoney(v, String(r.currency ?? "USD")),
          },
        ],
      };
    case "invoices_ar":
      return {
        statusOptions: ["draft", "issued", "partially_paid", "paid", "overdue", "void"],
        columns: [
          { key: "invoice_number", header: "Invoice #" },
          { key: "type", header: "Type" },
          { key: "issue_date", header: "Issued", format: fmtDate },
          { key: "due_date", header: "Due", format: fmtDate },
          { key: "customer_name", header: "Customer" },
          { key: "status", header: "Status" },
          { key: "currency", header: "Ccy" },
          {
            key: "total",
            header: "Total",
            align: "right",
            format: (v, r) => fmtMoney(v, String(r.currency ?? "USD")),
          },
          {
            key: "amount_paid",
            header: "Paid",
            align: "right",
            format: (v, r) => fmtMoney(v, String(r.currency ?? "USD")),
          },
          {
            key: "balance",
            header: "Balance",
            align: "right",
            format: (v, r) => fmtMoney(v, String(r.currency ?? "USD")),
          },
        ],
      };
    case "payments":
      return {
        columns: [
          { key: "received_at", header: "Date", format: fmtDate },
          { key: "invoice_number", header: "Invoice #" },
          { key: "customer_name", header: "Customer" },
          { key: "method", header: "Method" },
          { key: "reference", header: "Reference" },
          { key: "currency", header: "Ccy" },
          {
            key: "amount",
            header: "Amount",
            align: "right",
            format: (v, r) => fmtMoney(v, String(r.currency ?? "USD")),
          },
        ],
      };
    case "ar_aging":
      return {
        orientation: "landscape",
        columns: [
          { key: "customer_name", header: "Customer" },
          { key: "currency", header: "Ccy" },
          {
            key: "current",
            header: "Current",
            align: "right",
            format: (v, r) => fmtMoney(v, String(r.currency ?? "USD")),
          },
          {
            key: "d1_30",
            header: "1–30d",
            align: "right",
            format: (v, r) => fmtMoney(v, String(r.currency ?? "USD")),
          },
          {
            key: "d31_60",
            header: "31–60d",
            align: "right",
            format: (v, r) => fmtMoney(v, String(r.currency ?? "USD")),
          },
          {
            key: "d61_90",
            header: "61–90d",
            align: "right",
            format: (v, r) => fmtMoney(v, String(r.currency ?? "USD")),
          },
          {
            key: "d90p",
            header: "90d+",
            align: "right",
            format: (v, r) => fmtMoney(v, String(r.currency ?? "USD")),
          },
          {
            key: "total",
            header: "Total Outstanding",
            align: "right",
            format: (v, r) => fmtMoney(v, String(r.currency ?? "USD")),
          },
        ],
      };
  }
}

// ---------- data fetchers ----------

type Filters = { from: string; to: string; status: string };

async function fetchReport(
  report: ReportKey,
  f: Filters,
): Promise<Record<string, unknown>[]> {
  switch (report) {
    case "customers": {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Record<string, unknown>[];
    }
    case "sales_orders": {
      let q = supabase
        .from("orders")
        .select("*, customer:customers(name)")
        .gte("order_date", f.from)
        .lte("order_date", f.to)
        .order("order_date", { ascending: false });
      if (f.status !== "all") q = q.eq("status", f.status as never);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        customer_name:
          (r as { customer?: { name?: string } | null }).customer?.name ?? "—",
      }));
    }
    case "invoices_ar": {
      let q = supabase
        .from("invoices")
        .select("*, customer:customers(name)")
        .gte("issue_date", f.from)
        .lte("issue_date", f.to)
        .order("issue_date", { ascending: false });
      if (f.status !== "all") q = q.eq("status", f.status as never);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        customer_name:
          (r as { customer?: { name?: string } | null }).customer?.name ?? "—",
      }));
    }
    case "payments": {
      const { data, error } = await supabase
        .from("payments")
        .select("*, invoice:invoices(invoice_number, customer:customers(name))")
        .gte("received_at", f.from)
        .lte("received_at", f.to)
        .order("received_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => {
        const inv = (
          r as {
            invoice?: {
              invoice_number?: string;
              customer?: { name?: string } | null;
            } | null;
          }
        ).invoice;
        return {
          ...r,
          invoice_number: inv?.invoice_number ?? "—",
          customer_name: inv?.customer?.name ?? "—",
        };
      });
    }
    case "ar_aging": {
      const { data, error } = await supabase
        .from("invoices")
        .select("customer_id, currency, balance, due_date, status, customer:customers(name)")
        .gt("balance", 0)
        .neq("status", "void");
      if (error) throw error;
      const today = new Date();
      const buckets = new Map<
        string,
        {
          customer_name: string;
          currency: string;
          current: number;
          d1_30: number;
          d31_60: number;
          d61_90: number;
          d90p: number;
          total: number;
        }
      >();
      for (const row of data ?? []) {
        const r = row as {
          customer_id: string;
          currency: string;
          balance: number;
          due_date: string | null;
          customer?: { name?: string } | null;
        };
        const key = `${r.customer_id}::${r.currency}`;
        const b =
          buckets.get(key) ??
          {
            customer_name: r.customer?.name ?? "—",
            currency: r.currency ?? "USD",
            current: 0,
            d1_30: 0,
            d31_60: 0,
            d61_90: 0,
            d90p: 0,
            total: 0,
          };
        const bal = Number(r.balance) || 0;
        const due = r.due_date ? new Date(r.due_date) : null;
        const days = due
          ? Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        if (days <= 0) b.current += bal;
        else if (days <= 30) b.d1_30 += bal;
        else if (days <= 60) b.d31_60 += bal;
        else if (days <= 90) b.d61_90 += bal;
        else b.d90p += bal;
        b.total += bal;
        buckets.set(key, b);
      }
      return Array.from(buckets.values()).sort((a, b) => b.total - a.total) as Record<
        string,
        unknown
      >[];
    }
  }
}
