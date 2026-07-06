import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MasterListShell } from "@/components/crm/MasterListShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/crm-money";
import {
  SHIPMENT_STATUSES,
  shipmentStatusLabel,
  shipmentStatusVariant,
  type ShipmentStatus,
} from "@/lib/crm-status";

export const Route = createFileRoute("/_authenticated/admin/shipments")({
  head: () => ({
    meta: [{ title: "Shipments — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: ShipmentsPage,
});

function ShipmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "all">("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["shipments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*, orders(order_number, customer_id, customers(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      const ord = s.orders as {
        order_number?: string;
        customers?: { name?: string } | null;
      } | null;
      return (
        (s.shipment_number || "").toLowerCase().includes(q) ||
        (ord?.order_number || "").toLowerCase().includes(q) ||
        (ord?.customers?.name || "").toLowerCase().includes(q) ||
        (s.tracking_no || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  return (
    <MasterListShell
      title="Shipments"
      description="Outbound shipments tied to customer orders."
      count={rows.length}
      search={search}
      onSearchChange={setSearch}
      canCreate={false}
      onCreate={() => {}}
    >
      <div className="p-3 border-b flex gap-2 items-center">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ShipmentStatus | "all")}
        >
          <SelectTrigger className="w-52 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {SHIPMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {shipmentStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground ml-auto">
          Create from an{" "}
          <Link to="/admin/orders" className="text-primary hover:underline">
            order
          </Link>
          .
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment #</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead>Shipped</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  {rows.length === 0 ? "No shipments yet." : "No matches."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((s) => {
              const ord = s.orders as {
                order_number?: string;
                customers?: { name?: string } | null;
              } | null;
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link
                      to="/admin/shipments/$id"
                      params={{ id: s.id }}
                      className="text-primary hover:underline font-medium"
                    >
                      {s.shipment_number || s.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      to="/admin/orders/$id"
                      params={{ id: s.order_id }}
                      className="text-primary hover:underline"
                    >
                      {ord?.order_number || s.order_id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>{ord?.customers?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={shipmentStatusVariant(s.status)}>
                      {shipmentStatusLabel(s.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.carrier || "—"}</TableCell>
                  <TableCell>{s.tracking_no || "—"}</TableCell>
                  <TableCell>{formatDate(s.shipped_at)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </MasterListShell>
  );
}
