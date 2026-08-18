import { describe, expect, it } from "vitest";
import {
  ACTIVE_LOCALES,
  ALL_ROUTES,
  BASE_URL,
  HREFLANG,
  SECTIONS,
  buildChildSitemap,
  buildSitemapIndex,
  parseChildSlug,
  routesForSection,
  sectionFor,
} from "@/lib/sitemap";

const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

describe("sitemap index", () => {
  it("lists one child sitemap per locale × section", () => {
    const xml = buildSitemapIndex();
    expect(xml).toContain("<sitemapindex");
    expect(locs(xml)).toHaveLength(ACTIVE_LOCALES.length * SECTIONS.length);
    for (const locale of ACTIVE_LOCALES) {
      for (const section of SECTIONS) {
        expect(xml).toContain(`${BASE_URL}/sitemaps/${locale}-${section}.xml`);
      }
    }
  });

  it("resolves every advertised child slug", () => {
    for (const url of locs(buildSitemapIndex())) {
      const slug = url.split("/").pop()!;
      expect(parseChildSlug(slug), slug).not.toBeNull();
    }
    expect(parseChildSlug("bogus.xml")).toBeNull();
    expect(parseChildSlug("en-unknown.xml")).toBeNull();
  });
});

describe("child sitemaps", () => {
  it("partitions all routes across sections without loss or overlap", () => {
    const total = SECTIONS.reduce((n, s) => n + routesForSection(s).length, 0);
    expect(total).toBe(ALL_ROUTES.length);
    expect(sectionFor("/solutions/raw-materials")).toBe("solutions");
    expect(sectionFor("/knowledge-hub/some-article")).toBe("knowledge-hub");
    expect(sectionFor("/knowledge-hub")).toBe("pages");
    expect(sectionFor("/about")).toBe("pages");
  });

  it("emits only its own locale's URLs", () => {
    const xml = buildChildSitemap("ar", "solutions");
    for (const loc of locs(xml)) expect(loc.startsWith(`${BASE_URL}/ar/`)).toBe(true);
    expect(locs(xml)).toHaveLength(routesForSection("solutions").length);
  });

  it("carries the full, reciprocal hreflang set on every URL", () => {
    for (const section of SECTIONS) {
      const xml = buildChildSitemap("zh", section);
      const urlBlocks = xml.split("<url>").slice(1);
      expect(urlBlocks.length).toBeGreaterThan(0);
      for (const block of urlBlocks) {
        for (const locale of ACTIVE_LOCALES) {
          expect(block).toContain(`hreflang="${HREFLANG[locale]}"`);
        }
        expect(block).toContain('hreflang="x-default"');
      }
    }
  });

  it("keeps alternates identical across locale variants of the same path", () => {
    const alts = (xml: string) =>
      [...xml.matchAll(/<xhtml:link[^>]+>/g)].map((m) => m[0]).join("\n");
    expect(alts(buildChildSitemap("en", "solutions"))).toBe(
      alts(buildChildSitemap("fr", "solutions")),
    );
  });

  it("covers every locale × route exactly once across the whole index", () => {
    const all = new Set<string>();
    for (const locale of ACTIVE_LOCALES) {
      for (const section of SECTIONS) {
        for (const loc of locs(buildChildSitemap(locale, section))) {
          expect(all.has(loc)).toBe(false);
          all.add(loc);
        }
      }
    }
    expect(all.size).toBe(ACTIVE_LOCALES.length * ALL_ROUTES.length);
  });
});
