import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Search,
  Download,
  Clock,
  BookOpen,
  FileText,
  Layers,
  Factory,
  FlaskConical,
  Flame,
  Shield,
  Cpu,
  Wrench,
  Leaf,
  Building2,
  Snowflake,
  UtensilsCrossed,
  Warehouse,
  Mail,
  ArrowUpRight,
  Ruler,
  Compass,
  Gauge,
} from "lucide-react";

// Row 01 — Engineering & Design
import k01 from "@/assets/knowledge/01_blueprint.jpg";
import k02 from "@/assets/knowledge/02_cad.jpg";
import k03 from "@/assets/knowledge/03_3d_factory.jpg";
import k04 from "@/assets/knowledge/04_meeting.jpg";
import k05 from "@/assets/knowledge/05_calculations.jpg";
// Row 02 — Production
import k06 from "@/assets/knowledge/06_production_line.jpg";
import k07 from "@/assets/knowledge/07_laminator.jpg";
import k08 from "@/assets/knowledge/08_roll_forming.jpg";
import k09 from "@/assets/knowledge/09_flying_saw.jpg";
import k10 from "@/assets/knowledge/10_stacking.jpg";
// Row 03 — Raw materials
import k11 from "@/assets/knowledge/11_ppgi.jpg";
import k12 from "@/assets/knowledge/12_gi.jpg";
import k13 from "@/assets/knowledge/13_aluzinc.jpg";
import k14 from "@/assets/knowledge/14_polyol.jpg";
import k15 from "@/assets/knowledge/15_mdi.jpg";
import k16 from "@/assets/knowledge/16_rockwool.jpg";
// Row 04 — Panels
import k17 from "@/assets/knowledge/17_pir_panel.jpg";
import k18 from "@/assets/knowledge/18_rockwool_panel.jpg";
import k19 from "@/assets/knowledge/19_roof_panel.jpg";
import k20 from "@/assets/knowledge/20_wall_panel.jpg";
import k21 from "@/assets/knowledge/21_coldroom_panel.jpg";
// Row 05 — Applications
import k22 from "@/assets/knowledge/22_cold_storage.jpg";
import k23 from "@/assets/knowledge/23_cleanroom.jpg";
import k24 from "@/assets/knowledge/24_food.jpg";
import k25 from "@/assets/knowledge/25_logistics.jpg";
import k26 from "@/assets/knowledge/26_industrial_bldg.jpg";
// Row 06 — Technical
import k27 from "@/assets/knowledge/27_cross_section.jpg";
import k28 from "@/assets/knowledge/28_fire_rating.jpg";
import k29 from "@/assets/knowledge/29_pir_vs_pur.jpg";
import k30 from "@/assets/knowledge/30_flow_diagram.jpg";
import k31 from "@/assets/knowledge/31_material_flow.jpg";
// Row 07 — Docs
import k32 from "@/assets/knowledge/32_datasheet.jpg";
import k33 from "@/assets/knowledge/33_layout.jpg";
import k34 from "@/assets/knowledge/34_pid.jpg";
import k35 from "@/assets/knowledge/35_spec_sheet.jpg";
import k36 from "@/assets/knowledge/36_investment_report.jpg";
import k37 from "@/assets/knowledge/37_checklist.jpg";
// Row 08 — Guides
import k38 from "@/assets/knowledge/38_factory_guide.jpg";
import k39 from "@/assets/knowledge/39_line_guide.jpg";
import k40 from "@/assets/knowledge/40_material_guide.jpg";
import k41 from "@/assets/knowledge/41_qc_guide.jpg";
import k42 from "@/assets/knowledge/42_maint_guide.jpg";
import k43 from "@/assets/knowledge/43_energy_guide.jpg";

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TITLE =
  "Knowledge Hub — Engineering Library for the Global Sandwich Panel Industry | NEVO Industrial";
const DESCRIPTION =
  "Technical articles, engineering guides, production expertise, raw material knowledge and industrial best practices developed by NEVO Engineering. The world's leading knowledge center for factory development, sandwich panel production and industrial envelopes.";
const URL_PATH = "/knowledge";

/* ------------------------------------------------------------------ */
/*  DATA                                                              */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { slug: "factory-development", label: "Factory Development", img: k03, count: 24 },
  { slug: "production-lines", label: "Production Lines", img: k06, count: 31 },
  { slug: "raw-materials", label: "Raw Materials", img: k11, count: 22 },
  { slug: "sandwich-panels", label: "Finished Sandwich Panels", img: k17, count: 28 },
  { slug: "engineering-consultancy", label: "Engineering Consultancy", img: k02, count: 19 },
  { slug: "automation", label: "Automation", img: k10, count: 14 },
  { slug: "factory-investment", label: "Factory Investment", img: k36, count: 11 },
  { slug: "factory-design", label: "Factory Design", img: k33, count: 17 },
  { slug: "quality-control", label: "Quality Control", img: k41, count: 15 },
  { slug: "energy-efficiency", label: "Energy Efficiency", img: k43, count: 12 },
  { slug: "fire-performance", label: "Fire Performance", img: k28, count: 10 },
  { slug: "installation", label: "Installation", img: k26, count: 13 },
  { slug: "maintenance", label: "Maintenance", img: k42, count: 9 },
  { slug: "industry-applications", label: "Industry Applications", img: k22, count: 26 },
  { slug: "market-insights", label: "Market Insights", img: k04, count: 8 },
];

const FEATURED = [
  {
    img: k03,
    category: "Factory Development",
    minutes: 14,
    title: "How to Plan a World-Class Sandwich Panel Factory from Zero to Commissioning",
    summary:
      "A complete engineering framework covering feasibility, capacity planning, layout, utilities, staffing and CAPEX — built from 40+ NEVO factory projects.",
    author: "NEVO Engineering Team",
    date: "May 12, 2026",
  },
  {
    img: k07,
    category: "Production Lines",
    minutes: 11,
    title: "Inside the Double-Belt Laminator: The Engineering Behind Continuous PIR Panels",
    summary:
      "Belt tension, chemical injection, temperature zones and thickness control — the four levers that separate premium panels from commodity ones.",
    author: "Process Engineering",
    date: "Apr 28, 2026",
  },
  {
    img: k29,
    category: "Raw Materials",
    minutes: 9,
    title: "PIR vs PUR: A Comparative Engineering Study for Sandwich Panel Cores",
    summary:
      "Thermal conductivity, fire behaviour, dimensional stability and cost — a side-by-side technical analysis with test data from real production runs.",
    author: "Materials Lab",
    date: "Apr 14, 2026",
  },
  {
    img: k22,
    category: "Cold Storage",
    minutes: 12,
    title: "Cold Storage Envelope Engineering: Panel Selection, Vapour Control and Detailing",
    summary:
      "Why 100 mm is never enough for -25°C rooms — and the joint, base and door details that decide whether your cold store performs for 20 years.",
    author: "Applications Engineering",
    date: "Mar 30, 2026",
  },
];

const LIBRARY = [
  { img: k01, tag: "01", label: "Factory Blueprints", desc: "Structural and architectural plans for panel production facilities." },
  { img: k02, tag: "02", label: "CAD Models", desc: "3D machinery, layout and building envelope models used in engineering reviews." },
  { img: k03, tag: "03", label: "3D Factory Models", desc: "Full-plant digital twins covering process, utilities and logistics." },
  { img: k04, tag: "04", label: "Engineering Meetings", desc: "Design reviews, DFMEA workshops and cross-discipline coordination." },
  { img: k05, tag: "05", label: "Technical Calculations", desc: "Thermal, structural, throughput and utility calculation sheets." },
  { img: k33, tag: "06", label: "Factory Layouts", desc: "Optimised material flow layouts for continuous panel production." },
  { img: k31, tag: "07", label: "Material Flow Diagrams", desc: "Steel, foam core, adhesive and packaging flow across the plant." },
  { img: k34, tag: "08", label: "P&ID Drawings", desc: "Instrumentation and control diagrams for chemical and utility systems." },
  { img: k30, tag: "09", label: "Process Engineering", desc: "Line balancing, cycle time analysis and process optimisation studies." },
  { img: k35, tag: "10", label: "Equipment Specifications", desc: "Machine datasheets and engineering specification sheets." },
];

const PRODUCTION = [
  { img: k06, title: "Continuous Production Line", body: "The backbone of high-volume panel manufacturing — synchronised uncoiling, forming, injection, lamination and cutting on a single continuous belt." },
  { img: k07, title: "Double-Belt Laminator", body: "Precision heat and pressure zones cure the core while bonding facings — the single machine that defines panel quality and dimensional stability." },
  { img: k08, title: "Roll Forming Section", body: "Multi-stage roll stations profile PPGI/GI facings into trapezoidal, box or micro-rib geometries with tight tolerance control." },
  { img: k09, title: "Flying Saw", body: "In-line synchronous cutting delivers dimensional accuracy at production speed — no line stop, no length variance." },
  { img: k10, title: "Automatic Stacking", body: "Robotic stacking with protective interleaves handles finished panels safely and prepares them for packaging and dispatch." },
];

const MATERIALS = [
  { img: k11, title: "PPGI Steel Coils", body: "Pre-painted galvanised steel — the industry standard for coloured, weather-resistant panel facings with PVDF, PE or HDP coatings." },
  { img: k12, title: "GI Steel Coils", body: "Hot-dip galvanised steel used where zinc-only corrosion protection is specified — a base for many downstream coating systems." },
  { img: k13, title: "Aluzinc Coils", body: "55% Al / 43.4% Zn coating delivering superior corrosion resistance and heat reflectivity for demanding environments." },
  { img: k14, title: "PIR Polyol", body: "Engineered polyol blends optimised for thermal conductivity, dimensional stability and reaction-to-fire performance." },
  { img: k15, title: "MDI Isocyanate", body: "The reactive counterpart in PIR chemistry — precise dosing and temperature control determine core density and closed-cell content." },
  { img: k16, title: "Rock Wool Slabs", body: "Non-combustible A1-classified mineral wool cores engineered for lamella orientation, density and compressive strength." },
];

const PANELS = [
  { img: k17, title: "PIR Sandwich Panels", body: "The benchmark for thermal performance — low λ, high strength-to-weight and consistent geometry for industrial and cold-chain envelopes." },
  { img: k18, title: "Rock Wool Panels", body: "A1 fire-classified non-combustible cores for facilities with the most demanding fire, acoustic and durability requirements." },
  { img: k19, title: "Roof Panels", body: "Trapezoidal profiles engineered for span, water tightness, PV integration and long-term structural performance." },
  { img: k20, title: "Wall Panels", body: "Concealed and visible fastening systems for façades that combine thermal, aesthetic and airtightness requirements." },
  { img: k21, title: "Cold Room Panels", body: "Cam-lock and tongue-and-groove systems engineered for tight thermal seals in temperature-controlled environments." },
];

const APPLICATIONS = [
  { img: k22, title: "Cold Storage", icon: Snowflake, body: "Panel thickness, vapour barriers and thermal-bridge-free detailing engineered for continuous sub-zero operation." },
  { img: k23, title: "Clean Rooms", icon: FlaskConical, body: "Hygienic flush joints, coved skirtings and controlled surface energy for ISO 14644 environments." },
  { img: k24, title: "Food Processing", icon: UtensilsCrossed, body: "Washdown-ready panel systems with antimicrobial coatings and full traceability." },
  { img: k26, title: "Industrial Buildings", icon: Factory, body: "Long-span, high-durability envelopes engineered for heavy industry and challenging climates." },
  { img: k25, title: "Warehouses & Logistics", icon: Warehouse, body: "Rapid-build systems balancing thermal performance, dock detailing and total cost of ownership." },
  { img: k26, title: "Commercial Buildings", icon: Building2, body: "Architectural façades combining sandwich panel engineering with premium finishes." },
];

const COMPARISONS = [
  { img: k28, title: "Fire Rating Comparison", body: "How PIR (B-s2,d0) and Rock Wool (A1) systems behave under standardised fire tests and where each is specified." },
  { img: k29, title: "PIR vs PUR Study", body: "Head-to-head comparison across thermal, fire, moisture, dimensional stability and cost efficiency." },
  { img: k27, title: "Panel Cross-Sections", body: "Layer-by-layer breakdown of facings, adhesives and cores — the anatomy of an engineered panel." },
  { img: k30, title: "Factory Flow Diagram", body: "End-to-end material and product flow from raw coil to warehouse dispatch." },
  { img: k31, title: "Material Flow Illustration", body: "Coil, coating, forming, core injection, lamination, cutting and stacking — visualised as one continuous flow." },
];

const DOWNLOADS = [
  { img: k38, title: "Factory Investment Guide", size: "PDF · 4.2 MB", desc: "CAPEX, ROI, layout and staffing models for greenfield sandwich panel factories." },
  { img: k39, title: "Production Line Guide", size: "PDF · 3.6 MB", desc: "Line configurations, capacities and engineering parameters explained." },
  { img: k40, title: "Material Selection Guide", size: "PDF · 2.9 MB", desc: "How to select facings, cores and adhesives for each industry and climate." },
  { img: k41, title: "Quality Control Guide", size: "PDF · 3.1 MB", desc: "IPQC, FPQC and lab testing frameworks for continuous panel manufacturing." },
  { img: k42, title: "Maintenance Guide", size: "PDF · 2.4 MB", desc: "Preventive and predictive maintenance for laminators, roll formers and cutting systems." },
  { img: k43, title: "Energy Efficiency Guide", size: "PDF · 2.7 MB", desc: "Reducing kWh per m² of panel through process, insulation and heat recovery." },
];

const DOCUMENTS = [
  { img: k32, title: "Technical Datasheets" },
  { img: k33, title: "Factory Layout Plans" },
  { img: k34, title: "P&ID Diagrams" },
  { img: k35, title: "Equipment Spec Sheets" },
  { img: k36, title: "Investment Reports" },
  { img: k37, title: "Engineering Checklists" },
];

const FAQS = [
  { q: "What is the NEVO Knowledge Hub?", a: "An engineering-first knowledge platform covering factory development, production lines, raw materials, finished panels and industrial applications — written by the NEVO Engineering Team." },
  { q: "Is the content free to access?", a: "Yes. All articles, technical explainers and diagrams are freely accessible. Downloadable guides require a short form so we can send updates and revisions." },
  { q: "Who writes the articles?", a: "Practicing engineers from NEVO's factory development, process, materials and applications teams — not marketers." },
  { q: "How often is new content published?", a: "Every week. Major engineering guides and technical studies are published monthly." },
  { q: "Can I request a topic?", a: "Yes. Use the newsletter form or contact an engineer — topic requests from industry professionals are prioritised." },
  { q: "Do you cite sources for technical claims?", a: "Yes. Test data is referenced to standards (EN 14509, ISO 8990, EN 13501, ASTM E84) and internal QA reports where relevant." },
  { q: "Can I reference NEVO articles in my own reports?", a: "Yes, with attribution. Reach out for high-resolution diagrams or extended data tables." },
  { q: "Do you offer engineering consultation beyond articles?", a: "Yes. Every article links to the relevant NEVO service — factory development, production line engineering, raw material supply or panel engineering." },
];

/* ------------------------------------------------------------------ */
/*  ROUTE                                                              */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/knowledge")({
  head: () => {
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
        { "@type": "ListItem", position: 1, name: "Home", item: "/" },
        { "@type": "ListItem", position: 2, name: "Knowledge Hub", item: URL_PATH },
      ],
    };
    const collectionLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "NEVO Industrial Knowledge Hub",
      description: DESCRIPTION,
      url: URL_PATH,
      isPartOf: { "@type": "WebSite", name: "NEVO Industrial" },
    };
    return {
      meta: [
        { title: TITLE },
        { name: "description", content: DESCRIPTION },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:url", content: URL_PATH },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: URL_PATH }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(faqLd) },
        { type: "application/ld+json", children: JSON.stringify(crumbsLd) },
        { type: "application/ld+json", children: JSON.stringify(collectionLd) },
      ],
    };
  },
  component: KnowledgePage,
});

function KnowledgePage() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main">
        <Hero />
        <SearchBar />
        <FeaturedCategories />
        <FeaturedArticles />
        <EngineeringLibrary />
        <ProductionKnowledge />
        <MaterialKnowledge />
        <PanelKnowledge />
        <ApplicationKnowledge />
        <TechnicalComparisons />
        <DownloadCenter />
        <DocumentsStrip />
        <Newsletter />
        <FAQSection />
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
          src={k03}
          alt="NEVO 3D factory model — engineering knowledge visualisation"
          className="h-full w-full object-cover"
          style={{ transform: "scale(1.05)" }}
          fetchPriority="high"
        />
        <div aria-hidden className="absolute inset-0 bg-black/70" />
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-[75%]"
          style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.82) 55%, rgba(0,0,0,0.35) 100%)" }}
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/85 to-transparent" />
      </div>

      <div className="container-wide relative flex min-h-[80vh] flex-col justify-between px-6 pt-36 pb-16 lg:min-h-[92vh] lg:px-8 lg:pt-44">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
          className="max-w-4xl"
        >
          <div className="eyebrow mb-6 flex items-center gap-2 text-white/70">
            <span className="inline-flex size-1.5 rounded-full bg-accent" />
            Knowledge Hub
          </div>
          <h1 className="text-display text-balance text-white">
            Engineering Knowledge for the <span className="text-accent">Global Sandwich Panel Industry.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
            Technical articles, engineering guides, production expertise, raw material
            knowledge and industrial best practices — developed by NEVO Engineering.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button size="lg" variant="primary" asChild>
              <a href="#categories">
                Browse Knowledge Hub <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#downloads">
                Download Engineering Resources <Download className="ml-2 size-4" />
              </a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-12 grid max-w-4xl grid-cols-2 gap-x-8 gap-y-4 border-t border-white/10 pt-8 md:grid-cols-4"
        >
          {[
            { k: "260+", v: "Technical articles" },
            { k: "43", v: "Engineering resources" },
            { k: "15", v: "Knowledge categories" },
            { k: "40+", v: "Countries reading" },
          ].map((s) => (
            <div key={s.v}>
              <div className="text-3xl font-medium text-white">{s.k}</div>
              <div className="mt-1 text-xs font-mono uppercase tracking-widest text-white/55">{s.v}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SEARCH                                                             */
/* ------------------------------------------------------------------ */
function SearchBar() {
  const [q, setQ] = useState("");
  const suggestions = useMemo(() => {
    const pool = [
      ...FEATURED.map((f) => f.title),
      ...CATEGORIES.map((c) => c.label),
      ...LIBRARY.map((l) => l.label),
      ...DOWNLOADS.map((d) => d.title),
    ];
    if (!q.trim()) return [];
    const s = q.toLowerCase();
    return pool.filter((p) => p.toLowerCase().includes(s)).slice(0, 6);
  }, [q]);

  return (
    <Section className="bg-white pt-16 md:pt-20">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>Search the Knowledge Hub</Eyebrow>
        <div className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-black/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search articles, downloads, guides, technical documents & FAQs…"
            className="w-full rounded-full border border-black/10 bg-white py-4 pl-12 pr-6 text-base shadow-sm focus:border-accent focus:outline-none"
          />
          {suggestions.length > 0 && (
            <div className="absolute inset-x-0 top-full mt-2 rounded-xl border border-black/10 bg-white p-2 shadow-xl">
              {suggestions.map((s) => (
                <div key={s} className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-black/5">
                  <span className="text-black/40 mr-2">→</span>{s}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-mono uppercase tracking-widest text-black/55">
          {["Articles", "Downloads", "Guides", "Technical Docs", "FAQs"].map((t) => (
            <span key={t} className="rounded-full border border-black/10 px-3 py-1">{t}</span>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  FEATURED CATEGORIES                                                */
/* ------------------------------------------------------------------ */
function FeaturedCategories() {
  return (
    <Section id="categories" className="bg-white">
      <SectionHeader
        eyebrow="Featured Categories"
        title="Fifteen engineering pillars. One knowledge platform."
        lede="Browse structured knowledge across every discipline of sandwich panel engineering — from raw material chemistry to complete factory development."
      />
      <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((c, i) => (
          <motion.a
            key={c.slug}
            href={`#${c.slug}`}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: (i % 5) * 0.05 }}
            className="group relative overflow-hidden rounded-2xl bg-black"
          >
            <div className="aspect-[4/5] overflow-hidden">
              <img src={c.img} alt={c.label} className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-accent">{c.count} articles</div>
              <div className="mt-1 text-sm font-medium leading-tight text-white">{c.label}</div>
            </div>
            <ArrowUpRight className="absolute right-3 top-3 size-4 text-white/70 transition group-hover:text-accent" />
          </motion.a>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  FEATURED ARTICLES                                                  */
/* ------------------------------------------------------------------ */
function FeaturedArticles() {
  return (
    <Section className="bg-[#f6f6f4]">
      <SectionHeader
        eyebrow="Featured Articles"
        title="Editorial engineering journalism."
        lede="Long-form technical writing by NEVO engineers — the kind of material you'd expect from Siemens, ABB or McKinsey, focused on the sandwich panel industry."
      />
      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        {FEATURED.map((a, i) => (
          <motion.article
            key={a.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-xl"
          >
            <div className="aspect-[16/9] overflow-hidden">
              <img src={a.img} alt={a.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
            </div>
            <div className="p-7 md:p-9">
              <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-black/55">
                <span className="text-accent">{a.category}</span>
                <span className="text-black/20">•</span>
                <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {a.minutes} min read</span>
              </div>
              <h3 className="mt-4 text-2xl font-medium tracking-tight text-black md:text-[26px]">
                {a.title}
              </h3>
              <p className="mt-3 text-black/70">{a.summary}</p>
              <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4">
                <div className="text-xs text-black/55">
                  <span className="font-medium text-black/80">{a.author}</span> — {a.date}
                </div>
                <a href="#" className="inline-flex items-center gap-1 text-sm font-medium text-black hover:text-accent">
                  Continue reading <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  ENGINEERING LIBRARY                                                */
/* ------------------------------------------------------------------ */
function EngineeringLibrary() {
  return (
    <Section id="factory-design" className="bg-black text-white">
      <SectionHeader
        eyebrow="Engineering Library"
        title="Blueprints, models, calculations, drawings."
        lede="The visual and technical foundation behind every NEVO project — organised as an open engineering reference."
        invert
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {LIBRARY.map((l, i) => (
          <motion.div
            key={l.tag}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: (i % 5) * 0.05 }}
            className="group overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10 transition hover:ring-accent/40"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img src={l.img} alt={l.label} className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
            </div>
            <div className="p-5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-accent">{l.tag}</div>
              <div className="mt-1 text-base font-medium">{l.label}</div>
              <p className="mt-2 text-sm text-white/65">{l.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  PRODUCTION KNOWLEDGE                                               */
/* ------------------------------------------------------------------ */
function ProductionKnowledge() {
  return (
    <Section id="production-lines" className="bg-white">
      <SectionHeader
        eyebrow="Production Knowledge"
        title="Every manufacturing stage, explained."
        lede="From coil uncoiling to stacking — the engineering behind a continuous sandwich panel line."
      />
      <div className="mt-14 space-y-6">
        {PRODUCTION.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className={"group grid overflow-hidden rounded-3xl bg-[#f6f6f4] ring-1 ring-black/5 md:grid-cols-2 " + (i % 2 ? "md:[&>div:first-child]:order-2" : "")}
          >
            <div className="aspect-[16/10] overflow-hidden md:aspect-auto">
              <img src={p.img} alt={p.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
            </div>
            <div className="flex flex-col justify-center p-8 md:p-12">
              <div className="text-xs font-mono uppercase tracking-widest text-accent">Stage {String(i + 1).padStart(2, "0")}</div>
              <h3 className="mt-3 text-2xl font-medium tracking-tight md:text-3xl">{p.title}</h3>
              <p className="mt-4 text-black/70">{p.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  RAW MATERIAL KNOWLEDGE                                             */
/* ------------------------------------------------------------------ */
function MaterialKnowledge() {
  return (
    <Section id="raw-materials" className="bg-[#f6f6f4]">
      <SectionHeader
        eyebrow="Raw Material Knowledge"
        title="The chemistry and metallurgy behind every panel."
        lede="Engineering considerations for the six raw materials that decide panel performance."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MATERIALS.map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.05 }}
            className="group overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 transition hover:shadow-xl"
          >
            <div className="aspect-[4/3] overflow-hidden bg-black">
              <img src={m.img} alt={m.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium">{m.title}</h3>
              <p className="mt-2 text-sm text-black/65">{m.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  PANEL KNOWLEDGE                                                    */
/* ------------------------------------------------------------------ */
function PanelKnowledge() {
  return (
    <Section id="sandwich-panels" className="bg-white">
      <SectionHeader
        eyebrow="Finished Panel Knowledge"
        title="Applications and engineering advantages."
        lede="Where each panel system belongs — and why."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PANELS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.05 }}
            className="group overflow-hidden rounded-2xl bg-[#f6f6f4] ring-1 ring-black/5 transition hover:shadow-xl"
          >
            <div className="aspect-[4/3] overflow-hidden bg-black">
              <img src={p.img} alt={p.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium">{p.title}</h3>
              <p className="mt-2 text-sm text-black/65">{p.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  APPLICATION KNOWLEDGE                                              */
/* ------------------------------------------------------------------ */
function ApplicationKnowledge() {
  return (
    <Section id="industry-applications" className="bg-black text-white">
      <SectionHeader
        eyebrow="Application Knowledge"
        title="Engineering requirements per sector."
        lede="Every industry has its own envelope, hygiene, thermal and fire logic. Here's how we engineer for each."
        invert
      />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {APPLICATIONS.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.05 }}
            className="group overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10 transition hover:ring-accent/40"
          >
            <div className="aspect-[16/10] overflow-hidden">
              <img src={a.img} alt={a.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <a.icon className="size-4 text-accent" />
                <h3 className="text-lg font-medium">{a.title}</h3>
              </div>
              <p className="mt-2 text-sm text-white/65">{a.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  TECHNICAL COMPARISONS                                              */
/* ------------------------------------------------------------------ */
function TechnicalComparisons() {
  return (
    <Section id="fire-performance" className="bg-white">
      <SectionHeader
        eyebrow="Technical Comparisons"
        title="Diagrams that make engineering decisions easier."
        lede="Educational resources built from real production and test data."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {COMPARISONS.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.05 }}
            className="group overflow-hidden rounded-2xl bg-black text-white ring-1 ring-black/5 transition hover:shadow-xl"
          >
            <div className="aspect-[16/10] overflow-hidden bg-black">
              <img src={c.img} alt={c.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium">{c.title}</h3>
              <p className="mt-2 text-sm text-white/70">{c.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  DOWNLOAD CENTER                                                    */
/* ------------------------------------------------------------------ */
function DownloadCenter() {
  return (
    <Section id="downloads" className="bg-[#f6f6f4]">
      <SectionHeader
        eyebrow="Download Center"
        title="Premium engineering guides."
        lede="Six flagship guides distilling decades of NEVO engineering experience into practical, downloadable resources."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {DOWNLOADS.map((d, i) => (
          <motion.div
            key={d.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.05 }}
            className="group overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 transition hover:shadow-xl"
          >
            <div className="aspect-[4/3] overflow-hidden bg-black">
              <img src={d.img} alt={d.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
            </div>
            <div className="p-6">
              <div className="text-[10px] font-mono uppercase tracking-widest text-black/50">{d.size}</div>
              <h3 className="mt-2 text-lg font-medium">{d.title}</h3>
              <p className="mt-2 text-sm text-black/65">{d.desc}</p>
              <Button variant="secondary" size="sm" className="mt-5" asChild>
                <a href="#"><Download className="mr-2 size-4" /> Download PDF</a>
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  DOCUMENTS STRIP                                                    */
/* ------------------------------------------------------------------ */
function DocumentsStrip() {
  return (
    <Section id="quality-control" className="bg-white">
      <SectionHeader
        eyebrow="Technical Documents"
        title="Datasheets, layouts, P&IDs, spec sheets."
        lede="A reference library covering the documentation used across every NEVO project."
      />
      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {DOCUMENTS.map((d) => (
          <a
            key={d.title}
            href="#"
            className="group overflow-hidden rounded-xl bg-[#f6f6f4] ring-1 ring-black/5 transition hover:ring-accent/50"
          >
            <div className="aspect-[4/3] overflow-hidden bg-black">
              <img src={d.img} alt={d.title} className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-100" />
            </div>
            <div className="p-3">
              <div className="text-xs font-medium">{d.title}</div>
              <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-black/55">
                <FileText className="size-3" /> Reference
              </div>
            </div>
          </a>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  NEWSLETTER                                                         */
/* ------------------------------------------------------------------ */
function Newsletter() {
  return (
    <Section className="bg-white">
      <div className="relative overflow-hidden rounded-3xl bg-black p-10 md:p-16 text-white">
        <div aria-hidden className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(60% 60% at 80% 20%, rgba(16,185,129,0.25), transparent 70%)" }} />
        <div className="relative grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <Eyebrow className="text-white/60">Newsletter</Eyebrow>
            <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">Receive Engineering Insights.</h2>
            <p className="mt-5 max-w-xl text-white/75">
              Monthly technical articles, engineering guides and factory planning resources —
              written by the NEVO Engineering Team.
            </p>
          </div>
          <form className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/50" />
              <input
                type="email"
                required
                placeholder="Your work email"
                className="w-full rounded-full border border-white/15 bg-white/[0.05] py-3.5 pl-11 pr-5 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none"
              />
            </div>
            <Button type="submit" size="lg" variant="primary">
              Subscribe <ArrowRight className="ml-2 size-4" />
            </Button>
          </form>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */
function FAQSection() {
  return (
    <Section className="bg-[#f6f6f4]">
      <SectionHeader eyebrow="Knowledge Hub FAQs" title="How the NEVO Knowledge Hub works." />
      <div className="mx-auto mt-10 max-w-3xl">
        <Accordion type="single" collapsible>
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`f-${i}`}>
              <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
              <AccordionContent className="text-black/70">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
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
          <Eyebrow className="text-white/60">Engineering First</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            Knowledge creates better <span className="text-accent">engineering decisions.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-white/75">
            Explore technical resources, engineering expertise and industrial insights
            developed by the NEVO Engineering Team.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="primary" asChild>
              <a href="#categories">Browse Engineering Articles <ArrowRight className="ml-2 size-4" /></a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#">Talk to an Engineer</a>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
