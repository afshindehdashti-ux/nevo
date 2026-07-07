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

/**
 * Delete PDF versions beyond the retention window (keeps the newest `keep`).
 * Removes storage objects first, then deletes the DB rows. Returns the number
 * of versions purged.
 */
export async function purgeOlderInvoicePdfVersions(
  invoiceId: string,
  keep: number,
): Promise<number> {
  // Pre-flight authorization: give a clear error before hitting storage/RLS.
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) {
    throw new Error("You must be signed in to purge PDF versions.");
  }
  const { data: allowed, error: roleErr } = await supabase.rpc("has_any_role", {
    _user_id: uid,
    _roles: ["super_admin", "management", "finance"],
  });
  if (roleErr) throw roleErr;
  if (!allowed) {
    throw new Error(
      "You do not have permission to purge PDF versions. Ask a Super Admin, Management, or Finance user.",
    );
  }

  const keepCount = Math.max(0, Math.floor(keep));
  const { data: rows, error } = await supabase
    .from("invoice_pdf_versions")
    .select("id, storage_bucket, storage_path, byte_size")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const toDelete = (rows ?? []).slice(keepCount);
  if (toDelete.length === 0) return 0;
  const totalBytes = toDelete.reduce((sum, r) => sum + (r.byte_size ?? 0), 0);

  // Group storage removals by bucket (currently always crm-docs).
  const byBucket = new Map<string, string[]>();
  for (const r of toDelete) {
    const arr = byBucket.get(r.storage_bucket) ?? [];
    arr.push(r.storage_path);
    byBucket.set(r.storage_bucket, arr);
  }
  for (const [bucket, paths] of byBucket) {
    const { error: rmErr } = await supabase.storage.from(bucket).remove(paths);
    if (rmErr) console.warn("purge storage remove failed", rmErr);
  }

  const ids = toDelete.map((r) => r.id);
  const { error: delErr } = await supabase
    .from("invoice_pdf_versions")
    .delete()
    .in("id", ids);
  if (delErr) throw delErr;

  // Audit log — best-effort; do not fail the purge if logging fails.
  const { error: logErr } = await supabase.rpc("log_pdf_version_purge", {
    _invoice_id: invoiceId,
    _removed_count: toDelete.length,
    _kept: keepCount,
    _version_ids: ids,
    _details: { total_bytes: totalBytes },
  });
  if (logErr) console.warn("purge audit log failed", logErr);

  return toDelete.length;
}

