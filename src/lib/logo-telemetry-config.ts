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

function clampNumber(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function clampInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
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

export const LOGO_TELEMETRY_CONFIG = {
  renderSampleRate: clampNumber(
    rawEnv.VITE_LOGO_RENDER_SAMPLE_RATE,
    DEFAULT_RENDER_SAMPLE_RATE,
    0,
    1,
  ),
  errorMaxPerSession: clampInt(
    rawEnv.VITE_LOGO_ERROR_MAX_PER_SESSION,
    4,
    0,
    1000,
  ),
  errorMinIntervalMs: clampInt(
    rawEnv.VITE_LOGO_ERROR_MIN_INTERVAL_MS,
    1000,
    0,
    60_000,
  ),
  debug: readDebugFlag(),
} as const;

export type LogoTelemetryConfig = typeof LOGO_TELEMETRY_CONFIG;
