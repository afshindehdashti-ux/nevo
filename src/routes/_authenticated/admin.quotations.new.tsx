import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createQuotationWithItems } from "@/lib/quotations.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Copy,
  Plus,
  Save,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type Line = {
  key: string;
  item_code: string;
  hs_code: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_pct: number;
};

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const emptyLine = (): Line => ({
  key: newKey(),
  item_code: "",
  hs_code: "",
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
const round2 = (n: number) => Math.round(n * 100) / 100;
const lineTotal = (l: Line) =>
  round2(l.quantity * l.unit_price * (1 - (l.discount_pct || 0) / 100));

export const Route = createFileRoute("/_authenticated/admin/quotations/new")({
  head: () => ({
    meta: [
      { title: "New quotation — NEVO CRM" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewQuotationSheet,
});

function NewQuotationSheet() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createFn = useServerFn(createQuotationWithItems);

  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(todayISO());
  const [validUntil, setValidUntil] = useState(inDaysISO(30));
  const [currency, setCurrency] = useState("USD");
  const [vatRate, setVatRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine(), emptyLine()]);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-lite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company_name")
        .order("name", { ascending: true })
        .limit(500);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const totals = useMemo(() => {
    const subtotal = round2(lines.reduce((s, l) => s + lineTotal(l), 0));
    const vat = round2((subtotal * vatRate) / 100);
    const grand = round2(subtotal + vat);
    const filledLines = lines.filter((l) => l.description.trim() !== "").length;
    return { subtotal, vat, grand, filledLines };
  }, [lines, vatRate]);

  const updateLine = (idx: number, patch: Partial<Line>) => {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const addLine = (idx?: number) => {
    setLines((prev) => {
      const next = [...prev];
      const at = idx === undefined ? next.length : idx + 1;
      next.splice(at, 0, emptyLine());
      return next;
    });
  };

  const duplicateLine = (idx: number) => {
    setLines((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, { ...prev[idx], key: newKey() });
      return next;
    });
  };

  const removeLine = (idx: number) => {
    setLines((prev) => (prev.length === 1 ? [emptyLine()] : prev.filter((_, i) => i !== idx)));
  };

  const moveLine = (idx: number, dir: -1 | 1) => {
    setLines((prev) => {
      const to = idx + dir;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!customerId) throw new Error("Select a customer");
      const payloadItems = lines
        .filter((l) => l.description.trim() !== "")
        .map((l) => ({
          item_code: l.item_code || null,
          hs_code: l.hs_code || null,
          description: l.description,
          quantity: Number(l.quantity) || 0,
          unit: l.unit || "unit",
          unit_price: Number(l.unit_price) || 0,
          discount_pct: Number(l.discount_pct) || 0,
        }));
      if (payloadItems.length === 0) throw new Error("Add at least one line item with a description");
      const invalid = payloadItems.find((i) => i.quantity < 0 || i.unit_price < 0);
      if (invalid) throw new Error("Quantities and prices must be zero or positive");
      return createFn({
        data: {
          customer_id: customerId,
          issue_date: issueDate,
          valid_until: validUntil,
          currency,
          vat_rate: vatRate,
          terms: terms || null,
          notes: notes || null,
          items: payloadItems,
        },
      });
    },
    onSuccess: (res) => {
      toast.success("Quotation created");
      qc.invalidateQueries({ queryKey: ["quotations"] });
      if (res?.id) navigate({ to: "/admin/quotations/$id", params: { id: res.id } });
      else navigate({ to: "/admin/quotations" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create quotation"),
  });

  const canSave = customerId !== "" && totals.filledLines > 0 && !saveMut.isPending;
  const currencySymbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/quotations">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Finance</p>
            <h1 className="text-2xl font-semibold tracking-tight">New quotation — manual entry</h1>
          </div>
        </div>
        <Button onClick={() => saveMut.mutate()} disabled={!canSave} size="lg">
          {saveMut.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save quotation
        </Button>
      </div>

      {/* Header fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Header</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="col-span-2 md:col-span-2 space-y-1">
            <Label className="text-xs">Customer *</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.company_name || c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Issue date</Label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Valid until</Label>
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["USD", "EUR", "GBP", "AED", "SAR"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">VAT %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value) || 0)}
              className="h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Spreadsheet */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Line items <span className="text-muted-foreground">({lines.length})</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => addLine()}>
            <Plus className="h-4 w-4 mr-1" /> Add row
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-2 py-2 w-10">#</th>
                  <th className="text-left px-2 py-2 w-28">Item code</th>
                  <th className="text-left px-2 py-2">Description *</th>
                  <th className="text-right px-2 py-2 w-24">Qty</th>
                  <th className="text-left px-2 py-2 w-20">Unit</th>
                  <th className="text-right px-2 py-2 w-28">Unit price</th>
                  <th className="text-right px-2 py-2 w-24">Disc %</th>
                  <th className="text-right px-2 py-2 w-28">Line total</th>
                  <th className="text-left px-2 py-2 w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const lt = lineTotal(l);
                  return (
                    <tr key={l.key} className="border-t border-border hover:bg-muted/20">
                      <td className="px-2 py-1 text-xs text-muted-foreground font-mono align-middle">{i + 1}</td>
                      <td className="px-1 py-1">
                        <Input
                          value={l.item_code}
                          onChange={(e) => updateLine(i, { item_code: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <Input
                          value={l.description}
                          onChange={(e) => updateLine(i, { description: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (i === lines.length - 1) addLine(i);
                            }
                          }}
                          placeholder="Item description…"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={l.quantity}
                          onChange={(e) => updateLine(i, { quantity: Number(e.target.value) || 0 })}
                          className="h-8 text-xs text-right"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <Input
                          value={l.unit}
                          onChange={(e) => updateLine(i, { unit: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={l.unit_price}
                          onChange={(e) => updateLine(i, { unit_price: Number(e.target.value) || 0 })}
                          className="h-8 text-xs text-right"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          value={l.discount_pct}
                          onChange={(e) => updateLine(i, { discount_pct: Number(e.target.value) || 0 })}
                          className="h-8 text-xs text-right"
                        />
                      </td>
                      <td className="px-2 py-1 text-right font-mono tabular-nums text-xs align-middle">
                        {currencySymbol}
                        {lt.toFixed(2)}
                      </td>
                      <td className="px-1 py-1">
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Move up"
                            disabled={i === 0}
                            onClick={() => moveLine(i, -1)}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Move down"
                            disabled={i === lines.length - 1}
                            onClick={() => moveLine(i, 1)}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Duplicate"
                            onClick={() => duplicateLine(i)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-600 hover:text-rose-700"
                            title="Delete"
                            onClick={() => removeLine(i)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/30 text-sm">
                <tr className="border-t border-border">
                  <td colSpan={7} className="px-3 py-2 text-right text-muted-foreground">
                    Subtotal
                  </td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums">
                    {currencySymbol}
                    {totals.subtotal.toFixed(2)}
                  </td>
                  <td />
                </tr>
                <tr>
                  <td colSpan={7} className="px-3 py-2 text-right text-muted-foreground">
                    VAT ({vatRate}%)
                  </td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums">
                    {currencySymbol}
                    {totals.vat.toFixed(2)}
                  </td>
                  <td />
                </tr>
                <tr className="border-t border-border">
                  <td colSpan={7} className="px-3 py-2 text-right font-semibold">
                    Grand total
                  </td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums font-semibold">
                    {currencySymbol}
                    {totals.grand.toFixed(2)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="p-3 text-[11px] text-muted-foreground border-t border-border">
            Press <kbd className="rounded border px-1">Enter</kbd> in the last description to add a new row.
            {totals.filledLines === 0 && " Add at least one item with a description to save."}
          </div>
        </CardContent>
      </Card>

      {/* Notes & terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes or customer message…" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Payment, delivery, incoterms…" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
