import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { buildChildSitemap, parseChildSlug, XML_HEADERS } from "@/lib/sitemap";

/**
 * Child sitemaps: /sitemaps/{locale}-{section}.xml
 * e.g. /sitemaps/en-pages.xml, /sitemaps/ar-solutions.xml,
 *      /sitemaps/zh-knowledge-hub.xml
 */
export const Route = createFileRoute("/sitemaps/$slug.xml")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const parsed = parseChildSlug(params.slug);
        if (!parsed) {
          return new Response("Not found", {
            status: 404,
            headers: { "Content-Type": "text/plain" },
          });
        }
        return new Response(buildChildSitemap(parsed.locale, parsed.section), {
          headers: XML_HEADERS,
        });
      },
    },
  },
});
