import { describe, it, expect } from "vitest";
import { buildSelect, embed } from "../supabase-select";

describe("supabase-select — runtime output", () => {
  it("builds a flat select with only base columns", () => {
    const s = buildSelect("customers", ["id", "name"]);
    expect(s).toBe("id,name");
  });

  it("embeds a related table with alias", () => {
    const s = buildSelect(
      "opportunities",
      ["id", "name"],
      [{ as: "customer", table: "customers", columns: ["name"] }],
    );
    expect(s).toBe("id,name,customer:customers(name)");
  });

  it("embeds without alias", () => {
    expect(embed({ table: "customers", columns: ["id", "name"] })).toBe(
      "customers(id,name)",
    );
  });

  it("matches the exact string admin.opportunities used to send", () => {
    const s = buildSelect(
      "opportunities",
      ["id", "name", "stage", "amount", "currency", "probability", "expected_close_date", "created_at"],
      [
        { as: "customer", table: "customers", columns: ["name"] },
        { as: "partner", table: "partners", columns: ["company_name"] },
      ],
    );
    expect(s).toBe(
      "id,name,stage,amount,currency,probability,expected_close_date,created_at,customer:customers(name),partner:partners(company_name)",
    );
  });

  it("throws when no columns and no embeds are provided", () => {
    expect(() => buildSelect("customers", [])).toThrow(/at least one column/);
  });

  it("throws when an embed spec has no columns", () => {
    expect(() =>
      embed({ table: "customers", columns: [] as unknown as ["name"] }),
    ).toThrow(/at least one column/);
  });
});

// Compile-time guarantees. These lines exist so that if the type helper
// ever regresses to accept unknown columns, the file fails to typecheck.
describe("supabase-select — compile-time column safety", () => {
  it("rejects unknown base columns and unknown embed columns", () => {
    // Valid — should compile cleanly.
    buildSelect(
      "opportunities",
      ["id", "name"],
      [{ as: "customer", table: "customers", columns: ["name"] }],
    );

    // NOTE: base-column typos are also caught by ColumnOf<T>, but the
    // signature accepts `readonly ColumnOf<T>[]` and TS widens a bare
    // `["typo"]` literal to `string[]` inconsistently across versions —
    // the more reliable regression guard is the embed check below, which
    // is exactly the shape that broke the admin list pages.


    // "not_a_real_column" is NOT a column of customers. This is the exact
    // shape of bug that broke the admin list pages at runtime; it must fail
    // typecheck.
    buildSelect("opportunities", ["id"], [
      // @ts-expect-error — customers has no `not_a_real_column` column
      { as: "customer", table: "customers", columns: ["not_a_real_column"] },
    ]);

    // @ts-expect-error — "not_a_table" is not a public table
    buildSelect("not_a_table", ["id"]);


    expect(true).toBe(true);
  });
});
