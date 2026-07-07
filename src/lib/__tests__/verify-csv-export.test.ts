import { describe, it, expect } from "vitest";
import {
  assembleCsv,
  computeSha256Hex,
  verifyCsvText,
} from "../purge-csv-preamble";
import { shouldOpenAfterVerify } from "../verify-csv-export.functions";

const ISO = "2026-07-07T22:05:50.123Z";
const PAYLOAD = 'col_a,col_b\n"hello","world"\n"a,b","he said ""hi"""\n';

async function makeValidExport() {
  const sha = await computeSha256Hex(PAYLOAD);
  const csv = assembleCsv({ sha256: sha, exportedAtIso: ISO, payloadCsv: PAYLOAD });
  return { sha, csv };
}

// These tests lock down the two guarantees of the Verify & open flow:
//   1. verifyCsvText — the exact function the server calls — returns
//      "malformed" | "mismatch" | "match" for the three input classes.
//   2. shouldOpenAfterVerify — the single gate the browser uses — only
//      returns true for "match". Any regression here re-opens the door to
//      opening an unverified file.

describe("Verify & open — server verification behaviour", () => {
  it("blocks a malformed CSV (missing payload marker) before hashing", async () => {
    const { sha } = await makeValidExport();
    const bare = 'col_a,col_b\n"hello","world"\n'; // no preamble, no marker
    const result = await verifyCsvText(bare, { expectedSha: sha });
    expect(result.status).toBe("malformed");
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("blocks a CSV whose payload was tampered with (SHA mismatch)", async () => {
    const { sha, csv } = await makeValidExport();
    const tampered = csv.replace("hello", "HELLO");
    const result = await verifyCsvText(tampered, { expectedSha: sha });
    expect(result.status).toBe("mismatch");
    if (result.status === "mismatch") {
      expect(result.computedSha).not.toBe(sha);
    }
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("blocks when the expected SHA does not match the file's hash", async () => {
    const { csv } = await makeValidExport();
    const wrongSha = "0".repeat(64);
    const result = await verifyCsvText(csv, { expectedSha: wrongSha });
    expect(result.status).toBe("mismatch");
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("allows only the exact SHA-256 match", async () => {
    const { sha, csv } = await makeValidExport();
    const result = await verifyCsvText(csv, { expectedSha: sha });
    expect(result.status).toBe("match");
    expect(shouldOpenAfterVerify(result)).toBe(true);
  });
});

describe("shouldOpenAfterVerify — decision gate", () => {
  it("returns true ONLY for status === 'match'", () => {
    expect(shouldOpenAfterVerify({ status: "match", computedSha: "x", expected: "x" })).toBe(true);
    expect(shouldOpenAfterVerify({ status: "mismatch", computedSha: "x", expected: "y" })).toBe(false);
    expect(
      shouldOpenAfterVerify({
        status: "malformed",
        issues: ["missing-payload-marker"],
        messages: ["missing marker"],
        hasMarker: false,
      }),
    ).toBe(false);
    expect(
      shouldOpenAfterVerify({ status: "no-expected", computedSha: "x" }),
    ).toBe(false);
  });
});
