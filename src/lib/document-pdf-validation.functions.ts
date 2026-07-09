import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Server-side pre-flight validation for PDF generation.
 *
 * PDF renderers must call `assertDocumentReadyForPdf` before generating a
 * file. It enforces:
 *   - a counterparty exists (customer / supplier / partner as appropriate)
 *   - an issue date is set
 *   - at least one line item with positive qty and non-negative price
 *   - a strictly positive grand total (financially consistent)
 *   - a currency
 *
 * Client-side validators can drift or be bypassed; this gate blocks the
 * PDF at the trust boundary.
 */

const Kind = z.enum([
  "quotation",           // public.quotations + quotation_items
  "proforma_invoice",    // public.proforma_invoices + proforma_invoice_items
  "invoice",             // public.invoices + invoice_items
  "finance_document",    // public.finance_documents + finance_document_items
]);

type Kind = z.infer<typeof Kind>;

class PdfValidationError extends Error {
  errors: string[];
  constructor(errors: string[]) {
    super(errors.join(" · "));
    this.name = "PdfValidationError";
    this.errors = errors;
  }
}

function num(v: unknown): number {
  const x = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(x) ? x : 0;
}

async function loadDoc(supabase: any, kind: Kind, id: string) {
  switch (kind) {
    case "quotation":
      return {
        header: await supabase
          .from("quotations")
          .select(
            "id, quotation_number, status, issue_date, currency, subtotal, total, customer_id, customers(id, name, company_name)",
          )
          .eq("id", id)
          .maybeSingle(),
        items: await supabase
          .from("quotation_items")
          .select("id, description, quantity, unit_price, line_total")
          .eq("quotation_id", id),
        counterparty: "customer" as const,
        totalField: "total",
      };
    case "proforma_invoice":
      return {
        header: await supabase
          .from("proforma_invoices")
          .select(
            "id, proforma_number, status, created_at, currency, subtotal, grand_total, customer_id, customers(id, name)",
          )
          .eq("id", id)
          .maybeSingle(),
        items: await supabase
          .from("proforma_invoice_items")
          .select("id, description, quantity, unit_price, line_total")
          .eq("proforma_invoice_id", id),
        counterparty: "customer" as const,
        totalField: "grand_total",
      };
    case "invoice":
      return {
        header: await supabase
          .from("invoices")
          .select(
            "id, invoice_number, status, issue_date, currency, total, customer_id, customers(id, name)",
          )
          .eq("id", id)
          .maybeSingle(),
        items: await supabase
          .from("invoice_items")
          .select("id, description, quantity, unit_price"),
        counterparty: "customer" as const,
        totalField: "total",
      };
    case "finance_document":
      return {
        header: await supabase
          .from("finance_documents")
          .select(
            "id, document_number, document_type, status, issue_date, currency, grand_total, customer_id, supplier_id, partner_id",
          )
          .eq("id", id)
          .maybeSingle(),
        items: await supabase
          .from("finance_document_items")
          .select("id, description, quantity, unit_price")
          .eq("document_id", id),
        counterparty: "auto" as const,
        totalField: "grand_total",
      };
  }
}

export const assertDocumentReadyForPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ kind: Kind, id: z.string().uuid() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const loaded = await loadDoc(context.supabase, data.kind, data.id);
    const headerRes = loaded.header as { data: any; error: any };
    if (headerRes.error) throw new Error(headerRes.error.message);
    const header = headerRes.data;
    if (!header) throw new Error("Document not found");

    // The invoice_items query is scoped inside for readability; run it now
    // when the invoices branch skipped its eq.
    let items: any[] = [];
    if (data.kind === "invoice") {
      const { data: rows, error } = await context.supabase
        .from("invoice_items")
        .select("id, description, quantity, unit_price")
        .eq("invoice_id", data.id);
      if (error) throw new Error(error.message);
      items = rows ?? [];
    } else {
      const itemsRes = loaded.items as { data: any[]; error: any };
      if (itemsRes.error) throw new Error(itemsRes.error.message);
      items = itemsRes.data ?? [];
    }

    const errors: string[] = [];

    // Counterparty presence
    if (loaded.counterparty === "customer") {
      if (!header.customer_id) errors.push("Customer is required");
    } else if (data.kind === "finance_document") {
      const t = header.document_type as string;
      if (t === "purchase_order") {
        if (!header.supplier_id) errors.push("Supplier is required");
      } else if (t === "commission_invoice") {
        if (!header.partner_id) errors.push("Partner is required");
      } else if (!header.customer_id) {
        errors.push("Customer is required");
      }
    }

    // Currency + issue date
    if (!header.currency) errors.push("Currency is required");
    const issueDate = header.issue_date ?? header.created_at ?? null;
    if (!issueDate) errors.push("Issue date is required");

    // Blocked statuses for PDF generation
    if (["cancelled", "void"].includes(header.status)) {
      errors.push(`Cannot generate PDF for a ${header.status} document`);
    }

    // Line items
    if (items.length === 0) {
      errors.push("At least one line item is required");
    } else {
      items.forEach((it, i) => {
        if (!it.description || String(it.description).trim() === "")
          errors.push(`Line ${i + 1}: description is required`);
        if (num(it.quantity) <= 0)
          errors.push(`Line ${i + 1}: quantity must be greater than zero`);
        if (num(it.unit_price) < 0)
          errors.push(`Line ${i + 1}: unit price cannot be negative`);
      });
    }

    // Non-zero total (financially consistent)
    const total = num(header[loaded.totalField as keyof typeof header]);
    if (total <= 0) {
      errors.push(
        "Document total must be greater than zero — recalculate before generating PDF",
      );
    }

    if (errors.length) throw new PdfValidationError(errors);

    return { ok: true as const, total, currency: header.currency };
  });
