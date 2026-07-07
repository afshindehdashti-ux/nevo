import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { FileDown, Search, ShieldAlert, Copy, RefreshCw, Loader2, Save, X, Bookmark, FileSpreadsheet, AlertTriangle } from "lucide-react";

import { listCsvExportAudit } from "@/lib/invoice-purge-audit.functions";
import type { CsvExportAuditRecord } from "@/lib/invoice-purge-audit.functions";
import { useMyRoles } from "@/lib/crm-hooks";
import type { AppRole } from "@/lib/crm-hooks";
import { verifyCsvText, type VerifyResult } from "@/lib/purge-csv-preamble";
import { detectShaDrift } from "@/lib/csv-export-audit-metadata";
import { buildComplianceReportCsv } from "@/lib/compliance-report";
import { Checkbox } from "@/components/ui/checkbox";

const PREVIEW_ROW_LIMIT = 10;

/** Minimal RFC-4180 CSV parser — stops once `maxRows` records are produced. */
function parseCsvRows(text: string, maxRows: number): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length && rows.length < maxRows; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ",") { row.push(field); field = ""; continue; }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  if (rows.length < maxRows && (field !== "" || row.length > 0)) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }
  return rows;
}
import {
  loadExportPresets,
  saveExportPresets,
  type ExportFilterPreset,
} from "@/lib/export-filter-presets";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";

const ALLOWED_ROLES: AppRole[] = ["super_admin", "management", "finance"];

const searchSchema = z.object({
  q: z.string().optional().default(""),
  scope: z.string().optional().default("all"),
  user: z.string().optional().default("all"),
  from: z.string().optional().default(""),
  to: z.string().optional().default(""),
});

export const Route = createFileRoute("/_authenticated/admin/exports")({
  head: () => ({
    meta: [
      { title: "CSV Export History — NEVO CRM" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  component: ExportsHistoryPage,
});

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function ExportsHistoryPage() {
  const { data: roles, isLoading: rolesLoading } = useMyRoles();
  const allowed = useMemo(
    () => (roles ?? []).some((r) => ALLOWED_ROLES.includes(r as AppRole)),
    [roles],
  );

  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const listFn = useServerFn(listCsvExportAudit);

  const [detail, setDetail] = useState<CsvExportAuditRecord | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const pendingRowRef = useRef<CsvExportAuditRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- Selection for compliance report ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // --- Payload preview (loaded from a user-picked file inside the dialog) ---
  const previewInputRef = useRef<HTMLInputElement | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<{
    filename: string;
    result: VerifyResult;
    headers: string[];
    rows: string[][];
    truncated: boolean;
  } | null>(null);

  function resetPreview() {
    setPreview(null);
    if (previewInputRef.current) previewInputRef.current.value = "";
  }

  function triggerPreview() {
    const input = previewInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }

  async function handlePreviewPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !detail) return;
    setPreviewLoading(true);
    try {
      const text = await file.text();
      const result = await verifyCsvText(text, { expectedSha: detail.sha256 });
      let headers: string[] = [];
      let rows: string[][] = [];
      let truncated = false;
      if (result.status !== "malformed") {
        // Re-split payload out of the file (verifyCsvText already validated it).
        const markerLine = '"--- PAYLOAD BELOW ---"\n';
        const idx = text.indexOf(markerLine);
        const payload = idx >= 0 ? text.slice(idx + markerLine.length) : text;
        const parsed = parseCsvRows(payload, PREVIEW_ROW_LIMIT + 1);
        truncated = parsed.length > PREVIEW_ROW_LIMIT;
        const capped = parsed.slice(0, PREVIEW_ROW_LIMIT);
        if (capped.length > 0) {
          headers = capped[0];
          rows = capped.slice(1);
        }
      }
      setPreview({ filename: file.name, result, headers, rows, truncated });
    } catch (err) {
      toast.error("Preview failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setPreviewLoading(false);
    }
  }


  function triggerVerifyAndOpen(row: CsvExportAuditRecord) {
    pendingRowRef.current = row;
    const input = fileInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }

  async function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const row = pendingRowRef.current;
    pendingRowRef.current = null;
    if (!file || !row) return;
    setVerifyingId(row.id);
    try {
      const text = await file.text();
      const result = await verifyCsvText(text, { expectedSha: row.sha256 });
      if (result.status === "malformed") {
        toast.error("CSV structure is malformed", {
          description: result.messages.join(" · "),
        });
        return;
      }
      if (result.status === "mismatch") {
        toast.error("SHA-256 mismatch — file will not open", {
          description: `Expected ${row.sha256.slice(0, 12)}… but computed ${result.computedSha.slice(0, 12)}…`,
        });
        return;
      }
      // status === "match" (expected was always supplied)
      const url = URL.createObjectURL(file);
      window.open(url, "_blank", "noopener,noreferrer");
      // Revoke shortly after so the new tab has time to load the content.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success("SHA-256 verified — opening file", {
        description: `Computed ${result.computedSha.slice(0, 12)}… matches audit record.`,
      });
    } catch (err) {
      toast.error("Verification failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setVerifyingId(null);
    }
  }

  const query = useQuery({
    queryKey: [
      "csv-export-audit",
      search.q,
      search.scope,
      search.user,
      search.from,
      search.to,
    ],
    enabled: allowed,
    queryFn: () =>
      listFn({
        data: {
          search: search.q || undefined,
          scope: search.scope && search.scope !== "all" ? search.scope : undefined,
          user_id: search.user && search.user !== "all" ? search.user : undefined,
          from_date: search.from || undefined,
          to_date: search.to || undefined,
          limit: 200,
        },
      }),
  });

  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;
  const actors = query.data?.actors ?? [];
  const actorMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of actors) m[a.user_id] = a.full_name ?? "Unknown user";
    return m;
  }, [actors]);

  // --- Drift-only filter (client-side over currently loaded rows) ---
  const TIMESTAMP_DRIFT_TOLERANCE_S = 2;
  const [driftOnly, setDriftOnly] = useState(false);

  function rowHasDrift(r: CsvExportAuditRecord): boolean {
    if (detectShaDrift({ sha256: r.sha256, metadata: r.metadata })) return true;
    const md = (r.metadata ?? {}) as { embedded_exported_at_iso?: unknown };
    if (typeof md.embedded_exported_at_iso !== "string") return false;
    const a = new Date(r.created_at).getTime();
    const b = new Date(md.embedded_exported_at_iso).getTime();
    if (!Number.isFinite(a) || !Number.isFinite(b)) return true; // invalid embedded timestamp = drift
    return Math.abs(b - a) / 1000 > TIMESTAMP_DRIFT_TOLERANCE_S;
  }

  const driftCount = useMemo(() => rows.filter(rowHasDrift).length, [rows]);
  const visibleRows = useMemo(
    () => (driftOnly ? rows.filter(rowHasDrift) : rows),
    [rows, driftOnly],
  );

  const allVisibleSelected =
    visibleRows.length > 0 && visibleRows.every((r) => selectedIds.has(r.id));
  function toggleAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const r of visibleRows) next.delete(r.id);
      } else {
        for (const r of visibleRows) next.add(r.id);
      }
      return next;
    });
  }

  function downloadComplianceReport() {
    const selected = rows.filter((r) => selectedIds.has(r.id));
    if (selected.length === 0) {
      toast.error("Select at least one export to include in the report.");
      return;
    }
    const csv = buildComplianceReportCsv(selected, {
      generatedAtIso: new Date().toISOString(),
      actorMap,
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const a = document.createElement("a");
    a.href = url;
    a.download = `csv-export-compliance-report-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    toast.success(
      `Compliance report ready · ${selected.length} export${selected.length === 1 ? "" : "s"}`,
    );
  }

  function update<K extends keyof z.infer<typeof searchSchema>>(key: K, value: string) {
    void navigate({ search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, [key]: value }) });
  }

  function clearAll() {
    void navigate({
      search: () => ({ q: "", scope: "all", user: "all", from: "", to: "" }),
    });
  }

  const activeFilters =
    (search.q ? 1 : 0) +
    (search.scope && search.scope !== "all" ? 1 : 0) +
    (search.user && search.user !== "all" ? 1 : 0) +
    (search.from ? 1 : 0) +
    (search.to ? 1 : 0);

  // --- Saved filter presets (per-browser via localStorage) ---
  const [presets, setPresets] = useState<ExportFilterPreset[]>([]);
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    setPresets(loadExportPresets());
  }, []);

  function persistPresets(next: ExportFilterPreset[]) {
    setPresets(next);
    saveExportPresets(next);
  }

  function savePreset() {
    const name = presetName.trim();
    if (!name) {
      toast.error("Give the preset a name first.");
      return;
    }
    if (activeFilters === 0) {
      toast.error("Set at least one filter before saving a preset.");
      return;
    }
    const next: ExportFilterPreset = {
      id: crypto.randomUUID(),
      name,
      filters: {
        q: search.q ?? "",
        scope: search.scope ?? "all",
        user: search.user ?? "all",
        from: search.from ?? "",
        to: search.to ?? "",
      },
    };
    const existing = presets.filter((p) => p.name !== name);
    persistPresets([next, ...existing].slice(0, 20));
    setPresetName("");
    toast.success(`Preset "${name}" saved.`);
  }

  function applyPreset(p: ExportFilterPreset) {
    void navigate({ search: () => ({ ...p.filters }) });
  }

  function deletePreset(id: string) {
    persistPresets(presets.filter((p) => p.id !== id));
  }

  const activePresetId = useMemo(() => {
    return (
      presets.find(
        (p) =>
          p.filters.q === (search.q ?? "") &&
          p.filters.scope === (search.scope ?? "all") &&
          p.filters.user === (search.user ?? "all") &&
          p.filters.from === (search.from ?? "") &&
          p.filters.to === (search.to ?? ""),
      )?.id ?? null
    );
  }, [presets, search.q, search.scope, search.user, search.from, search.to]);

  if (rolesLoading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Restricted</AlertTitle>
          <AlertDescription>
            Only Super Admin, Management, or Finance can view CSV export history.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={handleFilePicked}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            CSV Export History
          </CardTitle>
          <CardDescription>
            Every exported CSV is recorded with its SHA-256 checksum, scope,
            filters, and the user who generated it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
            <div className="space-y-1 lg:col-span-2">
              <Label className="text-xs">Search (filename, SHA-256, entity id)</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search.q}
                  onChange={(e) => update("q", e.target.value)}
                  placeholder="e.g. invoice-INV-2026 or a1b2c3…"
                  className="h-9 pl-7"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Scope</Label>
              <Select value={search.scope} onValueChange={(v) => update("scope", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All scopes</SelectItem>
                  <SelectItem value="filtered">Filtered</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">User</Label>
              <Select value={search.user} onValueChange={(v) => update("user", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {actors.map((a) => (
                    <SelectItem key={a.user_id} value={a.user_id}>
                      {a.full_name ?? "Unknown user"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From date</Label>
              <Input
                type="date"
                className="h-9"
                value={search.from}
                onChange={(e) => update("from", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To date</Label>
              <Input
                type="date"
                className="h-9"
                value={search.to}
                onChange={(e) => update("to", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-2">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Bookmark className="h-3.5 w-3.5" />
              Saved presets
            </div>
            {presets.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                None yet — set filters, name it, then Save.
              </span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {presets.map((p) => (
                  <div
                    key={p.id}
                    className={`inline-flex items-center gap-1 rounded-full border pl-2 pr-1 py-0.5 text-xs ${
                      activePresetId === p.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background"
                    }`}
                  >
                    <button
                      type="button"
                      className="max-w-[160px] truncate"
                      onClick={() => applyPreset(p)}
                      title={`Apply "${p.name}"`}
                    >
                      {p.name}
                    </button>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-muted"
                      onClick={() => deletePreset(p.id)}
                      title={`Delete "${p.name}"`}
                      aria-label={`Delete preset ${p.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="ml-auto flex items-end gap-1">
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name"
                className="h-8 w-40 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    savePreset();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                onClick={savePreset}
                disabled={activeFilters === 0 || !presetName.trim()}
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            </div>
          </div>


          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {query.isFetching
                ? "Loading…"
                : `${rows.length} shown · ${total} total match${total === 1 ? "" : "es"}`}
            </span>
            {activeFilters > 0 && (
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={clearAll}>
                Clear filters ({activeFilters})
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${query.isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={downloadComplianceReport}
              disabled={selectedIds.size === 0}
              title="Download a CSV summarizing embedded vs recorded SHA-256 and timestamps for the selected exports"
            >
              <FileSpreadsheet className="h-3 w-3 mr-1" />
              Compliance report ({selectedIds.size})
            </Button>
            {selectedIds.size > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear selection
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[1%]">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleAllVisible}
                      aria-label="Select all visible exports"
                    />
                  </TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead>SHA-256</TableHead>
                  <TableHead className="w-[1%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                      No CSV exports match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id} data-state={selectedIds.has(r.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(r.id)}
                          onCheckedChange={() => toggleSelected(r.id)}
                          aria-label={`Select export ${r.filename}`}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {format(new Date(r.created_at), "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.user_id ? actorMap[r.user_id] ?? "Unknown user" : "System"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{r.scope ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] break-all max-w-[320px]">
                        {r.filename}
                      </TableCell>
                      <TableCell className="text-right text-xs">{r.row_count}</TableCell>
                      <TableCell className="text-right text-xs">{formatBytes(r.byte_size)}</TableCell>
                      <TableCell className="font-mono text-[11px]">
                        <span title={r.sha256}>{r.sha256.slice(0, 16)}…</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(r.sha256);
                              toast.success("SHA-256 copied");
                            } catch {
                              toast.error("Failed to copy");
                            }
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => triggerVerifyAndOpen(r)}
                          disabled={verifyingId === r.id}
                          title="Pick the saved CSV to re-verify its SHA-256 before opening"
                        >
                          {verifyingId === r.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <FileDown className="h-3 w-3" />
                          )}
                          <span className="ml-1">Verify &amp; open</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => setDetail(r)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!detail}
        onOpenChange={(o) => {
          if (!o) {
            setDetail(null);
            resetPreview();
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Export details</DialogTitle>
            <DialogDescription>
              Full record for this CSV export.
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const md = (detail.metadata ?? {}) as {
                    embedded_sha256?: string;
                    embedded_exported_at_iso?: string;
                  };
                  const summary = [
                    `Filename: ${detail.filename}`,
                    `Exported at: ${detail.created_at}`,
                    `Export type / scope: ${detail.export_type} / ${detail.scope ?? "—"}`,
                    `Rows / Size: ${detail.row_count} · ${formatBytes(detail.byte_size)}`,
                    `SHA-256 (recorded): ${detail.sha256}`,
                    `SHA-256 (embedded in preamble): ${md.embedded_sha256 ?? "—"}`,
                    `Export timestamp (embedded in preamble): ${md.embedded_exported_at_iso ?? "—"}`,
                    `Payload marker line: "--- PAYLOAD BELOW ---"`,
                    `Metadata JSON:`,
                    JSON.stringify(detail.metadata ?? {}, null, 2),
                  ].join("\n");
                  void navigator.clipboard
                    .writeText(summary)
                    .then(() =>
                      toast.success("Audit summary copied to clipboard"),
                    )
                    .catch((err) =>
                      toast.error("Copy failed", {
                        description:
                          err instanceof Error ? err.message : String(err),
                      }),
                    );
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy audit summary
              </Button>
            </div>
          )}
          {detail && (

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-[140px_1fr] gap-y-2">
                <span className="text-muted-foreground">Filename</span>
                <span className="font-mono text-xs break-all">{detail.filename}</span>
                <span className="text-muted-foreground">SHA-256</span>
                <span className="font-mono text-xs break-all">{detail.sha256}</span>
                <span className="text-muted-foreground">Exported at</span>
                <span>{new Date(detail.created_at).toLocaleString()}</span>
                <span className="text-muted-foreground">User</span>
                <span>{detail.user_id ? actorMap[detail.user_id] ?? "Unknown user" : "System"}</span>
                <span className="text-muted-foreground">Type / Scope</span>
                <span>{detail.export_type} / {detail.scope ?? "—"}</span>
                <span className="text-muted-foreground">Entity</span>
                <span className="font-mono text-xs break-all">
                  {detail.entity_type ?? "—"}{detail.entity_id ? ` · ${detail.entity_id}` : ""}
                </span>
                <span className="text-muted-foreground">Rows / Size</span>
                <span>{detail.row_count} · {formatBytes(detail.byte_size)}</span>
                {(() => {
                  const md = (detail.metadata ?? {}) as {
                    embedded_sha256?: string;
                    embedded_exported_at_iso?: string;
                  };
                  if (!md.embedded_sha256 && !md.embedded_exported_at_iso) return null;
                  return (
                    <>
                      <span className="text-muted-foreground">Embedded SHA-256</span>
                      <span
                        className="font-mono text-xs break-all"
                        title="SHA-256 as it was written into the CSV preamble"
                      >
                        {md.embedded_sha256 ?? "—"}
                        {detectShaDrift({ sha256: detail.sha256, metadata: detail.metadata }) && (
                          <span className="ml-2 text-destructive">
                            (differs from column value)
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground">Embedded timestamp</span>
                      <span className="font-mono text-xs break-all">
                        {md.embedded_exported_at_iso ?? "—"}
                        {md.embedded_exported_at_iso && (
                          <span className="ml-2 text-muted-foreground">
                            ({(() => {
                              const d = new Date(md.embedded_exported_at_iso);
                              return isNaN(d.getTime()) ? "invalid" : d.toLocaleString();
                            })()})
                          </span>
                        )}
                      </span>
                    </>
                  );
                })()}
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Filters</div>
                <pre className="rounded-md border bg-muted/40 p-2 text-[11px] overflow-auto max-h-40">
                  {JSON.stringify(detail.filters, null, 2)}
                </pre>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Metadata</div>
                <pre className="rounded-md border bg-muted/40 p-2 text-[11px] overflow-auto max-h-40">
                  {JSON.stringify(detail.metadata, null, 2)}
                </pre>
              </div>

              <div className="space-y-2">

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Payload preview
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Load the CSV file to re-verify its SHA-256 and preview the first {PREVIEW_ROW_LIMIT - 1} data rows.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={triggerPreview}
                      disabled={previewLoading}
                    >
                      {previewLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileDown className="h-3.5 w-3.5" />
                      )}
                      {preview ? "Load different file" : "Load CSV to preview"}
                    </Button>
                    {preview && (
                      <Button size="sm" variant="ghost" onClick={resetPreview}>
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                {preview && (
                  <div className="space-y-2">
                    {preview.result.status === "match" && (
                      <Alert>
                        <AlertTitle>SHA-256 verified</AlertTitle>
                        <AlertDescription className="font-mono text-[11px] break-all">
                          {preview.filename} · computed {preview.result.computedSha.slice(0, 16)}… matches audit record.
                        </AlertDescription>
                      </Alert>
                    )}
                    {preview.result.status === "mismatch" && (
                      <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>SHA-256 mismatch</AlertTitle>
                        <AlertDescription className="font-mono text-[11px] break-all">
                          Expected {preview.result.expected.slice(0, 16)}… but computed {preview.result.computedSha.slice(0, 16)}…. Preview shown for inspection only — do NOT trust this file.
                        </AlertDescription>
                      </Alert>
                    )}
                    {preview.result.status === "malformed" && (
                      <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>CSV structure is malformed</AlertTitle>
                        <AlertDescription>
                          {preview.result.messages.join(" · ")}
                        </AlertDescription>
                      </Alert>
                    )}

                    {preview.result.status !== "malformed" && preview.headers.length > 0 && (
                      <div className="rounded-md border overflow-auto max-h-80">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {preview.headers.map((h, i) => (
                                <TableHead key={i} className="text-xs whitespace-nowrap">
                                  {h}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {preview.rows.map((r, ri) => (
                              <TableRow key={ri}>
                                {preview.headers.map((_, ci) => (
                                  <TableCell
                                    key={ci}
                                    className="text-[11px] font-mono whitespace-nowrap max-w-[240px] truncate"
                                    title={r[ci] ?? ""}
                                  >
                                    {r[ci] ?? ""}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {preview.truncated && (
                          <div className="px-3 py-1.5 text-[11px] text-muted-foreground border-t bg-muted/30">
                            Showing first {preview.rows.length} of {detail.row_count} data rows.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <input
        ref={previewInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handlePreviewPicked}
      />
    </div>
  );
}

