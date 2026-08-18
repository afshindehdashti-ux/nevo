import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MasterListShell } from "@/components/crm/MasterListShell";
import { GuideMeButton } from "@/components/ai/GuideMeButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ListEmptyState } from "@/components/admin/ListEmptyState";
import { FileDown, FileText, Loader2, SearchX } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatMoney } from "@/lib/crm-money";
import {
  customerDisplayName,
  financeBalanceDue,
  financeTotalAmount,
  type CustomerDisplay,
} from "@/lib/finance-normalization";
import {
  INVOICE_STATUSES,
  invoiceStatusLabel,
  invoiceStatusVariant,
  type InvoiceStatus,
} from "@/lib/crm-status";

export const Route = createFileRoute("/_authenticated/admin/invoices")({
  head: () => ({ meta: [{ title: "Invoices — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: () => <InvoicesList type="commercial" title="Invoices" />,
});


export function InvoicesList({
  type,
  title,
}: {
  type: "commercial" | "proforma";
  title: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers(name, company_name, email)")
        .eq("type", type)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (!q) return true;
      const cName = customerDisplayName(i.customers as CustomerDisplay | null);
      return (
        (i.invoice_number || "").toLowerCase().includes(q) ||
        cName.toLowerCase().includes(q)
      );
    });
  }, [invoices, search, statusFilter]);

  const filteredIds = useMemo(() => filtered.map((i) => i.id), [filtered]);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const someSelected = filteredIds.some((id) => selected.has(id));

  const toggleAll = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) filteredIds.forEach((id) => next.add(id));
      else filteredIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const label = type === "proforma" ? "Proforma" : "Commercial";
  const emptyResource = type === "proforma" ? "proforma_invoices" : "invoices";

  const handleBulkExport = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setExporting(true);
    const t = toast.loading(`Generating ${ids.length} PDF${ids.length > 1 ? "s" : ""}…`);
    try {
      if (ids.length === 1) {
        await generateInvoicePdf(ids[0], "download");
        toast.success("PDF downloaded", { id: t });
      } else {
        const zip = new JSZip();
        let ok = 0;
        for (const id of ids) {
          try {
            const res = await generateInvoicePdf(id, "blob");
            zip.file(res.filename, res.blob);
            URL.revokeObjectURL(res.url);
            ok++;
          } catch (e) {
            console.error("PDF failed", id, e);
          }
        }
        if (ok === 0) throw new Error("All PDFs failed to generate");
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const stamp = new Date().toISOString().slice(0, 10);
        a.download = `${label}-Invoices-${stamp}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${ok} of ${ids.length} PDFs`, { id: t });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Export failed";
      toast.error(msg, { id: t });
    } finally {
      setExporting(false);
    }
  };

  const downloadOne = async (id: string) => {
    setRowBusy(id);
    const t = toast.loading("Generating PDF…");
    try {
      await generateInvoicePdf(id, "download");
      toast.success("PDF downloaded", { id: t });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed", { id: t });
    } finally {
      setRowBusy(null);
    }
  };



  return (
    <MasterListShell
      title={title}
      description={
        type === "proforma"
          ? "Proforma invoices sent before shipment."
          : "Commercial invoices with payment tracking."
      }
      count={invoices.length}
      search={search}
      onSearchChange={setSearch}
      canCreate={false}
      onCreate={() => {}}
      headerExtra={
        <GuideMeButton
          sectionId={type === "proforma" ? "proforma-invoice" : "commercial-invoice"}
        />
      }
    >
      <div className="p-3 border-b flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex min-w-0 items-center gap-2">
          <Label className="shrink-0 text-xs text-muted-foreground">Status</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InvoiceStatus | "all")}>
            <SelectTrigger className="h-8 w-full min-w-0 sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {INVOICE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {invoiceStatusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:ml-auto">
          {selected.size > 0 && (
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkExport}
            disabled={selected.size === 0 || exporting}
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <FileDown className="h-3.5 w-3.5 mr-1" />}
            Export PDF{selected.size > 1 ? "s" : ""}
          </Button>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            Create from an <Link to="/admin/orders" className="text-accent hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">order</Link>.
          </p>
        </div>
      </div>
      {isLoading ? (
        <div
          data-testid="list-skeleton"
          aria-busy="true"
          aria-live="polite"
          className="space-y-2 p-4"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-4 md:p-6">
          {invoices.length === 0 ? (
            <ListEmptyState
              icon={FileText}
              resource={emptyResource}
              reason="no_records"
              title={`No ${label.toLowerCase()} invoices yet`}
              description={`${label} invoices will show up here once you create one from a confirmed order.`}
              action={
                <Button variant="outline" asChild>
                  <Link to="/admin/orders">Go to orders</Link>
                </Button>
              }
            />
          ) : (
            <ListEmptyState
              icon={SearchX}
              resource={emptyResource}
              reason="filtered_out"
              title="No invoices match your filters"
              description="No invoices match the current search and status filter. Clear them to see the full list again."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <>
      {/* Mobile: stacked cards — no horizontal scrolling, tap targets stay usable */}
      <div className="md:hidden divide-y">
        {filtered.map((i) => (
          <div
            key={i.id}
            className={`p-3 ${selected.has(i.id) ? "bg-muted/50" : ""}`}
          >
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
              <Checkbox
                className="mt-1 shrink-0"
                checked={selected.has(i.id)}
                onCheckedChange={(v) => toggleOne(i.id, v === true)}
                aria-label={`Select ${i.invoice_number ?? i.id}`}
              />
              <div className="min-w-0">
                <Link
                  to="/admin/invoices/$id"
                  params={{ id: i.id }}
                  className="block truncate font-medium text-accent hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {i.invoice_number}
                </Link>
                <p className="truncate text-sm text-muted-foreground">
                  {customerDisplayName(i.customers as CustomerDisplay | null)}
                </p>
              </div>
              <Badge variant={invoiceStatusVariant(i.status)} className="shrink-0">
                {invoiceStatusLabel(i.status)}
              </Badge>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 pl-7 text-xs">
              <div className="flex min-w-0 justify-between gap-2">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="whitespace-nowrap">{formatDate(i.issue_date)}</dd>
              </div>
              <div className="flex min-w-0 justify-between gap-2">
                <dt className="text-muted-foreground">Due</dt>
                <dd className="whitespace-nowrap">{formatDate(i.due_date)}</dd>
              </div>
              <div className="flex min-w-0 justify-between gap-2">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="whitespace-nowrap tabular-nums">
                  {formatMoney(financeTotalAmount(i), i.currency)}
                </dd>
              </div>
              <div className="flex min-w-0 justify-between gap-2">
                <dt className="text-muted-foreground">Balance</dt>
                <dd className="whitespace-nowrap tabular-nums">
                  {formatMoney(financeBalanceDue(i), i.currency)}
                </dd>
              </div>
            </dl>
            <div className="mt-2 flex flex-wrap gap-2 pl-7">
              <Button size="sm" variant="outline" asChild>
                <Link to="/admin/invoices/$id" params={{ id: i.id }}>
                  Open
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadOne(i.id)}
                disabled={rowBusy === i.id}
              >
                {rowBusy === i.id ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileDown className="mr-1 h-3.5 w-3.5" />
                )}
                PDF
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop / tablet: full table */}
      <div className="hidden w-full overflow-x-auto md:block">
        <Table className="min-w-[880px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(v) => toggleAll(v === true)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="whitespace-nowrap">Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="whitespace-nowrap">Date</TableHead>
              <TableHead className="whitespace-nowrap">Due</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap text-right">Total</TableHead>
              <TableHead className="whitespace-nowrap text-right">Balance</TableHead>
              <TableHead className="w-10 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((i) => (
              <TableRow key={i.id} data-state={selected.has(i.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(i.id)}
                    onCheckedChange={(v) => toggleOne(i.id, v === true)}
                    aria-label={`Select ${i.invoice_number ?? i.id}`}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Link
                    to="/admin/invoices/$id"
                    params={{ id: i.id }}
                    className="text-accent hover:underline font-medium rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {i.invoice_number}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[240px] truncate">
                  {customerDisplayName(i.customers as CustomerDisplay | null)}
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(i.issue_date)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(i.due_date)}</TableCell>
                <TableCell>
                  <Badge variant={invoiceStatusVariant(i.status)}>
                    {invoiceStatusLabel(i.status)}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">
                  {formatMoney(financeTotalAmount(i), i.currency)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">
                  {formatMoney(financeBalanceDue(i), i.currency)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => downloadOne(i.id)}
                    disabled={rowBusy === i.id}
                    aria-label={`Download PDF for ${i.invoice_number ?? i.id}`}
                  >
                    {rowBusy === i.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FileDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}

          </TableBody>
        </Table>
      </div>
        </>
      )}

    </MasterListShell>
  );
}
