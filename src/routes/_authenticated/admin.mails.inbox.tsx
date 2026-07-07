import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import DOMPurify from "isomorphic-dompurify";
import {
  getMailboxConfig,
  listImapMessages,
  getImapMessage,
  setImapSeen,
  deleteImapMessage,
} from "@/lib/imap-inbox.functions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Trash2, Mail, MailOpen, Inbox, Settings, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/mails/inbox")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["mailbox-config"],
      queryFn: () => getMailboxConfig(),
    }),
  component: InboxPage,
});

function InboxPage() {
  const { data: cfgData } = useSuspenseQuery({
    queryKey: ["mailbox-config"],
    queryFn: () => getMailboxConfig(),
  });
  const config = cfgData.config as any;
  const configured = Boolean(config && config.provider === "imap" && config.imap_password_set);

  if (!configured) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Inbox not configured</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure an IMAP or Gmail mailbox to read incoming messages here.
        </p>
        <Button asChild>
          <Link to="/admin/mails/settings"><Settings className="h-4 w-4 mr-1.5" />Open Mailbox Settings</Link>
        </Button>
      </div>
    );
  }

  if (config.provider !== "imap") {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold mb-2">Gmail OAuth not linked yet</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Configure IMAP (with a Gmail App Password) or link the Google Mail connector to read this mailbox.
        </p>
        <Button asChild variant="outline"><Link to="/admin/mails/settings">Open Settings</Link></Button>
      </div>
    );
  }

  return <ImapInbox />;
}

function ImapInbox() {
  const router = useRouter();
  const listFn = useServerFn(listImapMessages);
  const getFn = useServerFn(getImapMessage);
  const seenFn = useServerFn(setImapSeen);
  const delFn = useServerFn(deleteImapMessage);

  const [selectedUid, setSelectedUid] = useState<number | null>(null);

  const listQ = useQuery({
    queryKey: ["imap-list", "INBOX"],
    queryFn: () => listFn({ data: { mailbox: "INBOX", limit: 50 } }),
    refetchInterval: 60_000,
  });

  const detailQ = useQuery({
    queryKey: ["imap-msg", selectedUid],
    queryFn: () => getFn({ data: { mailbox: "INBOX", uid: selectedUid! } }),
    enabled: selectedUid != null,
  });

  async function onRefresh() {
    await listQ.refetch();
  }

  async function onToggleSeen(uid: number, seen: boolean) {
    try {
      await seenFn({ data: { mailbox: "INBOX", uid, seen: !seen } });
      await listQ.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    }
  }

  async function onDelete(uid: number) {
    if (!confirm("Delete this message?")) return;
    try {
      await delFn({ data: { mailbox: "INBOX", uid } });
      setSelectedUid(null);
      await listQ.refetch();
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 min-h-[70vh]">
      {/* Message list */}
      <div className="border border-border rounded-md flex flex-col overflow-hidden bg-card">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <div className="text-xs font-medium">
            INBOX{" "}
            {listQ.data && (
              <span className="text-muted-foreground">
                · {listQ.data.unseen} unread / {listQ.data.total}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={onRefresh} disabled={listQ.isFetching} className="h-7 px-2">
              {listQ.isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" asChild className="h-7 px-2">
              <Link to="/admin/mails/settings"><Settings className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {listQ.isLoading && (
            <div className="p-6 text-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />Loading…
            </div>
          )}
          {listQ.error && (
            <div className="p-4 text-xs text-destructive">
              {(listQ.error as any)?.message ?? "Failed to load"}
            </div>
          )}
          {listQ.data?.messages.length === 0 && (
            <div className="p-6 text-center text-xs text-muted-foreground">Mailbox is empty.</div>
          )}
          <ul className="divide-y divide-border">
            {listQ.data?.messages.map((m: any) => {
              const active = m.uid === selectedUid;
              const fromLabel = m.from[0]?.name || m.from[0]?.address || "Unknown";
              return (
                <li key={m.uid}>
                  <button
                    onClick={() => setSelectedUid(m.uid)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-muted/60 ${active ? "bg-muted" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {!m.seen ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-transparent shrink-0" />
                      )}
                      <span className={`truncate ${!m.seen ? "font-semibold" : ""}`}>{fromLabel}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                        {m.date ? new Date(m.date).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <div className={`truncate mt-0.5 ${!m.seen ? "font-medium" : "text-muted-foreground"}`}>
                      {m.subject}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </div>

      {/* Detail */}
      <div className="border border-border rounded-md flex flex-col overflow-hidden bg-card min-h-[400px]">
        {selectedUid == null ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Select a message
          </div>
        ) : detailQ.isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : detailQ.error ? (
          <div className="p-4 text-xs text-destructive">
            {(detailQ.error as any)?.message ?? "Failed to load"}
          </div>
        ) : detailQ.data ? (
          <>
            <div className="border-b border-border p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold leading-snug">{detailQ.data.subject}</h3>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onToggleSeen(detailQ.data.uid, true)}>
                    <MailOpen className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => onDelete(detailQ.data.uid)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>
                  <span className="font-medium text-foreground">From:</span>{" "}
                  {detailQ.data.from.map((a: any) => a.name ? `${a.name} <${a.address}>` : a.address).join(", ")}
                </div>
                <div>
                  <span className="font-medium text-foreground">To:</span>{" "}
                  {detailQ.data.to.map((a: any) => a.address).join(", ")}
                </div>
                {detailQ.data.date && (
                  <div><span className="font-medium text-foreground">Date:</span> {new Date(detailQ.data.date).toLocaleString()}</div>
                )}
                {detailQ.data.attachments.length > 0 && (
                  <div className="pt-1">
                    {detailQ.data.attachments.map((a: any, i: number) => (
                      <Badge key={i} variant="secondary" className="mr-1 text-[10px]">
                        📎 {a.filename ?? "attachment"} ({Math.round((a.size ?? 0) / 1024)} KB)
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 text-sm">
                {detailQ.data.html ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(detailQ.data.html, { USE_PROFILES: { html: true } }),
                    }}
                  />
                ) : detailQ.data.text ? (
                  <pre className="whitespace-pre-wrap font-sans">{detailQ.data.text}</pre>
                ) : (
                  <div className="text-muted-foreground italic">Empty message body</div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : null}
      </div>
    </div>
  );
}
