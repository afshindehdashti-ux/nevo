import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Persists a small list-view preferences object (search, filters, sorting,
 * pagination) in `localStorage` so it survives a page refresh.
 *
 * SSR-safe: the first render always uses `defaults`, and the stored value is
 * merged in after hydration to avoid markup mismatches. `hydrated` tells the
 * caller when the stored value has been applied, so effects that reset state
 * on filter changes can skip that first restore pass.
 */
export function usePersistedListPrefs<T extends Record<string, unknown>>(
  storageKey: string,
  defaults: T,
  sanitize?: (stored: Partial<T>) => Partial<T>,
): {
  prefs: T;
  setPrefs: (patch: Partial<T> | ((current: T) => Partial<T>)) => void;
  resetPrefs: () => void;
  hydrated: boolean;
} {
  const [prefs, setState] = useState<T>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const defaultsRef = useRef(defaults);
  const sanitizeRef = useRef(sanitize);
  sanitizeRef.current = sanitize;

  // Restore once per storage key, after mount (never during SSR/first paint).
  useEffect(() => {
    setHydrated(false);
    let restored: Partial<T> | null = null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          restored = parsed as Partial<T>;
        }
      }
    } catch {
      // Private mode, quota, or corrupt JSON — fall back to defaults.
      restored = null;
    }
    const clean = restored ? (sanitizeRef.current?.(restored) ?? restored) : null;
    setState(clean ? { ...defaultsRef.current, ...clean } : defaultsRef.current);
    setHydrated(true);
  }, [storageKey]);

  // Persist on every change, but only after the restore pass has run so we
  // never overwrite stored prefs with the defaults.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(prefs));
    } catch {
      // Storage unavailable — preferences simply won't persist.
    }
  }, [storageKey, prefs, hydrated]);

  const setPrefs = useCallback(
    (patch: Partial<T> | ((current: T) => Partial<T>)) => {
      setState((current) => ({
        ...current,
        ...(typeof patch === "function" ? patch(current) : patch),
      }));
    },
    [],
  );

  const resetPrefs = useCallback(() => {
    setState(defaultsRef.current);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  return { prefs, setPrefs, resetPrefs, hydrated };
}
