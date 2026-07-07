import { supabase } from "@/integrations/supabase/client";

export type InvoicePdfSource = "download" | "email" | "bulk" | "preview";

export type InvoicePdfVersionRow = {
  id: string;
  invoice_id: string;
  doc_type: string;
  storage_bucket: string;
  storage_path: string;
  filename: string;
  byte_size: number | null;
  source: string;
  generated_by: string | null;
  note: string | null;
  created_at: string;
};

/**
 * Upload the generated PDF blob to crm-docs and record a version row.
 * Non-fatal: errors bubble up so callers can toast, but no throw when
 * only the audit-row insert fails (upload is the source of truth).
 */
export async function recordInvoicePdfVersion(params: {
  invoiceId: string;
  docType: "proforma" | "commercial" | string;
  blob: Blob;
  filename: string;
  source: InvoicePdfSource;
  note?: string | null;
}): Promise<{ storagePath: string }> {
  const { invoiceId, docType, blob, filename, source, note } = params;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const storagePath = `invoices/${invoiceId}/${stamp}-${filename}`;

  const { error: upErr } = await supabase.storage
    .from("crm-docs")
    .upload(storagePath, blob, { contentType: "application/pdf", upsert: false });
  if (upErr) throw upErr;

  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id ?? null;

  const trimmedNote = note?.trim() ? note.trim().slice(0, 500) : null;

  const { error: insErr } = await supabase.from("invoice_pdf_versions").insert({
    invoice_id: invoiceId,
    doc_type: docType,
    storage_bucket: "crm-docs",
    storage_path: storagePath,
    filename,
    byte_size: blob.size,
    source,
    generated_by: uid,
    note: trimmedNote,
  });
  if (insErr) console.error("invoice_pdf_versions insert failed", insErr);

  return { storagePath };
}

export async function signInvoicePdfUrl(
  storagePath: string,
  expiresInSeconds = 300,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("crm-docs")
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data?.signedUrl) throw error ?? new Error("Failed to sign URL");
  return data.signedUrl;
}
