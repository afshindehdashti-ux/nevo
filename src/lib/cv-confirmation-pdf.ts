import jsPDF from "jspdf";

export interface CvConfirmationInput {
  name: string;
  email: string;
  phone: string;
  linkedin?: string;
  team?: string;
  note?: string;
  cvName?: string;
  cvSize?: number;
  submittedAt?: Date;
}

export interface CvConfirmationResult {
  blob: Blob;
  filename: string;
  reference: string;
}

function makeReference(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `NEVO-CV-${y}${m}${d}-${rand}`;
}

export function generateCvConfirmationPdf(input: CvConfirmationInput): CvConfirmationResult {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const submittedAt = input.submittedAt ?? new Date();
  const reference = makeReference();

  // Header band
  doc.setFillColor(10, 13, 12);
  doc.rect(0, 0, pageWidth, 96, "F");
  doc.setTextColor(16, 185, 129);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("NEVO INDUSTRIAL", margin, 40);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("Application Confirmation", margin, 68);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 205);
  doc.text(`Reference: ${reference}`, margin, 86);

  // Body
  doc.setTextColor(20, 20, 20);
  let y = 140;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Dear ${input.name || "Candidate"},`, margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const intro = doc.splitTextToSize(
    "Thank you for applying to NEVO Industrial. This document confirms that we have received your application. Our talent team will review your profile and respond within 5 business days.",
    pageWidth - margin * 2,
  );
  doc.text(intro, margin, y);
  y += intro.length * 15 + 16;

  // Details table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Application Details", margin, y);
  y += 8;
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  const rows: [string, string][] = [
    ["Submitted", submittedAt.toLocaleString()],
    ["Reference", reference],
    ["Full name", input.name || "—"],
    ["Email", input.email || "—"],
    ["Phone", input.phone || "—"],
    ["LinkedIn", input.linkedin || "—"],
    ["Preferred team", input.team || "—"],
    [
      "CV file",
      input.cvName
        ? `${input.cvName}${input.cvSize ? ` (${(input.cvSize / (1024 * 1024)).toFixed(2)} MB)` : ""}`
        : "Not attached",
    ],
  ];

  doc.setFontSize(10);
  for (const [k, v] of rows) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(90, 90, 90);
    doc.text(k, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    const wrapped = doc.splitTextToSize(String(v), pageWidth - margin - 160);
    doc.text(wrapped, margin + 130, y);
    y += Math.max(16, wrapped.length * 14);
  }

  if (input.note && input.note.trim()) {
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Candidate Note", margin, y);
    y += 6;
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const noteLines = doc.splitTextToSize(input.note.trim(), pageWidth - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 14;
  }

  // Next steps
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("What happens next", margin, y);
  y += 6;
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const steps = [
    "1. Our talent team screens your profile against current and upcoming roles.",
    "2. If there is a match, a recruiter will reach out to schedule an introduction call.",
    "3. Please keep this confirmation for your records — quote the reference above in any follow-up.",
  ];
  for (const s of steps) {
    const lines = doc.splitTextToSize(s, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 14 + 4;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, footerY - 12, pageWidth - margin, footerY - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("NEVO Industrial · Dubai · Germany · Türkiye · nevoindustrial.com", margin, footerY);
  doc.text(reference, pageWidth - margin, footerY, { align: "right" });

  const safeName =
    (input.name || "candidate")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "candidate";
  const filename = `nevo-application-${safeName}-${reference}.pdf`;
  const blob = doc.output("blob") as Blob;
  return { blob, filename, reference };
}
