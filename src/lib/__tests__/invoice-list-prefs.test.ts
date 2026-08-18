import { describe, expect, it, beforeEach } from "vitest";
import {
  INVOICE_LIST_DEFAULTS,
  clearStoredInvoicePrefs,
  fromInvoiceSearch,
  invoiceListStorageKey,
  readStoredInvoicePrefs,
  resolveInvoiceListPrefs,
  sanitizeInvoiceListPrefs,
  toInvoiceSearch,
  urlHasInvoiceListState,
  writeStoredInvoicePrefs,
  type InvoiceListPrefs,
} from "@/lib/invoice-list-prefs";

/** Minimal in-memory Storage stand-in that survives a simulated refresh. */
function makeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    get size() {
      return map.size;
    },
  };
}

const KEY = invoiceListStorageKey("commercial");

/**
 * Simulates one visit: resolve prefs from URL + storage, optionally apply user
 * changes, then mirror the resulting state back to storage the way the list
 * component does on every prefs change.
 */
function visit(
  storage: ReturnType<typeof makeStorage>,
  locationSearch: string,
  changes: Partial<InvoiceListPrefs> = {},
) {
  const params = new URLSearchParams(locationSearch);
  const num = (k: string) => (params.has(k) ? Number(params.get(k)) : undefined);
  const resolved = resolveInvoiceListPrefs({
    locationSearch,
    urlSearch: {
      q: params.get("q") ?? undefined,
      status: params.get("status") ?? undefined,
      page: num("page"),
      size: num("size"),
      sort: params.get("sort") ?? undefined,
      dir: params.get("dir") ?? undefined,
    },
    storageKey: KEY,
    storage,
  });
  const prefs = { ...resolved.prefs, ...changes };
  writeStoredInvoicePrefs(KEY, prefs, storage);
  const url = `?${new URLSearchParams(
    Object.entries(toInvoiceSearch(prefs)).map(([k, v]) => [k, String(v)]),
  ).toString()}`;
  return { prefs, url, source: resolved.source };
}

describe("invoice list prefs persistence", () => {
  let storage: ReturnType<typeof makeStorage>;
  beforeEach(() => {
    storage = makeStorage();
  });

  it("starts from defaults with no URL state and empty storage", () => {
    const first = visit(storage, "");
    expect(first.source).toBe("defaults");
    expect(first.prefs).toEqual(INVOICE_LIST_DEFAULTS);
  });

  it("restores search across a refresh with a bare URL", () => {
    visit(storage, "", { search: "acme" });
    const after = visit(storage, "");
    expect(after.source).toBe("storage");
    expect(after.prefs.search).toBe("acme");
  });

  it("restores the status filter across a refresh", () => {
    visit(storage, "", { statusFilter: "overdue" });
    expect(visit(storage, "").prefs.statusFilter).toBe("overdue");
  });

  it("restores sort key and direction across a refresh", () => {
    visit(storage, "", { sortKey: "total", sortDir: "asc" });
    const after = visit(storage, "").prefs;
    expect(after.sortKey).toBe("total");
    expect(after.sortDir).toBe("asc");
  });

  it("restores rows-per-page across a refresh", () => {
    visit(storage, "", { pageSize: 50 });
    expect(visit(storage, "").prefs.pageSize).toBe(50);
  });

  it("restores the current page across a refresh", () => {
    visit(storage, "", { page: 4 });
    expect(visit(storage, "").prefs.page).toBe(4);
  });

  it("restores every dimension together after a refresh", () => {
    const chosen: InvoiceListPrefs = {
      search: "nevo ltd",
      statusFilter: "issued",
      pageSize: 100,
      page: 3,
      sortKey: "due_date",
      sortDir: "asc",
    };
    visit(storage, "", chosen);
    const after = visit(storage, "");
    expect(after.prefs).toEqual(chosen);
    // …and again, so persistence is stable over repeated refreshes.
    expect(visit(storage, "").prefs).toEqual(chosen);
  });

  it("keeps state in the URL so a refresh on a shared link is faithful", () => {
    const first = visit(storage, "", {
      search: "pump",
      statusFilter: "paid",
      pageSize: 10,
      page: 2,
      sortKey: "customer",
      sortDir: "asc",
    });
    const refreshed = visit(storage, first.url);
    expect(refreshed.source).toBe("url");
    expect(refreshed.prefs).toEqual(first.prefs);
    expect(refreshed.url).toBe(first.url);
  });

  it("lets URL state win over stored prefs", () => {
    visit(storage, "", { search: "stored", pageSize: 50, page: 7 });
    const shared = visit(storage, "?q=shared&size=10&page=2");
    expect(shared.source).toBe("url");
    expect(shared.prefs.search).toBe("shared");
    expect(shared.prefs.pageSize).toBe(10);
    expect(shared.prefs.page).toBe(2);
  });

  it("treats a single list param as explicit URL state", () => {
    expect(urlHasInvoiceListState("?dir=asc")).toBe(true);
    expect(urlHasInvoiceListState("?utm_source=mail")).toBe(false);
    expect(urlHasInvoiceListState("")).toBe(false);
  });

  it("returns to defaults after clearing stored prefs", () => {
    visit(storage, "", { search: "acme", pageSize: 50, page: 6 });
    clearStoredInvoicePrefs(KEY, storage);
    const after = visit(storage, "");
    expect(after.source).toBe("defaults");
    expect(after.prefs).toEqual(INVOICE_LIST_DEFAULTS);
  });

  it("keeps commercial and proforma lists isolated", () => {
    writeStoredInvoicePrefs(
      invoiceListStorageKey("proforma"),
      { ...INVOICE_LIST_DEFAULTS, search: "proforma-only" },
      storage,
    );
    expect(readStoredInvoicePrefs(KEY, storage)).toBeNull();
    expect(readStoredInvoicePrefs(invoiceListStorageKey("proforma"), storage)?.search).toBe(
      "proforma-only",
    );
  });

  describe("stored value sanitisation", () => {
    it("ignores corrupt JSON and falls back to defaults", () => {
      storage.setItem(KEY, "{not json");
      expect(readStoredInvoicePrefs(KEY, storage)).toBeNull();
      expect(visit(storage, "?").prefs).toEqual(INVOICE_LIST_DEFAULTS);
    });

    it("ignores non-object stored payloads", () => {
      storage.setItem(KEY, JSON.stringify([1, 2, 3]));
      expect(readStoredInvoicePrefs(KEY, storage)).toBeNull();
    });

    it("drops unsupported page sizes and sort keys", () => {
      const clean = sanitizeInvoiceListPrefs({
        pageSize: 37,
        sortKey: "not_a_column" as never,
        sortDir: "sideways" as never,
        page: 0,
      });
      expect(clean.pageSize).toBeUndefined();
      expect(clean.sortKey).toBeUndefined();
      expect(clean.sortDir).toBeUndefined();
      expect(clean.page).toBeUndefined();
    });

    it("floors fractional pages and caps very long searches", () => {
      const clean = sanitizeInvoiceListPrefs({ page: 3.9, search: "x".repeat(500) });
      expect(clean.page).toBe(3);
      expect(clean.search).toHaveLength(200);
    });

    it("falls back to defaults for junk URL params", () => {
      const prefs = fromInvoiceSearch({ size: 999, sort: "bogus", dir: "up", page: -4 });
      expect(prefs).toEqual(INVOICE_LIST_DEFAULTS);
    });
  });

  it("survives unavailable storage without throwing", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(() => writeStoredInvoicePrefs(KEY, INVOICE_LIST_DEFAULTS, broken)).not.toThrow();
    expect(() => clearStoredInvoicePrefs(KEY, broken)).not.toThrow();
    expect(readStoredInvoicePrefs(KEY, broken)).toBeNull();
    expect(
      resolveInvoiceListPrefs({
        locationSearch: "",
        urlSearch: {},
        storageKey: KEY,
        storage: broken,
      }).prefs,
    ).toEqual(INVOICE_LIST_DEFAULTS);
  });
});
