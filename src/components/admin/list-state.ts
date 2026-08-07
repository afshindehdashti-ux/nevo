import type { AdminListEmptyReason } from "./list-telemetry";

/**
 * Shared classifier for admin list queries. Turns the raw
 * `{ data, error }` from React Query into a discriminated view state so
 * every list page reports the same telemetry for the same edge cases.
 */
export type ListViewState<T> =
  | { kind: "loading" }
  | { kind: "error"; error: unknown }
  | { kind: "empty"; reason: AdminListEmptyReason }
  | { kind: "ready"; rows: T[] };

/**
 * Options for `classifyListState`. `expectSeed` and `filtersActive` are
 * mutually exclusive: an env either expects seeded data (and getting `[]`
 * is `seed_missing`) or the user narrowed the list with a filter (and
 * getting `[]` is `filtered_out`) — not both at once. The union enforces
 * this at compile time so callers can't request an ambiguous state.
 */
export type ClassifyOptions = {
  isLoading: boolean;
  error: unknown;
  data: unknown;
} & (
  | { expectSeed?: false; filtersActive?: false }
  | { expectSeed: true; filtersActive?: never }
  | { expectSeed?: never; filtersActive: true }
);

/**
 * Normalises the (isLoading, error, data) triple that every admin list
 * page passes around. Non-array data is treated as an error so a schema
 * regression surfaces via `ListErrorState` telemetry instead of silently
 * rendering an empty table.
 */
export function classifyListState<T>(opts: ClassifyOptions): ListViewState<T> {
  const { isLoading, error, data } = opts;
  if (error) return { kind: "error", error };
  if (isLoading) return { kind: "loading" };
  if (data != null && !Array.isArray(data)) {
    return {
      kind: "error",
      error: new Error(`Unexpected response shape: expected array, got ${typeof data}`),
    };
  }
  const rows = (data as T[] | null | undefined) ?? [];
  if (rows.length === 0) {
    const reason: AdminListEmptyReason = opts.expectSeed
      ? "seed_missing"
      : opts.filtersActive
        ? "filtered_out"
        : "no_records";
    return { kind: "empty", reason };
  }
  return { kind: "ready", rows };
}
