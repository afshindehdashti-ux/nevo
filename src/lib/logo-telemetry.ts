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
  /** QA-only: attached to the debug line so a full page-load can be grepped. */
  correlationId?: string;
};

/**
 * Emit a lightweight QA debug line describing a sampling decision.
 * No-op unless `config.debug` is enabled (see `logo-telemetry-config`:
 * VITE_LOGO_DEBUG=1, window.__nevoLogoDebug, localStorage 'nevo:logo-debug'=1,
 * or `?logoDebug=1` URL flag). Uses console.debug so it is silent by default
 * in production browsers unless the user explicitly opts in.
 *
 * Shape (single flat object — easy to grep, filter, or JSON-copy from devtools):
 *
 *   [nevo:logo-telemetry] {
 *     kind: "error" | "render",
 *     decision: "sampled-in" | "sampled-out",
 *     reason: "first-render" | "sample-rate" | "already-logged"
 *           | "accepted" | "terminal" | "throttle" | "session-cap",
 *     stage:          string | null,       // "primary-light-png", "fallback-cdn-full", …
 *     terminal:       boolean | undefined,
 *     correlationId:  string | undefined,  // when the caller has one
 *     counters: { renderLogged, renderSampled, errorCount, lastErrorStage, msSinceLastError },
 *     limits:   { renderSampleRate, errorMaxPerSession, errorMinIntervalMs },
 *     ts:             number,              // ms since epoch, from the sampler's clock
 *   }
 */
export type LogoDecisionRecord = {
  kind: "render" | "error";
  decision: "sampled-in" | "sampled-out";
  reason: string;
  stage: string | null;
  terminal: boolean | undefined;
  correlationId: string | undefined;
  counters: {
    renderLogged: boolean;
    renderSampled: boolean | null;
    errorCount: number;
    lastErrorStage: string;
    msSinceLastError: number | null;
  };
  limits: {
    renderSampleRate: number;
    errorMaxPerSession: number;
    errorMinIntervalMs: number;
  };
  ts: number;
};

/**
 * Ring buffer of the last N sampling decisions. Populated on EVERY sampler
 * call (regardless of the `debug` flag) so QA can call
 * `window.__nevoLogoDebug.getRecent()` after a repro and paste the tail.
 * Size is intentionally small (50) — enough to cover a page load plus a
 * handful of retries without unbounded memory growth.
 */
export const LOGO_DECISION_BUFFER_SIZE = 50;
const decisionBuffer: LogoDecisionRecord[] = [];

export function recordLogoDecision(record: LogoDecisionRecord): void {
  decisionBuffer.push(record);
  if (decisionBuffer.length > LOGO_DECISION_BUFFER_SIZE) {
    decisionBuffer.splice(0, decisionBuffer.length - LOGO_DECISION_BUFFER_SIZE);
  }
}

/** Returns a copy of the ring buffer, oldest first. Safe to mutate. */
export function getRecentLogoDecisions(): LogoDecisionRecord[] {
  return decisionBuffer.slice();
}

export function clearLogoDecisions(): void {
  decisionBuffer.length = 0;
}

function debugLog(
  kind: "render" | "error",
  decision: "sampled-in" | "sampled-out",
  reason: string,
  state: LogoRateState,
  config: LogoTelemetryConfig,
  ctx: {
    stage?: string;
    terminal?: boolean;
    correlationId?: string;
    now: number;
    msSinceLastError?: number;
  },
): void {
  const record: LogoDecisionRecord = {
    kind,
    decision,
    reason,
    stage: ctx.stage ?? null,
    terminal: ctx.terminal,
    correlationId: ctx.correlationId,
    counters: {
      renderLogged: state.renderLogged,
      renderSampled: state.renderSampled,
      errorCount: state.errorCount,
      lastErrorStage: state.lastErrorStage,
      msSinceLastError:
        ctx.msSinceLastError ??
        (state.lastErrorAt ? ctx.now - state.lastErrorAt : null),
    },
    limits: {
      renderSampleRate: config.renderSampleRate,
      errorMaxPerSession: config.errorMaxPerSession,
      errorMinIntervalMs: config.errorMinIntervalMs,
    },
    ts: ctx.now,
  };
  // Always record — cheap, capped, and the whole point of the ring buffer
  // is that QA can grab a tail after a repro without having flipped the
  // debug flag ahead of time.
  recordLogoDecision(record);
  if (!config.debug) return;
  if (typeof console === "undefined" || typeof console.debug !== "function") return;
  console.debug("[nevo:logo-telemetry]", record);
}

/** Returns true when a render event should be sent to the log sink. */
export function shouldLogRender(deps: Deps = {}): boolean {
  const state = deps.state ?? getLogoRateState();
  const config = deps.config ?? LOGO_TELEMETRY_CONFIG;
  const random = deps.random ?? Math.random;
  const nowFn = deps.now ?? Date.now;
  const now = nowFn();
  const dbgCtx = { correlationId: deps.correlationId, now };
  if (state.renderLogged) {
    debugLog("render", "sampled-out", "already-logged", state, config, dbgCtx);
    return false;
  }
  if (state.renderSampled === null) {
    state.renderSampled = random() < config.renderSampleRate;
  }
  if (!state.renderSampled) {
    debugLog("render", "sampled-out", "sample-rate", state, config, dbgCtx);
    return false;
  }
  state.renderLogged = true;
  debugLog("render", "sampled-in", "first-render", state, config, dbgCtx);
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
  const now = nowFn();
  const base = { stage, terminal, correlationId: deps.correlationId, now };
  if (state.errorCount >= config.errorMaxPerSession) {
    debugLog("error", "sampled-out", "session-cap", state, config, base);
    return false;
  }
  if (
    !terminal &&
    stage === state.lastErrorStage &&
    now - state.lastErrorAt < config.errorMinIntervalMs
  ) {
    debugLog("error", "sampled-out", "throttle", state, config, {
      ...base,
      msSinceLastError: now - state.lastErrorAt,
    });
    return false;
  }
  state.errorCount += 1;
  state.lastErrorAt = now;
  state.lastErrorStage = stage;
  debugLog("error", "sampled-in", terminal ? "terminal" : "accepted", state, config, base);
  return true;
}

