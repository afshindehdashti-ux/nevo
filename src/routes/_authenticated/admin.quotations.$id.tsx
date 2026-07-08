import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  getQuotation,
  upsertQuotation,
  upsertQuotationItem,
  deleteQuotationItem,
  duplicateQuotationItem,
  setQuotationStatus,
  deleteQuotation,
  convertQuotationToProforma,
  listInquiriesLite,
} from "@/lib/quotations.functions";
import { listProjectsLite } from "@/lib/doc-intel.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { CommunicationTimeline } from "@/components/crm/CommunicationTimeline";
import { ApprovalPanel } from "@/components/crm/ApprovalPanel";
import { Trash2, Plus, Send, Check, X, FileDown, ArrowRightCircle, Mail, Copy, Lock } from "lucide-react";
import { toast } from "sonner";
import { QuotationEmailDialog } from "@/components/crm/QuotationEmailDialog";
import { buildQuotationPdf, downloadQuotationPdf, loadSellerSettings, validateQuotationForPdf } from "@/lib/quotation-pdf";

export const Route = createFileRoute("/_authenticated/admin/quotations/$id")({
  head: () => ({ meta: [{ title: "Quotation — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: QuotationEditor,
});

function QuotationEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getQuotation);
  const upsertFn = useServerFn(upsertQuotation);
  const upsertItemFn = useServerFn(upsertQuotationItem);
  const deleteItemFn = useServerFn(deleteQuotationItem);
  const statusFn = useServerFn(setQuotationStatus);
  const deleteFn = useServerFn(deleteQuotation);
  const convertFn = useServerFn(convertQuotationToProforma);
  const inquiriesFn = useServerFn(listInquiriesLite);
  const projectsFn = useServerFn(listProjectsLite);

  const { data, isLoading } = useQuery({
    queryKey: ["quotation", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    supabase.from("customers").select("id,name").order("name").then(({ data }) => {
      setCustomers(data ?? []);
    });
  }, []);

  const { data: inquiries = [] } = useQuery({
    queryKey: ["quotations", "inquiries-lite"],
    queryFn: () => inquiriesFn(),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["quotations", "projects-lite"],
    queryFn: () => projectsFn(),
  });

  const [form, setForm] = useState({
    customer_id: "",
    inquiry_id: "",
    project_id: "",
    issue_date: "",
    valid_until: "",
    currency: "USD",
    vat_rate: 0,
    terms: "",
    notes: "",
    internal_notes: "",
  });

  useEffect(() => {
    if (data?.quotation) {
      setForm({
        customer_id: data.quotation.customer_id ?? "",
        inquiry_id: data.quotation.inquiry_id ?? "",
        project_id: data.quotation.project_id ?? "",
        issue_date: data.quotation.issue_date ?? "",
        valid_until: data.quotation.valid_until ?? "",
        currency: data.quotation.currency ?? "USD",
        vat_rate: Number(data.quotation.vat_rate ?? 0),
        terms: data.quotation.terms ?? "",
        notes: data.quotation.notes ?? "",
        internal_notes: data.quotation.internal_notes ?? "",
      });
    }
  }, [data?.quotation]);

  const save = useMutation({
    mutationFn: () =>
      upsertFn({
        data: {
          id,
          customer_id: form.customer_id || null,
          inquiry_id: form.inquiry_id || null,
          project_id: form.project_id || null,
          issue_date: form.issue_date || undefined,
          valid_until: form.valid_until || null,
          currency: form.currency,
          vat_rate: Number(form.vat_rate),
          terms: form.terms || null,
          notes: form.notes || null,
          internal_notes: form.internal_notes || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotation", id] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addItem = useMutation({
    mutationFn: () =>
      upsertItemFn({
        data: {
          quotation_id: id,
          description: "New line",
          quantity: 1,
          unit_price: 0,
          discount_pct: 0,
          position: (data?.items?.length ?? 0) + 1,
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotation", id] }),
  });

  const updateItem = useMutation({
    mutationFn: (payload: {
      id: string;
      description: string;
      quantity: number;
      unit_price: number;
      discount_pct: number;
      position: number;
    }) =>
      upsertItemFn({
        data: {
          ...payload,
          quotation_id: id,
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotation", id] }),
  });

  const delItem = useMutation({
    mutationFn: (itemId: string) => deleteItemFn({ data: { id: itemId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotation", id] }),
  });

  const changeStatus = useMutation({
    mutationFn: (status:
      | "draft"
      | "pending_approval"
      | "approved"
      | "sent"
      | "accepted"
      | "rejected"
      | "expired"
      | "converted"
      | "void") => statusFn({ data: { id, status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotation", id] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
    },
  });

  const del = useMutation({
    mutationFn: () => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation deleted");
      navigate({ to: "/admin/quotations" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const convert = useMutation({
    mutationFn: () => convertFn({ data: { id } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["quotation", id] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
      toast.success(r.already ? "Already converted — opening proforma" : "Proforma invoice created");
      if (r.invoice_id) navigate({ to: "/admin/invoices/$id", params: { id: r.invoice_id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [emailOpen, setEmailOpen] = useState(false);

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!data) return <div className="p-6">Not found.</div>;

  const q = data.quotation;
  const canSend = q.status === "approved" || q.status === "draft";

  const handleDownloadPdf = async () => {
    const errs = validateQuotationForPdf(q as any, data.items as any);
    if (errs.length) {
      toast.error(errs.join(" · "));
      return;
    }
    const seller = await loadSellerSettings();
    downloadQuotationPdf(q as any, data.items as any, seller);
  };

  const handlePreviewPdf = async () => {
    const errs = validateQuotationForPdf(q as any, data.items as any);
    if (errs.length) {
      toast.error(errs.join(" · "));
      return;
    }
    const seller = await loadSellerSettings();
    const { blob } = buildQuotationPdf(q as any, data.items as any, seller);
    window.open(URL.createObjectURL(blob), "_blank");
  };

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate({ to: "/admin/quotations" })}
          >
            ← All quotations
          </button>
          <h1 className="text-2xl font-semibold mt-1">
            {q.quotation_number ?? "New quotation"}
          </h1>
          <div className="text-sm text-muted-foreground">
            <Badge variant="outline" className="mr-2">
              {q.status}
            </Badge>
            Total: {q.currency} {Number(q.total).toLocaleString()}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
          {q.status === "draft" && (
            <Button
              variant="secondary"
              onClick={() => changeStatus.mutate("pending_approval")}
            >
              Request approval
            </Button>
          )}
          {q.status === "pending_approval" && (
            <Button onClick={() => changeStatus.mutate("approved")}>
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
          )}
          {canSend && (
            <Button onClick={() => changeStatus.mutate("sent")}>
              <Send className="h-4 w-4 mr-1" />
              Mark sent
            </Button>
          )}
          {q.status === "sent" && (
            <>
              <Button onClick={() => changeStatus.mutate("accepted")}>
                <Check className="h-4 w-4 mr-1" />
                Accepted
              </Button>
              <Button variant="destructive" onClick={() => changeStatus.mutate("rejected")}>
                <X className="h-4 w-4 mr-1" />
                Rejected
              </Button>
            </>
          )}
          {(q.status === "accepted" || q.status === "approved") && !q.converted_invoice_id && (
            <Button variant="secondary" onClick={() => convert.mutate()} disabled={convert.isPending}>
              <ArrowRightCircle className="h-4 w-4 mr-1" />
              {convert.isPending ? "Converting…" : "Convert to proforma"}
            </Button>
          )}
          {q.converted_invoice_id && (
            <Button
              variant="secondary"
              onClick={() =>
                navigate({ to: "/admin/invoices/$id", params: { id: q.converted_invoice_id! } })
              }
            >
              <ArrowRightCircle className="h-4 w-4 mr-1" />
              Open proforma
            </Button>
          )}
          <Button variant="outline" onClick={handlePreviewPdf}>
            <FileDown className="h-4 w-4 mr-1" />
            Preview PDF
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf}>
            <FileDown className="h-4 w-4 mr-1" />
            Download PDF
          </Button>
          <Button variant="secondary" onClick={() => setEmailOpen(true)}>
            <Mail className="h-4 w-4 mr-1" />
            Email PDF
          </Button>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("Delete this quotation? This cannot be undone.")) del.mutate();
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 md:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold">Header</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Customer</Label>
              <Select
                value={form.customer_id}
                onValueChange={(v) => setForm((f) => ({ ...f, customer_id: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Input
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
              />
            </div>
            <div>
              <Label>Issue date</Label>
              <Input
                type="date"
                value={form.issue_date}
                onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Valid until</Label>
              <Input
                type="date"
                value={form.valid_until}
                onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
              />
            </div>
            <div>
              <Label>VAT %</Label>
              <Input
                type="number"
                value={form.vat_rate}
                onChange={(e) => setForm((f) => ({ ...f, vat_rate: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Lead / inquiry</Label>
              <Select
                value={form.inquiry_id || "__none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, inquiry_id: v === "__none" ? "" : v }))
                }
              >
                <SelectTrigger><SelectValue placeholder="No lead" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— None —</SelectItem>
                  {inquiries.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}{i.company ? ` · ${i.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Project</Label>
              <Select
                value={form.project_id || "__none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, project_id: v === "__none" ? "" : v }))
                }
              >
                <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— None —</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Terms &amp; conditions</Label>
            <Textarea
              rows={3}
              value={form.terms}
              onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
            />
          </div>
          <div>
            <Label>Notes for customer</Label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div>
            <Label>Internal notes</Label>
            <Textarea
              rows={2}
              value={form.internal_notes}
              onChange={(e) => setForm((f) => ({ ...f, internal_notes: e.target.value }))}
            />
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-semibold">Totals</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{q.currency} {Number(q.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT ({Number(q.vat_rate)}%)</span>
              <span>{q.currency} {Number(q.vat_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-foreground font-semibold text-sm border-t border-border pt-2 mt-2">
              <span>Total</span>
              <span>{q.currency} {Number(q.total).toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Line items</h3>
          <Button size="sm" onClick={() => addItem.mutate()}>
            <Plus className="h-4 w-4 mr-1" />
            Add line
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="w-24">Qty</TableHead>
              <TableHead className="w-20">Unit</TableHead>
              <TableHead className="w-32">Unit price</TableHead>
              <TableHead className="w-24">Discount %</TableHead>
              <TableHead className="w-32 text-right">Total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>
                  <Input
                    defaultValue={it.description}
                    onBlur={(e) =>
                      updateItem.mutate({
                        id: it.id,
                        description: e.target.value,
                        quantity: Number(it.quantity),
                        unit_price: Number(it.unit_price),
                        discount_pct: Number(it.discount_pct),
                        position: it.position,
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    defaultValue={Number(it.quantity)}
                    onBlur={(e) =>
                      updateItem.mutate({
                        id: it.id,
                        description: it.description,
                        quantity: Number(e.target.value),
                        unit_price: Number(it.unit_price),
                        discount_pct: Number(it.discount_pct),
                        position: it.position,
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    defaultValue={it.unit ?? ""}
                    onBlur={(e) =>
                      updateItem.mutate({
                        id: it.id,
                        description: it.description,
                        quantity: Number(it.quantity),
                        unit_price: Number(it.unit_price),
                        discount_pct: Number(it.discount_pct),
                        position: it.position,
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    defaultValue={Number(it.unit_price)}
                    onBlur={(e) =>
                      updateItem.mutate({
                        id: it.id,
                        description: it.description,
                        quantity: Number(it.quantity),
                        unit_price: Number(e.target.value),
                        discount_pct: Number(it.discount_pct),
                        position: it.position,
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    defaultValue={Number(it.discount_pct)}
                    onBlur={(e) =>
                      updateItem.mutate({
                        id: it.id,
                        description: it.description,
                        quantity: Number(it.quantity),
                        unit_price: Number(it.unit_price),
                        discount_pct: Number(e.target.value),
                        position: it.position,
                      })
                    }
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {q.currency} {Number(it.line_total).toLocaleString()}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => delItem.mutate(it.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {data.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6 text-sm">
                  No line items yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {(() => {
        const maxDisc = data.items.reduce(
          (m, it) => Math.max(m, Number(it.discount_pct) || 0),
          0,
        );
        return (
          <ApprovalPanel
            entityType="quotation_discount"
            entityId={id}
            suggestedReason={`Quotation ${q.quotation_number ?? "(draft)"} — max line discount ${maxDisc}% · total ${q.currency} ${Number(q.total).toLocaleString()}`}
            details={{
              quotation_number: q.quotation_number,
              max_discount_pct: maxDisc,
              total: Number(q.total),
              currency: q.currency,
            }}
          />
        );
      })()}

      <CommunicationTimeline entityType="quotation" entityId={id} />

      <QuotationEmailDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        quotation={q}
        items={data.items}
        onSent={() => {
          qc.invalidateQueries({ queryKey: ["quotation", id] });
          qc.invalidateQueries({ queryKey: ["quotations"] });
        }}
      />
    </div>
  );
}
