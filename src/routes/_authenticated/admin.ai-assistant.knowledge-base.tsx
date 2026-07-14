import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  Loader2,
  Upload,
  FileText,
  Trash2,
  Search,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@tanstack/react-router";
import {
  deleteKnowledgeDocument,
  ingestKnowledgeDocument,
  listKnowledgeDocuments,
} from "@/lib/ai-assistant.functions";
import { useMyRoles } from "@/lib/crm-hooks";

export const Route = createFileRoute("/_authenticated/admin/ai-assistant/knowledge-base")({
  head: () => ({
    meta: [{ title: "AI Knowledge Base — NEVO Internal" }, { name: "robots", content: "noindex" }],
  }),
  component: KnowledgeBasePage,
});

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "crm_user_guide", label: "CRM User Guide" },
  { value: "company_profile", label: "Company Profile" },
  { value: "product_datasheet", label: "Product Datasheet" },
  { value: "supplier_agreement", label: "Supplier Agreement" },
  { value: "customer_document", label: "Customer Document" },
  { value: "invoice_template", label: "Invoice Template" },
  { value: "commission_agreement", label: "Commission Agreement" },
  { value: "sop_procedure", label: "SOP / Procedure" },
  { value: "sales_training", label: "Sales Training" },
  { value: "technical_document", label: "Technical Document" },
  { value: "legal_compliance", label: "Legal / Compliance" },
  { value: "general", label: "General" },
];

const ACCESS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all_internal", label: "All internal users" },
  { value: "management_only", label: "Management only" },
  { value: "finance_only", label: "Finance only" },
  { value: "operations_only", label: "Operations only" },
  { value: "sales_only", label: "Sales only" },
  { value: "super_admin_only", label: "Super Admin only" },
];

function formatBytes(n: number | null | undefined) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function KnowledgeBasePage() {
  const qc = useQueryClient();
  const { data: roles } = useMyRoles();
  const canManage = (roles ?? []).some((r) => r === "super_admin" || r === "management");

  const list = useServerFn(listKnowledgeDocuments);
  const ingest = useServerFn(ingestKnowledgeDocument);
  const remove = useServerFn(deleteKnowledgeDocument);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [access, setAccess] = useState<string>("all");

  const docs = useQuery({
    queryKey: ["ai-documents", category, access, search],
    queryFn: () =>
      list({
        data: {
          category: category === "all" ? undefined : (category as never),
          access_level: access === "all" ? undefined : (access as never),
          search: search.trim() || undefined,
        },
      }),
  });

  // Upload form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadCategory, setUploadCategory] = useState("general");
  const [uploadAccess, setUploadAccess] = useState("all_internal");
  const [tags, setTags] = useState("");
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalReady = useMemo(
    () => (docs.data ?? []).filter((d) => d.status === "ready").length,
    [docs.data],
  );

  const uploadMut = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");
      if (!file && !rawText.trim()) throw new Error("Upload a file or paste text content");

      let storagePath: string | undefined;
      let fileType: string | undefined;
      let byteSize: number | undefined;

      if (file) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
        storagePath = `docs/${Date.now()}-${safe}`;
        fileType = file.type || undefined;
        byteSize = file.size;
        const { error } = await supabase.storage
          .from("ai-knowledge")
          .upload(storagePath, file, { upsert: false, contentType: fileType });
        if (error) throw new Error(error.message);
      }

      return ingest({
        data: {
          title: title.trim(),
          category: uploadCategory as never,
          description: description.trim() || undefined,
          access_level: uploadAccess as never,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          storage_path: storagePath,
          file_type: fileType,
          byte_size: byteSize,
          raw_text: rawText.trim() || undefined,
        },
      });
    },
    onSuccess: (res) => {
      toast.success(
        `Document added${res.chunk_count ? ` (${res.chunk_count} chunks indexed).` : "."}`,
      );
      if (res.warning) toast.warning(res.warning);
      setTitle("");
      setDescription("");
      setTags("");
      setRawText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["ai-documents"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Upload failed"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Document deleted");
      qc.invalidateQueries({ queryKey: ["ai-documents"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/ai-assistant" className="text-sm text-neutral-500 hover:text-neutral-800">
          <ArrowLeft className="mr-1 inline h-4 w-4" /> Back to assistant
        </Link>
      </div>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
            <BookOpen className="h-6 w-6 text-emerald-600" /> AI Knowledge Base
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Upload internal documents so the assistant can cite them when answering questions.{" "}
            <span className="text-neutral-500">
              {totalReady} indexed · TXT, MD, CSV, JSON, PDF, DOCX and XLSX are extracted and
              embedded automatically.
            </span>
          </p>
        </div>
      </header>

      {!canManage ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-2 p-4 text-sm text-amber-900">
            <ShieldAlert className="h-4 w-4" />
            You can view knowledge base documents allowed by your role, but only Management and
            Super Admin can upload or delete them.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add a document</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Access level</Label>
              <Select value={uploadAccess} onValueChange={setUploadAccess}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tags (comma separated)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div
              className="space-y-1"
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) setFile(f);
              }}
            >
              <Label>Upload file (TXT, MD, CSV, JSON, PDF, DOCX, XLSX — up to ~10 MB)</Label>
              <Input
                type="file"
                ref={fileInputRef}
                accept=".txt,.md,.markdown,.csv,.tsv,.json,.log,.html,.xml,.yml,.yaml,.pdf,.docx,.xlsx,.xls,text/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <p className="text-[11px] text-emerald-700">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
              <p className="text-[11px] text-neutral-500">
                Drag &amp; drop is supported. Text is extracted, chunked, and embedded
                automatically. Scanned/image-only PDFs will not be searchable without OCR — paste
                the content as raw text instead if extraction fails.
              </p>
            </div>
            <div className="space-y-1">
              <Label>…or paste raw text</Label>
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={4}
                placeholder="Paste procedure, agreement, spec, etc."
              />
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={() => uploadMut.mutate()}
                disabled={uploadMut.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {uploadMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Add to knowledge base
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-3 text-base">
            <span>Documents</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title / description"
                  className="h-8 w-64 pl-7 text-xs"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={access} onValueChange={setAccess}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All access levels</SelectItem>
                  {ACCESS_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {docs.isLoading ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : (docs.data ?? []).length === 0 ? (
            <p className="text-sm text-neutral-500">
              No documents match these filters. Upload one above to get started.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {(docs.data ?? []).map((d) => (
                <li key={d.id} className="flex items-start gap-3 py-3">
                  <FileText className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">{d.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
                      <Badge variant="outline">
                        {CATEGORY_OPTIONS.find((c) => c.value === d.category)?.label ?? d.category}
                      </Badge>
                      <Badge variant="outline">
                        {ACCESS_OPTIONS.find((a) => a.value === d.access_level)?.label ??
                          d.access_level}
                      </Badge>
                      <Badge
                        variant={d.status === "ready" ? "default" : "secondary"}
                        className={
                          d.status === "ready"
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : d.status === "failed"
                              ? "bg-red-600"
                              : ""
                        }
                      >
                        {d.status}
                        {d.chunk_count ? ` · ${d.chunk_count} chunks` : ""}
                      </Badge>
                      <span>{formatBytes(d.byte_size)}</span>
                      <span>{new Date(d.created_at).toLocaleDateString()}</span>
                    </div>
                    {d.description ? (
                      <p className="mt-1 text-xs text-neutral-600">{d.description}</p>
                    ) : null}
                    {d.error_message ? (
                      <p className="mt-1 text-xs text-red-600">{d.error_message}</p>
                    ) : null}
                  </div>
                  {canManage ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-neutral-500 hover:text-red-600"
                      onClick={() => deleteMut.mutate(d.id)}
                      disabled={deleteMut.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
