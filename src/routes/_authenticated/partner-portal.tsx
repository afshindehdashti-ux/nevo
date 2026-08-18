import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getMyPartnerContext,
  getMyPartnerLeads,
  getMyPartnerCustomers,
  getMyPartnerDocuments,
  getMyPartnerDocumentUrl,
  getMyPartnerCommissions,
  getMyPartnerPerformance,
} from "@/lib/partner-portal.functions";
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
  Users,
  Handshake,
  FileText,
  Download,
  Wallet,
  TrendingUp,
  AlertCircle,
  Target,
  BadgeDollarSign,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/partner-portal")({
  head: () => ({
    meta: [
      { title: "Partner Portal — NEVO Industrial" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PartnerPortalPage,
});

function PartnerPortalPage() {
  const ctxFn = useServerFn(getMyPartnerContext);
  const { data: ctx, isLoading } = useQuery({
    queryKey: ["partner-portal", "ctx"],
    queryFn: () => ctxFn(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading your partner workspace…
      </div>
    );
  }

  if (!ctx?.partner) {
    return (
      <div className="min-h-screen p-8 max-w-2xl mx-auto">
        <Card className="p-6 border-yellow-200 bg-yellow-50/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h1 className="font-semibold">Partner access pending</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your account isn't linked to a NEVO partner yet. Please contact your NEVO
                partner manager to enable portal access.
              </p>
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link to={"/en/contact" as any}>Contact NEVO</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return <PartnerContent partnerId={ctx.partner.id} partnerName={ctx.partner.company_name} />;
}

function PartnerContent({ partnerId, partnerName }: { partnerId: string; partnerName: string }) {
  const leadsFn = useServerFn(getMyPartnerLeads);
  const customersFn = useServerFn(getMyPartnerCustomers);
  const docsFn = useServerFn(getMyPartnerDocuments);
  const docUrlFn = useServerFn(getMyPartnerDocumentUrl);
  const commissionsFn = useServerFn(getMyPartnerCommissions);
  const perfFn = useServerFn(getMyPartnerPerformance);

  const args = { data: { partner_id: partnerId } };
  const { data: leads = [] } = useQuery({
    queryKey: ["partner-portal", "leads", partnerId],
    queryFn: () => leadsFn(args),
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["partner-portal", "customers", partnerId],
    queryFn: () => customersFn(args),
  });
  const { data: docs = [] } = useQuery({
    queryKey: ["partner-portal", "docs", partnerId],
    queryFn: () => docsFn(args),
  });
  const { data: commissions = [] } = useQuery({
    queryKey: ["partner-portal", "commissions", partnerId],
    queryFn: () => commissionsFn(args),
  });
  const { data: perf } = useQuery({
    queryKey: ["partner-portal", "perf", partnerId],
    queryFn: () => perfFn(args),
  });

  async function download(docId: string) {
    const r = await docUrlFn({ data: { document_id: docId } });
    if (r.url) window.open(r.url, "_blank");
  }

  const currency = perf?.currency ?? "USD";

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Partner Portal
            </div>
            <h1 className="text-lg font-semibold">{partnerName}</h1>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={"/en" as any}>Back to nevoindustrial.com</Link>
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={Target} label="Leads" value={perf?.leadsTotal ?? 0} sub={`${perf?.leadsConverted ?? 0} converted`} />
          <KpiCard icon={Users} label="Assigned customers" value={perf?.customersTotal ?? 0} sub={`${perf?.customersActive ?? 0} active`} />
          <KpiCard
            icon={Wallet}
            label="Commissions pending"
            value={`${currency} ${(perf?.commissionPending ?? 0).toLocaleString()}`}
          />
          <KpiCard
            icon={BadgeDollarSign}
            label="Paid YTD"
            value={`${currency} ${(perf?.commissionYtd ?? 0).toLocaleString()}`}
          />
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="dashboard">
              <TrendingUp className="h-3.5 w-3.5 mr-1" />Performance
            </TabsTrigger>
            <TabsTrigger value="leads">
              <Target className="h-3.5 w-3.5 mr-1" />Leads
            </TabsTrigger>
            <TabsTrigger value="customers">
              <Users className="h-3.5 w-3.5 mr-1" />Customers
            </TabsTrigger>
            <TabsTrigger value="commissions">
              <Wallet className="h-3.5 w-3.5 mr-1" />Commissions
            </TabsTrigger>
            <TabsTrigger value="docs">
              <FileText className="h-3.5 w-3.5 mr-1" />Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h2 className="font-semibold flex items-center gap-2 mb-4">
                  <Handshake className="h-4 w-4" /> Pipeline
                </h2>
                <StatRow label="Total leads" value={perf?.leadsTotal ?? 0} />
                <StatRow label="New / contacted" value={perf?.leadsNew ?? 0} />
                <StatRow label="Converted" value={perf?.leadsConverted ?? 0} />
                <StatRow label="Active customers" value={perf?.customersActive ?? 0} />
              </Card>
              <Card className="p-6">
                <h2 className="font-semibold flex items-center gap-2 mb-4">
                  <BadgeDollarSign className="h-4 w-4" /> Commissions
                </h2>
                <StatRow
                  label="Pending & approved"
                  value={`${currency} ${(perf?.commissionPending ?? 0).toLocaleString()}`}
                />
                <StatRow
                  label="Paid (all time)"
                  value={`${currency} ${(perf?.commissionPaid ?? 0).toLocaleString()}`}
                />
                <StatRow
                  label="Paid YTD"
                  value={`${currency} ${(perf?.commissionYtd ?? 0).toLocaleString()}`}
                />
                <StatRow label="Entries" value={perf?.commissionCount ?? 0} />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leads">
            <Card>
              <PortalTable
                empty="No leads assigned to your partner yet."
                headers={["Name", "Company", "Country", "Type", "Status", "Priority", "Created"]}
                rows={leads.map((l) => [
                  <span className="font-medium">{l.name}</span>,
                  l.company ?? "—",
                  l.country ?? "—",
                  l.project_type ?? "—",
                  <Badge variant="outline">{l.status}</Badge>,
                  l.priority,
                  new Date(l.created_at).toLocaleDateString(),
                ])}
              />
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <PortalTable
                empty="No customers assigned to your partner yet."
                headers={["Name", "Contact", "City", "Country", "Currency", "Status"]}
                rows={customers.map((c) => [
                  <span className="font-medium">{c.name}</span>,
                  c.contact_person ?? "—",
                  c.city ?? "—",
                  c.country ?? "—",
                  c.currency,
                  <Badge variant={c.is_active ? "default" : "outline"}>
                    {c.is_active ? "Active" : "Inactive"}
                  </Badge>,
                ])}
              />
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card>
              <PortalTable
                empty="No commissions recorded yet."
                headers={["Earned", "Amount", "Status", "Paid", "Notes"]}
                rows={commissions.map((c) => [
                  c.earned_at,
                  `${c.currency} ${Number(c.amount).toLocaleString()}`,
                  <Badge
                    variant={
                      c.status === "paid"
                        ? "default"
                        : c.status === "cancelled"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {c.status}
                  </Badge>,
                  c.paid_at ?? "—",
                  <span className="text-xs text-muted-foreground">{c.notes ?? "—"}</span>,
                ])}
              />
            </Card>
          </TabsContent>

          <TabsContent value="docs">
            <Card>
              <PortalTable
                empty="No approved partner documents yet."
                headers={["Title", "Category", "Size", "Uploaded", ""]}
                rows={docs.map((d) => [
                  <span className="font-medium">{d.title}</span>,
                  d.category ?? "—",
                  d.file_size ? `${Math.round(Number(d.file_size) / 1024)} KB` : "—",
                  new Date(d.created_at).toLocaleDateString(),
                  <Button size="sm" variant="outline" onClick={() => download(d.id)}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Open
                  </Button>,
                ])}
              />
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
  sub,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </Card>
  );
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
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
  if (rows.length === 0) {
    return <div className="p-8 text-center text-sm text-muted-foreground">{empty}</div>;
  }
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
        {rows.map((r, i) => (
          <TableRow key={i}>
            {r.map((c, j) => (
              <TableCell key={j}>{c}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
