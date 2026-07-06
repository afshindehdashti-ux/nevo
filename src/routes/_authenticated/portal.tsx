import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getMyCustomerContext,
  getMyOrders,
  getMyInvoices,
  getMyShipments,
  getMyQuotations,
  getMyDocuments,
  getMyDocumentUrl,
  getMyProjects,
  getMyPayments,
  getMyMessages,
  getMyTimeline,
  sendMyMessage,
  getMyMessageAttachmentUrl,
  markMyMessagesRead,
} from "@/lib/customer-portal.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Truck,
  Receipt,
  Package,
  FileText,
  Download,
  LayoutDashboard,
  User,
  AlertCircle,
  FolderKanban,
  Wallet,
  MessagesSquare,
  Activity as ActivityIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Paperclip,
  Send,
  X,
  Loader2,
  Download,
  FileText as FileIcon,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [{ title: "Customer Portal — NEVO Industrial" }, { name: "robots", content: "noindex" }],
  }),
  component: PortalPage,
});

function PortalPage() {
  const ctxFn = useServerFn(getMyCustomerContext);
  const { data: ctx, isLoading: ctxLoading } = useQuery({
    queryKey: ["portal", "ctx"],
    queryFn: () => ctxFn(),
  });

  if (ctxLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading your workspace…
      </div>
    );
  }

  if (!ctx?.customer) {
    return (
      <div className="min-h-screen p-8 max-w-2xl mx-auto">
        <Card className="p-6 border-yellow-200 bg-yellow-50/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h1 className="font-semibold">Portal access pending</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your account isn't yet linked to a NEVO customer profile. Please contact your
                NEVO account manager to enable portal access.
              </p>
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link to="/en/contact">Contact NEVO</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return <PortalContent customerId={ctx.customer.id} customerName={ctx.customer.name} />;
}

function PortalContent({ customerId, customerName }: { customerId: string; customerName: string }) {
  const ordersFn = useServerFn(getMyOrders);
  const invoicesFn = useServerFn(getMyInvoices);
  const shipmentsFn = useServerFn(getMyShipments);
  const quotesFn = useServerFn(getMyQuotations);
  const docsFn = useServerFn(getMyDocuments);
  const docUrlFn = useServerFn(getMyDocumentUrl);
  const projectsFn = useServerFn(getMyProjects);
  const paymentsFn = useServerFn(getMyPayments);
  const messagesFn = useServerFn(getMyMessages);
  const timelineFn = useServerFn(getMyTimeline);

  const { data: orders = [] } = useQuery({
    queryKey: ["portal", "orders", customerId],
    queryFn: () => ordersFn({ data: { customer_id: customerId } }),
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ["portal", "invoices", customerId],
    queryFn: () => invoicesFn({ data: { customer_id: customerId } }),
  });
  const { data: shipments = [] } = useQuery({
    queryKey: ["portal", "shipments", customerId],
    queryFn: () => shipmentsFn({ data: { customer_id: customerId } }),
  });
  const { data: quotes = [] } = useQuery({
    queryKey: ["portal", "quotes", customerId],
    queryFn: () => quotesFn({ data: { customer_id: customerId } }),
  });
  const { data: docs = [] } = useQuery({
    queryKey: ["portal", "docs", customerId],
    queryFn: () => docsFn({ data: { customer_id: customerId } }),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["portal", "projects", customerId],
    queryFn: () => projectsFn({ data: { customer_id: customerId } }),
  });
  const { data: payments = [] } = useQuery({
    queryKey: ["portal", "payments", customerId],
    queryFn: () => paymentsFn({ data: { customer_id: customerId } }),
  });
  const { data: messages = [] } = useQuery({
    queryKey: ["portal", "messages", customerId],
    queryFn: () => messagesFn({ data: { customer_id: customerId } }),
  });
  const { data: timeline = [] } = useQuery({
    queryKey: ["portal", "timeline", customerId],
    queryFn: () => timelineFn({ data: { customer_id: customerId } }),
  });

  const qc = useQueryClient();
  const sendMessageFn = useServerFn(sendMyMessage);
  const attachmentUrlFn = useServerFn(getMyMessageAttachmentUrl);
  const [composeKind, setComposeKind] = useState<"email" | "note" | "whatsapp">("email");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeFiles, setComposeFiles] = useState<File[]>([]);
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sendMessage = useMutation({
    mutationFn: async (opts: { parentId?: string | null }) => {
      const attachments = await Promise.all(
        composeFiles.map(async (f) => {
          if (f.size > 15 * 1024 * 1024) throw new Error(`${f.name} exceeds 15 MB`);
          const buf = await f.arrayBuffer();
          let bin = "";
          const bytes = new Uint8Array(buf);
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
          }
          return { name: f.name, mime: f.type || undefined, base64: btoa(bin) };
        }),
      );
      return sendMessageFn({
        data: {
          customer_id: customerId,
          kind: composeKind,
          subject: composeSubject.trim() || null,
          body: composeBody,
          attachments,
          parent_id: opts.parentId ?? null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Message sent");
      setComposeSubject("");
      setComposeBody("");
      setComposeFiles([]);
      setReplyParentId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["portal", "messages", customerId] });
      qc.invalidateQueries({ queryKey: ["portal", "timeline", customerId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to send"),
  });

  const markMyMessagesReadFn = useServerFn(markMyMessagesRead);
  const markRead = useMutation({
    mutationFn: () => markMyMessagesReadFn({ data: { customer_id: customerId } }),
    onSuccess: (res) => {
      if (res?.marked) {
        qc.invalidateQueries({ queryKey: ["portal", "messages", customerId] });
      }
    },
  });

  const unreadCount = messages.filter(
    (m) => m.direction === "outbound" && !(m as any).read,
  ).length;




  const proformas = invoices.filter((i) => i.type === "proforma");
  const commercialInvoices = invoices.filter((i) => i.type !== "proforma");
  const approvedProjects = projects.filter((p) =>
    ["approved", "active", "in_progress", "delivered"].includes((p.status ?? "").toLowerCase()),
  );

  const openOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length;
  const inTransit = shipments.filter((s) => s.status === "in_transit").length;
  const balanceDue = invoices.reduce((s, i) => s + Number(i.balance ?? 0), 0);
  const currency = invoices[0]?.currency ?? orders[0]?.currency ?? "USD";

  async function download(docId: string) {
    const r = await docUrlFn({ data: { document_id: docId } });
    if (r.url) window.open(r.url, "_blank");
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Customer Portal</div>
            <h1 className="text-lg font-semibold">{customerName}</h1>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/en">Back to nevoindustrial.com</Link>
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={Truck} label="Open orders" value={openOrders} />
          <KpiCard icon={Package} label="In transit" value={inTransit} />
          <KpiCard
            icon={Receipt}
            label="Balance due"
            value={`${currency} ${balanceDue.toLocaleString()}`}
          />
          <KpiCard icon={FileText} label="Documents" value={docs.length} />
        </div>

        <Tabs
          defaultValue="timeline"
          onValueChange={(v) => {
            if (v === "messages" && unreadCount > 0) markRead.mutate();
          }}
        >
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="timeline"><ActivityIcon className="h-3.5 w-3.5 mr-1" />Timeline</TabsTrigger>
            <TabsTrigger value="projects"><FolderKanban className="h-3.5 w-3.5 mr-1" />Projects</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="quotes">Quotations</TabsTrigger>
            <TabsTrigger value="proformas">Proformas</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments"><Wallet className="h-3.5 w-3.5 mr-1" />Payments</TabsTrigger>
            <TabsTrigger value="shipments">Shipments</TabsTrigger>
            <TabsTrigger value="docs">Documents</TabsTrigger>
            <TabsTrigger value="messages">
              <MessagesSquare className="h-3.5 w-3.5 mr-1" />
              Messages
              {unreadCount > 0 && (
                <Badge className="ml-1.5 h-4 min-w-4 px-1 text-[10px] leading-none bg-primary text-primary-foreground">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <Card className="p-6">
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activity recorded yet.
                </p>
              ) : (
                <ol className="relative border-l border-border ml-3 space-y-4">
                  {timeline.map((e) => (
                    <li key={e.id} className="pl-4 relative">
                      <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-primary" />
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium">{e.title}</div>
                          {e.detail && (
                            <div className="text-xs text-muted-foreground">{e.detail}</div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          <Badge variant="outline" className="mr-2">{e.kind}</Badge>
                          {new Date(e.at).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <PortalTable
                empty="No projects assigned yet."
                headers={["Project", "Type", "Country", "Status", "Updated"]}
                rows={approvedProjects.map((p) => [
                  <span className="font-medium">{p.project_name}</span>,
                  p.project_type ?? "—",
                  p.country ?? "—",
                  <Badge variant="outline">{p.status ?? "—"}</Badge>,
                  new Date(p.updated_at).toLocaleDateString(),
                ])}
              />
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <PortalTable
                empty="No orders yet."
                headers={["Order", "Date", "Requested delivery", "Status", "Total"]}
                rows={orders.map((o) => [
                  <span className="font-mono text-xs">{o.order_number}</span>,
                  o.order_date ?? "—",
                  o.requested_delivery ?? "—",
                  <Badge variant="outline">{o.status}</Badge>,
                  <span className="tabular-nums">{o.currency} {Number(o.total).toLocaleString()}</span>,
                ])}
              />
            </Card>
          </TabsContent>

          <TabsContent value="quotes">
            <Card>
              <PortalTable
                empty="No quotations available."
                headers={["Number", "Issued", "Valid until", "Status", "Total"]}
                rows={quotes.map((q) => [
                  <span className="font-mono text-xs">{q.quotation_number}</span>,
                  q.issue_date,
                  q.valid_until ?? "—",
                  <Badge variant="outline">{q.status}</Badge>,
                  <span className="tabular-nums">{q.currency} {Number(q.total).toLocaleString()}</span>,
                ])}
              />
            </Card>
          </TabsContent>

          <TabsContent value="proformas">
            <Card>
              <PortalTable
                empty="No proforma invoices."
                headers={["Number", "Issued", "Due", "Status", "Total", "Balance"]}
                rows={proformas.map((i) => [
                  <span className="font-mono text-xs">{i.invoice_number}</span>,
                  i.issue_date,
                  i.due_date ?? "—",
                  <Badge variant="outline">{i.status}</Badge>,
                  <span className="tabular-nums">{i.currency} {Number(i.total).toLocaleString()}</span>,
                  <span className="tabular-nums">{i.currency} {Number(i.balance).toLocaleString()}</span>,
                ])}
              />
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <PortalTable
                empty="No invoices."
                headers={["Number", "Issued", "Due", "Status", "Total", "Balance"]}
                rows={commercialInvoices.map((i) => [
                  <span className="font-mono text-xs">{i.invoice_number}</span>,
                  i.issue_date,
                  i.due_date ?? "—",
                  <Badge variant={i.status === "paid" ? "default" : i.status === "overdue" ? "destructive" : "outline"}>{i.status}</Badge>,
                  <span className="tabular-nums">{i.currency} {Number(i.total).toLocaleString()}</span>,
                  <span className="tabular-nums">{i.currency} {Number(i.balance).toLocaleString()}</span>,
                ])}
              />
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <PortalTable
                empty="No payments received yet."
                headers={["Received", "Invoice", "Method", "Reference", "Amount"]}
                rows={payments.map((p) => [
                  new Date(p.received_at).toLocaleDateString(),
                  <span className="font-mono text-xs">{p.invoice_number ?? "—"}</span>,
                  p.method,
                  p.reference ?? "—",
                  <span className="tabular-nums font-medium">{p.currency} {Number(p.amount).toLocaleString()}</span>,
                ])}
              />
            </Card>
          </TabsContent>


          <TabsContent value="shipments">
            <Card>
              <PortalTable
                empty="No shipments."
                headers={["Number", "Carrier", "Tracking", "Container", "Status", "Shipped"]}
                rows={shipments.map((s) => [
                  <span className="font-mono text-xs">{s.shipment_number}</span>,
                  s.carrier ?? "—",
                  s.tracking_no ?? "—",
                  s.container_no ?? "—",
                  <Badge variant="outline">{s.status}</Badge>,
                  s.shipped_at ?? "—",
                ])}
              />
            </Card>
          </TabsContent>

          <TabsContent value="docs">
            <Card>
              <PortalTable
                empty="No documents shared."
                headers={["File", "Kind", "Size", "Uploaded", "Action"]}
                rows={docs.map((d) => [
                  d.file_name,
                  d.kind,
                  d.size_bytes ? `${Math.round(Number(d.size_bytes) / 1024)} KB` : "—",
                  new Date(d.created_at).toLocaleDateString(),
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => download(d.id)}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download
                  </Button>,
                ])}
              />
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {replyParentId === null && (
              <Card className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Start a new conversation</h3>
                  <select
                    value={composeKind}
                    onChange={(e) => setComposeKind(e.target.value as any)}
                    className="text-xs border border-border rounded-md px-2 py-1 bg-background"
                  >
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="note">Note</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subject (optional)"
                  className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background"
                />
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your message…"
                  rows={5}
                  className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background resize-y"
                />
                {composeFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {composeFiles.map((f, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-1"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="max-w-[160px] truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setComposeFiles((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Remove ${f.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        setComposeFiles((prev) => [...prev, ...files].slice(0, 10));
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-3.5 w-3.5 mr-1" />
                      Attach files
                    </Button>
                    <span className="ml-2 text-xs text-muted-foreground">
                      Up to 10 files, 15 MB each
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!composeBody.trim() || sendMessage.isPending}
                    onClick={() => sendMessage.mutate({ parentId: null })}
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5 mr-1" />
                    )}
                    Send
                  </Button>
                </div>
              </Card>
            )}

            {messages.length === 0 ? (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  No messages yet.
                </p>
              </Card>
            ) : (
              groupThreads(messages).map((thread) => {
                const head = thread[0];
                const last = thread[thread.length - 1];
                const subject = head.subject ?? `${head.kind} conversation`;
                const isReplying = replyParentId === last.id;
                return (
                  <Card key={head.thread_id ?? head.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div>
                        <div className="text-sm font-semibold">{subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {thread.length} message{thread.length === 1 ? "" : "s"} · last activity{" "}
                          {new Date(last.occurred_at).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={isReplying ? "secondary" : "outline"}
                        onClick={() => {
                          if (isReplying) {
                            setReplyParentId(null);
                          } else {
                            setReplyParentId(last.id);
                            setComposeSubject("");
                            setComposeBody("");
                            setComposeFiles([]);
                            setComposeKind((head.kind as any) === "whatsapp" ? "whatsapp" : (head.kind as any) === "note" ? "note" : "email");
                          }
                        }}
                      >
                        {isReplying ? "Cancel" : "Reply"}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {thread.map((m) => (
                        <div
                          key={m.id}
                          className={
                            "rounded-md p-3 relative " +
                            (m.direction === "inbound"
                              ? "bg-muted/40 border border-border"
                              : (m as any).read
                                ? "bg-blue-50/60 border border-blue-100"
                                : "bg-blue-50 border border-blue-300 ring-1 ring-blue-200")
                          }
                        >
                          {m.direction === "outbound" && !(m as any).read && (
                            <span
                              className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary"
                              aria-label="Unread"
                            />
                          )}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 text-xs">
                              {m.direction === "inbound" ? (
                                <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
                              )}
                              <Badge variant="outline">{m.kind}</Badge>
                              <span className={
                                "text-muted-foreground " +
                                (m.direction === "outbound" && !(m as any).read ? "font-semibold text-foreground" : "")
                              }>
                                {m.contact_name ?? (m.direction === "inbound" ? "From you" : "From NEVO")}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(m.occurred_at).toLocaleString()}
                            </span>
                          </div>
                          {m.body && (
                            <div className="text-sm text-foreground/90 whitespace-pre-wrap mt-1">
                              {m.body}
                            </div>
                          )}
                          {Array.isArray((m as any).attachments) && (m as any).attachments.length > 0 && (
                            <div className="flex flex-col gap-2 mt-2">
                              {((m as any).attachments as Array<{ name: string; path: string; mime?: string }>).map((a, i) => (
                                <AttachmentPreview
                                  key={i}
                                  attachment={a}
                                  customerId={customerId}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {isReplying && (
                      <div className="border-t border-border pt-3 space-y-2">
                        <textarea
                          value={composeBody}
                          onChange={(e) => setComposeBody(e.target.value)}
                          placeholder={`Reply to ${subject}…`}
                          rows={4}
                          className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background resize-y"
                          autoFocus
                        />
                        {composeFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {composeFiles.map((f, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-1"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span className="max-w-[160px] truncate">{f.name}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setComposeFiles((prev) => prev.filter((_, idx) => idx !== i))
                                  }
                                  className="text-muted-foreground hover:text-foreground"
                                  aria-label={`Remove ${f.name}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files ?? []);
                                setComposeFiles((prev) => [...prev, ...files].slice(0, 10));
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Paperclip className="h-3.5 w-3.5 mr-1" />
                              Attach
                            </Button>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!composeBody.trim() || sendMessage.isPending}
                            onClick={() => sendMessage.mutate({ parentId: last.id })}
                          >
                            {sendMessage.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5 mr-1" />
                            )}
                            Send reply
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="profile">

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">{customerName}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Contact your NEVO account manager for profile updates or additional access.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

type PortalMessage = {
  id: string;
  thread_id: string | null;
  parent_id: string | null;
  kind: string;
  direction: string;
  subject: string | null;
  body: string | null;
  occurred_at: string;
  contact_name: string | null;
  attachments?: unknown;
};

function groupThreads(messages: PortalMessage[]): PortalMessage[][] {
  const byThread = new Map<string, PortalMessage[]>();
  for (const m of messages) {
    const key = m.thread_id ?? m.id;
    const arr = byThread.get(key) ?? [];
    arr.push(m);
    byThread.set(key, arr);
  }
  const threads = Array.from(byThread.values()).map((arr) =>
    arr.slice().sort((a, b) => (a.occurred_at < b.occurred_at ? -1 : 1)),
  );
  threads.sort((a, b) => {
    const la = a[a.length - 1].occurred_at;
    const lb = b[b.length - 1].occurred_at;
    return la < lb ? 1 : -1;
  });
  return threads;
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1 tabular-nums">{value}</div>
    </Card>
  );
}

function PortalTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((h) => (
            <TableHead key={h}>{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={headers.length} className="text-center text-muted-foreground py-8 text-sm">
              {empty}
            </TableCell>
          </TableRow>
        )}
        {rows.map((cells, i) => (
          <TableRow key={i}>
            {cells.map((c, j) => (
              <TableCell key={j}>{c}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
