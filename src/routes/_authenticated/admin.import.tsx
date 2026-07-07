import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type ImportJob = Database["public"]["Tables"]["import_jobs"]["Row"];
type JobStatus = Database["public"]["Enums"]["import_job_status"];

export const Route = createFileRoute("/_authenticated/admin/import")({
  head: () => ({
    meta: [{ title: "Import Data — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: ImportDataPage,
});

const IMPORT_TYPES: { value: string; label: string; category: string }[] = [
  { value: "customers", label: "Customers", category: "CRM" },
  { value: "contacts", label: "Contacts", category: "CRM" },
  { value: "leads", label: "Leads", category: "CRM" },
  { value: "opportunities", label: "Opportunities", category: "CRM" },
  { value: "orders", label: "Projects / Orders", category: "Operations" },
  { value: "suppliers", label: "Suppliers", category: "Operations" },
  { value: "products", label: "Products", category: "Operations" },
  { value: "price_list", label: "Price list", category: "Operations" },
  { value: "quotations", label: "Quotations", category: "Finance" },
  { value: "proforma_invoices", label: "Proforma invoices", category: "Finance" },
  { value: "invoices", label: "Invoices", category: "Finance" },
  { value: "payments", label: "Payments", category: "Finance" },
  { value: "commission_invoices", label: "Commission invoices", category: "Finance" },
  { value: "shipments", label: "Shipments", category: "Operations" },
  { value: "tasks", label: "Tasks", category: "CRM" },
  { value: "communications", label: "Communications", category: "CRM" },
  { value: "documents", label: "Documents metadata", category: "Documents" },
];

const statusTone: Record<JobStatus, { className: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { className: "text-muted-foreground", icon: Clock },
  validating: { className: "text-amber-600", icon: Clock },
  ready: { className: "text-emerald-600", icon: CheckCircle2 },
  running: { className: "text-blue-600", icon: Clock },
  completed: { className: "text-emerald-600", icon: CheckCircle2 },
  failed: { className: "text-rose-600", icon: AlertCircle },
  cancelled: { className: "text-muted-foreground", icon: AlertCircle },
};

function useImportJobs() {
  return useQuery({
    queryKey: ["import-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("import_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as ImportJob[];
    },
    staleTime: 15_000,
  });
}

function ImportDataPage() {
  const { data: jobs, isLoading, error } = useImportJobs();

  const byCategory = IMPORT_TYPES.reduce<Record<string, typeof IMPORT_TYPES>>((acc, t) => {
    (acc[t.category] = acc[t.category] ?? []).push(t);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Admin Tools</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Import Data</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bulk-import CRM, operations, finance, and document records from CSV, XLSX, or JSON.
          </p>
        </div>
        <Button size="lg" disabled title="Wizard ships in the next update">
          <Upload className="mr-2 h-4 w-4" /> New import
        </Button>
      </header>

      {/* Supported types grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(byCategory).map(([cat, items]) => (
          <Card key={cat}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">{cat}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-1.5">
                {items.map((t) => (
                  <li key={t.value} className="flex items-center gap-2">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{t.label}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Import jobs history */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Import history</h2>
          <p className="text-xs text-muted-foreground">Last 50 jobs</p>
        </div>

        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">
              Failed to load import jobs. {(error as Error).message}
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : (jobs ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>No import jobs yet.</p>
              <p className="text-xs mt-1">
                Full upload / mapping / validation wizard ships in the next update.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="border border-border rounded-md overflow-hidden bg-background">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">File</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Rows</th>
                  <th className="text-right px-3 py-2">Success</th>
                  <th className="text-right px-3 py-2">Failed</th>
                  <th className="text-left px-3 py-2">Started</th>
                </tr>
              </thead>
              <tbody>
                {(jobs ?? []).map((j) => {
                  const tone = statusTone[j.status] ?? statusTone.draft;
                  const Icon = tone.icon;
                  return (
                    <tr key={j.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium capitalize">{j.import_type.replace(/_/g, " ")}</td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[240px]" title={j.file_name}>
                        {j.file_name}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={`gap-1 ${tone.className}`}>
                          <Icon className="h-3 w-3" />
                          {j.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{j.total_rows}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-600">{j.success_rows}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-rose-600">
                        {j.failed_rows > 0 ? j.failed_rows : "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(j.created_at), { addSuffix: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 text-sm">
          <p className="font-medium mb-1">Wizard coming next</p>
          <p className="text-muted-foreground">
            The full upload → column mapping → validation → confirm-and-run flow is scheduled for the next
            update. This page already lists every historical job and every supported import type, and the
            database tables, RLS policies, and audit hooks are ready. See{" "}
            <Link to="/admin" className="text-emerald-600 hover:underline">
              Dashboard
            </Link>{" "}
            for real-time counts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
