/**
 * Shared classifier for admin list queries. Turns the raw
 * `{ data, error }` from React Query into a discriminated view state so
 * every list page reports the same telemetry for the same edge cases.
 */
export type ListViewState<T> =
  | { kind: "loading" }
  | { kind: "error"; error: unknown }
  | { kind: "empty"; reason: "no_records" | "seed_missing" | "filtered_out" }
  | { kind: "ready"; rows: T[] };

export interface ClassifyOptions {
  isLoading: boolean;
  error: unknown;
  data: unknown;
  /**
   * When true, an empty result is reported as `seed_missing` — used by smoke
   * tests or environments where records are expected to already exist.
   */
  expectSeed?: boolean;
}

/**
 * Normalises the (isLoading, error, data) triple that every admin list
 * page passes around. Non-array data is treated as an error so a schema
 * regression surfaces via `ListErrorState` telemetry instead of silently
 * rendering an empty table.
 */
export function classifyListState<T>({
  isLoading,
  error,
  data,
  expectSeed,
}: ClassifyOptions): ListViewState<T> {
  if (error) return { kind: "error", error };
  if (isLoading) return { kind: "loading" };
  if (data != null && !Array.isArray(data)) {
    return {
      kind: "error",
      error: new Error(
        `Unexpected response shape: expected array, got ${typeof data}`,
      ),
    };
  }
  const rows = (data as T[] | null | undefined) ?? [];
  if (rows.length === 0) {
    return { kind: "empty", reason: expectSeed ? "seed_missing" : "no_records" };
  }
  return { kind: "ready", rows };
}
