/**
 * Compile-time contracts for admin list telemetry.
 *
 * Every admin list page emits `admin_list_empty_shown` (and, on failure,
 * `admin_list_retry_clicked` / a `reportClientError`) tagged with a
 * `resource` slug and — for empty states — a `reason`. These types make
 * the allowed values enforceable in TypeScript so a typo in a slug or a
 * bogus reason fails at build time instead of drifting into telemetry.
 *
 * See `docs/admin-list-states.md` → "admin_list_empty_shown checklist"
 * for the mapping of URL paths to slugs.
 */

/**
 * Registry of every telemetry slug used by admin list pages. Add to this
 * tuple when introducing a new list page; the compiler will then require
 * `AdminListPage` / `ListEmptyState` / `ListErrorState` callers to use it.
 *
 * Rules:
 *  - snake_case, no spaces, no trailing plural mismatch
 *  - stable — treat as an analytics contract, do not rename lightly
 *  - unique — the same slug must not be reused for two different lists
 */
export const ADMIN_LIST_RESOURCES = [
  "opportunities",
  "commission_invoices",
  "purchase_orders",
  "invoices",
  "proforma_invoices",
] as const;

export type AdminListResource = (typeof ADMIN_LIST_RESOURCES)[number];

/**
 * The only reasons a list may legitimately render an empty state.
 *  - `no_records`    → source table has zero rows for the current user (default)
 *  - `seed_missing`  → the environment is expected to have data but doesn't
 *                      (e.g. smoke-tested env with a broken seed) — escalates
 *                      to `warn` in telemetry
 *  - `filtered_out`  → rows exist, but current filters exclude them
 */
export const ADMIN_LIST_EMPTY_REASONS = [
  "no_records",
  "seed_missing",
  "filtered_out",
] as const;

export type AdminListEmptyReason = (typeof ADMIN_LIST_EMPTY_REASONS)[number];

/** Runtime guard for slugs coming from untrusted callers (tests, scripts). */
export function isAdminListResource(value: unknown): value is AdminListResource {
  return (
    typeof value === "string" &&
    (ADMIN_LIST_RESOURCES as readonly string[]).includes(value)
  );
}

/** Runtime guard for reasons coming from untrusted callers. */
export function isAdminListEmptyReason(
  value: unknown,
): value is AdminListEmptyReason {
  return (
    typeof value === "string" &&
    (ADMIN_LIST_EMPTY_REASONS as readonly string[]).includes(value)
  );
}

/* ------------------------------------------------------------------ *
 * Runtime validation wrapper for admin_list_empty_shown              *
 * ------------------------------------------------------------------ *
 * TypeScript blocks bad values at compile time, but the event also
 * has non-typed callers (Storybook, ad-hoc scripts, tests that build
 * the payload as `unknown`). This wrapper is the LAST line of defence:
 * it inspects the payload, drops anything with an unknown `resource`
 * or `reason`, and emits a `warn`-level diagnostic instead so drift is
 * visible without polluting analytics with garbage rows.
 */

export type AdminListEmptyPayload = {
  surface: "admin_list";
  resource: AdminListResource;
  reason: AdminListEmptyReason;
};

export type EmitAdminListEmptyResult =
  | { ok: true; payload: AdminListEmptyPayload; level: "info" | "warn" }
  | {
      ok: false;
      reason: "invalid_resource" | "invalid_reason" | "invalid_surface";
      offending: unknown;
    };

/**
 * Signature of the underlying transport. `client-monitor.logClientEvent`
 * matches this shape; tests pass a spy.
 */
export type ClientEventLogger = (
  event: string,
  payload: Record<string, unknown>,
  level?: "info" | "warn" | "error",
) => void;

/**
 * Validate a candidate `admin_list_empty_shown` payload and, if it
 * passes, forward it to `logger`. Rejects with a structured result and
 * emits a `admin_list_empty_shown__rejected` diagnostic (level `warn`)
 * instead of the real event when validation fails.
 *
 * Returns the outcome so callers (and tests) can assert on it. The
 * return value is intentionally never thrown — telemetry MUST NOT crash
 * the UI.
 */
export function emitAdminListEmptyShown(
  candidate: unknown,
  logger: ClientEventLogger,
): EmitAdminListEmptyResult {
  const obj =
    candidate && typeof candidate === "object"
      ? (candidate as Record<string, unknown>)
      : {};

  if (obj.surface !== "admin_list") {
    const result = {
      ok: false as const,
      reason: "invalid_surface" as const,
      offending: obj.surface,
    };
    safeLog(logger, "admin_list_empty_shown__rejected", {
      reason: result.reason,
      offending: obj.surface,
      allowed_surface: "admin_list",
    });
    return result;
  }

  if (!isAdminListResource(obj.resource)) {
    const result = {
      ok: false as const,
      reason: "invalid_resource" as const,
      offending: obj.resource,
    };
    safeLog(logger, "admin_list_empty_shown__rejected", {
      reason: result.reason,
      offending: obj.resource,
      allowed: [...ADMIN_LIST_RESOURCES],
    });
    return result;
  }

  if (!isAdminListEmptyReason(obj.reason)) {
    const result = {
      ok: false as const,
      reason: "invalid_reason" as const,
      offending: obj.reason,
    };
    safeLog(logger, "admin_list_empty_shown__rejected", {
      reason: result.reason,
      offending: obj.reason,
      resource: obj.resource,
      allowed: [...ADMIN_LIST_EMPTY_REASONS],
    });
    return result;
  }

  const payload: AdminListEmptyPayload = {
    surface: "admin_list",
    resource: obj.resource,
    reason: obj.reason,
  };
  const level: "info" | "warn" = payload.reason === "seed_missing" ? "warn" : "info";
  safeLog(logger, "admin_list_empty_shown", payload, level);
  return { ok: true, payload, level };
}

/** Swallow transport errors — telemetry must never break the page. */
function safeLog(
  logger: ClientEventLogger,
  event: string,
  payload: Record<string, unknown>,
  level: "info" | "warn" | "error" = "warn",
) {
  try {
    logger(event, payload, level);
  } catch {
    /* intentionally silent */
  }
}

