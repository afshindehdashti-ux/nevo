/**
 * Shared sitemap data + XML builders.
 *
 * The site publishes a sitemap INDEX at /sitemap.xml which points at one child
 * sitemap per (locale × section):  /sitemaps/{locale}-{section}.xml
 *
 * Sections mirror the URL subdirectories (top-level pages, /solutions/*,
 * /knowledge-hub/*), so each child stays small and a change to one area only
 * invalidates that file. Every <url> in every child carries the FULL hreflang
 * alternate set (all 10 locales + x-default), which is what Google requires:
 * alternates must be consistent and reciprocal regardless of which sitemap
 * file a URL happens to live in.
 */

import { SITE } from "@/lib/seo";
import { ARTICLES } from "@/lib/knowledge-articles";

export const BASE_URL = SITE.url;

export const ACTIVE_LOCALES = [
  "en",
  "ar",
  "tr",
  "ru",
  "pt",
  "de",
  "es",
  "fr",
  "it",
  "zh",
] as const;

export type ActiveLocale = (typeof ACTIVE_LOCALES)[number];

/** Locale path segment → advertised hreflang code. Must match LOCALES in src/lib/seo.ts. */
export const HREFLANG: Record<ActiveLocale, string> = {
  en: "en",
  ar: "ar",
  tr: "tr",
  ru: "ru",
  pt: "pt",
  de: "de",
  es: "es",
  fr: "fr",
  it: "it",
  zh: "zh-Hans",
};

/** Locale used for the hreflang="x-default" alternate. */
export const X_DEFAULT_LOCALE: ActiveLocale = "en";

export type SitemapSection = "pages" | "solutions" | "knowledge-hub";

export const SECTIONS: SitemapSection[] = ["pages", "solutions", "knowledge-hub"];

export interface SitemapEntry {
  /** Locale-agnostic path, always leading-slash ("/" = locale home). */
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_ROUTES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.8" },
  { path: "/sustainability", changefreq: "monthly", priority: "0.7" },
  { path: "/careers", changefreq: "weekly", priority: "0.7" },
  { path: "/investors", changefreq: "monthly", priority: "0.7" },
  { path: "/industries", changefreq: "monthly", priority: "0.8" },
  { path: "/knowledge-hub", changefreq: "weekly", priority: "0.9" },
  { path: "/ai-assistant", changefreq: "monthly", priority: "0.7" },
  { path: "/project-inquiry", changefreq: "monthly", priority: "0.9" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/solutions", changefreq: "monthly", priority: "0.9" },
  { path: "/solutions/factory-development", changefreq: "monthly", priority: "0.9" },
  { path: "/solutions/production-lines", changefreq: "monthly", priority: "0.9" },
  { path: "/solutions/raw-materials", changefreq: "monthly", priority: "0.9" },
  { path: "/solutions/engineering-consultancy", changefreq: "monthly", priority: "0.9" },
  { path: "/solutions/sandwich-panels", changefreq: "monthly", priority: "0.9" },
  { path: "/product-configurator", changefreq: "monthly", priority: "0.9" },
  { path: "/investment-calculator", changefreq: "monthly", priority: "0.9" },
  { path: "/panel-thickness-calculator", changefreq: "monthly", priority: "0.9" },
  { path: "/pir-vs-rock-wool", changefreq: "monthly", priority: "0.9" },
  { path: "/factory-layout-generator", changefreq: "monthly", priority: "0.9" },
  { path: "/factory-layouts", changefreq: "monthly", priority: "0.8" },
  { path: "/engineering-tools", changefreq: "monthly", priority: "0.9" },
  { path: "/installation-commissioning", changefreq: "monthly", priority: "0.8" },
  { path: "/quality", changefreq: "monthly", priority: "0.7" },
  { path: "/research-innovation", changefreq: "monthly", priority: "0.7" },
  { path: "/download-center", changefreq: "weekly", priority: "0.9" },
  { path: "/customer-portal", changefreq: "monthly", priority: "0.8" },
  { path: "/partner-portal", changefreq: "monthly", priority: "0.8" },
  { path: "/ai-project-estimator", changefreq: "monthly", priority: "0.9" },
];

const ARTICLE_ROUTES: SitemapEntry[] = ARTICLES.map((a) => ({
  path: `/knowledge-hub/${a.slug}`,
  changefreq: "monthly" as const,
  priority: "0.7",
}));

/** Every locale-agnostic route, in one flat list (used by tests and tooling). */
export const ALL_ROUTES: SitemapEntry[] = [...STATIC_ROUTES, ...ARTICLE_ROUTES];

/** Classify a path into the sitemap section that owns it (by URL subdirectory). */
export function sectionFor(path: string): SitemapSection {
  if (path === "/solutions" || path.startsWith("/solutions/")) return "solutions";
  // The /knowledge-hub hub page stays with the top-level pages; only articles split out.
  if (path.startsWith("/knowledge-hub/")) return "knowledge-hub";
  return "pages";
}

/** Routes belonging to one section. */
export function routesForSection(section: SitemapSection): SitemapEntry[] {
  return ALL_ROUTES.filter((e) => sectionFor(e.path) === section);
}

/** Child sitemap file name for a locale + section, e.g. "en-solutions.xml". */
export function childSitemapName(locale: ActiveLocale, section: SitemapSection): string {
  return `${locale}-${section}.xml`;
}

export function childSitemapUrl(locale: ActiveLocale, section: SitemapSection): string {
  return `${BASE_URL}/sitemaps/${childSitemapName(locale, section)}`;
}

/** Parse a "{locale}-{section}" slug back into its parts, or null if unknown. */
export function parseChildSlug(
  slug: string,
): { locale: ActiveLocale; section: SitemapSection } | null {
  const normalized = slug.replace(/\.xml$/i, "");
  const locale = ACTIVE_LOCALES.find((l) => normalized.startsWith(`${l}-`));
  if (!locale) return null;
  const rest = normalized.slice(locale.length + 1) as SitemapSection;
  if (!SECTIONS.includes(rest)) return null;
  return { locale, section: rest };
}

function localizedUrl(locale: ActiveLocale, path: string): string {
  return `${BASE_URL}/${locale}${path === "/" ? "" : path}`;
}

/**
 * Full alternate block for one locale-agnostic path — identical in every child
 * sitemap, so hreflang stays reciprocal across the split.
 */
function alternatesFor(path: string): string[] {
  const lines = ACTIVE_LOCALES.map(
    (l) =>
      `    <xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${localizedUrl(l, path)}"/>`,
  );
  lines.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${localizedUrl(X_DEFAULT_LOCALE, path)}"/>`,
  );
  return lines;
}

/** Build the <urlset> XML for one locale + section. */
export function buildChildSitemap(locale: ActiveLocale, section: SitemapSection): string {
  const urls = routesForSection(section).map((e) =>
    [
      `  <url>`,
      `    <loc>${localizedUrl(locale, e.path)}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      ...alternatesFor(e.path),
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

/** Build the sitemap index listing every non-empty child sitemap. */
export function buildSitemapIndex(): string {
  const children: string[] = [];
  for (const locale of ACTIVE_LOCALES) {
    for (const section of SECTIONS) {
      if (routesForSection(section).length === 0) continue;
      children.push(
        [`  <sitemap>`, `    <loc>${childSitemapUrl(locale, section)}</loc>`, `  </sitemap>`].join(
          "\n",
        ),
      );
    }
  }

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...children,
    `</sitemapindex>`,
  ].join("\n");
}

export const XML_HEADERS = {
  "Content-Type": "application/xml",
  "Cache-Control": "public, max-age=3600",
} as const;
