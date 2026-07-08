import { describe, it, expect } from "vitest";
import {
  buildVerificationReport,
  type BlockedVerification,
} from "../BlockedVerificationDialog";
import type { CsvExportAuditRecord } from "@/lib/invoice-purge-audit.functions";

// Snapshot tests for the one-click "Copy verification report" payload.
//
// This is the exact text auditors paste into tickets, so the "Expected
// SHA-256" and "Computed SHA-256" lines — and the labels around them —
// must not silently drift. Any accidental rename, reorder or drop of
// those fields breaks these snapshots on purpose.

const EXPECTED_SHA =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const COMPUTED_SHA =
  "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const EMBEDDED_SHA =
  "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
const EMBEDDED_TS = "2026-07-07T22:05:50.123Z";

const AUDIT_ROW: CsvExportAuditRecord = {
  id: "00000000-0000-0000-0000-000000000001",
  created_at: EMBEDDED_TS,
  user_id: "00000000-0000-0000-0000-000000000002",
  export_type: "invoice_purge",
  filename: "invoice-purge-2026-07-07.csv",
  sha256: EXPECTED_SHA,
  byte_size: 1024,
  row_count: 10,
  scope: null,
  entity_type: null,
  entity_id: null,
  filters: {},
  metadata: {},
};

describe("buildVerificationReport — clipboard payload snapshots", () => {
  it("MISMATCH: expected vs computed SHA-256 fields appear verbatim", () => {
    const blocked: BlockedVerification = {
      filename: "downloaded-copy.csv",
      row: AUDIT_ROW,
      result: {
        status: "mismatch",
        expected: EXPECTED_SHA,
        computedSha: COMPUTED_SHA,
        embeddedSha: EMBEDDED_SHA,
        embeddedExportedAt: EMBEDDED_TS,
      },
    };
    const report = buildVerificationReport(blocked);
    expect(report).toMatchInlineSnapshot(`
      "Verification: MISMATCH
      Selected file: downloaded-copy.csv
      Audit filename: invoice-purge-2026-07-07.csv
      Payload marker present: true
      Embedded SHA-256: cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
      Embedded timestamp: 2026-07-07T22:05:50.123Z
      Expected SHA-256: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      Computed SHA-256: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    `);
    // Explicit field-level assertions so a snapshot re-accept can't
    // silently swap the two SHA values.
    expect(report).toContain(`Expected SHA-256: ${EXPECTED_SHA}`);
    expect(report).toContain(`Computed SHA-256: ${COMPUTED_SHA}`);
  });

  it("MALFORMED (missing marker): falls back to audit SHA as expected, no computed value", () => {
    const blocked: BlockedVerification = {
      filename: "truncated.csv",
      row: AUDIT_ROW,
      result: {
        status: "malformed",
        issues: ["missing-payload-marker", "missing-sha-row"],
        messages: ["marker missing", "sha row missing"],
        hasMarker: false,
      },
    };
    const report = buildVerificationReport(blocked);
    expect(report).toMatchInlineSnapshot(`
      "Verification: MALFORMED
      Selected file: truncated.csv
      Audit filename: invoice-purge-2026-07-07.csv
      Payload marker present: false
      Embedded SHA-256: (missing)
      Embedded timestamp: (missing)
      Expected SHA-256: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      Computed SHA-256: (not computed)
      Issues: missing-payload-marker, missing-sha-row"
    `);
    expect(report).toContain(`Expected SHA-256: ${EXPECTED_SHA}`);
    expect(report).toContain("Computed SHA-256: (not computed)");
  });
});
