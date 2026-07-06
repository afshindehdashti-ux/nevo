// Server-only text extraction for Document Intelligence uploads.
// PDF and image files are handled by Gemini as multimodal input; this module
// covers text-based formats (DOCX, XLSX, CSV, TXT).

export type ExtractResult = {
  text: string;
  usedMultimodal: boolean;
  note?: string;
};

const MAX_CHARS = 40_000;

export async function extractDocumentText(
  bytes: Uint8Array,
  mimeType: string,
  filename: string,
): Promise<ExtractResult> {
  const name = filename.toLowerCase();
  const mt = (mimeType || "").toLowerCase();

  // Treat these as native multimodal inputs to the model
  if (
    mt.startsWith("image/") ||
    mt === "application/pdf" ||
    name.endsWith(".pdf") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp")
  ) {
    return { text: "", usedMultimodal: true };
  }

  // Plain text / CSV
  if (
    mt.startsWith("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".csv")
  ) {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes).slice(0, MAX_CHARS);
    return { text, usedMultimodal: false };
  }

  // DOCX
  if (
    mt === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    try {
      const mammoth = await import("mammoth");
      const buf = Buffer.from(bytes);
      const result = await mammoth.extractRawText({ buffer: buf });
      return { text: (result.value || "").slice(0, MAX_CHARS), usedMultimodal: false };
    } catch (err) {
      return {
        text: "",
        usedMultimodal: false,
        note: `DOCX extraction failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // XLSX
  if (
    mt === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls")
  ) {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(bytes, { type: "array" });
      const parts: string[] = [];
      for (const sn of wb.SheetNames) {
        const sh = wb.Sheets[sn];
        parts.push(`# Sheet: ${sn}\n${XLSX.utils.sheet_to_csv(sh)}`);
        if (parts.join("\n\n").length > MAX_CHARS) break;
      }
      return { text: parts.join("\n\n").slice(0, MAX_CHARS), usedMultimodal: false };
    } catch (err) {
      return {
        text: "",
        usedMultimodal: false,
        note: `XLSX extraction failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  return {
    text: "",
    usedMultimodal: false,
    note: `Unsupported file type: ${mt || name}. AI will rely on the user note only.`,
  };
}
