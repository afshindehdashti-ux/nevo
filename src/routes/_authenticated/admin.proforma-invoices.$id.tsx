import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileDown, Loader2, Plus, Save, ShieldCheck, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatMoney } from "@/lib/crm-money";
import { generateProformaInvoicePdf } from "@/lib/proforma-invoice-pdf";

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
    meta: [
      { title: "Proforma Invoice — NEVO CRM" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProformaInvoiceDetail,
  errorComponent: ({ error, reset }) => (
    <div className="p-8">
      <p className="text-destructive mb-3">Failed to load proforma invoice: {error.message}</p>
      <Button onClick={reset} variant="outline">Retry</Button>
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
  customers: { id: string; name: string | null } | null;
};

function ProformaInvoiceDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();


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
           customers(id, name)`,
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
      const { data: { user } } = await supabase.auth.getUser();
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

  // Payment capture
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"add" | "set">("add");

  const recordPayment = useMutation({
    mutationFn: async () => {
      if (!pi) throw new Error("Not loaded");
      const amt = Number(paymentAmount);
      if (!Number.isFinite(amt) || amt < 0) throw new Error("Enter a valid amount");
      const nextPaid =
        paymentMode === "add" ? Number(pi.amount_paid ?? 0) + amt : amt;
      if (nextPaid < 0) throw new Error("Amount paid cannot be negative");
      if (nextPaid > Number(pi.grand_total ?? 0) + 0.009) {
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
            Customer: {pi.customers?.name ?? "—"} · Issued {formatDate(pi.created_at)}
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
            disabled={approve.isPending || !!pi.approved_by}
          >
            {approve.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-1" />
            )}
            {pi.approved_by ? "Approved" : "Approve"}
          </Button>
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
                <Row
                  label="Discount"
                  value={`− ${formatMoney(pi.discount_amount, pi.currency)}`}
                />
              )}
              <Row
                label={`VAT${pi.vat_rate ? ` (${Number(pi.vat_rate)}%)` : ""}`}
                value={formatMoney(pi.vat_amount, pi.currency)}
              />
              <div className="border-t pt-2">
                <Row
                  label="Grand total"
                  value={formatMoney(pi.grand_total, pi.currency)}
                  strong
                />
              </div>
              <Row
                label="Amount paid"
                value={formatMoney(pi.amount_paid, pi.currency)}
              />
              <Row
                label="Balance due"
                value={formatMoney(pi.balance_due, pi.currency)}
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
                  <p className="font-semibold">{formatMoney(pi.amount_paid, pi.currency)}</p>
                </div>
                <div className="rounded border p-2">
                  <p className="text-muted-foreground">Balance</p>
                  <p className="font-semibold">{formatMoney(pi.balance_due, pi.currency)}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="pay_mode" className="text-xs">Mode</Label>
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
                    setPaymentAmount(String(Number(pi.grand_total ?? 0)));
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
                {pi.approved_by
                  ? approverProfile?.full_name ?? "Approved"
                  : "— (pending)"}
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

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
