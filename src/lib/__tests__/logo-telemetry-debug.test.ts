import { describe, expect, it } from "vitest";
import {
  explainLogoDecision,
  simulateLogoDecisions,
} from "../logo-telemetry-debug";
import { createLogoRateState } from "../logo-telemetry";
import type { LogoTelemetryConfig } from "../logo-telemetry-config";

const cfg = (over: Partial<LogoTelemetryConfig> = {}): LogoTelemetryConfig => ({
  renderSampleRate: 1,
  errorMaxPerSession: 4,
  errorMinIntervalMs: 1000,
  debug: false,
  logLine: true,
  ...over,
});

describe("explainLogoDecision — never mutates caller state", () => {
  it("returns a decision without touching the passed state object", () => {
    const state = createLogoRateState();
    const snapshot = { ...state };
    const d = explainLogoDecision(
      { kind: "error", stage: "primary-light-png", terminal: false, timestampMs: 0 },
      { state, config: cfg() },
    );
    expect(d.wouldEmit).toBe(true);
    expect(d.reason).toBe("accepted");
    // Caller state untouched — the sandbox mutation lives on stateAfter.
    expect(state).toEqual(snapshot);
    expect(d.stateAfter.errorCount).toBe(1);
  });
});

describe("explainLogoDecision — render", () => {
  it("reason=first-render for the first sampled-in render", () => {
    const d = explainLogoDecision(
      { kind: "render", correlationId: "cid-1" },
      { state: createLogoRateState(), config: cfg({ renderSampleRate: 1 }), random: () => 0 },
    );
    expect(d).toMatchObject({ wouldEmit: true, reason: "first-render", kind: "render" });
  });

  it("reason=sample-rate when the roll misses", () => {
    const d = explainLogoDecision(
      { kind: "render" },
      { state: createLogoRateState(), config: cfg({ renderSampleRate: 0 }), random: () => 0 },
    );
    expect(d).toMatchObject({ wouldEmit: false, reason: "sample-rate" });
  });

  it("reason=already-logged after a successful render in the same state", () => {
    const state = createLogoRateState();
    state.renderLogged = true;
    state.renderSampled = true;
    const d = explainLogoDecision({ kind: "render" }, { state, config: cfg() });
    expect(d).toMatchObject({ wouldEmit: false, reason: "already-logged" });
  });
});

describe("explainLogoDecision — error", () => {
  it("reason=throttle for same stage inside the window", () => {
    const state = createLogoRateState();
    state.errorCount = 1;
    state.lastErrorStage = "primary-light-png";
    state.lastErrorAt = 1000;
    const d = explainLogoDecision(
      { kind: "error", stage: "primary-light-png", terminal: false, timestampMs: 1500 },
      { state, config: cfg({ errorMinIntervalMs: 1000 }) },
    );
    expect(d).toMatchObject({ wouldEmit: false, reason: "throttle", msSinceLastSameStage: 500 });
  });

  it("reason=session-cap when the cap is reached", () => {
    const state = createLogoRateState();
    state.errorCount = 4;
    const d = explainLogoDecision(
      { kind: "error", stage: "x", terminal: true, timestampMs: 0 },
      { state, config: cfg({ errorMaxPerSession: 4 }) },
    );
    expect(d).toMatchObject({ wouldEmit: false, reason: "session-cap" });
  });

  it("reason=terminal for a terminal error that bypasses the throttle", () => {
    const state = createLogoRateState();
    state.errorCount = 1;
    state.lastErrorStage = "fallback-inline-svg";
    state.lastErrorAt = 100;
    const d = explainLogoDecision(
      { kind: "error", stage: "fallback-inline-svg", terminal: true, timestampMs: 150 },
      { state, config: cfg({ errorMinIntervalMs: 10_000 }) },
    );
    expect(d).toMatchObject({ wouldEmit: true, reason: "terminal" });
  });
});

describe("simulateLogoDecisions — evolves sandbox state across events", () => {
  it("classic primary→cdn→svg cascade produces accepted/accepted/terminal", () => {
    const decisions = simulateLogoDecisions(
      [
        { kind: "error", stage: "primary-light-png", terminal: false, timestampMs: 0 },
        { kind: "error", stage: "fallback-cdn-full", terminal: false, timestampMs: 10 },
        { kind: "error", stage: "fallback-inline-svg", terminal: true, timestampMs: 20 },
        // Immediate repeat of the terminal stage still counts against the cap
        // but is not throttled (terminal bypass).
        { kind: "error", stage: "fallback-inline-svg", terminal: true, timestampMs: 25 },
      ],
      { config: cfg({ errorMaxPerSession: 5, errorMinIntervalMs: 1000 }) },
    );
    expect(decisions.map((d) => d.reason)).toEqual([
      "accepted",
      "accepted",
      "terminal",
      "terminal",
    ]);
    expect(decisions.map((d) => d.wouldEmit)).toEqual([true, true, true, true]);
    expect(decisions.at(-1)?.stateAfter.errorCount).toBe(4);
  });

  it("flags throttle for a same-stage repeat and stops at the session cap", () => {
    const decisions = simulateLogoDecisions(
      [
        { kind: "error", stage: "primary-light-png", terminal: false, timestampMs: 0 },
        { kind: "error", stage: "primary-light-png", terminal: false, timestampMs: 200 },
        { kind: "error", stage: "primary-light-png", terminal: false, timestampMs: 1200 },
        { kind: "error", stage: "primary-light-png", terminal: false, timestampMs: 2300 },
      ],
      { config: cfg({ errorMaxPerSession: 2, errorMinIntervalMs: 1000 }) },
    );
    expect(decisions.map((d) => d.reason)).toEqual([
      "accepted",
      "throttle",
      "accepted",
      "session-cap",
    ]);
  });
});
