/**
 * Persistence contract for the invoice list view.
 *
 * Search, status, sort, rows-per-page and page live in the URL so a view can be
 * shared and survives a refresh. localStorage mirrors the last used values and
 * seeds the view when the URL carries no explicit state.
 *
 * The helpers here are pure (or take storage explicitly) so the refresh cycle
 * can be exercised in tests without rendering the whole route.
 */

export type InvoiceSortKey =
  | "invoice_number"
  | "customer"
  | "issue_date"
  | "due_date"
  | "status"
  | "total"
  | "balance";

export type InvoiceSortDir = "asc" | "desc";

export const INVOICE_SORT_KEYS: InvoiceSortKey[] = [
  "invoice_number",
  "customer",
  "issue_date",
  "due_date",
  "status",
  "total",
  "balance",
];

export const INVOICE_PAGE_SIZES = [10, 25, 50, 100];

export const INVOICE_LIST_DEFAULTS = {
  search: "",
  statusFilter: "all" as string,
  pageSize: 25,
  page: 1,
  sortKey: "issue_date" as InvoiceSortKey,
  sortDir: "desc" as InvoiceSortDir,
};

export type InvoiceListPrefs = typeof INVOICE_LIST_DEFAULTS;

/** URL param keys that carry list state. */
export const INVOICE_SEARCH_KEYS = ["q", "status", "page", "size", "sort", "dir"] as const;

export function invoiceListStorageKey(type: "commercial" | "proforma") {
  return `nevo.admin.invoices.${type}.prefs`;
}

/** Drops anything stored that no longer matches the current UI contract. */
export function sanitizeInvoiceListPrefs(
  stored: Partial<InvoiceListPrefs>,
): Partial<InvoiceListPrefs> {
  const clean: Partial<InvoiceListPrefs> = {};
  if (typeof stored.search === "string") clean.search = stored.search.slice(0, 200);
  if (typeof stored.statusFilter === "string") clean.statusFilter = stored.statusFilter;
  if (typeof stored.pageSize === "number" && INVOICE_PAGE_SIZES.includes(stored.pageSize)) {
    clean.pageSize = stored.pageSize;
  }
  if (typeof stored.page === "number" && Number.isFinite(stored.page) && stored.page >= 1) {
    clean.page = Math.floor(stored.page);
  }
  if (typeof stored.sortKey === "string" && INVOICE_SORT_KEYS.includes(stored.sortKey)) {
    clean.sortKey = stored.sortKey;
  }
  if (stored.sortDir === "asc" || stored.sortDir === "desc") clean.sortDir = stored.sortDir;
  return clean;
}

/** Maps the internal prefs object onto the URL search-param shape. */
export function toInvoiceSearch(p: InvoiceListPrefs) {
  return {
    q: p.search,
    status: p.statusFilter,
    page: p.page,
    size: p.pageSize,
    sort: p.sortKey,
    dir: p.sortDir,
  };
}

/** Maps a validated URL search object back onto the internal prefs shape. */
export function fromInvoiceSearch(urlSearch: {
  q?: string;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
  dir?: string;
}): InvoiceListPrefs {
  return {
    ...INVOICE_LIST_DEFAULTS,
    ...sanitizeInvoiceListPrefs({
      search: urlSearch.q,
      statusFilter: urlSearch.status,
      pageSize: urlSearch.size,
      page: urlSearch.page,
      sortKey: urlSearch.sort as InvoiceSortKey,
      sortDir: urlSearch.dir as InvoiceSortDir,
    }),
  };
}

/** True when the URL already pins list state, in which case storage is ignored. */
export function urlHasInvoiceListState(search: string) {
  const params = new URLSearchParams(search);
  return INVOICE_SEARCH_KEYS.some((k) => params.has(k));
}

export function readStoredInvoicePrefs(
  storageKey: string,
  storage: Pick<Storage, "getItem"> | undefined = safeStorage(),
): Partial<InvoiceListPrefs> | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(storageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const clean = sanitizeInvoiceListPrefs(parsed as Partial<InvoiceListPrefs>);
      return Object.keys(clean).length > 0 ? clean : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function writeStoredInvoicePrefs(
  storageKey: string,
  prefs: InvoiceListPrefs,
  storage: Pick<Storage, "setItem"> | undefined = safeStorage(),
) {
  try {
    storage?.setItem(storageKey, JSON.stringify(prefs));
  } catch {
    // storage unavailable
  }
}

export function clearStoredInvoicePrefs(
  storageKey: string,
  storage: Pick<Storage, "removeItem"> | undefined = safeStorage(),
) {
  try {
    storage?.removeItem(storageKey);
  } catch {
    // storage unavailable
  }
}

/**
 * Resolves the prefs a freshly mounted list should use: URL state wins, and
 * storage only seeds the view when the URL is bare.
 */
export function resolveInvoiceListPrefs(options: {
  locationSearch: string;
  urlSearch: Parameters<typeof fromInvoiceSearch>[0];
  storageKey: string;
  storage?: Pick<Storage, "getItem">;
}): { prefs: InvoiceListPrefs; source: "url" | "storage" | "defaults" } {
  const { locationSearch, urlSearch, storageKey, storage } = options;
  if (urlHasInvoiceListState(locationSearch)) {
    return { prefs: fromInvoiceSearch(urlSearch), source: "url" };
  }
  const restored = readStoredInvoicePrefs(storageKey, storage ?? safeStorage());
  if (restored) {
    return { prefs: { ...INVOICE_LIST_DEFAULTS, ...restored }, source: "storage" };
  }
  return { prefs: { ...INVOICE_LIST_DEFAULTS }, source: "defaults" };
}

function safeStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
