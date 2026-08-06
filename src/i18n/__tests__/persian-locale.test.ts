import { describe, expect, it } from "vitest";

import en from "../locales/en.json";
import fa from "../locales/fa.json";
import { LOCALES, SUPPORTED_LOCALES, localeDir, localeFromPathname } from "../config";
import { FA_SEO_META } from "../../lib/fa-seo-meta";
import { SEO_META } from "../../lib/seo-meta";
import { buildSeo, SITE } from "../../lib/seo";

function flatten(value: unknown, prefix = "", output = new Map<string, string>()) {
  if (value === null || typeof value !== "object") {
    output.set(prefix, String(value));
    return output;
  }

  for (const [key, nested] of Object.entries(value)) {
    flatten(nested, prefix ? `${prefix}.${key}` : key, output);
  }

  return output;
}

function placeholders(value: string) {
  return [...value.matchAll(/{{\s*([^}]+?)\s*}}/g)].map((match) => match[1]).sort();
}

describe("Persian locale", () => {
  it("is registered as an RTL locale and resolves from /fa URLs", () => {
    expect(SUPPORTED_LOCALES).toContain("fa");
    expect(LOCALES.find((locale) => locale.code === "fa")).toMatchObject({
      nativeName: "فارسی",
      dir: "rtl",
      ogLocale: "fa_IR",
    });
    expect(localeDir("fa")).toBe("rtl");
    expect(localeFromPathname("/fa/solutions/production-lines")).toBe("fa");
    expect(localeFromPathname("/admin")).toBeNull();
  });

  it("matches every English translation key and interpolation placeholder", () => {
    const english = flatten(en);
    const persian = flatten(fa);

    expect([...persian.keys()].sort()).toEqual([...english.keys()].sort());
    expect(persian.size).toBe(862);

    for (const [key, englishValue] of english) {
      expect(placeholders(persian.get(key) ?? ""), key).toEqual(placeholders(englishValue));
    }
  });

  it("provides Persian SEO metadata for every localized route", () => {
    expect(Object.keys(FA_SEO_META).sort()).toEqual(Object.keys(SEO_META).sort());

    const seo = buildSeo({
      title: "English fallback",
      description: "English fallback",
      path: "/",
      lang: "fa",
    });

    expect(seo.meta).toContainEqual({ property: "og:locale", content: "fa_IR" });
    expect(seo.meta.find((entry) => entry.title)?.title).toContain("مهندسی");
    expect(seo.links).toContainEqual({ rel: "canonical", href: `${SITE.url}/fa` });
    expect(seo.links).toContainEqual({
      rel: "alternate",
      hrefLang: "fa",
      href: `${SITE.url}/fa`,
    });
  });
});
