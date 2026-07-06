import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE } from "@/lib/seo";
import { ARTICLES } from "@/lib/knowledge-articles";

const BASE_URL = SITE.url;

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const ROUTES: SitemapEntry[] = [
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
  ...ARTICLES.map<SitemapEntry>((a) => ({
    path: `/knowledge-hub/${a.slug}`,
    changefreq: "monthly" as const,
    priority: "0.7",
  })),
];

const ACTIVE_LOCALES = ["en", "ar", "tr", "ru", "pt", "de", "es", "fr", "it", "zh"] as const;
const HREFLANG: Record<(typeof ACTIVE_LOCALES)[number], string> = {
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

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls: string[] = [];
        for (const e of ROUTES) {
          const pathSuffix = e.path === "/" ? "" : e.path;
          const alternates = ACTIVE_LOCALES.map(
            (l) =>
              `    <xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${BASE_URL}/${l}${pathSuffix}"/>`,
          ).join("\n");
          const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/en${pathSuffix}"/>`;
          for (const l of ACTIVE_LOCALES) {
            urls.push(
              [
                `  <url>`,
                `    <loc>${BASE_URL}/${l}${pathSuffix}</loc>`,
                e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
                e.priority ? `    <priority>${e.priority}</priority>` : null,
                alternates,
                xDefault,
                `  </url>`,
              ]
                .filter(Boolean)
                .join("\n"),
            );
          }
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
