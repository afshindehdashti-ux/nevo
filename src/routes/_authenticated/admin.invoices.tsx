import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Card, CardContent } from "@/components/ui/card";
import { ListEmptyState } from "@/components/admin/ListEmptyState";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowDown,
  ArrowUp,
  Columns3,
  ChevronDown,

  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Check,
  FileDown,
  FileText,
  Info,
  Link2,
  Loader2,
  RefreshCw,
  RotateCcw,
  SearchX,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import { useTableColumnLayout } from "@/lib/use-table-columns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
import {
  INVOICE_LIST_DEFAULTS,
  INVOICE_PAGE_SIZES,
  INVOICE_SORT_KEYS,
  sanitizeInvoiceListPrefs,
  toInvoiceSearch,
  type InvoiceSortDir,
  type InvoiceSortKey,
} from "@/lib/invoice-list-prefs";

const invoiceSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  status: fallback(z.string(), "all").default("all"),
  page: fallback(z.number().int(), 1).default(1),
  size: fallback(z.number().int(), 25).default(25),
  sort: fallback(z.string(), "issue_date").default("issue_date"),
  dir: fallback(z.string(), "desc").default("desc"),
});

export const Route = createFileRoute("/_authenticated/admin/invoices")({
  head: () => ({ meta: [{ title: "Invoices — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  validateSearch: zodValidator(invoiceSearchSchema),
  component: () => <InvoicesList type="commercial" title="Invoices" />,
});


type SortKey = InvoiceSortKey;

type SortDir = InvoiceSortDir;

const SORT_KEYS = INVOICE_SORT_KEYS;
const SORT_LABELS: Record<SortKey, string> = {
  invoice_number: "Invoice #",
  customer: "Customer",
  issue_date: "Issue date",
  due_date: "Due date",
  status: "Status",
  total: "Total",
  balance: "Balance",
};
const PAGE_SIZES = INVOICE_PAGE_SIZES;


type BulkActionKey = "export" | "issue" | "paid" | "void";

const BULK_STATUS: Partial<Record<BulkActionKey, InvoiceStatus>> = {
  issue: "issued",
  paid: "paid",
  void: "void",
};

const BULK_COPY: Record<
  BulkActionKey,
  { label: string; title: string; body: (n: number) => string; confirm: string; destructive?: boolean }
> = {
  export: {
    label: "Export PDFs",
    title: "Export selected invoices?",
    body: (n) =>
      n === 1
        ? "One PDF will be generated and downloaded."
        : `${n} PDFs will be generated and downloaded together as a single ZIP file.`,
    confirm: "Export",
  },
  issue: {
    label: "Mark as issued",
    title: "Mark selected invoices as issued?",
    body: (n) =>
      `${n} invoice${n > 1 ? "s" : ""} will move to the “Issued” status. Issued invoices count towards receivables.`,
    confirm: "Mark as issued",
  },
  paid: {
    label: "Mark as paid",
    title: "Mark selected invoices as paid?",
    body: (n) =>
      `${n} invoice${n > 1 ? "s" : ""} will be marked fully paid. Do this only after the payments are reconciled.`,
    confirm: "Mark as paid",
  },
  void: {
    label: "Void",
    title: "Void selected invoices?",
    body: (n) =>
      `${n} invoice${n > 1 ? "s" : ""} will be voided. Voided invoices stay in the archive for audit but no longer count towards revenue or receivables.`,
    confirm: "Void invoices",
    destructive: true,
  },
};

export function InvoicesList({

  type,
  title,
}: {
  type: "commercial" | "proforma";
  title: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [rowResult, setRowResult] = useState<
    Record<string, { state: "success" | "error"; message: string }>
  >({});
  const [rowAnnounce, setRowAnnounce] = useState("");
  const [exportFailures, setExportFailures] = useState<{ name: string; message: string }[]>([]);
  const [pendingAction, setPendingAction] = useState<BulkActionKey | null>(null);
  const [runningAction, setRunningAction] = useState<BulkActionKey | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);


  // Search, status filter, sorting and pagination live in the URL so the view
  // survives a refresh and can be shared. localStorage keeps the last used
  // prefs as the starting point when the URL carries no params.
  const storageKey = `nevo.admin.invoices.${type}.prefs`;

  // Column visibility and ordering are a layout choice rather than a filter, so
  // they stay in localStorage only (never the URL) and survive a refresh.
  const columns = useTableColumnLayout<SortKey>(
    `nevo.admin.invoices.${type}.columns`,
    SORT_KEYS,
  );

  const navigate = useNavigate();
  const urlSearch = Route.useSearch();
  const [hydrated, setHydrated] = useState(false);

  const prefs = useMemo(
    () => ({
      ...INVOICE_LIST_DEFAULTS,
      ...sanitizeInvoiceListPrefs({
        search: urlSearch.q,
        statusFilter: urlSearch.status as InvoiceStatus | "all",
        pageSize: urlSearch.size,
        page: urlSearch.page,
        sortKey: urlSearch.sort as SortKey,
        sortDir: urlSearch.dir as SortDir,
      }),
    }),
    [urlSearch],
  );
  const { search, statusFilter, pageSize, page, sortKey, sortDir } = prefs;

  const setPrefs = useCallback(
    (patch: Partial<typeof INVOICE_LIST_DEFAULTS> | ((c: typeof INVOICE_LIST_DEFAULTS) => Partial<typeof INVOICE_LIST_DEFAULTS>)) => {
      const next = { ...prefs, ...(typeof patch === "function" ? patch(prefs) : patch) };
      void navigate({
        to: "/admin/invoices",
        search: toInvoiceSearch(next),
        replace: true,
      });
    },
    [navigate, prefs],
  );

  const resetPrefs = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // storage unavailable
    }
    void navigate({
      to: "/admin/invoices",
      search: toInvoiceSearch(INVOICE_LIST_DEFAULTS),
      replace: true,
    });
  }, [navigate, storageKey]);

  // Restore stored prefs once, only when the URL carries no explicit state.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlHasState = ["q", "status", "page", "size", "sort", "dir"].some((k) => params.has(k));
    if (!urlHasState) {
      let restored: Partial<typeof INVOICE_LIST_DEFAULTS> | null = null;
      try {
        const raw = window.localStorage.getItem(storageKey);
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          restored = sanitizeInvoiceListPrefs(parsed as Partial<typeof INVOICE_LIST_DEFAULTS>);
        }
      } catch {
        restored = null;
      }
      if (restored && Object.keys(restored).length > 0) {
        void navigate({
          to: "/admin/invoices",
          search: toInvoiceSearch({ ...INVOICE_LIST_DEFAULTS, ...restored }),
          replace: true,
        });
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Mirror the URL state into storage so the next visit starts where we left off.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(prefs));
    } catch {
      // storage unavailable
    }
  }, [hydrated, prefs, storageKey]);

  const setSearch = useCallback((v: string) => setPrefs({ search: v }), [setPrefs]);

  // Typing shouldn't push a URL update (and a full re-filter) on every
  // keystroke. The input stays instant while the committed value — the one the
  // list, the URL and storage use — lands 300ms after the user stops typing.
  const [searchInput, setSearchInput] = useState(search);
  const searchInputRef = useRef(searchInput);
  searchInputRef.current = searchInput;

  // External resets (clear filters, back/forward, stored prefs) win over the
  // local draft whenever they don't match what the user is currently typing.
  useEffect(() => {
    if (search !== searchInputRef.current) setSearchInput(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (searchInput === search) return;
    const t = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(t);
  }, [searchInput, search, setSearch]);

  const searchPending = searchInput.trim() !== search.trim();

  // "Reset filters" clears the persisted prefs and returns the URL to defaults.
  const filtersDirty =
    searchInput !== INVOICE_LIST_DEFAULTS.search ||
    (Object.keys(INVOICE_LIST_DEFAULTS) as (keyof typeof INVOICE_LIST_DEFAULTS)[]).some(
      (k) => prefs[k] !== INVOICE_LIST_DEFAULTS[k],
    );

  // "Copy link" shares the current view: every filter, sort and page lives in
  // the URL, so the recipient lands on exactly the same list.
  const [linkCopied, setLinkCopied] = useState(false);
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
      toast.success("Link copied — it opens with these filters applied.");
    } catch {
      toast.error("Couldn't copy the link. Copy it from the address bar instead.");
    }
  };

  // One click puts every filter, sort and pagination choice back to its default,
  // forgets the saved prefs, drops the selection and pulls a fresh list.
  const handleResetFilters = useCallback(() => {
    setSearchInput(INVOICE_LIST_DEFAULTS.search);
    setSelected(new Set());
    resetPrefs();
    handleRefresh();
    setRowAnnounce("Filters cleared. Showing all invoices.");
    toast.success("Filters cleared — showing all invoices.");
    // handleRefresh is declared below; it is only called after render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetPrefs]);

  const setStatusFilter = (v: InvoiceStatus | "all") => setPrefs({ statusFilter: v });
  const setPageSize = (v: number) => setPrefs({ pageSize: v });
  const setPage = (v: number | ((n: number) => number)) =>
    setPrefs((c) => ({ page: typeof v === "function" ? v(c.page) : v }));
  const setSortKey = (v: SortKey) => setPrefs({ sortKey: v });
  const setSortDir = (v: SortDir | ((d: SortDir) => SortDir)) =>
    setPrefs((c) => ({ sortDir: typeof v === "function" ? v(c.sortDir) : v }));

  const queryClient = useQueryClient();
  const invoicesQueryKey = useMemo(() => ["invoices", type] as const, [type]);

  const {
    data: invoices = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: invoicesQueryKey,
    queryFn: async ({ signal }) => {
      // Hand React Query's abort signal to the request so a fetch that is no
      // longer needed (filter changed again, refetch retriggered, list
      // unmounted) is cancelled instead of racing the newer one.
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers(name, company_name, email)")
        .eq("type", type)
        .order("issue_date", { ascending: false })
        .abortSignal(signal);
      if (error) throw error;
      return data;
    },
  });

  // Changing any filter invalidates the results the in-flight request would
  // paint, so cancel it. An outdated response can no longer land after a newer
  // filter change, and the abort above stops the wasted network work.
  const cancelInFlightFetch = useCallback(() => {
    void queryClient.cancelQueries({ queryKey: invoicesQueryKey, exact: true });
  }, [queryClient, invoicesQueryKey]);

  useEffect(() => {
    cancelInFlightFetch();
  }, [search, statusFilter, sortKey, sortDir, pageSize, page, cancelInFlightFetch]);

  // Manual refresh: drop whatever is in flight first so the two requests can't
  // resolve out of order.
  const handleRefresh = useCallback(() => {
    cancelInFlightFetch();
    void refetch({ cancelRefetch: true });
  }, [cancelInFlightFetch, refetch]);

  // One shared "results are updating" signal: pending debounced filter input
  // and background refetches both dim the list the same way.
  const listBusy = !isLoading && (searchPending || isFetching);




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
  // Keep the table height stable while a debounced refetch is in flight by
  // swapping rows for the same number of skeleton rows.
  const skeletonRowCount = Math.max(1, Math.min(paged.length || 5, pageSize));

  // Filters change the result set — jump back to the first page so the user
  // never lands on an out-of-range (visually empty) page.
  const filterSignature = `${search}|${statusFilter}|${pageSize}|${sortKey}|${sortDir}`;
  const lastFilterSignature = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    // First pass after restoring stored prefs must keep the stored page.
    if (lastFilterSignature.current === null) {
      lastFilterSignature.current = filterSignature;
      return;
    }
    if (lastFilterSignature.current === filterSignature) return;
    lastFilterSignature.current = filterSignature;
    setPage(1);
  }, [filterSignature, hydrated]);

  const defaultDirFor = (key: SortKey): SortDir =>
    key === "issue_date" || key === "due_date" || key === "total" || key === "balance"
      ? "desc"
      : "asc";

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(defaultDirFor(key));
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

  // Screen-reader confirmation of the applied sort, announced on change only.
  const sortAnnouncement = `Sorted by ${SORT_LABELS[sortKey]}, ${
    sortDir === "asc" ? "ascending" : "descending"
  }`;

  const SortButton = ({ column, label, align }: { column: SortKey; label: string; align?: "right" }) => {
    const active = sortKey === column;
    const Icon = !active ? ChevronsUpDown : sortDir === "asc" ? ChevronUp : ChevronDown;
    const nextDir: SortDir = active ? (sortDir === "asc" ? "desc" : "asc") : defaultDirFor(column);
    const hint = active
      ? `Sorted by ${label} ${sortDir === "asc" ? "ascending" : "descending"}. Activate to sort ${
          nextDir === "asc" ? "ascending" : "descending"
        }.`
      : `Sort by ${label} ${nextDir === "asc" ? "ascending" : "descending"}`;
    return (
      <button
        type="button"
        onClick={() => toggleSort(column)}
        aria-label={hint}
        title={hint}
        className={`-mx-1 inline-flex w-full items-center gap-1 rounded-sm px-1 py-0.5 font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
          align === "right" ? "justify-end" : "justify-start"
        } ${active ? "text-foreground" : ""}`}
      >
        <span className="whitespace-nowrap">{label}</span>
        <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "opacity-100" : "opacity-50"}`} aria-hidden="true" />
      </button>
    );
  };

  type InvoiceRow = (typeof invoices)[number];

  const COLUMN_DEFS: Record<
    SortKey,
    {
      shortLabel: string;
      align?: "right";
      headClass?: string;
      cellClass?: string;
      cell: (i: InvoiceRow) => ReactNode;
    }
  > = {
    invoice_number: {
      shortLabel: "Invoice #",
      headClass: "whitespace-nowrap",
      cellClass: "whitespace-nowrap",
      cell: (i) => (
        <Link
          to="/admin/invoices/$id"
          params={{ id: i.id }}
          className="text-accent hover:underline font-medium rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          {i.invoice_number}
        </Link>
      ),
    },
    customer: {
      shortLabel: "Customer",
      cellClass: "max-w-[240px] truncate",
      cell: (i) => customerDisplayName(i.customers as CustomerDisplay | null),
    },
    issue_date: {
      shortLabel: "Date",
      headClass: "whitespace-nowrap",
      cellClass: "whitespace-nowrap",
      cell: (i) => formatDate(i.issue_date),
    },
    due_date: {
      shortLabel: "Due",
      headClass: "whitespace-nowrap",
      cellClass: "whitespace-nowrap",
      cell: (i) => formatDate(i.due_date),
    },
    status: {
      shortLabel: "Status",
      headClass: "whitespace-nowrap",
      cell: (i) => (
        <Badge variant={invoiceStatusVariant(i.status)}>{invoiceStatusLabel(i.status)}</Badge>
      ),
    },
    total: {
      shortLabel: "Total",
      align: "right",
      headClass: "whitespace-nowrap text-right",
      cellClass: "whitespace-nowrap text-right tabular-nums",
      cell: (i) => formatMoney(financeTotalAmount(i), i.currency),
    },
    balance: {
      shortLabel: "Balance",
      align: "right",
      headClass: "whitespace-nowrap text-right",
      cellClass: "whitespace-nowrap text-right tabular-nums",
      cell: (i) => formatMoney(financeBalanceDue(i), i.currency),
    },
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

  // Pre-flight validation of the current selection. Rows that can never
  // produce a usable PDF are excluded up-front instead of failing mid-run.
  const exportPlan = useMemo(() => {
    const rows = invoices.filter((i) => selected.has(i.id));
    const ready: typeof rows = [];
    const blocked: { id: string; name: string; reason: string }[] = [];
    for (const i of rows) {
      const name = i.invoice_number || i.id.slice(0, 8);
      const reasons: string[] = [];
      if (!i.customers) reasons.push("no customer linked");
      if (!i.issue_date) reasons.push("missing issue date");
      if (!i.currency) reasons.push("missing currency");
      if (reasons.length > 0) blocked.push({ id: i.id, name, reason: reasons.join(", ") });
      else ready.push(i);
    }
    return { ready, blocked, total: rows.length };
  }, [invoices, selected]);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke only after the browser has picked the download up.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  // One retry per document — most failures are transient fetch/render hiccups.
  const renderPdfBlob = async (id: string) => {
    try {
      return await generateInvoicePdf(id, "blob");
    } catch {
      return await generateInvoicePdf(id, "blob");
    }
  };

  const handleBulkExport = async () => {
    const rows = exportPlan.ready;
    if (rows.length === 0) {
      toast.error("None of the selected invoices are ready for export");
      return;
    }
    setExporting(true);
    setExportFailures([]);
    setProgress({ done: 0, total: rows.length });
    const t = toast.loading(`Generating ${rows.length} PDF${rows.length > 1 ? "s" : ""}…`);
    try {
      const failures: { name: string; message: string }[] = [];
      const files: { filename: string; blob: Blob }[] = [];
      let index = 0;
      for (const row of rows) {
        const name = row.invoice_number || row.id.slice(0, 8);
        try {
          const res = await renderPdfBlob(row.id);
          files.push({ filename: res.filename, blob: res.blob });
          URL.revokeObjectURL(res.url);
        } catch (e) {
          console.error("PDF failed", row.id, e);
          failures.push({ name, message: e instanceof Error ? e.message : "Generation failed" });
        }
        index++;
        setProgress({ done: index, total: rows.length });
      }

      if (files.length === 0) throw new Error("No PDFs could be generated");

      if (files.length === 1) {
        triggerDownload(files[0].blob, files[0].filename);
      } else {
        const zip = new JSZip();
        const used = new Set<string>();
        for (const f of files) {
          // Guard against duplicate filenames silently overwriting entries.
          let filename = f.filename;
          let n = 2;
          while (used.has(filename)) {
            filename = f.filename.replace(/(\.pdf)?$/i, `-${n}.pdf`);
            n++;
          }
          used.add(filename);
          zip.file(filename, f.blob);
        }
        const stamp = new Date().toISOString().slice(0, 10);
        try {
          const blob = await zip.generateAsync({ type: "blob" });
          triggerDownload(blob, `${label}-Invoices-${stamp}.zip`);
        } catch (zipError) {
          // ZIP packaging failed — fall back to individual downloads.
          console.error("ZIP packaging failed", zipError);
          for (const f of files) triggerDownload(f.blob, f.filename);
        }
      }

      setExportFailures(failures);
      if (failures.length === 0) {
        toast.success(
          files.length === 1
            ? "PDF downloaded"
            : `Downloaded ${files.length} PDFs as a ZIP`,
          { id: t },
        );
        setSelected(new Set());
      } else {
        toast.warning(`Exported ${files.length} of ${rows.length} — ${failures.length} failed`, {
          id: t,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Export failed";
      toast.error(msg, { id: t });
    } finally {
      setExporting(false);
      setProgress(null);
    }
  };

  const handleBulkStatus = async (action: BulkActionKey) => {
    const status = BULK_STATUS[action];
    const ids = Array.from(selected);
    if (!status || ids.length === 0) return;
    const copy = BULK_COPY[action];
    const t = toast.loading(`Updating ${ids.length} invoice${ids.length > 1 ? "s" : ""}…`);
    try {
      const before = invoices
        .filter((i) => selected.has(i.id))
        .map((i) => ({ id: i.id, status: i.status }));
      const { error } = await supabase.from("invoices").update({ status }).in("id", ids);
      if (error) throw error;

      const { data: auth } = await supabase.auth.getUser();
      // Audit trail — never block the mutation if the log write fails.
      const { error: auditError } = await supabase.from("activity_logs").insert({
        user_id: auth?.user?.id ?? null,
        action: `invoice.bulk_${action}`,
        entity_type: "invoices",
        entity_id: null,
        metadata: { count: ids.length, ids, type },
        old_values: before,
        new_values: ids.map((id) => ({ id, status })),
      });
      if (auditError) console.warn("activity_logs insert failed", auditError);


      setSelected(new Set());
      await refetch();
      toast.success(`${copy.label} — ${ids.length} invoice${ids.length > 1 ? "s" : ""} updated`, {
        id: t,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk update failed", { id: t });
    }
  };

  const runBulkAction = async (action: BulkActionKey) => {
    setRunningAction(action);
    try {
      if (action === "export") await handleBulkExport();
      else await handleBulkStatus(action);
    } finally {
      setRunningAction(null);
      setPendingAction(null);
    }
  };

  const busy = runningAction !== null || exporting;


  const setResult = (id: string, state: "success" | "error", message: string) => {
    setRowResult((prev) => ({ ...prev, [id]: { state, message } }));
    setRowAnnounce(message);
    window.setTimeout(() => {
      setRowResult((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 5000);
  };

  const downloadOne = async (id: string, label?: string | null) => {
    const name = label ?? "invoice";
    setRowBusy(id);
    setRowResult((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setRowAnnounce(`Generating PDF for ${name}…`);
    const t = toast.loading(`Generating PDF for ${name}…`);
    try {
      await generateInvoicePdf(id, "download");
      toast.success(`PDF downloaded for ${name}`, { id: t });
      setResult(id, "success", `PDF downloaded for ${name}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Export failed";
      toast.error(message, { id: t });
      setResult(id, "error", `PDF failed for ${name}: ${message}`);
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
      search={searchInput}
      onSearchChange={setSearchInput}

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

          <Button
            size="sm"
            variant="outline"
            className="h-8 shrink-0"
            onClick={handleCopyLink}
            title="Copy a link that reopens this view with the current filters, sorting and page"
          >
            <Link2 className="mr-1.5 size-3.5" aria-hidden="true" />
            {linkCopied ? "Link copied" : "Copy link"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 shrink-0"
            onClick={handleResetFilters}
            disabled={!filtersDirty && !isFetching}
            title="Clear search, status, sort, rows per page and page, then reload the list"
          >
            <RotateCcw className="mr-1.5 size-3.5" aria-hidden="true" />
            Clear all filters
          </Button>


          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0"
                title="Show, hide and reorder table columns — the layout is remembered on this device"
              >
                <Columns3 className="mr-1.5 size-3.5" aria-hidden="true" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-2">
              <div className="flex items-center justify-between px-1 pb-2">
                <p className="text-xs font-medium text-muted-foreground">Table columns</p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={columns.reset}
                  disabled={!columns.dirty}
                >
                  Reset
                </Button>
              </div>
              <ul className="space-y-0.5">
                {columns.order.map((c, index) => (
                  <li key={c} className="flex items-center gap-2 rounded-sm px-1 py-1 hover:bg-muted/60">
                    <Checkbox
                      id={`invoice-col-${c}`}
                      checked={columns.isVisible(c)}
                      onCheckedChange={(v) => columns.toggle(c, v === true)}
                      disabled={columns.isVisible(c) && columns.visibleOrder.length === 1}
                      aria-label={`Show ${SORT_LABELS[c]} column`}
                    />
                    <Label htmlFor={`invoice-col-${c}`} className="min-w-0 flex-1 truncate text-sm font-normal">
                      {SORT_LABELS[c]}
                    </Label>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => columns.move(c, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${SORT_LABELS[c]} left`}
                    >
                      <ArrowUp className="size-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => columns.move(c, 1)}
                      disabled={index === columns.order.length - 1}
                      aria-label={`Move ${SORT_LABELS[c]} right`}
                    >
                      <ArrowDown className="size-3.5" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>


          <p
            aria-live="polite"
            className={`flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity ${
              listBusy ? "opacity-100" : "opacity-0"
            }`}
          >
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            {listBusy ? "Updating results…" : ""}
          </p>



          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 sm:ml-auto">
            <Tooltip>
              {/*
                The export button stays focusable and keeps its tooltip when
                unavailable (aria-disabled instead of disabled), so keyboard
                users can read why it can't be used yet.
              */}
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  aria-disabled={selected.size === 0 || busy}
                  onClick={() => {
                    if (selected.size === 0 || busy) return;
                    setPendingAction("export");
                  }}
                  className={
                    selected.size === 0 || busy
                      ? "pointer-events-auto opacity-50"
                      : undefined
                  }
                >
                  {exporting ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <FileDown className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Export PDF{selected.size > 1 ? "s" : ""}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" collisionPadding={12} role="tooltip">
                {selected.size === 0
                  ? "Select one or more invoices to export them as PDF."
                  : `Download ${selected.size} invoice PDF${selected.size > 1 ? "s (zipped)" : ""}.`}
              </TooltipContent>
            </Tooltip>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label="Why invoices are created from an order"
                >
                  <Info className="size-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                collisionPadding={12}
                className="max-w-[260px]"
                role="tooltip"
              >
                Invoices are generated from a confirmed order so totals and line items stay in sync.
              </TooltipContent>
            </Tooltip>
          </div>

        </div>

        {selected.size > 0 && (
          <div
            data-testid="bulk-action-bar"
            role="region"
            aria-label="Bulk actions"
            className="flex flex-col gap-2 border-b bg-muted/40 p-3 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <p className="text-sm font-medium" aria-live="polite">
              {selected.size} selected
              {progress ? (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Processing {progress.done} of {progress.total}…
                </span>
              ) : null}
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              {(["export", "issue", "paid", "void"] as BulkActionKey[]).map((action) => (
                <Button
                  key={action}
                  size="sm"
                  variant={BULK_COPY[action].destructive ? "destructive" : "outline"}
                  onClick={() => setPendingAction(action)}
                  disabled={busy}
                >
                  {runningAction === action ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : null}
                  {runningAction === action ? "Processing…" : BULK_COPY[action].label}
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected(new Set())}
                disabled={busy}
              >
                Clear selection
              </Button>
            </div>
            {exportFailures.length > 0 ? (
              <div
                role="alert"
                className="w-full rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs"
              >
                <p className="font-medium text-destructive">
                  {exportFailures.length} PDF{exportFailures.length > 1 ? "s" : ""} failed to
                  generate
                </p>
                <ul className="mt-1 max-h-24 space-y-0.5 overflow-y-auto text-muted-foreground">
                  {exportFailures.map((f) => (
                    <li key={f.name}>
                      <span className="font-medium text-foreground">{f.name}</span> — {f.message}
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  disabled={busy}
                  onClick={() => setPendingAction("export")}
                >
                  Retry export
                </Button>
              </div>
            ) : null}
          </div>
        )}
      

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction ? BULK_COPY[pendingAction].title : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "export"
                ? exportPlan.ready.length === 0
                  ? "None of the selected invoices can be exported yet — each is missing a customer, issue date, or currency."
                  : exportPlan.ready.length === 1
                    ? "1 invoice is ready. One PDF will be generated and downloaded."
                    : `${exportPlan.ready.length} invoices are ready. Their PDFs will be generated and downloaded together as a single ZIP file.`
                : pendingAction
                  ? BULK_COPY[pendingAction].body(selected.size)
                  : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingAction === "export" && exportPlan.blocked.length > 0 ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs">
              <p className="font-medium text-destructive">
                {exportPlan.blocked.length} of {exportPlan.total} selected will be skipped
              </p>
              <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto text-muted-foreground">
                {exportPlan.blocked.map((b) => (
                  <li key={b.id}>
                    <span className="font-medium text-foreground">{b.name}</span> — {b.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || (pendingAction === "export" && exportPlan.ready.length === 0)}
              className={
                pendingAction && BULK_COPY[pendingAction].destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault();
                if (pendingAction) void runBulkAction(pendingAction);
              }}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Processing…
                </>
              ) : (
                (pendingAction && BULK_COPY[pendingAction].confirm) || "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isError ? (
        <div className="p-4 md:p-6" data-testid="list-error-state">
          <Card className="border-destructive/40">
            <CardContent
              role="alert"
              aria-live="assertive"
              className="flex flex-col items-center gap-3 px-6 py-12 text-center"
            >
              <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
                <TriangleAlert className="size-6" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-foreground">
                We couldn't load your {label.toLowerCase()} invoices
              </h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Something went wrong while reaching the server. Your data is safe — check
                your connection and try again.
              </p>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isFetching}
                className="mt-2"
              >
                {isFetching ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="size-4" aria-hidden="true" />
                )}
                {isFetching ? "Retrying…" : "Try again"}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : isLoading ? (
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
      ) : filtered.length === 0 && !listBusy ? (
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
                    setSearchInput("");
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
        <div
          aria-busy={listBusy}
          className={
            listBusy
              ? "pointer-events-none opacity-60 transition-opacity duration-200"
              : "transition-opacity duration-200"
          }
        >
          <p aria-live="polite" className="sr-only">
            {sortAnnouncement}
          </p>

          {/* Mobile has no column headers — expose the same sort keys as controls */}
          <div className="flex items-center gap-2 border-b p-3 md:hidden">
            <Label htmlFor="invoice-sort-mobile" className="shrink-0 text-xs text-muted-foreground">
              Sort by
            </Label>
            <Select
              value={sortKey}
              onValueChange={(v) => {
                setSortKey(v as SortKey);
                setSortDir(defaultDirFor(v as SortKey));
              }}
            >
              <SelectTrigger id="invoice-sort-mobile" className="h-8 min-w-0 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {SORT_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {SORT_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              aria-label={`Sort direction: ${
                sortDir === "asc" ? "ascending" : "descending"
              }. Activate to sort ${sortDir === "asc" ? "descending" : "ascending"}.`}
            >
              {sortDir === "asc" ? (
                <ChevronUp className="size-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="size-4" aria-hidden="true" />
              )}
              <span className="text-xs">{sortDir === "asc" ? "Asc" : "Desc"}</span>
            </Button>
          </div>

      {/* Mobile: stacked cards — no horizontal scrolling, tap targets stay usable */}

      <div className="md:hidden divide-y" data-testid={listBusy ? "list-updating" : undefined}>
        {listBusy
          ? Array.from({ length: skeletonRowCount }).map((_, idx) => (
              <div key={`sk-${idx}`} className="p-3" data-testid="row-skeleton">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                  <Skeleton className="mt-1 size-4 shrink-0 rounded-sm" />
                  <div className="min-w-0 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
                </div>
                <div className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 pl-7 min-[360px]:grid-cols-2">
                  {Array.from({ length: 4 }).map((__, j) => (
                    <Skeleton key={j} className="h-3.5 w-full" />
                  ))}
                </div>
                <div className="mt-2 flex gap-2 pl-7">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))
          : paged.map((i) => (
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
                onClick={() => downloadOne(i.id, i.invoice_number)}
                disabled={rowBusy === i.id}
              >
                {rowBusy === i.id ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : rowResult[i.id]?.state === "success" ? (
                  <Check className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                ) : rowResult[i.id]?.state === "error" ? (
                  <TriangleAlert className="mr-1 h-3.5 w-3.5 text-destructive" />
                ) : (
                  <FileDown className="mr-1 h-3.5 w-3.5" />
                )}
                {rowBusy === i.id ? "Generating…" : "PDF"}
              </Button>
              {rowResult[i.id] ? (
                <p
                  className={
                    rowResult[i.id]!.state === "error"
                      ? "self-center text-xs text-destructive"
                      : "self-center text-xs text-emerald-600 dark:text-emerald-400"
                  }
                >
                  {rowResult[i.id]!.state === "error" ? "Download failed" : "Downloaded"}
                </p>
              ) : null}
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
              {columns.visibleOrder.map((c) => (
                <TableHead key={c} className={COLUMN_DEFS[c].headClass} {...sortProps(c)}>
                  <SortButton column={c} label={COLUMN_DEFS[c].shortLabel} align={COLUMN_DEFS[c].align} />
                </TableHead>
              ))}

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
                {columns.visibleOrder.map((c) => (
                  <TableCell key={c} className={COLUMN_DEFS[c].cellClass}>
                    {COLUMN_DEFS[c].cell(i)}
                  </TableCell>
                ))}

                <TableCell className="text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => downloadOne(i.id, i.invoice_number)}
                        disabled={rowBusy === i.id}
                        aria-label={
                          rowBusy === i.id
                            ? `Generating PDF for ${i.invoice_number ?? i.id}`
                            : `Download PDF for ${i.invoice_number ?? i.id}`
                        }
                      >
                        {rowBusy === i.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : rowResult[i.id]?.state === "success" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : rowResult[i.id]?.state === "error" ? (
                          <TriangleAlert className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <FileDown className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {rowBusy === i.id
                        ? "Generating PDF…"
                        : (rowResult[i.id]?.message ?? "Download PDF")}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

          </TableBody>
        </Table>
      </div>
      <div aria-live="polite" role="status" className="sr-only">
        {rowAnnounce}
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
        </div>

      )}
      </TooltipProvider>
    </MasterListShell>
  );
}
