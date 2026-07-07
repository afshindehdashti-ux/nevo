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

  it("returns no-expected when neither an override nor a valid embedded sha exists", async () => {
    const bare = "col_a,col_b\n1,2\n";
    const r = await verifyCsvText(bare);
    expect(r.status).toBe("no-expected");
  });

  it("ignores an invalid embedded sha when falling back", async () => {
    const csv =
      `"${SHA_LABEL}","not-a-real-hash"\n` +
      `"${TIMESTAMP_LABEL}","${ISO}"\n` +
      PAYLOAD_MARKER_LINE +
      PAYLOAD;
    const r = await verifyCsvText(csv);
    expect(r.status).toBe("no-expected");
    if (r.status === "no-expected") {
      expect(r.embeddedSha).toBe("not-a-real-hash");
    }
  });

  it("is case-insensitive when comparing expected vs computed sha", async () => {
    const { sha, csv } = await makeExport();
    const r = await verifyCsvText(csv, { expectedSha: sha.toUpperCase() });
    expect(r.status).toBe("match");
  });
});
