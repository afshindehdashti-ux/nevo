import { describe, it, expect } from "vitest";

import { resolveRedirect, KNOWN_PATHS, LOCALE_ALIASES, LEGACY_PATHS } from "@/lib/redirects";

const loc = (p: string, s = "") => resolveRedirect(p, s)?.location ?? null;

describe("resolveRedirect", () => {
  it("leaves canonical localized URLs alone", () => {
    expect(resolveRedirect("/en/about")).toBeNull();
    expect(resolveRedirect("/ar/solutions/sandwich-panels")).toBeNull();
    expect(resolveRedirect("/zh/knowledge-hub")).toBeNull();
    expect(resolveRedirect("/en")).toBeNull();
  });

  it("leaves the root path to locale detection", () => {
    expect(resolveRedirect("/")).toBeNull();
  });

  it("strips trailing slashes", () => {
    expect(loc("/en/about/")).toBe("/en/about");
    expect(loc("/fr/solutions/")).toBe("/fr/solutions");
    expect(loc("/en/")).toBe("/en");
  });

  it("collapses duplicate slashes", () => {
    expect(loc("/en//about")).toBe("/en/about");
  });

  it("lowercases uppercase paths", () => {
    expect(loc("/EN/About")).toBe("/en/about");
    expect(loc("/DE/Solutions/Raw-Materials")).toBe("/de/solutions/raw-materials");
  });

  it("maps regional locale variants to the canonical locale", () => {
    expect(loc("/en-US/about")).toBe("/en/about");
    expect(loc("/pt-BR/contact")).toBe("/pt/contact");
    expect(loc("/zh-Hans/solutions")).toBe("/zh/solutions");
    expect(loc("/zh-CN/")).toBe("/zh");
    expect(loc("/ar-AE/industries")).toBe("/ar/industries");
  });

  it("adds the default locale to un-prefixed known pages", () => {
    expect(loc("/about")).toBe("/en/about");
    expect(loc("/solutions/production-lines")).toBe("/en/solutions/production-lines");
  });

  it("ignores un-prefixed unknown paths (real 404s stay 404s)", () => {
    expect(resolveRedirect("/definitely-not-a-page")).toBeNull();
    expect(resolveRedirect("/en/definitely-not-a-page")).toBeNull();
  });

  it("redirects legacy slugs to their canonical page", () => {
    expect(loc("/en/blog")).toBe("/en/knowledge-hub");
    expect(loc("/knowledge")).toBe("/en/knowledge-hub");
    expect(loc("/fr/about-us")).toBe("/fr/about");
    expect(loc("/de/contact-us")).toBe("/de/contact");
    expect(loc("/it/services")).toBe("/it/solutions");
    expect(loc("/es/solutions/panels")).toBe("/es/solutions/sandwich-panels");
  });

  it("keeps legacy article sub-paths within the same locale", () => {
    expect(loc("/ru/knowledge/some-article")).toBe("/ru/knowledge-hub/some-article");
    expect(loc("/tr/blog/some-article")).toBe("/tr/knowledge-hub/some-article");
  });

  it("preserves the query string", () => {
    expect(loc("/en/about/", "?utm_source=google")).toBe("/en/about?utm_source=google");
    expect(loc("/pt-BR/contact", "?a=1&b=2")).toBe("/pt/contact?a=1&b=2");
  });

  it("handles combined variants in one hop (no redirect chains)", () => {
    expect(loc("/EN-US/About-Us/")).toBe("/en/about");
    expect(loc("//ZH-CN//Blog/")).toBe("/zh/knowledge-hub");
  });

  it("drops index.html", () => {
    expect(loc("/en/index.html")).toBe("/en");
    expect(loc("/en/about/index.html")).toBe("/en/about");
  });

  it("never touches backend, API, auth or asset routes", () => {
    for (const p of [
      "/admin/invoices",
      "/crm",
      "/backoffice",
      "/auth",
      "/api/public/webhook",
      "/sitemap.xml",
      "/sitemaps/en-pages.xml",
      "/robots.txt",
      "/assets/app.css",
      "/favicon.ico",
      "/status",
      "/reset-password",
      "/.well-known/security.txt",
    ]) {
      expect(resolveRedirect(p), p).toBeNull();
    }
  });

  it("resolves every locale alias to a supported locale", () => {
    for (const [alias, target] of Object.entries(LOCALE_ALIASES)) {
      expect(loc(`/${alias}/about`)).toBe(`/${target}/about`);
    }
  });

  it("resolves every legacy path to a live page", () => {
    for (const target of Object.values(LEGACY_PATHS)) {
      expect(KNOWN_PATHS.has(target), target).toBe(true);
    }
  });

  it("is idempotent — redirect targets never redirect again", () => {
    const samples = [
      "/EN-US/About-Us/",
      "/knowledge",
      "/pt-BR/contact",
      "/en//about//",
      "/es/solutions/panels",
      "/en/index.html",
    ];
    for (const s of samples) {
      const first = loc(s);
      expect(first, s).not.toBeNull();
      expect(resolveRedirect(first!), first!).toBeNull();
    }
  });
});
