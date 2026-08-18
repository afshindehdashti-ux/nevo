/**
 * Canonical URL redirect map (301).
 *
 * Goal: users and crawlers must never land on a duplicate or empty page after
 * a language change or when following an old/variant URL. Every variant of a
 * page (wrong locale casing, regional locale code, legacy slug, trailing
 * slash, uppercase path, index.html) resolves to exactly ONE canonical URL:
 *
 *     /{locale}/{path}      locale ∈ SUPPORTED_LOCALES, no trailing slash
 *
 * `resolveRedirect()` is pure so it can be unit-tested and reused by the
 * server request middleware in src/start.ts.
 */

import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/i18n/config";
import { ALL_ROUTES } from "@/lib/sitemap";

const LOCALES = SUPPORTED_LOCALES as readonly string[];

/** Known locale-agnostic page paths ("/", "/about", "/solutions/…"). */
export const KNOWN_PATHS: ReadonlySet<string> = new Set(ALL_ROUTES.map((r) => r.path));

/**
 * Path prefixes that are NOT localized marketing pages and must be left alone
 * (backend app, API, auth, assets, feeds, platform routes).
 */
const IGNORED_PREFIXES = [
  "/api/",
  "/admin",
  "/crm",
  "/backoffice",
  "/auth",
  "/reset-password",
  "/email/",
  "/unsubscribe",
  "/status",
  "/lovable",
  "/.lovable",
  "/.well-known",
  "/.mcp",
  "/mcp",
  "/sitemaps/",
  "/_",
  "/@",
  "/src/",
  "/node_modules/",
  "/assets/",
];

const IGNORED_EXACT = new Set(["/sitemap.xml", "/robots.txt", "/favicon.ico", "/api"]);

/** Regional / cased locale variants → canonical locale segment. */
export const LOCALE_ALIASES: Record<string, string> = {
  eng: "en",
  "en-us": "en",
  "en-gb": "en",
  "en-ae": "en",
  "ar-ae": "ar",
  "ar-sa": "ar",
  "ar-eg": "ar",
  "tr-tr": "tr",
  "ru-ru": "ru",
  "pt-br": "pt",
  "pt-pt": "pt",
  "de-de": "de",
  "de-at": "de",
  "de-ch": "de",
  "es-es": "es",
  "es-mx": "es",
  "es-ar": "es",
  "fr-fr": "fr",
  "fr-be": "fr",
  "fr-ca": "fr",
  "it-it": "it",
  "zh-cn": "zh",
  "zh-hans": "zh",
  "zh-hant": "zh",
  "zh-tw": "zh",
  "zh-hk": "zh",
};

/** Legacy / variant page paths → canonical locale-agnostic path. */
export const LEGACY_PATHS: Record<string, string> = {
  "/home": "/",
  "/index": "/",
  "/index.html": "/",
  "/knowledge": "/knowledge-hub",
  "/blog": "/knowledge-hub",
  "/news": "/knowledge-hub",
  "/insights": "/knowledge-hub",
  "/resources": "/knowledge-hub",
  "/about-us": "/about",
  "/company": "/about",
  "/contact-us": "/contact",
  "/get-in-touch": "/contact",
  "/services": "/solutions",
  "/products": "/solutions",
  "/our-solutions": "/solutions",
  "/solutions/panels": "/solutions/sandwich-panels",
  "/sandwich-panels": "/solutions/sandwich-panels",
  "/panels": "/solutions/sandwich-panels",
  "/production-lines": "/solutions/production-lines",
  "/raw-materials": "/solutions/raw-materials",
  "/factory-development": "/solutions/factory-development",
  "/engineering-consultancy": "/solutions/engineering-consultancy",
  "/consultancy": "/solutions/engineering-consultancy",
  "/careers-jobs": "/careers",
  "/jobs": "/careers",
  "/downloads": "/download-center",
  "/privacy-policy": "/privacy",
  "/esg": "/sustainability",
  "/rfq": "/project-inquiry",
  "/quote": "/project-inquiry",
  "/request-a-quote": "/project-inquiry",
  "/tools": "/engineering-tools",
  "/configurator": "/product-configurator",
  "/roi-calculator": "/investment-calculator",
};

function isIgnored(pathname: string): boolean {
  if (IGNORED_EXACT.has(pathname)) return true;
  if (IGNORED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) return true;
  // Any asset-looking path (has a file extension in the last segment).
  const last = pathname.split("/").pop() ?? "";
  if (last.includes(".") && last !== "index.html") return true;
  return false;
}

/** Strip a legacy-path alias, mapping "/knowledge/foo" → "/knowledge-hub/foo" too. */
function canonicalizePath(path: string): string {
  const direct = LEGACY_PATHS[path];
  if (direct) return direct;
  if (path.startsWith("/knowledge/")) return `/knowledge-hub/${path.slice("/knowledge/".length)}`;
  if (path.startsWith("/blog/")) return `/knowledge-hub/${path.slice("/blog/".length)}`;
  return path;
}

export interface RedirectResult {
  /** Absolute path (with query string) to redirect to. */
  location: string;
  status: 301;
  reason:
    | "trailing-slash"
    | "case"
    | "locale-alias"
    | "legacy-path"
    | "missing-locale"
    | "normalize";
}

/**
 * Resolve the canonical location for a request path, or null when the path is
 * already canonical (or is not a localized marketing page at all).
 */
export function resolveRedirect(pathname: string, search = ""): RedirectResult | null {
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  if (isIgnored(pathname)) return null;

  const original = pathname;
  const reasons: RedirectResult["reason"][] = [];

  // 1. Collapse duplicate slashes + strip trailing slash.
  let p = pathname.replace(/\/{2,}/g, "/");
  if (p.length > 1 && p.endsWith("/")) {
    p = p.replace(/\/+$/, "");
    reasons.push("trailing-slash");
  }
  if (p === "") p = "/";

  // 2. Lowercase (URLs are case-insensitive for us; canonical form is lowercase).
  const lowered = p.toLowerCase();
  if (lowered !== p) reasons.push("case");
  p = lowered;

  // 3. Drop a trailing /index.html.
  if (p.endsWith("/index.html")) {
    p = p.slice(0, -"/index.html".length) || "/";
    reasons.push("normalize");
  }

  // 4. Split off a locale segment (canonical, aliased, or absent).
  const segments = p.split("/").filter(Boolean);
  let locale: string | null = null;
  let rest = `/${segments.join("/")}`;

  if (segments.length > 0) {
    const first = segments[0];
    if (LOCALES.includes(first)) {
      locale = first;
      rest = `/${segments.slice(1).join("/")}`;
    } else if (LOCALE_ALIASES[first]) {
      locale = LOCALE_ALIASES[first];
      rest = `/${segments.slice(1).join("/")}`;
      reasons.push("locale-alias");
    }
  }
  if (rest === "" ) rest = "/";
  if (rest.length > 1 && rest.endsWith("/")) rest = rest.slice(0, -1);

  // 5. Legacy path aliases.
  const canonicalRest = canonicalizePath(rest);
  if (canonicalRest !== rest) reasons.push("legacy-path");
  rest = canonicalRest;

  // 6. Missing locale prefix: only redirect when the path is a known page.
  if (!locale) {
    if (rest === "/") return null; // "/" is handled by locale detection in the index route.
    if (!KNOWN_PATHS.has(rest) && !rest.startsWith("/knowledge-hub/")) return null;
    locale = DEFAULT_LOCALE;
    reasons.push("missing-locale");
  }

  const target = `/${locale}${rest === "/" ? "" : rest}` || "/";
  const location = `${target}${search && search !== "?" ? (search.startsWith("?") ? search : `?${search}`) : ""}`;

  if (`${target}` === original && reasons.length === 0) return null;
  if (target === original) return null;

  return { location, status: 301, reason: reasons[0] ?? "normalize" };
}
