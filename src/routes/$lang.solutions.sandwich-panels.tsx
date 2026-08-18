import { createFileRoute } from "@tanstack/react-router";
import { SITE, buildSeo, downloadsItemListJsonLd, ldScript } from "@/lib/seo";
import { ORG_REF, WEBSITE_ID } from "@/lib/seo";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  Flame,
  Layers,
  Ruler,
  Shield,
  Sparkles,
  Volume2,
  Droplets,
  Thermometer,
  Palette,
  Building2,
  Warehouse,
  Snowflake,
  Wrench,
  Leaf,
  Package,
  Factory,
} from "lucide-react";

import t01 from "@/assets/panels/tile-01.jpg";
import t02 from "@/assets/panels/tile-02.jpg";
import t03 from "@/assets/panels/tile-03.jpg";
import t04 from "@/assets/panels/tile-04.jpg";
import t05 from "@/assets/panels/tile-05.jpg";
import t06 from "@/assets/panels/tile-06.jpg";
import t07 from "@/assets/panels/tile-07.jpg";
import t08 from "@/assets/panels/tile-08.jpg";
import t09 from "@/assets/panels/tile-09.jpg";
import t10 from "@/assets/panels/tile-10.jpg";
import t11 from "@/assets/panels/tile-11.jpg";
import t12 from "@/assets/panels/tile-12.jpg";
import t13 from "@/assets/panels/tile-13.jpg";
import t14 from "@/assets/panels/tile-14.jpg";
import t15 from "@/assets/panels/tile-15.jpg";
import t16 from "@/assets/panels/tile-16.jpg";
import t17 from "@/assets/panels/tile-17.jpg";
import t18 from "@/assets/panels/tile-18.jpg";
import t19 from "@/assets/panels/tile-19.jpg";
import t20 from "@/assets/panels/tile-20.jpg";
import t21 from "@/assets/panels/tile-21.jpg";
import t22 from "@/assets/panels/tile-22.jpg";
import t23 from "@/assets/panels/tile-23.jpg";
import t24 from "@/assets/panels/tile-24.jpg";
import t25 from "@/assets/panels/tile-25.jpg";
import t26 from "@/assets/panels/tile-26.jpg";
import t27 from "@/assets/panels/tile-27.jpg";
import t28 from "@/assets/panels/tile-28.jpg";
import t29 from "@/assets/panels/tile-29.jpg";

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { InquiryCTA } from "@/components/site/InquiryCTA";
import { KnowledgeHubPreview } from "@/components/site/KnowledgeHubPreview";
import { DownloadsCTA } from "@/components/site/DownloadsCTA";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { SurfaceCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";
import { ogImageMeta } from "@/lib/og-images";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TITLE =
  "Finished Sandwich Panels — PIR & Rock Wool Wall, Roof and Cold Storage | NEVO Industrial";
const DESCRIPTION =
  "Premium PIR and Rock Wool sandwich panels engineered for industrial, commercial, food processing and cold storage applications — up to 120 min fire rating, tongue-and-groove joints, EN 13501 certified. NEVO Industrial, Dubai.";
const URL_PATH = "/solutions/sandwich-panels";

// Route-scoped downloads list — surfaced as ItemList JSON-LD so the schema
// stays unique to this Solutions page. Items resolve to /download-center.
const DOWNLOADS_LD_ITEMS = [
  "PIR Sandwich Panel Datasheet",
  "Rock Wool Sandwich Panel Datasheet",
  "Cold Storage Panel Selection Guide",
  "EN 13501 Fire Classification Summary",
  "Panel Colour & Coating Reference",
  "Installation & Fixing Handbook",
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "What panel types does NEVO supply?",
    a: "PIR (polyisocyanurate) wall panels, PIR roof panels, and rock wool wall/roof panels for industrial, commercial, food processing, cold storage and clean-room applications.",
  },
  {
    q: "What is the difference between PIR and rock wool panels?",
    a: "PIR panels offer excellent thermal insulation (λ 0.022–0.024 W/m·K) with a lightweight closed-cell core. Rock wool panels deliver non-combustible A2-s1,d0 fire performance, superior acoustic insulation and higher operating temperatures — at a slightly higher weight and thermal conductivity (0.036–0.040 W/m·K).",
  },
  {
    q: "What panel thicknesses are available?",
    a: "Standard thicknesses: 40, 50, 60, 80, 100 and 150 mm. Custom thicknesses up to 200 mm are available for cold storage and specialised applications on request.",
  },
  {
    q: "What is the effective panel width?",
    a: "1000 mm and 1150 mm effective coverage width, with 1200 mm total width including the tongue. Custom widths available for OEM projects.",
  },
  {
    q: "What is the maximum panel length?",
    a: "Up to 16 m per panel in standard production, longer on project basis. Transport and site handling normally dictate practical lengths of 12–14 m.",
  },
  {
    q: "What fire rating do the panels achieve?",
    a: "PIR panels reach B-s2,d0 or B-s1,d0 to EN 13501-1. Rock wool panels reach A2-s1,d0 or A1 and provide up to 120 minutes fire resistance (EI 120) depending on thickness and fixing.",
  },
  {
    q: "What steel facings do you use?",
    a: "PPGI (pre-painted galvanised steel) 0.35–0.80 mm, coated with PE, SMP, HDP or PVDF paint systems in a wide range of RAL colours and food-grade finishes.",
  },
  {
    q: "What surface profiles are available?",
    a: "Five standard exterior profiles — Micro Rib, Mini Rib, Flat (Smooth), Linear and Wave — plus flat, stucco embossed or mini-box interior facings.",
  },
  {
    q: "Which colours are standard?",
    a: "RAL 9002, 9006, 9010, 5010, 6005, 7016, 8017, 3009 and metallic silver are stocked. Any RAL or NCS colour can be produced on order with a minimum coil quantity.",
  },
  {
    q: "What joint systems do you offer?",
    a: "Tongue-and-groove for standard wall panels, EZ Lock for hidden-fix wall systems, and hidden-screw joint for architectural facades. Roof panels use standing seam or trapezoidal overlap with EPDM sealing.",
  },
  {
    q: "What is the U-value of a 100 mm PIR panel?",
    a: "Approximately 0.22 W/m²·K for a 100 mm PIR panel with 0.023 W/m·K core, without thermal bridging at joints thanks to the tongue-and-groove profile.",
  },
  {
    q: "What is the compressive strength of the core?",
    a: "PIR core: ≥ 150 kPa at 10% deformation. Rock wool lamella core: ≥ 80 kPa at 10% deformation with fibre orientation perpendicular to facings for maximum panel stiffness.",
  },
  {
    q: "Are the panels suitable for cold storage?",
    a: "Yes. Cold-storage panels use PIR core with high-density facings, food-grade coatings, cam-lock joints for airtightness and thicknesses from 80 to 200 mm for temperatures down to –40 °C.",
  },
  {
    q: "What acoustic performance do rock wool panels provide?",
    a: "Rock wool panels achieve Rw 30–36 dB depending on thickness and facing, suitable for industrial noise-control envelopes, technical rooms and commercial buildings.",
  },
  {
    q: "Are the panels water-tight?",
    a: "Yes. Panel joints are tested to EN 12865 for driving rain and equipped with pre-applied EPDM or butyl sealant. Roof panels achieve full watertightness at pitches ≥ 3°.",
  },
  {
    q: "What accessories are supplied with the panels?",
    a: "Corner and base flashings, ridge and eaves trims, window and door frames, fastening systems (visible and hidden), sealants, EPDM tapes and touch-up paint — supplied per project bill of materials.",
  },
  {
    q: "Do you supply certified windows and doors?",
    a: "Yes. Factory-made insulated windows and personnel/service doors matched to panel thickness, with the same thermal, fire and hygiene classification as the wall system.",
  },
  {
    q: "What fastening options are available?",
    a: "Visible self-drilling stainless steel screws with EPDM washers for standard applications, hidden clip systems for architectural facades, and concealed brackets for cold-storage assemblies.",
  },
  {
    q: "Are the panels certified for food processing?",
    a: "Yes. Panels with HDP or food-grade PVDF coating, hygienic sealed joints and stainless fasteners are certified for HACCP and EU food-contact regulations.",
  },
  {
    q: "What is the panel warranty?",
    a: "10 years on structural performance and thermal integrity, 15–25 years on paint system depending on coating and environment, subject to correct installation and maintenance.",
  },
  {
    q: "Can you supply project-specific engineering?",
    a: "Yes. Structural calculations, wind and snow load verification, thermal bridging analysis, installation drawings and site supervision are available per project.",
  },
  {
    q: "What is the standard delivery time?",
    a: "4–8 weeks ex-works Dubai for standard specifications; 8–12 weeks for custom colours or non-stocked thicknesses. Consolidated multi-panel projects are planned on Gantt schedule.",
  },
  {
    q: "Which incoterms do you offer?",
    a: "EXW Jebel Ali, FOB, CFR, CIF and DAP into GCC, Levant, East and West Africa, CIS and South Asia. DDP with local stock available in select markets.",
  },
  {
    q: "How are panels packed for shipping?",
    a: "Vertically stacked on wooden pallets, wrapped in polyethylene film, protected with polystyrene edge and corner protectors, and steel-strapped for safe container and truck transport.",
  },
  {
    q: "Do you provide installation support?",
    a: "Yes. Method statements, on-site supervision by NEVO technical engineers, and installer training for the client's contractor are available as an integrated service.",
  },
  {
    q: "Are the panels sustainable?",
    a: "PIR cores use HFC-free blowing agents. Rock wool is 100% recyclable. Steel facings contain up to 30% recycled content. EPDs and GWP declarations are available on request.",
  },
  {
    q: "Do you offer OEM / private-label supply?",
    a: "Yes. Panels can be produced under distributor branding, with private-label documentation, packaging and technical datasheets for regional resellers.",
  },
];

export const Route = createFileRoute("/$lang/solutions/sandwich-panels")({
  head: ({ params }) => {
    const canonical = `${SITE.url}/${params.lang}${URL_PATH}`;
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const crumbsLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/${params.lang}` },
        {
          "@type": "ListItem",
          position: 2,
          name: "Solutions",
          item: `${SITE.url}/${params.lang}/solutions`,
        },
        { "@type": "ListItem", position: 3, name: "Finished Sandwich Panels", item: canonical },
      ],
    };
    const productLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "NEVO Sandwich Panels — PIR, PUR & Rock Wool",
      brand: { "@type": "Brand", name: SITE.name },
      category: "Insulated sandwich panels",
      description: DESCRIPTION,
      url: canonical,
      additionalProperty: [
        { "@type": "PropertyValue", name: "Cores", value: "PIR, PUR, Rock wool, EPS" },
        { "@type": "PropertyValue", name: "Standards", value: "EN 14509, EN 13501-1" },
        {
          "@type": "PropertyValue",
          name: "Applications",
          value: "Roof, wall, cold room, clean room, industrial buildings",
        },
      ],
    };
    const seo = buildSeo({
      title: TITLE,
      description: DESCRIPTION,
      path: URL_PATH,
      lang: params.lang,
      type: "product",
      keywords: [
        "sandwich panels",
        "PIR sandwich panels",
        "PUR sandwich panels",
        "rock wool sandwich panels",
        "cold room panels",
        "roof and wall panels",
        "EN 14509 sandwich panels",
        "insulated metal panels supplier",
      ],
    });
    return {
      ...seo,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(faqLd) },
        { type: "application/ld+json", children: JSON.stringify(productLd) },
        { type: "application/ld+json", children: JSON.stringify(crumbsLd) },
        ldScript(
          downloadsItemListJsonLd({
            path: URL_PATH,
            lang: String(params.lang),
            name: "Finished Sandwich Panels — Technical Downloads",
            description:
              "PIR and rock wool sandwich panel datasheets, cold-storage selection guides and fire classification references from the NEVO Download Center.",
            items: DOWNLOADS_LD_ITEMS,
          }),
        ),
      ],
    };
  },
  component: SandwichPanelsPage,
});

/* ------------------------------------------------------------------ */

function SandwichPanelsPage() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main">
        <Hero />
        <ProductRange />
        <Applications />
        <CoreEngineering />
        <SurfaceOptions />
        <Performance />
        <BuildingTypes />
        <ConstructionDetails />
        <WhyNevo />
        <TechSpecs />
        <Sustainability />
        <DownloadsCTA />
        <FAQSection />
        <KnowledgeHubPreview route="sandwich-panels" />
        <InquiryCTA
          source="panels"
          eyebrow="Panel inquiry"
          title="Request a panel quotation."
          lede="Share your panel specifications, quantities, application and destination. A NEVO panel specialist responds with a technical and commercial proposal within one business day."
          ctaLabel="Request Panel Quotation"
        />
        <FinalCTA />
      </main>
      <SiteFooter />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  HERO                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative isolate -mt-20 overflow-hidden bg-black text-white md:-mt-24">
      <div className="absolute inset-0 -z-10">
        <img
          src={t01}
          alt="NEVO PIR sandwich panel — premium engineered wall panel"
          className="h-full w-full object-cover"
          style={{ transform: "scale(1.05)" }}
          fetchPriority="high"
        />
        <div aria-hidden className="absolute inset-0 bg-black/60" />
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-[70%]"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.78) 55%, rgba(0,0,0,0.25) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent"
        />
      </div>

      <div className="container-wide relative flex min-h-[80vh] flex-col justify-between px-6 pt-36 pb-14 lg:min-h-[92vh] lg:px-8 lg:pt-44">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
          className="max-w-3xl"
        >
          <div className="eyebrow mb-6 flex items-center gap-2 text-white/70">
            <span className="inline-flex size-1.5 rounded-full bg-accent" />
            Finished Sandwich Panels
          </div>
          <h1 className="text-display text-balance text-white">
            Premium Panels. <span className="text-accent">Engineered Performance.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
            PIR and Rock Wool sandwich panels engineered for the world's most demanding industrial,
            commercial and cold-storage envelopes — certified fire, thermal, acoustic and structural
            performance in every panel we ship.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button size="lg" variant="primary" asChild>
              <a href="/project-inquiry">
                Request Panel Quotation <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#downloads">Download Technical Datasheet</a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9 }}
          className="mt-16 grid max-w-3xl grid-cols-3 gap-8 border-t border-white/15 pt-8 text-white/85"
        >
          {[
            { k: "Quality", v: "EN 13501 certified" },
            { k: "Performance", v: "Up to 120 min fire" },
            { k: "Reliability", v: "Global supply chain" },
          ].map((s) => (
            <div key={s.k}>
              <div className="text-xs font-mono uppercase tracking-widest text-accent">{s.k}</div>
              <div className="mt-2 text-sm text-white/80">{s.v}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  PRODUCT RANGE — tiles 01, 02, 03                                   */
/* ------------------------------------------------------------------ */

const PRODUCTS = [
  {
    tag: "01",
    img: t01,
    title: "PIR Sandwich Panel — Wall",
    desc: "Excellent thermal insulation and high structural strength for industrial, commercial and logistics buildings.",
    highlights: ["λ 0.022–0.024 W/m·K", "B-s2,d0 fire class", "40–150 mm thickness"],
  },
  {
    tag: "02",
    img: t02,
    title: "PIR Sandwich Panel — Roof",
    desc: "High thermal performance, lightweight and durable roof system engineered for long-span industrial roofs.",
    highlights: ["Standing seam / trapezoidal", "Watertight ≥ 3° pitch", "Lightweight assembly"],
  },
  {
    tag: "03",
    img: t03,
    title: "Rock Wool Sandwich Panel",
    desc: "Non-combustible A2-s1,d0 core with superior acoustic insulation and up to 120 min fire resistance.",
    highlights: ["A2-s1,d0 fire class", "Rw 30–36 dB", "80–150 kg/m³ density"],
  },
];

function ProductRange() {
  return (
    <Section id="range" className="bg-white">
      <SectionHeader
        eyebrow="Product Range"
        title="Three engineered panel systems."
        lede="Every NEVO panel is designed around a single engineering brief — deliver certified performance in the harshest industrial environments, at scale."
      />
      <div className="grid gap-8 md:grid-cols-3">
        {PRODUCTS.map((p, i) => (
          <motion.div
            key={p.tag}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: i * 0.1, duration: 0.7 }}
          >
            <SurfaceCard className="h-full overflow-hidden p-0">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
                <img
                  src={p.img}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-4 left-4 rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">
                  {p.tag}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium text-foreground">{p.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{p.desc}</p>
                <ul className="mt-5 space-y-2">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="size-4 text-accent" /> {h}
                    </li>
                  ))}
                </ul>
              </div>
            </SurfaceCard>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  APPLICATIONS — tiles 04, 05, 06                                    */
/* ------------------------------------------------------------------ */

const APPS = [
  {
    tag: "04",
    img: t04,
    title: "Wall Panel Application",
    desc: "Vertical installation, fast and easy assembly with an excellent architectural appearance.",
  },
  {
    tag: "05",
    img: t05,
    title: "Roof Panel Application",
    desc: "Standing seam system delivering a weather-tight solution with long-life performance.",
  },
  {
    tag: "06",
    img: t06,
    title: "Cold Storage Application",
    desc: "High insulation efficiency, energy-saving solution with consistent performance down to –40 °C.",
  },
];

function Applications() {
  return (
    <Section id="applications" className="bg-secondary/40">
      <SectionHeader eyebrow="Applications" title="Engineered for every industrial envelope." />
      <div className="grid gap-6 md:grid-cols-3">
        {APPS.map((a, i) => (
          <motion.article
            key={a.tag}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.1, duration: 0.7 }}
            className="group relative overflow-hidden rounded-lg bg-black"
          >
            <div className="relative aspect-[4/5]">
              <img
                src={a.img}
                alt={a.title}
                className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <span className="mb-3 inline-block rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">
                  {a.tag}
                </span>
                <h3 className="text-xl font-medium">{a.title}</h3>
                <p className="mt-2 text-sm text-white/80">{a.desc}</p>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  CORE ENGINEERING — tiles 07, 08, 09                                */
/* ------------------------------------------------------------------ */

function CoreEngineering() {
  const items = [
    {
      tag: "07",
      img: t07,
      title: "PIR Panel Cross Section",
      desc: "External steel sheet, engineered PIR closed-cell core, internal steel sheet — bonded in one continuous laminating pass.",
    },
    {
      tag: "08",
      img: t08,
      title: "Rock Wool Panel Cross Section",
      desc: "Perpendicular-fibre rock wool lamellas bonded to structural steel facings for A2 fire class and superior compressive strength.",
    },
    {
      tag: "09",
      img: t09,
      title: "Joint Detail — Wall Panel",
      desc: "Precision tongue-and-groove joint with pre-applied sealant — perfect sealing and heat-bridge prevention across every module.",
    },
  ];
  return (
    <Section id="engineering" className="bg-white">
      <SectionHeader
        eyebrow="Core Engineering"
        title="What's inside the panel is what defines its performance."
        lede="Every NEVO panel is engineered layer by layer — facing, core, adhesive and joint geometry — to deliver certified thermal, fire and structural behaviour over decades."
      />
      <div className="grid gap-8 md:grid-cols-3">
        {items.map((it) => (
          <SurfaceCard key={it.tag} className="overflow-hidden p-0">
            <div className="relative aspect-[4/3] bg-black">
              <img
                src={it.img}
                alt={it.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <span className="absolute top-4 left-4 rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">
                {it.tag}
              </span>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-foreground">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  SURFACE / THICKNESS / COLOR — tiles 10, 11, 12                     */
/* ------------------------------------------------------------------ */

function SurfaceOptions() {
  const items = [
    {
      tag: "10",
      img: t10,
      icon: Ruler,
      title: "Surface Profiles",
      desc: "Micro Rib · Mini Rib · Flat · Linear · Wave — five engineered facings for every architectural intent.",
    },
    {
      tag: "11",
      img: t11,
      icon: Layers,
      title: "Panel Thickness Options",
      desc: "40, 50, 60, 80, 100, 150 mm standard — custom up to 200 mm for cold storage and specialised envelopes.",
    },
    {
      tag: "12",
      img: t12,
      icon: Palette,
      title: "Colour Options",
      desc: "Full RAL range on PE, SMP, HDP and PVDF paint systems — stocked greys, blues, greens, reds and greens on request.",
    },
  ];
  return (
    <Section id="options" className="bg-secondary/40">
      <SectionHeader
        eyebrow="Configuration"
        title="Configured to your project — down to the millimetre."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {items.map(({ tag, img, icon: Icon, title, desc }) => (
          <SurfaceCard key={tag} className="overflow-hidden p-0">
            <div className="relative aspect-[16/9] bg-black">
              <img src={img} alt={title} className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute top-3 left-3 rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">
                {tag}
              </span>
            </div>
            <div className="p-6">
              <Icon className="size-5 text-accent" />
              <h3 className="mt-3 text-lg font-medium text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  PERFORMANCE — tiles 13, 14, 15, 16                                 */
/* ------------------------------------------------------------------ */

function Performance() {
  const items = [
    {
      tag: "13",
      img: t13,
      icon: Flame,
      title: "Fire Resistance",
      desc: "Rock wool core delivers non-combustible A2-s1,d0 fire performance.",
    },
    {
      tag: "14",
      img: t14,
      icon: Thermometer,
      title: "Thermal Insulation",
      desc: "PIR core provides ultra-low thermal conductivity — verified −20 °C to +20 °C.",
    },
    {
      tag: "15",
      img: t15,
      icon: Volume2,
      title: "Acoustic Performance",
      desc: "Rock wool core delivers high sound insulation for industrial and commercial buildings.",
    },
    {
      tag: "16",
      img: t16,
      icon: Droplets,
      title: "Water Tightness",
      desc: "Panel joints tested for driving-rain penetration — excellent sealing performance.",
    },
  ];
  return (
    <Section id="performance" className="bg-black text-white">
      <SectionHeader
        eyebrow="Certified Performance"
        title="Tested. Certified. Traceable."
        lede="Every NEVO panel specification is backed by third-party fire, thermal, acoustic and watertightness testing — with certificates issued per production batch."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ tag, img, icon: Icon, title, desc }, i) => (
          <motion.div
            key={tag}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.08, duration: 0.6 }}
            className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-black">
              <img
                src={img}
                alt={title}
                className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute top-3 left-3 rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">
                {tag}
              </span>
            </div>
            <div className="p-5">
              <Icon className="size-5 text-accent" />
              <h3 className="mt-3 text-base font-medium text-white">{title}</h3>
              <p className="mt-2 text-sm text-white/70">{desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  BUILDING TYPES — tiles 17, 18, 19, 20                              */
/* ------------------------------------------------------------------ */

function BuildingTypes() {
  const items = [
    {
      tag: "17",
      img: t17,
      icon: Factory,
      title: "Industrial Buildings",
      desc: "Manufacturing, logistics and warehousing envelopes with certified fire and thermal performance.",
    },
    {
      tag: "18",
      img: t18,
      icon: Building2,
      title: "Commercial Buildings",
      desc: "Showrooms, retail and office facades combining architectural design and engineered performance.",
    },
    {
      tag: "19",
      img: t19,
      icon: Warehouse,
      title: "Food Processing Facilities",
      desc: "Hygienic HACCP-compliant panels with food-grade coatings and sealed sanitary joints.",
    },
    {
      tag: "20",
      img: t20,
      icon: Snowflake,
      title: "Cold Rooms & Clean Rooms",
      desc: "Airtight cam-lock panels for low-temperature and controlled-environment applications.",
    },
  ];
  return (
    <Section id="buildings" className="bg-white">
      <SectionHeader
        eyebrow="Building Types"
        title="From industrial halls to –40 °C cold storage."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ tag, img, icon: Icon, title, desc }) => (
          <SurfaceCard key={tag} className="overflow-hidden p-0">
            <div className="relative aspect-[4/3] bg-black">
              <img src={img} alt={title} className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute top-3 left-3 rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">
                {tag}
              </span>
            </div>
            <div className="p-5">
              <Icon className="size-5 text-accent" />
              <h3 className="mt-3 text-base font-medium text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  CONSTRUCTION DETAILS — tiles 21, 22, 23, 24, 25                    */
/* ------------------------------------------------------------------ */

function ConstructionDetails() {
  const items = [
    {
      tag: "21",
      img: t21,
      title: "Corner Detail",
      desc: "Clean and precise finishing between wall panels.",
    },
    {
      tag: "22",
      img: t22,
      title: "Window Detail",
      desc: "Factory-made insulated window units matched to panel thickness.",
    },
    {
      tag: "23",
      img: t23,
      title: "Door Detail",
      desc: "Insulated personnel and service doors, certified to panel envelope.",
    },
    {
      tag: "24",
      img: t24,
      title: "Base Connection",
      desc: "Strong and secure base installation with EPDM sealing.",
    },
    {
      tag: "25",
      img: t25,
      title: "Fastening System",
      desc: "Hidden and visible options — engineered for load and aesthetics.",
    },
  ];
  return (
    <Section id="details" className="bg-secondary/40">
      <SectionHeader
        eyebrow="Construction Details"
        title="Every joint. Every edge. Engineered."
        lede="A high-performance envelope is only as reliable as its details. NEVO delivers a certified detail library for corners, openings, base fixings and every fastener."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((it) => (
          <SurfaceCard key={it.tag} className="overflow-hidden p-0">
            <div className="relative aspect-square bg-black">
              <img
                src={it.img}
                alt={it.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <span className="absolute top-3 left-3 rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">
                {it.tag}
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-medium text-foreground">{it.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{it.desc}</p>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  WHY NEVO PANELS — tile 26                                          */
/* ------------------------------------------------------------------ */

function WhyNevo() {
  const bullets = [
    "High-quality raw materials",
    "Advanced continuous production",
    "Strict quality control",
    "Excellent thermal performance",
    "Superior fire resistance",
    "Long-life durability",
    "Fast delivery & global supply",
    "Technical support & engineering",
  ];
  return (
    <Section id="why-nevo" className="bg-white">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl bg-black">
          <img
            src={t26}
            alt="Why NEVO Panels"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div>
          <Eyebrow>26 · Why NEVO Panels</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            The industrial standard for engineered panels.
          </h2>
          <p className="mt-5 max-w-xl text-muted-foreground">
            NEVO panels combine industrial-grade raw materials, continuous double-belt lamination
            and disciplined quality control — the same engineering ethos we deliver to
            factory-builders around the world.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-foreground">
                <Check className="mt-0.5 size-4 flex-none text-accent" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  TECHNICAL SPECIFICATIONS — tiles 27, 28                            */
/* ------------------------------------------------------------------ */

function TechSpecs() {
  const specs: [string, string][] = [
    ["Core Materials", "PIR / Rock Wool"],
    ["Panel Width", "1000 mm / 1150 mm (Effective)"],
    ["Panel Thickness", "40 – 150 mm"],
    ["Steel Thickness", "0.35 – 0.80 mm"],
    ["Coating Type", "PE / SMP / HDP / PVDF"],
    ["Fire Rating", "Up to 120 min (Rock Wool)"],
    ["Thermal Conductivity (PIR)", "0.022 – 0.024 W/m·K"],
    ["Thermal Conductivity (Rock Wool)", "0.036 – 0.040 W/m·K"],
    ["Density (Rock Wool)", "80 – 150 kg/m³"],
  ];
  return (
    <Section id="specs" className="bg-black text-white">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow className="text-white/60">27 · Technical Specifications</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight text-white md:text-5xl">
            Engineered to specification.
          </h2>
          <p className="mt-5 max-w-xl text-white/70">
            Every panel is manufactured to a locked technical envelope — with certificates, batch
            traceability and third-party testing behind every dimension.
          </p>
          <div className="mt-8 overflow-hidden rounded-lg border border-white/10">
            <table className="w-full font-mono text-sm">
              <tbody>
                {specs.map(([k, v], i) => (
                  <tr key={k} className={i % 2 ? "bg-white/[0.03]" : ""}>
                    <td className="border-b border-white/5 px-4 py-3 text-white/60">{k}</td>
                    <td className="border-b border-white/5 px-4 py-3 text-right text-white">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <Eyebrow className="text-white/60">28 · Panel Connection Systems</Eyebrow>
          <h3 className="mt-4 text-2xl font-medium text-white">Three joint systems.</h3>
          <p className="mt-2 text-white/70">
            Tongue &amp; Groove · EZ Lock · Hidden Screw — matched to structural, thermal and
            architectural intent.
          </p>
          <div className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
            <img
              src={t28}
              alt="NEVO panel connection systems"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  SUSTAINABILITY — tile 29                                           */
/* ------------------------------------------------------------------ */

function Sustainability() {
  return (
    <Section id="sustainability" className="bg-white">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Eyebrow>29 · Sustainability</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Eco-friendly materials.
            <br />
            Energy-efficient buildings.
          </h2>
          <p className="mt-5 max-w-xl text-muted-foreground">
            HFC-free PIR blowing agents, 100% recyclable rock wool, up to 30% recycled steel content
            and lifetime energy savings from certified thermal envelopes — NEVO panels are
            engineered for a sustainable industrial future.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-foreground">
            {[
              "HFC-free blowing agents",
              "100% recyclable rock wool core",
              "EPD & GWP declarations available",
              "Long-life durability = lower embodied carbon",
            ].map((b) => (
              <li key={b} className="flex items-start gap-3">
                <Leaf className="mt-0.5 size-4 flex-none text-accent" /> {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-black">
          <img
            src={t29}
            alt="Sustainability — NEVO panels"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  DOWNLOADS                                                          */
/* ------------------------------------------------------------------ */

function Downloads() {
  const docs = [
    {
      title: "Panel Product Catalogue",
      desc: "Complete PIR & Rock Wool panel range with specifications.",
    },
    {
      title: "Technical Datasheet — PIR Wall",
      desc: "Thermal, fire, structural and acoustic data.",
    },
    { title: "Technical Datasheet — PIR Roof", desc: "Load tables, span limits, weathering data." },
    {
      title: "Technical Datasheet — Rock Wool",
      desc: "Fire, acoustic, density and structural data.",
    },
    { title: "Installation Manual", desc: "Handling, fixing details, joint sealing and QA." },
    { title: "Detail Library (DWG / PDF)", desc: "Corners, openings, base and fastening details." },
  ];
  return (
    <Section id="downloads" className="bg-secondary/40">
      <SectionHeader eyebrow="Downloads" title="Technical documentation." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((d) => (
          <SurfaceCard key={d.title} className="flex h-full flex-col">
            <FileText className="size-5 text-accent" />
            <h3 className="mt-3 text-base font-medium text-foreground">{d.title}</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{d.desc}</p>
            <Button variant="ghost" className="mt-4 justify-start px-0" asChild>
              <a href="/project-inquiry">
                <Download className="mr-2 size-4" /> Request download
              </a>
            </Button>
          </SurfaceCard>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */

function FAQSection() {
  return (
    <Section id="faq" className="bg-white">
      <SectionHeader eyebrow="FAQ" title="Answers from NEVO's panel engineers." />
      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  INQUIRY FORM                                                       */
/* ------------------------------------------------------------------ */

function InquiryForm() {
  return (
    <Section id="inquiry" className="bg-black text-white">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <Eyebrow className="text-white/60">Panel Inquiry</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight text-white md:text-5xl">
            Request a technical proposal.
          </h2>
          <p className="mt-5 max-w-lg text-white/70">
            Share your project specifications and a NEVO panel specialist will reply within one
            business day with a technical and commercial proposal.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/70">
            {[
              { icon: Shield, t: "Certified fire, thermal and structural data" },
              { icon: Package, t: "Global delivery — DDP in select markets" },
              { icon: Wrench, t: "Installation support and site supervision" },
              { icon: Sparkles, t: "OEM / private-label supply available" },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-4 flex-none text-accent" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <form
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Thank you. A NEVO panel specialist will reply within one business day.");
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" name="company" required />
            <Field label="Country" name="country" required />
            <Field label="Full Name" name="name" required />
            <Field label="Email" name="email" type="email" required />
            <Field label="Panel Type" name="type" placeholder="PIR wall / Rock wool / Roof …" />
            <Field label="Thickness (mm)" name="thickness" placeholder="e.g. 100" />
            <Field label="Quantity (m²)" name="quantity" placeholder="e.g. 12,000" />
            <Field
              label="Application"
              name="application"
              placeholder="Industrial / Cold storage …"
            />
          </div>
          <Field label="Message" name="message" textarea className="mt-4" />
          <Button type="submit" size="lg" variant="primary" className="mt-6 w-full sm:w-auto">
            Submit inquiry <ArrowRight className="ml-2 size-4" />
          </Button>
        </form>
      </div>
    </Section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  textarea,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
  className?: string;
}) {
  const cls =
    "mt-2 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/60 focus:border-accent focus:outline-none";
  return (
    <label className={"block " + (className ?? "")}>
      <span className="text-xs font-mono uppercase tracking-widest text-white/60">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      {textarea ? (
        <textarea name={name} rows={4} placeholder={placeholder} className={cls} />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  FINAL CTA                                                          */
/* ------------------------------------------------------------------ */

function FinalCTA() {
  return (
    <Section className="bg-white">
      <div className="relative overflow-hidden rounded-2xl bg-black p-10 md:p-16 text-white">
        <div className="relative z-10 max-w-3xl">
          <Eyebrow className="text-white/60">Ready to Build</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            Premium panels for the world's most demanding envelopes.
          </h2>
          <p className="mt-5 max-w-2xl text-white/75">
            Engineered performance, certified data and reliable global supply — from Dubai to every
            industrial market where NEVO ships.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="primary" asChild>
              <a href="/project-inquiry">
                Request Panel Quotation <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#downloads">Download Datasheet</a>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
