/**
 * NEVO SEO helpers — centralized metadata + JSON-LD builders.
 * Use buildSeo() in every route's head() for consistent titles/OG/canonical.
 */
import { OG_IMAGES, OG_DEFAULT, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from "./og-images";
import { SEO_META } from "./seo-meta";

export const SITE = {
  name: "NEVO Industrial",
  legalName: "NEVO TRADING AND CONSULTANCY L.L.C - FZ",
  tradeLicense: "2528837.01",
  titleSuffix: "NEVO Industrial",
  defaultDescription:
    "Dubai-based engineering consultancy for sandwich panel factory development, production lines, and PIR/PUR raw materials worldwide.",
  url: "https://nevoindustrial.com",
  logo: "/favicon.ico",
  sameAs: [
    "https://www.linkedin.com/company/nevo-industrial",
    "https://www.youtube.com/@nevoindustrial",
  ],
  contact: {
    email: "info@nevoindustrial.com",
    engineeringEmail: "solutions@nevoindustrial.com",
    phone: "+971 50 242 6167",
    phoneHref: "tel:+971502426167",
    whatsapp: "971502426167",
    whatsappDisplay: "+971 50 242 6167",
    whatsappHref: "https://wa.me/971502426167",
    whatsappMessage:
      "Hello NEVO Engineering Team,\n\nI am interested in your sandwich panel production solutions and would like to discuss my project.\n\nPlease contact me at your earliest convenience.",
    address: {
      streetAddress: "Meydan Grandstand, 6th Floor, Meydan Road, Nad Al Sheba",
      addressLocality: "Dubai",
      addressCountry: "AE",
      full: "Meydan Grandstand, 6th Floor, Meydan Road, Nad Al Sheba, Dubai, U.A.E.",
    },
  },
} as const;

/** Canonical WhatsApp URL with the standard pre-filled engineering message. */
export const WHATSAPP_URL = `https://wa.me/971502426167?text=${encodeURIComponent(
  "Hello NEVO Engineering Team,\n\nI am interested in your sandwich panel production solutions and would like to discuss my project.\n\nPlease contact me at your earliest convenience.",
)}`;

export const LOCALES = [
  { code: "en", label: "English", hreflang: "en", status: "active" },
  { code: "ar", label: "العربية", hreflang: "ar", status: "active" },
  { code: "tr", label: "Türkçe", hreflang: "tr", status: "active" },
  { code: "ru", label: "Русский", hreflang: "ru", status: "active" },
  { code: "pt", label: "Português", hreflang: "pt", status: "active" },
  { code: "de", label: "Deutsch", hreflang: "de", status: "active" },
  { code: "es", label: "Español", hreflang: "es", status: "active" },
  { code: "fr", label: "Français", hreflang: "fr", status: "active" },
  { code: "it", label: "Italiano", hreflang: "it", status: "active" },
  { code: "zh", label: "简体中文", hreflang: "zh-Hans", status: "active" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

/** Map a locale code to a valid Open Graph locale (language_TERRITORY). */
const OG_LOCALE_MAP: Record<string, string> = {
  en: "en_US",
  ar: "ar_AE",
  tr: "tr_TR",
  ru: "ru_RU",
  pt: "pt_PT",
  de: "de_DE",
  es: "es_ES",
  fr: "fr_FR",
  it: "it_IT",
  zh: "zh_CN",
};

export function ogLocaleFor(lang: string): string {
  return OG_LOCALE_MAP[String(lang)] ?? "en_US";
}

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
  const absolutePath = input.path.startsWith("http") ? input.path : `${SITE.url}${localizedPath}`;

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
    { name: "description", content: effectiveDescription },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: effectiveDescription },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:url", content: absolutePath },
    { property: "og:site_name", content: SITE.name },
    { property: "og:locale", content: ogLocaleFor(input.lang) },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: effectiveDescription },
  ];

  // NOTE: no og:locale:alternate — the router dedupes meta by property, so
  // repeated entries collapse to a single (misleading) tag. Localized variants
  // are advertised through the hreflang <link rel="alternate"> set below.


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
  meta.push({ property: "og:image:type", content: "image/jpeg" });
  meta.push({ property: "og:image:width", content: String(OG_IMAGE_WIDTH) });
  meta.push({ property: "og:image:height", content: String(OG_IMAGE_HEIGHT) });
  meta.push({ property: "og:image:alt", content: fullTitle });
  meta.push({ name: "twitter:image", content: absoluteImage });
  meta.push({ name: "twitter:image:alt", content: fullTitle });


  if (input.keywords?.length) {
    meta.push({ name: "keywords", content: input.keywords.join(", ") });
  }
  if (input.noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  } else {
    meta.push({
      name: "robots",
      content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    });
  }

  const links: Array<Record<string, string>> = [{ rel: "canonical", href: absolutePath }];

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

/**
 * Stable @id nodes so every page's graph references the SAME entities
 * instead of re-declaring anonymous duplicates. Google merges nodes by @id.
 */
export const ORG_ID = `${SITE.url}/#organization`;
export const LOCAL_BUSINESS_ID = `${SITE.url}/#dubai-hq`;
export const WEBSITE_ID = `${SITE.url}/#website`;

/** Absolute brand logo (schema.org requires an absolute, crawlable URL). */
export const LOGO_URL = `${SITE.url}/icon-512.png`;

/** Lightweight reference to the Organization node — use as provider/brand/publisher. */
export const ORG_REF = { "@type": "Organization", "@id": ORG_ID, name: SITE.name, url: SITE.url };

/** Postal address node for the Dubai head office. */
export const postalAddressJsonLd = () => ({
  "@type": "PostalAddress",
  streetAddress: SITE.contact.address.streetAddress,
  addressLocality: SITE.contact.address.addressLocality,
  addressRegion: "Dubai",
  addressCountry: SITE.contact.address.addressCountry,
});

export const orgJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE.name,
  alternateName: "NEVO",
  legalName: SITE.legalName,
  identifier: SITE.tradeLicense,
  url: SITE.url,
  logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 },
  image: LOGO_URL,
  description: SITE.defaultDescription,
  email: SITE.contact.email,
  telephone: SITE.contact.phone,
  sameAs: SITE.sameAs,
  foundingLocation: { "@type": "Place", name: "Dubai, United Arab Emirates" },
  areaServed: ["AE", "GCC", "MENA", "EU", "CIS", "LATAM", "APAC", "Africa"],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "sales",
      email: SITE.contact.email,
      ...(SITE.contact.phone ? { telephone: SITE.contact.phone } : {}),
      areaServed: ["AE", "GCC", "MENA", "EU", "CIS", "LATAM", "APAC", "Africa"],
      availableLanguage: [
        "English",
        "Arabic",
        "Turkish",
        "Russian",
        "Portuguese",
        "German",
        "Spanish",
        "French",
        "Italian",
        "Chinese",
      ],
    },
    {
      "@type": "ContactPoint",
      contactType: "technical support",
      email: SITE.contact.engineeringEmail,
      availableLanguage: ["English", "Arabic", "Turkish"],
    },
  ],
  knowsAbout: [
    "Sandwich panels",
    "PIR panels",
    "PUR panels",
    "Rock wool panels",
    "Continuous laminators",
    "Discontinuous production lines",
    "Roll forming",
    "Cold storage engineering",
    "Clean room construction",
    "Industrial building envelopes",
    "Factory feasibility studies",
    "PPGI",
    "Galvanized steel coils",
  ],
  address: postalAddressJsonLd(),
  subOrganization: [{ "@type": "LocalBusiness", "@id": LOCAL_BUSINESS_ID }],
});

/**
 * Dubai head office as a LocalBusiness node, linked back to the
 * Organization via parentOrganization/@id.
 */
export const localBusinessJsonLd = (lang: string = "en") => ({
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "ProfessionalService"],
  "@id": LOCAL_BUSINESS_ID,
  name: `${SITE.name} — Dubai Head Office`,
  legalName: SITE.legalName,
  parentOrganization: { "@id": ORG_ID },
  url: `${SITE.url}/${lang}/contact`,
  image: LOGO_URL,
  logo: LOGO_URL,
  description:
    "NEVO Industrial head office in Dubai — engineering consultancy, factory development, production lines and PIR/PUR raw materials for the sandwich panel industry.",
  email: SITE.contact.email,
  telephone: SITE.contact.phone,
  address: postalAddressJsonLd(),
  geo: { "@type": "GeoCoordinates", latitude: 25.1573, longitude: 55.3021 },
  hasMap: "https://www.google.com/maps/search/?api=1&query=Meydan+Grandstand+Dubai",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
  ],
  currenciesAccepted: "AED, USD, EUR",
  areaServed: ["AE", "GCC", "MENA", "EU", "CIS", "LATAM", "APAC", "Africa"],
  priceRange: "$$$",
  sameAs: SITE.sameAs,
});

export const websiteJsonLd = (lang: string = "en") => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE.name,
  url: SITE.url,
  publisher: { "@id": ORG_ID },
  inLanguage: LOCALES.map((l) => l.hreflang),
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE.url}/${lang}/knowledge-hub?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});


/** Build hreflang <link rel="alternate"> entries for a given canonical path (without a locale prefix, e.g. "/about"). */
export const hreflangLinks = (path: string) => {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const suffix = clean === "/" ? "" : clean;
  const links: Array<Record<string, string>> = LOCALES.filter((l) => l.status === "active").map(
    (l) => ({
      rel: "alternate",
      hrefLang: l.hreflang,
      href: `${SITE.url}/${l.code}${suffix}`,
    }),
  );
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
  serviceType?: string;
  category?: string[];
}) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${s.path}#service`,
  name: s.name,
  description: s.description,
  ...(s.serviceType ? { serviceType: s.serviceType } : {}),
  ...(s.category?.length ? { category: s.category } : {}),
  provider: ORG_REF,
  areaServed: s.areaServed ?? ["Worldwide"],
  url: s.path,
  isPartOf: { "@id": WEBSITE_ID },
});

/**
 * Solutions hub catalog — lists NEVO's core service offerings as an
 * OfferCatalog attached to the Organization so Google can map the
 * offerings to the entity rather than to isolated pages.
 */
export const solutionsCatalogJsonLd = (input: {
  lang: string;
  items: { name: string; description: string; path: string }[];
}) => ({
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  "@id": `${SITE.url}/${input.lang}/solutions#catalog`,
  name: "NEVO Industrial — Solutions",
  url: `${SITE.url}/${input.lang}/solutions`,
  provider: ORG_REF,
  numberOfItems: input.items.length,
  itemListElement: input.items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      "@id": `${SITE.url}/${input.lang}${it.path}#service`,
      name: it.name,
      description: it.description,
      url: `${SITE.url}/${input.lang}${it.path}`,
      provider: ORG_REF,
    },
  })),
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
  manufacturer: ORG_REF,
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

/**
 * Downloads ItemList schema — one JSON-LD object per Solutions page listing
 * the route-relevant technical documents. Every item points at the shared
 * Download Center URL so crawlers still resolve to a single canonical
 * library, while the per-route `name` + item names keep the schema unique.
 */
export const downloadsItemListJsonLd = (input: {
  /** Route path without locale, e.g. "/solutions/production-lines". */
  path: string;
  /** Locale prefix, e.g. "en". */
  lang: string;
  /** ItemList name — usually "<Solution> — Downloads". */
  name: string;
  /** Short description of the download bundle. */
  description: string;
  /** Ordered document titles shown on this Solutions page. */
  items: string[];
}) => {
  const downloadUrl = `${SITE.url}/${input.lang}/download-center`;
  const pageUrl = `${SITE.url}/${input.lang}${input.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    description: input.description,
    url: pageUrl,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: input.items.length,
    itemListElement: input.items.map((title, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "DigitalDocument",
        name: title,
        encodingFormat: "application/pdf",
        inLanguage: input.lang,
        url: downloadUrl,
        isPartOf: { "@type": "CollectionPage", name: "NEVO Download Center", url: downloadUrl },
        publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
      },
    })),
  };
};

/** Convert a JSON-LD object into a head().scripts entry. */
export const ldScript = (data: unknown) => ({
  type: "application/ld+json",
  children: JSON.stringify(data),
});
