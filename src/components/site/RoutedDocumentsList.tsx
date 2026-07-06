// Drop-in read-only listing of AI-routed documents for portal pages.
// - "public": anyone (uses RLS anon read policy on approved public rows).
// - "on_request": anyone signed-in or not; download requires access request.
// - "customer" / "partner": authenticated users only (RLS gates rows).
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { requestDocumentAccess, signDocumentUrl } from "@/lib/doc-intel.functions";

type Visibility = "public" | "on_request" | "customer" | "partner";

export function RoutedDocumentsList({
  visibility,
  title,
  emptyLabel = "No documents available yet.",
  category,
}: {
  visibility: Visibility | Visibility[];
  title: string;
  emptyLabel?: string;
  category?: string;
}) {
  const vis = Array.isArray(visibility) ? visibility : [visibility];
  const signFn = useServerFn(signDocumentUrl);
  const requestFn = useServerFn(requestDocumentAccess);

  const { data = [], isLoading } = useQuery({
    queryKey: ["routed-docs", vis, category ?? null],
    queryFn: async () => {
      let q = supabase
        .from("doc_intel_documents")
        .select("id, title, summary, category, portal_visibility, file_url, created_at, original_filename")
        .eq("status", "routed")
        .in("portal_visibility", vis)
        .order("created_at", { ascending: false })
        .limit(100);
      if (category) q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  async function download(id: string, publicUrl: string | null) {
    if (publicUrl) {
      window.open(publicUrl, "_blank", "noopener");
      return;
    }
    try {
      const res = await signFn({ data: { id, which: "routed" } });
      window.open(res.url, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cannot download");
    }
  }

  async function requestAccess(id: string) {
    try {
      await requestFn({ data: { id } });
      toast.success("Access requested. Our team will contact you.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && data.length === 0 && (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        )}
        {data.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between gap-2 border rounded-md p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{d.title ?? d.original_filename}</p>
              {d.summary && (
                <p className="text-xs text-muted-foreground line-clamp-2">{d.summary}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                {d.category ?? "—"} · {(d.portal_visibility ?? "none").replace(/_/g, " ")}
              </p>
            </div>
            {d.portal_visibility === "on_request" ? (
              <Button size="sm" variant="outline" onClick={() => requestAccess(d.id)}>
                <Lock className="h-3.5 w-3.5 mr-1" />
                <Send className="h-3.5 w-3.5 mr-1" /> Request Access
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => download(d.id, d.file_url)}>
                <Download className="h-3.5 w-3.5 mr-1" /> Download
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
