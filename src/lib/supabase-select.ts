import type { Database } from "@/integrations/supabase/types";

/**
 * Type-safe builder for PostgREST select strings with nested embeds.
 *
 * Motivation: hand-written select strings like
 *   "id,customer:customers(company_name)"
 * fail at runtime with `column customers.company_name does not exist`
 * because PostgREST just parses the string. This helper turns those
 * columns into a TypeScript literal type checked against the generated
 * `Database` types — so `customers.company_name` (which doesn't exist)
 * fails at build time instead.
 *
 * Usage:
 *   const cols = buildSelect("opportunities", [
 *     "id", "name", "stage",
 *   ], [
 *     embed({ as: "customer", table: "customers", columns: ["id", "name"] }),
 *     embed({ as: "partner", table: "partners", columns: ["company_name"] }),
 *   ]);
 *   supabase.from("opportunities").select(cols);
 */

type PublicTables = Database["public"]["Tables"];
export type TableName = keyof PublicTables & string;
export type ColumnOf<T extends TableName> = keyof PublicTables[T]["Row"] & string;

export interface EmbedSpec<T extends TableName = TableName> {
  /** Optional alias — produces `alias:table(cols)` instead of `table(cols)`. */
  as?: string;
  table: T;
  columns: readonly ColumnOf<T>[];
}

export function embed<T extends TableName>(spec: EmbedSpec<T>): string {
  if (spec.columns.length === 0) {
    throw new Error(`embed(${spec.table}): at least one column is required`);
  }
  const cols = spec.columns.join(",");
  return spec.as ? `${spec.as}:${spec.table}(${cols})` : `${spec.table}(${cols})`;
}

export function buildSelect<T extends TableName>(
  table: T,
  columns: readonly ColumnOf<T>[],
  embeds: readonly EmbedSpec[] = [],
): string {
  if (columns.length === 0 && embeds.length === 0) {
    throw new Error(`buildSelect(${table}): select must project at least one column`);
  }
  return [...columns, ...embeds.map((e) => embed(e))].join(",");
}
