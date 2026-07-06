import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { formatMoney, formatDate } from "@/lib/crm-money";
import {
  invoiceStatusVariant,
  invoiceStatusLabel,
  orderStatusVariant,
  orderStatusLabel,
  shipmentStatusVariant,
  shipmentStatusLabel,
} from "@/lib/crm-status";
import { DocumentsPanel } from "@/components/crm/DocumentsPanel";

export const Route = createFileRoute("/_authenticated/admin/customers/$id")({
  head: () => ({
    meta: [{ title: "Customer — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const { id } = useParams({ from: "/_authenticated/admin/customers/$id" });

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["customer-orders", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["customer-invoices", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("customer_id", id)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ["customer-shipments", id],
    queryFn: async () => {
      const orderIds = orders.map((o) => o.id);
      if (orderIds.length === 0) return [];
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: orders.length > 0,
  });

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }
  if (!customer) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-muted-foreground">Customer not found.</p>
        <Button asChild variant="outline">
          <Link to="/admin/customers">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
      </div>
    );
  }

  const openBalance = invoices.reduce((s, i) => s + Number(i.balance || 0), 0);
  const lifetime = invoices.reduce((s, i) => s + Number(i.total || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/admin/customers">
            <ArrowLeft className="h-4 w-4 mr-1" /> All customers
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Customer</p>
            <h1 className="text-3xl font-semibold tracking-tight">{customer.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {[customer.city, customer.country].filter(Boolean).join(", ") || "—"}
              {customer.email && ` · ${customer.email}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={customer.is_active ? "default" : "secondary"}>
              {customer.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">{customer.currency}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Orders" value={orders.length.toString()} />
        <Kpi label="Invoices" value={invoices.length.toString()} />
        <Kpi label="Open balance" value={formatMoney(openBalance, customer.currency)} />
        <Kpi label="Lifetime value" value={formatMoney(lifetime, customer.currency)} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="shipments">Shipments ({shipments.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact & billing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Info label="Contact person" value={customer.contact_person} />
              <Info label="Email" value={customer.email} />
              <Info label="Phone" value={customer.phone} />
              <Info label="WhatsApp" value={customer.whatsapp} />
              <Info label="VAT / Tax number" value={customer.vat_number} />
              <Info label="Payment terms" value={customer.payment_terms} />
              <Info label="Address" value={customer.address} full />
              <Info label="Notes" value={customer.notes} full />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No orders yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link
                          to="/admin/orders/$id"
                          params={{ id: o.id }}
                          className="text-primary hover:underline"
                        >
                          {o.order_number || o.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(o.order_date)}</TableCell>
                      <TableCell>
                        <Badge variant={orderStatusVariant(o.status)}>
                          {orderStatusLabel(o.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(o.total, o.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No invoices yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {invoices.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>
                        <Link
                          to="/admin/invoices/$id"
                          params={{ id: i.id }}
                          className="text-primary hover:underline"
                        >
                          {i.invoice_number}
                        </Link>
                      </TableCell>
                      <TableCell className="capitalize">{i.type}</TableCell>
                      <TableCell>{formatDate(i.issue_date)}</TableCell>
                      <TableCell>
                        <Badge variant={invoiceStatusVariant(i.status)}>
                          {invoiceStatusLabel(i.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(i.total, i.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(i.balance, i.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipments">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Shipped</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No shipments yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {shipments.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link
                          to="/admin/shipments/$id"
                          params={{ id: s.id }}
                          className="text-primary hover:underline"
                        >
                          {s.shipment_number || s.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={shipmentStatusVariant(s.status)}>
                          {shipmentStatusLabel(s.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.carrier || "—"}</TableCell>
                      <TableCell>{s.tracking_no || "—"}</TableCell>
                      <TableCell>{formatDate(s.shipped_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsPanel entityType="customer" entityId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function Info({
  label,
  value,
  full,
}: {
  label: string;
  value: string | null | undefined;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value || "—"}</p>
    </div>
  );
}
