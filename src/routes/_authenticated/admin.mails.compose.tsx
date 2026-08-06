import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { searchRecipients, listEmailTemplates } from "@/lib/mail-hub.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send, X, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/mails/compose")({
  component: ComposePage,
});

type Recipient = { email: string; label?: string; source?: string };

function ComposePage() {
  const searchFn = useServerFn(searchRecipients);
  const listTpl = useServerFn(listEmailTemplates);

  const templatesQ = useQuery({
    queryKey: ["mail-hub-templates"],
    queryFn: () => listTpl(),
    staleTime: 60_000,
  });

  const [templateName, setTemplateName] = useState<string>("admin-broadcast");
  const [subject, setSubject] = useState("A message from NEVO Industrial");
  const [greeting, setGreeting] = useState("");
  const [body, setBody] = useState("");
  const [signature, setSignature] = useState("— NEVO Industrial");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const h = setTimeout(() => setDebounced(searchTerm), 200);
    return () => clearTimeout(h);
  }, [searchTerm]);

  const searchQ = useQuery({
    queryKey: ["recipient-search", debounced],
    queryFn: () => searchFn({ data: { q: debounced } }),
    enabled: debounced.length >= 2,
  });

  const isBroadcast = templateName === "admin-broadcast";
  const selectedTpl = useMemo(
    () => templatesQ.data?.templates.find((t) => t.name === templateName),
    [templatesQ.data, templateName],
  );

  function addRecipient(r: Recipient) {
    if (recipients.some((x) => x.email.toLowerCase() === r.email.toLowerCase())) return;
    setRecipients([...recipients, r]);
    setSearchTerm("");
  }

  function addManual() {
    const e = manualEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast.error("Enter a valid email address");
      return;
    }
    addRecipient({ email: e, source: "manual" });
    setManualEmail("");
  }

  function removeRecipient(email: string) {
    setRecipients(recipients.filter((r) => r.email !== email));
  }

  async function handleSend() {
    if (recipients.length === 0) {
      toast.error("Add at least one recipient");
      return;
    }
    if (isBroadcast && !body.trim()) {
      toast.error("Message body is required");
      return;
    }
    if (isBroadcast && !subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) {
      toast.error("Not signed in");
      return;
    }

    setSending(true);
    setProgress({ done: 0, total: recipients.length });
    let ok = 0,
      fail = 0;

    for (const r of recipients) {
      const templateData: Record<string, unknown> = isBroadcast
        ? { subject, greeting: greeting || null, body, signature: signature || null }
        : (selectedTpl?.previewData ?? {});
      try {
        const res = await fetch("/lovable/email/transactional/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            templateName,
            recipientEmail: r.email,
            idempotencyKey: `admin-manual-${crypto.randomUUID()}`,
            templateData,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success !== false) ok++;
        else {
          fail++;
          console.error("Send failed", r.email, json);
        }
      } catch (e) {
        fail++;
        console.error("Send exception", r.email, e);
      }
      setProgress((p) => (p ? { done: p.done + 1, total: p.total } : null));
    }

    setSending(false);
    setProgress(null);
    if (fail === 0) {
      toast.success(`Sent to ${ok} recipient${ok === 1 ? "" : "s"}`);
      setRecipients([]);
      if (isBroadcast) {
        setBody("");
      }
    } else {
      toast.error(`Sent ${ok}, failed ${fail}. See console.`);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {/* Template */}
        <div className="border border-border rounded-lg p-4 bg-background space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Template</Label>
          <Select value={templateName} onValueChange={setTemplateName}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(templatesQ.data?.templates ?? []).map((t) => (
                <SelectItem key={t.name} value={t.name}>
                  {t.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isBroadcast && (
            <p className="text-xs text-muted-foreground">
              Uses the template's default preview data. For custom content, choose "Admin
              broadcast".
            </p>
          )}
        </div>

        {/* Compose fields (broadcast only) */}
        {isBroadcast && (
          <div className="border border-border rounded-lg p-4 bg-background space-y-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Subject
              </Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Greeting (optional)
              </Label>
              <Input
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="Hi Sara,"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Message body
              </Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder="Write your message… (double line-break for a new paragraph)"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Signature (optional)
              </Label>
              <Input value={signature} onChange={(e) => setSignature(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Recipients */}
      <div className="space-y-4">
        <div className="border border-border rounded-lg p-4 bg-background space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Recipients ({recipients.length})
          </Label>

          <div className="flex gap-2">
            <Input
              placeholder="Add email address…"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManual())}
            />
            <Button size="icon" variant="outline" onClick={addManual}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <Input
              placeholder="Search customers, contacts, leads, partners…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {debounced.length >= 2 && (
              <div className="mt-2 max-h-64 overflow-y-auto border border-border rounded">
                {searchQ.isLoading ? (
                  <div className="p-3 text-xs text-muted-foreground">Searching…</div>
                ) : (searchQ.data?.results ?? []).length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground">No matches.</div>
                ) : (
                  (searchQ.data?.results ?? []).map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        addRecipient({ email: r.email, label: r.label, source: r.source })
                      }
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2 border-b border-border last:border-0"
                    >
                      <Badge variant="outline" className="text-[9px]">
                        {r.source}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{r.label}</div>
                        <div className="truncate text-muted-foreground">{r.email}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {recipients.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No recipients yet.</p>
            ) : (
              recipients.map((r) => (
                <div
                  key={r.email}
                  className="flex items-center justify-between gap-2 bg-muted/50 px-2 py-1 rounded text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{r.label ?? r.email}</div>
                    {r.label && <div className="truncate text-muted-foreground">{r.email}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRecipient(r.email)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleSend}
          disabled={sending || recipients.length === 0}
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending {progress?.done}/{progress?.total}…
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send to {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
            </>
          )}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          Emails are queued one-per-recipient and appear in the Log Dashboard.
        </p>
      </div>
    </div>
  );
}
