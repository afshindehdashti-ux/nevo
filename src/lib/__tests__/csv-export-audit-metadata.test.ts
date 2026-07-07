import { describe, expect, it } from "vitest";

import {
  buildEmbeddedAuditMetadata,
  detectShaDrift,
} from "@/lib/csv-export-audit-metadata";
import {
  PAYLOAD_MARKER,
  SHA_LABEL,
  TIMESTAMP_LABEL,
  assembleCsv,
  parsePreambleAndSplitPayload,
} from "@/lib/purge-csv-preamble";

const SAMPLE_SHA =
  "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
const SAMPLE_ISO = "2026-07-07T12:34:56.000Z";

describe("buildEmbeddedAuditMetadata", () => {
  it("persists embedded_sha256 and embedded_exported_at_iso from preamble values", () => {
    const md = buildEmbeddedAuditMetadata({
      sha256: SAMPLE_SHA,
      exportedAtIso: SAMPLE_ISO,
    });
    expect(md.embedded_sha256).toBe(SAMPLE_SHA);
    expect(md.embedded_exported_at_iso).toBe(SAMPLE_ISO);
    expect(md.preamble).toEqual({
      sha_label: SHA_LABEL,
      timestamp_label: TIMESTAMP_LABEL,
      payload_marker: PAYLOAD_MARKER,
    });
  });

  it("merges caller-provided extras without overriding the embedded fields", () => {
    const md = buildEmbeddedAuditMetadata({
      sha256: SAMPLE_SHA,
      exportedAtIso: SAMPLE_ISO,
      extra: {
        invoice_number: "INV-1",
        // Attempted override must NOT win — compliance requires the real
        // preamble values to be persisted.
        embedded_sha256: "0".repeat(64),
      },
    });
    expect(md.invoice_number).toBe("INV-1");
    expect(md.embedded_sha256).toBe(SAMPLE_SHA);
  });

  it("matches what parsePreambleAndSplitPayload extracts from the assembled CSV", () => {
    const csv = assembleCsv({
      sha256: SAMPLE_SHA,
      exportedAtIso: SAMPLE_ISO,
      payloadCsv: "id,name\n1,ok\n",
    });
    const parsed = parsePreambleAndSplitPayload(csv);
    const md = buildEmbeddedAuditMetadata({
      sha256: SAMPLE_SHA,
      exportedAtIso: SAMPLE_ISO,
    });
    // Whatever the exporter persists in metadata MUST equal what the file
    // itself carries in its preamble.
    expect(parsed.embeddedSha).toBe(md.embedded_sha256);
    expect(parsed.embeddedExportedAt).toBe(md.embedded_exported_at_iso);
  });
});

describe("detectShaDrift (UI flag)", () => {
  it("returns false when embedded_sha256 matches the top-level sha256", () => {
    expect(
      detectShaDrift({
        sha256: SAMPLE_SHA,
        metadata: { embedded_sha256: SAMPLE_SHA },
      }),
    ).toBe(false);
  });

  it("is case-insensitive when comparing hex digests", () => {
    expect(
      detectShaDrift({
        sha256: SAMPLE_SHA.toUpperCase(),
        metadata: { embedded_sha256: SAMPLE_SHA },
      }),
    ).toBe(false);
  });

  it("returns true when embedded_sha256 differs from the top-level sha256", () => {
    expect(
      detectShaDrift({
        sha256: SAMPLE_SHA,
        metadata: { embedded_sha256: "0".repeat(64) },
      }),
    ).toBe(true);
  });

  it("does NOT flag drift when embedded_sha256 is absent (older rows)", () => {
    expect(detectShaDrift({ sha256: SAMPLE_SHA, metadata: {} })).toBe(false);
    expect(detectShaDrift({ sha256: SAMPLE_SHA, metadata: null })).toBe(false);
    expect(
      detectShaDrift({
        sha256: SAMPLE_SHA,
        metadata: { embedded_sha256: "" },
      }),
    ).toBe(false);
  });

  it("ignores non-string embedded_sha256 values", () => {
    expect(
      detectShaDrift({
        sha256: SAMPLE_SHA,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: { embedded_sha256: 12345 } as any,
      }),
    ).toBe(false);
  });
});
