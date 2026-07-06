import { beforeEach, describe, expect, it } from "vitest";
import { clearLogoDecisions, shouldLogError, shouldLogRender } from "../logo-telemetry";
import {
  buildLogoTelemetryDump,
  dumpLogoTelemetryAsJSON,
  matchesLogoDumpFilter,
} from "../logo-telemetry-debug";

beforeEach(() => clearLogoDecisions());

function seed() {
  shouldLogRender({ correlationId: "cid-alpha", random: () => 0 });
  shouldLogError("primary-light-png", false, { correlationId: "cid-alpha" });
  // Immediate second same-stage non-terminal → throttled
  shouldLogError("primary-light-png", false, { correlationId: "cid-alpha" });
  shouldLogError("fallback-inline-svg", true, { correlationId: "cid-alpha" });
  shouldLogError("primary-light-png", false, { correlationId: "cid-beta" });
  shouldLogError("primary-light-png", true, { correlationId: "cid-beta" });
}

describe("multi-field dump filter", () => {
  it("ANDs across fields (kind + decision)", () => {
    seed();
    const dump = buildLogoTelemetryDump("console", {
      filter: { kind: "error", decision: "sampled-in" },
    });
    expect(dump.decisions.length).toBeGreaterThan(0);
    for (const d of dump.decisions) {
      expect(d.kind).toBe("error");
      expect(d.decision).toBe("sampled-in");
    }
    expect(dump.filter?.criteria).toEqual({ kind: "error", decision: "sampled-in" });
    expect(dump.filter?.matchedCount).toBe(dump.decisions.length);
    expect(dump.filter?.correlationId).toBeUndefined();
  });

  it("ORs values within a field (stage array)", () => {
    seed();
    const dump = buildLogoTelemetryDump("console", {
      filter: { stage: ["primary-light-png", "fallback-inline-svg"] },
    });
    for (const d of dump.decisions) {
      expect(["primary-light-png", "fallback-inline-svg"]).toContain(d.stage);
    }
    // Render decision has stage=null → excluded
    expect(dump.decisions.every((d) => d.kind === "error")).toBe(true);
  });

  it("filters by terminal boolean", () => {
    seed();
    const dump = buildLogoTelemetryDump("console", { filter: { terminal: true } });
    expect(dump.decisions.length).toBeGreaterThan(0);
    for (const d of dump.decisions) expect(d.terminal).toBe(true);
  });

  it("combines correlationId + reason", () => {
    seed();
    const dump = buildLogoTelemetryDump("console", {
      filter: { correlationId: "cid-alpha", reason: "throttle" },
    });
    for (const d of dump.decisions) {
      expect(d.correlationId).toBe("cid-alpha");
      expect(d.reason).toBe("throttle");
    }
    expect(dump.filter?.criteria).toEqual({
      correlationId: "cid-alpha",
      reason: "throttle",
    });
    // No legacy top-level correlationId shortcut when other fields are set.
    expect(dump.filter?.correlationId).toBeUndefined();
  });

  it("accepts arrays for correlationId (OR)", () => {
    seed();
    const dump = buildLogoTelemetryDump("console", {
      filter: { correlationId: ["cid-alpha", "cid-beta"] },
    });
    expect(dump.decisions.length).toBe(6);
  });

  it("zero matches still reports totalScanned and criteria", () => {
    seed();
    const dump = buildLogoTelemetryDump("console", {
      filter: { kind: "error", stage: "does-not-exist" },
    });
    expect(dump.decisions).toEqual([]);
    expect(dump.filter).toEqual({
      criteria: { kind: "error", stage: "does-not-exist" },
      matchedCount: 0,
      totalScanned: 6,
    });
  });

  it("filter wins over the legacy correlationId shortcut", () => {
    seed();
    const dump = buildLogoTelemetryDump("console", {
      correlationId: "cid-alpha",
      filter: { kind: "render" },
    });
    for (const d of dump.decisions) expect(d.kind).toBe("render");
    expect(dump.filter?.criteria).toEqual({ kind: "render" });
  });

  it("JSON variant preserves the multi-field filter metadata", () => {
    seed();
    const json = dumpLogoTelemetryAsJSON("button", {
      filter: { kind: "error", terminal: true },
    });
    const parsed = JSON.parse(json);
    expect(parsed.filter.criteria).toEqual({ kind: "error", terminal: true });
    for (const d of parsed.decisions) {
      expect(d.kind).toBe("error");
      expect(d.terminal).toBe(true);
    }
  });

  it("matchesLogoDumpFilter is exported for direct use", () => {
    const record = {
      kind: "error" as const,
      decision: "sampled-in" as const,
      reason: "accepted",
      stage: "primary-light-png",
      terminal: false,
      correlationId: "cid-x",
      counters: {
        renderLogged: false,
        renderSampled: true,
        errorCount: 1,
        lastErrorStage: "primary-light-png",
        msSinceLastError: null,
      },
      limits: { renderSampleRate: 0.01, errorMaxPerSession: 5, errorMinIntervalMs: 1000 },
      ts: 0,
    };
    expect(matchesLogoDumpFilter(record, { kind: "error", stage: "primary-light-png" })).toBe(true);
    expect(matchesLogoDumpFilter(record, { terminal: true })).toBe(false);
    expect(matchesLogoDumpFilter(record, { reason: ["accepted", "throttle"] })).toBe(true);
  });
});
