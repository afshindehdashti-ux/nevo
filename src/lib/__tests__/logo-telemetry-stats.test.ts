import { beforeEach, describe, expect, it } from "vitest";
import {
  clearLogoDecisions,
  createLogoRateState,
  shouldLogError,
  shouldLogRender,
} from "../logo-telemetry";
import { buildLogoTelemetryStats } from "../logo-telemetry-debug";

beforeEach(() => clearLogoDecisions());

function seed() {
  shouldLogRender({ correlationId: "cid-alpha", random: () => 0 });
  // Use fresh states so the session cap doesn't shut everything off.
  shouldLogError("primary-light-png", false, {
    correlationId: "cid-alpha",
    state: createLogoRateState(),
  });
  // Same-stage immediate retry → throttled
  const s = createLogoRateState();
  shouldLogError("primary-light-png", false, { correlationId: "cid-alpha", state: s });
  shouldLogError("primary-light-png", false, {
    correlationId: "cid-alpha",
    state: s,
    now: () => 1,
  });
  shouldLogError("fallback-inline-svg", true, {
    correlationId: "cid-alpha",
    state: createLogoRateState(),
  });
  shouldLogError("primary-light-png", true, {
    correlationId: "cid-beta",
    state: createLogoRateState(),
  });
}

describe("buildLogoTelemetryStats", () => {
  it("counts totals, by-kind, by-decision, and by-reason across the buffer", () => {
    seed();
    const stats = buildLogoTelemetryStats();
    expect(stats.totalScanned).toBe(6);
    expect(stats.decisionsTruncated).toBe(false);
    expect(stats.byKind.render).toBe(1);
    expect(stats.byKind.error).toBe(5);
    expect(stats.byDecision["sampled-in"] + stats.byDecision["sampled-out"]).toBe(6);
    expect(stats.errorsSuppressed).toBeGreaterThanOrEqual(1); // the throttled one
    expect(stats.errorsEmitted).toBeGreaterThanOrEqual(3);
    expect(stats.terminalErrors).toBe(2);
    expect(stats.byReason.throttle).toBe(1);
    expect(stats.byReason.terminal).toBe(2);
    expect(stats.filter).toBeUndefined();
    expect(typeof stats.errorCountSinceLoad).toBe("number");
  });

  it("applies a multi-field filter and reports matchedCount + criteria", () => {
    seed();
    const stats = buildLogoTelemetryStats({
      filter: { kind: "error", decision: "sampled-in" },
    });
    expect(stats.filter?.criteria).toEqual({ kind: "error", decision: "sampled-in" });
    expect(stats.filter?.matchedCount).toBe(stats.byKind.error);
    expect(stats.byDecision["sampled-out"]).toBe(0);
    expect(stats.errorsSuppressed).toBe(0);
  });

  it("preserves the legacy correlationId shortcut on the filter meta", () => {
    seed();
    const stats = buildLogoTelemetryStats({ correlationId: "cid-alpha" });
    expect(stats.filter?.correlationId).toBe("cid-alpha");
    expect(stats.filter?.criteria).toEqual({ correlationId: "cid-alpha" });
    expect(stats.filter?.matchedCount).toBe(5);
  });

  it("empty buffer yields zeroed counts", () => {
    const stats = buildLogoTelemetryStats();
    expect(stats.totalScanned).toBe(0);
    expect(stats.byKind).toEqual({ render: 0, error: 0 });
    expect(stats.byDecision).toEqual({ "sampled-in": 0, "sampled-out": 0 });
    expect(stats.byReason).toEqual({});
    expect(stats.errorsEmitted).toBe(0);
  });
});
