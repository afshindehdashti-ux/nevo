import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportColumn = { header: string; key: string };
export type ExportRow = Record<string, string | number | null | undefined>;

function escapeCsv(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export function downloadCsv(filenameBase: string, columns: ExportColumn[], rows: ExportRow[]) {
  const lines = [columns.map((c) => escapeCsv(c.header)).join(",")];
  for (const r of rows) {
    lines.push(columns.map((c) => escapeCsv(r[c.key])).join(","));
  }
  // UTF-8 BOM so Excel opens it correctly.
  const blob = new Blob(["\ufeff" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  triggerDownload(blob, `${filenameBase}-${stamp()}.csv`);
}

export function downloadPdf(
  filenameBase: string,
  title: string,
  columns: ExportColumn[],
  rows: ExportRow[],
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const generated = format(new Date(), "yyyy-MM-dd HH:mm:ss");

  doc.setFontSize(14);
  doc.text(title, 40, 40);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${generated} · ${rows.length} rows`, 40, 56);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 70,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => String(r[c.key] ?? ""))),
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 40, right: 40 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `NEVO CRM · ${title} · page ${i} of ${pageCount}`,
      40,
      doc.internal.pageSize.getHeight() - 20,
    );
  }

  doc.save(`${filenameBase}-${stamp()}.pdf`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function stamp() {
  return format(new Date(), "yyyyMMdd-HHmmss");
}
