import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getQuotation } from "@/lib/quotations.functions";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/quotations/$id/print")({
  head: () => ({
    meta: [{ title: "Quotation PDF — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: QuotationPrint,
});

function QuotationPrint() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getQuotation);
  const { data, isLoading } = useQuery({
    queryKey: ["quotation", id, "print"],
    queryFn: () => getFn({ data: { id } }),
  });

  useEffect(() => {
    if (data) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [data]);

  if (isLoading || !data) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  const q = data.quotation as any;
  const customer = q.customers as any | null;

  return (
    <div className="bg-white text-gray-900">
      <style>{`
        @page { size: A4; margin: 18mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-white/95 backdrop-blur border-b px-6 py-3 flex justify-between items-center max-w-4xl mx-auto">
        <div className="text-sm text-gray-500">Preview — use your browser to save as PDF</div>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Print / Save as PDF
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-10">
        <header className="flex justify-between items-start pb-6 border-b border-gray-200">
          <div>
            <div className="text-2xl font-bold tracking-tight">NEVO Industrial</div>
            <div className="text-xs text-gray-500 mt-1">nevoindustrial.com</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-gray-500">Quotation</div>
            <div className="text-xl font-semibold">{q.quotation_number ?? "DRAFT"}</div>
            <div className="text-xs text-gray-500 mt-1">
              Issued: {q.issue_date}
              {q.valid_until ? ` · Valid until: ${q.valid_until}` : ""}
            </div>
            <div className="text-xs text-gray-500">Status: {q.status}</div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 mt-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Bill to</div>
            {customer ? (
              <div className="text-sm">
                <div className="font-medium">{customer.name}</div>
                {customer.email && <div>{customer.email}</div>}
                {customer.city && (
                  <div>
                    {customer.city}
                    {customer.country ? `, ${customer.country}` : ""}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No customer selected</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Total</div>
            <div className="text-2xl font-semibold">
              {q.currency} {Number(q.total).toLocaleString()}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left text-xs uppercase tracking-widest text-gray-500">
                <th className="py-2">Description</th>
                <th className="py-2 w-16 text-right">Qty</th>
                <th className="py-2 w-16">Unit</th>
                <th className="py-2 w-28 text-right">Unit price</th>
                <th className="py-2 w-20 text-right">Disc %</th>
                <th className="py-2 w-32 text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((it: any) => (
                <tr key={it.id} className="border-b border-gray-100 align-top">
                  <td className="py-2 pr-2">{it.description}</td>
                  <td className="py-2 text-right tabular-nums">{Number(it.quantity)}</td>
                  <td className="py-2">{it.unit ?? ""}</td>
                  <td className="py-2 text-right tabular-nums">
                    {q.currency} {Number(it.unit_price).toLocaleString()}
                  </td>
                  <td className="py-2 text-right tabular-nums">{Number(it.discount_pct)}%</td>
                  <td className="py-2 text-right tabular-nums">
                    {q.currency} {Number(it.line_total).toLocaleString()}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    No line items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="mt-6 flex justify-end">
          <div className="w-64 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Subtotal</span>
              <span className="tabular-nums">
                {q.currency} {Number(q.subtotal).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">VAT ({Number(q.vat_rate)}%)</span>
              <span className="tabular-nums">
                {q.currency} {Number(q.vat_amount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-300 mt-1 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">
                {q.currency} {Number(q.total).toLocaleString()}
              </span>
            </div>
          </div>
        </section>

        {(q.terms || q.notes) && (
          <section className="mt-8 grid grid-cols-2 gap-6 text-xs text-gray-600">
            {q.terms && (
              <div>
                <div className="uppercase tracking-widest text-gray-500 mb-1">
                  Terms &amp; conditions
                </div>
                <div className="whitespace-pre-wrap">{q.terms}</div>
              </div>
            )}
            {q.notes && (
              <div>
                <div className="uppercase tracking-widest text-gray-500 mb-1">Notes</div>
                <div className="whitespace-pre-wrap">{q.notes}</div>
              </div>
            )}
          </section>
        )}

        <footer className="mt-12 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
          NEVO Industrial · Thank you for your business.
        </footer>
      </div>
    </div>
  );
}
