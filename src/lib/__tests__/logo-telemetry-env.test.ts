/**
 * End-to-end sampling test: verifies that the VITE_LOGO_* environment
 * variables propagate through `logo-telemetry-config` into the emission
 * decisions in `logo-telemetry`, and that only the emitted events reach
 * the "storage" sink (which mirrors what /api/public/client-log persists
 * into public.header_logo_events — the ingest layer stores whatever the
 * client emits, so gating the emit gates the store).
 *
 * Env vars covered:
 *   VITE_LOGO_RENDER_SAMPLE_RATE
 *   VITE_LOGO_ERROR_MAX_PER_SESSION
 *   VITE_LOGO_ERROR_MIN_INTERVAL_MS
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Emission =
  | { kind: "render" }
  | { kind: "error"; stage: string; terminal: boolean; at: number };

/**
 * Import the telemetry modules fresh so they observe the current
 * `import.meta.env` stubs. Returns a small harness that drives a
 * deterministic stream of would-be events through the samplers and
 * records everything that makes it past the gate — i.e. what would be
 * POSTed to /api/public/client-log and stored in header_logo_events.
 */
async function loadHarness(
  opts: {
    random?: () => number;
  } = {},
) {
  vi.resetModules();
  const config = await import("../logo-telemetry-config");
  const tele = await import("../logo-telemetry");

  const state = tele.createLogoRateState();
  const stored: Emission[] = [];
  const random = opts.random ?? (() => 0); // default: always "sample in"

  return {
    config: config.LOGO_TELEMETRY_CONFIG,
    /** Simulate one render attempt. */
    tryRender() {
      if (tele.shouldLogRender({ state, config: config.LOGO_TELEMETRY_CONFIG, random })) {
        stored.push({ kind: "render" });
      }
    },
    /** Simulate one error attempt at a given clock time (ms). */
    tryError(stage: string, terminal: boolean, at: number) {
      if (
        tele.shouldLogError(stage, terminal, {
          state,
          config: config.LOGO_TELEMETRY_CONFIG,
          now: () => at,
        })
      ) {
        stored.push({ kind: "error", stage, terminal, at });
      }
    },
    state,
    stored,
  };
}

beforeEach(() => {
  // Wipe every VITE_LOGO_* stub so each test starts from defaults.
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("VITE_LOGO_RENDER_SAMPLE_RATE controls which render events are stored", () => {
  it("rate=0 stores zero renders no matter how many attempts", async () => {
    vi.stubEnv("VITE_LOGO_RENDER_SAMPLE_RATE", "0");
    const h = await loadHarness({ random: () => 0 });
    expect(h.config.renderSampleRate).toBe(0);
    for (let i = 0; i < 25; i++) h.tryRender();
    expect(h.stored.filter((e) => e.kind === "render")).toHaveLength(0);
  });

  it("rate=1 stores exactly one render per session (dedupe still applies)", async () => {
    vi.stubEnv("VITE_LOGO_RENDER_SAMPLE_RATE", "1");
    const h = await loadHarness({ random: () => 0.99 });
    expect(h.config.renderSampleRate).toBe(1);
    for (let i = 0; i < 10; i++) h.tryRender();
    expect(h.stored.filter((e) => e.kind === "render")).toHaveLength(1);
  });

  it("fractional rate seals decision on first roll — unlucky first roll stores nothing", async () => {
    vi.stubEnv("VITE_LOGO_RENDER_SAMPLE_RATE", "0.25");
    // First random roll returns 0.9 (>= 0.25 → not sampled). Later rolls
    // would have been lucky but the decision is locked for the session.
    const rolls = [0.9, 0.0, 0.0, 0.0];
    let i = 0;
    const h = await loadHarness({ random: () => rolls[i++] ?? 0 });
    expect(h.config.renderSampleRate).toBe(0.25);
    for (let n = 0; n < 4; n++) h.tryRender();
    expect(h.stored).toHaveLength(0);
  });

  it("out-of-range and malformed values clamp to safe defaults", async () => {
    vi.stubEnv("VITE_LOGO_RENDER_SAMPLE_RATE", "9.9"); // clamps to 1
    let h = await loadHarness();
    expect(h.config.renderSampleRate).toBe(1);

    vi.stubEnv("VITE_LOGO_RENDER_SAMPLE_RATE", "-1"); // clamps to 0
    h = await loadHarness();
    expect(h.config.renderSampleRate).toBe(0);

    vi.stubEnv("VITE_LOGO_RENDER_SAMPLE_RATE", "not-a-number"); // falls back
    h = await loadHarness();
    // Default is 1 in dev / 0.05 in prod; either way it must be a valid probability.
    expect(h.config.renderSampleRate).toBeGreaterThanOrEqual(0);
    expect(h.config.renderSampleRate).toBeLessThanOrEqual(1);
  });
});

describe("VITE_LOGO_ERROR_MAX_PER_SESSION caps how many errors are stored", () => {
  it("cap=0 stores zero errors — including terminal ones", async () => {
    vi.stubEnv("VITE_LOGO_ERROR_MAX_PER_SESSION", "0");
    const h = await loadHarness();
    expect(h.config.errorMaxPerSession).toBe(0);
    h.tryError("primary-light-png", false, 0);
    h.tryError("fallback-cdn-full", false, 10);
    h.tryError("fallback-inline-svg", true, 20);
    expect(h.stored).toHaveLength(0);
  });

  it("cap=2 stores exactly two errors then drops the rest", async () => {
    vi.stubEnv("VITE_LOGO_ERROR_MAX_PER_SESSION", "2");
    vi.stubEnv("VITE_LOGO_ERROR_MIN_INTERVAL_MS", "0"); // isolate the cap
    const h = await loadHarness();
    expect(h.config.errorMaxPerSession).toBe(2);
    for (let i = 0; i < 5; i++) h.tryError(`stage-${i}`, false, i);
    expect(h.stored).toHaveLength(2);
    expect(h.stored.map((e) => (e.kind === "error" ? e.stage : ""))).toEqual([
      "stage-0",
      "stage-1",
    ]);
  });

  it("clamps a huge value to the 0..1000 range", async () => {
    vi.stubEnv("VITE_LOGO_ERROR_MAX_PER_SESSION", "999999");
    const h = await loadHarness();
    expect(h.config.errorMaxPerSession).toBe(1000);
  });

  it("clamps a negative value to 0", async () => {
    vi.stubEnv("VITE_LOGO_ERROR_MAX_PER_SESSION", "-5");
    const h = await loadHarness();
    expect(h.config.errorMaxPerSession).toBe(0);
  });
});

describe("VITE_LOGO_ERROR_MIN_INTERVAL_MS throttles per-stage repeats", () => {
  it("interval=2000 suppresses a same-stage repeat inside the window", async () => {
    vi.stubEnv("VITE_LOGO_ERROR_MIN_INTERVAL_MS", "2000");
    vi.stubEnv("VITE_LOGO_ERROR_MAX_PER_SESSION", "10");
    const h = await loadHarness();
    expect(h.config.errorMinIntervalMs).toBe(2000);

    h.tryError("primary-light-png", false, 0);
    h.tryError("primary-light-png", false, 500); // dropped (throttle)
    h.tryError("primary-light-png", false, 1999); // dropped (still inside)
    h.tryError("primary-light-png", false, 2000); // allowed (edge)
    expect(h.stored).toHaveLength(2);
  });

  it("interval=0 lets every error through until the session cap", async () => {
    vi.stubEnv("VITE_LOGO_ERROR_MIN_INTERVAL_MS", "0");
    vi.stubEnv("VITE_LOGO_ERROR_MAX_PER_SESSION", "50");
    const h = await loadHarness();
    for (let t = 0; t < 10; t++) h.tryError("primary-light-png", false, t);
    expect(h.stored).toHaveLength(10);
  });

  it("clamps out-of-range interval to <=60000", async () => {
    vi.stubEnv("VITE_LOGO_ERROR_MIN_INTERVAL_MS", "9999999");
    const h = await loadHarness();
    expect(h.config.errorMinIntervalMs).toBe(60_000);
  });
});

describe("Realistic cascade with env-driven caps", () => {
  it("primary→cdn→svg cascade + repeats: stores exactly what caps allow", async () => {
    // Session cap 3, throttle 1s. Terminal SVG bypasses throttle but counts.
    vi.stubEnv("VITE_LOGO_ERROR_MAX_PER_SESSION", "3");
    vi.stubEnv("VITE_LOGO_ERROR_MIN_INTERVAL_MS", "1000");
    vi.stubEnv("VITE_LOGO_RENDER_SAMPLE_RATE", "1");
    const h = await loadHarness({ random: () => 0 });

    // First paint attempts a render (stored once).
    h.tryRender();
    h.tryRender();

    // The fallback cascade fires three distinct stages in the same tick.
    h.tryError("primary-light-png", false, 0);
    h.tryError("fallback-cdn-full", false, 0);
    h.tryError("fallback-inline-svg", true, 0);

    // A flapping terminal error a moment later — session cap already hit.
    h.tryError("fallback-inline-svg", true, 200);

    const renders = h.stored.filter((e) => e.kind === "render");
    const errors = h.stored.filter((e) => e.kind === "error");
    expect(renders).toHaveLength(1);
    expect(errors).toHaveLength(3);
    expect(errors.map((e) => (e.kind === "error" ? e.stage : ""))).toEqual([
      "primary-light-png",
      "fallback-cdn-full",
      "fallback-inline-svg",
    ]);
  });
});
