import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";

/**
 * Global click interceptor that guarantees every internal link stays inside
 * the current locale, without requiring every component to use LocalizedLink.
 *
 * Handles:
 *   - <a href="/foo">           → navigates to /<lang>/foo (client-side)
 *   - <Link to="/foo">          → same (TanStack ends up firing a click event too)
 *   - Preserves query + hash    → /foo?x=1#y  →  /<lang>/foo?x=1#y
 *
 * Skips:
 *   - External / protocol links (http, mailto, tel, …)
 *   - Hash-only links (#section)
 *   - Links to /api/… or that already start with any /<locale>/… prefix
 *   - Modifier clicks (ctrl/meta/shift/alt), middle-click, download, target=_blank
 */
export function LocaleLinkGuard({ lang }: { lang: Locale }) {
  const router = useRouter();

  useEffect(() => {
    const LOCS = SUPPORTED_LOCALES as readonly string[];

    function handler(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as Element | null;
      if (!target) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "" && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.getAttribute("rel")?.includes("external")) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref) return;

      // Protocol / scheme / hash-only / relative → let browser handle.
      if (
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:") ||
        /^https?:\/\//i.test(rawHref)
      ) {
        return;
      }

      // Only intercept absolute in-app paths starting with /.
      if (!rawHref.startsWith("/")) return;

      // Split into path / search / hash.
      const hashIdx = rawHref.indexOf("#");
      const searchIdx = rawHref.indexOf("?");
      let endOfPath = rawHref.length;
      if (hashIdx !== -1) endOfPath = Math.min(endOfPath, hashIdx);
      if (searchIdx !== -1) endOfPath = Math.min(endOfPath, searchIdx);
      const path = rawHref.slice(0, endOfPath);
      const suffix = rawHref.slice(endOfPath); // includes ?… and/or #…

      const parts = path.split("/").filter(Boolean);
      const first = parts[0] ?? "";

      // Skip API / static asset paths.
      if (first === "api") return;
      // Skip if the link is already locale-prefixed — even if it's a different
      // locale, that's the author's explicit intent.
      if (LOCS.includes(first)) return;

      // Rewrite: prepend current locale.
      const nextPath = "/" + [lang, ...parts].join("/");
      const nextHref = nextPath + suffix;

      e.preventDefault();
      router.navigate({ to: nextHref, replace: false });
    }

    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, [lang, router]);

  return null;
}
