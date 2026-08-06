/**
 * Compliance report builder for `csv_export_audit` rows.
 *
 * Produces a CSV summarizing, per selected export, the top-level
 * `sha256` column versus the `embedded_sha256` value written into the CSV
 * preamble, plus both export timestamps (`created_at` vs
 * `embedded_exported_at_iso`) and a drift flag.
 *
 * Pure helper — tested in
 * `__tests__/compliance-report.test.ts`.
 */

import { csvEscape } from "@/lib/purge-csv-preamble";
import { detectShaDrift } from "@/lib/csv-export-audit-metadata";

export interface ComplianceReportRow {
  id: string;
  created_at: string;
  user_id: string | null;
  export_type: string;
  scope: string | null;
  entity_type: string | null;
  entity_id: string | null;
  filename: string;
  row_count: number;
  byte_size: number;
  sha256: string;
  metadata: unknown;
}

export interface BuildComplianceReportOpts {
  generatedAtIso: string;
  actorMap?: Record<string, string>;
}

export const COMPLIANCE_REPORT_COLUMNS = [
  "audit_id",
  "created_at",
  "user",
  "export_type",
  "scope",
  "entity_type",
  "entity_id",
  "filename",
  "row_count",
  "byte_size",
  "sha256_recorded",
  "sha256_embedded",
  "sha256_drift",
  "exported_at_embedded",
  "timestamp_drift_seconds",
] as const;

function readEmbedded(metadata: unknown): {
  embeddedSha?: string;
  embeddedIso?: string;
} {
  const md = (metadata ?? {}) as Record<string, unknown>;
  const embeddedSha = typeof md.embedded_sha256 === "string" ? md.embedded_sha256 : undefined;
  const embeddedIso =
    typeof md.embedded_exported_at_iso === "string" ? md.embedded_exported_at_iso : undefined;
  return { embeddedSha, embeddedIso };
}

function timestampDriftSeconds(createdAt: string, embeddedIso?: string): string {
  if (!embeddedIso) return "";
  const a = new Date(createdAt).getTime();
  const b = new Date(embeddedIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return "invalid";
  return Math.round((b - a) / 1000).toString();
}

export function buildComplianceReportCsv(
  rows: ComplianceReportRow[],
  opts: BuildComplianceReportOpts,
): string {
  const header = [
    `# NEVO CSV export compliance report`,
    `# Generated: ${opts.generatedAtIso}`,
    `# Records: ${rows.length}`,
    `# Drift flagged: ${rows.filter((r) => detectShaDrift(r)).length}`,
    "",
  ].join("\n");

  const dataLines: string[] = [];
  dataLines.push(COMPLIANCE_REPORT_COLUMNS.map(csvEscape).join(","));
  for (const r of rows) {
    const { embeddedSha, embeddedIso } = readEmbedded(r.metadata);
    const drift = detectShaDrift(r);
    const userLabel = r.user_id ? (opts.actorMap?.[r.user_id] ?? r.user_id) : "System";
    dataLines.push(
      [
        r.id,
        r.created_at,
        userLabel,
        r.export_type,
        r.scope ?? "",
        r.entity_type ?? "",
        r.entity_id ?? "",
        r.filename,
        String(r.row_count),
        String(r.byte_size),
        r.sha256,
        embeddedSha ?? "",
        drift ? "DRIFT" : embeddedSha ? "match" : "n/a",
        embeddedIso ?? "",
        timestampDriftSeconds(r.created_at, embeddedIso),
      ]
        .map((v) => csvEscape(String(v)))
        .join(","),
    );
  }
  return header + dataLines.join("\n") + "\n";
}
