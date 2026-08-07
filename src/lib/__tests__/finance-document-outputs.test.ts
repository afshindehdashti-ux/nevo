import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { computeInvoiceTotals } from "@/lib/invoice-pdf";
import { buildQuotationPdf, validateQuotationForPdf } from "@/lib/quotation-pdf";
import { buildExcelWorkbook, buildReportPdf } from "@/lib/report-exports";
import { formatLocalDate, nextCalendarDate } from "@/lib/report-date-range";

describe("finance document outputs", () => {
  it("uses the same discount and VAT math as the invoice backend", () => {
    expect(
      computeInvoiceTotals(
        [
          { quantity: 2, unit_price: 100, discount_pct: 10, vat_pct: 5 },
          { quantity: 1, unit_price: 50, discount_pct: 0, vat_pct: 5 },
        ],
        100,
      ),
    ).toEqual({ subtotal: 230, discount: 20, vat: 11.5, total: 241.5, paid: 100, balance: 141.5 });
  });

  it("builds a non-empty quotation PDF with a safe filename", () => {
    const quotation = {
      quotation_number: "QT/2026 001",
      status: "approved",
      issue_date: "2026-07-15",
      valid_until: "2026-08-15",
      currency: "USD",
      subtotal: 180,
      vat_rate: 5,
      vat_amount: 9,
      total: 189,
      customers: { name: "QA Customer", company_name: "QA Industries" },
    };
    const items = [
      {
        description: "Production line",
        quantity: 2,
        unit: "pcs",
        unit_price: 100,
        discount_pct: 10,
        line_total: 180,
      },
    ];

    expect(validateQuotationForPdf(quotation, items)).toEqual([]);
    const output = buildQuotationPdf(quotation, items, { legal_name: "NEVO Industrial" });
    expect(output.filename).toBe("QT_2026_001.pdf");
    expect(output.base64.startsWith("JVBERi0")).toBe(true);
    expect(output.blob.size).toBeGreaterThan(1_000);
  });

  it("builds readable PDF and Excel report artifacts", () => {
    const columns = [
      { key: "customer" as const, header: "Customer" },
      { key: "total" as const, header: "Total", align: "right" as const },
    ];
    const rows = [{ customer: "QA Customer", total: 189 }];
    const workbook = buildExcelWorkbook({
      filename: "qa-report",
      sheetName: "Finance",
      columns,
      rows,
      meta: { Rows: 1 },
    });
    const xlsx = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    expect(xlsx.byteLength).toBeGreaterThan(1_000);
    expect(workbook.SheetNames).toEqual(["Finance"]);

    const pdf = buildReportPdf({
      filename: "qa-report",
      title: "Finance report",
      columns,
      rows,
      meta: { Rows: 1 },
    });
    expect(pdf.output("arraybuffer").byteLength).toBeGreaterThan(1_000);
  });
});

describe("report date ranges", () => {
  it("uses local calendar dates and an exclusive next-day upper bound", () => {
    expect(formatLocalDate(new Date(2026, 6, 15, 0, 30))).toBe("2026-07-15");
    expect(nextCalendarDate("2026-07-31")).toBe("2026-08-01");
    expect(nextCalendarDate("2028-02-28")).toBe("2028-02-29");
  });
});
