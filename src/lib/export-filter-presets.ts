/**
 * localStorage-backed presets for the CSV Export History filters.
 * Per-browser (not per-user in DB); intentionally simple.
 */

export type ExportFilterValues = {
  q: string;
  scope: string;
  user: string;
  from: string;
  to: string;
};

export type ExportFilterPreset = {
  id: string;
  name: string;
  filters: ExportFilterValues;
};

const STORAGE_KEY = "nevo.exports.filter-presets.v1";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isPreset(v: unknown): v is ExportFilterPreset {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  if (typeof p.id !== "string" || typeof p.name !== "string") return false;
  const f = p.filters as Record<string, unknown> | undefined;
  if (!f) return false;
  return (
    typeof f.q === "string" &&
    typeof f.scope === "string" &&
    typeof f.user === "string" &&
    typeof f.from === "string" &&
    typeof f.to === "string"
  );
}

export function loadExportPresets(): ExportFilterPreset[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPreset);
  } catch {
    return [];
  }
}

export function saveExportPresets(presets: ExportFilterPreset[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // storage full / disabled — silently ignore
  }
}
