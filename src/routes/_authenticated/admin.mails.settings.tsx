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
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Mail,
  Server,
  ShieldCheck,
  Copy,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/mails/settings")({
  head: () => ({
    meta: [{ title: "Mailbox Connection — NEVO Admin" }, { name: "robots", content: "noindex" }],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["mailbox-config"],
      queryFn: () => getMailboxConfig(),
    }),
  component: MailboxSettings,
});

function MailboxSettings() {
  const router = useRouter();
  const { data } = useSuspenseQuery({
    queryKey: ["mailbox-config"],
    queryFn: () => getMailboxConfig(),
  });
  const config = data.config as any;

  const save = useServerFn(saveMailboxConfig);
  const test = useServerFn(testMailboxConnection);
  const remove = useServerFn(deleteMailboxConfig);
  const startOAuth = useServerFn(startGmailOAuth);
  const disconnect = useServerFn(disconnectGmail);

  const [tab, setTab] = useState<"imap" | "gmail">(config?.provider === "gmail" ? "gmail" : "imap");
  const [host, setHost] = useState<string>(config?.imap_host ?? "");
  const [port, setPort] = useState<string>(config?.imap_port ? String(config.imap_port) : "993");
  const [username, setUsername] = useState<string>(config?.imap_username ?? "");
  const [password, setPassword] = useState<string>("");
  const [tls, setTls] = useState<boolean>(config?.imap_tls !== false);
  const [gmailEmail, setGmailEmail] = useState<string>(config?.gmail_email ?? "");
  const [gmailClientId, setGmailClientId] = useState<string>(config?.gmail_client_id ?? "");
  const [gmailClientSecret, setGmailClientSecret] = useState<string>("");
  const [notes, setNotes] = useState<string>(config?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  const redirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/public/oauth/google/callback`
      : "";

  // Surface callback result from URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const g = url.searchParams.get("gmail");
    if (g === "ok") {
      toast.success("Gmail authorized");
    } else if (g === "error") {
      toast.error(`Gmail authorization failed: ${url.searchParams.get("reason") ?? "unknown"}`);
    }
    if (g) {
      url.searchParams.delete("gmail");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.pathname + (url.search || ""));
    }
  }, []);

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
          gmail_client_id: tab === "gmail" ? gmailClientId.trim() || null : null,
          gmail_client_secret: tab === "gmail" && gmailClientSecret ? gmailClientSecret : undefined,
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

  async function onAuthorizeGmail() {
    setAuthorizing(true);
    try {
      // Persist any unsaved client id/secret first so the server has them
      if (
        tab === "gmail" &&
        ((gmailClientId && gmailClientId !== (config?.gmail_client_id ?? "")) ||
          gmailClientSecret ||
          gmailEmail !== (config?.gmail_email ?? ""))
      ) {
        await onSave();
      }
      const res = await startOAuth({ data: { redirect_uri: redirectUri } });
      window.location.href = res.url;
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start Google authorization");
      setAuthorizing(false);
    }
  }

  async function onDisconnectGmail() {
    if (!confirm("Disconnect Gmail? You'll need to authorize again to reconnect.")) return;
    try {
      await disconnect({});
      toast.success("Gmail disconnected");
      await router.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Disconnect failed");
    }
  }

  function copyRedirectUri() {
    navigator.clipboard?.writeText(redirectUri);
    toast.success("Redirect URI copied");
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Mailbox Connection</h2>
        <p className="text-sm text-muted-foreground">
          Configure how the Inbox tab connects to your mailbox. Credentials are stored in your
          database and are only accessible to super_admin users.
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
            {config.provider === "imap" && config.imap_host
              ? ` — ${config.imap_username}@${config.imap_host}`
              : ""}
            {config.provider === "gmail" && config.gmail_email ? ` — ${config.gmail_email}` : ""}
          </AlertTitle>
          <AlertDescription className="text-xs">
            {config.last_test_at
              ? `Last tested ${new Date(config.last_test_at).toLocaleString()} — ${
                  config.last_test_ok
                    ? "OK"
                    : "Failed: " + (config.last_test_error ?? "unknown error")
                }`
              : "Not tested yet."}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="imap">
            <Server className="h-3.5 w-3.5 mr-1.5" />
            IMAP
          </TabsTrigger>
          <TabsTrigger value="gmail">
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Gmail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="imap" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">IMAP mailbox</CardTitle>
              <CardDescription>
                Works with Hostinger, Zoho, Microsoft 365 (with basic-auth enabled), cPanel, and
                Gmail with an App Password. Common port: <span className="font-mono">993</span> with
                TLS on.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  placeholder="imap.hostinger.com"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  maxLength={255}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  placeholder="993"
                  value={port}
                  onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ""))}
                  maxLength={5}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="user">Username (full email)</Label>
                <Input
                  id="user"
                  placeholder="info@nevoindustrial.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={255}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pw">
                  Password{" "}
                  {config?.imap_password_set ? (
                    <span className="text-xs text-muted-foreground">
                      (leave blank to keep existing)
                    </span>
                  ) : null}
                </Label>
                <Input
                  id="pw"
                  type="password"
                  placeholder={config?.imap_password_set ? "••••••••" : "Mailbox or app password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={500}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch id="tls" checked={tls} onCheckedChange={setTls} />
                <Label htmlFor="tls" className="cursor-pointer">
                  Use TLS / SSL (recommended)
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gmail" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gmail / Google Workspace (OAuth)</CardTitle>
              <CardDescription>
                Connect via your own Google Cloud OAuth client. Create one at{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Google Cloud Console → Credentials
                </a>{" "}
                (Application type: Web) and add the redirect URI below.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-1.5">
                <Label>Authorized redirect URI</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={redirectUri} className="font-mono text-xs" />
                  <Button type="button" variant="outline" size="sm" onClick={copyRedirectUri}>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste this exact URL into your Google OAuth client's{" "}
                  <span className="font-mono">Authorized redirect URIs</span>. Add both the preview
                  and production origins if you use both.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="gmail">Mailbox email</Label>
                  <Input
                    id="gmail"
                    type="email"
                    placeholder="info@nevoindustrial.com"
                    value={gmailEmail}
                    onChange={(e) => setGmailEmail(e.target.value)}
                    maxLength={255}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gcid">Google Client ID</Label>
                  <Input
                    id="gcid"
                    placeholder="xxxx.apps.googleusercontent.com"
                    value={gmailClientId}
                    onChange={(e) => setGmailClientId(e.target.value)}
                    maxLength={255}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="gcs">
                    Google Client Secret{" "}
                    {config?.gmail_client_secret_set ? (
                      <span className="text-xs text-muted-foreground">
                        (leave blank to keep existing)
                      </span>
                    ) : null}
                  </Label>
                  <Input
                    id="gcs"
                    type="password"
                    placeholder={config?.gmail_client_secret_set ? "••••••••" : "GOCSPX-..."}
                    value={gmailClientSecret}
                    onChange={(e) => setGmailClientSecret(e.target.value)}
                    maxLength={500}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="rounded-md border p-3 text-sm">
                {config?.gmail_authorized ? (
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">Authorized</div>
                      <div className="text-xs text-muted-foreground">
                        Google account: {config.gmail_authorized_email ?? "(unknown)"} · scopes:{" "}
                        <span className="font-mono">{config.gmail_scope ?? "n/a"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onAuthorizeGmail}
                        disabled={authorizing}
                      >
                        {authorizing && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                        Re-authorize
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={onDisconnectGmail}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">Not authorized yet</div>
                      <div className="text-xs text-muted-foreground">
                        Save your Client ID/Secret, then click Authorize to complete Google's
                        consent flow.
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={onAuthorizeGmail}
                      disabled={
                        authorizing ||
                        !gmailClientId ||
                        (!config?.gmail_client_secret_set && !gmailClientSecret)
                      }
                    >
                      {authorizing && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                      Authorize with Google
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Internal notes (optional)</Label>
        <Textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
        />
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
            <Trash2 className="h-4 w-4 mr-1.5" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
