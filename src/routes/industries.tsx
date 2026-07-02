import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  Snowflake,
  FlaskConical,
  UtensilsCrossed,
  Factory,
  Warehouse,
  Building2,
  Wheat,
  Container,
  Server,
  ShoppingBag,
  Trophy,
  Plane,
  Compass,
  ClipboardList,
  Layers,
  Cpu,
  Wrench,
  LifeBuoy,
  Shield,
  Leaf,
  Globe2,
  ArrowUpRight,
} from "lucide-react";

// 12 industry tiles + 6 applications + 5 panels
import t01 from "@/assets/industries/tile-01.jpg";
import t02 from "@/assets/industries/tile-02.jpg";
import t03 from "@/assets/industries/tile-03.jpg";
import t04 from "@/assets/industries/tile-04.jpg";
import t05 from "@/assets/industries/tile-05.jpg";
import t06 from "@/assets/industries/tile-06.jpg";
import t07 from "@/assets/industries/tile-07.jpg";
import t08 from "@/assets/industries/tile-08.jpg";
import t09 from "@/assets/industries/tile-09.jpg";
import t10 from "@/assets/industries/tile-10.jpg";
import t11 from "@/assets/industries/tile-11.jpg";
import t12 from "@/assets/industries/tile-12.jpg";
import t13 from "@/assets/industries/tile-13.jpg";
import t14 from "@/assets/industries/tile-14.jpg";
import t15 from "@/assets/industries/tile-15.jpg";
import t16 from "@/assets/industries/tile-16.jpg";
import t17 from "@/assets/industries/tile-17.jpg";
import t18 from "@/assets/industries/tile-18.jpg";
import t19 from "@/assets/industries/tile-19.jpg";
import t20 from "@/assets/industries/tile-20.jpg";
import t21 from "@/assets/industries/tile-21.jpg";
import t22 from "@/assets/industries/tile-22.jpg";
import t23 from "@/assets/industries/tile-23.jpg";

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { SurfaceCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TITLE =
  "Industries We Engineer For — Cold Storage, Clean Rooms, Food, Logistics | NEVO Industrial";
const DESCRIPTION =
  "Engineering-led sandwich panel and factory solutions for 12+ industries: cold storage, clean rooms, food & pharma, industrial, warehouses, commercial, agriculture, modular, data centers, retail, sports and transport. NEVO Industrial, Dubai.";
const URL_PATH = "/industries";

const INDUSTRIES = [
  {
    slug: "cold-storage",
    tag: "01",
    img: t01,
    icon: Snowflake,
    title: "Cold Storage Facilities",
    desc: "Airtight low-temperature envelopes for logistics hubs, distribution centers and –40 °C freezer stores.",
    apps: ["Frozen distribution", "Chilled logistics", "Blast freezers"],
    panel: "PIR — 100–200 mm, cam-lock joints",
  },
  {
    slug: "clean-rooms",
    tag: "02",
    img: t02,
    icon: FlaskConical,
    title: "Clean Rooms & Pharma Facilities",
    desc: "ISO-classified environments with hygienic flush-finish panels and controlled airtightness.",
    apps: ["Pharmaceutical suites", "Semiconductor fabs", "Hospital OR"],
    panel: "Clean Room Panel — flush face, PIR/Rock Wool core",
  },
  {
    slug: "food-processing",
    tag: "03",
    img: t03,
    icon: UtensilsCrossed,
    title: "Food Processing Plants",
    desc: "HACCP-compliant hygienic envelopes with food-grade coatings and sealed sanitary joints.",
    apps: ["Meat & poultry", "Dairy", "Bakery", "Beverage"],
    panel: "PIR / Rock Wool — HDP food-grade facing",
  },
  {
    slug: "industrial-buildings",
    tag: "04",
    img: t04,
    icon: Factory,
    title: "Industrial Buildings",
    desc: "Manufacturing halls, workshops and heavy-industry envelopes with engineered fire and structural performance.",
    apps: ["Manufacturing", "Heavy industry", "Assembly plants"],
    panel: "PIR / Rock Wool — 80–150 mm structural",
  },
  {
    slug: "warehouses-logistics",
    tag: "05",
    img: t05,
    icon: Warehouse,
    title: "Warehouses & Logistics Centers",
    desc: "Large-span envelopes for distribution, e-commerce and freight hubs — fast assembly, low lifecycle cost.",
    apps: ["Distribution", "E-commerce fulfilment", "Freight terminals"],
    panel: "PIR wall + PIR/Rock Wool roof",
  },
  {
    slug: "commercial-buildings",
    tag: "06",
    img: t06,
    icon: Building2,
    title: "Commercial Buildings",
    desc: "Showrooms, retail and office facades combining architectural design and engineered performance.",
    apps: ["Showrooms", "Offices", "Retail"],
    panel: "Hidden-fix PIR facade + insulated glass",
  },
  {
    slug: "agricultural-buildings",
    tag: "07",
    img: t07,
    icon: Wheat,
    title: "Agricultural Buildings",
    desc: "Livestock, storage and agro-industrial envelopes engineered for humidity, ammonia and long spans.",
    apps: ["Livestock", "Grain storage", "Agro-processing"],
    panel: "PIR — corrosion-resistant PVDF facing",
  },
  {
    slug: "modular-buildings",
    tag: "08",
    img: t08,
    icon: Container,
    title: "Modular Buildings",
    desc: "Prefabricated modular systems for offices, camps and site accommodation — factory built, site assembled.",
    apps: ["Site offices", "Worker accommodation", "Prefab clinics"],
    panel: "PIR — 50–80 mm lightweight",
  },
  {
    slug: "data-centers",
    tag: "09",
    img: t09,
    icon: Server,
    title: "Data Centers",
    desc: "Non-combustible envelopes with EMI-shielded finishes and stringent fire compartmentation.",
    apps: ["Hyperscale halls", "Edge data centers", "Modular pods"],
    panel: "Rock Wool — 120–150 mm A2 fire class",
  },
  {
    slug: "retail-supermarkets",
    tag: "10",
    img: t10,
    icon: ShoppingBag,
    title: "Retail & Supermarkets",
    desc: "Retail envelopes combining thermal comfort, fast build and integrated cold-storage back-of-house.",
    apps: ["Supermarkets", "Big-box retail", "DIY stores"],
    panel: "PIR facade + integrated cold rooms",
  },
  {
    slug: "sports-recreation",
    tag: "11",
    img: t11,
    icon: Trophy,
    title: "Sports & Recreation Facilities",
    desc: "Long-span sports halls, arenas and ice rinks with engineered acoustic and thermal envelopes.",
    apps: ["Sports halls", "Ice rinks", "Indoor arenas"],
    panel: "Rock Wool — acoustic Rw 32+ dB",
  },
  {
    slug: "airport-transport",
    tag: "12",
    img: t12,
    icon: Plane,
    title: "Airport & Transport Facilities",
    desc: "Terminals, hangars and MRO facilities engineered for fire, security and long-span roof structures.",
    apps: ["Terminals", "Hangars", "MRO facilities"],
    panel: "Rock Wool + PIR — certified fire/thermal",
  },
];

const APPLICATIONS = [
  { tag: "13", img: t13, title: "Refrigerated Warehouses", note: "Continuous cold chain with PIR panels and vapour-tight joints." },
  { tag: "14", img: t14, title: "Freezer Rooms", note: "–25 to –40 °C envelopes with cam-lock joints and heated door frames." },
  { tag: "15", img: t15, title: "Meat & Poultry Processing", note: "Food-grade coatings, sealed sanitary joints, washdown-resistant surfaces." },
  { tag: "16", img: t16, title: "Dairy & Beverage Plants", note: "Hygienic envelopes engineered for CIP, humidity and thermal shock." },
  { tag: "17", img: t17, title: "Bakery & Food Production", note: "Fire-classified panels near ovens, hygienic panels on process lines." },
  { tag: "18", img: t18, title: "Pharmaceutical Production", note: "ISO 5–8 clean rooms with flush-finish panels and controlled leakage." },
];

const PANELS = [
  { tag: "19", img: t19, title: "PIR Wall Panel", where: "Industrial, cold storage, food, logistics." },
  { tag: "20", img: t20, title: "PIR Roof Panel", where: "Long-span roofs — logistics, industrial, commercial." },
  { tag: "21", img: t21, title: "Rock Wool Wall Panel", where: "Fire-critical envelopes — data centers, transport, industrial." },
  { tag: "22", img: t22, title: "Rock Wool Roof Panel", where: "Acoustic and fire-critical roofing." },
  { tag: "23", img: t23, title: "Clean Room Panel", where: "Pharma, hospital, semiconductor, food process rooms." },
];

const ENGINEERING = [
  { icon: Compass, title: "Feasibility Study & Concept Design", desc: "Tailored solutions for your industry needs." },
  { icon: ClipboardList, title: "Factory Planning & Layout", desc: "Optimised layouts for maximum efficiency." },
  { icon: Layers, title: "Material Selection & Engineering", desc: "Right materials for long-term performance." },
  { icon: Factory, title: "Production Line Integration", desc: "Seamless integration with manufacturing systems." },
  { icon: Cpu, title: "Automation & Smart Control", desc: "Advanced automation for higher productivity." },
  { icon: LifeBuoy, title: "Commissioning & After-Sales", desc: "Complete support through the entire lifecycle." },
  { icon: Wrench, title: "Long-Term Technical Support", desc: "Engineering partnership after handover." },
];

const WHY = [
  "Industry-specific engineering expertise",
  "Optimised technical solutions",
  "Premium materials & global sourcing",
  "End-to-end project management",
  "Global standards & certifications",
  "Quality assurance on every batch",
  "Technical consultancy included",
  "Long-term partnership approach",
];

const CASE_STUDIES = [
  { title: "Cold Storage — 25,000 m²", loc: "GCC", industry: "Cold Storage" },
  { title: "Meat Processing Plant", loc: "East Africa", industry: "Food Processing" },
  { title: "E-commerce Warehouse", loc: "Levant", industry: "Warehouse" },
  { title: "Automotive Assembly", loc: "North Africa", industry: "Industrial Plant" },
  { title: "Corporate HQ Facade", loc: "UAE", industry: "Commercial" },
  { title: "Pharma Clean Room Suite", loc: "South Asia", industry: "Clean Room" },
];

const DOWNLOADS = [
  { title: "Industry Capability Brochure", desc: "NEVO's full industry-by-industry engineering capabilities." },
  { title: "Cold Storage Design Guide", desc: "Panel selection, thickness, joints and vapour control." },
  { title: "Clean Room Guide", desc: "ISO class selection, panel systems and airtightness." },
  { title: "Food Processing Guide", desc: "HACCP-compliant envelopes and hygienic detailing." },
  { title: "Warehouse & Logistics Guide", desc: "Long-span roofs, wall systems and lifecycle economics." },
  { title: "Panel Selection Guide", desc: "Choosing PIR, Rock Wool or Clean Room panels by industry." },
];

const FAQS: { q: string; a: string }[] = [
  { q: "Which panel is best for cold storage?", a: "PIR sandwich panels 100–200 mm thick with cam-lock joints and vapour-tight sealing. PIR delivers the lowest thermal conductivity (0.022–0.024 W/m·K) at practical panel thickness." },
  { q: "When should Rock Wool be selected over PIR?", a: "When non-combustible A2-s1,d0 fire class or up to 120 minutes fire resistance is required — data centers, airports, transport hubs, tall buildings and industrial fire compartmentation." },
  { q: "What insulation is recommended for food processing factories?", a: "PIR core with HDP or food-grade PVDF facings and hygienic sealed joints. Rock Wool is used where fire zoning around ovens or high-temperature processes is required." },
  { q: "How are clean room panels different from standard sandwich panels?", a: "Flush-finish facings, hygienic aluminium/PVC joint profiles, silicon-sealed junctions, integrated glazing and door frames — engineered for ISO Class 5–8 leakage control and cleanability." },
  { q: "Can one factory produce panels for multiple industries?", a: "Yes. NEVO's engineered production lines are designed to switch between PIR, Rock Wool and clean room panels — with recipe, facing and joint changes managed by the automation system." },
  { q: "What panel thickness is required for a –25 °C freezer?", a: "Typically 150–200 mm PIR with a U-value ≤ 0.15 W/m²·K, cam-lock joints, heated door frames and continuous vapour barrier at the warm side." },
  { q: "Do pharmaceutical facilities need Rock Wool or PIR?", a: "Most pharma clean rooms use PIR-core clean room panels for thermal performance. Rock Wool clean room panels are specified where fire compartmentation between suites is mandated." },
  { q: "What fire rating is required for a data center?", a: "Envelope and internal compartmentation typically require EI 60 to EI 120. Rock Wool sandwich panels 120–150 mm meet these requirements while providing acoustic control." },
  { q: "Are NEVO panels suitable for coastal and marine environments?", a: "Yes. PVDF-coated PPGI or Aluzinc facings are specified for coastal, chemical and high-humidity environments — with 15–25 year paint warranties." },
  { q: "Can NEVO engineer complete industrial buildings?", a: "Yes. NEVO delivers feasibility, layout, material selection, production line integration and commissioning — panels are one deliverable within a complete engineered building solution." },
  { q: "What is the typical lead time for a large project?", a: "8–14 weeks from confirmed technical spec to first shipment, depending on volume, colour and joint system. NEVO plans on a project Gantt with weekly progress reporting." },
  { q: "Do you provide structural calculations for the panels?", a: "Yes. Wind, snow, seismic and point-load calculations per EN 1991 / local codes are issued with the panel technical package." },
  { q: "Are panels certified to EN, ASTM and GCC standards?", a: "Panels are tested to EN 13501 (fire), EN 14509 (sandwich panels), EN 12865 (watertightness), ASTM E84 and UAE/Saudi civil defence standards on request." },
  { q: "How is hygiene guaranteed in food and pharma envelopes?", a: "Flush facings, hygienic joint profiles, food-grade PVDF or HDP paint, sealed penetrations and cove details engineered for washdown and CIP." },
  { q: "What panel widths do you supply?", a: "1000 mm and 1150 mm effective width standard; custom widths per project. Clean room panels also available in 1200 mm." },
  { q: "Can panels be installed vertically and horizontally?", a: "Yes. Wall panels are certified for both vertical and horizontal installation with the appropriate substructure and fixing pattern." },
  { q: "How are utilities integrated in clean room panels?", a: "Pre-cut penetrations, embedded conduit, integrated glazing, doors, corner coving and ceiling suspension are engineered into the panel bill of materials." },
  { q: "Do you supply integrated cold-storage doors?", a: "Yes. Sliding, hinged and rapid-roll cold-storage doors with matched insulation thickness, heated frames and controls." },
  { q: "What sustainability credentials do NEVO panels carry?", a: "HFC-free PIR blowing agents, 100% recyclable Rock Wool, up to 30% recycled steel content and EPDs available on request." },
  { q: "How do you handle multi-industry projects (retail + cold storage)?", a: "Engineered as one envelope with different panel specifications zoned per function — facade panels externally, cold-room panels in the back-of-house, all detailed together." },
  { q: "Do you provide site installation supervision?", a: "Yes. Method statements, installer training and on-site engineering supervision are available as part of a turnkey engineering package." },
  { q: "Can NEVO deliver DDP to my country?", a: "DDP is available in the GCC, Levant and East Africa; CIF/CFR to all other markets. Local warehousing supports rapid response for stocked SKUs." },
  { q: "What is the operating temperature range of the panels?", a: "PIR: –40 °C to +80 °C continuous. Rock Wool: –40 °C to +250 °C at the facing, higher at the core." },
  { q: "How do sports halls benefit from Rock Wool panels?", a: "Rock Wool delivers Rw 30–36 dB acoustic insulation, controlling reverberation in long-span sports arenas while providing non-combustible fire class." },
  { q: "Do agricultural buildings need special coatings?", a: "Yes. High-durability PVDF or HDP paint resists ammonia, humidity and washdown chemistry typical in livestock and agro-industrial buildings." },
  { q: "Can NEVO panels be integrated with PV roofs?", a: "Yes. PIR and Rock Wool roof panels are engineered for photovoltaic bracket loads, with pre-designed penetration and cable-tray details." },
  { q: "What documentation is included with delivery?", a: "Mill test certificates, panel test reports, installation manuals, structural calculations, warranty documents and full batch traceability." },
  { q: "Do you support OEM / private-label supply for regional partners?", a: "Yes. Panels can be produced under distributor branding with private-label datasheets and packaging." },
  { q: "What is the warranty on NEVO industry solutions?", a: "10 years structural performance, 10 years thermal integrity, and 15–25 years on paint systems depending on coating and environment." },
  { q: "How do I start an industry consultation?", a: "Submit the industry consultation form on this page. A NEVO industry specialist responds within one business day with an engineered technical proposal." },
];

export const Route = createFileRoute("/industries")({
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
        { "@type": "ListItem", position: 2, name: "Industries", item: URL_PATH },
      ],
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
      ],
    };
  },
  component: IndustriesPage,
});

/* ------------------------------------------------------------------ */

function IndustriesPage() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main">
        <Hero />
        <Overview />
        <IndustryGrid />
        <ApplicationsSection />
        <PanelSolutions />
        <EngineeringSolutions />
        <WhyChoose />
        <CaseStudies />
        <Downloads />
        <FAQSection />
        <ConsultationForm />
        <FinalCTA />
      </main>
      <SiteFooter />
    </>
  );
}

/* HERO */
function Hero() {
  return (
    <section className="relative isolate -mt-20 overflow-hidden bg-black text-white md:-mt-24">
      <div className="absolute inset-0 -z-10">
        <img
          src={t05}
          alt="NEVO industrial warehouse envelope at dusk"
          className="h-full w-full object-cover"
          style={{ transform: "scale(1.05)" }}
          fetchPriority="high"
        />
        <div aria-hidden className="absolute inset-0 bg-black/60" />
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-[70%]"
          style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.78) 55%, rgba(0,0,0,0.25) 100%)" }}
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
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
            Industries
          </div>
          <h1 className="text-display text-balance text-white">
            Industries We <span className="text-accent">Engineer For.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
            Complete engineering, premium materials, production technologies and sandwich
            panel solutions — tailored for every industry we serve.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button size="lg" variant="primary" asChild>
              <a href="#industries">
                Explore Industries <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#consultation">Talk to an Industry Specialist</a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9 }}
          className="mt-16 grid max-w-3xl grid-cols-2 gap-8 border-t border-white/15 pt-8 text-white/85 sm:grid-cols-4"
        >
          {[
            { k: "Quality", v: "Certified panels" },
            { k: "Performance", v: "Engineered envelopes" },
            { k: "Reliability", v: "Global supply chain" },
            { k: "Sustainability", v: "Eco-efficient materials" },
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

/* OVERVIEW */
function Overview() {
  const items = [
    { icon: Snowflake, t: "Different insulation", d: "Thermal, acoustic and vapour requirements shift per industry." },
    { icon: Shield, t: "Different fire ratings", d: "From B-s2,d0 industrial to A2-s1,d0 data centres and hangars." },
    { icon: FlaskConical, t: "Different hygiene", d: "Food, pharma and hospital envelopes need certified cleanability." },
    { icon: Factory, t: "Different production", d: "Each industry demands its own building physics and layout." },
    { icon: Building2, t: "Different regulations", d: "Civil defence, HACCP, GMP, ISO and local codes vary by market." },
  ];
  return (
    <Section id="overview" className="bg-white">
      <SectionHeader
        eyebrow="Industry Overview"
        title="Every industry demands its own engineering brief."
        lede="A cold store is not a bakery. A pharma suite is not a hangar. NEVO engineers the envelope, the panel and the factory around the industry it serves — not the other way around."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map(({ icon: Icon, t, d }) => (
          <SurfaceCard key={t} className="h-full">
            <Icon className="size-5 text-accent" />
            <h3 className="mt-3 text-base font-medium text-foreground">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </SurfaceCard>
        ))}
      </div>
    </Section>
  );
}

/* INDUSTRY GRID */
function IndustryGrid() {
  return (
    <Section id="industries" className="bg-secondary/40">
      <SectionHeader
        eyebrow="Industries"
        title="Twelve industries. One engineering discipline."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((ind, i) => {
          const Icon = ind.icon;
          return (
            <motion.article
              key={ind.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.6 }}
              className="group overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-black">
                <img
                  src={ind.img}
                  alt={ind.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <span className="absolute top-3 left-3 rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">
                  {ind.tag}
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-4 text-white">
                  <Icon className="size-5 text-accent" />
                  <h3 className="text-lg font-medium">{ind.title}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-muted-foreground">{ind.desc}</p>
                <div className="mt-4">
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">Typical applications</div>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {ind.apps.map((a) => (
                      <li key={a} className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground">{a}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 text-sm">
                  <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">Recommended panel</span>
                  <div className="mt-1 text-foreground">{ind.panel}</div>
                </div>
                <a href="#consultation" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                  Discuss this industry <ArrowUpRight className="size-4" />
                </a>
              </div>
            </motion.article>
          );
        })}
      </div>
    </Section>
  );
}

/* APPLICATIONS */
function ApplicationsSection() {
  return (
    <Section id="applications" className="bg-black text-white">
      <SectionHeader
        eyebrow="Application Examples"
        title="Where our engineering shows up in production."
        lede="Every application below has its own building physics — different vapour, temperature, hygiene and fire brief. Engineering is what makes each work."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {APPLICATIONS.map((a) => (
          <div key={a.tag} className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
            <div className="relative aspect-[4/3] overflow-hidden bg-black">
              <img src={a.img} alt={a.title} className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105" loading="lazy" />
              <span className="absolute top-3 left-3 rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">{a.tag}</span>
            </div>
            <div className="p-5">
              <h3 className="text-base font-medium text-white">{a.title}</h3>
              <p className="mt-2 text-sm text-white/70">{a.note}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* PANEL SOLUTIONS */
function PanelSolutions() {
  return (
    <Section id="panels" className="bg-white">
      <SectionHeader
        eyebrow="Panel Solutions"
        title="The right panel for the right industry."
        lede="Five engineered panel families cover every industry NEVO serves — matched to fire, thermal, hygiene and structural briefs."
        aside={
          <Button variant="secondary" asChild>
            <Link to="/solutions/sandwich-panels">All panel systems <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {PANELS.map((p) => (
          <SurfaceCard key={p.tag} className="overflow-hidden p-0">
            <div className="relative aspect-[4/3] bg-black">
              <img src={p.img} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute top-3 left-3 rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">{p.tag}</span>
            </div>
            <div className="p-5">
              <h3 className="text-base font-medium text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.where}</p>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </Section>
  );
}

/* ENGINEERING SOLUTIONS */
function EngineeringSolutions() {
  return (
    <Section id="engineering" className="bg-secondary/40">
      <SectionHeader
        eyebrow="Engineering Solutions"
        title="How NEVO supports every industry."
        aside={
          <Button variant="secondary" asChild>
            <Link to="/solutions/engineering-consultancy">Engineering Consultancy <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ENGINEERING.map(({ icon: Icon, title, desc }) => (
          <SurfaceCard key={title} className="h-full">
            <Icon className="size-5 text-accent" />
            <h3 className="mt-3 text-base font-medium text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </SurfaceCard>
        ))}
      </div>
    </Section>
  );
}

/* WHY */
function WhyChoose() {
  return (
    <Section id="why" className="bg-black text-white">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Eyebrow className="text-white/60">Why NEVO</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight text-white md:text-5xl">
            Engineering-led. Industry-specific. Global.
          </h2>
          <p className="mt-5 max-w-xl text-white/70">
            NEVO combines industry engineering, premium materials and disciplined project
            delivery — one accountable partner from feasibility to long-term support.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {WHY.map((w) => (
            <li key={w} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/85">
              <Check className="mt-0.5 size-4 flex-none text-accent" /> {w}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* CASE STUDIES */
function CaseStudies() {
  return (
    <Section id="case-studies" className="bg-white">
      <SectionHeader eyebrow="Case Studies" title="Engineered projects across industries." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CASE_STUDIES.map((c) => (
          <div key={c.title} className="group overflow-hidden rounded-lg border border-border bg-secondary/30">
            <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-secondary to-secondary/40 text-muted-foreground">
              <Globe2 className="size-10 text-accent/40" />
              <span className="absolute top-3 left-3 rounded bg-accent/90 px-2 py-1 font-mono text-xs text-accent-foreground">
                {c.industry}
              </span>
            </div>
            <div className="p-5">
              <h3 className="text-base font-medium text-foreground">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.loc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">Project photography and full case studies coming to the Knowledge Hub soon.</p>
    </Section>
  );
}

/* DOWNLOADS */
function Downloads() {
  return (
    <Section id="downloads" className="bg-secondary/40">
      <SectionHeader eyebrow="Downloads" title="Industry-specific technical guides." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOWNLOADS.map((d) => (
          <SurfaceCard key={d.title} className="flex h-full flex-col">
            <FileText className="size-5 text-accent" />
            <h3 className="mt-3 text-base font-medium text-foreground">{d.title}</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{d.desc}</p>
            <Button variant="ghost" className="mt-4 justify-start px-0" asChild>
              <a href="#consultation">
                <Download className="mr-2 size-4" /> Request download
              </a>
            </Button>
          </SurfaceCard>
        ))}
      </div>
    </Section>
  );
}

/* FAQ */
function FAQSection() {
  return (
    <Section id="faq" className="bg-white">
      <SectionHeader eyebrow="FAQ" title="Industry-specific engineering answers." />
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

      {/* internal links */}
      <div className="mt-14 grid gap-3 rounded-lg border border-border bg-secondary/30 p-6 text-sm sm:grid-cols-3">
        <Link to="/solutions/production-lines" className="hover:text-accent">→ Production Lines</Link>
        <Link to="/solutions/engineering-consultancy" className="hover:text-accent">→ Engineering Consultancy</Link>
        <Link to="/solutions/raw-materials" className="hover:text-accent">→ Raw Materials</Link>
        <Link to="/solutions/sandwich-panels" className="hover:text-accent">→ Finished Sandwich Panels</Link>
        <Link to="/" className="hover:text-accent">→ Factory Development</Link>
        <Link to="/" className="hover:text-accent">→ Knowledge Hub</Link>
      </div>
    </Section>
  );
}

/* CONSULTATION FORM */
function ConsultationForm() {
  return (
    <Section id="consultation" className="bg-black text-white">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <Eyebrow className="text-white/60">Industry Consultation</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight text-white md:text-5xl">
            Talk to an industry specialist.
          </h2>
          <p className="mt-5 max-w-lg text-white/70">
            Share your project brief and a NEVO industry engineer will reply within one
            business day with an engineered technical proposal.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/70">
            {[
              { icon: Shield, t: "Industry-specific engineering advice" },
              { icon: Leaf, t: "Sustainable material recommendations" },
              { icon: Globe2, t: "Global delivery — DDP in select markets" },
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
            alert("Thank you. A NEVO industry specialist will reply within one business day.");
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" name="company" required />
            <Field label="Industry" name="industry" placeholder="Cold storage / Pharma / …" required />
            <Field label="Country" name="country" required />
            <Field label="Project Type" name="projectType" placeholder="New build / Extension" />
            <Field label="Building Size (m²)" name="size" placeholder="e.g. 8,000" />
            <Field label="Panel Type" name="panel" placeholder="PIR / Rock Wool / Clean Room" />
            <Field label="Fire Rating Requirement" name="fire" placeholder="EI 30 / 60 / 120" />
            <Field label="Timeline" name="timeline" placeholder="Q3 2026" />
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
  label, name, type = "text", required, placeholder, textarea, className,
}: {
  label: string; name: string; type?: string; required?: boolean;
  placeholder?: string; textarea?: boolean; className?: string;
}) {
  const cls =
    "mt-2 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none";
  return (
    <label className={"block " + (className ?? "")}>
      <span className="text-xs font-mono uppercase tracking-widest text-white/60">
        {label}{required && <span className="text-accent"> *</span>}
      </span>
      {textarea ? (
        <textarea name={name} rows={4} placeholder={placeholder} className={cls} />
      ) : (
        <input type={type} name={name} required={required} placeholder={placeholder} className={cls} />
      )}
    </label>
  );
}

/* FINAL CTA */
function FinalCTA() {
  return (
    <Section className="bg-white">
      <div className="relative overflow-hidden rounded-2xl bg-black p-10 md:p-16 text-white">
        <div className="relative z-10 max-w-3xl">
          <Eyebrow className="text-white/60">Ready to Engineer</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            Every industry deserves an engineered solution.
          </h2>
          <p className="mt-5 max-w-2xl text-white/75">
            Whether you're building a cold storage warehouse, food factory, pharmaceutical
            facility or industrial plant, NEVO delivers engineering-driven solutions built
            for long-term performance.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="primary" asChild>
              <a href="#consultation">Book an Engineering Consultation <ArrowRight className="ml-2 size-4" /></a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#consultation">Request a Technical Proposal</a>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
