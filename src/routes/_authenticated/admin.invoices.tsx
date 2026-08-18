import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  FileDown,
  FileText,
  Loader2,
  SearchX,
} from "lucide-react";
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


type SortKey =
  | "invoice_number"
  | "customer"
  | "issue_date"
  | "due_date"
  | "status"
  | "total"
  | "balance";

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
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("issue_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const value = (i: (typeof filtered)[number]) => {
      switch (sortKey) {
        case "invoice_number":
          return (i.invoice_number || "").toLowerCase();
        case "customer":
          return customerDisplayName(i.customers as CustomerDisplay | null).toLowerCase();
        case "issue_date":
          return i.issue_date ? new Date(i.issue_date).getTime() : 0;
        case "due_date":
          return i.due_date ? new Date(i.due_date).getTime() : 0;
        case "status":
          return invoiceStatusLabel(i.status).toLowerCase();
        case "total":
          return financeTotalAmount(i);
        case "balance":
          return financeBalanceDue(i);
        default:
          return 0;
      }
    };
    return [...filtered].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [filtered, sortKey, sortDir]);


  const filteredIds = useMemo(() => filtered.map((i) => i.id), [filtered]);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const someSelected = filteredIds.some((id) => selected.has(id));

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const paged = useMemo(
    () => sorted.slice(pageStart, pageStart + pageSize),
    [sorted, pageStart, pageSize],
  );

  // Filters change the result set — jump back to the first page so the user
  // never lands on an out-of-range (visually empty) page.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "issue_date" || key === "due_date" ? "desc" : "asc");
    }
  };

  const sortProps = (key: SortKey) =>
    ({
      "aria-sort": (sortKey === key
        ? sortDir === "asc"
          ? "ascending"
          : "descending"
        : "none") as "ascending" | "descending" | "none",
    });

  const SortButton = ({ column, label, align }: { column: SortKey; label: string; align?: "right" }) => {
    const active = sortKey === column;
    const Icon = !active ? ChevronsUpDown : sortDir === "asc" ? ChevronUp : ChevronDown;
    return (
      <button
        type="button"
        onClick={() => toggleSort(column)}
        className={`-mx-1 inline-flex w-full items-center gap-1 rounded-sm px-1 py-0.5 font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
          align === "right" ? "justify-end" : "justify-start"
        } ${active ? "text-foreground" : ""}`}
      >
        <span className="whitespace-nowrap">{label}</span>
        <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "opacity-100" : "opacity-50"}`} aria-hidden="true" />
      </button>
    );
  };

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
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <Label htmlFor="invoice-status-filter" className="shrink-0 text-xs text-muted-foreground">
              Status
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as InvoiceStatus | "all")}
            >
              <SelectTrigger id="invoice-status-filter" className="h-8 w-full min-w-0 sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-72">
                <SelectItem value="all">All statuses</SelectItem>
                {INVOICE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {invoiceStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 sm:ml-auto">
            {selected.size > 0 && (
              <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            )}
            <Tooltip>
              {/* span keeps the tooltip reachable while the button is disabled */}
              <TooltipTrigger asChild>
                <span tabIndex={selected.size === 0 ? 0 : -1} className="inline-flex rounded-md">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkExport}
                    disabled={selected.size === 0 || exporting}
                  >
                    {exporting ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FileDown className="mr-1 h-3.5 w-3.5" />
                    )}
                    Export PDF{selected.size > 1 ? "s" : ""}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" collisionPadding={12}>
                {selected.size === 0
                  ? "Select one or more invoices to export them as PDF."
                  : `Download ${selected.size} invoice PDF${selected.size > 1 ? "s (zipped)" : ""}.`}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="min-w-0 text-xs text-muted-foreground">
                  Create from an{" "}
                  <Link
                    to="/admin/orders"
                    className="rounded-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  >
                    order
                  </Link>
                  .
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom" collisionPadding={12} className="max-w-[260px]">
                Invoices are generated from a confirmed order so totals and line items stay in sync.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
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
        {paged.map((i) => (
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
                  className="block break-all font-medium leading-tight text-accent hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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
            <dl className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 pl-7 text-xs min-[360px]:grid-cols-2">
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
      <div className="hidden w-full md:block">
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
              <TableHead className="whitespace-nowrap" {...sortProps("invoice_number")}>
                <SortButton column="invoice_number" label="Invoice #" />
              </TableHead>
              <TableHead {...sortProps("customer")}>
                <SortButton column="customer" label="Customer" />
              </TableHead>
              <TableHead className="whitespace-nowrap" {...sortProps("issue_date")}>
                <SortButton column="issue_date" label="Date" />
              </TableHead>
              <TableHead className="whitespace-nowrap" {...sortProps("due_date")}>
                <SortButton column="due_date" label="Due" />
              </TableHead>
              <TableHead className="whitespace-nowrap" {...sortProps("status")}>
                <SortButton column="status" label="Status" />
              </TableHead>
              <TableHead className="whitespace-nowrap text-right" {...sortProps("total")}>
                <SortButton column="total" label="Total" align="right" />
              </TableHead>
              <TableHead className="whitespace-nowrap text-right" {...sortProps("balance")}>
                <SortButton column="balance" label="Balance" align="right" />
              </TableHead>
              <TableHead className="w-10 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((i) => (
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
                    className="text-accent hover:underline font-medium rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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
          <div className="flex flex-col gap-3 border-t p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <Label htmlFor="invoice-page-size" className="shrink-0 text-xs text-muted-foreground">
                Rows
              </Label>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger id="invoice-page-size" className="h-8 w-[84px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" side="top" collisionPadding={12}>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="tabular-nums">
                {pageStart + 1}–{Math.min(pageStart + pageSize, filtered.length)} of {filtered.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="tabular-nums">
                Page {currentPage} of {pageCount}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((n) => Math.max(1, n - 1))}
                disabled={currentPage <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((n) => Math.min(pageCount, n + 1))}
                disabled={currentPage >= pageCount}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

    </MasterListShell>
  );
}
