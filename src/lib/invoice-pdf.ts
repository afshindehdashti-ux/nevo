import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, formatDate } from "./crm-money";
import {
  customerDisplayName,
  customerBillingAddress,
  customerVatNumber,
  type CustomerDisplay,
} from "./finance-normalization";

/**
 * Branded Proforma / Commercial Invoice PDF generator.
 *
 * - Pulls the active company_settings row for legal header + bank block.
 * - Recomputes VAT/discount math from invoice_items so the PDF totals
 *   always match line-level truth even if the header aggregates drift.
 * - Downloads directly from the browser via jsPDF.save().
 */

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  type: "proforma" | "commercial" | string;
  status: string;
  currency: string;
  issue_date: string;
  due_date: string | null;
  notes: string | null;
  amount_paid: number | string;
  customers: (CustomerDisplay & Record<string, unknown>) | null;
};

type ItemRow = {
  id: string;
  description: string;
  quantity: number | string;
  unit: string | null;
  unit_price: number | string;
  discount_pct: number | string;
  vat_pct: number | string;
  position: number | null;
};

type CompanyRow = {
  legal_name: string | null;
  trade_license: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  logo_url: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_iban: string | null;
  bank_swift: string | null;
  bank_branch: string | null;
  default_terms: string | null;
};

export type InvoiceTotals = {
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paid: number;
  balance: number;
};

/** Recompute totals from invoice_items — the PDF's source of truth. */
export function computeInvoiceTotals(
  items: Pick<
    ItemRow,
    "quantity" | "unit_price" | "discount_pct" | "vat_pct"
  >[],
  amountPaid = 0,
): InvoiceTotals {
  let gross = 0;
  let discount = 0;
  let subtotal = 0;
  let vat = 0;
  for (const it of items) {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unit_price) || 0;
    const discPct = Number(it.discount_pct) || 0;
    const vatPct = Number(it.vat_pct) || 0;
    const lineGross = qty * price;
    const lineDisc = lineGross * (discPct / 100);
    const lineNet = lineGross - lineDisc;
    const lineVat = lineNet * (vatPct / 100);
    gross += lineGross;
    discount += lineDisc;
    subtotal += lineNet;
    vat += lineVat;
  }
  const total = subtotal + vat;
  const paid = Number(amountPaid) || 0;
  return {
    subtotal,
    discount,
    vat,
    total,
    paid,
    balance: Math.max(total - paid, 0),
  };
}

async function loadCompany(): Promise<CompanyRow | null> {
  const { data } = await supabase
    .from("company_settings")
    .select(
      "legal_name,trade_license,address,city,country,email,phone,whatsapp,website,logo_url,bank_name,bank_account_name,bank_account_number,bank_iban,bank_swift,bank_branch,default_terms",
    )
    .eq("is_active", true)
    .maybeSingle();
  return (data as CompanyRow | null) ?? null;
}

async function loadLogoDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function fetchInvoiceForPdf(invoiceId: string) {
  const [invoiceRes, itemsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        "id, invoice_number, type, status, currency, issue_date, due_date, notes, amount_paid, customers(name, company_name, address, billing_address, city, country, vat_number, email, phone)",
      )
      .eq("id", invoiceId)
      .maybeSingle(),
    supabase
      .from("invoice_items")
      .select("id, description, quantity, unit, unit_price, discount_pct, vat_pct, position")
      .eq("invoice_id", invoiceId)
      .order("position", { ascending: true }),
  ]);
  if (invoiceRes.error) throw invoiceRes.error;
  if (itemsRes.error) throw itemsRes.error;
  const invoice = invoiceRes.data as InvoiceRow | null;
  if (!invoice) throw new Error("Invoice not found");
  const items = (itemsRes.data ?? []) as ItemRow[];
  return { invoice, items };
}

export type InvoicePdfResult = {
  blob: Blob;
  url: string;
  filename: string;
};

/**
 * Build a branded invoice / proforma PDF.
 * mode="download" triggers save() and returns the blob/url too.
 * mode="blob" returns the blob + object URL for preview (caller must revokeObjectURL).
 */
export async function generateInvoicePdf(
  invoiceId: string,
  mode: "download" | "blob" = "download",
): Promise<InvoicePdfResult> {
  // Server-side gate: refuses to render for incomplete or zero-total docs.
  const { assertDocumentReadyForPdf } = await import(
    "./document-pdf-validation.functions"
  );
  await assertDocumentReadyForPdf({ data: { kind: "invoice", id: invoiceId } });

  const [{ invoice, items }, company] = await Promise.all([
    fetchInvoiceForPdf(invoiceId),
    loadCompany(),
  ]);
  const totals = computeInvoiceTotals(items, Number(invoice.amount_paid) || 0);
  const isProforma = invoice.type === "proforma";
  const docTitle = isProforma ? "PROFORMA INVOICE" : "TAX INVOICE";

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;

  const logoDataUrl = await loadLogoDataUrl(company?.logo_url ?? null);

  // ---------- Header: brand + document meta ----------
  let cursorY = margin;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", margin, cursorY, 90, 42, undefined, "FAST");
    } catch {
      /* ignore malformed image */
    }
  }
  const brandName = company?.legal_name || "NEVO Industrial";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(brandName, margin + (logoDataUrl ? 100 : 0), cursorY + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90);
  const brandLines = [
    company?.address,
    [company?.city, company?.country].filter(Boolean).join(", "),
    company?.trade_license ? `Trade License: ${company.trade_license}` : null,
    [company?.phone, company?.email].filter(Boolean).join("  ·  "),
    company?.website,
  ].filter(Boolean) as string[];
  brandLines.forEach((line, i) => {
    doc.text(line, margin + (logoDataUrl ? 100 : 0), cursorY + 30 + i * 10);
  });

  // Right-aligned document title + meta
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(docTitle, pageW - margin, cursorY + 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  const meta = [
    `Number: ${invoice.invoice_number || "DRAFT"}`,
    `Issue date: ${formatDate(invoice.issue_date)}`,
    invoice.due_date ? `Due date: ${formatDate(invoice.due_date)}` : null,
    `Status: ${invoice.status}`,
    `Currency: ${invoice.currency}`,
  ].filter(Boolean) as string[];
  meta.forEach((line, i) => {
    doc.text(line, pageW - margin, cursorY + 36 + i * 12, { align: "right" });
  });

  cursorY = Math.max(cursorY + 30 + brandLines.length * 10, cursorY + 36 + meta.length * 12) + 12;
  doc.setDrawColor(220);
  doc.line(margin, cursorY, pageW - margin, cursorY);
  cursorY += 14;

  // ---------- Bill To block ----------
  const cust = invoice.customers;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("BILL TO", margin, cursorY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20);
  const custLines = [
    customerDisplayName(cust),
    customerBillingAddress(cust),
    [cust?.city, cust?.country].filter(Boolean).join(", ") || null,
    customerVatNumber(cust) ? `VAT: ${customerVatNumber(cust)}` : null,
    cust?.email || null,
    cust?.phone || null,
  ].filter(Boolean) as string[];
  custLines.forEach((line, i) => doc.text(line, margin, cursorY + 14 + i * 12));

  cursorY += 14 + custLines.length * 12 + 10;

  // ---------- Line items table ----------
  const body = items.map((it, idx) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unit_price) || 0;
    const discPct = Number(it.discount_pct) || 0;
    const vatPct = Number(it.vat_pct) || 0;
    const net = qty * price * (1 - discPct / 100);
    const gross = net * (1 + vatPct / 100);
    return [
      String(idx + 1),
      it.description || "",
      `${qty} ${it.unit || ""}`.trim(),
      formatMoney(price, invoice.currency),
      `${discPct}%`,
      `${vatPct}%`,
      formatMoney(gross, invoice.currency),
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    head: [["#", "Description", "Qty", "Unit price", "Disc", "VAT", "Line total"]],
    body: body.length
      ? body
      : [["—", "No line items", "", "", "", "", ""]],
    styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, halign: "left" },
    columnStyles: {
      0: { cellWidth: 22, halign: "right" },
      2: { halign: "right", cellWidth: 55 },
      3: { halign: "right", cellWidth: 80 },
      4: { halign: "right", cellWidth: 45 },
      5: { halign: "right", cellWidth: 45 },
      6: { halign: "right", cellWidth: 85 },
    },
    margin: { left: margin, right: margin },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterTableY = (doc as any).lastAutoTable.finalY + 12;

  // ---------- Totals block (right) ----------
  const totalsX = pageW - margin - 220;
  const totalsW = 220;
  let ty = afterTableY;
  const rows: Array<[string, string, boolean?]> = [
    ["Subtotal (gross)", formatMoney(totals.subtotal + totals.discount, invoice.currency)],
    ["Discount", `− ${formatMoney(totals.discount, invoice.currency)}`],
    ["Net subtotal", formatMoney(totals.subtotal, invoice.currency)],
    ["VAT", formatMoney(totals.vat, invoice.currency)],
    ["Total", formatMoney(totals.total, invoice.currency), true],
  ];
  if (!isProforma) {
    rows.push(["Amount paid", formatMoney(totals.paid, invoice.currency)]);
    rows.push(["Balance due", formatMoney(totals.balance, invoice.currency), true]);
  }
  doc.setFontSize(10);
  rows.forEach(([label, val, strong]) => {
    doc.setFont("helvetica", strong ? "bold" : "normal");
    doc.setTextColor(strong ? 15 : 60, strong ? 23 : 60, strong ? 42 : 60);
    doc.text(label, totalsX, ty);
    doc.text(val, totalsX + totalsW, ty, { align: "right" });
    ty += 14;
  });
  doc.setDrawColor(220);
  doc.line(totalsX, afterTableY - 4, totalsX + totalsW, afterTableY - 4);

  // ---------- Bank details / notes / terms ----------
  let footerY = Math.max(ty, afterTableY) + 20;
  if (footerY > pageH - 140) {
    doc.addPage();
    footerY = margin;
  }

  const bankLines = [
    company?.bank_name ? `Bank: ${company.bank_name}` : null,
    company?.bank_account_name ? `Account name: ${company.bank_account_name}` : null,
    company?.bank_account_number ? `Account #: ${company.bank_account_number}` : null,
    company?.bank_iban ? `IBAN: ${company.bank_iban}` : null,
    company?.bank_swift ? `SWIFT/BIC: ${company.bank_swift}` : null,
    company?.bank_branch ? `Branch: ${company.bank_branch}` : null,
  ].filter(Boolean) as string[];

  if (bankLines.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("PAYMENT DETAILS", margin, footerY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30);
    bankLines.forEach((l, i) => doc.text(l, margin, footerY + 14 + i * 12));
    footerY += 14 + bankLines.length * 12 + 12;
  }

  const noteBlocks: Array<[string, string]> = [];
  if (invoice.notes) noteBlocks.push(["NOTES", invoice.notes]);
  if (company?.default_terms) noteBlocks.push(["TERMS & CONDITIONS", company.default_terms]);

  for (const [heading, text] of noteBlocks) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(heading, margin, footerY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40);
    const wrapped = doc.splitTextToSize(text, pageW - margin * 2);
    doc.text(wrapped, margin, footerY + 12);
    footerY += 12 + wrapped.length * 11 + 10;
    if (footerY > pageH - 60) {
      doc.addPage();
      footerY = margin;
    }
  }

  // ---------- Page footer on every page ----------
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    const stamp = isProforma
      ? "Proforma invoice — not a tax invoice. No VAT reclaim allowed."
      : "Tax invoice";
    doc.text(stamp, margin, pageH - 20);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 20, {
      align: "right",
    });
  }

  const filenameBase = isProforma ? "Proforma" : "Invoice";
  const num = (invoice.invoice_number || invoice.id.slice(0, 8)).replace(
    /[^A-Za-z0-9._-]/g,
    "_",
  );
  const filename = `${filenameBase}-${num}.pdf`;
  const blob = doc.output("blob");
  if (mode === "download") doc.save(filename);
  return { blob, url: URL.createObjectURL(blob), filename };
}
