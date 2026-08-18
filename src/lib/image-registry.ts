/**
 * Maps bundled image URLs back to their source path in `src/assets`.
 *
 * Vite rewrites `import hero from "@/assets/hero.jpg"` into a hashed URL, so at
 * runtime an `<img>` tag no longer knows which slot it fills. This registry is
 * built at compile time from the same files, giving an exact bundled-URL ->
 * `src/assets/...` lookup with no filename-collision guesswork.
 */
const bundled = import.meta.glob<string>(
  "/src/assets/**/*.{jpg,jpeg,png,webp,avif,svg}",
  { eager: true, query: "?url", import: "default" },
);

/** bundled URL (e.g. `/assets/hero-BX3k.jpg`) -> `src/assets/hero.jpg` */
export const urlToAssetPath: Record<string, string> = {};
/** `src/assets/hero.jpg` -> bundled URL */
export const assetPathToUrl: Record<string, string> = {};

for (const [sourcePath, url] of Object.entries(bundled)) {
  if (typeof url !== "string") continue;
  const assetPath = sourcePath.replace(/^\//, ""); // "src/assets/..."
  urlToAssetPath[url] = assetPath;
  assetPathToUrl[assetPath] = url;
}

/** Normalises any `src` value (absolute, relative, query-suffixed) to a registry key. */
export function normalizeSrc(src: string): string {
  if (!src) return src;
  let value = src;
  try {
    if (/^https?:\/\//i.test(value)) value = new URL(value).pathname;
  } catch {
    /* keep raw value */
  }
  return value.split("?")[0]!.split("#")[0]!;
}

/** Resolve a rendered `src` back to its `src/assets/...` slot, if it is one. */
export function assetPathForSrc(src: string): string | undefined {
  const normalized = normalizeSrc(src);
  return urlToAssetPath[normalized] ?? urlToAssetPath[`/${normalized.replace(/^\//, "")}`];
}
