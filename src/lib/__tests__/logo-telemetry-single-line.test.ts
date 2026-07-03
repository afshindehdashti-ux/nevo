import { describe, expect, it } from "vitest";
import {
  formatLogoDecisionRecord,
  sanitizeLogoDecisionField,
  type LogoDecisionRecord,
} from "../logo-telemetry";

const CONTROL_CHAR_RE = /[\x00-\x1F\x7F]/;

function makeRecord(over: Partial<LogoDecisionRecord> = {}): LogoDecisionRecord {
  return {
    kind: "error",
    decision: "sampled-in",
    reason: "accepted",
    stage: "primary-light-png",
    terminal: false,
    correlationId: "cid-1",
    counters: {
      renderLogged: false,
      renderSampled: true,
      errorCount: 1,
      lastErrorStage: "primary-light-png",
      msSinceLastError: null,
    },
    limits: { renderSampleRate: 0.01, errorMaxPerSession: 5, errorMinIntervalMs: 1000 },
    ts: 123,
    ...over,
  };
}

describe("logo-telemetry grep-line invariants", () => {
  it("sanitizer escapes every control char and spaces", () => {
    const out = sanitizeLogoDecisionField("a\nb\rc\td e\x00f\x7fg");
    expect(CONTROL_CHAR_RE.test(out)).toBe(false);
    expect(out.includes(" ")).toBe(false);
    expect(out).toBe("a\\x0ab\\x0dc\\x09d\\x20e\\x00f\\x7fg");
  });

  it("formatted line is single-line even with hostile field values", () => {
    const line = formatLogoDecisionRecord(
      makeRecord({
        reason: "boom\ninjected=evil",
        stage: "stage\r\nwith\tctrl",
        correlationId: "cid with space\nand-newline",
        counters: {
          renderLogged: false,
          renderSampled: true,
          errorCount: 1,
          lastErrorStage: "last\nstage",
          msSinceLastError: null,
        },
      }),
    );
    expect(line.includes("\n")).toBe(false);
    expect(line.includes("\r")).toBe(false);
    expect(line.includes("\t")).toBe(false);
    expect(CONTROL_CHAR_RE.test(line)).toBe(false);
    // Every space in the output must be a top-level pair separator: each
    // token still parses as key=value.
    for (const token of line.split(" ")) {
      expect(token.includes("=")).toBe(true);
    }
  });

  it("known-clean input round-trips without escapes", () => {
    const line = formatLogoDecisionRecord(makeRecord());
    expect(line).toContain("reason=accepted");
    expect(line).toContain("stage=primary-light-png");
    expect(line.includes("\\x")).toBe(false);
    expect(line.split("\n").length).toBe(1);
  });
});
