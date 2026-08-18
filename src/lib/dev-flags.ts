/**
 * Dev-overlay feature flags.
 *
 * Rules (deliberately conservative — these overlays must never appear during
 * ordinary local authenticated testing, in E2E/visual runs, or in production):
 *
 *  1. Overlays are OFF by default, even in a dev build.
 *  2. They only turn on in a dev build (`import.meta.env.DEV`). A production
 *     bundle can never enable them, whatever the env or localStorage say.
 *  3. Turning one on requires an EXPLICIT opt-in, either:
 *       - build/env:  VITE_DEV_OVERLAYS="router-devtools,route-area-badge"
 *                     (or "all" / "1" / "true" for every overlay)
 *       - runtime:    localStorage["nevo:dev-overlays"] = "all"
 *                     (see enableDevOverlays() / disableDevOverlays())
 *  4. Automated runs opt OUT hard: when VITE_E2E / VITE_VISUAL is set, or
 *     `window.__NEVO_DISABLE_DEV_OVERLAYS__` is true, everything stays off so
 *     Playwright and the visual-regression harness see a clean shell.
 *
 * The parsing logic is a pure function (`resolveDevOverlay`) so it can be
 * unit-tested without a browser or a dev build.
 */

export const DEV_OVERLAY_FLAGS = [
  "router-devtools",
  "query-devtools",
  "route-area-badge",
  "layout-grid",
] as const;

export type DevOverlayFlag = (typeof DEV_OVERLAY_FLAGS)[number];

export const DEV_OVERLAY_STORAGE_KEY = "nevo:dev-overlays";
export const DEV_OVERLAY_ENV_KEY = "VITE_DEV_OVERLAYS";

const ALL_TOKENS = new Set(["all", "1", "true", "*", "on", "yes"]);
const OFF_TOKENS = new Set(["", "0", "false", "none", "off", "no"]);

function tokenize(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

/** Does an opt-in source (env value or storage value) select `flag`? */
function sourceSelects(raw: string | null | undefined, flag: DevOverlayFlag): boolean {
  const tokens = tokenize(raw);
  if (tokens.length === 0) return false;
  if (tokens.every((t) => OFF_TOKENS.has(t))) return false;
  if (tokens.some((t) => ALL_TOKENS.has(t))) return true;
  return tokens.includes(flag);
}

export type DevOverlayEnvironment = {
  /** True only for a dev build (`import.meta.env.DEV`). */
  isDev: boolean;
  /** Value of VITE_DEV_OVERLAYS, if any. */
  envValue?: string | null;
  /** Value of localStorage["nevo:dev-overlays"], if any. */
  storageValue?: string | null;
  /** True when running under Playwright E2E or the visual harness. */
  isAutomated?: boolean;
};

/**
 * Pure resolver — the single source of truth for "should this overlay render?".
 */
export function resolveDevOverlay(flag: DevOverlayFlag, env: DevOverlayEnvironment): boolean {
  if (!env.isDev) return false;
  if (env.isAutomated) return false;
  return sourceSelects(env.envValue, flag) || sourceSelects(env.storageValue, flag);
}

function readStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(DEV_OVERLAY_STORAGE_KEY);
  } catch {
    return null;
  }
}

function readAutomated(): boolean {
  const env = import.meta.env as Record<string, unknown>;
  if (env["VITE_E2E"] || env["VITE_VISUAL"]) return true;
  if (typeof window !== "undefined") {
    const w = window as unknown as { __NEVO_DISABLE_DEV_OVERLAYS__?: boolean };
    if (w.__NEVO_DISABLE_DEV_OVERLAYS__ === true) return true;
  }
  return false;
}

/** Snapshot of the live environment (browser + build env). */
export function currentDevOverlayEnvironment(): DevOverlayEnvironment {
  const env = import.meta.env as Record<string, unknown>;
  return {
    isDev: env["DEV"] === true,
    envValue: typeof env[DEV_OVERLAY_ENV_KEY] === "string" ? (env[DEV_OVERLAY_ENV_KEY] as string) : null,
    storageValue: readStorage(),
    isAutomated: readAutomated(),
  };
}

/** Runtime check used by components. Safe during SSR (returns false). */
export function isDevOverlayEnabled(flag: DevOverlayFlag): boolean {
  return resolveDevOverlay(flag, currentDevOverlayEnvironment());
}

/** Console helper: enableDevOverlays() or enableDevOverlays("route-area-badge"). */
export function enableDevOverlays(...flags: DevOverlayFlag[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEV_OVERLAY_STORAGE_KEY, flags.length ? flags.join(",") : "all");
  } catch {
    /* storage unavailable — nothing to do */
  }
}

/** Console helper: turn every dev overlay back off. */
export function disableDevOverlays(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DEV_OVERLAY_STORAGE_KEY);
  } catch {
    /* storage unavailable — nothing to do */
  }
}
