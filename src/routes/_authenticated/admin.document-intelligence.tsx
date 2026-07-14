import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Brain,
  ShieldAlert,
  Loader2,
  Download,
  CheckCircle2,
  XCircle,
  Send,
  Search,
  RefreshCw,
  Lock,
  Globe,
  UserCheck,
  Handshake,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import {
  analyzeDocument,
  approveDocument,
  createDocumentRow,
  getDocument,
  listCustomersLite,
  listDocuments,
  listPartnersLite,
  listProjectsLite,
  signDocumentUrl,
} from "@/lib/doc-intel.functions";
import {
  CONFIDENTIALITY,
  DESTINATIONS,
  DOC_CATEGORIES,
  STATUS,
  VISIBILITY,
} from "@/lib/doc-intel.schema";
import { useCanApproveDocIntel, useCanUseDocIntel } from "@/lib/crm-permissions";
import { AccessDenied } from "@/components/crm/AccessDenied";
import { formatDate } from "@/lib/crm-money";

export const Route = createFileRoute("/_authenticated/admin/document-intelligence")({
  head: () => ({
    meta: [{ title: "Document Intelligence — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: DocIntelPage,
});

type DocRow = Awaited<ReturnType<typeof listDocuments>>[number];

function DocIntelPage() {
  const canUse = useCanUseDocIntel();
  const [tab, setTab] = useState<"upload" | "pending" | "library">("upload");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!canUse) return <AccessDenied />;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            NEVO Document Intelligence Assistant
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Upload → AI classifies → human review → routed to the correct library or portal.
          </p>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-1" /> Upload
          </TabsTrigger>
          <TabsTrigger value="pending">
            <ShieldAlert className="h-4 w-4 mr-1" /> Pending Review
          </TabsTrigger>
          <TabsTrigger value="library">
            <FileText className="h-4 w-4 mr-1" /> Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <UploadPanel onOpen={(id) => setSelectedId(id)} />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <DocumentTable
            statusFilter={["pending_approval", "analyzed"]}
            onOpen={(id) => setSelectedId(id)}
          />
        </TabsContent>
        <TabsContent value="library" className="mt-4">
          <DocumentTable onOpen={(id) => setSelectedId(id)} />
        </TabsContent>
      </Tabs>

      <DocumentDrawer id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

// ============================================================
// Upload panel
// ============================================================
type UploadItem = {
  localId: string;
  file: File;
  stage: "queued" | "uploading" | "extracting" | "analyzing" | "ready" | "error";
  error?: string;
  documentId?: string;
};

function UploadPanel({ onOpen }: { onOpen: (id: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [note, setNote] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [dest, setDest] = useState<string>("");
  const [confidentiality, setConfidentiality] = useState<string>("internal");
  const [dragOver, setDragOver] = useState(false);

  const customersFn = useServerFn(listCustomersLite);
  const partnersFn = useServerFn(listPartnersLite);
  const projectsFn = useServerFn(listProjectsLite);
  const createFn = useServerFn(createDocumentRow);
  const analyzeFn = useServerFn(analyzeDocument);

  const { data: customers = [] } = useQuery({
    queryKey: ["di", "customers"],
    queryFn: () => customersFn(),
  });
  const { data: partners = [] } = useQuery({
    queryKey: ["di", "partners"],
    queryFn: () => partnersFn(),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["di", "projects"],
    queryFn: () => projectsFn(),
  });

  async function processFile(file: File) {
    const localId = `${Date.now()}-${file.name}-${Math.random()}`;
    setItems((prev) => [...prev, { localId, file, stage: "uploading" }]);
    try {
      const storagePath = `intake/${Date.now()}-${file.name.replace(/[^A-Za-z0-9._-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("documents-originals")
        .upload(storagePath, file, { contentType: file.type });
      if (upErr) throw upErr;

      const doc = await createFn({
        data: {
          storage_path: storagePath,
          original_filename: file.name,
          mime_type: file.type || null,
          file_size: file.size,
          user_note: note || null,
          customer_id: customerId || null,
          partner_id: partnerId || null,
          project_id: projectId || null,
          intended_destination: dest || null,
          confidentiality_level: confidentiality,
        },
      });

      setItems((prev) =>
        prev.map((it) =>
          it.localId === localId ? { ...it, stage: "analyzing", documentId: doc.id } : it,
        ),
      );

      await analyzeFn({ data: { documentId: doc.id } });

      setItems((prev) =>
        prev.map((it) => (it.localId === localId ? { ...it, stage: "ready" } : it)),
      );
      toast.success(`Analyzed: ${file.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setItems((prev) =>
        prev.map((it) => (it.localId === localId ? { ...it, stage: "error", error: msg } : it)),
      );
      toast.error(msg);
    }
  }

  function handleFiles(list: FileList | null) {
    if (!list) return;
    Array.from(list).forEach(processFile);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" /> Upload documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOCX, XLSX, CSV, TXT, PNG, JPG — up to ~20&nbsp;MB each
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.localId} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{it.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(it.file.size / 1024).toFixed(1)} KB · {it.file.type || "unknown type"}
                      </p>
                    </div>
                    <StageBadge stage={it.stage} />
                  </div>
                  {it.stage !== "ready" && it.stage !== "error" && (
                    <Progress
                      value={
                        it.stage === "uploading"
                          ? 25
                          : it.stage === "extracting"
                            ? 50
                            : it.stage === "analyzing"
                              ? 80
                              : 10
                      }
                    />
                  )}
                  {it.stage === "error" && <p className="text-xs text-destructive">{it.error}</p>}
                  {it.stage === "ready" && it.documentId && (
                    <Button size="sm" variant="outline" onClick={() => onOpen(it.documentId!)}>
                      Review AI analysis
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tell NEVO AI about these files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">What is this document about? (optional)</Label>
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Signed NDA with client X for project Y"
            />
          </div>
          <PickerSelect
            label="Related customer"
            value={customerId}
            onChange={setCustomerId}
            options={customers.map((c) => ({ value: c.id, label: c.company_name }))}
          />
          <PickerSelect
            label="Related partner"
            value={partnerId}
            onChange={setPartnerId}
            options={partners.map((p) => ({ value: p.id, label: p.company_name }))}
          />
          <PickerSelect
            label="Related project"
            value={projectId}
            onChange={setProjectId}
            options={projects.map((p) => ({ value: p.id, label: p.project_name }))}
          />
          <PickerSelect
            label="Intended destination"
            value={dest}
            onChange={setDest}
            options={DESTINATIONS.map((d) => ({ value: d, label: d }))}
          />
          <div>
            <Label className="text-xs">Confidentiality</Label>
            <Select value={confidentiality} onValueChange={setConfidentiality}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONFIDENTIALITY.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle className="text-xs">How routing works</AlertTitle>
            <AlertDescription className="text-xs">
              AI classifies each file, then a human approves and routes it. Contracts, NDAs,
              invoices and QC reports always require manual approval and cannot be routed as public.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

function PickerSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value || "__none"} onValueChange={(v) => onChange(v === "__none" ? "" : v)}>
        <SelectTrigger>
          <SelectValue placeholder="Not specified" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">— none —</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function StageBadge({ stage }: { stage: UploadItem["stage"] }) {
  const map: Record<UploadItem["stage"], { label: string; cls: string; icon: React.ReactNode }> = {
    queued: { label: "Queued", cls: "bg-muted text-muted-foreground", icon: null },
    uploading: {
      label: "Uploading",
      cls: "bg-blue-100 text-blue-700",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    extracting: {
      label: "Extracting",
      cls: "bg-blue-100 text-blue-700",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    analyzing: {
      label: "Analyzing with NEVO AI",
      cls: "bg-amber-100 text-amber-800",
      icon: <Brain className="h-3 w-3" />,
    },
    ready: {
      label: "Analyzed",
      cls: "bg-emerald-100 text-emerald-700",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    error: {
      label: "Error",
      cls: "bg-red-100 text-red-700",
      icon: <XCircle className="h-3 w-3" />,
    },
  };
  const s = map[stage];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.cls}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

// ============================================================
// Document table
// ============================================================
function DocumentTable({
  statusFilter,
  onOpen,
}: {
  statusFilter?: string[];
  onOpen: (id: string) => void;
}) {
  const listFn = useServerFn(listDocuments);
  const [search, setSearch] = useState("");
  const [statusSel, setStatusSel] = useState<string>("");
  const [categorySel, setCategorySel] = useState<string>("");
  const [visibilitySel, setVisibilitySel] = useState<string>("");
  const qc = useQueryClient();

  const effectiveStatus =
    statusSel || (statusFilter && statusFilter.length === 1 ? statusFilter[0] : "");
  const queryKey = useMemo(
    () => ["di", "list", { effectiveStatus, categorySel, visibilitySel, search, statusFilter }],
    [effectiveStatus, categorySel, visibilitySel, search, statusFilter],
  );

  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const all = await listFn({
        data: {
          ...(effectiveStatus ? { status: effectiveStatus } : {}),
          ...(categorySel ? { category: categorySel } : {}),
          ...(visibilitySel ? { portal_visibility: visibilitySel } : {}),
          ...(search ? { search } : {}),
        },
      });
      if (statusFilter && !effectiveStatus) {
        return (all as DocRow[]).filter((r) => statusFilter.includes(r.status));
      }
      return all as DocRow[];
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                className="pl-8 w-64"
                placeholder="Search title, summary, filename…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {!statusFilter && (
              <FilterSelect
                value={statusSel}
                onChange={setStatusSel}
                options={STATUS as unknown as string[]}
                placeholder="All statuses"
              />
            )}
            <FilterSelect
              value={categorySel}
              onChange={setCategorySel}
              options={DOC_CATEGORIES as unknown as string[]}
              placeholder="All categories"
            />
            <FilterSelect
              value={visibilitySel}
              onChange={setVisibilitySel}
              options={VISIBILITY as unknown as string[]}
              placeholder="Any visibility"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => qc.invalidateQueries({ queryKey: ["di"] })}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Customer / Project</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                    No documents found.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => {
                const cust = (r as unknown as { customers?: { name?: string } }).customers?.name;
                const proj = (r as unknown as { projects?: { project_name?: string } }).projects
                  ?.project_name;
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r.id)}>
                    <TableCell className="max-w-[280px]">
                      <p className="font-medium truncate">{r.title || r.original_filename}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.original_filename}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs">{r.category ?? "—"}</TableCell>
                    <TableCell className="text-xs">{r.destination ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {cust ?? "—"}
                      {proj ? ` · ${proj}` : ""}
                    </TableCell>
                    <TableCell>
                      <VisibilityBadge v={r.portal_visibility} />
                    </TableCell>
                    <TableCell>
                      <ConfidenceBar value={r.ai_confidence ?? null} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge s={r.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(r.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpen(r.id);
                        }}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <Select value={value || "__all"} onValueChange={(v) => onChange(v === "__all" ? "" : v)}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatusBadge({ s }: { s: string | null }) {
  const map: Record<string, string> = {
    uploaded: "bg-slate-100 text-slate-700",
    analyzed: "bg-blue-100 text-blue-700",
    pending_approval: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-700",
    routed: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  };
  const label = (s ?? "").replace(/_/g, " ");
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${map[s ?? ""] ?? "bg-muted"}`}
    >
      {label || "—"}
    </span>
  );
}

function VisibilityBadge({ v }: { v: string | null }) {
  const icons: Record<string, React.ReactNode> = {
    public: <Globe className="h-3 w-3" />,
    customer: <UserCheck className="h-3 w-3" />,
    partner: <Handshake className="h-3 w-3" />,
    on_request: <Lock className="h-3 w-3" />,
    none: <Lock className="h-3 w-3" />,
  };
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      {icons[v ?? "none"] ?? <Lock className="h-3 w-3" />}
      {(v ?? "none").replace(/_/g, " ")}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 w-24">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

// ============================================================
// Document drawer
// ============================================================
function DocumentDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const canApprove = useCanApproveDocIntel();
  const getFn = useServerFn(getDocument);
  const signFn = useServerFn(signDocumentUrl);
  const approveFn = useServerFn(approveDocument);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["di", "get", id],
    queryFn: () => getFn({ data: { id: id! } }),
    enabled: !!id,
  });

  const [edited, setEdited] = useState<Record<string, unknown>>({});
  const [tagsInput, setTagsInput] = useState("");

  const doc = data?.document as DocRow | undefined;
  const initialTags = useMemo(
    () => (data?.tags ?? []).map((t: { tag: string }) => t.tag).join(", "),
    [data],
  );

  const currentEdits = useMemo(() => {
    if (!doc) return {};
    return {
      title: (edited.title as string) ?? doc.title ?? "",
      summary: (edited.summary as string) ?? doc.summary ?? "",
      category: (edited.category as string) ?? doc.category ?? "",
      destination: (edited.destination as string) ?? doc.destination ?? "",
      folder_path: (edited.folder_path as string) ?? doc.folder_path ?? "",
      stored_filename: (edited.stored_filename as string) ?? doc.stored_filename ?? "",
      confidentiality_level:
        (edited.confidentiality_level as string) ?? doc.confidentiality_level ?? "internal",
      portal_visibility: (edited.portal_visibility as string) ?? doc.portal_visibility ?? "none",
    };
  }, [doc, edited]);

  const approve = useMutation({
    mutationFn: async (action: "approve" | "reject" | "send_to_review") => {
      const tags = (tagsInput || initialTags)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      return approveFn({
        data: {
          documentId: id!,
          action,
          edited: { ...currentEdits, tags },
        },
      });
    },
    onSuccess: (_r, action) => {
      toast.success(
        action === "approve"
          ? "Approved and routed"
          : action === "reject"
            ? "Rejected"
            : "Sent to review",
      );
      qc.invalidateQueries({ queryKey: ["di"] });
      setEdited({});
      if (action !== "send_to_review") onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Action failed"),
  });

  async function download(which: "original" | "routed") {
    if (!id) return;
    try {
      const res = await signFn({ data: { id, which } });
      const a = document.createElement("a");
      a.href = res.url;
      a.download = res.filename;
      a.target = "_blank";
      a.rel = "noopener";
      a.click();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign failed");
    }
  }

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-3xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            AI Review
          </SheetTitle>
        </SheetHeader>

        {isLoading && <p className="text-sm text-muted-foreground py-8">Loading…</p>}

        {doc && (
          <div className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Original filename</p>
                <p className="font-medium truncate">{doc.original_filename}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <StatusBadge s={doc.status} />
              </div>
              <div>
                <p className="text-muted-foreground">Confidence</p>
                <ConfidenceBar value={doc.ai_confidence ?? null} />
              </div>
              <div>
                <p className="text-muted-foreground">Uploaded</p>
                <p>{formatDate(doc.created_at)}</p>
              </div>
            </div>

            <AiSuggestionsPanel
              analysis={data?.extract?.extracted_json as Record<string, unknown> | undefined}
              confidence={doc.ai_confidence ?? null}
              reasoning={doc.ai_reasoning ?? null}
              onApply={(patch) => setEdited((p) => ({ ...p, ...patch }))}
            />

            <Separator />

            <div className="space-y-3">
              <FieldRow label="Recommended title">
                <Input
                  value={currentEdits.title}
                  onChange={(e) => setEdited((p) => ({ ...p, title: e.target.value }))}
                />
              </FieldRow>
              <FieldRow label="Recommended filename">
                <Input
                  value={currentEdits.stored_filename}
                  onChange={(e) => setEdited((p) => ({ ...p, stored_filename: e.target.value }))}
                />
              </FieldRow>
              <FieldRow label="Category">
                <Select
                  value={currentEdits.category}
                  onValueChange={(v) => setEdited((p) => ({ ...p, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Destination">
                <Select
                  value={currentEdits.destination}
                  onValueChange={(v) => setEdited((p) => ({ ...p, destination: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESTINATIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Folder path">
                <Input
                  value={currentEdits.folder_path}
                  onChange={(e) => setEdited((p) => ({ ...p, folder_path: e.target.value }))}
                />
              </FieldRow>
              <FieldRow label="Confidentiality">
                <Select
                  value={currentEdits.confidentiality_level}
                  onValueChange={(v) => setEdited((p) => ({ ...p, confidentiality_level: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONFIDENTIALITY.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Portal visibility">
                <Select
                  value={currentEdits.portal_visibility}
                  onValueChange={(v) => setEdited((p) => ({ ...p, portal_visibility: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Summary">
                <Textarea
                  rows={3}
                  value={currentEdits.summary}
                  onChange={(e) => setEdited((p) => ({ ...p, summary: e.target.value }))}
                />
              </FieldRow>
              <FieldRow label="Tags (comma-separated)">
                <Input defaultValue={initialTags} onChange={(e) => setTagsInput(e.target.value)} />
              </FieldRow>
            </div>

            {doc.ai_reasoning && (
              <div>
                <p className="text-xs font-medium mb-1">AI reasoning</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap border rounded-md p-2 bg-muted/30">
                  {doc.ai_reasoning}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button size="sm" variant="outline" onClick={() => download("original")}>
                <Download className="h-3.5 w-3.5 mr-1" /> Original
              </Button>
              {doc.status === "routed" && (
                <Button size="sm" variant="outline" onClick={() => download("routed")}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Routed copy
                </Button>
              )}
              <div className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => approve.mutate("send_to_review")}
                disabled={approve.isPending}
              >
                <Send className="h-3.5 w-3.5 mr-1" /> Send to manual review
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => approve.mutate("reject")}
                disabled={approve.isPending}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
              <Button
                size="sm"
                onClick={() => approve.mutate("approve")}
                disabled={approve.isPending || !canApprove || doc.status === "routed"}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                {doc.status === "routed" ? "Already routed" : "Approve & route"}
              </Button>
            </div>

            {!canApprove && (
              <p className="text-xs text-muted-foreground">
                Only management can approve and route documents.
              </p>
            )}

            <Separator />

            <div>
              <p className="text-xs font-medium mb-2">Version history</p>
              {(data?.versions ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No versions yet.</p>
              ) : (
                <ul className="text-xs space-y-1">
                  {data!.versions.map(
                    (v: {
                      id: string;
                      version_number: number;
                      filename: string | null;
                      created_at: string;
                      change_note: string | null;
                    }) => (
                      <li key={v.id} className="flex justify-between border rounded-md px-2 py-1">
                        <span>
                          v{v.version_number} · {v.filename ?? "—"}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDate(v.created_at)} · {v.change_note ?? ""}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>

            <div>
              <p className="text-xs font-medium mb-2">Audit trail</p>
              <ul className="text-xs space-y-1 max-h-48 overflow-auto">
                {(data?.audit ?? []).map(
                  (a: { id: string; action: string; created_at: string; details: unknown }) => (
                    <li key={a.id} className="flex justify-between border-b py-1">
                      <span className="font-medium">{a.action}</span>
                      <span className="text-muted-foreground">{formatDate(a.created_at)}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>

            {data?.extract && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  AI extraction (raw JSON)
                </summary>
                <pre className="mt-2 p-2 bg-muted/30 border rounded-md overflow-auto max-h-64">
                  {JSON.stringify(data.extract.extracted_json, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-start gap-3">
      <Label className="text-xs pt-2">{label}</Label>
      <div>{children}</div>
    </div>
  );
}

function AiSuggestionsPanel({
  analysis,
  confidence,
  reasoning,
  onApply,
}: {
  analysis: Record<string, unknown> | undefined;
  confidence: number | null;
  reasoning: string | null;
  onApply: (patch: Record<string, unknown>) => void;
}) {
  if (!analysis) {
    return (
      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        <Brain className="inline h-3.5 w-3.5 mr-1" />
        No AI analysis yet. Run analysis to populate suggestions.
      </div>
    );
  }

  const conf = typeof confidence === "number" ? confidence : null;
  const confTone = conf === null ? "muted" : conf >= 0.85 ? "ok" : conf >= 0.6 ? "warn" : "bad";
  const confLabel =
    conf === null
      ? "Unknown confidence"
      : conf >= 0.85
        ? "High confidence"
        : conf >= 0.6
          ? "Medium confidence — verify below"
          : "Low confidence — manual review required";

  const suggested = {
    title: (analysis.document_title as string) ?? "",
    stored_filename: (analysis.recommended_filename as string) ?? "",
    category: (analysis.category as string) ?? "",
    destination: (analysis.recommended_destination as string) ?? "",
    folder_path: (analysis.recommended_folder_path as string) ?? "",
    confidentiality_level: (analysis.confidentiality_level as string) ?? "internal",
    portal_visibility: (analysis.portal_visibility as string) ?? "none",
    summary: (analysis.summary as string) ?? "",
  };

  const signals: [string, unknown, string][] = [
    ["Type", analysis.document_type, "The kind of document the AI detected."],
    ["Company", analysis.detected_company, "Company mentioned as issuer or owner."],
    ["Customer", analysis.detected_customer, "Customer named in the document."],
    ["Project", analysis.detected_project, "Project reference found in the text."],
    ["Country", analysis.detected_country, "Country of origin or destination."],
    ["Language", analysis.detected_language, "Primary language of the content."],
    ["Business area", analysis.related_business_area, "NEVO business unit this belongs to."],
  ];

  const products = (analysis.detected_products as string[] | undefined) ?? [];
  const standards = (analysis.detected_standards as string[] | undefined) ?? [];
  const tags = (analysis.tags as string[] | undefined) ?? [];

  const toneClass =
    confTone === "ok"
      ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
      : confTone === "warn"
        ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
        : confTone === "bad"
          ? "border-red-300 bg-red-50 dark:bg-red-950/20"
          : "border-muted bg-muted/20";

  return (
    <div className={`rounded-md border p-3 space-y-3 text-xs ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="font-medium">AI review panel</span>
        </div>
        <span className="font-medium">
          {confLabel}
          {conf !== null && ` · ${Math.round(conf * 100)}%`}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <SuggestField
          label="Title"
          value={suggested.title}
          hint="Human-readable title derived from headings and body."
          onApply={() => onApply({ title: suggested.title })}
        />
        <SuggestField
          label="Filename"
          value={suggested.stored_filename}
          hint="Professional filename: type_customer_project_date convention."
          onApply={() => onApply({ stored_filename: suggested.stored_filename })}
        />
        <SuggestField
          label="Destination"
          value={suggested.destination}
          hint="Where this document should live: internal library or portal."
          onApply={() => onApply({ destination: suggested.destination })}
        />
        <SuggestField
          label="Folder path"
          value={suggested.folder_path}
          hint="Suggested folder inside the destination."
          onApply={() => onApply({ folder_path: suggested.folder_path })}
        />
        <SuggestField
          label="Category"
          value={suggested.category}
          hint="Business category used for filtering and routing."
          onApply={() => onApply({ category: suggested.category })}
        />
        <SuggestField
          label="Confidentiality"
          value={suggested.confidentiality_level}
          hint="How sensitive the AI thinks the content is."
          onApply={() => onApply({ confidentiality_level: suggested.confidentiality_level })}
        />
        <SuggestField
          label="Portal visibility"
          value={suggested.portal_visibility}
          hint="Who can see this once approved. Defaults to none unless clearly public."
          onApply={() => onApply({ portal_visibility: suggested.portal_visibility })}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {signals.map(([k, v, hint]) => (
          <div key={k} className="border rounded-md p-2 bg-background/60">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{k}</span>
              <Info className="h-3 w-3 text-muted-foreground" aria-label={hint} />
            </div>
            <p className="font-medium truncate">
              {typeof v === "string" && v ? v : <span className="text-muted-foreground">—</span>}
            </p>
          </div>
        ))}
      </div>

      {(products.length > 0 || standards.length > 0 || tags.length > 0) && (
        <div className="space-y-1.5">
          {products.length > 0 && <ChipRow label="Products" items={products} />}
          {standards.length > 0 && <ChipRow label="Standards" items={standards} />}
          {tags.length > 0 && (
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-muted-foreground">Tags</span>
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {reasoning && (
        <details>
          <summary className="cursor-pointer text-muted-foreground">
            Why the AI suggested this
          </summary>
          <p className="mt-1 whitespace-pre-wrap border rounded-md p-2 bg-background/60">
            {reasoning}
          </p>
        </details>
      )}
    </div>
  );
}

function SuggestField({
  label,
  value,
  hint,
  onApply,
}: {
  label: string;
  value: string;
  hint: string;
  onApply: () => void;
}) {
  return (
    <div className="border rounded-md p-2 bg-background/60">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={onApply}
          disabled={!value}
          className="text-primary text-[10px] hover:underline disabled:opacity-40"
        >
          Apply
        </button>
      </div>
      <p className="font-medium truncate" title={value}>
        {value || <span className="text-muted-foreground">—</span>}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>
    </div>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex items-start gap-2 flex-wrap">
      <span className="text-muted-foreground">{label}</span>
      {items.map((it) => (
        <Badge key={it} variant="outline" className="text-[10px]">
          {it}
        </Badge>
      ))}
    </div>
  );
}
