/**
 * NEVO SEO helpers — centralized metadata + JSON-LD builders.
 * Use buildSeo() in every route's head() for consistent titles/OG/canonical.
 */
import { OG_IMAGES, OG_DEFAULT } from "./og-images";
import { SEO_META } from "./seo-meta";


export const SITE = {
  name: "NEVO Industrial",
  legalName: "NEVO Industrial LLC",
  titleSuffix: "NEVO Industrial",
  defaultDescription:
    "Dubai-based industrial engineering. Factory development, sandwich panel production lines, PIR/PUR raw materials, engineering consultancy & finished panels for global markets.",
  url: "https://nevoindustrial.com",
  logo: "/favicon.ico",
  sameAs: [
    "https://www.linkedin.com/company/nevo-industrial",
    "https://www.youtube.com/@nevoindustrial",
  ],
  contact: {
    email: "solutions@nevoindustrial.com",
    phone: "+971 50 242 6167",
    phoneHref: "tel:+971502426167",
    whatsapp: "971502426167",
    whatsappDisplay: "+971 50 242 6167",
    whatsappMessage:
      "Hello NEVO Engineering Team,\n\nI am interested in your sandwich panel production solutions and would like to discuss my project.\n\nPlease contact me at your earliest convenience.",
    address: {
      streetAddress: "Business Bay",
      addressLocality: "Dubai",
      addressCountry: "AE",
    },
  },
} as const;

/** Canonical WhatsApp URL with the standard pre-filled engineering message. */
export const WHATSAPP_URL = `https://wa.me/971502426167?text=${encodeURIComponent(
  "Hello NEVO Engineering Team,\n\nI am interested in your sandwich panel production solutions and would like to discuss my project.\n\nPlease contact me at your earliest convenience.",
)}`;

export const LOCALES = [
  { code: "en", label: "English",    hreflang: "en", status: "active" },
  { code: "ar", label: "العربية",    hreflang: "ar", status: "active" },
  { code: "tr", label: "Türkçe",     hreflang: "tr", status: "active" },
  { code: "ru", label: "Русский",    hreflang: "ru", status: "active" },
  { code: "pt", label: "Português",  hreflang: "pt", status: "active" },
  { code: "de", label: "Deutsch",    hreflang: "de", status: "active" },
  { code: "es", label: "Español",    hreflang: "es", status: "active" },
  { code: "fr", label: "Français",   hreflang: "fr", status: "active" },
  { code: "it", label: "Italiano",   hreflang: "it", status: "active" },
  { code: "zh", label: "简体中文",     hreflang: "zh-Hans", status: "active" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

export interface SeoInput {
  title: string;
  description: string;
  path: string; // e.g. "/solutions/production-lines" — WITHOUT the /{lang} prefix
  lang: LocaleCode | string; // required — canonical + og:url are built per locale
  image?: string; // absolute or relative
  type?: "website" | "article" | "product" | "profile";
  noindex?: boolean;
  keywords?: string[];
}

/** Build a head() config object (meta + links) for a route. */
export function buildSeo(input: SeoInput) {
  const cleanPath = input.path === "/" ? "" : input.path;
  const localizedPath = `/${input.lang}${cleanPath}`;
  const absolutePath = input.path.startsWith("http")
    ? input.path
    : `${SITE.url}${localizedPath}`;

  // Auto-localize: if SEO_META has an entry for this path+locale, override the
  // caller's title/description. Callers pass an English fallback, and the
  // dictionary swaps in native-register copy for every supported language.
  const perLocale = SEO_META[input.path];
  const localized = perLocale?.[input.lang as LocaleCode] ?? perLocale?.en;
  const effectiveTitle = localized?.title ?? input.title;
  const effectiveDescription = localized?.description ?? input.description;

  const fullTitle = effectiveTitle.includes(SITE.titleSuffix)
    ? effectiveTitle
    : `${effectiveTitle} — ${SITE.titleSuffix}`;

  const meta: Array<Record<string, string>> = [
    { title: fullTitle },
    { name: "description", content: input.description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: input.description },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:url", content: absolutePath },
    { property: "og:site_name", content: SITE.name },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: input.description },
  ];

  // Resolve OG image: explicit input.image wins, otherwise per-route mapping,
  // otherwise site-wide brand default. Guarantees every leaf route emits a
  // real social preview instead of a hosting-injected screenshot.
  const mapped = OG_IMAGES[input.path] ?? OG_DEFAULT;
  const resolvedImage = input.image ?? mapped;
  const absoluteImage = resolvedImage.startsWith("http")
    ? resolvedImage
    : `${SITE.url}${resolvedImage}`;
  meta.push({ property: "og:image", content: absoluteImage });
  meta.push({ property: "og:image:secure_url", content: absoluteImage });
  meta.push({ property: "og:image:width", content: "1200" });
  meta.push({ property: "og:image:height", content: "630" });
  meta.push({ property: "og:image:alt", content: fullTitle });
  meta.push({ name: "twitter:image", content: absoluteImage });

  if (input.keywords?.length) {
    meta.push({ name: "keywords", content: input.keywords.join(", ") });
  }
  if (input.noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  } else {
    meta.push({
      name: "robots",
      content:
        "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    });
  }

  const links: Array<Record<string, string>> = [
    { rel: "canonical", href: absolutePath },
  ];

  // hreflang — every active locale uses a /{code} prefix; x-default → /en
  for (const l of LOCALES.filter((l) => l.status === "active")) {
    links.push({
      rel: "alternate",
      hrefLang: l.hreflang,
      href: `${SITE.url}/${l.code}${cleanPath}`,
    });
  }
  links.push({
    rel: "alternate",
    hrefLang: "x-default",
    href: `${SITE.url}/en${cleanPath}`,
  });

  return { meta, links };
}


/* -------------------- JSON-LD builders -------------------- */

export const orgJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  legalName: SITE.legalName,
  url: SITE.url,
  logo: SITE.logo,
  sameAs: SITE.sameAs,
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "sales",
      email: SITE.contact.email,
      ...(SITE.contact.phone ? { telephone: SITE.contact.phone } : {}),
      areaServed: ["AE", "GCC", "MENA", "EU", "CIS", "LATAM", "APAC", "Africa"],
      availableLanguage: [
        "English", "Arabic", "Turkish", "Russian", "Portuguese",
        "German", "Spanish", "French", "Italian", "Chinese",
      ],
    },
  ],
  knowsAbout: [
    "Sandwich panels", "PIR panels", "PUR panels", "Rock wool panels",
    "Continuous laminators", "Discontinuous production lines",
    "Roll forming", "Cold storage engineering", "Clean room construction",
    "Industrial building envelopes", "Factory feasibility studies",
    "PPGI", "Galvanized steel coils",
  ],
  address: {
    "@type": "PostalAddress",
    ...SITE.contact.address,
  },
});

export const websiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  inLanguage: LOCALES.map((l) => l.hreflang),
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE.url}/knowledge?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

/** Build hreflang <link rel="alternate"> entries for a given canonical path (without a locale prefix, e.g. "/about"). */
export const hreflangLinks = (path: string) => {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const suffix = clean === "/" ? "" : clean;
  const links: Array<Record<string, string>> = LOCALES.filter((l) => l.status === "active").map((l) => ({
    rel: "alternate",
    hrefLang: l.hreflang,
    href: `${SITE.url}/${l.code}${suffix}`,
  }));
  links.push({ rel: "alternate", hrefLang: "x-default", href: `${SITE.url}/en${suffix}` });
  return links;
};

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: it.path,
  })),
});

export const faqJsonLd = (faqs: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

export const serviceJsonLd = (s: {
  name: string;
  description: string;
  path: string;
  areaServed?: string[];
}) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: s.name,
  description: s.description,
  provider: { "@type": "Organization", name: SITE.name },
  areaServed: s.areaServed ?? ["Worldwide"],
  url: s.path,
});

export const productJsonLd = (p: {
  name: string;
  description: string;
  image?: string;
  brand?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: p.name,
  description: p.description,
  image: p.image,
  brand: { "@type": "Brand", name: p.brand ?? SITE.name },
});

export const articleJsonLd = (a: {
  title: string;
  description: string;
  image?: string;
  datePublished?: string;
  author?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: a.title,
  description: a.description,
  image: a.image,
  datePublished: a.datePublished,
  author: { "@type": "Organization", name: a.author ?? SITE.name },
  publisher: {
    "@type": "Organization",
    name: SITE.name,
    logo: { "@type": "ImageObject", url: SITE.logo },
  },
});

/** Convert a JSON-LD object into a head().scripts entry. */
export const ldScript = (data: unknown) => ({
  type: "application/ld+json",
  children: JSON.stringify(data),
});
