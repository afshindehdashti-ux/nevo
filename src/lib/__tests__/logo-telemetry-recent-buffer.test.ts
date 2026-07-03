/**
 * Verifies the ring buffer that backs `window.__nevoLogoDebug.getRecent()`.
 *
 *  - records on every sampler call, regardless of the debug flag
 *  - captures the exact decision + reason + counters snapshot
 *  - keeps at most LOGO_DECISION_BUFFER_SIZE entries (oldest evicted)
 *  - getRecent() returns a copy — mutating it can't corrupt the buffer
 *  - clearLogoDecisions() empties it for a fresh repro
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  LOGO_DECISION_BUFFER_SIZE,
  clearLogoDecisions,
  createLogoRateState,
  getRecentLogoDecisions,
  shouldLogError,
  shouldLogRender,
} from "../logo-telemetry";
import type { LogoTelemetryConfig } from "../logo-telemetry-config";

const cfg = (over: Partial<LogoTelemetryConfig> = {}): LogoTelemetryConfig => ({
  renderSampleRate: 1,
  errorMaxPerSession: 1000,
  errorMinIntervalMs: 1000,
  debug: false,
  logLine: true,
  ...over,
});

beforeEach(() => clearLogoDecisions());
afterEach(() => clearLogoDecisions());

describe("logo telemetry ring buffer", () => {
  it("records every sampler call even when debug is off", () => {
    const state = createLogoRateState();
    const config = cfg({ debug: false });

    shouldLogRender({ state, config, random: () => 0, correlationId: "cid-A" });
    shouldLogError("primary-light-png", false, {
      state,
      config,
      now: () => 100,
      correlationId: "cid-A",
    });
    shouldLogError("primary-light-png", false, {
      state,
      config,
      now: () => 150, // same stage inside interval → throttled
      correlationId: "cid-A",
    });

    const tail = getRecentLogoDecisions();
    expect(tail).toHaveLength(3);
    expect(tail[0]).toMatchObject({
      kind: "render",
      decision: "sampled-in",
      reason: "first-render",
      correlationId: "cid-A",
    });
    expect(tail[1]).toMatchObject({
      kind: "error",
      decision: "sampled-in",
      reason: "accepted",
      stage: "primary-light-png",
      terminal: false,
      ts: 100,
    });
    expect(tail[2]).toMatchObject({
      kind: "error",
      decision: "sampled-out",
      reason: "throttle",
      counters: { msSinceLastError: 50 },
    });
  });

  it(`caps the buffer at ${LOGO_DECISION_BUFFER_SIZE} entries and evicts the oldest`, () => {
    const config = cfg({
      debug: false,
      errorMaxPerSession: 10_000,
      errorMinIntervalMs: 0,
    });
    const state = createLogoRateState();
    const total = LOGO_DECISION_BUFFER_SIZE + 10;
    for (let i = 0; i < total; i++) {
      shouldLogError("primary-light-png", false, {
        state,
        config,
        now: () => i,
        correlationId: `cid-${i}`,
      });
    }
    const tail = getRecentLogoDecisions();
    expect(tail).toHaveLength(LOGO_DECISION_BUFFER_SIZE);
    // Oldest kept entry is #10, newest is #(total-1).
    expect(tail[0]?.correlationId).toBe(`cid-${total - LOGO_DECISION_BUFFER_SIZE}`);
    expect(tail[tail.length - 1]?.correlationId).toBe(`cid-${total - 1}`);
  });

  it("getRecent() returns a copy — mutations can't corrupt the buffer", () => {
    const state = createLogoRateState();
    shouldLogRender({ state, config: cfg(), random: () => 0 });
    const first = getRecentLogoDecisions();
    first.length = 0;
    first.push({} as never);
    expect(getRecentLogoDecisions()).toHaveLength(1);
  });

  it("clearLogoDecisions() empties the buffer", () => {
    const state = createLogoRateState();
    shouldLogRender({ state, config: cfg(), random: () => 0 });
    expect(getRecentLogoDecisions().length).toBeGreaterThan(0);
    clearLogoDecisions();
    expect(getRecentLogoDecisions()).toEqual([]);
  });
});
