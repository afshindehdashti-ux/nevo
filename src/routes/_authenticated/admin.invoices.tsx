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
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatMoney } from "@/lib/crm-money";
import {
  INVOICE_STATUSES,
  invoiceStatusLabel,
  invoiceStatusVariant,
  type InvoiceStatus,
} from "@/lib/crm-status";

export const Route = createFileRoute("/_authenticated/admin/invoices")({
  head: () => ({ meta: [{ title: "Invoices — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: () => <InvoicesList type="commercial" title="Invoices" />,
});


export function InvoicesList({
  type,
  title,
}: {
  type: "commercial" | "proforma";
  title: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers(name)")
        .eq("type", type)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (!q) return true;
      const cName = (i.customers as { name?: string } | null)?.name || "";
      return (
        (i.invoice_number || "").toLowerCase().includes(q) ||
        cName.toLowerCase().includes(q)
      );
    });
  }, [invoices, search, statusFilter]);

  const filteredIds = useMemo(() => filtered.map((i) => i.id), [filtered]);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const someSelected = filteredIds.some((id) => selected.has(id));

  const toggleAll = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) filteredIds.forEach((id) => next.add(id));
      else filteredIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const label = type === "proforma" ? "Proforma" : "Commercial";

  const handleBulkExport = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setExporting(true);
    const t = toast.loading(`Generating ${ids.length} PDF${ids.length > 1 ? "s" : ""}…`);
    try {
      if (ids.length === 1) {
        await generateInvoicePdf(ids[0], "download");
        toast.success("PDF downloaded", { id: t });
      } else {
        const zip = new JSZip();
        let ok = 0;
        for (const id of ids) {
          try {
            const res = await generateInvoicePdf(id, "blob");
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
        a.download = `${label}-Invoices-${stamp}.zip`;
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
      title={title}
      description={
        type === "proforma"
          ? "Proforma invoices sent before shipment."
          : "Commercial invoices with payment tracking."
      }
      count={invoices.length}
      search={search}
      onSearchChange={setSearch}
      canCreate={false}
      onCreate={() => {}}
      headerExtra={
        <GuideMeButton
          sectionId={type === "proforma" ? "proforma-invoice" : "commercial-invoice"}
        />
      }
    >
      <div className="p-3 border-b flex gap-2 items-center">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InvoiceStatus | "all")}>
          <SelectTrigger className="w-52 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {INVOICE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {invoiceStatusLabel(s)}
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
            {exporting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <FileDown className="h-3.5 w-3.5 mr-1" />}
            Export PDF{selected.size > 1 ? "s" : ""}
          </Button>
          <p className="text-xs text-muted-foreground">
            Create from an <Link to="/admin/orders" className="text-primary hover:underline">order</Link>.
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
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  {invoices.length === 0
                    ? `No ${type === "proforma" ? "proforma " : ""}invoices yet.`
                    : "No matches."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((i) => (
              <TableRow key={i.id} data-state={selected.has(i.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(i.id)}
                    onCheckedChange={(v) => toggleOne(i.id, v === true)}
                    aria-label={`Select ${i.invoice_number ?? i.id}`}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    to="/admin/invoices/$id"
                    params={{ id: i.id }}
                    className="text-primary hover:underline font-medium"
                  >
                    {i.invoice_number}
                  </Link>
                </TableCell>
                <TableCell>{(i.customers as { name?: string } | null)?.name || "—"}</TableCell>
                <TableCell>{formatDate(i.issue_date)}</TableCell>
                <TableCell>{formatDate(i.due_date)}</TableCell>
                <TableCell>
                  <Badge variant={invoiceStatusVariant(i.status)}>
                    {invoiceStatusLabel(i.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatMoney(i.total, i.currency)}</TableCell>
                <TableCell className="text-right">{formatMoney(i.balance, i.currency)}</TableCell>
              </TableRow>
            ))}

          </TableBody>
        </Table>
      </div>
    </MasterListShell>
  );
}
