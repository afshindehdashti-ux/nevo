import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, Trash2, FileText } from "lucide-react";
import { useCanUploadDocuments, useCanDeleteMasters } from "@/lib/crm-permissions";
import type { Database } from "@/integrations/supabase/types";
import { formatDate } from "@/lib/crm-money";

type EntityType = Database["public"]["Enums"]["document_entity"];
type DocKind = Database["public"]["Enums"]["document_kind"];

type Props = {
  entityType: EntityType;
  entityId: string;
  title?: string;
  defaultKind?: DocKind;
};

const BUCKET = "crm-docs";

export function DocumentsPanel({
  entityType,
  entityId,
  title = "Documents",
  defaultKind = "other",
}: Props) {
  const qc = useQueryClient();
  const canUpload = useCanUploadDocuments();
  const canDelete = useCanDeleteMasters();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: docs = [] } = useQuery({
    queryKey: ["documents", entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const path = `${entityType}/${entityId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("documents").insert({
        entity_type: entityType,
        entity_id: entityId,
        kind: defaultKind,
        file_path: path,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["documents", entityType, entityId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Upload failed"),
  });

  const remove = useMutation({
    mutationFn: async (doc: (typeof docs)[number]) => {
      await supabase.storage.from(BUCKET).remove([doc.file_path]);
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["documents", entityType, entityId] });
    },
  });

  async function download(path: string, name: string) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
    if (error || !data) {
      toast.error("Could not generate download link");
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        {canUpload && (
          <>
            <input
              type="file"
              ref={inputRef}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload.mutate(f);
                e.target.value = "";
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={upload.isPending}
            >
              <Upload className="h-4 w-4 mr-1" />
              {upload.isPending ? "Uploading…" : "Upload"}
            </Button>
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {docs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No documents yet.</p>
        )}
        {docs.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between border rounded-md px-3 py-2 gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{d.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {d.kind.replace(/_/g, " ")} · {formatDate(d.created_at)}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => download(d.file_path, d.file_name)}
              >
                <Download className="h-4 w-4" />
              </Button>
              {canDelete && (
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(d)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
