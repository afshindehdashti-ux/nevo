import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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

        <Tabs defaultValue="timeline">
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
            <TabsTrigger value="messages"><MessagesSquare className="h-3.5 w-3.5 mr-1" />Messages</TabsTrigger>
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

          <TabsContent value="messages">
            <Card className="p-6 space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No messages yet.
                </p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="border border-border rounded-md p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 text-xs">
                        {m.direction === "in" ? (
                          <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
                        )}
                        <Badge variant="outline">{m.kind}</Badge>
                        <span className="text-muted-foreground">
                          {m.contact_name ?? (m.direction === "in" ? "From you" : "From NEVO")}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.occurred_at).toLocaleString()}
                      </span>
                    </div>
                    {m.subject && <div className="text-sm font-medium">{m.subject}</div>}
                    {m.body && (
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                        {m.body}
                      </div>
                    )}
                  </div>
                ))
              )}
            </Card>
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
