import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Save, Trash2, Printer, Wallet } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/crm-money";
import {
  INVOICE_STATUSES,
  invoiceStatusLabel,
  invoiceStatusVariant,
  PAYMENT_METHODS,
  paymentMethodLabel,
  type InvoiceStatus,
  type PaymentMethod,
} from "@/lib/crm-status";
import { useCanEditInvoices, useCanEditPayments } from "@/lib/crm-permissions";
import { DocumentsPanel } from "@/components/crm/DocumentsPanel";

export const Route = createFileRoute("/_authenticated/admin/invoices/$id")({
  head: () => ({ meta: [{ title: "Invoice — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: InvoiceDetailPage,
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

function InvoiceDetailPage() {
  const { id } = useParams({ from: "/_authenticated/admin/invoices/$id" });
  const qc = useQueryClient();
  const canEdit = useCanEditInvoices();
  const canPay = useCanEditPayments();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers(id, name, address, city, country, vat_number, email)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["invoice-items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["invoice-payments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("invoice_id", id)
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("bank_transfer");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState("");

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
    if (invoice) {
      setNotes(invoice.notes || "");
      setIssueDate(invoice.issue_date);
      setDueDate(invoice.due_date || "");
      setPayAmount(Number(invoice.balance).toString());
    }
  }, [invoice]);

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

  const save = useMutation({
    mutationFn: async () => {
      if (!invoice) return;
      const { error: hErr } = await supabase
        .from("invoices")
        .update({
          notes: notes || null,
          issue_date: issueDate,
          due_date: dueDate || null,
          subtotal: totals.subtotal,
          vat_amount: totals.vat,
          total: totals.total,
          balance: Math.max(totals.total - Number(invoice.amount_paid || 0), 0),
        })
        .eq("id", invoice.id);
      if (hErr) throw hErr;

      const toDelete = lines.filter((l) => l._deleted && l.id).map((l) => l.id!);
      if (toDelete.length) {
        const { error } = await supabase.from("invoice_items").delete().in("id", toDelete);
        if (error) throw error;
      }
      for (const l of lines.filter((x) => !x._deleted)) {
        const payload = {
          invoice_id: invoice.id,
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
          const { error } = await supabase.from("invoice_items").update(payload).eq("id", l.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("invoice_items").insert(payload);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success("Invoice saved");
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoice-items", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const setStatus = useMutation({
    mutationFn: async (status: InvoiceStatus) => {
      const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const addPayment = useMutation({
    mutationFn: async () => {
      if (!invoice) return;
      const amt = parseFloat(payAmount);
      if (!isFinite(amt) || amt <= 0) throw new Error("Enter a valid amount");
      const { error } = await supabase.from("payments").insert({
        invoice_id: invoice.id,
        amount: amt,
        currency: invoice.currency,
        method: payMethod,
        received_at: payDate,
        reference: payRef || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoice-payments", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setPayOpen(false);
      setPayRef("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deletePayment = useMutation({
    mutationFn: async (pid: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", pid);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment removed");
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoice-payments", id] });
    },
  });

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!invoice)
    return (
      <div className="p-6 space-y-4">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button asChild variant="outline">
          <Link to="/admin/invoices">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
      </div>
    );

  const cust = invoice.customers as {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    country: string | null;
    vat_number: string | null;
    email: string | null;
  } | null;

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
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto print:p-0">
      <div className="print:hidden">
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to={invoice.type === "proforma" ? "/admin/proforma-invoices" : "/admin/invoices"}>
            <ArrowLeft className="h-4 w-4 mr-1" /> All {invoice.type === "proforma" ? "proforma" : "invoices"}
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {invoice.type === "proforma" ? "Proforma Invoice" : "Commercial Invoice"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">{invoice.invoice_number}</h1>
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
              · {invoice.currency}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant={invoiceStatusVariant(invoice.status)} className="text-sm">
              {invoiceStatusLabel(invoice.status)}
            </Badge>
            {canEdit && (
              <Select
                value={invoice.status}
                onValueChange={(v) => setStatus.mutate(v as InvoiceStatus)}
              >
                <SelectTrigger className="w-44 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {invoiceStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Print / PDF
            </Button>
            {canPay && invoice.type === "commercial" && Number(invoice.balance) > 0 && (
              <Button size="sm" onClick={() => setPayOpen(true)}>
                <Wallet className="h-4 w-4 mr-1" /> Record payment
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
                  {canEdit && <TableHead className="w-10 print:hidden" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.filter((l) => !l._deleted).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      No line items.
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
                        {formatMoney(lt, invoice.currency)}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="print:hidden">
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
                <Row label="Subtotal" value={formatMoney(totals.subtotal, invoice.currency)} />
                <Row label="VAT" value={formatMoney(totals.vat, invoice.currency)} />
                <div className="border-t pt-1">
                  <Row
                    label={<span className="font-semibold">Total</span>}
                    value={
                      <span className="font-semibold">
                        {formatMoney(totals.total, invoice.currency)}
                      </span>
                    }
                  />
                </div>
                <Row label="Paid" value={formatMoney(invoice.amount_paid, invoice.currency)} />
                <div className="border-t pt-1">
                  <Row
                    label={<span className="font-semibold">Balance</span>}
                    value={
                      <span className="font-semibold">
                        {formatMoney(invoice.balance, invoice.currency)}
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
                <Label className="text-xs">Issue date</Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div>
                <Label className="text-xs">Due date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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
              {cust && (
                <div className="text-xs text-muted-foreground border-t pt-2">
                  <p className="font-medium text-foreground">{cust.name}</p>
                  {cust.address && <p>{cust.address}</p>}
                  <p>{[cust.city, cust.country].filter(Boolean).join(", ")}</p>
                  {cust.vat_number && <p>VAT: {cust.vat_number}</p>}
                  {cust.email && <p>{cust.email}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {invoice.type === "commercial" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {payments.length === 0 && (
                  <p className="text-sm text-muted-foreground">No payments recorded.</p>
                )}
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border rounded-md p-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {formatMoney(p.amount, p.currency)}{" "}
                        <span className="text-xs text-muted-foreground">
                          · {paymentMethodLabel(p.method)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.received_at)}
                        {p.reference && ` · ${p.reference}`}
                      </p>
                    </div>
                    {canPay && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deletePayment.mutate(p.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <DocumentsPanel entityType="invoice" entityId={id} />
        </div>
      </div>

      {canEdit && (
        <div className="sticky bottom-4 flex justify-end print:hidden">
          <Button size="lg" onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {save.isPending ? "Saving…" : "Save invoice"}
          </Button>
        </div>
      )}

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Amount ({invoice.currency})</Label>
              <Input
                type="number"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Method</Label>
              <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {paymentMethodLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Received on</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div>
              <Label>Reference</Label>
              <Input
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="Transaction ID, cheque #, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => addPayment.mutate()} disabled={addPayment.isPending}>
              {addPayment.isPending ? "Saving…" : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
