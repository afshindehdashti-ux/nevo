import { describe, expect, it } from "vitest";

import {
  buildComplianceReportCsv,
  COMPLIANCE_REPORT_COLUMNS,
  type ComplianceReportRow,
} from "@/lib/compliance-report";

const SHA_A = "a".repeat(64);
const SHA_B = "b".repeat(64);

function row(overrides: Partial<ComplianceReportRow>): ComplianceReportRow {
  return {
    id: "audit-1",
    created_at: "2026-07-07T12:00:00.000Z",
    user_id: "user-1",
    export_type: "invoice_purge_audit",
    scope: "filtered",
    entity_type: "invoice",
    entity_id: "inv-1",
    filename: "invoice-INV-1-purge-audit.csv",
    row_count: 3,
    byte_size: 1024,
    sha256: SHA_A,
    metadata: {
      embedded_sha256: SHA_A,
      embedded_exported_at_iso: "2026-07-07T12:00:05.000Z",
    },
    ...overrides,
  };
}

describe("buildComplianceReportCsv", () => {
  const generatedAtIso = "2026-07-07T13:00:00.000Z";

  it("emits the documented header block and column order", () => {
    const csv = buildComplianceReportCsv([row({})], {
      generatedAtIso,
      actorMap: { "user-1": "Ada Lovelace" },
    });
    expect(csv).toContain("# NEVO CSV export compliance report");
    expect(csv).toContain(`# Generated: ${generatedAtIso}`);
    expect(csv).toContain("# Records: 1");
    expect(csv).toContain("# Drift flagged: 0");
    // Column header is the second-to-last non-empty line before the record.
    const headerLine = csv.split("\n").find((l) => l.startsWith('"audit_id"'));
    expect(headerLine).toBe(
      COMPLIANCE_REPORT_COLUMNS.map((c) => `"${c}"`).join(","),
    );
  });

  it("marks sha_drift as 'match' when embedded == recorded", () => {
    const csv = buildComplianceReportCsv([row({})], { generatedAtIso });
    expect(csv).toMatch(/"match"/);
    expect(csv).not.toMatch(/"DRIFT"/);
  });

  it("marks sha_drift as 'DRIFT' when embedded differs and counts it in the header", () => {
    const csv = buildComplianceReportCsv(
      [row({ metadata: { embedded_sha256: SHA_B } })],
      { generatedAtIso },
    );
    expect(csv).toMatch(/"DRIFT"/);
    expect(csv).toContain("# Drift flagged: 1");
  });

  it("marks sha_drift as 'n/a' when no embedded_sha256 is present (older rows)", () => {
    const csv = buildComplianceReportCsv([row({ metadata: {} })], {
      generatedAtIso,
    });
    expect(csv).toMatch(/"n\/a"/);
    expect(csv).toContain("# Drift flagged: 0");
  });

  it("computes timestamp_drift_seconds as (embedded - created_at) rounded", () => {
    const csv = buildComplianceReportCsv([row({})], { generatedAtIso });
    // 12:00:05 - 12:00:00 = 5 seconds
    expect(csv).toMatch(/,"5"\r?\n?$/m);
  });

  it("uses actorMap when available and falls back to user id then System", () => {
    const csv = buildComplianceReportCsv(
      [
        row({ id: "a", user_id: "user-1" }),
        row({ id: "b", user_id: "user-unknown" }),
        row({ id: "c", user_id: null }),
      ],
      { generatedAtIso, actorMap: { "user-1": "Ada Lovelace" } },
    );
    expect(csv).toContain('"Ada Lovelace"');
    expect(csv).toContain('"user-unknown"');
    expect(csv).toContain('"System"');
  });

  it("CSV-escapes filenames containing quotes and commas", () => {
    const csv = buildComplianceReportCsv(
      [row({ filename: 'a,"weird".csv' })],
      { generatedAtIso },
    );
    expect(csv).toContain('"a,""weird"".csv"');
  });
});
