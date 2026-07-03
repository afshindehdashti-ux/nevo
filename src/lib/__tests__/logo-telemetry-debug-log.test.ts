/**
 * Verifies the QA-only debug line emitted by the header-logo samplers.
 *
 *   - silent by default (config.debug === false)
 *   - one console.debug per sampler call when debug is on
 *   - flat top-level fields: kind, decision, reason, stage, terminal,
 *     correlationId, counters, limits, ts
 *   - decision reflects sampled-in vs sampled-out for every reason
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createLogoRateState,
  shouldLogError,
  shouldLogRender,
} from "../logo-telemetry";
import type { LogoTelemetryConfig } from "../logo-telemetry-config";

const cfg = (over: Partial<LogoTelemetryConfig> = {}): LogoTelemetryConfig => ({
  renderSampleRate: 1,
  errorMaxPerSession: 3,
  errorMinIntervalMs: 1000,
  debug: false,
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

describe("logo telemetry debug log — enabled shape", () => {
  it("logs one line per sampler call with flat, greppable fields", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const state = createLogoRateState();
    const config = cfg({ debug: true });

    // 1) render sampled in
    shouldLogRender({ state, config, random: () => 0, correlationId: "cid-A" });
    expect(spy).toHaveBeenCalledTimes(1);
    let [tag, payload] = spy.mock.calls.at(-1)!;
    expect(tag).toBe("[nevo:logo-telemetry]");
    expect(payload).toMatchObject({
      kind: "render",
      decision: "sampled-in",
      reason: "first-render",
      stage: null,
      correlationId: "cid-A",
      counters: { renderLogged: true, renderSampled: true, errorCount: 0 },
      limits: { renderSampleRate: 1, errorMaxPerSession: 3, errorMinIntervalMs: 1000 },
    });
    expect(typeof (payload as { ts: number }).ts).toBe("number");

    // 2) error accepted
    shouldLogError("primary-light-png", false, {
      state,
      config,
      now: () => 100,
      correlationId: "cid-A",
    });
    [, payload] = spy.mock.calls.at(-1)!;
    expect(payload).toMatchObject({
      kind: "error",
      decision: "sampled-in",
      reason: "accepted",
      stage: "primary-light-png",
      terminal: false,
      correlationId: "cid-A",
      counters: { errorCount: 1, lastErrorStage: "primary-light-png" },
      ts: 100,
    });

    // 3) same-stage repeat → throttle sampled-out, msSinceLastError present
    shouldLogError("primary-light-png", false, {
      state,
      config,
      now: () => 300,
      correlationId: "cid-A",
    });
    [, payload] = spy.mock.calls.at(-1)!;
    expect(payload).toMatchObject({
      kind: "error",
      decision: "sampled-out",
      reason: "throttle",
      stage: "primary-light-png",
      counters: { msSinceLastError: 200 },
    });

    // 4) terminal error bypasses throttle → sampled-in / reason=terminal
    shouldLogError("primary-light-png", true, {
      state,
      config,
      now: () => 350,
      correlationId: "cid-A",
    });
    [, payload] = spy.mock.calls.at(-1)!;
    expect(payload).toMatchObject({
      kind: "error",
      decision: "sampled-in",
      reason: "terminal",
      terminal: true,
    });

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
    [, payload] = spy.mock.calls.at(-1)!;
    expect(payload).toMatchObject({
      kind: "error",
      decision: "sampled-out",
      reason: "session-cap",
      stage: "fallback-inline-svg",
    });

    // 6) render sampled-out because it already fired → reason=already-logged
    shouldLogRender({ state, config, random: () => 0 });
    [, payload] = spy.mock.calls.at(-1)!;
    expect(payload).toMatchObject({
      kind: "render",
      decision: "sampled-out",
      reason: "already-logged",
    });
  });

  it("reason=sample-rate is logged when the roll misses", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const state = createLogoRateState();
    shouldLogRender({ state, config: cfg({ debug: true, renderSampleRate: 0 }), random: () => 0 });
    const [, payload] = spy.mock.calls.at(-1)!;
    expect(payload).toMatchObject({
      kind: "render",
      decision: "sampled-out",
      reason: "sample-rate",
    });
  });
});
