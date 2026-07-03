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
 * Full QA bug-report blob: everything a reporter needs to reproduce a sticky
 * logo issue in one paste. Pure function — safe to call from tests and from
 * the console. `origin` tags where the dump came from so we can grep server
 * logs later ("console" vs "button" vs "auto").
 */
export type LogoTelemetryDump = {
  schema: "nevo.logo-telemetry.dump/v1";
  capturedAt: string; // ISO
  origin: "console" | "button" | "auto";
  url: string | null;
  userAgent: string | null;
  debugEnabled: boolean;
  config: LogoTelemetryConfig;
  state: LogoRateState;
  decisions: LogoDecisionRecord[];
  decisionsTruncated: boolean;
};

export function buildLogoTelemetryDump(
  origin: LogoTelemetryDump["origin"] = "console",
): LogoTelemetryDump {
  const decisions = getRecentLogoDecisions();
  const nav =
    typeof navigator !== "undefined" ? navigator.userAgent ?? null : null;
  const url =
    typeof window !== "undefined" && window.location
      ? window.location.href
      : null;
  return {
    schema: "nevo.logo-telemetry.dump/v1",
    capturedAt: new Date().toISOString(),
    origin,
    url,
    userAgent: nav,
    debugEnabled: isLogoDebugEnabled(),
    config: LOGO_TELEMETRY_CONFIG,
    state: cloneState(getLogoRateState()),
    decisions,
    // The buffer caps at 50 in logo-telemetry.ts — flag when we hit the wall
    // so the reporter knows earlier decisions were dropped.
    decisionsTruncated: decisions.length >= 50,
  };
}

export function dumpLogoTelemetryAsJSON(
  origin: LogoTelemetryDump["origin"] = "console",
): string {
  return JSON.stringify(buildLogoTelemetryDump(origin), null, 2);
}

/**
 * Copy the dump to the clipboard when available; always echo the JSON to the
 * console so the reporter can grab it either way. Returns the JSON string
 * so callers can chain further (e.g., paste programmatically in a test).
 */
async function copyLogoTelemetryDump(
  origin: LogoTelemetryDump["origin"] = "console",
): Promise<string> {
  const json = dumpLogoTelemetryAsJSON(origin);
  // Console echo first — clipboard may reject if the tab isn't focused.
  if (typeof console !== "undefined" && typeof console.log === "function") {
    console.log("[nevo:logo-telemetry] dump", json);
  }
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(json);
    }
  } catch {
    // clipboard blocked — the console echo above is the fallback
  }
  return json;
}

/**
 * Save the dump as a downloadable `.json` file — one click, ready to attach
 * to a bug report. Uses a Blob + object URL + synthetic <a download> click,
 * which works in every evergreen browser without any extra permission
 * prompts (unlike the clipboard path). Filename encodes the origin and an
 * ISO timestamp so multiple dumps from the same session don't collide.
 *
 * Returns the JSON string so tests (and callers who want to log it too)
 * can inspect what was written without re-serialising.
 */
export function downloadLogoTelemetryDump(
  origin: LogoTelemetryDump["origin"] = "console",
): string {
  const json = dumpLogoTelemetryAsJSON(origin);
  if (typeof window === "undefined" || typeof document === "undefined") {
    return json;
  }
  const BlobCtor = (window as unknown as { Blob?: typeof Blob }).Blob;
  const URLRef = (window as unknown as { URL?: typeof URL }).URL;
  if (!BlobCtor || !URLRef || typeof URLRef.createObjectURL !== "function") {
    return json;
  }
  // ISO with `:` stripped so the filename is portable across OSes.
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `nevo-logo-telemetry-${origin}-${stamp}.json`;
  const blob = new BlobCtor([json], { type: "application/json" });
  const href = URLRef.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Free the object URL on the next tick so the click had time to start
    // the download in every browser (Safari in particular).
    if (typeof URLRef.revokeObjectURL === "function") {
      setTimeout(() => URLRef.revokeObjectURL(href), 0);
    }
  }
  return json;
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
      /** Full QA bug-report blob (metadata + config + state + decisions). */
      dump: (origin?: LogoTelemetryDump["origin"]) => LogoTelemetryDump;
      /** Same blob, pretty-printed JSON. */
      dumpAsJSON: (origin?: LogoTelemetryDump["origin"]) => string;
      /** Echo to console + write to clipboard when permitted. */
      copyDump: (origin?: LogoTelemetryDump["origin"]) => Promise<string>;
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
    dump: buildLogoTelemetryDump,
    dumpAsJSON: dumpLogoTelemetryAsJSON,
    copyDump: copyLogoTelemetryDump,
  };
}

// Auto-attach on import in dev. Safe on the server (guarded above).
attachLogoDebugUtil();
