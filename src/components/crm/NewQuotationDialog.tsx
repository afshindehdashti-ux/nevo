import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { createQuotationWithItems, createCustomerLite } from "@/lib/quotations.functions";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Copy, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

type Line = {
  item_code: string;
  hs_code: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_pct: number;
};

const emptyLine = (): Line => ({
  item_code: "",
  hs_code: "",
  description: "",
  quantity: 1,
  unit: "unit",
  unit_price: 0,
  discount_pct: 0,
});

const lineSubtotal = (l: Line) => l.quantity * l.unit_price * (1 - (l.discount_pct ?? 0) / 100);

const todayISO = () => new Date().toISOString().slice(0, 10);
const inDaysISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

type CustomerOpt = { id: string; name: string; company_name: string | null };

export function NewQuotationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createFn = useServerFn(createQuotationWithItems);
  const createCustomerFn = useServerFn(createCustomerLite);

  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(todayISO());
  const [validUntil, setValidUntil] = useState(inDaysISO(30));
  const [currency, setCurrency] = useState("USD");
  const [vatRate, setVatRate] = useState(0);
  const [incoterms, setIncoterms] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);

  // Inline customer create
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerCountry, setNewCustomerCountry] = useState("");

  const loadCustomers = () =>
    supabase
      .from("customers")
      .select("id,name,company_name")
      .order("name")
      .then(({ data }) => setCustomers((data as CustomerOpt[]) ?? []));

  useEffect(() => {
    if (!open) return;
    loadCustomers();
    // reset when opened
    setCustomerId("");
    setIssueDate(todayISO());
    setValidUntil(inDaysISO(30));
    setCurrency("USD");
    setVatRate(0);
    setIncoterms("");
    setPaymentTerms("");
    setDeliveryTerms("");
    setNotes("");
    setTerms("");
    setLines([emptyLine()]);
    setShowNewCustomer(false);
    setNewCustomerName("");
    setNewCustomerEmail("");
    setNewCustomerCountry("");
  }, [open]);

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + lineSubtotal(l), 0), [lines]);
  const vat = useMemo(() => (subtotal * vatRate) / 100, [subtotal, vatRate]);
  const total = subtotal + vat;

  const combinedTerms = useMemo(() => {
    const parts: string[] = [];
    if (incoterms) parts.push(`Incoterms: ${incoterms}`);
    if (paymentTerms) parts.push(`Payment: ${paymentTerms}`);
    if (deliveryTerms) parts.push(`Delivery: ${deliveryTerms}`);
    if (terms) parts.push(terms);
    return parts.join("\n");
  }, [incoterms, paymentTerms, deliveryTerms, terms]);

  const createCustomer = useMutation({
    mutationFn: () =>
      createCustomerFn({
        data: {
          name: newCustomerName.trim(),
          email: newCustomerEmail.trim() || null,
          country: newCustomerCountry.trim() || null,
        },
      }),
    onSuccess: async (r) => {
      toast.success("Customer created");
      await loadCustomers();
      if (r?.id) setCustomerId(r.id);
      setShowNewCustomer(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          customer_id: customerId,
          issue_date: issueDate,
          valid_until: validUntil,
          currency,
          vat_rate: vatRate,
          terms: combinedTerms || null,
          notes: notes || null,
          items: lines.map((l) => ({
            item_code: l.item_code.trim() || null,
            hs_code: l.hs_code.trim() || null,
            description: l.description.trim(),
            quantity: Number(l.quantity),
            unit: l.unit || "unit",
            unit_price: Number(l.unit_price),
            discount_pct: Number(l.discount_pct ?? 0),
          })),
        },
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation saved as draft");
      onOpenChange(false);
      if (r?.id) navigate({ to: "/admin/quotations/$id", params: { id: r.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSubmit =
    !!customerId &&
    !!validUntil &&
    lines.length > 0 &&
    lines.every((l) => l.description.trim().length > 0 && l.quantity > 0);

  const updateLine = (idx: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New quotation</DialogTitle>
          <DialogDescription>
            A customer, validity date, and at least one line item are required. Full editing is
            available on the next screen.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label>Customer *</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowNewCustomer((v) => !v)}
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                {showNewCustomer ? "Cancel" : "New customer"}
              </Button>
            </div>
            {!showNewCustomer && (
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name || c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {showNewCustomer && (
              <div className="grid gap-2 md:grid-cols-3 rounded-md border p-3 bg-muted/30">
                <Input
                  placeholder="Company name *"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
                <Input
                  placeholder="Email (optional)"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                />
                <Input
                  placeholder="Country (optional)"
                  value={newCustomerCountry}
                  onChange={(e) => setNewCustomerCountry(e.target.value)}
                />
                <div className="md:col-span-3 flex justify-end">
                  <Button
                    size="sm"
                    disabled={!newCustomerName.trim() || createCustomer.isPending}
                    onClick={() => createCustomer.mutate()}
                  >
                    {createCustomer.isPending ? "Creating…" : "Create customer"}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div>
            <Label>Issue date *</Label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div>
            <Label>Valid until *</Label>
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>
          <div>
            <Label>Currency</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
          </div>
          <div>
            <Label>VAT %</Label>
            <Input
              type="number"
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>Incoterms</Label>
            <Input
              value={incoterms}
              onChange={(e) => setIncoterms(e.target.value)}
              placeholder="e.g. FOB Jebel Ali"
            />
          </div>
          <div>
            <Label>Payment terms</Label>
            <Input
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="e.g. 50% advance, 50% before shipment"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Delivery terms</Label>
            <Input
              value={deliveryTerms}
              onChange={(e) => setDeliveryTerms(e.target.value)}
              placeholder="e.g. 4–6 weeks from order confirmation"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Line items *</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add line
            </Button>
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Item code</TableHead>
                  <TableHead className="w-24">HS code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-20">Unit</TableHead>
                  <TableHead className="w-28">Unit price</TableHead>
                  <TableHead className="w-20">Disc %</TableHead>
                  <TableHead className="w-28 text-right">Line total</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Input
                        value={l.item_code}
                        onChange={(e) => updateLine(idx, { item_code: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={l.hs_code}
                        onChange={(e) => updateLine(idx, { hs_code: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={l.description}
                        onChange={(e) => updateLine(idx, { description: e.target.value })}
                        placeholder="Item / service"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={l.quantity}
                        onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={l.unit}
                        onChange={(e) => updateLine(idx, { unit: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={l.unit_price}
                        onChange={(e) =>
                          updateLine(idx, { unit_price: Number(e.target.value) || 0 })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={l.discount_pct}
                        onChange={(e) =>
                          updateLine(idx, { discount_pct: Number(e.target.value) || 0 })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {currency}{" "}
                      {lineSubtotal(l).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setLines((prev) => {
                              const copy = [...prev];
                              copy.splice(idx + 1, 0, { ...prev[idx] });
                              return copy;
                            })
                          }
                          title="Duplicate row"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={lines.length === 1}
                          onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                          title="Delete row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Terms &amp; conditions</Label>
            <Textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Optional — appended to Incoterms/Payment/Delivery"
            />
          </div>
          <div>
            <Label>Notes for customer</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="text-sm space-y-1 border-t pt-3">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>
              {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>VAT ({vatRate}%)</span>
            <span>
              {currency} {vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>
              {currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => create.mutate()} disabled={!canSubmit || create.isPending}>
            {create.isPending ? "Saving…" : "Save draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
