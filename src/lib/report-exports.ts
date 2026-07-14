import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export type ReportColumn<T> = {
  key: keyof T & string;
  header: string;
  align?: "left" | "right" | "center";
  format?: (v: unknown, row: T) => string | number;
};

function cellValue<T>(row: T, col: ReportColumn<T>): string | number {
  const raw = (row as Record<string, unknown>)[col.key];
  if (col.format) return col.format(raw, row);
  if (raw == null) return "";
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  return typeof raw === "number" ? raw : String(raw);
}

type ExcelReportOptions<T> = {
  filename: string;
  sheetName?: string;
  columns: ReportColumn<T>[];
  rows: T[];
  meta?: Record<string, string | number>;
};

export function buildExcelWorkbook<T>(opts: ExcelReportOptions<T>): XLSX.WorkBook {
  const { sheetName = "Report", columns, rows, meta } = opts;
  const wb = XLSX.utils.book_new();

  const header = columns.map((c) => c.header);
  const data = rows.map((r) => columns.map((c) => cellValue(r, c)));

  const aoa: (string | number)[][] = [];
  if (meta) {
    for (const [k, v] of Object.entries(meta)) aoa.push([k, v]);
    aoa.push([]);
  }
  aoa.push(header, ...data);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = columns.map((c) => ({
    wch: Math.max(c.header.length + 2, 14),
  }));
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  return wb;
}

export function exportToExcel<T>(opts: ExcelReportOptions<T>) {
  const wb = buildExcelWorkbook(opts);
  const { filename } = opts;
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

type PdfReportOptions<T> = {
  filename: string;
  title: string;
  subtitle?: string;
  columns: ReportColumn<T>[];
  rows: T[];
  meta?: Record<string, string | number>;
  orientation?: "portrait" | "landscape";
};

export function buildReportPdf<T>(opts: PdfReportOptions<T>): jsPDF {
  const { title, subtitle, columns, rows, meta, orientation = "landscape" } = opts;
  const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 40, 40);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90);
  let y = 60;
  if (subtitle) {
    doc.text(subtitle, 40, y);
    y += 14;
  }
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, y);
  y += 14;
  if (meta) {
    for (const [k, v] of Object.entries(meta)) {
      doc.text(`${k}: ${v}`, 40, y);
      y += 12;
    }
  }
  doc.setTextColor(0);

  autoTable(doc, {
    startY: y + 6,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => cellValue(r, c))),
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
    columnStyles: Object.fromEntries(columns.map((c, i) => [i, { halign: c.align ?? "left" }])),
    margin: { left: 30, right: 30 },
  });

  return doc;
}

export function exportToPDF<T>(opts: PdfReportOptions<T>) {
  const doc = buildReportPdf(opts);
  const { filename } = opts;
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

export const fmtMoney = (v: unknown, currency = "USD") => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  if (!Number.isFinite(n)) return "";
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const fmtDate = (v: unknown) => {
  if (!v) return "";
  const d = typeof v === "string" || typeof v === "number" ? new Date(v) : (v as Date);
  return Number.isNaN(d.getTime()) ? String(v) : d.toISOString().slice(0, 10);
};
