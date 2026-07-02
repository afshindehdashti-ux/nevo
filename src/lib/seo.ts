/**
 * NEVO SEO helpers — centralized metadata + JSON-LD builders.
 * Use buildSeo() in every route's head() for consistent titles/OG/canonical.
 */

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
  { code: "en", label: "English", hreflang: "en", status: "active" },
  { code: "ar", label: "العربية", hreflang: "ar", status: "active" },
  { code: "de", label: "Deutsch", hreflang: "de", status: "future" },
  { code: "tr", label: "Türkçe", hreflang: "tr", status: "future" },
  { code: "ru", label: "Русский", hreflang: "ru", status: "future" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

export interface SeoInput {
  title: string;
  description: string;
  path: string; // e.g. "/solutions/production-lines"
  image?: string; // absolute or relative
  type?: "website" | "article" | "product" | "profile";
  noindex?: boolean;
  keywords?: string[];
}

/** Build a head() config object (meta + links) for a route. */
export function buildSeo(input: SeoInput) {
  const absolutePath = input.path.startsWith("http")
    ? input.path
    : `${SITE.url}${input.path}`;
  const fullTitle = input.title.includes(SITE.titleSuffix)
    ? input.title
    : `${input.title} — ${SITE.titleSuffix}`;

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

  if (input.image) {
    meta.push({ property: "og:image", content: input.image });
    meta.push({ name: "twitter:image", content: input.image });
  }
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

  // hreflang scaffolding — active locales only (default routes serve en)
  for (const l of LOCALES.filter((l) => l.status === "active")) {
    links.push({
      rel: "alternate",
      hreflang: l.hreflang,
      href: l.code === "en" ? absolutePath : `${SITE.url}/${l.code}${input.path}`,
    });
  }
  links.push({ rel: "alternate", hreflang: "x-default", href: absolutePath });

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
      areaServed: ["AE", "GCC", "MENA", "EU", "CIS"],
      availableLanguage: ["English", "Arabic"],
    },
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
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE.url}/knowledge?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

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
