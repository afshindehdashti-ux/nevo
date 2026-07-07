import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listEmailPreviews,
  renderEmailPreview,
  sendTestEmail,
  type EmailPreviewMeta,
} from "@/lib/email-preview.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/email-preview")({
  head: () => ({
    meta: [
      { title: "Email Templates Preview — NEVO CRM" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmailPreviewAdmin,
});

function EmailPreviewAdmin() {
  const listFn = useServerFn(listEmailPreviews);
  const renderFn = useServerFn(renderEmailPreview);
  const sendFn = useServerFn(sendTestEmail);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [testRecipient, setTestRecipient] = useState("");

  const list = useQuery({
    queryKey: ["email-previews"],
    queryFn: () => listFn(),
  });

  const current = selected ?? list.data?.[0]?.name ?? null;

  const preview = useQuery({
    queryKey: ["email-preview", current],
    queryFn: () => renderFn({ data: { name: current! } }),
    enabled: !!current,
  });

  const sendTest = useMutation({
    mutationFn: (vars: { name: string; recipientEmail: string }) =>
      sendFn({ data: vars }),
    onSuccess: () => {
      toast.success(`Test email queued to ${testRecipient}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send test");
    },
  });

  const grouped = useMemo(() => {
    const auth: EmailPreviewMeta[] = [];
    const app: EmailPreviewMeta[] = [];
    (list.data ?? []).forEach((t) => (t.category === "auth" ? auth : app).push(t));
    return { auth, app };
  }, [list.data]);

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Email templates</h1>
          <p className="text-sm text-muted-foreground">
            Preview every NEVO auth and app email exactly as recipients see it.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewport === "desktop" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewport("desktop")}
          >
            Desktop
          </Button>
          <Button
            variant={viewport === "mobile" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewport("mobile")}
          >
            Mobile
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-[260px_1fr] gap-4 min-h-[70vh]">
        <aside className="border border-border rounded-md bg-background p-2 space-y-4 overflow-auto">
          {list.isLoading && (
            <div className="p-2 space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          )}
          {list.error && (
            <div className="p-2 text-sm text-destructive">
              {(list.error as Error).message}
            </div>
          )}
          {(["auth", "app"] as const).map((cat) => (
            <div key={cat}>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-2 py-1">
                {cat === "auth" ? "Auth emails" : "App emails"}
              </div>
              <ul className="space-y-1">
                {grouped[cat].map((t) => (
                  <li key={t.name}>
                    <button
                      type="button"
                      onClick={() => setSelected(t.name)}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${
                        current === t.name ? "bg-muted font-medium" : ""
                      }`}
                    >
                      {t.displayName}
                    </button>
                  </li>
                ))}
                {grouped[cat].length === 0 && !list.isLoading && (
                  <li className="px-2 py-1 text-xs text-muted-foreground">None registered</li>
                )}
              </ul>
            </div>
          ))}
        </aside>

        <section className="border border-border rounded-md bg-background flex flex-col overflow-hidden">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">Subject</div>
              <div className="font-medium truncate">
                {preview.data?.subject ?? (preview.isFetching ? "Rendering…" : "—")}
              </div>
            </div>
            {current && <Badge variant="outline">{current}</Badge>}
          </div>
          <div className="border-b border-border px-4 py-3 flex flex-wrap items-center gap-2 bg-muted/20">
            <Input
              type="email"
              placeholder="you@example.com"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              className="max-w-xs h-9"
            />
            <Button
              size="sm"
              disabled={
                !current ||
                !testRecipient ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testRecipient) ||
                sendTest.isPending
              }
              onClick={() =>
                current &&
                sendTest.mutate({ name: current, recipientEmail: testRecipient })
              }
            >
              {sendTest.isPending ? "Sending…" : "Send test email"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Sends the current template with sample data. Subject is prefixed with [TEST].
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              disabled={!preview.data?.html || !current}
              onClick={() => {
                if (!preview.data?.html || !current) return;
                const blob = new Blob([preview.data.html], { type: "text/html;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${current}.html`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
            >
              Download HTML
            </Button>
          </div>
          <div className="flex-1 bg-muted/40 p-4 flex justify-center overflow-auto">
            {preview.isFetching && !preview.data && (
              <Skeleton className="w-full max-w-2xl h-96" />
            )}
            {preview.error && (
              <div className="text-sm text-destructive">
                {(preview.error as Error).message}
              </div>
            )}
            {preview.data && (
              <iframe
                key={current}
                title={`Preview: ${current}`}
                srcDoc={preview.data.html}
                className="bg-white border border-border rounded-md shadow-sm"
                style={{
                  width: viewport === "mobile" ? 390 : "100%",
                  maxWidth: viewport === "mobile" ? 390 : 800,
                  height: "80vh",
                }}
                sandbox=""
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
