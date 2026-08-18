import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Persists a table's column order and visibility in localStorage so the layout
 * a user arranges survives a refresh. The stored value is always reconciled
 * against the current column contract: unknown ids are dropped and newly added
 * columns appear at their default position, visible.
 */
export type TableColumnLayout<Id extends string> = {
  /** Every known column, in the user's chosen order. */
  order: Id[];
  /** Visible columns only, in order — what the table should render. */
  visibleOrder: Id[];
  isVisible: (id: Id) => boolean;
  toggle: (id: Id, next?: boolean) => void;
  /** Moves a column one slot earlier (-1) or later (+1) in the order. */
  move: (id: Id, delta: -1 | 1) => void;
  reset: () => void;
  /** True when the layout differs from the default order/visibility. */
  dirty: boolean;
  /** False during SSR and the first client render, before storage is read. */
  hydrated: boolean;
};

type Stored<Id extends string> = { order?: Id[]; hidden?: Id[] };

function readStored<Id extends string>(key: string): Stored<Id> | null {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Stored<Id>;
  } catch {
    return null;
  }
}

export function useTableColumnLayout<Id extends string>(
  storageKey: string,
  defaultOrder: readonly Id[],
): TableColumnLayout<Id> {
  const defaults = useMemo(() => [...defaultOrder] as Id[], [defaultOrder]);
  const [order, setOrder] = useState<Id[]>(defaults);
  const [hidden, setHidden] = useState<Id[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read once on the client; SSR and first paint use the defaults so markup matches.
  useEffect(() => {
    const stored = readStored<Id>(storageKey);
    if (stored) {
      const known = new Set(defaults);
      const kept = Array.isArray(stored.order) ? stored.order.filter((id) => known.has(id)) : [];
      const deduped = Array.from(new Set(kept));
      // Columns added since the layout was saved slot back in at their default index.
      const merged = [...deduped];
      defaults.forEach((id, index) => {
        if (!merged.includes(id)) merged.splice(Math.min(index, merged.length), 0, id);
      });
      setOrder(merged);
      setHidden(
        Array.isArray(stored.hidden)
          ? Array.from(new Set(stored.hidden.filter((id) => known.has(id))))
          : [],
      );
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ order, hidden }));
    } catch {
      // storage unavailable — the layout simply won't persist
    }
  }, [hydrated, order, hidden, storageKey]);

  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);

  const toggle = useCallback((id: Id, next?: boolean) => {
    setHidden((prev) => {
      const show = next ?? prev.includes(id);
      return show ? prev.filter((x) => x !== id) : prev.includes(id) ? prev : [...prev, id];
    });
  }, []);

  const move = useCallback((id: Id, delta: -1 | 1) => {
    setOrder((prev) => {
      const from = prev.indexOf(id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setOrder(defaults);
    setHidden([]);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // storage unavailable
    }
  }, [defaults, storageKey]);

  const dirty =
    hidden.length > 0 || order.some((id, index) => defaults[index] !== id);

  return {
    order,
    visibleOrder: order.filter((id) => !hiddenSet.has(id)),
    isVisible: (id: Id) => !hiddenSet.has(id),
    toggle,
    move,
    reset,
    dirty,
    hydrated,
  };
}
