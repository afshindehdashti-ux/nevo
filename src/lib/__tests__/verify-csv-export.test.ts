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

// Edge-case CSV parsing: the preamble parser is strict on purpose — any
// deviation (extra preamble columns, misspelled labels, marker line that
// isn't the exact quoted PAYLOAD_MARKER on its own) must fall into the
// "malformed" bucket so the browser never opens the file. Payload columns
// themselves are opaque bytes; only the exact SHA-256 over those bytes
// unlocks opening.
describe("Verify & open — edge-case CSV parsing", () => {
  it("blocks when preamble labels are misspelled (missing-sha-row + missing-timestamp-row)", async () => {
    const { sha } = await makeValidExport();
    const bad =
      '"SHA-256","' + sha + '"\n' +
      '"Exported At","' + ISO + '"\n' +
      '"--- PAYLOAD BELOW ---"\n' +
      PAYLOAD;
    const result = await verifyCsvText(bad, { expectedSha: sha });
    expect(result.status).toBe("malformed");
    if (result.status === "malformed") {
      expect(result.issues).toContain("missing-sha-row");
      expect(result.issues).toContain("missing-timestamp-row");
    }
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("blocks when preamble rows have extra columns (label regex requires exactly 2 quoted fields)", async () => {
    const { sha } = await makeValidExport();
    const bad =
      '"SHA-256 (of payload below)","' + sha + '","extra"\n' +
      '"Export Timestamp (ISO)","' + ISO + '","extra"\n' +
      '"--- PAYLOAD BELOW ---"\n' +
      PAYLOAD;
    const result = await verifyCsvText(bad, { expectedSha: sha });
    expect(result.status).toBe("malformed");
    if (result.status === "malformed") {
      expect(result.issues).toContain("missing-sha-row");
    }
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("blocks a malformed marker block (marker not quoted / trailing junk)", async () => {
    const { sha } = await makeValidExport();
    const bad =
      '"SHA-256 (of payload below)","' + sha + '"\n' +
      '"Export Timestamp (ISO)","' + ISO + '"\n' +
      '--- PAYLOAD BELOW ---\n' +
      PAYLOAD;
    const result = await verifyCsvText(bad, { expectedSha: sha });
    expect(result.status).toBe("malformed");
    if (result.status === "malformed") {
      expect(result.hasMarker).toBe(false);
      expect(result.issues).toContain("missing-payload-marker");
    }
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("blocks when the marker line carries a trailing suffix on the same line", async () => {
    const { sha } = await makeValidExport();
    const bad =
      '"SHA-256 (of payload below)","' + sha + '"\n' +
      '"Export Timestamp (ISO)","' + ISO + '"\n' +
      '"--- PAYLOAD BELOW ---",extra\n' +
      PAYLOAD;
    const result = await verifyCsvText(bad, { expectedSha: sha });
    expect(result.status).toBe("malformed");
    if (result.status === "malformed") {
      expect(result.issues).toContain("missing-payload-marker");
    }
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("blocks when the embedded SHA is not a 64-char hex digest", async () => {
    const bad =
      '"SHA-256 (of payload below)","not-a-real-sha"\n' +
      '"Export Timestamp (ISO)","' + ISO + '"\n' +
      '"--- PAYLOAD BELOW ---"\n' +
      PAYLOAD;
    const result = await verifyCsvText(bad, { expectedSha: "a".repeat(64) });
    expect(result.status).toBe("malformed");
    if (result.status === "malformed") {
      expect(result.issues).toContain("invalid-sha-format");
    }
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("blocks when the payload marker exists but the payload is empty", async () => {
    const bad =
      '"SHA-256 (of payload below)","' + "a".repeat(64) + '"\n' +
      '"Export Timestamp (ISO)","' + ISO + '"\n' +
      '"--- PAYLOAD BELOW ---"\n';
    const result = await verifyCsvText(bad, { expectedSha: "a".repeat(64) });
    expect(result.status).toBe("malformed");
    if (result.status === "malformed") {
      expect(result.issues).toContain("empty-payload");
    }
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("blocks when the embedded timestamp is not ISO-8601", async () => {
    const { sha } = await makeValidExport();
    const bad =
      '"SHA-256 (of payload below)","' + sha + '"\n' +
      '"Export Timestamp (ISO)","yesterday"\n' +
      '"--- PAYLOAD BELOW ---"\n' +
      PAYLOAD;
    const result = await verifyCsvText(bad, { expectedSha: sha });
    expect(result.status).toBe("malformed");
    if (result.status === "malformed") {
      expect(result.issues).toContain("invalid-timestamp-format");
    }
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("blocks a payload with EXTRA columns even when the preamble is well-formed (hash covers exact payload bytes)", async () => {
    const { sha } = await makeValidExport();
    const tamperedPayload =
      'col_a,col_b,col_c\n"hello","world","injected"\n"a,b","he said ""hi""","x"\n';
    const csv =
      '"SHA-256 (of payload below)","' + sha + '"\n' +
      '"Export Timestamp (ISO)","' + ISO + '"\n' +
      '"--- PAYLOAD BELOW ---"\n' +
      tamperedPayload;
    const result = await verifyCsvText(csv, { expectedSha: sha });
    expect(result.status).toBe("mismatch");
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("blocks a payload with RENAMED header columns (any byte change breaks the hash)", async () => {
    const { sha } = await makeValidExport();
    const renamed = PAYLOAD.replace("col_a,col_b", "column_a,column_b");
    const csv =
      '"SHA-256 (of payload below)","' + sha + '"\n' +
      '"Export Timestamp (ISO)","' + ISO + '"\n' +
      '"--- PAYLOAD BELOW ---"\n' +
      renamed;
    const result = await verifyCsvText(csv, { expectedSha: sha });
    expect(result.status).toBe("mismatch");
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("blocks an empty file up-front (empty-file structural issue)", async () => {
    const result = await verifyCsvText("", { expectedSha: "a".repeat(64) });
    expect(result.status).toBe("malformed");
    if (result.status === "malformed") {
      expect(result.issues).toContain("empty-file");
    }
    expect(shouldOpenAfterVerify(result)).toBe(false);
  });

  it("allows opening ONLY when preamble is well-formed AND SHA matches the exact payload bytes", async () => {
    const { sha, csv } = await makeValidExport();
    const result = await verifyCsvText(csv, { expectedSha: sha });
    expect(result.status).toBe("match");
    if (result.status === "match") {
      expect(result.computedSha).toBe(sha);
      expect(result.expected).toBe(sha);
    }
    expect(shouldOpenAfterVerify(result)).toBe(true);
  });
});
