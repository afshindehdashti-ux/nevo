import { describe, it, expect } from "vitest";
import { assembleCsv, buildPreamble, computeSha256Hex, csvEscape } from "../purge-csv-preamble";
import {
  shouldOpenAfterVerify,
  verifyCsvExportForAudit,
  type VerifierSupabaseClient,
} from "../verify-csv-export.functions";

// These tests drive the server verifier's pure core with a stubbed Supabase
// client and lock down the failure statuses the browser Verify & open flow
// relies on to refuse opening an untrusted file:
//   - missing audit row       → thrown error, dialog stays closed
//   - missing embedded SHA row → status "malformed" with "missing-sha-row"
//   - unexpected CSV structure → status "malformed" with "missing-payload-marker"
// In every failure path `shouldOpenAfterVerify(result)` must be false (or
// the call must throw), so the browser never calls `window.open`.

const USER_ID = "00000000-0000-0000-0000-000000000001";
const AUDIT_ID = "11111111-1111-1111-1111-111111111111";
const ISO = "2026-07-08T10:15:20.000Z";
const PAYLOAD = 'col_a,col_b\n"hello","world"\n';

interface StubOptions {
  role?: boolean;
  row?: { id: string; filename: string; sha256: string; created_at: string } | null;
  rpcError?: string;
  rowError?: string;
}

function makeSupabaseStub(opts: StubOptions): VerifierSupabaseClient {
  return {
    async rpc() {
      if (opts.rpcError) return { data: null, error: { message: opts.rpcError } };
      return { data: opts.role ?? true, error: null };
    },
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  if (opts.rowError) return { data: null, error: { message: opts.rowError } };
                  return { data: opts.row ?? null, error: null };
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("verifyCsvExportForAudit — server-side failure statuses", () => {
  it("throws a clear error when the audit row does not exist", async () => {
    const supabase = makeSupabaseStub({ role: true, row: null });
    await expect(
      verifyCsvExportForAudit(supabase, USER_ID, {
        audit_id: AUDIT_ID,
        file_text: "irrelevant",
      }),
    ).rejects.toThrow("Audit record not found.");
    // The client's try/catch on `verifyFn(...)` catches this and never calls
    // shouldOpenAfterVerify, so the file is not opened.
  });

  it("returns status 'malformed' with 'missing-sha-row' when the SHA preamble row is missing", async () => {
    const sha = await computeSha256Hex(PAYLOAD);
    // Craft a CSV that has the payload marker + timestamp row but NO SHA row.
    const withoutShaRow =
      `${csvEscape("Exported at (ISO 8601 UTC)")},${csvEscape(ISO)}\n` +
      `${csvEscape("--- PAYLOAD BELOW ---")}\n` +
      PAYLOAD;
    const supabase = makeSupabaseStub({
      role: true,
      row: {
        id: AUDIT_ID,
        filename: "export.csv",
        sha256: sha,
        created_at: ISO,
      },
    });
    const { result } = await verifyCsvExportForAudit(supabase, USER_ID, {
      audit_id: AUDIT_ID,
      file_text: withoutShaRow,
    });
    expect(result.status).toBe("malformed");
    if (result.status === "malformed") {
      expect(result.issues).toContain("missing-sha-row");
    }
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("returns status 'malformed' with 'missing-payload-marker' for unexpected CSV structure", async () => {
    const sha = await computeSha256Hex(PAYLOAD);
    // A bare CSV with no NEVO preamble at all — the exporter never produced it,
    // or it was truncated in transit.
    const bare = PAYLOAD;
    const supabase = makeSupabaseStub({
      role: true,
      row: {
        id: AUDIT_ID,
        filename: "export.csv",
        sha256: sha,
        created_at: ISO,
      },
    });
    const { result } = await verifyCsvExportForAudit(supabase, USER_ID, {
      audit_id: AUDIT_ID,
      file_text: bare,
    });
    expect(result.status).toBe("malformed");
    if (result.status === "malformed") {
      expect(result.issues).toContain("missing-payload-marker");
      expect(result.hasMarker).toBe(false);
    }
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("throws when the caller lacks the required role", async () => {
    const supabase = makeSupabaseStub({ role: false });
    await expect(
      verifyCsvExportForAudit(supabase, USER_ID, {
        audit_id: AUDIT_ID,
        file_text: "irrelevant",
      }),
    ).rejects.toThrow("Not authorised to verify CSV exports.");
  });

  it("returns status 'match' for a well-formed CSV with the recorded SHA (control)", async () => {
    const sha = await computeSha256Hex(PAYLOAD);
    const csv = assembleCsv({ sha256: sha, exportedAtIso: ISO, payloadCsv: PAYLOAD });
    const supabase = makeSupabaseStub({
      role: true,
      row: {
        id: AUDIT_ID,
        filename: "export.csv",
        sha256: sha,
        created_at: ISO,
      },
    });
    const { result, audit } = await verifyCsvExportForAudit(supabase, USER_ID, {
      audit_id: AUDIT_ID,
      file_text: csv,
    });
    expect(result.status).toBe("match");
    expect(audit.sha256).toBe(sha);
    expect(shouldOpenAfterVerify(result)).toBe(true);
    // Sanity: a valid preamble produced by buildPreamble round-trips through
    // parsePreambleAndSplitPayload — the CSV we asserted "match" on is not
    // structurally trivial.
    expect(buildPreamble({ sha256: sha, exportedAtIso: ISO })).toContain("--- PAYLOAD BELOW ---");
  });
});
