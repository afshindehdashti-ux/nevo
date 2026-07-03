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
 * ────────────────────────────────────────────────────────────────────────
 * Quick use in the browser devtools (dev build only)
 * ────────────────────────────────────────────────────────────────────────
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
 *
 * ────────────────────────────────────────────────────────────────────────
 * Single-line console format (grep-friendly)
 * ────────────────────────────────────────────────────────────────────────
 *
 * When live debug logging is on (`VITE_LOGO_DEBUG=1`, `?logoDebug=1`,
 * `localStorage.setItem("nevo:logo-debug", "1")`, or the runtime toggle
 * `__nevoLogoDebug.enableLogLine()`), every sampling decision is printed as
 * one flat line of `key=value` pairs separated by a single space. Spaces,
 * newlines, tabs, and other control characters inside a field value are
 * escaped as `\xNN` so the line never breaks and every `key=value` token is
 * grep-safe.
 *
 * Copy/paste examples of a printed line (wrapped here for readability only —
 * the actual output is one continuous line):
 *
 *   [nevo:logo-telemetry] kind=error decision=sampled-in reason=accepted
 *     stage=primary-light-png terminal=false correlationId=cid-123
 *     counters.renderLogged=false counters.renderSampled=true counters.errorCount=1
 *     counters.lastErrorStage=primary-light-png counters.msSinceLastError=null
 *     limits.renderSampleRate=0.01 limits.errorMaxPerSession=5 limits.errorMinIntervalMs=1000
 *     ts=123456789
 *
 *   [nevo:logo-telemetry] kind=render decision=sampled-in reason=first-render
 *     stage=null terminal=undefined correlationId=cid-123
 *     counters.renderLogged=true counters.renderSampled=true counters.errorCount=0
 *     counters.lastErrorStage= counters.msSinceLastError=null
 *     limits.renderSampleRate=0.01 limits.errorMaxPerSession=5 limits.errorMinIntervalMs=1000
 *     ts=123456789
 *
 *   [nevo:logo-telemetry] kind=error decision=sampled-out reason=throttle
 *     stage=primary-light-png terminal=false correlationId=cid-123
 *     counters.renderLogged=false counters.renderSampled=true counters.errorCount=1
 *     counters.lastErrorStage=primary-light-png counters.msSinceLastError=150
 *     limits.renderSampleRate=0.01 limits.errorMaxPerSession=5 limits.errorMinIntervalMs=1000
 *     ts=123456789
 *
 * Useful grep queries for QA:
 *
 *   # all logo-telemetry lines in a browser console export
 *   grep "\[nevo:logo-telemetry\]" console.log
 *
 *   # every decision for one incident
 *   grep "correlationId=cid-123" console.log
 *
 *   # only errors that were actually emitted (not throttled/capped)
 *   grep "kind=error decision=sampled-in" console.log
 *
 *   # only errors that were suppressed and why
 *   grep "kind=error decision=sampled-out" console.log
 *
 *   # all events for a specific render stage
 *   grep "stage=primary-light-png" console.log
 *
 *   # everything throttled by the per-stage interval
 *   grep "reason=throttle" console.log
 *
 *   # the first render sample decision for this session
 *   grep "reason=first-render" console.log
 *
 *   # combine filters with grep -E
 *   grep -E "kind=error.*reason=terminal|reason=terminal.*kind=error" console.log
 *
 *   # count how many errors made it through the session cap
 *   grep -c "kind=error decision=sampled-in" console.log
 *
 * ────────────────────────────────────────────────────────────────────────
 * Toggling noise at runtime
 * ────────────────────────────────────────────────────────────────────────
 *
 * The live `[nevo:logo-telemetry]` console lines are independent from the
 * ring buffer. Turning the line off keeps the buffer recording, so QA can
 * reduce console noise while still grabbing a full dump after a repro:
 *
 *   __nevoLogoDebug.enableLogLine()   // turn single-line console output on
 *   __nevoLogoDebug.disableLogLine()  // turn it off
 *   __nevoLogoDebug.isLogLineEnabled() // → true | false
 *
 * ────────────────────────────────────────────────────────────────────────
 * Sharing a minimal incident dump
 * ────────────────────────────────────────────────────────────────────────
 *
 *   // full dump (all recent decisions)
 *   __nevoLogoDebug.copyDump()
 *
 *   // minimal dump scoped to one correlationId
 *   __nevoLogoDebug.copyDumpForCorrelationId("cid-123")
 *   // filename becomes nevo-logo-telemetry-button-cid-cid-123-<timestamp>.json
 */

import {
  LOGO_TELEMETRY_CONFIG,
  disableLogoDebug,
  disableLogoDebugLogLine,
  enableLogoDebug,
  enableLogoDebugLogLine,
  isLogoDebugEnabled,
  isLogoDebugLogLineEnabled,
  setLogoDebugLogLine,
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
  config: Pick<
    LogoTelemetryConfig,
    "renderSampleRate" | "errorMaxPerSession" | "errorMinIntervalMs"
  >;
};

const cloneState = (s: LogoRateState): LogoRateState => ({
  renderLogged: s.renderLogged,
  renderSampled: s.renderSampled,
  errorCount: s.errorCount,
  lastErrorAt: s.lastErrorAt,
  lastErrorStage: s.lastErrorStage,
});

const pickConfig = (c: LogoTelemetryConfig): LogoDecision["config"] => ({
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
        sandbox.renderSampled === null ? random() < config.renderSampleRate : sandbox.renderSampled;
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
  /**
   * Report of what redactLogoTelemetryDump() stripped so reporters know
   * the blob isn't the raw wire format. Empty array = nothing matched.
   */
  redactions: string[];
  /**
   * True when the dump helper was called from a production bundle and
   * refused to expose telemetry. Payload is empty in that case.
   */
  disabled?: boolean;
  /**
   * Set when the dump was scoped with any of the fields on
   * `LogoDumpFilter` (kind, decision, reason, stage, terminal,
   * correlationId). `matchedCount` counts raw ring-buffer entries that
   * matched BEFORE redaction so a reporter can tell "0 matches" apart
   * from "filter dropped everything". `correlationId` is kept as a
   * top-level shortcut for back-compat with single-id dumps; the full
   * criteria object is always exposed under `criteria`.
   */
  filter?: {
    correlationId?: string;
    criteria: LogoDumpFilter;
    matchedCount: number;
    totalScanned: number;
  };
};

/**
 * Multi-field filter for `buildLogoTelemetryDump` and friends. Every
 * field is optional; a scalar matches by equality and an array matches
 * by "any of". A decision must satisfy ALL provided fields to be kept
 * (AND across fields, OR within a field).
 */
export type LogoDumpFilter = {
  kind?: LogoDecisionRecord["kind"] | Array<LogoDecisionRecord["kind"]>;
  decision?: LogoDecisionRecord["decision"] | Array<LogoDecisionRecord["decision"]>;
  reason?: string | string[];
  stage?: string | string[];
  terminal?: boolean;
  correlationId?: string | string[];
};

export type LogoDumpOptions = {
  /**
   * Shortcut for `{ filter: { correlationId } }` — kept for back-compat
   * with the single-incident dump helpers. If both are supplied,
   * `filter` wins.
   */
  correlationId?: string;
  /** Multi-field filter across kind/decision/reason/stage/terminal/correlationId. */
  filter?: LogoDumpFilter;
};

function matchField<T>(want: T | T[] | undefined, actual: T): boolean {
  if (want === undefined) return true;
  return Array.isArray(want) ? (want as T[]).includes(actual) : want === actual;
}

export function matchesLogoDumpFilter(
  d: LogoDecisionRecord,
  f: LogoDumpFilter,
): boolean {
  return (
    matchField(f.kind, d.kind) &&
    matchField(f.decision, d.decision) &&
    matchField(f.reason, d.reason) &&
    matchField(f.stage as string | string[] | undefined, d.stage as string) &&
    (f.terminal === undefined || d.terminal === f.terminal) &&
    matchField(f.correlationId as string | string[] | undefined, d.correlationId as string)
  );
}

function resolveDumpFilter(opts: LogoDumpOptions): LogoDumpFilter | undefined {
  if (opts.filter) return opts.filter;
  if (opts.correlationId !== undefined) return { correlationId: opts.correlationId };
  return undefined;
}

const REDACTED = "[redacted]";

// Query / hash param names that carry auth material on this app and in
// most OAuth / Supabase flows. Match case-insensitively.
const SENSITIVE_PARAM_NAMES = new Set(
  [
    "token",
    "access_token",
    "refresh_token",
    "id_token",
    "code",
    "state",
    "key",
    "apikey",
    "api_key",
    "secret",
    "password",
    "pwd",
    "email",
    "session",
    "sig",
    "signature",
    "authorization",
    "auth",
    "bearer",
  ].map((n) => n.toLowerCase()),
);

// String-value patterns that almost always mean a credential regardless of
// where they appear in the dump. Kept intentionally narrow to avoid eating
// legitimate stage strings ("primary-light-png" etc.).
const CREDENTIAL_STRING_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: "jwt", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { label: "bearer", re: /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}\b/gi },
  { label: "sk-token", re: /\b(?:sk|pk|rk|xox[abpr])[-_][A-Za-z0-9]{16,}\b/g },
  { label: "email", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
];

// correlationId is meant to be an opaque short id. Anything longer than
// this is suspicious (could embed a user id, email, path). Also redact if
// it contains "@" or a "user"/"uid" prefix regardless of length.
const CORRELATION_ID_MAX_LEN = 64;

function redactUrl(raw: string, hits: string[]): string {
  try {
    const u = new URL(raw);
    let touched = false;
    // Query params
    for (const name of Array.from(u.searchParams.keys())) {
      if (SENSITIVE_PARAM_NAMES.has(name.toLowerCase())) {
        u.searchParams.set(name, REDACTED);
        touched = true;
      }
    }
    // Hash (Supabase implicit OAuth returns tokens after #)
    if (u.hash && u.hash.length > 1) {
      const params = new URLSearchParams(u.hash.replace(/^#/, ""));
      let hashTouched = false;
      for (const name of Array.from(params.keys())) {
        if (SENSITIVE_PARAM_NAMES.has(name.toLowerCase())) {
          params.set(name, REDACTED);
          hashTouched = true;
        }
      }
      if (hashTouched) {
        u.hash = `#${params.toString()}`;
        touched = true;
      }
    }
    // userinfo (http://user:pass@host)
    if (u.username || u.password) {
      u.username = "";
      u.password = "";
      touched = true;
    }
    if (touched) hits.push("url:params");
    return u.toString();
  } catch {
    return raw;
  }
}

function redactString(value: string, hits: string[]): string {
  let out = value;
  for (const { label, re } of CREDENTIAL_STRING_PATTERNS) {
    if (re.test(out)) {
      out = out.replace(re, REDACTED);
      hits.push(`string:${label}`);
      // reset lastIndex for the /g regex before next use
      re.lastIndex = 0;
    }
  }
  return out;
}

function redactCorrelationId(id: string | undefined, hits: string[]): string | undefined {
  if (!id) return id;
  const looksSensitive =
    id.length > CORRELATION_ID_MAX_LEN || id.includes("@") || /^(user|uid|email)[:=/-]/i.test(id);
  if (looksSensitive) {
    hits.push("correlationId");
    return REDACTED;
  }
  // Still scrub embedded credential shapes just in case.
  return redactString(id, hits);
}

function redactDecisions(decisions: LogoDecisionRecord[], hits: string[]): LogoDecisionRecord[] {
  return decisions.map((d) => ({
    ...d,
    correlationId: redactCorrelationId(d.correlationId, hits),
    // stage strings are internal enum-ish labels, but pass through the
    // string scrubber defensively in case a custom stage carries a token.
    stage: d.stage == null ? d.stage : redactString(d.stage, hits),
    counters: {
      ...d.counters,
      lastErrorStage: redactString(d.counters.lastErrorStage, hits),
    },
  }));
}

/**
 * Strip anything that looks like a token, user identifier, credential, or
 * auth-bearing URL param from an already-built dump. Returns a NEW dump
 * (never mutates the input) plus the deduped list of redaction labels
 * that fired, which is exposed on `dump.redactions`.
 *
 * We intentionally do NOT try to redact `userAgent` — it's needed to
 * reproduce browser-specific rendering bugs and doesn't carry auth
 * material. We also don't capture HTTP headers anywhere in the dump, so
 * there is nothing header-shaped to strip.
 */
export function redactLogoTelemetryDump(raw: LogoTelemetryDump): LogoTelemetryDump {
  const hits: string[] = [];
  const url = raw.url ? redactUrl(raw.url, hits) : raw.url;
  const decisions = redactDecisions(raw.decisions, hits);
  const deduped = Array.from(new Set([...raw.redactions, ...hits]));
  return {
    ...raw,
    url,
    decisions,
    redactions: deduped,
  };
}

/**
 * Runtime dev-build guard. Mirrors the check in `attachLogoDebugUtil()` so
 * every publicly reachable helper refuses to expose telemetry from a
 * published bundle — even if someone imports these functions directly
 * (bypassing `window.__nevoLogoDebug`) or a future refactor drops the
 * top-level attach guard. Tests run under Vitest with `DEV=true` so the
 * suite is unaffected; escape hatch below is for the rare test that
 * needs to exercise the disabled branch.
 */
function isLogoDebugBuildEnabled(): boolean {
  if (
    typeof globalThis !== "undefined" &&
    (globalThis as { __NEVO_FORCE_DISABLE_LOGO_DEBUG__?: boolean })
      .__NEVO_FORCE_DISABLE_LOGO_DEBUG__ === true
  ) {
    return false;
  }
  return import.meta.env.DEV === true;
}

/**
 * Shape returned from every dump helper when running in a production
 * bundle. The `disabled` flag lets callers (and QA reports) tell a real
 * empty dump apart from "we refused to build one".
 */
function disabledDump(origin: LogoTelemetryDump["origin"]): LogoTelemetryDump {
  return {
    schema: "nevo.logo-telemetry.dump/v1",
    capturedAt: new Date().toISOString(),
    origin,
    url: null,
    userAgent: null,
    debugEnabled: false,
    config: LOGO_TELEMETRY_CONFIG,
    state: {
      renderLogged: false,
      renderSampled: null,
      errorCount: 0,
      lastErrorAt: 0,
      lastErrorStage: "",
    },
    decisions: [],
    decisionsTruncated: false,
    redactions: ["disabled:production-build"],
    disabled: true,
  };
}

export function buildLogoTelemetryDump(
  origin: LogoTelemetryDump["origin"] = "console",
  opts: LogoDumpOptions = {},
): LogoTelemetryDump {
  if (!isLogoDebugBuildEnabled()) return disabledDump(origin);
  const allDecisions = getRecentLogoDecisions();
  const totalScanned = allDecisions.length;
  // Filter BEFORE redaction so we match against raw ids (a sensitive id
  // gets rewritten to "[redacted]" and would never match a QA-supplied
  // value).
  const criteria = resolveDumpFilter(opts);
  const filtered = criteria
    ? allDecisions.filter((d) => matchesLogoDumpFilter(d, criteria))
    : allDecisions;
  const nav = typeof navigator !== "undefined" ? (navigator.userAgent ?? null) : null;
  const url = typeof window !== "undefined" && window.location ? window.location.href : null;
  const legacyCid =
    criteria &&
    typeof criteria.correlationId === "string" &&
    Object.keys(criteria).length === 1
      ? criteria.correlationId
      : undefined;
  const raw: LogoTelemetryDump = {
    schema: "nevo.logo-telemetry.dump/v1",
    capturedAt: new Date().toISOString(),
    origin,
    url,
    userAgent: nav,
    debugEnabled: isLogoDebugEnabled(),
    config: LOGO_TELEMETRY_CONFIG,
    state: cloneState(getLogoRateState()),
    decisions: filtered,
    // The buffer caps at 50 in logo-telemetry.ts. When filtering, the
    // "did we drop earlier data?" question is about the ring buffer, not
    // about the filter — so still report against the raw capture.
    decisionsTruncated: totalScanned >= 50,
    redactions: [],
    ...(criteria
      ? {
          filter: {
            ...(legacyCid !== undefined ? { correlationId: legacyCid } : {}),
            criteria,
            matchedCount: filtered.length,
            totalScanned,
          },
        }
      : {}),
  };
  return redactLogoTelemetryDump(raw);
}

export function dumpLogoTelemetryAsJSON(
  origin: LogoTelemetryDump["origin"] = "console",
  opts: LogoDumpOptions = {},
): string {
  if (!isLogoDebugBuildEnabled()) return "";
  return JSON.stringify(buildLogoTelemetryDump(origin, opts), null, 2);
}

/**
 * Copy the dump to the clipboard when available; always echo the JSON to the
 * console so the reporter can grab it either way. Returns the JSON string
 * so callers can chain further (e.g., paste programmatically in a test).
 */
async function copyLogoTelemetryDump(
  origin: LogoTelemetryDump["origin"] = "console",
  opts: LogoDumpOptions = {},
): Promise<string> {
  if (!isLogoDebugBuildEnabled()) return "";
  const json = dumpLogoTelemetryAsJSON(origin, opts);
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
  opts: LogoDumpOptions = {},
): string {
  if (!isLogoDebugBuildEnabled()) return "";
  const json = dumpLogoTelemetryAsJSON(origin, opts);
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
  // Include a filesystem-safe correlationId slug in the filename when the
  // dump is scoped, so an attached incident file is self-describing.
  const cidSlug = opts.correlationId
    ? `-cid-${opts.correlationId.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 40)}`
    : "";
  const filename = `nevo-logo-telemetry-${origin}${cidSlug}-${stamp}.json`;
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
  if (!isLogoDebugBuildEnabled()) return;
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
       * Toggle the single-line grep-friendly `[nevo:logo-telemetry] ...`
       * console output at runtime. When disabled, the ring buffer keeps
       * recording so `dump()` / `getRecent()` still return everything.
       */
      enableLogLine: () => void;
      disableLogLine: () => void;
      setLogLine: (on: boolean) => void;
      isLogLineEnabled: () => boolean;
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
      dump: (origin?: LogoTelemetryDump["origin"], opts?: LogoDumpOptions) => LogoTelemetryDump;
      /** Same blob, pretty-printed JSON. */
      dumpAsJSON: (origin?: LogoTelemetryDump["origin"], opts?: LogoDumpOptions) => string;
      /** Echo to console + write to clipboard when permitted. */
      copyDump: (origin?: LogoTelemetryDump["origin"], opts?: LogoDumpOptions) => Promise<string>;
      /** Save the dump to a .json file via a synthetic download. */
      downloadDump: (origin?: LogoTelemetryDump["origin"], opts?: LogoDumpOptions) => string;
      /**
       * Scope a dump to a single correlationId — QA can share a minimal
       * JSON blob for one incident without leaking unrelated decisions.
       */
      dumpForCorrelationId: (
        correlationId: string,
        origin?: LogoTelemetryDump["origin"],
      ) => LogoTelemetryDump;
      dumpForCorrelationIdAsJSON: (
        correlationId: string,
        origin?: LogoTelemetryDump["origin"],
      ) => string;
      copyDumpForCorrelationId: (
        correlationId: string,
        origin?: LogoTelemetryDump["origin"],
      ) => Promise<string>;
      downloadDumpForCorrelationId: (
        correlationId: string,
        origin?: LogoTelemetryDump["origin"],
      ) => string;
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
    enableLogLine: enableLogoDebugLogLine,
    disableLogLine: disableLogoDebugLogLine,
    setLogLine: setLogoDebugLogLine,
    isLogLineEnabled: isLogoDebugLogLineEnabled,
    getRecent: getRecentLogoDecisions,
    getRecentAsJSON: () => JSON.stringify(getRecentLogoDecisions(), null, 2),
    clearRecent: clearLogoDecisions,
    dump: buildLogoTelemetryDump,
    dumpAsJSON: dumpLogoTelemetryAsJSON,
    copyDump: copyLogoTelemetryDump,
    downloadDump: downloadLogoTelemetryDump,
    dumpForCorrelationId: (correlationId, origin = "console") =>
      buildLogoTelemetryDump(origin, { correlationId }),
    dumpForCorrelationIdAsJSON: (correlationId, origin = "console") =>
      dumpLogoTelemetryAsJSON(origin, { correlationId }),
    copyDumpForCorrelationId: (correlationId, origin = "console") =>
      copyLogoTelemetryDump(origin, { correlationId }),
    downloadDumpForCorrelationId: (correlationId, origin = "console") =>
      downloadLogoTelemetryDump(origin, { correlationId }),
  };
}

// Auto-attach on import in dev. Safe on the server (guarded above).
attachLogoDebugUtil();
