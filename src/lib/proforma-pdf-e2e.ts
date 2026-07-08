/**
 * End-to-end assertions for the Proforma Invoice PDF.
 *
 * Runs entirely in the browser: generates the real PDF via jsPDF, then
 * extracts text with pdfjs-dist and asserts that VAT rate%, VAT amount,
 * grand total, and the payment status stamp are present.
 */

import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "./crm-money";
import {
  fetchProformaForPdf,
  generateProformaInvoicePdf,
} from "./proforma-invoice-pdf";

export type PdfAssertion = {
  key: string;
  label: string;
  expected: string;
  found: boolean;
};

export type PdfE2eReport = {
  proformaId: string;
  proformaNumber: string | null;
  currency: string;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  paymentStatus: string;
  filename: string;
  fileSize: number;
  pageCount: number;
  pass: boolean;
  assertions: PdfAssertion[];
  textPreview: string;
};

async function extractPdfText(blob: Blob): Promise<{ text: string; pages: number }> {
  // Lazy import to keep pdfjs out of the main bundle.
  const pdfjs = await import("pdfjs-dist");
  const pdfjsAny = pdfjs as unknown as { GlobalWorkerOptions?: { workerSrc: string } };
  if (pdfjsAny.GlobalWorkerOptions) pdfjsAny.GlobalWorkerOptions.workerSrc = "";

  const buf = await blob.arrayBuffer();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buf),
    disableWorker: true,
    isEvalSupported: false,
  } as unknown as Parameters<typeof pdfjs.getDocument>[0]).promise;

  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it) => ("str" in it ? (it as { str: string }).str : ""))
      .join(" ");
    text += pageText + "\n";
  }
  return { text, pages: doc.numPages };
}

function normalize(s: string) {
  // pdfjs sometimes inserts spaces between glyphs; collapse whitespace and
  // strip non-breaking spaces used by Intl.NumberFormat for currencies.
  return s.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function contains(hay: string, needle: string) {
  const h = normalize(hay);
  const n = normalize(needle);
  return h.includes(n);
}

/**
 * Generate the PDF for a proforma, extract text, and assert on totals
 * (vat_rate%, vat_amount, grand_total) plus the payment status stamp.
 */
export async function assertProformaPdfContent(
  proformaId: string,
): Promise<PdfE2eReport> {
  const { pi } = await fetchProformaForPdf(proformaId);
  const currency = pi.currency;
  const vatRate = Number(pi.vat_rate ?? 0) || 0;
  const vatAmount = Number(pi.vat_amount ?? 0) || 0;
  const grandTotal = Number(pi.grand_total ?? 0) || 0;
  const paymentStatus = pi.payment_status ?? "Unpaid";

  const { blob, filename } = await generateProformaInvoicePdf(
    proformaId,
    "blob",
  );

  const { text, pages } = await extractPdfText(blob);

  const vatLabel = `VAT${vatRate ? ` (${vatRate}%)` : ""}`;
  const vatAmountStr = formatMoney(vatAmount, currency);
  const grandStr = formatMoney(grandTotal, currency);
  const paymentStamp = `Payment: ${paymentStatus}`;

  const assertions: PdfAssertion[] = [
    {
      key: "vat_rate",
      label: "VAT rate label",
      expected: vatLabel,
      found: contains(text, vatLabel),
    },
    {
      key: "vat_amount",
      label: "VAT amount",
      expected: vatAmountStr,
      found: contains(text, vatAmountStr),
    },
    {
      key: "grand_total_label",
      label: "Grand total label",
      expected: "Grand total",
      found: contains(text, "Grand total"),
    },
    {
      key: "grand_total_value",
      label: "Grand total value",
      expected: grandStr,
      found: contains(text, grandStr),
    },
    {
      key: "payment_status",
      label: "Payment status stamp",
      expected: paymentStamp,
      found: contains(text, paymentStamp),
    },
  ];

  const pass = assertions.every((a) => a.found);
  return {
    proformaId,
    proformaNumber: pi.proforma_number,
    currency,
    vatRate,
    vatAmount,
    grandTotal,
    paymentStatus,
    filename,
    fileSize: blob.size,
    pageCount: pages,
    pass,
    assertions,
    textPreview: normalize(text).slice(0, 600),
  };
}

/**
 * Pick the most recently issued proforma (falling back to any) and run the
 * e2e assertions against it.
 */
export async function assertLatestProformaPdf(): Promise<PdfE2eReport> {
  const { data, error } = await supabase
    .from("proforma_invoices")
    .select("id, grand_total")
    .gt("grand_total", 0)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No proforma invoices with a non-zero total to test.");
  return assertProformaPdfContent(data.id);
}
