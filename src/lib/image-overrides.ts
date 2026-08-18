import { supabase } from "@/integrations/supabase/client";
import { assetPathForSrc } from "./image-registry";

export type ImageOverride = {
  id: string;
  asset_path: string;
  asset_key: string;
  storage_path: string;
  width: number | null;
  height: number | null;
  content_type: string | null;
  byte_size: number | null;
  license_source: string | null;
  license_type: string | null;
  license_id: string | null;
  license_credit: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Public delivery URL for a replacement stored in the private `site-images` bucket. */
export function overrideUrl(storagePath: string, updatedAt?: string): string {
  const version = updatedAt ? `?v=${encodeURIComponent(updatedAt)}` : "";
  return `/api/public/site-image/${storagePath.split("/").map(encodeURIComponent).join("/")}${version}`;
}

export async function fetchActiveOverrides(): Promise<ImageOverride[]> {
  const { data, error } = await supabase
    .from("image_slot_overrides")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []) as ImageOverride[];
}

export async function fetchAllOverrides(): Promise<ImageOverride[]> {
  const { data, error } = await supabase
    .from("image_slot_overrides")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ImageOverride[];
}

/** `src/assets/...` -> delivery URL, for the active replacements. */
export function buildOverrideMap(rows: ImageOverride[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of rows) {
    if (!row.is_active) continue;
    map[row.asset_path] = overrideUrl(row.storage_path, row.updated_at);
  }
  return map;
}

/**
 * Swap every rendered `<img>` whose source resolves to a replaced slot.
 * Returns a disposer. Safe to call repeatedly; already-swapped nodes are marked.
 */
export function applyOverrides(map: Record<string, string>): () => void {
  if (typeof document === "undefined" || Object.keys(map).length === 0) {
    return () => {};
  }

  const swap = (img: HTMLImageElement) => {
    const original = img.dataset["nevoOriginalSrc"] ?? img.getAttribute("src") ?? "";
    if (!original) return;
    const assetPath = assetPathForSrc(original);
    if (!assetPath) return;
    const replacement = map[assetPath];
    if (!replacement || img.getAttribute("src") === replacement) return;
    img.dataset["nevoOriginalSrc"] = original;
    img.dataset["nevoSlot"] = assetPath;
    // srcset would win over src, so it has to go with the original file.
    if (img.hasAttribute("srcset")) img.removeAttribute("srcset");
    img.setAttribute("src", replacement);
  };

  const sweep = (root: ParentNode) => {
    root.querySelectorAll?.("img").forEach((node) => swap(node as HTMLImageElement));
  };

  sweep(document);

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes" && record.target instanceof HTMLImageElement) {
        swap(record.target);
        continue;
      }
      record.addedNodes.forEach((node) => {
        if (node instanceof HTMLImageElement) swap(node);
        else if (node instanceof Element) sweep(node);
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"],
  });

  return () => observer.disconnect();
}
