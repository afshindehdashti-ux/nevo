/**
 * Header logo telemetry: sampling + rate-limiting primitives.
 *
 * Extracted from `SiteHeader.tsx` so the behavior is directly unit-testable
 * without rendering the header. The functions are pure w.r.t. a caller-
 * supplied state object; the module also provides a session-scoped default
 * state stored on `window` so React callers can keep using it as before.
 *
 * Rules (must stay in sync with the tests in
 * `src/lib/__tests__/logo-telemetry.test.ts`):
 *
 *  - `shouldLogRender()` fires at most ONCE per session. On first call it
 *    samples via `Math.random() < renderSampleRate` and locks that decision
 *    for the rest of the session.
 *  - `shouldLogError(stage, terminal)` returns false once the session-wide
 *    error cap is reached. Otherwise, non-terminal errors are throttled to
 *    at most one per `errorMinIntervalMs` for the same `stage`; a different
 *    stage bypasses the throttle. Terminal errors ALWAYS bypass the
 *    per-stage throttle but still count against the session cap.
 */

import { LOGO_TELEMETRY_CONFIG, type LogoTelemetryConfig } from "./logo-telemetry-config";

export type LogoRateState = {
  renderLogged: boolean;
  renderSampled: boolean | null; // null = not decided yet
  errorCount: number;
  lastErrorAt: number;
  lastErrorStage: string;
};

export function createLogoRateState(): LogoRateState {
  return {
    renderLogged: false,
    renderSampled: null,
    errorCount: 0,
    lastErrorAt: 0,
    lastErrorStage: "",
  };
}

/** Session-scoped default state hung off `window`. SSR-safe. */
export function getLogoRateState(): LogoRateState {
  if (typeof window === "undefined") return createLogoRateState();
  const w = window as unknown as { __nevoLogoRate?: LogoRateState };
  if (!w.__nevoLogoRate) w.__nevoLogoRate = createLogoRateState();
  return w.__nevoLogoRate;
}

type Deps = {
  state?: LogoRateState;
  config?: LogoTelemetryConfig;
  now?: () => number;
  random?: () => number;
};

/**
 * Emit a lightweight QA debug line describing a sampling decision.
 * No-op unless `config.debug` is enabled (see `logo-telemetry-config`:
 * VITE_LOGO_DEBUG=1, window.__nevoLogoDebug, localStorage 'nevo:logo-debug'=1,
 * or `?logoDebug=1` URL flag). Uses console.debug so it is silent by default
 * in production browsers unless the user explicitly opts in.
 */
function debugLog(
  kind: "render" | "error",
  decision: "sampled-in" | "sampled-out",
  reason: string,
  state: LogoRateState,
  config: LogoTelemetryConfig,
  extra: Record<string, unknown> = {},
): void {
  if (!config.debug) return;
  if (typeof console === "undefined" || typeof console.debug !== "function") return;
  console.debug("[nevo:logo-telemetry]", {
    kind,
    decision,
    reason,
    ...extra,
    counters: {
      renderLogged: state.renderLogged,
      renderSampled: state.renderSampled,
      errorCount: state.errorCount,
      lastErrorStage: state.lastErrorStage,
      lastErrorAt: state.lastErrorAt,
    },
    config: {
      renderSampleRate: config.renderSampleRate,
      errorMaxPerSession: config.errorMaxPerSession,
      errorMinIntervalMs: config.errorMinIntervalMs,
    },
  });
}

/** Returns true when a render event should be sent to the log sink. */
export function shouldLogRender(deps: Deps = {}): boolean {
  const state = deps.state ?? getLogoRateState();
  const config = deps.config ?? LOGO_TELEMETRY_CONFIG;
  const random = deps.random ?? Math.random;
  if (state.renderLogged) {
    debugLog("render", "sampled-out", "already-logged", state, config);
    return false;
  }
  if (state.renderSampled === null) {
    state.renderSampled = random() < config.renderSampleRate;
  }
  if (!state.renderSampled) {
    debugLog("render", "sampled-out", "sample-rate", state, config);
    return false;
  }
  state.renderLogged = true;
  debugLog("render", "sampled-in", "first-render", state, config);
  return true;
}

/**
 * Returns true when an error event should be sent.
 * Terminal errors bypass the per-stage throttle (but still respect the
 * session cap).
 */
export function shouldLogError(
  stage: string,
  terminal: boolean,
  deps: Deps = {},
): boolean {
  const state = deps.state ?? getLogoRateState();
  const config = deps.config ?? LOGO_TELEMETRY_CONFIG;
  const nowFn = deps.now ?? Date.now;
  if (state.errorCount >= config.errorMaxPerSession) {
    debugLog("error", "sampled-out", "session-cap", state, config, { stage, terminal });
    return false;
  }
  const now = nowFn();
  if (
    !terminal &&
    stage === state.lastErrorStage &&
    now - state.lastErrorAt < config.errorMinIntervalMs
  ) {
    debugLog("error", "sampled-out", "throttle", state, config, {
      stage,
      terminal,
      msSinceLast: now - state.lastErrorAt,
    });
    return false;
  }
  state.errorCount += 1;
  state.lastErrorAt = now;
  state.lastErrorStage = stage;
  debugLog("error", "sampled-in", terminal ? "terminal" : "accepted", state, config, {
    stage,
    terminal,
  });
  return true;
}
