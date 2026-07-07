import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getMailboxConfig,
  saveMailboxConfig,
  testMailboxConnection,
  deleteMailboxConfig,
  startGmailOAuth,
  disconnectGmail,
} from "@/lib/imap-inbox.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, Trash2, Mail, Server, ShieldCheck, Copy } from "lucide-react";


export const Route = createFileRoute("/_authenticated/admin/mails/settings")({
  head: () => ({ meta: [{ title: "Mailbox Connection — NEVO Admin" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["mailbox-config"],
      queryFn: () => getMailboxConfig(),
    }),
  component: MailboxSettings,
});

function MailboxSettings() {
  const router = useRouter();
  const { data } = useSuspenseQuery({ queryKey: ["mailbox-config"], queryFn: () => getMailboxConfig() });
  const config = data.config as any;

  const save = useServerFn(saveMailboxConfig);
  const test = useServerFn(testMailboxConnection);
  const remove = useServerFn(deleteMailboxConfig);

  const [tab, setTab] = useState<"imap" | "gmail">(config?.provider === "gmail" ? "gmail" : "imap");
  const [host, setHost] = useState<string>(config?.imap_host ?? "");
  const [port, setPort] = useState<string>(config?.imap_port ? String(config.imap_port) : "993");
  const [username, setUsername] = useState<string>(config?.imap_username ?? "");
  const [password, setPassword] = useState<string>("");
  const [tls, setTls] = useState<boolean>(config?.imap_tls !== false);
  const [gmailEmail, setGmailEmail] = useState<string>(config?.gmail_email ?? "");
  const [notes, setNotes] = useState<string>(config?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Reset password field on config change
    setPassword("");
  }, [config?.id]);

  async function onSave() {
    setSaving(true);
    try {
      await save({
        data: {
          provider: tab,
          imap_host: tab === "imap" ? host.trim() : null,
          imap_port: tab === "imap" ? Number(port) || null : null,
          imap_username: tab === "imap" ? username.trim() : null,
          imap_password: tab === "imap" && password ? password : undefined,
          imap_tls: tls,
          gmail_email: tab === "gmail" ? gmailEmail.trim() : null,
          notes: notes || null,
        },
      });
      toast.success("Mailbox settings saved");
      await router.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onTest() {
    setTesting(true);
    try {
      const res = await test({});
      if (res.ok) toast.success(`Connected — ${res.mailboxes} mailbox(es) found`);
      else toast.error(res.error ?? "Connection failed");
      await router.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Test failed");
    } finally {
      setTesting(false);
    }
  }

  async function onDelete() {
    if (!confirm("Remove mailbox connection? Inbox will stop working.")) return;
    try {
      await remove({});
      toast.success("Mailbox connection removed");
      await router.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Mailbox Connection</h2>
        <p className="text-sm text-muted-foreground">
          Configure how the Inbox tab connects to your mailbox. Credentials are stored in your database
          and are only accessible to super_admin users.
        </p>
      </div>

      {config && (
        <Alert>
          {config.last_test_ok ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : config.last_test_ok === false ? (
            <XCircle className="h-4 w-4 text-destructive" />
          ) : (
            <Server className="h-4 w-4" />
          )}
          <AlertTitle className="text-sm">
            Current: {config.provider?.toUpperCase()}
            {config.provider === "imap" && config.imap_host ? ` — ${config.imap_username}@${config.imap_host}` : ""}
            {config.provider === "gmail" && config.gmail_email ? ` — ${config.gmail_email}` : ""}
          </AlertTitle>
          <AlertDescription className="text-xs">
            {config.last_test_at
              ? `Last tested ${new Date(config.last_test_at).toLocaleString()} — ${
                  config.last_test_ok ? "OK" : "Failed: " + (config.last_test_error ?? "unknown error")
                }`
              : "Not tested yet."}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="imap"><Server className="h-3.5 w-3.5 mr-1.5" />IMAP</TabsTrigger>
          <TabsTrigger value="gmail"><Mail className="h-3.5 w-3.5 mr-1.5" />Gmail</TabsTrigger>
        </TabsList>

        <TabsContent value="imap" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">IMAP mailbox</CardTitle>
              <CardDescription>
                Works with Hostinger, Zoho, Microsoft 365 (with basic-auth enabled), cPanel, and Gmail with
                an App Password. Common port: <span className="font-mono">993</span> with TLS on.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="host">Host</Label>
                <Input id="host" placeholder="imap.hostinger.com" value={host} onChange={(e) => setHost(e.target.value)} maxLength={255} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="port">Port</Label>
                <Input id="port" placeholder="993" value={port} onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ""))} maxLength={5} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="user">Username (full email)</Label>
                <Input id="user" placeholder="info@nevoindustrial.com" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={255} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pw">Password {config?.imap_password_set ? <span className="text-xs text-muted-foreground">(leave blank to keep existing)</span> : null}</Label>
                <Input id="pw" type="password" placeholder={config?.imap_password_set ? "••••••••" : "Mailbox or app password"} value={password} onChange={(e) => setPassword(e.target.value)} maxLength={500} autoComplete="new-password" />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch id="tls" checked={tls} onCheckedChange={setTls} />
                <Label htmlFor="tls" className="cursor-pointer">Use TLS / SSL (recommended)</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gmail" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gmail / Google Workspace</CardTitle>
              <CardDescription>
                For full OAuth Gmail support (labels, threading, native reply), the Google Mail connector must
                be linked at the workspace level. If you'd rather use username + password, switch to the IMAP
                tab with <span className="font-mono">imap.gmail.com : 993</span> and a Google App Password.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gmail">Mailbox email</Label>
                <Input id="gmail" type="email" placeholder="info@nevoindustrial.com" value={gmailEmail} onChange={(e) => setGmailEmail(e.target.value)} maxLength={255} />
                <p className="text-xs text-muted-foreground">
                  Saving this alone does not connect Gmail — it just records the intended mailbox. Ask your
                  Lovable agent to link the Google Mail connector when ready.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Internal notes (optional)</Label>
        <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Save settings
        </Button>
        <Button variant="outline" onClick={onTest} disabled={testing || !config}>
          {testing && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Test connection
        </Button>
        {config && (
          <Button variant="ghost" className="text-destructive ml-auto" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-1.5" />Remove
          </Button>
        )}
      </div>
    </div>
  );
}
