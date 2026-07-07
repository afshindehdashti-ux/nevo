import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { FileDown, Search, ShieldAlert, Copy, RefreshCw } from "lucide-react";

import { listCsvExportAudit } from "@/lib/invoice-purge-audit.functions";
import type { CsvExportAuditRecord } from "@/lib/invoice-purge-audit.functions";
import { useMyRoles } from "@/lib/crm-hooks";
import type { AppRole } from "@/lib/crm-hooks";

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
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
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
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      No CSV exports match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
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

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export details</DialogTitle>
            <DialogDescription>
              Full record for this CSV export.
            </DialogDescription>
          </DialogHeader>
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
                        {md.embedded_sha256 && md.embedded_sha256 !== detail.sha256 && (
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
