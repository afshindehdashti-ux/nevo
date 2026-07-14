import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileDown,
  Loader2,
  Plus,
  Receipt,
  Save,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatMoney } from "@/lib/crm-money";
import {
  customerDisplayName,
  financeBalanceDue,
  financePaidAmount,
  financeTotalAmount,
  type CustomerDisplay,
} from "@/lib/finance-normalization";
import { generateProformaInvoicePdf } from "@/lib/proforma-invoice-pdf";
import { convertProformaInvoiceToCommercial } from "@/lib/proforma-invoices.functions";

type ItemRow = {
  id: string;
  description: string;
  item_code: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  discount: number;
  discount_amount: number;
  tax_rate: number;
  line_total: number;
  sort_order: number;
};

export const Route = createFileRoute("/_authenticated/admin/proforma-invoices/$id")({
  head: () => ({
    meta: [{ title: "Proforma Invoice — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: ProformaInvoiceDetail,
  errorComponent: ({ error, reset }) => (
    <div className="p-8">
      <p className="text-destructive mb-3">Failed to load proforma invoice: {error.message}</p>
      <Button onClick={reset} variant="outline">
        Retry
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8">
      <p className="text-muted-foreground">Proforma invoice not found.</p>
    </div>
  ),
});

type ProformaRow = {
  id: string;
  proforma_number: string | null;
  status: string;
  currency: string;
  created_at: string;
  valid_until: string | null;
  customer_id: string | null;
  subtotal: number;
  discount_amount: number;
  vat_rate: number;
  vat_amount: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  payment_status: string;
  payment_terms: string | null;
  delivery_terms: string | null;
  incoterms: string | null;
  terms_conditions: string | null;
  bank_details: string | null;
  notes: string | null;
  approved_by: string | null;
  prepared_by: string | null;
  customers: (CustomerDisplay & { id: string }) | null;
};

function ProformaInvoiceDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const convertFn = useServerFn(convertProformaInvoiceToCommercial);

  const { data: pi, isLoading } = useQuery({
    queryKey: ["proforma_invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proforma_invoices")
        .select(
          `id, proforma_number, status, currency, created_at, valid_until, customer_id,
           subtotal, discount_amount, vat_rate, vat_amount, grand_total,
           amount_paid, balance_due, payment_status, payment_terms, delivery_terms,
           incoterms, terms_conditions, bank_details, notes, approved_by, prepared_by,
           customers(id, name, company_name, email)`,
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ProformaRow | null;
    },
  });

  // Editable fields.
  const [termsConditions, setTermsConditions] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [incoterms, setIncoterms] = useState("");
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");

  useEffect(() => {
    if (!pi) return;
    setTermsConditions(pi.terms_conditions ?? "");
    setBankDetails(pi.bank_details ?? "");
    setPaymentTerms(pi.payment_terms ?? "");
    setDeliveryTerms(pi.delivery_terms ?? "");
    setIncoterms(pi.incoterms ?? "");
    setNotes(pi.notes ?? "");
    setValidUntil(pi.valid_until ?? "");
  }, [pi]);

  const { data: approverProfile } = useQuery({
    enabled: !!pi?.approved_by,
    queryKey: ["profile", pi?.approved_by],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", pi!.approved_by!)
        .maybeSingle();
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("proforma_invoices")
        .update({
          terms_conditions: termsConditions || null,
          bank_details: bankDetails || null,
          payment_terms: paymentTerms || null,
          delivery_terms: deliveryTerms || null,
          incoterms: incoterms || null,
          notes: notes || null,
          valid_until: validUntil || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proforma updated");
      qc.invalidateQueries({ queryKey: ["proforma_invoice", id] });
      qc.invalidateQueries({ queryKey: ["proforma_invoices", "list"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const approve = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("proforma_invoices")
        .update({ approved_by: user.id, status: "approved" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proforma approved");
      qc.invalidateQueries({ queryKey: ["proforma_invoice", id] });
      qc.invalidateQueries({ queryKey: ["proforma_invoices", "list"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Approve failed"),
  });

  const convert = useMutation({
    mutationFn: () => convertFn({ data: { id } }),
    onSuccess: (result) => {
      toast.success(
        result.already ? "Commercial invoice already exists" : "Commercial invoice created",
      );
      qc.invalidateQueries({ queryKey: ["proforma_invoice", id] });
      qc.invalidateQueries({ queryKey: ["proforma_invoices", "list"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      navigate({ to: "/admin/invoices/$id", params: { id: result.invoice_id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Conversion failed"),
  });

  // Payment capture
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"add" | "set">("add");

  const recordPayment = useMutation({
    mutationFn: async () => {
      if (!pi) throw new Error("Not loaded");
      const amt = Number(paymentAmount);
      if (!Number.isFinite(amt) || amt < 0) throw new Error("Enter a valid amount");
      const nextPaid = paymentMode === "add" ? financePaidAmount(pi) + amt : amt;
      if (nextPaid < 0) throw new Error("Amount paid cannot be negative");
      if (nextPaid > financeTotalAmount(pi) + 0.009) {
        throw new Error("Amount paid cannot exceed grand total");
      }
      const { error } = await supabase
        .from("proforma_invoices")
        .update({ amount_paid: nextPaid })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      setPaymentAmount("");
      qc.invalidateQueries({ queryKey: ["proforma_invoice", id] });
      qc.invalidateQueries({ queryKey: ["proforma_invoices", "list"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Payment failed"),
  });

  const [downloading, setDownloading] = useState(false);
  const download = async () => {
    setDownloading(true);
    try {
      await generateProformaInvoicePdf(id, "download");
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF failed");
    } finally {
      setDownloading(false);
    }
  };

  const paymentBadge = useMemo(() => {
    switch (pi?.payment_status) {
      case "Paid":
        return "default" as const;
      case "Partially Paid":
        return "secondary" as const;
      case "Overdue":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  }, [pi?.payment_status]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (!pi) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Proforma invoice not found.</p>
        <Button asChild variant="link">
          <Link to="/admin/proforma-invoices">Back to list</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/admin/proforma-invoices">
              <ArrowLeft className="h-4 w-4 mr-1" /> All proforma invoices
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-3">
            {pi.proforma_number ?? "Draft proforma"}
            <Badge variant="secondary">{pi.status}</Badge>
            <Badge variant={paymentBadge}>{pi.payment_status ?? "Unpaid"}</Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customer: {customerDisplayName(pi.customers)} · Issued {formatDate(pi.created_at)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={download} disabled={downloading}>
            {downloading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-1" />
            )}
            Download PDF
          </Button>
          <Button
            variant="secondary"
            onClick={() => approve.mutate()}
            disabled={approve.isPending || !!pi.approved_by || pi.status === "converted_to_invoice"}
          >
            {approve.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-1" />
            )}
            {pi.approved_by ? "Approved" : "Approve"}
          </Button>
          {(pi.status === "approved" ||
            pi.status === "accepted" ||
            pi.status === "converted_to_invoice") && (
            <Button onClick={() => convert.mutate()} disabled={convert.isPending}>
              {convert.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Receipt className="h-4 w-4 mr-1" />
              )}
              {pi.status === "converted_to_invoice"
                ? "Open commercial invoice"
                : "Convert to commercial invoice"}
            </Button>
          )}
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save changes
          </Button>
        </div>
      </div>

      <ProformaItemsCard
        proformaId={id}
        currency={pi.currency}
        onChanged={() => {
          qc.invalidateQueries({ queryKey: ["proforma_invoice", id] });
          qc.invalidateQueries({ queryKey: ["proforma_invoices", "list"] });
        }}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Document details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="valid_until">Valid until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={validUntil ?? ""}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="incoterms">Incoterms</Label>
                <Input
                  id="incoterms"
                  value={incoterms}
                  onChange={(e) => setIncoterms(e.target.value)}
                  placeholder="e.g. FOB, CIF, DAP"
                />
              </div>
              <div>
                <Label htmlFor="payment_terms">Payment terms</Label>
                <Input
                  id="payment_terms"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. 50% advance, 50% before shipment"
                />
              </div>
              <div>
                <Label htmlFor="delivery_terms">Delivery terms</Label>
                <Input
                  id="delivery_terms"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  placeholder="e.g. 4-6 weeks from PO"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="bank_details">Bank details</Label>
              <Textarea
                id="bank_details"
                rows={5}
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                placeholder="Bank name, account name, IBAN, SWIFT, branch…"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to fall back to the company default bank block on the PDF.
              </p>
            </div>
            <div>
              <Label htmlFor="terms_conditions">Terms &amp; conditions</Label>
              <Textarea
                id="terms_conditions"
                rows={6}
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.target.value)}
                placeholder="Warranty, jurisdiction, cancellation, etc."
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Totals</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <Row label="Subtotal" value={formatMoney(pi.subtotal, pi.currency)} />
              {Number(pi.discount_amount) > 0 && (
                <Row label="Discount" value={`− ${formatMoney(pi.discount_amount, pi.currency)}`} />
              )}
              <Row
                label={`VAT${pi.vat_rate ? ` (${Number(pi.vat_rate)}%)` : ""}`}
                value={formatMoney(pi.vat_amount, pi.currency)}
              />
              <div className="border-t pt-2">
                <Row
                  label="Grand total"
                  value={formatMoney(financeTotalAmount(pi), pi.currency)}
                  strong
                />
              </div>
              <Row label="Amount paid" value={formatMoney(financePaidAmount(pi), pi.currency)} />
              <Row
                label="Balance due"
                value={formatMoney(financeBalanceDue(pi), pi.currency)}
                strong
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Payment capture
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border p-2">
                  <p className="text-muted-foreground">Paid</p>
                  <p className="font-semibold">{formatMoney(financePaidAmount(pi), pi.currency)}</p>
                </div>
                <div className="rounded border p-2">
                  <p className="text-muted-foreground">Balance</p>
                  <p className="font-semibold">{formatMoney(financeBalanceDue(pi), pi.currency)}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="pay_mode" className="text-xs">
                  Mode
                </Label>
                <select
                  id="pay_mode"
                  className="w-full border rounded h-9 px-2 bg-background text-sm"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as "add" | "set")}
                >
                  <option value="add">Add payment</option>
                  <option value="set">Set total paid</option>
                </select>
              </div>
              <div>
                <Label htmlFor="pay_amount" className="text-xs">
                  Amount ({pi.currency})
                </Label>
                <Input
                  id="pay_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => recordPayment.mutate()}
                  disabled={recordPayment.isPending || !paymentAmount}
                >
                  {recordPayment.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4 mr-1" />
                  )}
                  Record
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPaymentMode("set");
                    setPaymentAmount(String(financeTotalAmount(pi)));
                  }}
                  disabled={recordPayment.isPending}
                >
                  Mark paid
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Balance and payment status update automatically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approval</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-muted-foreground text-xs">Approved by</p>
              <p className="font-medium">
                {pi.approved_by ? (approverProfile?.full_name ?? "Approved") : "— (pending)"}
              </p>
              <p className="text-muted-foreground text-xs mt-3">Payment status</p>
              <Badge variant={paymentBadge}>{pi.payment_status ?? "Unpaid"}</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ProformaItemsCard({
  proformaId,
  currency,
  onChanged,
}: {
  proformaId: string;
  currency: string;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const { data: items, isLoading } = useQuery({
    queryKey: ["proforma_items", proformaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proforma_invoice_items")
        .select(
          "id, description, item_code, quantity, unit, unit_price, discount, discount_amount, tax_rate, line_total, sort_order",
        )
        .eq("proforma_invoice_id", proformaId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ItemRow[];
    },
  });

  const [drafts, setDrafts] = useState<Record<string, Partial<ItemRow>>>({});
  const dirty = (row: ItemRow) => drafts[row.id] !== undefined;
  const merged = (row: ItemRow): ItemRow => ({ ...row, ...(drafts[row.id] ?? {}) });

  const setField = <K extends keyof ItemRow>(id: string, key: K, val: ItemRow[K]) =>
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? {}), [key]: val } }));

  const previewLine = (r: ItemRow) => {
    const gross = Number(r.quantity || 0) * Number(r.unit_price || 0);
    const discAmt = Number(r.discount_amount || 0);
    const discPct = (gross * Number(r.discount || 0)) / 100;
    const disc = discAmt > 0 ? discAmt : discPct;
    const taxable = Math.max(gross - disc, 0);
    const tax = (taxable * Number(r.tax_rate || 0)) / 100;
    return Math.round((taxable + tax) * 100) / 100;
  };

  const addItem = useMutation({
    mutationFn: async () => {
      const nextOrder = items?.length ?? 0;
      const { error } = await supabase.from("proforma_invoice_items").insert({
        proforma_invoice_id: proformaId,
        description: "New line item",
        quantity: 1,
        unit: "pcs",
        unit_price: 0,
        discount: 0,
        discount_amount: 0,
        tax_rate: 0,
        sort_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proforma_items", proformaId] });
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Add failed"),
  });

  const saveRow = useMutation({
    mutationFn: async (row: ItemRow) => {
      const patch = drafts[row.id];
      if (!patch) return;
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(patch)) {
        if (["quantity", "unit_price", "discount", "discount_amount", "tax_rate"].includes(k)) {
          clean[k] = Number(v ?? 0);
        } else {
          clean[k] = v;
        }
      }
      const { error } = await supabase
        .from("proforma_invoice_items")
        .update(clean as never)
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: (_d, row) => {
      setDrafts((d) => {
        const { [row.id]: _drop, ...rest } = d;
        return rest;
      });
      qc.invalidateQueries({ queryKey: ["proforma_items", proformaId] });
      onChanged();
      toast.success("Line saved · totals recomputed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const deleteRow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proforma_invoice_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proforma_items", proformaId] });
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Line items</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Discount % is applied per line unless a fixed discount amount is set (amount wins). Tax
            rate is applied on the taxable base (gross − discount). Header VAT %, discount total,
            and grand total recompute on every save via database triggers.
          </p>
        </div>
        <Button size="sm" onClick={() => addItem.mutate()} disabled={addItem.isPending}>
          <Plus className="h-4 w-4 mr-1" /> Add line
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading items…
          </div>
        ) : (items ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No line items yet. Click <strong>Add line</strong> to start.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2 pr-2 min-w-[180px]">Description</th>
                  <th className="text-right py-2 px-2 w-20">Qty</th>
                  <th className="text-left py-2 px-2 w-20">Unit</th>
                  <th className="text-right py-2 px-2 w-28">Unit price</th>
                  <th className="text-right py-2 px-2 w-20">Disc %</th>
                  <th className="text-right py-2 px-2 w-28">Disc amt</th>
                  <th className="text-right py-2 px-2 w-20">Tax %</th>
                  <th className="text-right py-2 px-2 w-32">Line total</th>
                  <th className="py-2 pl-2 w-24" />
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map((row) => {
                  const m = merged(row);
                  const preview = previewLine(m);
                  return (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 pr-2">
                        <Input
                          value={m.description}
                          onChange={(e) => setField(row.id, "description", e.target.value)}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          className="text-right"
                          value={m.quantity}
                          onChange={(e) => setField(row.id, "quantity", Number(e.target.value))}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          value={m.unit}
                          onChange={(e) => setField(row.id, "unit", e.target.value)}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.0001"
                          className="text-right"
                          value={m.unit_price}
                          onChange={(e) => setField(row.id, "unit_price", Number(e.target.value))}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="text-right"
                          value={m.discount}
                          onChange={(e) => setField(row.id, "discount", Number(e.target.value))}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="text-right"
                          value={m.discount_amount}
                          onChange={(e) =>
                            setField(row.id, "discount_amount", Number(e.target.value))
                          }
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="text-right"
                          value={m.tax_rate}
                          onChange={(e) => setField(row.id, "tax_rate", Number(e.target.value))}
                        />
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        {formatMoney(preview, currency)}
                        {dirty(row) && (
                          <div className="text-[10px] text-amber-600">preview · unsaved</div>
                        )}
                      </td>
                      <td className="py-2 pl-2">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!dirty(row) || saveRow.isPending}
                            onClick={() => saveRow.mutate(row)}
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            disabled={deleteRow.isPending}
                            onClick={() => {
                              if (confirm("Delete this line?")) deleteRow.mutate(row.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
