import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { createQuotationWithItems } from "@/lib/quotations.functions";
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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Line = {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_pct: number;
};

const emptyLine = (): Line => ({
  description: "",
  quantity: 1,
  unit: "unit",
  unit_price: 0,
  discount_pct: 0,
});

const todayISO = () => new Date().toISOString().slice(0, 10);
const inDaysISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

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

  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(todayISO());
  const [validUntil, setValidUntil] = useState(inDaysISO(30));
  const [currency, setCurrency] = useState("USD");
  const [vatRate, setVatRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("customers")
      .select("id,name")
      .order("name")
      .then(({ data }) => setCustomers(data ?? []));
    // reset when opened
    setCustomerId("");
    setIssueDate(todayISO());
    setValidUntil(inDaysISO(30));
    setCurrency("USD");
    setVatRate(0);
    setNotes("");
    setLines([emptyLine()]);
  }, [open]);

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (sum, l) =>
          sum + l.quantity * l.unit_price * (1 - (l.discount_pct ?? 0) / 100),
        0,
      ),
    [lines],
  );
  const vat = useMemo(() => (subtotal * vatRate) / 100, [subtotal, vatRate]);
  const total = subtotal + vat;

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          customer_id: customerId,
          issue_date: issueDate,
          valid_until: validUntil,
          currency,
          vat_rate: vatRate,
          notes: notes || null,
          items: lines.map((l) => ({
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
      toast.success("Quotation created");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New quotation</DialogTitle>
          <DialogDescription>
            A customer, validity date, and at least one line item are required. Full editing is
            available on the next screen.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Customer *</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
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
          <div>
            <Label>Issue date *</Label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div>
            <Label>Valid until *</Label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
          <div>
            <Label>Currency</Label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <Label>VAT %</Label>
            <Input
              type="number"
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value) || 0)}
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-20">Unit</TableHead>
                  <TableHead className="w-28">Unit price</TableHead>
                  <TableHead className="w-20">Disc %</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Input
                        value={l.description}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, description: e.target.value } : row,
                            ),
                          )
                        }
                        placeholder="Item / service"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={l.quantity}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((row, i) =>
                              i === idx
                                ? { ...row, quantity: Number(e.target.value) || 0 }
                                : row,
                            ),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={l.unit}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, unit: e.target.value } : row,
                            ),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={l.unit_price}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((row, i) =>
                              i === idx
                                ? { ...row, unit_price: Number(e.target.value) || 0 }
                                : row,
                            ),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={l.discount_pct}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((row, i) =>
                              i === idx
                                ? { ...row, discount_pct: Number(e.target.value) || 0 }
                                : row,
                            ),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={lines.length === 1}
                        onClick={() =>
                          setLines((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <Label>Notes for customer</Label>
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
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
          <Button
            onClick={() => create.mutate()}
            disabled={!canSubmit || create.isPending}
          >
            {create.isPending ? "Creating…" : "Create quotation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
