/**
 * Runtime-tunable configuration for header logo telemetry.
 *
 * Sample rates and error caps are read from Vite env vars at build time so
 * they can be adjusted per environment (preview / production / staging)
 * without touching component code. All values are clamped to safe ranges;
 * malformed or missing values fall back to defaults.
 *
 * Available knobs (all optional):
 *   VITE_LOGO_RENDER_SAMPLE_RATE   0..1 — probability of logging one render
 *                                  event per tab session. Default: 1 in dev,
 *                                  0.05 in production.
 *   VITE_LOGO_ERROR_MAX_PER_SESSION integer ≥ 0 — max header.logo.error
 *                                  events sent per tab session. Default: 4.
 *   VITE_LOGO_ERROR_MIN_INTERVAL_MS integer ≥ 0 — minimum ms between two
 *                                  non-terminal errors of the same stage.
 *                                  Default: 1000.
 *
 * To disable render logging entirely: VITE_LOGO_RENDER_SAMPLE_RATE=0
 * To disable error logging entirely:  VITE_LOGO_ERROR_MAX_PER_SESSION=0
 */

type Env = Record<string, string | undefined>;

const rawEnv = (import.meta.env ?? {}) as unknown as Env;

function clampNumber(raw: string | undefined, fallback: number, min: number, max: number): number {
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  return Math.floor(clampNumber(raw, fallback, min, max));
}

const DEFAULT_RENDER_SAMPLE_RATE = import.meta.env.DEV ? 1 : 0.05;

function readDebugFlag(): boolean {
  // Build-time opt-in via Vite env
  if (rawEnv.VITE_LOGO_DEBUG === "1" || rawEnv.VITE_LOGO_DEBUG === "true") {
    return true;
  }
  // Runtime opt-in for QA: URL ?logoDebug=1, localStorage, or window global
  if (typeof window !== "undefined") {
    try {
      const w = window as unknown as { __nevoLogoDebug?: boolean };
      if (w.__nevoLogoDebug) return true;
      if (
        typeof window.localStorage !== "undefined" &&
        window.localStorage.getItem("nevo:logo-debug") === "1"
      ) {
        return true;
      }
      if (
        typeof window.location !== "undefined" &&
        /[?&]logoDebug=1\b/.test(window.location.search)
      ) {
        return true;
      }
    } catch {
      // ignore storage / access errors
    }
  }
  return false;
}

function readLogLineFlag(): boolean {
  // Default ON — historically every debug decision produced a console line.
  // QA can silence just the console noise (while keeping the ring buffer
  // and dump helpers intact) by setting this to "0".
  if (typeof window !== "undefined") {
    try {
      if (
        typeof window.localStorage !== "undefined" &&
        window.localStorage.getItem("nevo:logo-debug-line") === "0"
      ) {
        return false;
      }
      if (
        typeof window.location !== "undefined" &&
        /[?&]logoDebugLine=0\b/.test(window.location.search)
      ) {
        return false;
      }
    } catch {
      /* ignore */
    }
  }
  return true;
}

export const LOGO_TELEMETRY_CONFIG = {
  renderSampleRate: clampNumber(
    rawEnv.VITE_LOGO_RENDER_SAMPLE_RATE,
    DEFAULT_RENDER_SAMPLE_RATE,
    0,
    1,
  ),
  errorMaxPerSession: clampInt(rawEnv.VITE_LOGO_ERROR_MAX_PER_SESSION, 4, 0, 1000),
  errorMinIntervalMs: clampInt(rawEnv.VITE_LOGO_ERROR_MIN_INTERVAL_MS, 1000, 0, 60_000),
  debug: readDebugFlag(),
  /**
   * When false, the single-line grep-friendly `[nevo:logo-telemetry] ...`
   * console output is suppressed even if `debug` is true. The ring buffer
   * still records every decision so `dump()` / `getRecent()` stay useful.
   */
  logLine: readLogLineFlag(),
} as const;

export type LogoTelemetryConfig = typeof LOGO_TELEMETRY_CONFIG;

/**
 * QA helpers — flip the runtime debug flag from the devtools console without
 * a rebuild. Persist in localStorage so the setting survives reloads.
 *
 *   __nevoLogoDebug.enable()   // start printing [nevo:logo-telemetry] lines
 *   __nevoLogoDebug.disable()  // stop
 *
 * The mutation targets the same `debug` field the samplers read; because
 * `LOGO_TELEMETRY_CONFIG` is a frozen `as const`, we mutate via a cast so
 * the next sampler call sees the new value on the same reference.
 */
export function enableLogoDebug(): void {
  try {
    window.localStorage?.setItem("nevo:logo-debug", "1");
  } catch {
    /* storage unavailable — flag still lives on the config object */
  }
  (LOGO_TELEMETRY_CONFIG as { debug: boolean }).debug = true;
}

export function disableLogoDebug(): void {
  try {
    window.localStorage?.removeItem("nevo:logo-debug");
  } catch {
    /* ignore */
  }
  (LOGO_TELEMETRY_CONFIG as { debug: boolean }).debug = false;
}

export function isLogoDebugEnabled(): boolean {
  return LOGO_TELEMETRY_CONFIG.debug;
}

/**
 * Runtime toggle for the single-line grep-friendly console output.
 * QA can silence noise mid-repro without losing dump data. Persists in
 * localStorage (`nevo:logo-debug-line=0` silences) and honors the
 * `?logoDebugLine=0` URL flag on first load.
 *
 *   __nevoLogoDebug.enableLogLine()   // print console lines (default)
 *   __nevoLogoDebug.disableLogLine()  // silence, keep ring buffer
 *   __nevoLogoDebug.setLogLine(on)    // programmatic
 */
export function enableLogoDebugLogLine(): void {
  try {
    window.localStorage?.removeItem("nevo:logo-debug-line");
  } catch {
    /* ignore */
  }
  (LOGO_TELEMETRY_CONFIG as { logLine: boolean }).logLine = true;
}

export function disableLogoDebugLogLine(): void {
  try {
    window.localStorage?.setItem("nevo:logo-debug-line", "0");
  } catch {
    /* ignore */
  }
  (LOGO_TELEMETRY_CONFIG as { logLine: boolean }).logLine = false;
}

export function setLogoDebugLogLine(on: boolean): void {
  if (on) enableLogoDebugLogLine();
  else disableLogoDebugLogLine();
}

export function isLogoDebugLogLineEnabled(): boolean {
  return LOGO_TELEMETRY_CONFIG.logLine;
}
