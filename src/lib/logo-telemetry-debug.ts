/**
 * Dev-only debug utility for header-logo telemetry sampling & throttling.
 *
 * Given a hypothetical event (stage, terminal, correlationId, timestamp),
 * returns the exact decision the samplers WOULD make right now — without
 * mutating the live session state, so you can dry-run many combinations
 * against the current `LOGO_TELEMETRY_CONFIG` values that were baked in
 * from the VITE_LOGO_* env vars.
 *
 * Not shipped in production: the top-level `attachLogoDebugUtil()` call
 * only runs when `import.meta.env.DEV` is true. The pure function
 * `explainLogoDecision` has no side effects and is safe to import from
 * tests as well.
 *
 * Quick use in the browser devtools (dev build only):
 *
 *   __nevoLogoDebug.explain({
 *     kind: "error",
 *     stage: "primary-light-png",
 *     terminal: false,
 *     correlationId: "abc-123",
 *     timestampMs: Date.now(),
 *   })
 *   // → { wouldEmit: true, reason: "accepted", ... }
 *
 *   __nevoLogoDebug.explain({ kind: "render", correlationId: "abc-123" })
 *   // → { wouldEmit: false, reason: "already-logged", ... }
 *
 *   __nevoLogoDebug.simulate([
 *     { kind: "error", stage: "primary-light-png", terminal: false, timestampMs: 0 },
 *     { kind: "error", stage: "primary-light-png", terminal: false, timestampMs: 200 },
 *     { kind: "error", stage: "fallback-inline-svg", terminal: true, timestampMs: 210 },
 *   ])
 *   // → array of decisions against a fresh session state.
 */

import {
  LOGO_TELEMETRY_CONFIG,
  disableLogoDebug,
  enableLogoDebug,
  isLogoDebugEnabled,
  type LogoTelemetryConfig,
} from "./logo-telemetry-config";
import {
  clearLogoDecisions,
  createLogoRateState,
  getLogoRateState,
  getRecentLogoDecisions,
  shouldLogError,
  shouldLogRender,
  type LogoDecisionRecord,
  type LogoRateState,
} from "./logo-telemetry";

export type LogoDebugEvent =
  | {
      kind: "render";
      correlationId?: string;
      /** Ignored for renders but accepted so callers can reuse one payload shape. */
      timestampMs?: number;
    }
  | {
      kind: "error";
      stage: string;
      terminal: boolean;
      correlationId?: string;
      /** Wall-clock ms used as the sampler's `now()`. Defaults to Date.now(). */
      timestampMs?: number;
    };

export type LogoDecisionReason =
  // render
  | "already-logged"
  | "sample-rate"
  | "first-render"
  // error
  | "session-cap"
  | "throttle"
  | "accepted"
  | "terminal";

export type LogoDecision = {
  wouldEmit: boolean;
  reason: LogoDecisionReason;
  kind: "render" | "error";
  stage?: string;
  terminal?: boolean;
  correlationId?: string;
  timestampMs: number;
  msSinceLastSameStage: number | null;
  /** Snapshot of the state *before* the decision was applied. */
  stateBefore: LogoRateState;
  /** Snapshot of the state *after* the decision was applied (in the sandbox). */
  stateAfter: LogoRateState;
  config: Pick<LogoTelemetryConfig, "renderSampleRate" | "errorMaxPerSession" | "errorMinIntervalMs">;
};

const cloneState = (s: LogoRateState): LogoRateState => ({
  renderLogged: s.renderLogged,
  renderSampled: s.renderSampled,
  errorCount: s.errorCount,
  lastErrorAt: s.lastErrorAt,
  lastErrorStage: s.lastErrorStage,
});

const pickConfig = (
  c: LogoTelemetryConfig,
): LogoDecision["config"] => ({
  renderSampleRate: c.renderSampleRate,
  errorMaxPerSession: c.errorMaxPerSession,
  errorMinIntervalMs: c.errorMinIntervalMs,
});

/**
 * Dry-run one event against an isolated copy of the given state. The live
 * session state is NEVER mutated; if no state is supplied, the current
 * live state is cloned and used as the starting point so the answer
 * reflects "what would happen right now, in this tab".
 *
 * The `random` knob defaults to something that will pass the sample check
 * (0) — the render sampler is deterministic per session after its first
 * call, so this only matters for the very first render event.
 */
export function explainLogoDecision(
  event: LogoDebugEvent,
  opts: {
    state?: LogoRateState;
    config?: LogoTelemetryConfig;
    random?: () => number;
  } = {},
): LogoDecision {
  const config = opts.config ?? LOGO_TELEMETRY_CONFIG;
  const stateBefore = cloneState(opts.state ?? getLogoRateState());
  const sandbox = cloneState(stateBefore);
  const timestampMs = event.timestampMs ?? Date.now();
  const random = opts.random ?? (() => 0);

  if (event.kind === "render") {
    // Reproduce shouldLogRender's decision tree exactly.
    let reason: LogoDecisionReason;
    let wouldEmit: boolean;
    if (sandbox.renderLogged) {
      reason = "already-logged";
      wouldEmit = false;
    } else {
      const sampled =
        sandbox.renderSampled === null
          ? random() < config.renderSampleRate
          : sandbox.renderSampled;
      if (!wouldEmit_from(sampled)) {
        reason = "sample-rate";
        wouldEmit = false;
      } else {
        reason = "first-render";
        wouldEmit = true;
      }
    }
    // Apply to sandbox using the real sampler so behavior can never drift.
    shouldLogRender({ state: sandbox, config, random });

    return {
      wouldEmit,
      reason,
      kind: "render",
      correlationId: event.correlationId,
      timestampMs,
      msSinceLastSameStage: null,
      stateBefore,
      stateAfter: sandbox,
      config: pickConfig(config),
    };
  }

  // error
  const { stage, terminal } = event;
  const msSinceLastSameStage =
    stage === sandbox.lastErrorStage && sandbox.lastErrorAt > 0
      ? timestampMs - sandbox.lastErrorAt
      : null;

  let reason: LogoDecisionReason;
  let wouldEmit: boolean;
  if (sandbox.errorCount >= config.errorMaxPerSession) {
    reason = "session-cap";
    wouldEmit = false;
  } else if (
    !terminal &&
    stage === sandbox.lastErrorStage &&
    timestampMs - sandbox.lastErrorAt < config.errorMinIntervalMs
  ) {
    reason = "throttle";
    wouldEmit = false;
  } else {
    reason = terminal ? "terminal" : "accepted";
    wouldEmit = true;
  }
  // Drive the real sampler so the sandbox reflects the mutation it would apply.
  shouldLogError(stage, terminal, { state: sandbox, config, now: () => timestampMs });

  return {
    wouldEmit,
    reason,
    kind: "error",
    stage,
    terminal,
    correlationId: event.correlationId,
    timestampMs,
    msSinceLastSameStage,
    stateBefore,
    stateAfter: sandbox,
    config: pickConfig(config),
  };
}

// Small helper kept out-of-line so the render branch reads cleanly.
function wouldEmit_from(sampled: boolean): boolean {
  return sampled === true;
}

/**
 * Dry-run a sequence of events against a single evolving sandbox state.
 * Starts from the caller-supplied state (or a fresh one) — never touches
 * the live session state.
 */
export function simulateLogoDecisions(
  events: LogoDebugEvent[],
  opts: {
    state?: LogoRateState;
    config?: LogoTelemetryConfig;
    random?: () => number;
  } = {},
): LogoDecision[] {
  const state = cloneState(opts.state ?? createLogoRateState());
  const decisions: LogoDecision[] = [];
  for (const ev of events) {
    const d = explainLogoDecision(ev, { ...opts, state });
    decisions.push(d);
    // Persist the mutation into the running sandbox so the next event sees it.
    Object.assign(state, d.stateAfter);
  }
  return decisions;
}

/**
 * Attach the debug utility to `window.__nevoLogoDebug` in dev builds only.
 * No-op in production so nothing ships to end users.
 */
export function attachLogoDebugUtil(): void {
  if (!import.meta.env.DEV) return;
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    __nevoLogoDebug?: {
      explain: typeof explainLogoDecision;
      simulate: typeof simulateLogoDecisions;
      state: () => LogoRateState;
      config: () => LogoTelemetryConfig;
      /** Turn on live [nevo:logo-telemetry] console lines for QA. */
      enable: () => void;
      /** Turn them off (also clears the localStorage flag). */
      disable: () => void;
      /** Whether live debug logging is currently on. */
      isEnabled: () => boolean;
      /**
       * Snapshot of the last ≤50 sampling decisions (oldest first). Safe to
       * `JSON.stringify` and paste into a bug report — the buffer records
       * every sampler call regardless of the debug flag.
       */
      getRecent: () => LogoDecisionRecord[];
      /** Same tail, pre-serialized for one-shot clipboard copy. */
      getRecentAsJSON: () => string;
      /** Empty the ring buffer (useful before a fresh repro). */
      clearRecent: () => void;
    };
  };
  w.__nevoLogoDebug = {
    explain: explainLogoDecision,
    simulate: simulateLogoDecisions,
    state: () => cloneState(getLogoRateState()),
    config: () => LOGO_TELEMETRY_CONFIG,
    enable: enableLogoDebug,
    disable: disableLogoDebug,
    isEnabled: isLogoDebugEnabled,
    getRecent: getRecentLogoDecisions,
    getRecentAsJSON: () => JSON.stringify(getRecentLogoDecisions(), null, 2),
    clearRecent: clearLogoDecisions,
  };
}

// Auto-attach on import in dev. Safe on the server (guarded above).
attachLogoDebugUtil();
