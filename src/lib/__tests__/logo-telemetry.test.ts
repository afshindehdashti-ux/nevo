import { describe, expect, it } from "vitest";
import { createLogoRateState, shouldLogError, shouldLogRender } from "../logo-telemetry";
import type { LogoTelemetryConfig } from "../logo-telemetry-config";

// A permissive default config so tests only vary the knob under test.
const cfg = (over: Partial<LogoTelemetryConfig> = {}): LogoTelemetryConfig => ({
  renderSampleRate: 1,
  errorMaxPerSession: 4,
  errorMinIntervalMs: 1000,
  debug: false,
  logLine: true,
  ...over,
});

// Deterministic random / clock.
const rand = (v: number) => () => v;
const clock = (start = 0) => {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
};

describe("shouldLogRender", () => {
  it("fires exactly once when the sample check passes", () => {
    const state = createLogoRateState();
    const config = cfg({ renderSampleRate: 1 });
    expect(shouldLogRender({ state, config, random: rand(0) })).toBe(true);
    // Subsequent calls in the same session must never fire again.
    expect(shouldLogRender({ state, config, random: rand(0) })).toBe(false);
    expect(shouldLogRender({ state, config, random: rand(0) })).toBe(false);
  });

  it("never fires when sampleRate = 0", () => {
    const state = createLogoRateState();
    const config = cfg({ renderSampleRate: 0 });
    for (let i = 0; i < 10; i++) {
      expect(shouldLogRender({ state, config, random: rand(0) })).toBe(false);
    }
  });

  it("locks the sampling decision on first call", () => {
    // First call rolls unlucky (rand=0.9 >= sampleRate=0.5 → not sampled).
    // Even if later calls would have rolled lucky, the session stays sealed.
    const state = createLogoRateState();
    const config = cfg({ renderSampleRate: 0.5 });
    expect(shouldLogRender({ state, config, random: rand(0.9) })).toBe(false);
    expect(shouldLogRender({ state, config, random: rand(0) })).toBe(false);
    expect(state.renderSampled).toBe(false);
    expect(state.renderLogged).toBe(false);
  });

  it("respects the sampleRate threshold (boundary: rand === rate → not sampled)", () => {
    // Math.random() < sampleRate → strict less-than.
    const state = createLogoRateState();
    const config = cfg({ renderSampleRate: 0.5 });
    expect(shouldLogRender({ state, config, random: rand(0.5) })).toBe(false);
  });

  it("passes when random < sampleRate", () => {
    const state = createLogoRateState();
    const config = cfg({ renderSampleRate: 0.5 });
    expect(shouldLogRender({ state, config, random: rand(0.4999) })).toBe(true);
  });
});

describe("shouldLogError — session cap", () => {
  it("allows exactly errorMaxPerSession events, then drops", () => {
    const state = createLogoRateState();
    const config = cfg({ errorMaxPerSession: 3, errorMinIntervalMs: 0 });
    const c = clock();
    expect(shouldLogError("a", false, { state, config, now: c.now })).toBe(true);
    expect(shouldLogError("b", false, { state, config, now: c.now })).toBe(true);
    expect(shouldLogError("c", false, { state, config, now: c.now })).toBe(true);
    // Cap reached → drop even different stages, even terminal ones.
    expect(shouldLogError("d", false, { state, config, now: c.now })).toBe(false);
    expect(shouldLogError("d", true, { state, config, now: c.now })).toBe(false);
    expect(state.errorCount).toBe(3);
  });

  it("cap of 0 disables error logging entirely", () => {
    const state = createLogoRateState();
    const config = cfg({ errorMaxPerSession: 0 });
    expect(shouldLogError("primary-light-png", false, { state, config, now: () => 0 })).toBe(false);
    expect(shouldLogError("fallback-inline-svg", true, { state, config, now: () => 0 })).toBe(
      false,
    );
    expect(state.errorCount).toBe(0);
  });
});

describe("shouldLogError — per-stage throttle", () => {
  it("suppresses a repeated non-terminal error within the throttle window", () => {
    const state = createLogoRateState();
    const config = cfg({ errorMinIntervalMs: 1000 });
    const c = clock(1000);
    expect(shouldLogError("primary-light-png", false, { state, config, now: c.now })).toBe(true);
    c.advance(500); // still inside the 1000ms window
    expect(shouldLogError("primary-light-png", false, { state, config, now: c.now })).toBe(false);
    expect(state.errorCount).toBe(1);
  });

  it("allows the same stage again once the window has elapsed", () => {
    const state = createLogoRateState();
    const config = cfg({ errorMinIntervalMs: 1000 });
    const c = clock(0);
    expect(shouldLogError("primary-light-png", false, { state, config, now: c.now })).toBe(true);
    c.advance(1000); // now - lastErrorAt === 1000, not strictly < 1000
    expect(shouldLogError("primary-light-png", false, { state, config, now: c.now })).toBe(true);
    expect(state.errorCount).toBe(2);
  });

  it("does NOT throttle a different stage within the same window", () => {
    // Per-stage sequencing: primary→cdn→svg must all fire back-to-back
    // during a real fallback cascade even though they happen in the same tick.
    const state = createLogoRateState();
    const config = cfg({ errorMinIntervalMs: 5000 });
    const c = clock(0);
    expect(shouldLogError("primary-light-png", false, { state, config, now: c.now })).toBe(true);
    expect(shouldLogError("fallback-cdn-full", false, { state, config, now: c.now })).toBe(true);
    expect(shouldLogError("fallback-inline-svg", true, { state, config, now: c.now })).toBe(true);
    expect(state.errorCount).toBe(3);
    expect(state.lastErrorStage).toBe("fallback-inline-svg");
  });

  it("terminal errors bypass the per-stage throttle but still count", () => {
    const state = createLogoRateState();
    const config = cfg({ errorMinIntervalMs: 10_000, errorMaxPerSession: 5 });
    const c = clock(0);
    expect(shouldLogError("fallback-inline-svg", true, { state, config, now: c.now })).toBe(true);
    // Same stage, no time elapsed — throttle would normally drop this.
    expect(shouldLogError("fallback-inline-svg", true, { state, config, now: c.now })).toBe(true);
    expect(state.errorCount).toBe(2);
  });
});

describe("shouldLogError — full fallback-chain scenario", () => {
  it("logs primary → cdn → svg exactly once each, in order, and stops on repeats", () => {
    const state = createLogoRateState();
    const config = cfg({ errorMaxPerSession: 4, errorMinIntervalMs: 1000 });
    const c = clock(0);

    // Real cascade: three onError firings within the same JS turn.
    expect(shouldLogError("primary-light-png", false, { state, config, now: c.now })).toBe(true);
    expect(shouldLogError("fallback-cdn-full", false, { state, config, now: c.now })).toBe(true);
    expect(shouldLogError("fallback-inline-svg", true, { state, config, now: c.now })).toBe(true);

    // A flapping SVG re-fires the terminal stage a moment later — throttle
    // key is `lastErrorStage`, so same stage within the window is dropped.
    c.advance(200);
    expect(shouldLogError("fallback-inline-svg", false, { state, config, now: c.now })).toBe(false);

    // Enough time passes; the same stage is allowed again and hits the
    // session cap at 4 events.
    c.advance(1000);
    expect(shouldLogError("fallback-inline-svg", false, { state, config, now: c.now })).toBe(true);
    expect(shouldLogError("fallback-inline-svg", true, { state, config, now: c.now })).toBe(false);
    expect(state.errorCount).toBe(4);
  });
});
