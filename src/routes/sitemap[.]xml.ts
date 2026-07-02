import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE } from "@/lib/seo";

const BASE_URL = SITE.url;

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const ROUTES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/industries", changefreq: "monthly", priority: "0.8" },
  { path: "/knowledge", changefreq: "weekly", priority: "0.8" },
  { path: "/ai-assistant", changefreq: "monthly", priority: "0.7" },
  { path: "/project-inquiry", changefreq: "monthly", priority: "0.9" },
  { path: "/solutions/factory-development", changefreq: "monthly", priority: "0.9" },
  { path: "/solutions/production-lines", changefreq: "monthly", priority: "0.9" },
  { path: "/solutions/raw-materials", changefreq: "monthly", priority: "0.9" },
  { path: "/solutions/engineering-consultancy", changefreq: "monthly", priority: "0.9" },
  { path: "/solutions/sandwich-panels", changefreq: "monthly", priority: "0.9" },
  { path: "/product-configurator", changefreq: "monthly", priority: "0.9" },
];

const ACTIVE_LOCALES = ["en", "ar"] as const;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = ROUTES.map((e) => {
          const alt = ACTIVE_LOCALES.map(
            (l) =>
              `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}${l === "en" ? e.path : `/${l}${e.path}`}"/>`,
          ).join("\n");
          return [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            alt,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n");
        });

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
