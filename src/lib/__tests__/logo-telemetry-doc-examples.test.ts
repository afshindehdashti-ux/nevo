/**
 * Doc-tests for the JSDoc block at the top of `logo-telemetry-debug.ts`.
 *
 * Guards two things from silently drifting away from the real formatter:
 *  1. The "Copy/paste examples of a printed line" block — every wrapped
 *     example, dewrapped to one line, must equal
 *     `[nevo:logo-telemetry] ${formatLogoDecisionRecord(record)}` for the
 *     canonical record it describes.
 *  2. The "Useful grep queries for QA" block — every `grep "<pattern>"`
 *     must match at least one line in a corpus of real formatted records
 *     that covers every reason branch the queries reference.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatLogoDecisionRecord,
  type LogoDecisionRecord,
} from "../logo-telemetry";

const SOURCE = readFileSync(
  join(__dirname, "..", "logo-telemetry-debug.ts"),
  "utf8",
);

const PREFIX = "[nevo:logo-telemetry] ";

/** Strip the ` *   ` JSDoc prefix from one line. */
function stripJsdocPrefix(line: string): string {
  return line.replace(/^\s*\*\s?/, "");
}

/** Slice the JSDoc between two marker substrings (exclusive). */
function sliceBetween(haystack: string, start: string, end: string): string {
  const s = haystack.indexOf(start);
  const e = haystack.indexOf(end, s + start.length);
  if (s === -1 || e === -1) {
    throw new Error(`markers not found: ${JSON.stringify({ start, end })}`);
  }
  return haystack.slice(s + start.length, e);
}

/**
 * Parse the "Copy/paste examples" block into de-wrapped single-line
 * strings. Each example starts with a `[nevo:logo-telemetry]` line and
 * continues on the next JSDoc lines until a blank ` *` divider.
 */
function parseExamples(): string[] {
  const block = sliceBetween(
    SOURCE,
    "the actual output is one continuous line):",
    "Useful grep queries for QA:",
  );
  const lines = block.split("\n").map(stripJsdocPrefix);
  const examples: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length > 0) {
      examples.push(current.join(" ").replace(/\s+/g, " ").trim());
      current = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      flush();
      continue;
    }
    if (line.startsWith("[nevo:logo-telemetry]") || current.length > 0) {
      current.push(line);
    }
  }
  flush();
  return examples;
}

/** Parse the "Useful grep queries" block into pattern strings. */
function parseGrepQueries(): string[] {
  const block = sliceBetween(
    SOURCE,
    "Useful grep queries for QA:",
    "Toggling noise at runtime",
  );
  const queries: string[] = [];
  for (const raw of block.split("\n")) {
    const line = stripJsdocPrefix(raw).trim();
    const m = /^grep(?:\s+-\w+)?\s+"([^"]+)"/.exec(line);
    if (m) queries.push(m[1]);
  }
  return queries;
}

// ────────────────────────────────────────────────────────────────────────
// Canonical records — hand-crafted to match the JSDoc examples byte-for-
// byte after being run through `formatLogoDecisionRecord`. If a field or
// number changes on either side, the test fails on the specific example.
// ────────────────────────────────────────────────────────────────────────

const LIMITS = {
  renderSampleRate: 0.01,
  errorMaxPerSession: 5,
  errorMinIntervalMs: 1000,
};

const canonicalRecords: LogoDecisionRecord[] = [
  // 1. accepted error
  {
    kind: "error",
    decision: "sampled-in",
    reason: "accepted",
    stage: "primary-light-png",
    terminal: false,
    correlationId: "cid-123",
    counters: {
      renderLogged: false,
      renderSampled: true,
      errorCount: 1,
      lastErrorStage: "primary-light-png",
      msSinceLastError: null,
    },
    limits: LIMITS,
    ts: 123456789,
  },
  // 2. first-render sample
  {
    kind: "render",
    decision: "sampled-in",
    reason: "first-render",
    stage: null,
    terminal: undefined,
    correlationId: "cid-123",
    counters: {
      renderLogged: true,
      renderSampled: true,
      errorCount: 0,
      lastErrorStage: "",
      msSinceLastError: null,
    },
    limits: LIMITS,
    ts: 123456789,
  },
  // 3. throttled error
  {
    kind: "error",
    decision: "sampled-out",
    reason: "throttle",
    stage: "primary-light-png",
    terminal: false,
    correlationId: "cid-123",
    counters: {
      renderLogged: false,
      renderSampled: true,
      errorCount: 1,
      lastErrorStage: "primary-light-png",
      msSinceLastError: 150,
    },
    limits: LIMITS,
    ts: 123456789,
  },
];

/**
 * Extra records included in the grep corpus (not shown in the JSDoc) so
 * every documented grep query can match at least one real formatter line.
 * A `reason=terminal` record covers the `grep -E` example.
 */
const grepExtraRecords: LogoDecisionRecord[] = [
  {
    kind: "error",
    decision: "sampled-in",
    reason: "terminal",
    stage: "fallback-inline-svg",
    terminal: true,
    correlationId: "cid-123",
    counters: {
      renderLogged: false,
      renderSampled: true,
      errorCount: 2,
      lastErrorStage: "fallback-inline-svg",
      msSinceLastError: 500,
    },
    limits: LIMITS,
    ts: 123456789,
  },
];

const formatted = (r: LogoDecisionRecord) => `${PREFIX}${formatLogoDecisionRecord(r)}`;

describe("JSDoc console examples stay in lockstep with the formatter", () => {
  const parsed = parseExamples();

  it("has the expected number of examples", () => {
    expect(parsed).toHaveLength(canonicalRecords.length);
  });

  it.each(canonicalRecords.map((r, i) => [i, r] as const))(
    "example #%i matches formatLogoDecisionRecord() output",
    (i, record) => {
      expect(parsed[i]).toBe(formatted(record));
    },
  );

  it("every example is a single physical line (no CR/LF/TAB)", () => {
    for (const ex of parsed) {
      expect(/[\r\n\t]/.test(ex)).toBe(false);
    }
  });
});

describe("JSDoc grep queries match real formatter output", () => {
  const queries = parseGrepQueries();
  const corpus = [...canonicalRecords, ...grepExtraRecords].map(formatted);

  it("parses at least the documented set of queries", () => {
    // 9 grep lines in the current JSDoc block (including -E and -c).
    expect(queries.length).toBeGreaterThanOrEqual(9);
  });

  it.each(queries.map((q, i) => [i, q] as const))(
    "query #%i (%s) matches at least one corpus line",
    (_i, pattern) => {
      const re = new RegExp(pattern);
      const hit = corpus.some((line) => re.test(line));
      expect(hit).toBe(true);
    },
  );
});
