import { describe, it, expect } from "vitest";
import { classifyListState } from "@/components/admin/list-state";

describe("classifyListState", () => {
  it("returns loading when isLoading and no error", () => {
    expect(
      classifyListState({ isLoading: true, error: null, data: undefined }),
    ).toEqual({ kind: "loading" });
  });

  it("prefers error over loading", () => {
    const err = new Error("boom");
    expect(
      classifyListState({ isLoading: true, error: err, data: undefined }),
    ).toEqual({ kind: "error", error: err });
  });

  it("flags non-array data as an error so telemetry fires", () => {
    const state = classifyListState({
      isLoading: false,
      error: null,
      data: { unexpected: true },
    });
    expect(state.kind).toBe("error");
    if (state.kind === "error") {
      expect((state.error as Error).message).toMatch(/expected array/i);
    }
  });

  it("returns empty:no_records for [] by default", () => {
    expect(
      classifyListState({ isLoading: false, error: null, data: [] }),
    ).toEqual({ kind: "empty", reason: "no_records" });
  });

  it("returns empty:seed_missing when expectSeed is true", () => {
    expect(
      classifyListState({
        isLoading: false,
        error: null,
        data: [],
        expectSeed: true,
      }),
    ).toEqual({ kind: "empty", reason: "seed_missing" });
  });

  it("returns ready with rows when data has items", () => {
    const rows = [{ id: "a" }, { id: "b" }];
    expect(
      classifyListState<{ id: string }>({
        isLoading: false,
        error: null,
        data: rows,
      }),
    ).toEqual({ kind: "ready", rows });
  });
});
