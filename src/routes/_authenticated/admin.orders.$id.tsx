import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logCrmAction } from "@/lib/audit-log.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, Save, FileText, Truck } from "lucide-react";
import { formatMoney, formatDate } from "@/lib/crm-money";
import {
  ORDER_STATUSES,
  orderStatusLabel,
  orderStatusVariant,
} from "@/lib/crm-status";
import { useCanEditOrders, useCanEditInvoices, useCanEditShipments } from "@/lib/crm-permissions";
import { DocumentsPanel } from "@/components/crm/DocumentsPanel";

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  head: () => ({ meta: [{ title: "Order — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: OrderDetailPage,
});

type Line = {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_pct: number;
  vat_pct: number;
  position: number;
  _new?: boolean;
  _deleted?: boolean;
};

function OrderDetailPage() {
  const { id } = useParams({ from: "/_authenticated/admin/orders/$id" });
  const qc = useQueryClient();
  const canEdit = useCanEditOrders();
  const canInvoice = useCanEditInvoices();
  const canShip = useCanEditShipments();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(id, name, currency)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["order-items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [requestedDelivery, setRequestedDelivery] = useState("");
  const [incoterm, setIncoterm] = useState("");

  useEffect(() => {
    if (items.length) {
      setLines(
        items.map((it, idx) => ({
          id: it.id,
          description: it.description,
          quantity: Number(it.quantity),
          unit: it.unit,
          unit_price: Number(it.unit_price),
          discount_pct: Number(it.discount_pct),
          vat_pct: Number(it.vat_pct),
          position: it.position ?? idx,
        })),
      );
    } else {
      setLines([]);
    }
  }, [items]);

  useEffect(() => {
    if (order) {
      setNotes(order.notes || "");
      setOrderDate(order.order_date);
      setRequestedDelivery(order.requested_delivery || "");
      setIncoterm(order.incoterm || "");
    }
  }, [order]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    for (const l of lines.filter((x) => !x._deleted)) {
      const gross = l.quantity * l.unit_price;
      const afterDisc = gross * (1 - (l.discount_pct || 0) / 100);
      subtotal += afterDisc;
      vat += afterDisc * ((l.vat_pct || 0) / 100);
    }
    return { subtotal, vat, total: subtotal + vat };
  }, [lines]);

  const saveOrder = useMutation({
    mutationFn: async () => {
      if (!order) return;
      // Update header
      const { error: hErr } = await supabase
        .from("orders")
        .update({
          notes: notes || null,
          order_date: orderDate,
          requested_delivery: requestedDelivery || null,
          incoterm: incoterm || null,
          subtotal: totals.subtotal,
          vat_amount: totals.vat,
          total: totals.total,
        })
        .eq("id", order.id);
      if (hErr) throw hErr;

      // Handle line deletes
      const toDelete = lines.filter((l) => l._deleted && l.id).map((l) => l.id!);
      if (toDelete.length) {
        const { error } = await supabase.from("order_items").delete().in("id", toDelete);
        if (error) throw error;
      }

      // Upserts
      for (const l of lines.filter((x) => !x._deleted)) {
        const payload = {
          order_id: order.id,
          description: l.description,
          quantity: l.quantity,
          unit: l.unit,
          unit_price: l.unit_price,
          discount_pct: l.discount_pct,
          vat_pct: l.vat_pct,
          position: l.position,
          line_total:
            l.quantity * l.unit_price * (1 - (l.discount_pct || 0) / 100) *
            (1 + (l.vat_pct || 0) / 100),
        };
        if (l.id) {
          const { error } = await supabase.from("order_items").update(payload).eq("id", l.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("order_items").insert(payload);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success("Order saved");
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["order-items", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const setStatus = useMutation({
    mutationFn: async (status: (typeof ORDER_STATUSES)[number]) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const createInvoice = useMutation({
    mutationFn: async (type: "proforma" | "commercial") => {
      if (!order) return null;
      const { data: inv, error } = await supabase
        .from("invoices")
        .insert({
          type,
          order_id: order.id,
          customer_id: order.customer_id,
          currency: order.currency,
          subtotal: totals.subtotal,
          vat_amount: totals.vat,
          total: totals.total,
          balance: totals.total,
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      // Copy lines
      const linesToCopy = lines
        .filter((l) => !l._deleted)
        .map((l) => ({
          invoice_id: inv.id,
          description: l.description,
          quantity: l.quantity,
          unit: l.unit,
          unit_price: l.unit_price,
          discount_pct: l.discount_pct,
          vat_pct: l.vat_pct,
          position: l.position,
          line_total:
            l.quantity * l.unit_price * (1 - (l.discount_pct || 0) / 100) *
            (1 + (l.vat_pct || 0) / 100),
        }));
      if (linesToCopy.length) {
        const { error: iErr } = await supabase.from("invoice_items").insert(linesToCopy);
        if (iErr) throw iErr;
      }
      return inv;
    },
    onSuccess: (inv) => {
      if (!inv) return;
      toast.success("Invoice created");
      window.location.href = `/admin/invoices/${inv.id}`;
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const createShipment = useMutation({
    mutationFn: async () => {
      if (!order) return null;
      const { data, error } = await supabase
        .from("shipments")
        .insert({
          order_id: order.id,
          shipment_number: `SHP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (s) => {
      if (!s) return;
      toast.success("Shipment created");
      window.location.href = `/admin/shipments/${s.id}`;
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!order)
    return (
      <div className="p-6 space-y-4">
        <p className="text-muted-foreground">Order not found.</p>
        <Button asChild variant="outline">
          <Link to="/admin/orders">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
      </div>
    );

  const cust = order.customers as { id: string; name: string; currency: string } | null;

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        description: "",
        quantity: 1,
        unit: "pcs",
        unit_price: 0,
        discount_pct: 0,
        vat_pct: 0,
        position: prev.length,
        _new: true,
      },
    ]);
  }
  function removeLine(idx: number) {
    setLines((prev) => {
      const l = prev[idx];
      if (l._new) return prev.filter((_, i) => i !== idx);
      return prev.map((x, i) => (i === idx ? { ...x, _deleted: true } : x));
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/admin/orders">
            <ArrowLeft className="h-4 w-4 mr-1" /> All orders
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Order</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {order.order_number || order.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              For{" "}
              {cust ? (
                <Link
                  to="/admin/customers/$id"
                  params={{ id: cust.id }}
                  className="text-primary hover:underline"
                >
                  {cust.name}
                </Link>
              ) : (
                "—"
              )}{" "}
              · {order.currency}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant={orderStatusVariant(order.status)} className="text-sm">
              {orderStatusLabel(order.status)}
            </Badge>
            {canEdit && (
              <Select value={order.status} onValueChange={(v) => setStatus.mutate(v as never)}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {orderStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {canInvoice && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createInvoice.mutate("proforma")}
                  disabled={createInvoice.isPending}
                >
                  <FileText className="h-4 w-4 mr-1" /> Proforma
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createInvoice.mutate("commercial")}
                  disabled={createInvoice.isPending}
                >
                  <FileText className="h-4 w-4 mr-1" /> Invoice
                </Button>
              </>
            )}
            {canShip && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => createShipment.mutate()}
                disabled={createShipment.isPending}
              >
                <Truck className="h-4 w-4 mr-1" /> Shipment
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Line items</CardTitle>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" /> Add line
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-20">Unit</TableHead>
                  <TableHead className="w-28">Price</TableHead>
                  <TableHead className="w-20">Disc %</TableHead>
                  <TableHead className="w-20">VAT %</TableHead>
                  <TableHead className="w-28 text-right">Line total</TableHead>
                  {canEdit && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.filter((l) => !l._deleted).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      No line items. {canEdit && 'Click "Add line".'}
                    </TableCell>
                  </TableRow>
                )}
                {lines.map((l, idx) => {
                  if (l._deleted) return null;
                  const lt =
                    l.quantity * l.unit_price * (1 - (l.discount_pct || 0) / 100) *
                    (1 + (l.vat_pct || 0) / 100);
                  return (
                    <TableRow key={l.id ?? `new-${idx}`}>
                      <TableCell>
                        <Input
                          value={l.description}
                          onChange={(e) => updateLine(idx, { description: e.target.value })}
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={l.quantity}
                          onChange={(e) =>
                            updateLine(idx, { quantity: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={l.unit}
                          onChange={(e) => updateLine(idx, { unit: e.target.value })}
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={l.unit_price}
                          onChange={(e) =>
                            updateLine(idx, { unit_price: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={l.discount_pct}
                          onChange={(e) =>
                            updateLine(idx, { discount_pct: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={l.vat_pct}
                          onChange={(e) =>
                            updateLine(idx, { vat_pct: parseFloat(e.target.value) || 0 })
                          }
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(lt, order.currency)}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => removeLine(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="border-t p-4 flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <Row label="Subtotal" value={formatMoney(totals.subtotal, order.currency)} />
                <Row label="VAT" value={formatMoney(totals.vat, order.currency)} />
                <div className="border-t pt-1">
                  <Row
                    label={<span className="font-semibold">Total</span>}
                    value={
                      <span className="font-semibold">
                        {formatMoney(totals.total, order.currency)}
                      </span>
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Order date</Label>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div>
                <Label className="text-xs">Requested delivery</Label>
                <Input
                  type="date"
                  value={requestedDelivery}
                  onChange={(e) => setRequestedDelivery(e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div>
                <Label className="text-xs">Incoterm</Label>
                <Input
                  value={incoterm}
                  onChange={(e) => setIncoterm(e.target.value)}
                  placeholder="e.g. FOB, CIF"
                  disabled={!canEdit}
                />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  disabled={!canEdit}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Created {formatDate(order.created_at)}
              </p>
            </CardContent>
          </Card>

          <DocumentsPanel entityType="order" entityId={id} />
        </div>
      </div>

      {canEdit && (
        <div className="sticky bottom-4 flex justify-end">
          <Button size="lg" onClick={() => saveOrder.mutate()} disabled={saveOrder.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {saveOrder.isPending ? "Saving…" : "Save order"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
