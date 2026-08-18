import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MasterListShell } from "@/components/crm/MasterListShell";
import { GuideMeButton } from "@/components/ai/GuideMeButton";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, ArrowUp, ArrowUpDown, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { generateProformaInvoicePdf } from "@/lib/proforma-invoice-pdf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatMoney } from "@/lib/crm-money";
import { financeTotalAmount, financeBalanceDue } from "@/lib/finance-normalization";
import { customerDisplayName, type CustomerDisplay } from "@/lib/finance-normalization";

export const Route = createFileRoute("/_authenticated/admin/proforma-invoices")({
  head: () => ({
    meta: [{ title: "Proforma Invoices — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: ProformaInvoicesList,
});

type PaymentStatus = "Unpaid" | "Partially Paid" | "Paid" | "Overdue";

const PAYMENT_STATUSES: PaymentStatus[] = ["Unpaid", "Partially Paid", "Paid", "Overdue"];

function paymentStatusVariant(s: string | null | undefined) {
  switch (s) {
    case "Paid":
      return "default" as const;
    case "Partially Paid":
      return "secondary" as const;
    case "Overdue":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

type SortKey = "created_at" | "balance_due" | "grand_total";
type SortDir = "asc" | "desc";

function ProformaInvoicesList() {
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["proforma_invoices", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proforma_invoices")
        .select(
          `id, proforma_number, status, currency, created_at, valid_until,
           grand_total, vat_amount, balance_due, payment_status, approved_by,
           customers(name, company_name, email)`,
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "created_at" ? "desc" : "desc");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (paymentFilter !== "all" && r.payment_status !== paymentFilter) return false;
      if (!q) return true;
      const cName = customerDisplayName(r.customers as CustomerDisplay | null);
      return (
        (r.proforma_number || "").toLowerCase().includes(q) ||
        cName.toLowerCase().includes(q)
      );
    });
    const sign = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortKey === "created_at") {
        return (
          sign *
          (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        );
      }
      const av = Number(a[sortKey]) || 0;
      const bv = Number(b[sortKey]) || 0;
      return sign * (av - bv);
    });
  }, [rows, search, paymentFilter, sortKey, sortDir]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, Unpaid: 0, "Partially Paid": 0, Paid: 0, Overdue: 0 };
    for (const r of rows) {
      const s = r.payment_status || "Unpaid";
      c[s] = (c[s] || 0) + 1;
    }
    return c;
  }, [rows]);

  const filteredIds = useMemo(() => filtered.map((r) => r.id), [filtered]);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const someSelected = filteredIds.some((id) => selected.has(id));

  const toggleAll = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) filteredIds.forEach((id) => next.add(id));
      else filteredIds.forEach((id) => next.delete(id));
      return next;
    });
  const toggleOne = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const handleBulkExport = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setExporting(true);
    const t = toast.loading(`Generating ${ids.length} PDF${ids.length > 1 ? "s" : ""}…`);
    try {
      if (ids.length === 1) {
        await generateProformaInvoicePdf(ids[0], "download");
        toast.success("PDF downloaded", { id: t });
      } else {
        const zip = new JSZip();
        let ok = 0;
        for (const id of ids) {
          try {
            const res = await generateProformaInvoicePdf(id, "blob");
            zip.file(res.filename, res.blob);
            URL.revokeObjectURL(res.url);
            ok++;
          } catch (e) {
            console.error("PDF failed", id, e);
          }
        }
        if (ok === 0) throw new Error("All PDFs failed to generate");
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const stamp = new Date().toISOString().slice(0, 10);
        a.download = `Proforma-Invoices-${stamp}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${ok} of ${ids.length} PDFs`, { id: t });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Export failed";
      toast.error(msg, { id: t });
    } finally {
      setExporting(false);
    }
  };

  return (
    <MasterListShell
      title="Proforma Invoices"
      description="Proforma invoices sent before shipment."
      count={rows.length}
      search={search}
      onSearchChange={setSearch}
      canCreate={false}
      onCreate={() => {}}
      headerExtra={<GuideMeButton sectionId="proforma-invoice" />}
    >
      <div className="p-3 border-b flex gap-2 items-center flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {(["all", "Unpaid", "Partially Paid", "Paid", "Overdue"] as const).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={paymentFilter === k ? "default" : "outline"}
              className="h-7 px-2 text-xs"
              onClick={() => setPaymentFilter(k as PaymentStatus | "all")}
            >
              {k === "all" ? "All" : k}
              <span className="ml-1.5 text-[10px] opacity-70">{counts[k] ?? 0}</span>
            </Button>
          ))}
        </div>
        <div className="h-5 w-px bg-border mx-1" />
        <Label className="text-xs text-muted-foreground">Payment</Label>
        <Select
          value={paymentFilter}
          onValueChange={(v) => setPaymentFilter(v as PaymentStatus | "all")}
        >
          <SelectTrigger className="w-44 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payment statuses</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 && (
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkExport}
            disabled={selected.size === 0 || exporting}
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <FileDown className="h-3.5 w-3.5 mr-1" />
            )}
            Export PDF{selected.size > 1 ? "s" : ""}
          </Button>
          <p className="text-xs text-muted-foreground">
            Create from a{" "}
            <Link to="/admin/quotations" className="text-accent hover:underline">
              quotation
            </Link>
            .
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(v) => toggleAll(v === true)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Proforma #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>
                <SortButton label="Issued" active={sortKey === "created_at"} dir={sortDir} onClick={() => toggleSort("created_at")} />
              </TableHead>
              <TableHead>Valid until</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">VAT</TableHead>
              <TableHead className="text-right">
                <SortButton label="Grand total" active={sortKey === "grand_total"} dir={sortDir} onClick={() => toggleSort("grand_total")} align="right" />
              </TableHead>
              <TableHead className="text-right">
                <SortButton label="Balance" active={sortKey === "balance_due"} dir={sortDir} onClick={() => toggleSort("balance_due")} align="right" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                  {rows.length === 0 ? "No proforma invoices yet." : "No matches."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <TableRow key={r.id} data-state={selected.has(r.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(r.id)}
                    onCheckedChange={(v) => toggleOne(r.id, v === true)}
                    aria-label={`Select ${r.proforma_number ?? r.id}`}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    to="/admin/proforma-invoices/$id"
                    params={{ id: r.id }}
                    className="text-accent hover:underline font-medium"
                  >
                    {r.proforma_number ?? "—"}
                  </Link>
                </TableCell>
                <TableCell>
                  {customerDisplayName(r.customers as CustomerDisplay | null)}
                </TableCell>
                <TableCell>{formatDate(r.created_at)}</TableCell>
                <TableCell>{r.valid_until ? formatDate(r.valid_until) : "—"}</TableCell>
                <TableCell>
                  {r.approved_by ? (
                    <Badge variant="secondary">Approved</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={paymentStatusVariant(r.payment_status)}>
                    {r.payment_status ?? "Unpaid"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatMoney(Number(r.vat_amount) || 0, r.currency)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatMoney(financeTotalAmount(r), r.currency)}
                </TableCell>
                <TableCell className="text-right">
                  {formatMoney(financeBalanceDue(r), r.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </MasterListShell>
  );
}

function SortButton({
  label,
  active,
  dir,
  onClick,
  align,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  align?: "right";
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 hover:text-foreground ${
        active ? "text-foreground" : "text-muted-foreground"
      } ${align === "right" ? "justify-end w-full" : ""}`}
    >
      {label}
      <Icon className="h-3 w-3" />
    </button>
  );
}
