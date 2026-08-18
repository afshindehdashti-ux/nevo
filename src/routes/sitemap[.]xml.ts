import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { buildSitemapIndex, XML_HEADERS } from "@/lib/sitemap";

/**
 * Sitemap index — points at one child sitemap per locale × section.
 * Child files are served by src/routes/sitemaps.$slug[.]xml.ts.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => new Response(buildSitemapIndex(), { headers: XML_HEADERS }),
    },
  },
});
