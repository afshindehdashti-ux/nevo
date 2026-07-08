import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type Quotation = {
  quotation_number?: string | null;
  status?: string | null;
  issue_date?: string | null;
  valid_until?: string | null;
  currency?: string | null;
  subtotal?: number | string | null;
  vat_rate?: number | string | null;
  vat_amount?: number | string | null;
  total?: number | string | null;
  terms?: string | null;
  notes?: string | null;
  customers?: {
    name?: string | null;
    company_name?: string | null;
    email?: string | null;
    city?: string | null;
    country?: string | null;
    address?: string | null;
  } | null;
};

type Item = {
  description: string;
  quantity: number | string;
  unit?: string | null;
  hs_code?: string | null;
  unit_price: number | string;
  discount_pct?: number | string | null;
  line_total: number | string;
};

type Seller = {
  legal_name?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  trade_license?: string | null;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_iban?: string | null;
  bank_swift?: string | null;
};

const NEVO_NAVY: [number, number, number] = [12, 25, 60];
const MUTED: [number, number, number] = [110, 118, 130];

function n(v: unknown): number {
  const x = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(x) ? x : 0;
}

function money(v: unknown, currency: string) {
  return `${currency} ${n(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function validateQuotationForPdf(q: Quotation, items: Item[]): string[] {
  const errs: string[] = [];
  if (!q.customers || (!q.customers.company_name && !q.customers.name)) {
    errs.push("Customer is missing");
  }
  if (!q.issue_date) errs.push("Issue date is missing");
  if (!items || items.length === 0) errs.push("No line items added");
  items.forEach((it, i) => {
    if (!it.description?.trim()) errs.push(`Line ${i + 1}: description is required`);
    if (n(it.quantity) <= 0) errs.push(`Line ${i + 1}: quantity must be greater than zero`);
    if (n(it.unit_price) < 0) errs.push(`Line ${i + 1}: unit price cannot be negative`);
  });
  return errs;
}

export function buildQuotationPdf(
  q: Quotation,
  items: Item[],
  seller: Seller | null,
): { blob: Blob; base64: string; filename: string } {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const currency = q.currency || "USD";
  const margin = 15;

  // Header band
  doc.setFillColor(...NEVO_NAVY);
  doc.rect(0, 0, pageWidth, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(seller?.legal_name || "NEVO Industrial", margin, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(seller?.website || "nevoindustrial.com", margin, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("QUOTATION", pageWidth - margin, 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(q.quotation_number || "DRAFT", pageWidth - margin, 18, { align: "right" });

  // Meta block
  doc.setTextColor(0, 0, 0);
  let y = 34;
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("ISSUE DATE", margin, y);
  doc.text("VALID UNTIL", margin + 45, y);
  doc.text("STATUS", margin + 90, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(q.issue_date || "—", margin, y + 5);
  doc.text(q.valid_until || "—", margin + 45, y + 5);
  doc.text((q.status || "draft").toUpperCase(), margin + 90, y + 5);
  doc.setFont("helvetica", "normal");

  // From / To
  y = 50;
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("FROM", margin, y);
  doc.text("BILL TO", pageWidth / 2, y);
  doc.setTextColor(0, 0, 0);
  const fromLines = [
    seller?.legal_name || "NEVO Industrial",
    seller?.address,
    [seller?.city, seller?.country].filter(Boolean).join(", "),
    seller?.email,
    seller?.phone,
    seller?.trade_license ? `TRN/License: ${seller.trade_license}` : null,
  ].filter(Boolean) as string[];
  doc.setFontSize(9.5);
  doc.text(fromLines, margin, y + 5);

  const c = q.customers;
  const toLines = c
    ? ([
        c.company_name || c.name,
        c.address,
        [c.city, c.country].filter(Boolean).join(", "),
        c.email,
      ].filter(Boolean) as string[])
    : ["—"];
  doc.text(toLines, pageWidth / 2, y + 5);

  const blockHeight = Math.max(fromLines.length, toLines.length) * 4.5;
  const tableStart = y + 8 + blockHeight;

  // Items
  autoTable(doc, {
    startY: tableStart,
    head: [["#", "Description", "HS Code", "Qty", "Unit", "Unit Price", "Disc %", "Line Total"]],
    body: items.map((it, i) => [
      String(i + 1),
      it.description,
      it.hs_code || "",
      n(it.quantity).toString(),
      it.unit || "",
      money(it.unit_price, currency),
      `${n(it.discount_pct)}%`,
      money(it.line_total, currency),
    ]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: NEVO_NAVY, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 8, halign: "right" },
      3: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  // Totals
  const afterTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  const totalsX = pageWidth - margin - 70;
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  const row = (label: string, value: string, bold = false, offset = 0) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, totalsX, afterTable + offset);
    doc.text(value, pageWidth - margin, afterTable + offset, { align: "right" });
  };
  row("Subtotal", money(q.subtotal, currency), false, 0);
  row(`VAT (${n(q.vat_rate)}%)`, money(q.vat_amount, currency), false, 6);
  doc.setDrawColor(220);
  doc.line(totalsX, afterTable + 8.5, pageWidth - margin, afterTable + 8.5);
  row("TOTAL", money(q.total, currency), true, 13);

  // Terms / Notes / Bank
  let footY = afterTable + 24;
  doc.setFontSize(9);
  const section = (title: string, body: string | null | undefined) => {
    if (!body) return;
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, footY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(body, pageWidth - margin * 2);
    doc.text(lines, margin, footY + 4.5);
    footY += 4.5 + lines.length * 4.2 + 4;
  };
  section("TERMS & CONDITIONS", q.terms);
  section("NOTES", q.notes);

  const bankLines = [
    seller?.bank_name ? `Bank: ${seller.bank_name}` : null,
    seller?.bank_account_name ? `Account name: ${seller.bank_account_name}` : null,
    seller?.bank_account_number ? `Account #: ${seller.bank_account_number}` : null,
    seller?.bank_iban ? `IBAN: ${seller.bank_iban}` : null,
    seller?.bank_swift ? `SWIFT: ${seller.bank_swift}` : null,
  ].filter(Boolean) as string[];
  if (bankLines.length) {
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "bold");
    doc.text("BANK DETAILS", margin, footY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(bankLines, margin, footY + 4.5);
    footY += 4.5 + bankLines.length * 4.2 + 4;
  }

  // Footer band
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220);
  doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    `${seller?.legal_name || "NEVO Industrial"} · Thank you for your business`,
    pageWidth / 2,
    pageHeight - 12,
    { align: "center" },
  );

  const blob = doc.output("blob");
  const base64 = doc.output("datauristring").split(",")[1] ?? "";
  const filename = `${(q.quotation_number || "quotation").replace(/[^\w-]+/g, "_")}.pdf`;
  return { blob, base64, filename };
}

export async function loadSellerSettings(): Promise<Seller | null> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase
    .from("company_settings")
    .select(
      "legal_name, address, city, country, email, phone, website, trade_license, bank_name, bank_account_name, bank_account_number, bank_iban, bank_swift",
    )
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Seller) ?? null;
}

export function downloadQuotationPdf(q: Quotation, items: Item[], seller: Seller | null) {
  const { blob, filename } = buildQuotationPdf(q, items, seller);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
