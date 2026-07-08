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
