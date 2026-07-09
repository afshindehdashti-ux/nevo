import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, formatDate } from "./crm-money";
import {
  customerDisplayName,
  customerBillingAddress,
  customerVatNumber,
  financePaidAmount,
  financeTotalAmount,
  financeBalanceDue,
  type CustomerDisplay,
} from "./finance-normalization";

/**
 * Branded Proforma Invoice PDF generator (proforma_invoices table).
 *
 * Uses the new column names on `proforma_invoices`:
 *   grand_total, vat_amount, payment_status,
 *   terms_conditions, bank_details, approved_by.
 */

type ProformaRow = {
  id: string;
  proforma_number: string | null;
  status: string;
  currency: string;
  valid_until: string | null;
  created_at: string;
  notes: string | null;
  subtotal: number | string;
  discount_amount: number | string;
  vat_rate: number | string;
  vat_amount: number | string;
  grand_total: number | string;
  amount_paid: number | string;
  balance_due: number | string;
  payment_status: string | null;
  payment_terms: string | null;
  delivery_terms: string | null;
  incoterms: string | null;
  terms_conditions: string | null;
  bank_details: string | null;
  prepared_by: string | null;
  approved_by: string | null;
  approver: { full_name: string | null } | null;
  preparer: { full_name: string | null } | null;
  customers: (CustomerDisplay & Record<string, unknown>) | null;
};

type ItemRow = {
  id: string;
  description: string;
  quantity: number | string;
  unit: string | null;
  unit_price: number | string;
  discount: number | string;
  discount_amount: number | string;
  tax_rate: number | string;
  line_total: number | string;
  sort_order: number | null;
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

export async function fetchProformaForPdf(proformaId: string) {
  const [pRes, itemsRes] = await Promise.all([
    supabase
      .from("proforma_invoices")
      .select(
        `id, proforma_number, status, currency, valid_until, created_at, notes,
         subtotal, discount_amount, vat_rate, vat_amount, grand_total,
         amount_paid, balance_due, payment_status, payment_terms, delivery_terms,
         incoterms, terms_conditions, bank_details, prepared_by, approved_by,
         customers(name, company_name, address, billing_address, city, country, vat_number, email, phone)`,
      )
      .eq("id", proformaId)
      .maybeSingle(),
    supabase
      .from("proforma_invoice_items")
      .select(
        "id, description, quantity, unit, unit_price, discount, discount_amount, tax_rate, line_total, sort_order",
      )
      .eq("proforma_invoice_id", proformaId)
      .order("sort_order", { ascending: true }),
  ]);
  if (pRes.error) throw pRes.error;
  if (itemsRes.error) throw itemsRes.error;
  const raw = pRes.data as unknown as ProformaRow | null;
  if (!raw) throw new Error("Proforma invoice not found");

  // Resolve approver / preparer names (no FK to profiles, so join manually).
  const ids = [raw.approved_by, raw.prepared_by].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  let approver: { full_name: string | null } | null = null;
  let preparer: { full_name: string | null } | null = null;
  if (ids.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);
    const byId = new Map((profs ?? []).map((p) => [p.id, p.full_name] as const));
    if (raw.approved_by) approver = { full_name: byId.get(raw.approved_by) ?? null };
    if (raw.prepared_by) preparer = { full_name: byId.get(raw.prepared_by) ?? null };
  }
  const pi: ProformaRow = { ...raw, approver, preparer };
  return { pi, items: (itemsRes.data ?? []) as ItemRow[] };
}

export type ProformaPdfResult = { blob: Blob; url: string; filename: string };

export async function generateProformaInvoicePdf(
  proformaId: string,
  mode: "download" | "blob" = "download",
): Promise<ProformaPdfResult> {
  const { assertDocumentReadyForPdf } = await import(
    "./document-pdf-validation.functions"
  );
  await assertDocumentReadyForPdf({
    data: { kind: "proforma_invoice", id: proformaId },
  });

  const [{ pi, items }, company] = await Promise.all([
    fetchProformaForPdf(proformaId),
    loadCompany(),
  ]);

  const num = (v: number | string | null | undefined) => Number(v ?? 0) || 0;
  const subtotal = num(pi.subtotal);
  const discount = num(pi.discount_amount);
  const vat = num(pi.vat_amount);
  const grand = financeTotalAmount(pi);
  const paid = financePaidAmount(pi);
  const balance = financeBalanceDue(pi);

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;

  const logoDataUrl = await loadLogoDataUrl(company?.logo_url ?? null);
  let cursorY = margin;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", margin, cursorY, 90, 42, undefined, "FAST");
    } catch {
      /* ignore */
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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("PROFORMA INVOICE", pageW - margin, cursorY + 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  const meta = [
    `Number: ${pi.proforma_number || "DRAFT"}`,
    `Issue date: ${formatDate(pi.created_at)}`,
    pi.valid_until ? `Valid until: ${formatDate(pi.valid_until)}` : null,
    `Status: ${pi.status}`,
    pi.payment_status ? `Payment: ${pi.payment_status}` : null,
    `Currency: ${pi.currency}`,
  ].filter(Boolean) as string[];
  meta.forEach((line, i) => {
    doc.text(line, pageW - margin, cursorY + 36 + i * 12, { align: "right" });
  });

  cursorY =
    Math.max(cursorY + 30 + brandLines.length * 10, cursorY + 36 + meta.length * 12) + 12;
  doc.setDrawColor(220);
  doc.line(margin, cursorY, pageW - margin, cursorY);
  cursorY += 14;

  // Bill To
  const cust = pi.customers;
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

  // Items
  const body = items.map((it, idx) => {
    const qty = num(it.quantity);
    const price = num(it.unit_price);
    const disc = num(it.discount);
    const vatPct = num(it.tax_rate);
    return [
      String(idx + 1),
      it.description || "",
      `${qty} ${it.unit || ""}`.trim(),
      formatMoney(price, pi.currency),
      disc ? `${disc}%` : "—",
      vatPct ? `${vatPct}%` : "—",
      formatMoney(num(it.line_total), pi.currency),
    ];
  });
  autoTable(doc, {
    startY: cursorY,
    head: [["#", "Description", "Qty", "Unit price", "Disc", "VAT", "Line total"]],
    body: body.length ? body : [["—", "No line items", "", "", "", "", ""]],
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

  // Totals block — uses grand_total, vat_amount
  const totalsX = pageW - margin - 220;
  const totalsW = 220;
  let ty = afterTableY;
  const rows: Array<[string, string, boolean?]> = [
    ["Subtotal", formatMoney(subtotal, pi.currency)],
    ...(discount > 0
      ? ([["Discount", `− ${formatMoney(discount, pi.currency)}`]] as Array<[string, string, boolean?]>)
      : []),
    [`VAT${pi.vat_rate ? ` (${Number(pi.vat_rate)}%)` : ""}`, formatMoney(vat, pi.currency)],
    ["Grand total", formatMoney(grand, pi.currency), true],
    ["Amount paid", formatMoney(paid, pi.currency)],
    ["Balance due", formatMoney(balance, pi.currency), true],
  ];
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

  // Bank details — prefer per-proforma bank_details, fall back to company block
  let footerY = Math.max(ty, afterTableY) + 20;
  if (footerY > pageH - 200) {
    doc.addPage();
    footerY = margin;
  }
  const companyBankLines = [
    company?.bank_name ? `Bank: ${company.bank_name}` : null,
    company?.bank_account_name ? `Account name: ${company.bank_account_name}` : null,
    company?.bank_account_number ? `Account #: ${company.bank_account_number}` : null,
    company?.bank_iban ? `IBAN: ${company.bank_iban}` : null,
    company?.bank_swift ? `SWIFT/BIC: ${company.bank_swift}` : null,
    company?.bank_branch ? `Branch: ${company.bank_branch}` : null,
  ].filter(Boolean) as string[];
  const bankText = (pi.bank_details && pi.bank_details.trim()) || companyBankLines.join("\n");
  if (bankText) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("PAYMENT DETAILS", margin, footerY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30);
    const wrapped = doc.splitTextToSize(bankText, pageW - margin * 2);
    doc.text(wrapped, margin, footerY + 14);
    footerY += 14 + wrapped.length * 11 + 12;
  }

  // Terms & conditions — prefer per-proforma terms_conditions
  const termsText =
    (pi.terms_conditions && pi.terms_conditions.trim()) ||
    company?.default_terms ||
    null;
  const blocks: Array<[string, string]> = [];
  if (pi.payment_terms) blocks.push(["PAYMENT TERMS", pi.payment_terms]);
  if (pi.delivery_terms) blocks.push(["DELIVERY TERMS", pi.delivery_terms]);
  if (pi.incoterms) blocks.push(["INCOTERMS", pi.incoterms]);
  if (pi.notes) blocks.push(["NOTES", pi.notes]);
  if (termsText) blocks.push(["TERMS & CONDITIONS", termsText]);
  for (const [heading, text] of blocks) {
    if (footerY > pageH - 80) {
      doc.addPage();
      footerY = margin;
    }
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
  }

  // Signatures — approved_by / prepared_by
  if (footerY > pageH - 90) {
    doc.addPage();
    footerY = margin;
  }
  const sigY = Math.max(footerY + 10, pageH - 80);
  const colW = (pageW - margin * 2) / 2;
  doc.setDrawColor(180);
  doc.line(margin, sigY, margin + colW - 20, sigY);
  doc.line(margin + colW + 20, sigY, pageW - margin, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    `Prepared by: ${pi.preparer?.full_name ?? "—"}`,
    margin,
    sigY + 12,
  );
  doc.text(
    `Approved by: ${pi.approver?.full_name ?? (pi.approved_by ? "Approved" : "— (pending)")}`,
    margin + colW + 20,
    sigY + 12,
  );

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      "Proforma invoice — not a tax invoice. No VAT reclaim allowed.",
      margin,
      pageH - 20,
    );
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 20, { align: "right" });
  }

  const numRaw = (pi.proforma_number || pi.id.slice(0, 8)).replace(/[^A-Za-z0-9._-]/g, "_");
  const filename = `Proforma-${numRaw}.pdf`;
  const blob = doc.output("blob");
  if (mode === "download") doc.save(filename);
  return { blob, url: URL.createObjectURL(blob), filename };
}
