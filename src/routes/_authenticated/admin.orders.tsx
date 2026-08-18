import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendOrderConfirmation } from "@/lib/orders.functions";
import { MasterListShell } from "@/components/crm/MasterListShell";
import { GuideMeButton } from "@/components/ai/GuideMeButton";

import { useCanEditOrders } from "@/lib/crm-permissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney, formatDate } from "@/lib/crm-money";
import {
  ORDER_STATUSES,
  orderStatusLabel,
  orderStatusVariant,
  type OrderStatus,
} from "@/lib/crm-status";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const canEdit = useCanEditOrders();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-active-lite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, currency")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      const cName = (o.customers as { name?: string } | null)?.name || "";
      return (
        (o.order_number || "").toLowerCase().includes(q) ||
        cName.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  const sendConfirmation = useServerFn(sendOrderConfirmation);
  const create = useMutation({
    mutationFn: async () => {
      if (!customerId) throw new Error("Select a customer");
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(
        Date.now(),
      ).slice(-6)}`;
      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          currency,
          notes: notes || null,
          order_number: orderNumber,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Order created");
      qc.invalidateQueries({ queryKey: ["orders"] });
      setDialogOpen(false);
      setCustomerId("");
      setNotes("");
      // Fire-and-forget confirmation email; don't block navigation.
      sendConfirmation({ data: { orderId: data.id } })
        .then((r) => {
          if (r?.ok) toast.success("Confirmation email sent to customer");
          else if (r?.reason === "no_customer_email")
            toast.message("No customer email on file — confirmation not sent");
        })
        .catch(() => {
          /* logged server-side */
        });
      window.location.href = `/admin/orders/${data.id}`;
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });


  return (
    <>
      <MasterListShell
        title="Orders"
        description="Customer orders through their full lifecycle."
        count={orders.length}
        search={search}
        onSearchChange={setSearch}
        canCreate={canEdit}
        onCreate={() => setDialogOpen(true)}
        createLabel="New order"
        headerExtra={<GuideMeButton sectionId="orders" />}
      >
        <div className="p-3 border-b flex gap-2 items-center">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}>
            <SelectTrigger className="w-52 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {orderStatusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    {orders.length === 0 ? "No orders yet." : "No matches."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link
                      to="/admin/orders/$id"
                      params={{ id: o.id }}
                      className="text-accent hover:underline font-medium"
                    >
                      {o.order_number || o.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {(o.customers as { name?: string } | null)?.name || "—"}
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
        </div>
      </MasterListShell>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New order</DialogTitle>
            <DialogDescription>
              Pick a customer and start with a draft. You can add line items on the next screen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Customer *</Label>
              <Select
                value={customerId}
                onValueChange={(v) => {
                  setCustomerId(v);
                  const c = customers.find((x) => x.id === v);
                  if (c) setCurrency(c.currency);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
