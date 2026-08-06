/**
 * Shared helpers for the `csv_export_audit.metadata` shape.
 *
 * Two invariants matter for compliance and are tested in
 * `__tests__/csv-export-audit-metadata.test.ts`:
 *
 * 1. Every audit row persists the CSV preamble values that were embedded
 *    in the exported file (`embedded_sha256`, `embedded_exported_at_iso`)
 *    so reviewers can prove what the file itself carried, independent of
 *    the top-level `sha256` column.
 * 2. Drift between the embedded SHA-256 and the top-level `sha256` column
 *    is flagged in the UI. A missing embedded value is NOT drift.
 */

import { PAYLOAD_MARKER, SHA_LABEL, TIMESTAMP_LABEL } from "@/lib/purge-csv-preamble";

export interface EmbeddedAuditMetadataInput {
  sha256: string;
  exportedAtIso: string;
  extra?: Record<string, unknown>;
}

export interface EmbeddedAuditMetadata {
  embedded_sha256: string;
  embedded_exported_at_iso: string;
  preamble: {
    sha_label: string;
    timestamp_label: string;
    payload_marker: string;
  };
  [key: string]: unknown;
}

/**
 * Build the `metadata` object that goes into `csv_export_audit.metadata`.
 * The `embedded_*` keys MUST reflect the exact preamble values written into
 * the CSV file so a later audit can compare them to the top-level column.
 */
export function buildEmbeddedAuditMetadata(
  input: EmbeddedAuditMetadataInput,
): EmbeddedAuditMetadata {
  return {
    ...(input.extra ?? {}),
    embedded_sha256: input.sha256,
    embedded_exported_at_iso: input.exportedAtIso,
    preamble: {
      sha_label: SHA_LABEL,
      timestamp_label: TIMESTAMP_LABEL,
      payload_marker: PAYLOAD_MARKER,
    },
  };
}

export interface AuditDriftInput {
  sha256: string;
  metadata: unknown;
}

/**
 * Returns true when the embedded preamble SHA-256 disagrees with the
 * top-level `sha256` column. Missing embedded value is treated as
 * "no drift detected" so we don't false-alarm on older rows.
 */
export function detectShaDrift(row: AuditDriftInput): boolean {
  const md = (row.metadata ?? {}) as { embedded_sha256?: unknown };
  const embedded = md.embedded_sha256;
  if (typeof embedded !== "string" || embedded.length === 0) return false;
  return embedded.toLowerCase() !== row.sha256.toLowerCase();
}
