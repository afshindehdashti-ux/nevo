import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
import { ArrowLeft, Save } from "lucide-react";
import { formatDate } from "@/lib/crm-money";
import {
  SHIPMENT_STATUSES,
  shipmentStatusLabel,
  shipmentStatusVariant,
  type ShipmentStatus,
} from "@/lib/crm-status";
import { useCanEditShipments } from "@/lib/crm-permissions";
import { DocumentsPanel } from "@/components/crm/DocumentsPanel";

export const Route = createFileRoute("/_authenticated/admin/shipments/$id")({
  head: () => ({
    meta: [{ title: "Shipment — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: ShipmentDetailPage,
});

function ShipmentDetailPage() {
  const { id } = useParams({ from: "/_authenticated/admin/shipments/$id" });
  const qc = useQueryClient();
  const canEdit = useCanEditShipments();

  const { data: shipment, isLoading } = useQuery({
    queryKey: ["shipment", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*, orders(id, order_number, customer_id, customers(id, name))")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [status, setStatus] = useState<ShipmentStatus>("preparing");
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [incoterm, setIncoterm] = useState("");
  const [container, setContainer] = useState("");
  const [bl, setBl] = useState("");
  const [shippedAt, setShippedAt] = useState("");
  const [deliveredAt, setDeliveredAt] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (shipment) {
      setStatus(shipment.status);
      setCarrier(shipment.carrier || "");
      setTracking(shipment.tracking_no || "");
      setIncoterm(shipment.incoterm || "");
      setContainer(shipment.container_no || "");
      setBl(shipment.bl_number || "");
      setShippedAt(shipment.shipped_at || "");
      setDeliveredAt(shipment.delivered_at || "");
      setNotes(shipment.notes || "");
    }
  }, [shipment]);

  const save = useMutation({
    mutationFn: async () => {
      if (!shipment) return;
      const { error } = await supabase
        .from("shipments")
        .update({
          status,
          carrier: carrier || null,
          tracking_no: tracking || null,
          incoterm: incoterm || null,
          container_no: container || null,
          bl_number: bl || null,
          shipped_at: shippedAt || null,
          delivered_at: deliveredAt || null,
          notes: notes || null,
        })
        .eq("id", shipment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Shipment saved");
      qc.invalidateQueries({ queryKey: ["shipment", id] });
      qc.invalidateQueries({ queryKey: ["shipments"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!shipment)
    return (
      <div className="p-6 space-y-4">
        <p className="text-muted-foreground">Shipment not found.</p>
        <Button asChild variant="outline">
          <Link to="/admin/shipments">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
      </div>
    );

  const ord = shipment.orders as {
    id: string;
    order_number: string | null;
    customers: { id: string; name: string } | null;
  } | null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/admin/shipments">
            <ArrowLeft className="h-4 w-4 mr-1" /> All shipments
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Shipment</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {shipment.shipment_number || shipment.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Order{" "}
              {ord ? (
                <Link
                  to="/admin/orders/$id"
                  params={{ id: ord.id }}
                  className="text-primary hover:underline"
                >
                  {ord.order_number || ord.id.slice(0, 8)}
                </Link>
              ) : (
                "—"
              )}
              {ord?.customers && (
                <>
                  {" · "}
                  <Link
                    to="/admin/customers/$id"
                    params={{ id: ord.customers.id }}
                    className="text-primary hover:underline"
                  >
                    {ord.customers.name}
                  </Link>
                </>
              )}
            </p>
          </div>
          <Badge variant={shipmentStatusVariant(shipment.status)} className="text-sm">
            {shipmentStatusLabel(shipment.status)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Logistics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ShipmentStatus)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIPMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {shipmentStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Carrier</Label>
              <Input
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div>
              <Label>Tracking number</Label>
              <Input
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div>
              <Label>Incoterm</Label>
              <Input
                value={incoterm}
                onChange={(e) => setIncoterm(e.target.value)}
                placeholder="e.g. FOB"
                disabled={!canEdit}
              />
            </div>
            <div>
              <Label>Container #</Label>
              <Input
                value={container}
                onChange={(e) => setContainer(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div>
              <Label>Bill of Lading #</Label>
              <Input value={bl} onChange={(e) => setBl(e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <Label>Shipped on</Label>
              <Input
                type="date"
                value={shippedAt}
                onChange={(e) => setShippedAt(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div>
              <Label>Delivered on</Label>
              <Input
                type="date"
                value={deliveredAt}
                onChange={(e) => setDeliveredAt(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={!canEdit}
              />
            </div>
            <p className="text-xs text-muted-foreground md:col-span-2">
              Created {formatDate(shipment.created_at)}
            </p>
          </CardContent>
        </Card>

        <DocumentsPanel
          entityType="shipment"
          entityId={id}
          title="Shipping documents"
          defaultKind="packing_list"
        />
      </div>

      {canEdit && (
        <div className="sticky bottom-4 flex justify-end">
          <Button size="lg" onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {save.isPending ? "Saving…" : "Save shipment"}
          </Button>
        </div>
      )}
    </div>
  );
}
