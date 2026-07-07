import { describe, it, expect } from "vitest";
import {
  SHA_LABEL,
  TIMESTAMP_LABEL,
  PAYLOAD_MARKER,
  PAYLOAD_MARKER_LINE,
  csvEscape,
  buildPreamble,
  assembleCsv,
  parsePreambleAndSplitPayload,
  computeSha256Hex,
  isValidSha256Hex,
  verifyCsvText,
  inspectCsvStructure,
  describeStructureIssue,
} from "../purge-csv-preamble";

const ISO = "2026-07-07T22:05:50.123Z";
const PAYLOAD = 'col_a,col_b\n"hello","world"\n"a,b","he said ""hi"""\n';

async function makeExport(payload = PAYLOAD, exportedAt = ISO) {
  const sha = await computeSha256Hex(payload);
  return { sha, csv: assembleCsv({ sha256: sha, exportedAtIso: exportedAt, payloadCsv: payload }) };
}

describe("preamble constants", () => {
  it("payload marker line ends with a newline and quotes the marker text", () => {
    expect(PAYLOAD_MARKER_LINE).toBe(`"${PAYLOAD_MARKER}"\n`);
  });
});

describe("csvEscape", () => {
  it("wraps values in double quotes", () => {
    expect(csvEscape("plain")).toBe('"plain"');
  });
  it("escapes embedded double quotes by doubling them", () => {
    expect(csvEscape('he said "hi"')).toBe('"he said ""hi"""');
  });
  it("preserves commas and newlines inside quoted fields", () => {
    expect(csvEscape("a,b\nc")).toBe('"a,b\nc"');
  });
});

describe("buildPreamble", () => {
  it("produces the exact 4-line format the verifier expects", () => {
    const sha = "a".repeat(64);
    const p = buildPreamble({ sha256: sha, exportedAtIso: ISO });
    expect(p).toBe(
      `"${SHA_LABEL}","${sha}"\n"${TIMESTAMP_LABEL}","${ISO}"\n"${PAYLOAD_MARKER}"\n`,
    );
  });
  it("falls back to (unavailable) when SHA is empty", () => {
    const p = buildPreamble({ sha256: "", exportedAtIso: ISO });
    expect(p).toContain(`"${SHA_LABEL}","(unavailable)"`);
  });
  it("preamble always ends with the payload-marker line so payload starts immediately after", () => {
    const p = buildPreamble({ sha256: "b".repeat(64), exportedAtIso: ISO });
    expect(p.endsWith(PAYLOAD_MARKER_LINE)).toBe(true);
  });
});

describe("parsePreambleAndSplitPayload", () => {
  it("round-trips: parse(assemble(x)) recovers the sha, timestamp, and payload", async () => {
    const { sha, csv } = await makeExport();
    const parsed = parsePreambleAndSplitPayload(csv);
    expect(parsed.hasMarker).toBe(true);
    expect(parsed.embeddedSha).toBe(sha);
    expect(parsed.embeddedExportedAt).toBe(ISO);
    expect(parsed.payload).toBe(PAYLOAD);
  });

  it("returns the entire text as payload when the marker is missing", () => {
    const bare = "col_a,col_b\n1,2\n";
    const parsed = parsePreambleAndSplitPayload(bare);
    expect(parsed.hasMarker).toBe(false);
    expect(parsed.payload).toBe(bare);
    expect(parsed.embeddedSha).toBeUndefined();
    expect(parsed.embeddedExportedAt).toBeUndefined();
  });

  it("tolerates preamble rows in either order", () => {
    const sha = "c".repeat(64);
    const csv =
      `"${TIMESTAMP_LABEL}","${ISO}"\n` +
      `"${SHA_LABEL}","${sha}"\n` +
      `"${PAYLOAD_MARKER}"\n` +
      PAYLOAD;
    const parsed = parsePreambleAndSplitPayload(csv);
    expect(parsed.embeddedSha).toBe(sha);
    expect(parsed.embeddedExportedAt).toBe(ISO);
    expect(parsed.payload).toBe(PAYLOAD);
  });

  it("ignores unrelated preamble rows without breaking", () => {
    const sha = "d".repeat(64);
    const csv =
      `"Some Other Field","irrelevant"\n` +
      `"${SHA_LABEL}","${sha}"\n` +
      `"${TIMESTAMP_LABEL}","${ISO}"\n` +
      `"${PAYLOAD_MARKER}"\n` +
      PAYLOAD;
    const parsed = parsePreambleAndSplitPayload(csv);
    expect(parsed.embeddedSha).toBe(sha);
    expect(parsed.embeddedExportedAt).toBe(ISO);
  });
});

describe("isValidSha256Hex", () => {
  it("accepts 64-char hex strings case-insensitively", () => {
    expect(isValidSha256Hex("a".repeat(64))).toBe(true);
    expect(isValidSha256Hex("A".repeat(64))).toBe(true);
  });
  it("rejects wrong length, non-hex chars, and empties", () => {
    expect(isValidSha256Hex("")).toBe(false);
    expect(isValidSha256Hex(undefined)).toBe(false);
    expect(isValidSha256Hex("a".repeat(63))).toBe(false);
    expect(isValidSha256Hex("a".repeat(65))).toBe(false);
    expect(isValidSha256Hex("g".repeat(64))).toBe(false);
    expect(isValidSha256Hex("(unavailable)")).toBe(false);
  });
});

describe("computeSha256Hex", () => {
  it("matches a known reference vector for the empty string", async () => {
    // sha256("") -> RFC test vector
    const empty = await computeSha256Hex("");
    expect(empty).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
  it("matches a known reference vector for 'abc'", async () => {
    const abc = await computeSha256Hex("abc");
    expect(abc).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("verifyCsvText", () => {
  it("reports match when the payload hasn't been altered", async () => {
    const { sha, csv } = await makeExport();
    const r = await verifyCsvText(csv, { expectedSha: sha });
    expect(r.status).toBe("match");
    if (r.status === "match") {
      expect(r.computedSha).toBe(sha);
      expect(r.embeddedSha).toBe(sha);
      expect(r.embeddedExportedAt).toBe(ISO);
    }
  });

  it("reports mismatch when the payload is tampered with", async () => {
    const { sha, csv } = await makeExport();
    const tampered = csv.replace('"hello"', '"HELLO"');
    const r = await verifyCsvText(tampered, { expectedSha: sha });
    expect(r.status).toBe("mismatch");
    if (r.status === "mismatch") {
      expect(r.expected).toBe(sha);
      expect(r.computedSha).not.toBe(sha);
      // Embedded sha stays what the file says (unchanged); mismatch is vs computed
      expect(r.embeddedSha).toBe(sha);
    }
  });

  it("editing the preamble (e.g. timestamp) does NOT change the payload hash", async () => {
    const { sha, csv } = await makeExport();
    const rewritten = csv.replace(ISO, "2099-01-01T00:00:00.000Z");
    const r = await verifyCsvText(rewritten, { expectedSha: sha });
    expect(r.status).toBe("match");
    if (r.status === "match") {
      expect(r.embeddedExportedAt).toBe("2099-01-01T00:00:00.000Z");
      expect(r.computedSha).toBe(sha);
    }
  });

  it("falls back to the embedded SHA when no expected value is supplied", async () => {
    const { sha, csv } = await makeExport();
    const r = await verifyCsvText(csv);
    expect(r.status).toBe("match");
    if (r.status === "match") expect(r.expected).toBe(sha);
  });

  it("returns malformed when the file has no preamble (bare CSV, no marker)", async () => {
    const bare = "col_a,col_b\n1,2\n";
    const r = await verifyCsvText(bare);
    expect(r.status).toBe("malformed");
    if (r.status === "malformed") {
      expect(r.issues).toContain("missing-payload-marker");
      expect(r.issues).toContain("missing-sha-row");
      expect(r.issues).toContain("missing-timestamp-row");
    }
  });

  it("returns malformed when the embedded sha is not a valid hex digest", async () => {
    const csv =
      `"${SHA_LABEL}","not-a-real-hash"\n` +
      `"${TIMESTAMP_LABEL}","${ISO}"\n` +
      PAYLOAD_MARKER_LINE +
      PAYLOAD;
    const r = await verifyCsvText(csv);
    expect(r.status).toBe("malformed");
    if (r.status === "malformed") {
      expect(r.issues).toContain("invalid-sha-format");
      expect(r.embeddedSha).toBe("not-a-real-hash");
    }
  });

  it("is case-insensitive when comparing expected vs computed sha", async () => {
    const { sha, csv } = await makeExport();
    const r = await verifyCsvText(csv, { expectedSha: sha.toUpperCase() });
    expect(r.status).toBe("match");
  });
});

describe("inspectCsvStructure (payload-marker + preamble validation)", () => {
  it("passes for a well-formed export", async () => {
    const { csv } = await makeExport();
    const report = inspectCsvStructure(csv);
    expect(report.ok).toBe(true);
    expect(report.hasMarker).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("flags empty-file for an empty string", () => {
    const report = inspectCsvStructure("");
    expect(report.ok).toBe(false);
    expect(report.issues).toEqual(["empty-file"]);
    expect(report.hasMarker).toBe(false);
  });

  it("flags missing-payload-marker when the marker line is gone", () => {
    const sha = "e".repeat(64);
    const csv =
      `"${SHA_LABEL}","${sha}"\n` +
      `"${TIMESTAMP_LABEL}","${ISO}"\n` +
      // marker deliberately omitted
      PAYLOAD;
    const report = inspectCsvStructure(csv);
    expect(report.hasMarker).toBe(false);
    expect(report.issues).toContain("missing-payload-marker");
    expect(report.ok).toBe(false);
  });

  it("still flags missing-payload-marker when the marker text appears un-quoted or on the wrong line", () => {
    const sha = "f".repeat(64);
    // marker text present but NOT as its own quoted CSV line — should still fail
    const csv =
      `"${SHA_LABEL}","${sha}"\n` +
      `"${TIMESTAMP_LABEL}","${ISO}"\n` +
      `--- PAYLOAD BELOW ---\n` + // missing surrounding quotes
      PAYLOAD;
    const report = inspectCsvStructure(csv);
    expect(report.issues).toContain("missing-payload-marker");
  });

  it("flags missing-sha-row when the SHA preamble line is stripped", () => {
    const csv =
      `"${TIMESTAMP_LABEL}","${ISO}"\n` +
      PAYLOAD_MARKER_LINE +
      PAYLOAD;
    const report = inspectCsvStructure(csv);
    expect(report.issues).toContain("missing-sha-row");
  });

  it("flags missing-timestamp-row when the timestamp preamble line is stripped", () => {
    const sha = "1".repeat(64);
    const csv =
      `"${SHA_LABEL}","${sha}"\n` +
      PAYLOAD_MARKER_LINE +
      PAYLOAD;
    const report = inspectCsvStructure(csv);
    expect(report.issues).toContain("missing-timestamp-row");
  });

  it("flags invalid-timestamp-format for a non-ISO timestamp", () => {
    const sha = "2".repeat(64);
    const csv =
      `"${SHA_LABEL}","${sha}"\n` +
      `"${TIMESTAMP_LABEL}","07/07/2026 5:05 PM"\n` +
      PAYLOAD_MARKER_LINE +
      PAYLOAD;
    const report = inspectCsvStructure(csv);
    expect(report.issues).toContain("invalid-timestamp-format");
  });

  it("flags empty-payload when marker is present but nothing follows it", () => {
    const sha = "3".repeat(64);
    const csv =
      `"${SHA_LABEL}","${sha}"\n` +
      `"${TIMESTAMP_LABEL}","${ISO}"\n` +
      PAYLOAD_MARKER_LINE;
    const report = inspectCsvStructure(csv);
    expect(report.issues).toContain("empty-payload");
  });

  it("accepts the (unavailable) sha sentinel written when hashing fails", () => {
    const csv =
      `"${SHA_LABEL}","(unavailable)"\n` +
      `"${TIMESTAMP_LABEL}","${ISO}"\n` +
      PAYLOAD_MARKER_LINE +
      PAYLOAD;
    const report = inspectCsvStructure(csv);
    expect(report.issues).not.toContain("invalid-sha-format");
  });

  it("describeStructureIssue returns a human-readable message for every issue code", () => {
    const codes = [
      "empty-file",
      "missing-payload-marker",
      "missing-sha-row",
      "invalid-sha-format",
      "missing-timestamp-row",
      "invalid-timestamp-format",
      "empty-payload",
    ] as const;
    for (const c of codes) {
      const msg = describeStructureIssue(c);
      expect(msg.length).toBeGreaterThan(5);
    }
    // The marker-missing message must name the marker text so users can act on it.
    expect(describeStructureIssue("missing-payload-marker")).toContain(
      PAYLOAD_MARKER,
    );
  });
});

describe("verifyCsvText — malformed path is preferred over hash check", () => {
  it("returns malformed (not mismatch) when marker is missing, even if a valid expected sha is provided", async () => {
    const sha = "4".repeat(64);
    const csv =
      `"${SHA_LABEL}","${sha}"\n` +
      `"${TIMESTAMP_LABEL}","${ISO}"\n` +
      // no marker
      PAYLOAD;
    const r = await verifyCsvText(csv, { expectedSha: sha });
    expect(r.status).toBe("malformed");
    if (r.status === "malformed") {
      expect(r.messages.length).toBeGreaterThan(0);
      expect(r.issues).toContain("missing-payload-marker");
    }
  });
});

