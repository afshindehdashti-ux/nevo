import { createFileRoute } from "@tanstack/react-router";
import { Inbox, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/mails/inbox")({
  component: InboxPlaceholder,
});

function InboxPlaceholder() {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold mb-2">Inbox not connected yet</h2>
      <p className="text-sm text-muted-foreground mb-6">
        NEVO's built-in email system is send-only. To read and reply to incoming
        mail, connect a Gmail (Google Workspace) mailbox — for example
        <span className="font-mono"> info@nevoindustrial.com</span>. Once
        connected, threads, replies, labels, and search will appear here.
      </p>
      <div className="flex flex-col items-center gap-3">
        <Button asChild variant="default">
          <a href="/admin/settings" className="inline-flex items-center gap-2">
            Open settings <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <p className="text-[11px] text-muted-foreground">
          If your mailbox isn't on Google Workspace, tell your Lovable agent
          which provider to connect (IMAP / Microsoft 365 / etc).
        </p>
      </div>
    </div>
  );
}
