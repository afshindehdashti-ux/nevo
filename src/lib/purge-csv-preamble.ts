/**
 * Pure helpers for the invoice purge-audit CSV export preamble.
 *
 * The exported CSV format is:
 *   "SHA-256 (of payload below)","<hex-or-(unavailable)>"
 *   "Export Timestamp (ISO)","<iso-8601>"
 *   "--- PAYLOAD BELOW ---"
 *   <payload csv...>
 *
 * The embedded SHA-256 covers ONLY the bytes AFTER the payload-marker line
 * (i.e. the payload CSV). This keeps the file self-verifying: the file
 * carries the hash of its own payload without changing that payload's bytes.
 */

export const SHA_LABEL = "SHA-256 (of payload below)";
export const TIMESTAMP_LABEL = "Export Timestamp (ISO)";
export const PAYLOAD_MARKER = "--- PAYLOAD BELOW ---";

/** Line (including trailing newline) that separates preamble from payload. */
export const PAYLOAD_MARKER_LINE = `"${PAYLOAD_MARKER}"\n`;

/** RFC-4180-ish CSV escape: wrap in quotes and double-up embedded quotes. */
export function csvEscape(value: string): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

/** Inverse of csvEscape for a single fully-quoted field. */
function csvUnquote(v: string): string {
  return v.startsWith('"') && v.endsWith('"')
    ? v.slice(1, -1).replace(/""/g, '"')
    : v;
}

/**
 * Build the full CSV string by prepending the preamble to a payload CSV.
 * Given the same inputs this is deterministic and byte-stable.
 */
export function buildPreamble(opts: {
  sha256: string;
  exportedAtIso: string;
}): string {
  return [
    `${csvEscape(SHA_LABEL)},${csvEscape(opts.sha256 || "(unavailable)")}`,
    `${csvEscape(TIMESTAMP_LABEL)},${csvEscape(opts.exportedAtIso)}`,
    csvEscape(PAYLOAD_MARKER),
    "",
  ].join("\n");
}

export function assembleCsv(opts: {
  sha256: string;
  exportedAtIso: string;
  payloadCsv: string;
}): string {
  return buildPreamble(opts) + opts.payloadCsv;
}

export interface ParsedPreamble {
  embeddedSha?: string;
  embeddedExportedAt?: string;
  payload: string;
  /** True when the payload marker line was found. */
  hasMarker: boolean;
}

/** Parse a full CSV into its preamble fields and payload body. */
export function parsePreambleAndSplitPayload(text: string): ParsedPreamble {
  const idx = text.indexOf(PAYLOAD_MARKER_LINE);
  const hasMarker = idx >= 0;
  const preamble = hasMarker ? text.slice(0, idx) : "";
  const payload = hasMarker ? text.slice(idx + PAYLOAD_MARKER_LINE.length) : text;

  let embeddedSha: string | undefined;
  let embeddedExportedAt: string | undefined;
  for (const line of preamble.split("\n")) {
    const m = line.match(/^("(?:[^"]|"")*"),("(?:[^"]|"")*")$/);
    if (!m) continue;
    const label = csvUnquote(m[1]);
    const value = csvUnquote(m[2]);
    if (label === SHA_LABEL) embeddedSha = value;
    else if (label === TIMESTAMP_LABEL) embeddedExportedAt = value;
  }
  return { embeddedSha, embeddedExportedAt, payload, hasMarker };
}

const HEX_SHA256 = /^[a-f0-9]{64}$/i;
export function isValidSha256Hex(value: string | undefined | null): boolean {
  return !!value && HEX_SHA256.test(value);
}

/**
 * Compute SHA-256 of a UTF-8 string using WebCrypto and return lowercase hex.
 * Available in Node 20+ (globalThis.crypto.subtle) and in browsers.
 */
export async function computeSha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Reasons a CSV can fail structural validation before the hash check runs.
 * These map to the user-facing "malformed file" alerts in the UI.
 */
export type CsvStructureIssue =
  | "empty-file"
  | "missing-payload-marker"
  | "missing-sha-row"
  | "invalid-sha-format"
  | "missing-timestamp-row"
  | "invalid-timestamp-format"
  | "empty-payload";

export interface CsvStructureReport {
  ok: boolean;
  issues: CsvStructureIssue[];
  hasMarker: boolean;
  embeddedSha?: string;
  embeddedExportedAt?: string;
  payload: string;
}

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * Structural pre-flight for a downloaded export CSV. Runs before hashing so
 * the UI can surface a clear "file structure is malformed" alert instead of
 * a bare checksum mismatch when the preamble is missing / corrupt.
 */
export function inspectCsvStructure(text: string): CsvStructureReport {
  const issues: CsvStructureIssue[] = [];
  if (!text || text.length === 0) {
    return {
      ok: false,
      issues: ["empty-file"],
      hasMarker: false,
      payload: "",
    };
  }
  const parsed = parsePreambleAndSplitPayload(text);
  if (!parsed.hasMarker) issues.push("missing-payload-marker");
  if (parsed.embeddedSha === undefined) issues.push("missing-sha-row");
  else if (
    !isValidSha256Hex(parsed.embeddedSha) &&
    parsed.embeddedSha !== "(unavailable)"
  )
    issues.push("invalid-sha-format");
  if (parsed.embeddedExportedAt === undefined) issues.push("missing-timestamp-row");
  else if (!ISO_8601.test(parsed.embeddedExportedAt))
    issues.push("invalid-timestamp-format");
  if (parsed.hasMarker && parsed.payload.length === 0) issues.push("empty-payload");
  return {
    ok: issues.length === 0,
    issues,
    hasMarker: parsed.hasMarker,
    embeddedSha: parsed.embeddedSha,
    embeddedExportedAt: parsed.embeddedExportedAt,
    payload: parsed.payload,
  };
}

const STRUCTURE_ISSUE_MESSAGES: Record<CsvStructureIssue, string> = {
  "empty-file": "The file is empty.",
  "missing-payload-marker":
    'The "--- PAYLOAD BELOW ---" marker line is missing — this file was not produced by the NEVO exporter or has been truncated.',
  "missing-sha-row": "The preamble is missing the SHA-256 row.",
  "invalid-sha-format":
    "The embedded SHA-256 value is not a 64-character hex digest.",
  "missing-timestamp-row": "The preamble is missing the Export Timestamp row.",
  "invalid-timestamp-format":
    "The embedded Export Timestamp is not a valid ISO-8601 value.",
  "empty-payload": "The payload section (after the marker) is empty.",
};

export function describeStructureIssue(issue: CsvStructureIssue): string {
  return STRUCTURE_ISSUE_MESSAGES[issue];
}

export type VerifyResult =
  | {
      status: "match";
      computedSha: string;
      expected: string;
      embeddedSha?: string;
      embeddedExportedAt?: string;
    }
  | {
      status: "mismatch";
      computedSha: string;
      expected: string;
      embeddedSha?: string;
      embeddedExportedAt?: string;
    }
  | {
      status: "no-expected";
      computedSha: string;
      embeddedSha?: string;
      embeddedExportedAt?: string;
    }
  | {
      status: "malformed";
      issues: CsvStructureIssue[];
      messages: string[];
      hasMarker: boolean;
      embeddedSha?: string;
      embeddedExportedAt?: string;
    };

/**
 * Verify a downloaded CSV against an expected checksum. When no expected
 * value is supplied, falls back to the SHA embedded in the file preamble.
 * If the file's structure is invalid (e.g. the payload marker is missing),
 * returns `status: "malformed"` BEFORE attempting a hash comparison.
 */
export async function verifyCsvText(
  text: string,
  opts: { expectedSha?: string } = {},
): Promise<VerifyResult> {
  const structure = inspectCsvStructure(text);
  if (!structure.ok) {
    return {
      status: "malformed",
      issues: structure.issues,
      messages: structure.issues.map(describeStructureIssue),
      hasMarker: structure.hasMarker,
      embeddedSha: structure.embeddedSha,
      embeddedExportedAt: structure.embeddedExportedAt,
    };
  }
  const computedSha = await computeSha256Hex(structure.payload);
  const expected =
    opts.expectedSha ||
    (isValidSha256Hex(structure.embeddedSha) ? structure.embeddedSha : undefined);

  if (!expected) {
    return {
      status: "no-expected",
      computedSha,
      embeddedSha: structure.embeddedSha,
      embeddedExportedAt: structure.embeddedExportedAt,
    };
  }
  const matches = computedSha.toLowerCase() === expected.toLowerCase();
  return {
    status: matches ? "match" : "mismatch",
    computedSha,
    expected,
    embeddedSha: structure.embeddedSha,
    embeddedExportedAt: structure.embeddedExportedAt,
  };
}
