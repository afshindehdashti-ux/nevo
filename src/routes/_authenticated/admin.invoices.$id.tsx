import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowUpDown, Plus, Save, Trash2, Printer, Wallet, FileDown, Mail, History, Archive, Copy, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import JSZip from "jszip";
import { useServerFn } from "@tanstack/react-start";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import { emailInvoicePdf } from "@/lib/invoices.functions";
import {
  recordInvoicePdfVersion,
  signInvoicePdfUrl,
  purgeOlderInvoicePdfVersions,
  type InvoicePdfVersionRow,
} from "@/lib/invoice-pdf-versions";

import { formatDate, formatMoney } from "@/lib/crm-money";
import {
  INVOICE_STATUSES,
  invoiceStatusLabel,
  invoiceStatusVariant,
  PAYMENT_METHODS,
  paymentMethodLabel,
  type InvoiceStatus,
  type PaymentMethod,
} from "@/lib/crm-status";
import { useCanEditInvoices, useCanEditPayments, useCanPurgeInvoicePdfVersions } from "@/lib/crm-permissions";
import { DocumentsPanel } from "@/components/crm/DocumentsPanel";
import { ApprovalPanel } from "@/components/crm/ApprovalPanel";

const invoiceDetailSearchSchema = z.object({
  purgeUser: fallback(z.string(), "all").default("all"),
  purgeFrom: fallback(z.string(), "").default(""),
  purgeTo: fallback(z.string(), "").default(""),
  purgeVersion: fallback(z.string(), "").default(""),
  purgeMinBytes: fallback(z.string(), "").default(""),
  purgeMaxBytes: fallback(z.string(), "").default(""),
  purgePage: fallback(z.number().int(), 0).default(0),
  purgeSize: fallback(z.number().int(), 25).default(25),
  purgeSort: fallback(z.string(), "created_at_desc").default("created_at_desc"),
});

type InvoiceDetailSearch = z.infer<typeof invoiceDetailSearchSchema>;

export const Route = createFileRoute("/_authenticated/admin/invoices/$id")({
  head: () => ({ meta: [{ title: "Invoice — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  validateSearch: zodValidator(invoiceDetailSearchSchema),
  component: InvoiceDetailPage,
});

type Line = {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_pct: number;
  vat_pct: number;
  position: number;
  _new?: boolean;
  _deleted?: boolean;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log10(bytes) / 3));
  const value = bytes / Math.pow(1000, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function mbToBytes(value: string): number | null {
  const n = value.trim() === "" ? NaN : parseFloat(value);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 1_000_000);
}

function InvoiceDetailPage() {
  const { id } = useParams({ from: "/_authenticated/admin/invoices/$id" });
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/_authenticated/admin/invoices/$id" });
  const qc = useQueryClient();
  const canEdit = useCanEditInvoices();
  const canPay = useCanEditPayments();
  const canPurgePdf = useCanPurgeInvoicePdfVersions();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers(id, name, address, city, country, vat_number, email)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["invoice-items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["invoice-payments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("invoice_id", id)
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pdfVersions = [], refetch: refetchPdfVersions } = useQuery({
    queryKey: ["invoice-pdf-versions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_pdf_versions")
        .select("*")
        .eq("invoice_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InvoicePdfVersionRow[];
    },
  });

  const generatorIds = useMemo(
    () => Array.from(new Set(pdfVersions.map((v) => v.generated_by).filter((x): x is string => !!x))),
    [pdfVersions],
  );
  const { data: generatorMap = {} } = useQuery({
    queryKey: ["pdf-version-generators", generatorIds.sort().join(",")],
    enabled: generatorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", generatorIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const p of data ?? []) map[p.id] = p.full_name ?? "";
      return map;
    },
  });

  type PurgeLogRow = {
    id: string;
    user_id: string | null;
    created_at: string;
    metadata: Record<string, unknown> | null;
  };

  // -------- Purge audit log filters + pagination (URL-backed) --------
  const purgeUserFilter = search.purgeUser;
  const purgeFromDate = search.purgeFrom;
  const purgeToDate = search.purgeTo;
  const purgeVersionQuery = search.purgeVersion;
  const purgeMinBytes = search.purgeMinBytes;
  const purgeMaxBytes = search.purgeMaxBytes;
  const purgePage = search.purgePage;
  const purgePageSize = search.purgeSize;
  const purgeSort = useMemo(() => {
    const [column, direction] = search.purgeSort.split("_");
    return {
      column: column === "user" ? ("user" as const) : ("created_at" as const),
      direction: direction === "asc" ? ("asc" as const) : ("desc" as const),
    };
  }, [search.purgeSort]);
  const setPurgeSort = (column: "created_at" | "user", direction: "asc" | "desc") =>
    navigate({ search: (prev: InvoiceDetailSearch) => ({ ...prev, purgeSort: `${column}_${direction}`, purgePage: 0 }) });
  function SortHeader({ column, label, className }: { column: "created_at" | "user"; label: string; className?: string }) {
    const active = purgeSort.column === column;
    const direction = active
      ? purgeSort.direction === "asc" ? "desc" : "asc"
      : column === "created_at" ? "desc" : "asc";
    return (
      <TableHead
        className={cn("cursor-pointer select-none", className)}
        onClick={() => setPurgeSort(column, direction)}
      >
        <span className="flex items-center gap-1">
          {label}
          <ArrowUpDown className={cn("h-3 w-3", active ? "text-foreground" : "text-muted-foreground")} />
        </span>
      </TableHead>
    );
  }

  const setPurgeUserFilter = (value: string) =>
    navigate({ search: (prev: InvoiceDetailSearch) => ({ ...prev, purgeUser: value, purgePage: 0 }) });
  const setPurgeFromDate = (value: string) =>
    navigate({ search: (prev: InvoiceDetailSearch) => ({ ...prev, purgeFrom: value, purgePage: 0 }) });
  const setPurgeToDate = (value: string) =>
    navigate({ search: (prev: InvoiceDetailSearch) => ({ ...prev, purgeTo: value, purgePage: 0 }) });
  const setPurgeVersionQuery = (value: string) =>
    navigate({ search: (prev: InvoiceDetailSearch) => ({ ...prev, purgeVersion: value, purgePage: 0 }) });
  const setPurgeMinBytes = (value: string) =>
    navigate({ search: (prev: InvoiceDetailSearch) => ({ ...prev, purgeMinBytes: value, purgePage: 0 }) });
  const setPurgeMaxBytes = (value: string) =>
    navigate({ search: (prev: InvoiceDetailSearch) => ({ ...prev, purgeMaxBytes: value, purgePage: 0 }) });
  const setPurgePageSize = (value: number) =>
    navigate({ search: (prev: InvoiceDetailSearch) => ({ ...prev, purgeSize: value, purgePage: 0 }) });
  const setPurgePage = (updater: number | ((prev: number) => number)) =>
    navigate({ search: (prev: InvoiceDetailSearch) => ({ ...prev, purgePage: typeof updater === "function" ? updater(prev.purgePage) : updater }) });



  const purgeLogsQuery = useQuery({
    queryKey: ["invoice-purge-logs", id, purgeUserFilter, purgeFromDate, purgeToDate, purgePage, purgePageSize, purgeSort],
    queryFn: async () => {
      const from = purgePage * purgePageSize;
      const to = from + purgePageSize - 1;
      let query = supabase
        .from("activity_logs")
        .select("id, user_id, created_at, metadata", { count: "exact" })
        .eq("action", "purge_pdf_versions")
        .eq("entity_type", "invoice")
        .eq("entity_id", id);
      if (purgeUserFilter === "__system__") {
        query = query.is("user_id", null);
      } else if (purgeUserFilter !== "all") {
        query = query.eq("user_id", purgeUserFilter);
      }
      if (purgeFromDate) query = query.gte("created_at", new Date(purgeFromDate + "T00:00:00").toISOString());
      if (purgeToDate) query = query.lte("created_at", new Date(purgeToDate + "T23:59:59.999").toISOString());
      const sortColumn = purgeSort.column === "user" ? "user_id" : "created_at";
      const { data, error, count } = await query
        .order(sortColumn, { ascending: purgeSort.direction === "asc" })
        .range(from, to);
      if (error) throw error;
      return { rows: (data ?? []) as PurgeLogRow[], total: count ?? 0 };
    },
    placeholderData: (prev) => prev,
  });
  const purgeLogs = purgeLogsQuery.data?.rows ?? [];
  const purgeTotal = purgeLogsQuery.data?.total ?? 0;
  const refetchPurgeLogs = purgeLogsQuery.refetch;
  const purgeLoading = purgeLogsQuery.isFetching;
  const purgePageCount = Math.max(1, Math.ceil(purgeTotal / purgePageSize));

  // Distinct users across all purge logs for this invoice (for the filter dropdown).
  const { data: purgeDistinctUsers = [] } = useQuery({
    queryKey: ["invoice-purge-log-users", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("user_id")
        .eq("action", "purge_pdf_versions")
        .eq("entity_type", "invoice")
        .eq("entity_id", id)
        .limit(2000);
      if (error) throw error;
      const seen = new Set<string | null>();
      const out: Array<string | null> = [];
      for (const r of data ?? []) {
        const uid = r.user_id ?? null;
        if (seen.has(uid)) continue;
        seen.add(uid);
        out.push(uid);
      }
      return out;
    },
  });

  const purgeActorIds = useMemo(
    () => Array.from(new Set([
      ...purgeDistinctUsers.filter((x): x is string => !!x),
      ...purgeLogs.map((l) => l.user_id).filter((x): x is string => !!x),
    ])),
    [purgeDistinctUsers, purgeLogs],
  );
  const { data: purgeActorMap = {} } = useQuery({
    queryKey: ["purge-log-actors", purgeActorIds.sort().join(",")],
    enabled: purgeActorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", purgeActorIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const p of data ?? []) map[p.id] = p.full_name ?? "";
      return map;
    },
  });

  const purgeUserOptions = useMemo(() => {
    return purgeDistinctUsers
      .map((uid) => ({
        id: uid ?? "__system__",
        label: uid ? purgeActorMap[uid] ?? "Unknown user" : "System",
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [purgeDistinctUsers, purgeActorMap]);

  // Version-ID search and file-size filters are applied client-side to the
  // current page (metadata is JSON and not indexed server-side). Everything
  // else is filtered server-side.
  const filteredPurgeLogs = useMemo(() => {
    const idQ = purgeVersionQuery.trim().toLowerCase();
    const minBytes = mbToBytes(purgeMinBytes);
    const maxBytes = mbToBytes(purgeMaxBytes);
    let rows = idQ
      ? purgeLogs.filter((log) => {
          const meta = (log.metadata ?? {}) as { version_ids?: string[] };
          const ids = Array.isArray(meta.version_ids) ? meta.version_ids : [];
          return ids.some((v) => v.toLowerCase().includes(idQ));
        })
      : purgeLogs;
    if (minBytes != null || maxBytes != null) {
      rows = rows.filter((log) => {
        const total = ((log.metadata ?? {}) as { total_bytes?: number }).total_bytes ?? 0;
        if (minBytes != null && total < minBytes) return false;
        if (maxBytes != null && total > maxBytes) return false;
        return true;
      });
    }
    if (purgeSort.column === "user") {
      rows = [...rows].sort((a, b) => {
        const nameA = a.user_id ? purgeActorMap[a.user_id] ?? "Unknown user" : "System";
        const nameB = b.user_id ? purgeActorMap[b.user_id] ?? "Unknown user" : "System";
        return purgeSort.direction === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    } else if (purgeSort.column === "created_at") {
      rows = [...rows].sort((a, b) => {
        const cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return purgeSort.direction === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [purgeLogs, purgeVersionQuery, purgeMinBytes, purgeMaxBytes, purgeSort, purgeActorMap]);
  const purgeFiltersActive =
    purgeUserFilter !== "all" ||
    purgeFromDate !== "" ||
    purgeToDate !== "" ||
    purgeVersionQuery.trim() !== "" ||
    purgeMinBytes !== "" ||
    purgeMaxBytes !== "";
  const resetPurgeFilters = () => {
    navigate({
      search: (prev: InvoiceDetailSearch) => ({
        ...prev,
        purgeUser: "all",
        purgeFrom: "",
        purgeTo: "",
        purgeVersion: "",
        purgeMinBytes: "",
        purgeMaxBytes: "",
        purgePage: 0,
      }),
    });
  };
  const setPurgeDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    const fmt = (d: Date) => d.toLocaleDateString("en-CA");
    navigate({
      search: (prev: InvoiceDetailSearch) => ({
        ...prev,
        purgeFrom: fmt(start),
        purgeTo: fmt(end),
        purgePage: 0,
      }),
    });
  };



  // -------- Purge audit row selection --------
  const [selectedPurgeIds, setSelectedPurgeIds] = useState<Set<string>>(new Set());
  const togglePurgeSelected = (logId: string, checked: boolean) => {
    setSelectedPurgeIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(logId); else next.delete(logId);
      return next;
    });
  };
  const allFilteredSelected =
    filteredPurgeLogs.length > 0 && filteredPurgeLogs.every((l) => selectedPurgeIds.has(l.id));
  const someFilteredSelected =
    !allFilteredSelected && filteredPurgeLogs.some((l) => selectedPurgeIds.has(l.id));
  const toggleAllFiltered = (checked: boolean) => {
    setSelectedPurgeIds((prev) => {
      const next = new Set(prev);
      if (checked) filteredPurgeLogs.forEach((l) => next.add(l.id));
      else filteredPurgeLogs.forEach((l) => next.delete(l.id));
      return next;
    });
  };
  const clearPurgeSelection = () => setSelectedPurgeIds(new Set());

  // Last CSV export metadata (for compliance traceability).
  const [lastPurgeExport, setLastPurgeExport] = useState<{
    filename: string;
    sha256: string;
    rowCount: number;
    scope: string;
    exportedAt: string;
    byteSize: number;
  } | null>(null);




  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("bank_transfer");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState("");
  const [pdfPreview, setPdfPreview] = useState<{
    url: string;
    filename: string;
    blob: Blob;
  } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfDocTypeFilter, setPdfDocTypeFilter] = useState<"all" | "proforma" | "commercial">("all");
  const [pdfFromDate, setPdfFromDate] = useState("");
  const [pdfToDate, setPdfToDate] = useState("");
  const [pdfNote, setPdfNote] = useState("");

  // -------- PDF retention policy --------
  const { data: retentionSetting, refetch: refetchRetention } = useQuery({
    queryKey: ["pdf-retention-setting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("id, pdf_version_retention_count")
        .eq("is_active", true)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [retentionInput, setRetentionInput] = useState<string>("20");
  const [savingRetention, setSavingRetention] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  type RemovedPdfSnapshot = {
    id: string;
    filename: string;
    byte_size: number | null;
    source: string;
    doc_type: string;
    created_at: string;
    blobUrl: string;
  };
  const [removedOpen, setRemovedOpen] = useState(false);
  const [removedItems, setRemovedItems] = useState<RemovedPdfSnapshot[]>([]);
  const closeRemovedModal = () => {
    setRemovedOpen(false);
    // Revoke blob URLs to free memory
    setTimeout(() => {
      setRemovedItems((prev) => {
        prev.forEach((r) => {
          try { URL.revokeObjectURL(r.blobUrl); } catch { /* noop */ }
        });
        return [];
      });
    }, 300);
  };
  useEffect(() => {
    if (retentionSetting?.pdf_version_retention_count != null) {
      setRetentionInput(String(retentionSetting.pdf_version_retention_count));
    }
  }, [retentionSetting?.pdf_version_retention_count]);
  const globalRetentionCount = Math.max(1, Math.min(500, parseInt(retentionInput || "20", 10) || 20));

  // -------- Per-invoice retention override --------
  const invoiceOverride = (invoice as { pdf_version_retention_count?: number | null } | undefined)
    ?.pdf_version_retention_count ?? null;
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [overrideInput, setOverrideInput] = useState<string>("20");
  const [savingOverride, setSavingOverride] = useState(false);
  useEffect(() => {
    if (invoiceOverride != null) {
      setOverrideEnabled(true);
      setOverrideInput(String(invoiceOverride));
    } else {
      setOverrideEnabled(false);
    }
  }, [invoiceOverride]);
  const overrideCount = Math.max(1, Math.min(500, parseInt(overrideInput || "20", 10) || 20));
  const effectiveRetention = overrideEnabled ? overrideCount : globalRetentionCount;
  const effectiveRetentionPersisted = invoiceOverride ?? retentionSetting?.pdf_version_retention_count ?? null;

  const overRetentionCount = Math.max(0, pdfVersions.length - effectiveRetention);
  const toPurgeVersions = useMemo(
    () => pdfVersions.slice(effectiveRetention),
    [pdfVersions, effectiveRetention],
  );

  async function autoPruneIfNeeded() {
    if (!effectiveRetentionPersisted) return;
    if (!canPurgePdf) return; // silent no-op for non-privileged users
    try {
      const removed = await purgeOlderInvoicePdfVersions(id, effectiveRetentionPersisted);
      if (removed > 0) {
        refetchPdfVersions();
        const { data: latestLog } = await supabase
          .from("activity_logs")
          .select("id")
          .eq("action", "purge_pdf_versions")
          .eq("entity_type", "invoice")
          .eq("entity_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        await refetchPurgeLogs();
        qc.invalidateQueries({ queryKey: ["invoice-purge-log-users", id] });
        toast.success(`Purged ${removed} PDF version${removed === 1 ? "" : "s"}`, {
          description: `Automatic prune to retention of ${effectiveRetentionPersisted}. A new entry has been added to the audit log.`,
          action: {
            label: "View log entry",
            onClick: () => scrollToPurgeLog(latestLog?.id),
          },
        });
      }
    } catch (e) {
      console.warn("auto-prune failed", e);
    }
  }


  async function saveRetentionSetting() {
    if (!retentionSetting?.id) {
      toast.error("Company settings not initialised");
      return;
    }
    setSavingRetention(true);
    try {
      const { error } = await supabase
        .from("company_settings")
        .update({ pdf_version_retention_count: globalRetentionCount })
        .eq("id", retentionSetting.id);
      if (error) throw error;
      toast.success(`Global retention set to ${globalRetentionCount} versions`);
      refetchRetention();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save setting");
    } finally {
      setSavingRetention(false);
    }
  }

  async function saveInvoiceOverride(nextValue: number | null) {
    setSavingOverride(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ pdf_version_retention_count: nextValue } as never)
        .eq("id", id);
      if (error) throw error;
      toast.success(
        nextValue == null
          ? "Per-invoice override cleared"
          : `Per-invoice retention set to ${nextValue}`,
      );
      qc.invalidateQueries({ queryKey: ["invoice", id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save override");
    } finally {
      setSavingOverride(false);
    }
  }

  function openPurgeConfirm() {
    if (!canPurgePdf) {
      toast.error("You don't have permission to purge PDF versions.", {
        description: "Only Super Admin, Management, or Finance can purge archive history.",
      });
      return;
    }
    if (overRetentionCount === 0) {
      toast.info("Nothing to purge");
      return;
    }
    setPurgeOpen(true);
  }

  function scrollToPurgeLog(logId?: string) {
    const target = logId
      ? document.getElementById(`purge-log-${logId}`)
      : document.getElementById("purge-audit-log");
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    if (logId) {
      target.classList.add("ring-2", "ring-primary");
      setTimeout(() => target.classList.remove("ring-2", "ring-primary"), 2000);
    }
  }

  function getPurgeLogDeepLink(logId: string) {
    return `${window.location.origin}${window.location.pathname}#purge-log-${logId}`;
  }

  async function copyPurgeLogLink(logId: string) {
    try {
      await navigator.clipboard.writeText(getPurgeLogDeepLink(logId));
      toast.success("Link copied", { description: "Deep link to this audit entry is on the clipboard." });
    } catch {
      toast.error("Copy failed", { description: "Could not access the clipboard." });
    }
  }

  function useDeepLinkedPurgeLogHighlight() {
    useEffect(() => {
      const hash = window.location.hash;
      if (!hash.startsWith("#purge-log-")) return;
      const logId = hash.replace("#purge-log-", "");
      // Wait a tick for the table to render.
      const timer = setTimeout(() => scrollToPurgeLog(logId), 100);
      return () => clearTimeout(timer);
    }, [purgeLogs.length]);
  }

  useDeepLinkedPurgeLogHighlight();

  async function confirmPurge() {
    setPurging(true);
    try {
      // Snapshot the PDFs into blob URLs BEFORE deletion so users can still
      // download them from the "View removed PDFs" modal after storage is wiped.
      const versionsToRemove = toPurgeVersions;
      const snapshots: RemovedPdfSnapshot[] = [];
      for (const v of versionsToRemove) {
        try {
          const url = await signInvoicePdfUrl(v.storage_path, 300);
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
          const blob = await res.blob();
          snapshots.push({
            id: v.id,
            filename: v.filename,
            byte_size: v.byte_size,
            source: v.source,
            doc_type: v.doc_type,
            created_at: v.created_at,
            blobUrl: URL.createObjectURL(blob),
          });
        } catch (e) {
          console.warn("Failed to snapshot PDF before purge", v.id, e);
        }
      }

      const removed = await purgeOlderInvoicePdfVersions(id, effectiveRetention);
      refetchPdfVersions();
      const { data: latestLog } = await supabase
        .from("activity_logs")
        .select("id")
        .eq("action", "purge_pdf_versions")
        .eq("entity_type", "invoice")
        .eq("entity_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      await refetchPurgeLogs();
      qc.invalidateQueries({ queryKey: ["invoice-purge-log-users", id] });

      setRemovedItems(snapshots);
      toast.success(`Purged ${removed} PDF version${removed === 1 ? "" : "s"}`, {
        description: snapshots.length > 0
          ? `${snapshots.length} archived for download. A new audit log entry was created.`
          : "A new entry has been added to the purge audit log.",
        action: snapshots.length > 0
          ? { label: "View removed PDFs", onClick: () => setRemovedOpen(true) }
          : { label: "View log entry", onClick: () => scrollToPurgeLog(latestLog?.id) },
      });
      setPurgeOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Purge failed");
    } finally {
      setPurging(false);
    }
  }


  function exportPurgeListCsv() {
    const rows = toPurgeVersions;
    if (rows.length === 0) return;
    const header = ["Version ID", "Generated At", "Generated By", "Source", "Type", "Filename", "Storage Path"];
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = [
      header.join(","),
      ...rows.map((v) => {
        const dt = new Date(v.created_at);
        const stamp = dt.toISOString();
        const who = v.generated_by ? generatorMap[v.generated_by] ?? "Unknown user" : "System";
        const source = v.source;
        const type = v.doc_type === "proforma" ? "Proforma" : "Commercial";
        return [
          escape(v.id),
          escape(stamp),
          escape(who),
          escape(source),
          escape(type),
          escape(v.filename ?? ""),
          escape(v.storage_path ?? ""),
        ].join(",");
      }),
    ];
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoice?.invoice_number ?? id}-purge-list-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function exportPurgeAuditCsv(rows?: PurgeLogRow[], scopeLabel = "filtered") {
    if (!canPurgePdf) {
      toast.error("You don't have permission to export the purge audit log.", {
        description: "Only Super Admin, Management, or Finance can export purge history.",
      });
      return;
    }
    // Resolve the actual rows to export. For "filtered" we fetch all matching
    // rows across pages; for "selected" we fetch by id. Callers may pass rows
    // directly to skip the network round-trip.
    let source: PurgeLogRow[] = rows ?? [];
    try {
      if (!rows) {
        let query = supabase
          .from("activity_logs")
          .select("id, user_id, created_at, metadata")
          .eq("action", "purge_pdf_versions")
          .eq("entity_type", "invoice")
          .eq("entity_id", id);
        if (purgeUserFilter === "__system__") query = query.is("user_id", null);
        else if (purgeUserFilter !== "all") query = query.eq("user_id", purgeUserFilter);
        if (purgeFromDate) query = query.gte("created_at", new Date(purgeFromDate + "T00:00:00").toISOString());
        if (purgeToDate) query = query.lte("created_at", new Date(purgeToDate + "T23:59:59.999").toISOString());
        const sortColumn = purgeSort.column === "user" ? "user_id" : "created_at";
        const { data, error } = await query
          .order(sortColumn, { ascending: purgeSort.direction === "asc" })
          .limit(10000);
        if (error) throw error;
        source = (data ?? []) as PurgeLogRow[];
        // Apply client-side version-id filter (JSON metadata; not queryable).
        const idQ = purgeVersionQuery.trim().toLowerCase();
        if (idQ) {
          source = source.filter((log) => {
            const meta = (log.metadata ?? {}) as { version_ids?: string[] };
            const ids = Array.isArray(meta.version_ids) ? meta.version_ids : [];
            return ids.some((v) => v.toLowerCase().includes(idQ));
          });
        }
      }
      // Apply the same audit-log sort to the exported rows.
      if (purgeSort.column === "user") {
        source = [...source].sort((a, b) => {
          const nameA = a.user_id ? purgeActorMap[a.user_id] ?? "Unknown user" : "System";
          const nameB = b.user_id ? purgeActorMap[b.user_id] ?? "Unknown user" : "System";
          return purgeSort.direction === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });
      } else if (purgeSort.column === "created_at") {
        source = [...source].sort((a, b) => {
          const cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          return purgeSort.direction === "asc" ? cmp : -cmp;
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load audit entries for export");
      return;
    }
    if (source.length === 0) {
      toast.info("No purge audit entries to export");
      return;
    }
    const header = [
      "Log ID",
      "Timestamp (ISO)",
      "Timestamp (Local)",
      "User ID",
      "User Name",
      "Invoice ID",
      "Invoice Number",
      "Removed Count",
      "Kept",
      "Removed Version IDs",
    ];
    const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const lines = [
      header.join(","),
      ...source.map((log) => {
        const meta = (log.metadata ?? {}) as {
          removed_count?: number;
          kept?: number;
          version_ids?: string[];
        };
        const who = log.user_id ? purgeActorMap[log.user_id] ?? "Unknown user" : "System";
        const ids = Array.isArray(meta.version_ids) ? meta.version_ids : [];
        return [
          escape(log.id),
          escape(log.created_at),
          escape(new Date(log.created_at).toLocaleString()),
          escape(log.user_id ?? ""),
          escape(who),
          escape(id),
          escape(invoice?.invoice_number ?? ""),
          escape(String(meta.removed_count ?? ids.length)),
          escape(meta.kept != null ? String(meta.kept) : ""),
          escape(ids.join("; ")),
        ].join(",");
      }),
    ];
    const csv = lines.join("\n");
    const bytes = new TextEncoder().encode(csv);
    // Compute SHA-256 checksum for compliance traceability.
    let sha256 = "";
    try {
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      sha256 = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      sha256 = "";
    }
    const blob = new Blob([bytes], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const filename = `invoice-${invoice?.invoice_number ?? id}-purge-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setLastPurgeExport({
      filename,
      sha256,
      rowCount: source.length,
      scope: scopeLabel,
      exportedAt: new Date().toISOString(),
      byteSize: bytes.byteLength,
    });
    toast.success(`Exported ${source.length} ${scopeLabel} audit entr${source.length === 1 ? "y" : "ies"}`, {
      description: sha256 ? `SHA-256: ${sha256.slice(0, 16)}…` : undefined,
    });
  }

  useEffect(() => {
    return () => {
      if (pdfPreview) URL.revokeObjectURL(pdfPreview.url);
    };
  }, [pdfPreview]);

  async function openPdfPreview() {
    setPdfLoading(true);
    try {
      const res = await generateInvoicePdf(id, "blob");
      setPdfPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return res;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF failed");
    } finally {
      setPdfLoading(false);
    }
  }

  async function downloadCurrentPdf() {
    if (!pdfPreview || !invoice) return;
    const a = document.createElement("a");
    a.href = pdfPreview.url;
    a.download = pdfPreview.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Record this download as a stored version (best-effort, don't block UX).
    try {
      await recordInvoicePdfVersion({
        invoiceId: invoice.id,
        docType: invoice.type,
        blob: pdfPreview.blob,
        filename: pdfPreview.filename,
        source: "download",
        note: pdfNote,
      });
      setPdfNote("");
      refetchPdfVersions();
      autoPruneIfNeeded();
    } catch (e) {
      console.warn("Failed to archive PDF version", e);
    }
  }


  // -------- Email to customer --------
  const emailFn = useServerFn(emailInvoicePdf);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  function openEmailDialog() {
    const custEmail = (invoice?.customers as { email?: string | null } | null)?.email ?? "";
    setEmailTo(custEmail);
    setEmailMessage("");
    setEmailOpen(true);
  }

  async function sendInvoiceEmail() {
    if (!invoice) return;
    const to = emailTo.trim();
    if (!/^\S+@\S+\.\S+$/.test(to)) {
      toast.error("Enter a valid email address");
      return;
    }
    setEmailSending(true);
    try {
      // 1) Build the PDF (reuse the current preview if available).
      const built = pdfPreview ?? (await generateInvoicePdf(invoice.id, "blob"));
      // 2) Upload to crm-docs and record a version row (helper handles both).
      const { storagePath } = await recordInvoicePdfVersion({
        invoiceId: invoice.id,
        docType: invoice.type,
        blob: built.blob,
        filename: built.filename,
        source: "email",
        note: pdfNote,
      });
      setPdfNote("");
      refetchPdfVersions();
      autoPruneIfNeeded();
      // 3) Ask the server to sign the URL and send the email.
      const res = await emailFn({
        data: {
          invoiceId: invoice.id,
          storagePath,
          recipientEmail: to,
          message: emailMessage.trim() || null,
        },
      });

      if (!res.ok) {
        toast.error(`Send failed: ${res.reason}`);
        return;
      }
      toast.success(`Emailed to ${to}. Link expires in ${res.expiresInHours}h.`);
      setEmailOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setEmailSending(false);
    }
  }

  useEffect(() => {
    if (items.length) {
      setLines(
        items.map((it, idx) => ({
          id: it.id,
          description: it.description,
          quantity: Number(it.quantity),
          unit: it.unit,
          unit_price: Number(it.unit_price),
          discount_pct: Number(it.discount_pct),
          vat_pct: Number(it.vat_pct),
          position: it.position ?? idx,
        })),
      );
    } else {
      setLines([]);
    }
  }, [items]);

  useEffect(() => {
    if (invoice) {
      setNotes(invoice.notes || "");
      setIssueDate(invoice.issue_date);
      setDueDate(invoice.due_date || "");
      setPayAmount(Number(invoice.balance).toString());
    }
  }, [invoice]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    for (const l of lines.filter((x) => !x._deleted)) {
      const gross = l.quantity * l.unit_price;
      const afterDisc = gross * (1 - (l.discount_pct || 0) / 100);
      subtotal += afterDisc;
      vat += afterDisc * ((l.vat_pct || 0) / 100);
    }
    return { subtotal, vat, total: subtotal + vat };
  }, [lines]);

  const filteredPdfVersions = useMemo(() => {
    let rows = pdfVersions;
    if (pdfDocTypeFilter !== "all") {
      rows = rows.filter((v) => v.doc_type === pdfDocTypeFilter);
    }
    if (pdfFromDate || pdfToDate) {
      rows = rows.filter((v) => {
        const d = new Date(v.created_at);
        if (pdfFromDate && d < new Date(pdfFromDate)) return false;
        if (pdfToDate) {
          const end = new Date(pdfToDate);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
        return true;
      });
    }
    return rows;
  }, [pdfVersions, pdfDocTypeFilter, pdfFromDate, pdfToDate]);

  const [downloadingAll, setDownloadingAll] = useState(false);
  const handleDownloadAllVersions = async () => {
    if (filteredPdfVersions.length === 0) return;
    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      const seen = new Map<string, number>();
      for (const v of filteredPdfVersions) {
        const url = await signInvoicePdfUrl(v.storage_path, 300);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${v.filename}`);
        const blob = await res.blob();
        const stamp = new Date(v.created_at).toISOString().replace(/[:.]/g, "-");
        let name = `${stamp}__${v.filename}`;
        const count = seen.get(name) ?? 0;
        if (count > 0) name = name.replace(/(\.pdf)?$/i, `-${count}$1`);
        seen.set(name, count + 1);
        zip.file(name, blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      const invNo = invoice?.invoice_number ?? id.slice(0, 8);
      const url = URL.createObjectURL(out);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invNo}-PDF-versions.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filteredPdfVersions.length} PDF version(s)`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to download versions");
    } finally {
      setDownloadingAll(false);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!invoice) return;
      const { error: hErr } = await supabase
        .from("invoices")
        .update({
          notes: notes || null,
          issue_date: issueDate,
          due_date: dueDate || null,
          subtotal: totals.subtotal,
          vat_amount: totals.vat,
          total: totals.total,
          balance: Math.max(totals.total - Number(invoice.amount_paid || 0), 0),
        })
        .eq("id", invoice.id);
      if (hErr) throw hErr;

      const toDelete = lines.filter((l) => l._deleted && l.id).map((l) => l.id!);
      if (toDelete.length) {
        const { error } = await supabase.from("invoice_items").delete().in("id", toDelete);
        if (error) throw error;
      }
      for (const l of lines.filter((x) => !x._deleted)) {
        const payload = {
          invoice_id: invoice.id,
          description: l.description,
          quantity: l.quantity,
          unit: l.unit,
          unit_price: l.unit_price,
          discount_pct: l.discount_pct,
          vat_pct: l.vat_pct,
          position: l.position,
          line_total:
            l.quantity * l.unit_price * (1 - (l.discount_pct || 0) / 100) *
            (1 + (l.vat_pct || 0) / 100),
        };
        if (l.id) {
          const { error } = await supabase.from("invoice_items").update(payload).eq("id", l.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("invoice_items").insert(payload);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success("Invoice saved");
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoice-items", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const setStatus = useMutation({
    mutationFn: async (status: InvoiceStatus) => {
      const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const addPayment = useMutation({
    mutationFn: async () => {
      if (!invoice) return;
      const amt = parseFloat(payAmount);
      if (!isFinite(amt) || amt <= 0) throw new Error("Enter a valid amount");
      const { error } = await supabase.from("payments").insert({
        invoice_id: invoice.id,
        amount: amt,
        currency: invoice.currency,
        method: payMethod,
        received_at: payDate,
        reference: payRef || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoice-payments", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setPayOpen(false);
      setPayRef("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deletePayment = useMutation({
    mutationFn: async (pid: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", pid);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment removed");
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoice-payments", id] });
    },
  });

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!invoice)
    return (
      <div className="p-6 space-y-4">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button asChild variant="outline">
          <Link to="/admin/invoices">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
      </div>
    );

  const cust = invoice.customers as {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    country: string | null;
    vat_number: string | null;
    email: string | null;
  } | null;

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        description: "",
        quantity: 1,
        unit: "pcs",
        unit_price: 0,
        discount_pct: 0,
        vat_pct: 0,
        position: prev.length,
        _new: true,
      },
    ]);
  }
  function removeLine(idx: number) {
    setLines((prev) => {
      const l = prev[idx];
      if (l._new) return prev.filter((_, i) => i !== idx);
      return prev.map((x, i) => (i === idx ? { ...x, _deleted: true } : x));
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto print:p-0">
      <div className="print:hidden">
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to={invoice.type === "proforma" ? "/admin/proforma-invoices" : "/admin/invoices"}>
            <ArrowLeft className="h-4 w-4 mr-1" /> All {invoice.type === "proforma" ? "proforma" : "invoices"}
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {invoice.type === "proforma" ? "Proforma Invoice" : "Commercial Invoice"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">{invoice.invoice_number}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              For{" "}
              {cust ? (
                <Link
                  to="/admin/customers/$id"
                  params={{ id: cust.id }}
                  className="text-primary hover:underline"
                >
                  {cust.name}
                </Link>
              ) : (
                "—"
              )}{" "}
              · {invoice.currency}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant={invoiceStatusVariant(invoice.status)} className="text-sm">
              {invoiceStatusLabel(invoice.status)}
            </Badge>
            {canEdit && (
              <Select
                value={invoice.status}
                onValueChange={(v) => setStatus.mutate(v as InvoiceStatus)}
              >
                <SelectTrigger className="w-44 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {invoiceStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openPdfPreview}
              disabled={pdfLoading}
            >
              <FileDown className="h-4 w-4 mr-1" />
              {pdfLoading ? "Preparing…" : "Preview PDF"}
            </Button>
            <Button variant="outline" size="sm" onClick={openEmailDialog}>
              <Mail className="h-4 w-4 mr-1" />
              Email to customer
            </Button>
            {canPay && invoice.type === "commercial" && Number(invoice.balance) > 0 && (
              <Button size="sm" onClick={() => setPayOpen(true)}>
                <Wallet className="h-4 w-4 mr-1" /> Record payment
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Line items</CardTitle>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" /> Add line
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-20">Unit</TableHead>
                  <TableHead className="w-28">Price</TableHead>
                  <TableHead className="w-20">Disc %</TableHead>
                  <TableHead className="w-20">VAT %</TableHead>
                  <TableHead className="w-28 text-right">Line total</TableHead>
                  {canEdit && <TableHead className="w-10 print:hidden" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.filter((l) => !l._deleted).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      No line items.
                    </TableCell>
                  </TableRow>
                )}
                {lines.map((l, idx) => {
                  if (l._deleted) return null;
                  const lt =
                    l.quantity * l.unit_price * (1 - (l.discount_pct || 0) / 100) *
                    (1 + (l.vat_pct || 0) / 100);
                  return (
                    <TableRow key={l.id ?? `new-${idx}`}>
                      <TableCell>
                        <Input
                          value={l.description}
                          onChange={(e) => updateLine(idx, { description: e.target.value })}
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={l.quantity}
                          onChange={(e) =>
                            updateLine(idx, { quantity: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={l.unit}
                          onChange={(e) => updateLine(idx, { unit: e.target.value })}
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={l.unit_price}
                          onChange={(e) =>
                            updateLine(idx, { unit_price: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={l.discount_pct}
                          onChange={(e) =>
                            updateLine(idx, { discount_pct: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={l.vat_pct}
                          onChange={(e) =>
                            updateLine(idx, { vat_pct: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(lt, invoice.currency)}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="print:hidden">
                          <Button size="icon" variant="ghost" onClick={() => removeLine(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="border-t p-4 flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <Row label="Subtotal" value={formatMoney(totals.subtotal, invoice.currency)} />
                <Row label="VAT" value={formatMoney(totals.vat, invoice.currency)} />
                <div className="border-t pt-1">
                  <Row
                    label={<span className="font-semibold">Total</span>}
                    value={
                      <span className="font-semibold">
                        {formatMoney(totals.total, invoice.currency)}
                      </span>
                    }
                  />
                </div>
                <Row label="Paid" value={formatMoney(invoice.amount_paid, invoice.currency)} />
                <div className="border-t pt-1">
                  <Row
                    label={<span className="font-semibold">Balance</span>}
                    value={
                      <span className="font-semibold">
                        {formatMoney(invoice.balance, invoice.currency)}
                      </span>
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Issue date</Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div>
                <Label className="text-xs">Due date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  disabled={!canEdit}
                />
              </div>
              {cust && (
                <div className="text-xs text-muted-foreground border-t pt-2">
                  <p className="font-medium text-foreground">{cust.name}</p>
                  {cust.address && <p>{cust.address}</p>}
                  <p>{[cust.city, cust.country].filter(Boolean).join(", ")}</p>
                  {cust.vat_number && <p>VAT: {cust.vat_number}</p>}
                  {cust.email && <p>{cust.email}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {invoice.type === "commercial" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {payments.length === 0 && (
                  <p className="text-sm text-muted-foreground">No payments recorded.</p>
                )}
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border rounded-md p-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {formatMoney(p.amount, p.currency)}{" "}
                        <span className="text-xs text-muted-foreground">
                          · {paymentMethodLabel(p.method)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.received_at)}
                        {p.reference && ` · ${p.reference}`}
                      </p>
                    </div>
                    {canPay && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deletePayment.mutate(p.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {invoice && (
            <ApprovalPanel
              entityType={invoice.type === "proforma" ? "proforma" : "invoice"}
              entityId={id}
              suggestedReason={`${invoice.type === "proforma" ? "Proforma" : "Invoice"} ${invoice.invoice_number ?? "(draft)"} — ${invoice.currency} ${Number(invoice.total).toLocaleString()}`}
              details={{
                total: Number(invoice.total),
                currency: invoice.currency,
                type: invoice.type,
                invoice_number: invoice.invoice_number,
              }}
            />
          )}
          <DocumentsPanel entityType="invoice" entityId={id} />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" /> PDF history
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {filteredPdfVersions.length} shown · {pdfVersions.length} total
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={filteredPdfVersions.length === 0 || downloadingAll}
                  onClick={handleDownloadAllVersions}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {downloadingAll ? "Zipping…" : "Download all"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pdfVersions.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                  No PDFs generated yet. Downloading or emailing a PDF archives a copy here.
                </p>
              ) : (
                <>
                  <div className="px-4 py-3 border-b flex flex-wrap gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <Select
                        value={pdfDocTypeFilter}
                        onValueChange={(v) => setPdfDocTypeFilter(v as typeof pdfDocTypeFilter)}
                      >
                        <SelectTrigger className="w-36 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All types</SelectItem>
                          <SelectItem value="proforma">Proforma</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">From</Label>
                      <Input
                        type="date"
                        value={pdfFromDate}
                        onChange={(e) => setPdfFromDate(e.target.value)}
                        className="h-8 w-36"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">To</Label>
                      <Input
                        type="date"
                        value={pdfToDate}
                        onChange={(e) => setPdfToDate(e.target.value)}
                        className="h-8 w-36"
                      />
                    </div>
                    {(pdfDocTypeFilter !== "all" || pdfFromDate || pdfToDate) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          setPdfDocTypeFilter("all");
                          setPdfFromDate("");
                          setPdfToDate("");
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="px-4 py-3 border-b flex flex-wrap gap-3 items-end bg-muted/30">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Global keep latest</Label>
                      <Input
                        type="number"
                        min={1}
                        max={500}
                        value={retentionInput}
                        onChange={(e) => setRetentionInput(e.target.value)}
                        className="h-8 w-24"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={saveRetentionSetting}
                      disabled={
                        savingRetention ||
                        !retentionSetting ||
                        globalRetentionCount === retentionSetting.pdf_version_retention_count
                      }
                    >
                      {savingRetention ? "Saving…" : "Save global"}
                    </Button>
                    <div className="h-8 w-px bg-border mx-1" />
                    <label className="flex items-center gap-2 text-xs text-muted-foreground select-none">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5"
                        checked={overrideEnabled}
                        onChange={(e) => setOverrideEnabled(e.target.checked)}
                      />
                      Override for this invoice
                    </label>
                    {overrideEnabled && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Invoice keep latest</Label>
                        <Input
                          type="number"
                          min={1}
                          max={500}
                          value={overrideInput}
                          onChange={(e) => setOverrideInput(e.target.value)}
                          className="h-8 w-24"
                        />
                      </div>
                    )}
                    {overrideEnabled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => saveInvoiceOverride(overrideCount)}
                        disabled={savingOverride || overrideCount === invoiceOverride}
                      >
                        {savingOverride ? "Saving…" : "Save override"}
                      </Button>
                    ) : (
                      invoiceOverride != null && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => saveInvoiceOverride(null)}
                          disabled={savingOverride}
                        >
                          Clear override
                        </Button>
                      )
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8"
                      onClick={openPurgeConfirm}
                      disabled={purging || overRetentionCount === 0 || !canPurgePdf}
                      title={
                        !canPurgePdf
                          ? "Only Super Admin, Management, or Finance can purge PDF versions."
                          : undefined
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      {purging
                        ? "Purging…"
                        : !canPurgePdf
                          ? "Purge (restricted)"
                          : overRetentionCount > 0
                            ? `Purge ${overRetentionCount} older`
                            : "Nothing to purge"}
                    </Button>
                    <p className="text-xs text-muted-foreground ml-auto max-w-xs">
                      Effective limit: {effectiveRetention}
                      {invoiceOverride != null ? " (invoice override)" : " (global)"}. New PDFs
                      auto-trim beyond this count.
                    </p>
                  </div>


                  {filteredPdfVersions.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                      No PDF versions match the selected filters.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Generated</TableHead>
                          <TableHead>By</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Filename / note</TableHead>
                          <TableHead className="text-right">Size</TableHead>
                          <TableHead className="w-24"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPdfVersions.map((v) => (
                          <PdfVersionRow
                            key={v.id}
                            v={v}
                            generatorName={
                              v.generated_by ? generatorMap[v.generated_by] ?? "" : ""
                            }
                          />
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card id="purge-audit-log">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4" />
                  PDF purge audit log
                  <Badge variant="secondary" className="ml-2">
                    {purgeTotal}
                  </Badge>
                  {selectedPurgeIds.size > 0 && (
                    <Badge variant="outline" className="ml-1">{selectedPurgeIds.size} selected</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {selectedPurgeIds.size > 0 && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8"
                        disabled={!canPurgePdf}
                        title={!canPurgePdf ? "Only Super Admin, Management, or Finance can export purge history." : undefined}
                        onClick={async () => {
                          const ids = Array.from(selectedPurgeIds);
                          const { data, error } = await supabase
                            .from("activity_logs")
                            .select("id, user_id, created_at, metadata")
                            .in("id", ids)
                            .order("created_at", { ascending: false });
                          if (error) {
                            toast.error(error.message);
                            return;
                          }
                          await exportPurgeAuditCsv((data ?? []) as PurgeLogRow[], "selected");
                        }}
                      >
                        <FileDown className="h-3.5 w-3.5 mr-1" />
                        Export selected ({selectedPurgeIds.size})
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8" onClick={clearPurgeSelection}>
                        Clear
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => { void exportPurgeAuditCsv(); }}
                    disabled={!canPurgePdf || (purgeTotal === 0)}
                    title={!canPurgePdf ? "Only Super Admin, Management, or Finance can export purge history." : undefined}
                  >
                    <FileDown className="h-3.5 w-3.5 mr-1" />
                    Export CSV{purgeFiltersActive ? " (filtered)" : ""}
                  </Button>
                </div>
              </div>
              {lastPurgeExport && (
                <div className="mt-3 rounded-md border bg-muted/40 px-3 py-2 text-xs">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium">Last export:</span>
                    <span className="text-muted-foreground">{lastPurgeExport.filename}</span>
                    <Badge variant="outline">{lastPurgeExport.scope}</Badge>
                    <span className="text-muted-foreground">
                      {lastPurgeExport.rowCount} row{lastPurgeExport.rowCount === 1 ? "" : "s"} · {lastPurgeExport.byteSize} B
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(lastPurgeExport.exportedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-medium">SHA-256:</span>
                    <code className="break-all font-mono text-[11px]">
                      {lastPurgeExport.sha256 || "(unavailable)"}
                    </code>
                    {lastPurgeExport.sha256 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(lastPurgeExport.sha256);
                            toast.success("SHA-256 checksum copied");
                          } catch {
                            toast.error("Failed to copy checksum");
                          }
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {purgeTotal === 0 && !purgeFiltersActive ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                  No purge actions recorded for this invoice.
                </p>
              ) : (
                <>
                  <div className="px-4 pb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">User</Label>
                      <Select value={purgeUserFilter} onValueChange={setPurgeUserFilter}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="All users" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All users</SelectItem>
                          {purgeUserOptions.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">From</Label>
                      <Input type="date" className="h-8" value={purgeFromDate} onChange={(e) => setPurgeFromDate(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">To</Label>
                      <Input type="date" className="h-8" value={purgeToDate} onChange={(e) => setPurgeToDate(e.target.value)} />
                    </div>
                    <div className="space-y-1 lg:col-span-1">
                      <Label className="text-xs">Version ID contains</Label>
                      <Input
                        className="h-8 font-mono text-xs"
                        placeholder="e.g. 3f2a…"
                        value={purgeVersionQuery}
                        onChange={(e) => setPurgeVersionQuery(e.target.value)}
                      />
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full"
                        onClick={resetPurgeFilters}
                        disabled={!purgeFiltersActive}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                  <div className="px-4 pb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    Quick range
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={() => setPurgeDateRange(7)}
                    >
                      Last 7 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={() => setPurgeDateRange(30)}
                    >
                      Last 30 days
                    </Button>
                  </div>
                  {filteredPurgeLogs.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                      No entries match the current filters.
                    </p>
                  ) : (

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                              onCheckedChange={(v) => toggleAllFiltered(v === true)}
                              aria-label="Select all filtered rows"
                            />
                          </TableHead>
                          <SortHeader column="created_at" label="When" />
                          <SortHeader column="user" label="User" />
                          <TableHead className="text-right">Removed</TableHead>
                          <TableHead className="text-right">Kept</TableHead>
                          <TableHead>Version IDs</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPurgeLogs.map((log) => {
                          const meta = (log.metadata ?? {}) as {
                            removed_count?: number;
                            kept?: number;
                            version_ids?: string[];
                          };
                          const who = log.user_id
                            ? purgeActorMap[log.user_id] ?? "Unknown user"
                            : "System";
                          const ids = Array.isArray(meta.version_ids) ? meta.version_ids : [];
                          const idQ = purgeVersionQuery.trim().toLowerCase();
                          const displayIds = idQ ? ids.filter((v) => v.toLowerCase().includes(idQ)) : ids;
                          return (
                            <TableRow
                              key={log.id}
                              id={`purge-log-${log.id}`}
                              data-state={selectedPurgeIds.has(log.id) ? "selected" : undefined}
                              className="transition-shadow"
                            >
                              <TableCell className="w-10">
                                <Checkbox
                                  checked={selectedPurgeIds.has(log.id)}
                                  onCheckedChange={(v) => togglePurgeSelected(log.id, v === true)}
                                  aria-label="Select row"
                                />
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm">
                                {new Date(log.created_at).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-sm">{who}</TableCell>
                              <TableCell className="text-right font-medium">
                                {meta.removed_count ?? ids.length}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {meta.kept ?? "—"}
                              </TableCell>
                              <TableCell className="text-xs font-mono text-muted-foreground max-w-md">
                                {ids.length === 0 ? (
                                  "—"
                                ) : (
                                  <span title={ids.join("\n")} className="line-clamp-2 break-all">
                                    {idQ && displayIds.length !== ids.length
                                      ? `${displayIds.join(", ")} (+${ids.length - displayIds.length} more)`
                                      : ids.join(", ")}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  title="Copy link to this entry"
                                  onClick={() => copyPurgeLogLink(log.id)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
                    <div>
                      {purgeTotal === 0
                        ? "0 entries"
                        : `Showing ${purgePage * purgePageSize + 1}–${Math.min((purgePage + 1) * purgePageSize, purgeTotal)} of ${purgeTotal}`}
                      {purgeLoading && <span className="ml-2 italic">loading…</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Rows</Label>
                      <Select value={String(purgePageSize)} onValueChange={(v) => setPurgePageSize(parseInt(v, 10))}>
                        <SelectTrigger className="h-7 w-[70px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[10, 25, 50, 100].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        disabled={purgePage === 0 || purgeLoading}
                        onClick={() => setPurgePage((p) => Math.max(0, p - 1))}
                      >
                        Prev
                      </Button>
                      <span>Page {purgePage + 1} / {purgePageCount}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        disabled={purgePage + 1 >= purgePageCount || purgeLoading}
                        onClick={() => setPurgePage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>

              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {canEdit && (
        <div className="sticky bottom-4 flex justify-end print:hidden">
          <Button size="lg" onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {save.isPending ? "Saving…" : "Save invoice"}
          </Button>
        </div>
      )}

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Amount ({invoice.currency})</Label>
              <Input
                type="number"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Method</Label>
              <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {paymentMethodLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Received on</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div>
              <Label>Reference</Label>
              <Input
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="Transaction ID, cheque #, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => addPayment.mutate()} disabled={addPayment.isPending}>
              {addPayment.isPending ? "Saving…" : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!pdfPreview}
        onOpenChange={(o) => {
          if (!o) {
            setPdfPreview((prev) => {
              if (prev) URL.revokeObjectURL(prev.url);
              return null;
            });
          }
        }}
      >
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between gap-3 space-y-0">
            <DialogTitle className="text-base">
              {invoice?.type === "proforma" ? "Proforma Invoice" : "Invoice"} preview
              {pdfPreview ? ` — ${pdfPreview.filename}` : ""}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={openPdfPreview} disabled={pdfLoading}>
                {pdfLoading ? "Refreshing…" : "Refresh"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={openEmailDialog}
                disabled={!pdfPreview}
              >
                <Mail className="h-4 w-4 mr-1" /> Email
              </Button>
              <Button size="sm" onClick={downloadCurrentPdf} disabled={!pdfPreview}>
                <FileDown className="h-4 w-4 mr-1" /> Download
              </Button>
            </div>
          </DialogHeader>
          <div className="px-4 py-2 border-b bg-background flex items-center gap-2">
            <Label htmlFor="pdf-note-input" className="text-xs text-muted-foreground whitespace-nowrap">
              Generation note (optional)
            </Label>
            <Input
              id="pdf-note-input"
              value={pdfNote}
              onChange={(e) => setPdfNote(e.target.value)}
              maxLength={500}
              placeholder="e.g. Revised after client feedback"
              className="h-8"
            />
          </div>
          <div className="flex-1 bg-muted">
            {pdfPreview ? (
              <iframe
                title="Invoice PDF preview"
                src={pdfPreview.url}
                className="w-full h-full border-0"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Loading preview…
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={emailOpen} onOpenChange={(o) => !emailSending && setEmailOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Email {invoice?.type === "proforma" ? "proforma" : "invoice"} to customer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Recipient email</Label>
              <Input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="name@company.com"
                disabled={emailSending}
              />
            </div>
            <div>
              <Label>Message (optional)</Label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Add a short note to include in the email body."
                disabled={emailSending}
              />
            </div>
            <div>
              <Label>Internal PDF note (optional)</Label>
              <Input
                value={pdfNote}
                onChange={(e) => setPdfNote(e.target.value)}
                maxLength={500}
                placeholder="Saved with the archived PDF version. Not sent to the customer."
                disabled={emailSending}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The current PDF is uploaded to secure storage and shared via a
              7-day download link. The audit log records who sent it.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEmailOpen(false)} disabled={emailSending}>
              Cancel
            </Button>
            <Button onClick={sendInvoiceEmail} disabled={emailSending}>
              <Mail className="h-4 w-4 mr-1" />
              {emailSending ? "Sending…" : "Send email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={purgeOpen} onOpenChange={setPurgeOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Purge {overRetentionCount} older PDF version{overRetentionCount === 1 ? "" : "s"}?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-hidden flex flex-col">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <p className="text-muted-foreground">
                Keeping the latest {effectiveRetention} version{effectiveRetention === 1 ? "" : "s"}. The following{" "}
                {overRetentionCount} version{overRetentionCount === 1 ? "" : "s"} will be permanently deleted:
              </p>
              <div className="ml-auto flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Total size:</span>
                <span className="font-medium font-mono">{formatBytes(toPurgeVersions.reduce((sum, v) => sum + (v.byte_size ?? 0), 0))}</span>
              </div>
            </div>
            <div className="border rounded-md overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-10 text-center">#</TableHead>
                    <TableHead className="text-xs">Generated</TableHead>
                    <TableHead className="text-xs">By</TableHead>
                    <TableHead className="text-xs">Source</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Filename</TableHead>
                    <TableHead className="text-xs text-right">Size</TableHead>
                    <TableHead className="text-xs">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {toPurgeVersions.map((v, idx) => {
                    const dt = new Date(v.created_at);
                    const stamp = `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                    const who = v.generated_by ? generatorMap[v.generated_by] ?? "Unknown user" : "System";
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="text-xs text-center text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{stamp}</TableCell>
                        <TableCell className="text-xs max-w-[140px] truncate" title={who}>{who}</TableCell>
                        <TableCell className="text-xs">
                          {v.source === "download" && "Download"}
                          {v.source === "email" && "Emailed"}
                          {v.source === "bulk" && "Bulk export"}
                          {v.source === "preview" && "Preview"}
                          {! ["download", "email", "bulk", "preview"].includes(v.source) && v.source}
                        </TableCell>
                        <TableCell className="text-xs">
                          {v.doc_type === "proforma" ? "Proforma" : "Commercial"}
                        </TableCell>
                        <TableCell className="text-xs font-mono max-w-[200px] truncate" title={v.filename}>{v.filename}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatBytes(v.byte_size ?? 0)}</TableCell>
                        <TableCell className="text-xs max-w-[180px] truncate" title={v.note ?? ""}>{v.note ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              Review the list carefully. Export a CSV below for compliance records before confirming.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPurgeOpen(false)} disabled={purging}>
              Cancel
            </Button>
            <Button variant="outline" onClick={exportPurgeListCsv} disabled={purging || toPurgeVersions.length === 0}>
              <FileDown className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
            <Button variant="destructive" onClick={confirmPurge} disabled={purging}>
              <Trash2 className="h-4 w-4 mr-1" />
              {purging ? "Purging…" : `Purge ${overRetentionCount}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={removedOpen} onOpenChange={(o) => (o ? setRemovedOpen(true) : closeRemovedModal())}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Removed PDF version{removedItems.length === 1 ? "" : "s"} ({removedItems.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 overflow-hidden flex flex-col">
            <p className="text-xs text-muted-foreground">
              These versions have been permanently deleted from storage. The archived copies below are held in this browser session only — download them now if you need them for records.
            </p>
            <div className="border rounded-md overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-10 text-center">#</TableHead>
                    <TableHead className="text-xs">Generated</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Source</TableHead>
                    <TableHead className="text-xs">Filename</TableHead>
                    <TableHead className="text-xs text-right">Size</TableHead>
                    <TableHead className="text-xs text-right">Download</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {removedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-xs text-center text-muted-foreground py-6">
                        No archived copies available.
                      </TableCell>
                    </TableRow>
                  ) : removedItems.map((r, idx) => {
                    const dt = new Date(r.created_at);
                    const stamp = `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-center text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{stamp}</TableCell>
                        <TableCell className="text-xs">{r.doc_type === "proforma" ? "Proforma" : "Commercial"}</TableCell>
                        <TableCell className="text-xs capitalize">{r.source}</TableCell>
                        <TableCell className="text-xs font-mono max-w-[220px] truncate" title={r.filename}>{r.filename}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatBytes(r.byte_size ?? 0)}</TableCell>
                        <TableCell className="text-xs text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a href={r.blobUrl} download={r.filename}>
                              <Download className="h-3.5 w-3.5 mr-1" /> Download
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeRemovedModal}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>


  );
}

function PdfVersionRow({
  v,
  generatorName,
}: {
  v: InvoicePdfVersionRow;
  generatorName: string;
}) {
  const [busy, setBusy] = useState(false);
  const sourceLabel: Record<string, string> = {
    download: "Download",
    email: "Emailed",
    bulk: "Bulk export",
    preview: "Preview",
  };
  const sizeKb = v.byte_size ? `${(v.byte_size / 1024).toFixed(0)} KB` : "—";
  const dt = new Date(v.created_at);
  const stamp = `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  const who = generatorName?.trim() || (v.generated_by ? "Unknown user" : "System");
  async function download() {
    setBusy(true);
    try {
      const url = await signInvoicePdfUrl(v.storage_path, 300);
      const a = document.createElement("a");
      a.href = url;
      a.download = v.filename;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-sm">{stamp}</TableCell>
      <TableCell className="text-sm max-w-[160px] truncate" title={who}>{who}</TableCell>
      <TableCell>
        <Badge variant="secondary">{sourceLabel[v.source] ?? v.source}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {v.doc_type === "proforma" ? "Proforma" : "Commercial"}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[260px]">
        <div className="text-xs font-mono truncate" title={v.filename}>{v.filename}</div>
        {v.note && (
          <div className="text-xs text-muted-foreground italic truncate" title={v.note}>
            “{v.note}”
          </div>
        )}
      </TableCell>
      <TableCell className="text-right text-sm">{sizeKb}</TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="outline" onClick={download} disabled={busy}>
          <FileDown className="h-3.5 w-3.5 mr-1" />
          {busy ? "…" : "Get"}
        </Button>
      </TableCell>

    </TableRow>
  );
}


function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
