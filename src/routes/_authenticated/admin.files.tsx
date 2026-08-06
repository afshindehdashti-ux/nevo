import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/crm-money";

export const Route = createFileRoute("/_authenticated/admin/files")({
  head: () => ({ meta: [{ title: "Files — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: FilesList,
});

function humanBytes(n: number | null) {
  if (!n && n !== 0) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

function FilesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id,file_name,mime_type,size_bytes,entity_type,entity_id,kind,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 15_000,
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Admin Tools</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Files</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Uploaded documents across all CRM entities.
        </p>
      </header>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Failed to load files. {(error as Error).message}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No files uploaded yet.
          </CardContent>
        </Card>
      ) : (
        <div className="border border-border rounded-md overflow-hidden bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">File</th>
                <th className="text-left px-3 py-2">Kind</th>
                <th className="text-left px-3 py-2">Entity</th>
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-right px-3 py-2">Size</th>
                <th className="text-left px-3 py-2">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((f: any) => (
                <tr key={f.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium truncate max-w-[320px]" title={f.file_name}>
                    {f.file_name}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="capitalize">
                      {f.kind ?? "—"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground capitalize">
                    {f.entity_type ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{f.mime_type ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{humanBytes(f.size_bytes)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDate(f.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
