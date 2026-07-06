/**
 * Verifies the QA-only debug line emitted by the header-logo samplers.
 *
 *   - silent by default (config.debug === false)
 *   - one console.debug per sampler call when debug is on
 *   - single-line, space-separated key=value format
 *   - all flat fields present and greppable: kind, decision, reason, stage,
 *     terminal, correlationId, counters.*, limits.*, ts
 *   - decision reflects sampled-in vs sampled-out for every reason
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogoRateState, shouldLogError, shouldLogRender } from "../logo-telemetry";
import type { LogoTelemetryConfig } from "../logo-telemetry-config";

const cfg = (over: Partial<LogoTelemetryConfig> = {}): LogoTelemetryConfig => ({
  renderSampleRate: 1,
  errorMaxPerSession: 3,
  errorMinIntervalMs: 1000,
  debug: false,
  logLine: true,
  ...over,
});

afterEach(() => vi.restoreAllMocks());

describe("logo telemetry debug log — silent by default", () => {
  it("emits no console.debug when config.debug is false", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const state = createLogoRateState();
    const config = cfg({ debug: false });
    shouldLogRender({ state, config, random: () => 0 });
    shouldLogError("primary-light-png", false, { state, config, now: () => 0 });
    shouldLogError("primary-light-png", false, { state, config, now: () => 10 });
    expect(spy).not.toHaveBeenCalled();
  });
});

function lastLine(spy: ReturnType<typeof vi.spyOn>): string {
  const call = spy.mock.calls.at(-1);
  expect(call).toBeDefined();
  const [tag, payload] = call!;
  expect(tag).toBe("[nevo:logo-telemetry]");
  expect(typeof payload).toBe("string");
  // Must be a single line so grep works cleanly.
  expect(payload).not.toContain("\n");
  return payload as string;
}

describe("logo telemetry debug log — enabled shape", () => {
  it("logs one line per sampler call with flat, greppable key=value fields", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const state = createLogoRateState();
    const config = cfg({ debug: true });

    // 1) render sampled in
    shouldLogRender({ state, config, random: () => 0, correlationId: "cid-A" });
    expect(spy).toHaveBeenCalledTimes(1);
    let line = lastLine(spy);
    expect(line).toContain("kind=render");
    expect(line).toContain("decision=sampled-in");
    expect(line).toContain("reason=first-render");
    expect(line).toContain("stage=null");
    expect(line).toContain("correlationId=cid-A");
    expect(line).toContain("counters.renderLogged=true");
    expect(line).toContain("counters.renderSampled=true");
    expect(line).toContain("counters.errorCount=0");
    expect(line).toContain("limits.renderSampleRate=1");
    expect(line).toContain("limits.errorMaxPerSession=3");
    expect(line).toContain("limits.errorMinIntervalMs=1000");
    expect(line).toMatch(/ts=\d+/);

    // 2) error accepted
    shouldLogError("primary-light-png", false, {
      state,
      config,
      now: () => 100,
      correlationId: "cid-A",
    });
    line = lastLine(spy);
    expect(line).toContain("kind=error");
    expect(line).toContain("decision=sampled-in");
    expect(line).toContain("reason=accepted");
    expect(line).toContain("stage=primary-light-png");
    expect(line).toContain("terminal=false");
    expect(line).toContain("correlationId=cid-A");
    expect(line).toContain("counters.errorCount=1");
    expect(line).toContain("counters.lastErrorStage=primary-light-png");
    expect(line).toContain("ts=100");

    // 3) same-stage repeat → throttle sampled-out, msSinceLastError present
    shouldLogError("primary-light-png", false, {
      state,
      config,
      now: () => 300,
      correlationId: "cid-A",
    });
    line = lastLine(spy);
    expect(line).toContain("kind=error");
    expect(line).toContain("decision=sampled-out");
    expect(line).toContain("reason=throttle");
    expect(line).toContain("stage=primary-light-png");
    expect(line).toContain("counters.msSinceLastError=200");

    // 4) terminal error bypasses throttle → sampled-in / reason=terminal
    shouldLogError("primary-light-png", true, {
      state,
      config,
      now: () => 350,
      correlationId: "cid-A",
    });
    line = lastLine(spy);
    expect(line).toContain("kind=error");
    expect(line).toContain("decision=sampled-in");
    expect(line).toContain("reason=terminal");
    expect(line).toContain("terminal=true");

    // 5) session cap hit on the next accepted-worthy call
    shouldLogError("fallback-cdn-full", false, {
      state,
      config,
      now: () => 5000,
      correlationId: "cid-A",
    }); // 3rd accepted
    shouldLogError("fallback-inline-svg", true, {
      state,
      config,
      now: () => 6000,
      correlationId: "cid-A",
    }); // cap
    line = lastLine(spy);
    expect(line).toContain("kind=error");
    expect(line).toContain("decision=sampled-out");
    expect(line).toContain("reason=session-cap");
    expect(line).toContain("stage=fallback-inline-svg");

    // 6) render sampled-out because it already fired → reason=already-logged
    shouldLogRender({ state, config, random: () => 0 });
    line = lastLine(spy);
    expect(line).toContain("kind=render");
    expect(line).toContain("decision=sampled-out");
    expect(line).toContain("reason=already-logged");
  });

  it("reason=sample-rate is logged when the roll misses", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const state = createLogoRateState();
    shouldLogRender({ state, config: cfg({ debug: true, renderSampleRate: 0 }), random: () => 0 });
    const line = lastLine(spy);
    expect(line).toContain("kind=render");
    expect(line).toContain("decision=sampled-out");
    expect(line).toContain("reason=sample-rate");
  });
});
