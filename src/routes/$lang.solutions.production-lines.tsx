import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/lib/seo";
import { useRef, useState } from "react";
import { motion } from "motion/react";
import { submitLeadForm } from "@/lib/lead-submit";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Cpu,
  Factory,
  Flame,
  Gauge,
  Layers,
  Package,
  Radio,
  Ruler,
  Scissors,
  Settings2,
  Shield,
  Snowflake,
  Sparkles,
  Thermometer,
  Wrench,
  Zap,
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import heroImgAsset from "@/assets/premium/25-prodline-hero.jpg.asset.json";
import philosophyImgAsset from "@/assets/premium/26-prodline-detail.jpg.asset.json";
const heroImg = heroImgAsset.url;
const philosophyImg = philosophyImgAsset.url;
import eq01 from "@/assets/machinery/01-decoiler.jpg";
import eq02 from "@/assets/machinery/02-roll-former.jpg";
import eq03 from "@/assets/machinery/03-foam-injection.jpg";
import eq04 from "@/assets/machinery/04-double-belt-laminator.jpg";
import eq05 from "@/assets/machinery/05-flying-saw.jpg";
import eq06 from "@/assets/machinery/06-cooling-section.jpg";
import eq07 from "@/assets/machinery/07-stacking-system.jpg";
import eq08 from "@/assets/machinery/08-packaging-line.jpg";
import eq09 from "@/assets/machinery/09-control-system.jpg";
import eq10 from "@/assets/machinery/10-air-compressor.jpg";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { GridBoard, BoardCell, SurfaceCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ------------------------------------------------------------------ */
/*  SEO                                                                */
/* ------------------------------------------------------------------ */

const TITLE =
  "Sandwich Panel Production Lines — Engineering, Equipment & Commissioning | NEVO Industrial";
const DESCRIPTION =
  "Complete continuous and discontinuous sandwich panel production lines — PIR, PUR and rock wool. Engineering, equipment selection, automation, installation and commissioning by NEVO Industrial, Dubai.";
const URL_PATH = "/solutions/production-lines";

const FAQS = [
  { q: "How much production capacity do I need?", a: "Capacity is defined by your target market, panel spectrum and shift model. A typical entry continuous line runs 6–10 m/min, mid-range 12–18 m/min, and high-output above 20 m/min. Our engineers size the line against your 5-year demand forecast, not against a catalogue." },
  { q: "What is the maximum line speed?", a: "Continuous PIR/PUR lines are engineered up to 25 m/min for standard thicknesses. Real productive speed depends on panel thickness, core reactivity, curing zone length and cutting cycle — not the nameplate figure." },
  { q: "Can PIR and PUR be produced on the same line?", a: "Yes. A dual-recipe foaming system with automatic switching between PIR and PUR chemistries is standard on modern continuous lines. Recipe management, temperature setpoints and belt speed are handled by the PLC." },
  { q: "How much factory space is required?", a: "A continuous line typically needs a hall 120–180 m long by 24–36 m wide, plus raw material, finished-goods and utilities zones. We deliver a general arrangement drawing during the feasibility phase." },
  { q: "How many operators are needed per shift?", a: "A modern automated continuous line runs with 6–10 operators per shift: line supervisor, foaming station, laminator, cutting/stacking, packaging, quality and forklift. Automation level directly changes this number." },
  { q: "Can the line be upgraded later?", a: "Every NEVO line is engineered with defined upgrade paths — additional decoilers, extended curing, higher-speed cutting, automatic packaging, MES integration. We document upgrade envelopes in the mechanical general arrangement." },
  { q: "What is the difference between continuous and discontinuous lines?", a: "Continuous lines produce panels in an uninterrupted flow between two belts, ideal for high volume and consistent quality. Discontinuous lines press panels one at a time in a batch press — lower investment, wider thickness range, lower output." },
  { q: "Which panel thicknesses can be produced?", a: "Continuous lines typically produce 30–200 mm PIR/PUR panels and 50–200 mm rock wool. Discontinuous presses handle 20–300 mm. Facing choices include PPGI, GI, Aluzinc, aluminium and stainless steel." },
  { q: "What raw materials does the line consume?", a: "Steel coils (PPGI/GI/Aluzinc), polyol and isocyanate chemical systems for PIR/PUR, rock wool lamellas for mineral wool, plus release films, adhesives, edge tapes and packaging consumables." },
  { q: "What utilities are required?", a: "Typical continuous line: 800–1500 kW installed electrical power, 6–10 bar compressed air, chilled water for cooling zone, hot oil or steam for curing zone, and exhaust with VOC treatment. We deliver a full utilities schedule." },
  { q: "How long does installation take?", a: "From equipment arrival on site: 10–14 weeks for a standard continuous line — mechanical erection, electrical, piping, commissioning, hot trials and production ramp-up." },
  { q: "What is the total project lead time?", a: "From contract signature to first sellable panel: 10–14 months for a continuous PIR/PUR line, depending on equipment origin, civil works and permitting in your country." },
  { q: "Do you provide training?", a: "Yes. Operator training, maintenance training and quality control training are delivered on site during commissioning, with printed procedures and video documentation for future hires." },
  { q: "What certifications are supported?", a: "Lines are engineered to produce panels compliant with EN 14509, ASTM, GOST, SASO and local regional standards. Foaming and control systems are CE-marked; safety follows ISO 13849 / EN ISO 12100." },
  { q: "Can the line handle multiple panel profiles?", a: "Roll formers are equipped with quick-change tooling for wall, roof and cold-storage profiles. Profile changeover typically takes 30–60 minutes." },
  { q: "What automation level should I choose?", a: "Three tiers: manual (operator-driven, lowest investment), semi-automatic (PLC + assisted stacking) and fully automatic (SCADA, auto-stacking, auto-packaging, MES). We recommend based on labour cost and target OEE." },
  { q: "Do you provide after-sales support and spare parts?", a: "Yes. NEVO holds spare-parts inventory for critical items, offers remote diagnostics via VPN, and dispatches field engineers for scheduled audits and troubleshooting." },
  { q: "Can the line be relocated later?", a: "Yes. All NEVO lines are engineered with modular foundations and documented disassembly procedures. Relocations are typically completed in 8–12 weeks including re-commissioning." },
  { q: "What is the typical energy consumption?", a: "Modern continuous PIR line: 45–70 kWh per ton of panel, depending on thickness mix, curing recipe and heat-recovery equipment. Rock wool lines are lower on chemistry, higher on mechanical handling." },
  { q: "How is quality controlled inline?", a: "Continuous thickness measurement, adhesion sampling, density checks, dimensional laser scanning and automatic reject marking. Data is logged to the SCADA and available in production reports." },
  { q: "What warranty is provided?", a: "Standard 12-month warranty on mechanical equipment, 24 months on control systems, with extended options. Warranty starts at successful performance test acceptance." },
  { q: "Do you handle CE marking and export documentation?", a: "Yes. Machinery Directive documentation, technical file, risk assessment and Declaration of Conformity are prepared as part of the delivery scope." },
];

export const Route = createFileRoute("/$lang/solutions/production-lines")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}${URL_PATH}` },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}${URL_PATH}` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "/" },
            { "@type": "ListItem", position: 2, name: "Solutions", item: "/solutions" },
            { "@type": "ListItem", position: 3, name: "Production Lines", item: URL_PATH },
          ],
        }),
      },
    ],
  }),
  component: ProductionLinesPage,
});

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

function ProductionLinesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />
      <main>
        <PageHero />
        <Breadcrumbs />
        <SolutionsGrid />
        <Philosophy />
        <ProcessTimeline />
        <MainEquipment />
        <ComparisonTable />
        <Automation />
        <Applications />
        <Downloads />
        <FAQSection />
        <ProjectInquiry />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HERO                                                               */
/* ------------------------------------------------------------------ */

function PageHero() {
  return (
    <section className="relative isolate -mt-20 overflow-hidden bg-black text-white md:-mt-24">
      <h1 className="sr-only">Complete Sandwich Panel Production Lines — NEVO Industrial</h1>
      <div className="relative min-h-[78vh] lg:min-h-[86vh]">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img
            src={heroImg}
            alt="NEVO continuous sandwich panel production line — double-belt laminator with PIR core"
            className="h-full w-full object-cover"
            style={{ objectPosition: "70% center", transform: "scale(1.05)" }}
            fetchPriority="high"
          />
          <div aria-hidden className="absolute inset-y-0 left-0 w-[55%] bg-black" />
          <div
            aria-hidden
            className="absolute inset-y-0 left-[55%] w-[20%]"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.25) 100%)",
            }}
          />
          <div aria-hidden className="absolute inset-y-0 right-0 w-[30%] bg-black/35" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        <div className="container-wide relative flex min-h-[78vh] flex-col justify-between px-6 pt-36 pb-12 lg:min-h-[86vh] lg:px-8 lg:pt-44 lg:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
            className="max-w-3xl"
          >
            <div className="eyebrow mb-6 flex items-center gap-2 text-white/70">
              <span className="inline-flex size-1.5 rounded-full bg-accent" />
              Solutions · Production Lines
            </div>
            <motion.p
              aria-hidden
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.25, 1, 0.5, 1], delay: 0.08 }}
              className="text-display text-balance text-white"
            >
              Complete Sandwich Panel{" "}
              <span className="text-white/55">Production Lines.</span>
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1], delay: 0.2 }}
              className="text-body-lg mt-8 max-w-2xl text-white/75"
            >
              Engineering, equipment selection, automation, installation and
              commissioning for modern sandwich panel manufacturing facilities.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1], delay: 0.3 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <a href="#inquiry">
                  Request a Production Line Proposal
                  <ArrowRight className="!size-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10"
              >
                <a href="#inquiry">
                  Talk to an Engineering Specialist
                  <ArrowUpRight className="!size-4" />
                </a>
              </Button>
            </motion.div>
          </motion.div>

          <div className="hidden gap-8 border-t border-white/15 pt-6 text-[11px] uppercase tracking-widest text-white/60 md:grid md:grid-cols-4">
            <span>Continuous · Discontinuous</span>
            <span>PIR · PUR · Rock Wool</span>
            <span>Up to 25 m/min</span>
            <span>Engineered in Dubai</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  BREADCRUMBS                                                        */
/* ------------------------------------------------------------------ */

function Breadcrumbs() {
  const trail = [
    { label: "Home", href: "/" },
    { label: "Solutions", href: "/solutions" },
    { label: "Production Lines", href: `${SITE.url}${URL_PATH}` },
  ];
  return (
    <nav aria-label="Breadcrumb" className="border-b border-border bg-background">
      <div className="container-wide flex items-center gap-2 py-4 text-xs text-muted-foreground">
        {trail.map((t, i) => (
          <span key={t.href} className="inline-flex items-center gap-2">
            {i > 0 && <ChevronRight className="size-3" />}
            {i === trail.length - 1 ? (
              <span className="text-foreground">{t.label}</span>
            ) : (
              <Link to={t.href as never} className="hover:text-foreground">
                {t.label}
              </Link>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 1 — SOLUTIONS GRID                                         */
/* ------------------------------------------------------------------ */

const SOLUTIONS = [
  {
    icon: Factory,
    title: "Continuous Production Lines",
    desc: "High-volume double-belt laminators for PIR, PUR and mineral wool panels, engineered for 24/7 operation.",
  },
  {
    icon: Layers,
    title: "Discontinuous Production Lines",
    desc: "Batch presses for wide thickness ranges, specialty panels and lower-volume markets.",
  },
  {
    icon: Flame,
    title: "PIR Production Systems",
    desc: "Fire-rated polyisocyanurate systems with dual-recipe foaming and extended curing zones.",
  },
  {
    icon: Sparkles,
    title: "PUR Production Systems",
    desc: "Cost-optimized polyurethane systems for insulated wall, roof and cold-room panels.",
  },
  {
    icon: Shield,
    title: "Rock Wool Production Lines",
    desc: "Mineral-wool lamella lines for A-class fire-rated panels used in industrial and commercial envelopes.",
  },
  {
    icon: Settings2,
    title: "Customized Production Solutions",
    desc: "Bespoke lines engineered around your capacity, layout, panel spectrum and future expansion plan.",
  },
];

function SolutionsGrid() {
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="What we deliver"
        title="Complete production line solutions."
        lede="Six line families — each engineered end-to-end from raw-material intake to packaged, sellable panel."
      />
      <GridBoard className="sm:grid-cols-2 lg:grid-cols-3">
        {SOLUTIONS.map((s) => (
          <BoardCell key={s.title} interactive className="card-accent-line gap-5 min-h-[220px] justify-between">
            <s.icon className="size-6 text-muted-foreground transition-colors group-hover:text-accent" strokeWidth={1.5} />
            <div>
              <h3 className="text-h3 text-foreground">{s.title}</h3>
              <p className="text-body mt-2">{s.desc}</p>
            </div>
          </BoardCell>
        ))}
      </GridBoard>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 2 — PHILOSOPHY                                             */
/* ------------------------------------------------------------------ */

const PHILOSOPHY_TOPICS = [
  { n: "01", t: "Required Capacity", d: "Sized to your 5-year demand forecast, not to a catalogue nameplate." },
  { n: "02", t: "Automation Level", d: "Matched to your labour market, OEE targets and operator skill base." },
  { n: "03", t: "Factory Layout", d: "General arrangement engineered around your plot, flow and utilities." },
  { n: "04", t: "Future Expansion", d: "Documented upgrade envelopes for speed, thickness and packaging." },
  { n: "05", t: "Energy Efficiency", d: "Heat recovery, VFDs and optimized curing to minimize kWh per ton." },
  { n: "06", t: "Maintenance Access", d: "Every critical zone reachable without dismantling adjacent modules." },
  { n: "07", t: "Operator Safety", d: "ISO 13849 / EN ISO 12100 compliant guarding, interlocks and EPO logic." },
];

function Philosophy() {
  return (
    <Section tone="surface">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <figure className="lg:col-span-6">
          <div className="relative overflow-hidden rounded-xl border border-border bg-background">
            <img
              src={philosophyImg}
              alt="Engineers reviewing a NEVO production line general arrangement"
              className="aspect-[4/5] h-full w-full object-cover"
              loading="lazy"
            />
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/25 to-transparent p-5 text-white">
              <div className="font-mono text-[10px] tracking-widest text-white/70">
                FIG. 03 · ENGINEERING PHILOSOPHY
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-white/90">
                <span className="inline-flex size-1.5 rounded-full bg-accent" />
                System, not machine
              </div>
            </figcaption>
          </div>
        </figure>
        <div className="lg:col-span-6">
          <Eyebrow>Engineering philosophy</Eyebrow>
          <h2 className="text-h1 mt-6 text-balance text-foreground">
            We design production systems around your requirements — not the other way around.
          </h2>
          <p className="text-body-lg mt-6">
            A sandwich panel line is a system of interdependent decisions. NEVO
            engineers begin with the seven questions below before a single
            component is specified.
          </p>
          <ol className="mt-10 divide-y divide-border border-y border-border">
            {PHILOSOPHY_TOPICS.map((p) => (
              <li key={p.n} className="grid grid-cols-[auto_1fr] gap-6 py-4">
                <span className="font-mono text-[11px] tracking-widest text-accent">{p.n}</span>
                <div>
                  <div className="text-base font-semibold tracking-tight text-foreground">{p.t}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{p.d}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 3 — PROCESS TIMELINE                                       */
/* ------------------------------------------------------------------ */

const PROCESS_STEPS = [
  "Raw Material Feeding",
  "Steel Coil Decoiling",
  "Roll Forming",
  "Preheating",
  "PU / PIR Injection",
  "Double Belt Lamination",
  "Cooling",
  "Flying Saw Cutting",
  "Automatic Stacking",
  "Packaging",
  "Finished Product",
];

function ProcessTimeline() {
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Production process"
        title="Eleven engineered phases, one continuous flow."
        lede="From coil to packaged panel — every step measured, controlled and traceable."
      />

      <div className="relative">
        {/* Rail */}
        <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-border md:block" />
        <ol className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-11">
          {PROCESS_STEPS.map((s, i) => (
            <motion.li
              key={s}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.25, 1, 0.5, 1] }}
              className="relative"
            >
              <div className="relative z-10 mx-auto flex size-12 items-center justify-center rounded-full border border-border bg-background font-mono text-[11px] tracking-widest text-accent">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-4 text-center text-[13px] font-medium leading-snug tracking-tight text-foreground">
                {s}
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 4 — MAIN EQUIPMENT                                         */
/* ------------------------------------------------------------------ */

const EQUIPMENT = [
  { n: "01", img: eq01, icon: Layers, t: "Decoiler", d: "Hydraulic decoiler for PPGI / PPGL steel coils. Stable, precise and high capacity." },
  { n: "02", img: eq02, icon: Ruler, t: "Roll Forming Machine", d: "High precision roll forming system for perfect panel profile and dimensional accuracy." },
  { n: "03", img: eq03, icon: Flame, t: "Foam Injection System", d: "High-pressure mixing head for precise PIR foam injection with uniform density and distribution." },
  { n: "04", img: eq04, icon: Factory, t: "Double Belt Laminator", d: "Heavy-duty double belt laminator ensures strong adhesion, flatness and excellent panel quality." },
  { n: "05", img: eq05, icon: Scissors, t: "Flying Saw Cutting System", d: "High-speed flying saw for accurate cutting to length with smooth, clean edges." },
  { n: "06", img: eq06, icon: Snowflake, t: "Cooling Section", d: "Powerful cooling system for stable panel temperature and continuous high-speed production." },
  { n: "07", img: eq07, icon: Package, t: "Automatic Stacking System", d: "Fully automatic stacking for safe handling, high efficiency and reduced labour cost." },
  { n: "08", img: eq08, icon: Package, t: "Auto Packaging Line", d: "Automatic packing with stretch film and edge protection for safe ocean transportation." },
  { n: "09", img: eq09, icon: Cpu, t: "Electrical & Control System", d: "Siemens / Schneider based control system with HMI and intelligent automation." },
  { n: "10", img: eq10, icon: Zap, t: "Air Compressor System", d: "High-efficiency air compressor ensuring stable air supply for the whole production line." },
];

function MainEquipment() {
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Main machinery & equipment"
        title="Engineered for performance. Built to last."
      />
      <GridBoard className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {EQUIPMENT.map((e) => (
          <BoardCell key={e.t} interactive className="overflow-hidden !p-0">
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <img
                src={e.img}
                alt={e.t}
                loading="lazy"
                width={1280}
                height={1024}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <span className="absolute left-3 top-3 rounded-sm bg-accent px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-accent-foreground">
                {e.n}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="flex items-center gap-2">
                <e.icon className="size-4 text-muted-foreground transition-colors group-hover:text-accent" strokeWidth={1.5} />
                <h3 className="text-base font-semibold tracking-tight text-foreground">{e.t}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{e.d}</p>
            </div>
          </BoardCell>
        ))}
      </GridBoard>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 5 — COMPARISON TABLE                                       */
/* ------------------------------------------------------------------ */

type LineKey = "continuous" | "discontinuous" | "pir" | "pur" | "rockwool";

const LINES: { key: LineKey; label: string }[] = [
  { key: "continuous", label: "Continuous" },
  { key: "discontinuous", label: "Discontinuous" },
  { key: "pir", label: "PIR" },
  { key: "pur", label: "PUR" },
  { key: "rockwool", label: "Rock Wool" },
];

const COMPARE: Record<string, Record<LineKey, string>> = {
  Capacity: {
    continuous: "High (up to 1.5M m²/yr)",
    discontinuous: "Low–Medium (100–400k m²/yr)",
    pir: "High",
    pur: "High",
    rockwool: "Medium–High",
  },
  Speed: {
    continuous: "8–25 m/min",
    discontinuous: "Batch cycle",
    pir: "8–20 m/min",
    pur: "10–25 m/min",
    rockwool: "3–8 m/min",
  },
  Investment: {
    continuous: "$$$$",
    discontinuous: "$$",
    pir: "$$$$",
    pur: "$$$",
    rockwool: "$$$$",
  },
  Automation: {
    continuous: "Full",
    discontinuous: "Semi",
    pir: "Full",
    pur: "Full",
    rockwool: "Full",
  },
  Applications: {
    continuous: "Roof, wall, cold storage",
    discontinuous: "Specialty, thick panels",
    pir: "Fire-rated cold storage, industrial",
    pur: "Cost-driven wall & roof",
    rockwool: "A-class fire, industrial",
  },
  "Expansion Potential": {
    continuous: "High",
    discontinuous: "Limited",
    pir: "High",
    pur: "High",
    rockwool: "Medium",
  },
};

function ComparisonTable() {
  const [active, setActive] = useState<LineKey[]>(["continuous", "discontinuous", "pir"]);

  const toggle = (k: LineKey) => {
    setActive((cur) =>
      cur.includes(k)
        ? cur.length > 1
          ? cur.filter((x) => x !== k)
          : cur
        : [...cur, k],
    );
  };

  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Compare"
        title="Choose the right production line for your market."
        lede="Toggle line types to compare capacity, investment, automation and expansion potential."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {LINES.map((l) => {
          const on = active.includes(l.key);
          return (
            <button
              key={l.key}
              onClick={() => toggle(l.key)}
              className={
                "rounded-full border px-4 py-2 text-xs font-medium tracking-tight transition-colors " +
                (on
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground")
              }
              aria-pressed={on}
            >
              {on && <Check className="mr-1.5 inline size-3" />}
              {l.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-5 py-4 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Attribute
              </th>
              {active.map((k) => (
                <th
                  key={k}
                  className="px-5 py-4 text-left text-sm font-semibold tracking-tight text-foreground"
                >
                  {LINES.find((l) => l.key === k)?.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Object.entries(COMPARE).map(([attr, row]) => (
              <tr key={attr} className="bg-background">
                <td className="px-5 py-4 font-medium text-foreground">{attr}</td>
                {active.map((k) => (
                  <td key={k} className="px-5 py-4 text-muted-foreground">
                    {row[k]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 6 — AUTOMATION                                             */
/* ------------------------------------------------------------------ */

const AUTOMATION = [
  { icon: Cpu, t: "PLC", d: "Deterministic control of every actuator, valve and drive." },
  { icon: Gauge, t: "SCADA", d: "Unified operator interface with alarms, trends and audit trail." },
  { icon: Radio, t: "Remote Monitoring", d: "Secure VPN diagnostics and firmware updates from NEVO." },
  { icon: Settings2, t: "Recipe Management", d: "One-click switching between PIR, PUR and thickness recipes." },
  { icon: Shield, t: "Quality Control", d: "Inline thickness, density and adhesion monitoring." },
  { icon: FileText, t: "Production Reports", d: "Shift, batch and OEE reports exported automatically." },
  { icon: Sparkles, t: "Industry 4.0 Integration", d: "MES / ERP connectivity via OPC-UA and REST." },
];

function Automation() {
  return (
    <Section tone="primary">
      <SectionHeader
        eyebrow="Automation"
        title="Modern control, honest data."
        lede="Every NEVO line ships with a production-grade control stack — from PLC up to Industry 4.0 integration."
        onTone="primary"
      />
      <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {AUTOMATION.map((a) => (
          <div key={a.t} className="group bg-primary p-6 sm:p-8 transition-colors hover:bg-white/5">
            <a.icon className="size-5 text-white/70 transition-colors group-hover:text-accent" strokeWidth={1.5} />
            <h3 className="mt-5 text-base font-semibold tracking-tight text-white">{a.t}</h3>
            <p className="mt-1 text-sm text-white/60">{a.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 7 — APPLICATIONS                                           */
/* ------------------------------------------------------------------ */

const APPLICATIONS = [
  "Cold Storage",
  "Industrial Buildings",
  "Food Processing",
  "Clean Rooms",
  "Commercial Buildings",
  "Modular Buildings",
  "Agriculture",
];

function Applications() {
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Applications"
        title="Panels that leave a NEVO line serve demanding environments."
      />
      <div className="flex flex-wrap gap-3">
        {APPLICATIONS.map((a) => (
          <span
            key={a}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium tracking-tight text-foreground"
          >
            <span className="inline-flex size-1.5 rounded-full bg-accent" />
            {a}
          </span>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 8 — DOWNLOADS                                              */
/* ------------------------------------------------------------------ */

const DOWNLOADS = [
  { t: "Production Line Catalogue", size: "PDF · 12 MB" },
  { t: "Technical Brochure", size: "PDF · 6 MB" },
  { t: "General Layout Examples", size: "PDF · 8 MB" },
  { t: "Machine Specifications", size: "PDF · 4 MB" },
  { t: "Capacity Guide", size: "PDF · 2 MB" },
  { t: "Automation Guide", size: "PDF · 3 MB" },
];

function Downloads() {
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Downloads"
        title="Technical documentation for your feasibility study."
        lede="Request the full package to receive current revisions with engineering support included."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOWNLOADS.map((d) => (
          <SurfaceCard key={d.t} interactive className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-md border border-border bg-surface">
                <FileText className="size-4 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight text-foreground">{d.t}</div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {d.size}
                </div>
              </div>
            </div>
            <Download className="size-4 text-muted-foreground transition-colors group-hover:text-accent" strokeWidth={1.5} />
          </SurfaceCard>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 9 — FAQ                                                    */
/* ------------------------------------------------------------------ */

function FAQSection() {
  return (
    <Section tone="default">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeader
            eyebrow="FAQ"
            title="Engineering answers, not sales talk."
            lede="Twenty of the questions our engineers answer most often during project scoping."
          />
        </div>
        <div className="lg:col-span-8">
          <Accordion type="single" collapsible className="w-full divide-y divide-border border-y border-border">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-b-0">
                <AccordionTrigger className="py-5 text-left text-base font-medium tracking-tight text-foreground hover:no-underline">
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-[11px] tracking-widest text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {f.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pl-9 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 10 — PROJECT INQUIRY                                       */
/* ------------------------------------------------------------------ */

const FIELD =
  "block w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40";
const LABEL = "mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground";

function ProjectInquiry() {
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const ok = await submitLeadForm(e.currentTarget, {
      source: "production-lines-inquiry",
      rules: [
        { field: "company", label: "Company" },
        { field: "email", label: "Email", type: "email" },
      ],
      successTitle: "Proposal request received",
      successDescription: "Our production-line team will follow up within one business day.",
    });
    setBusy(false);
    if (ok) formRef.current?.reset();
  }

  return (
    <Section id="inquiry" tone="surface">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeader
            eyebrow="Project inquiry"
            title="Request a production line proposal."
            lede="Share your project envelope and a senior engineer will respond within one business day with a scoped technical proposal."
          />
          <ul className="mt-4 space-y-4 border-t border-border pt-8 text-sm text-foreground">
            {["Confidential handling of technical details", "Engineering-led scoping — not sales-led", "Feasibility, layout and utilities included", "Available in English, Arabic, Russian, Turkish"].map((i) => (
              <li key={i} className="flex items-start gap-3">
                <Wrench className="mt-0.5 size-4 text-accent" strokeWidth={1.5} />
                {i}
              </li>
            ))}
          </ul>
        </div>

        <form
          ref={formRef}
          className="lg:col-span-7 rounded-2xl border border-border bg-background p-6 sm:p-10"
          onSubmit={onSubmit}
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="pl-company" className={LABEL}>Company *</label>
              <input id="pl-company" name="company" required className={FIELD} placeholder="Company name" />
            </div>
            <div>
              <label htmlFor="pl-email" className={LABEL}>Email *</label>
              <input id="pl-email" name="email" type="email" required className={FIELD} placeholder="you@company.com" />
            </div>
            <div>
              <label htmlFor="pl-country" className={LABEL}>Country</label>
              <input id="pl-country" name="country" className={FIELD} placeholder="e.g. Saudi Arabia" />
            </div>
            <div>
              <label htmlFor="pl-capacity" className={LABEL}>Production Capacity</label>
              <select id="pl-capacity" name="capacity" defaultValue="" className={FIELD}>
                <option value="">Select target capacity…</option>
                <option>Up to 300,000 m²/yr</option>
                <option>300,000 – 700,000 m²/yr</option>
                <option>700,000 – 1,200,000 m²/yr</option>
                <option>1,200,000+ m²/yr</option>
              </select>
            </div>
            <div>
              <label htmlFor="pl-thickness" className={LABEL}>Panel Thickness</label>
              <input id="pl-thickness" name="thickness" className={FIELD} placeholder="e.g. 40–200 mm" />
            </div>
            <div>
              <label htmlFor="pl-core" className={LABEL}>Core Type</label>
              <select id="pl-core" name="core" defaultValue="" className={FIELD}>
                <option value="">Select core…</option>
                <option>PIR</option>
                <option>PUR</option>
                <option>Rock Wool</option>
                <option>Multiple / Not sure</option>
              </select>
            </div>
            <div>
              <label htmlFor="pl-factory" className={LABEL}>Factory Size</label>
              <input id="pl-factory" name="factorySize" className={FIELD} placeholder="e.g. 150 × 30 m" />
            </div>
            <div>
              <label htmlFor="pl-auto" className={LABEL}>Automation Preference</label>
              <select id="pl-auto" name="automation" defaultValue="" className={FIELD}>
                <option value="">Select automation…</option>
                <option>Manual</option>
                <option>Semi-automatic</option>
                <option>Fully automatic</option>
              </select>
            </div>
            <div>
              <label htmlFor="pl-market" className={LABEL}>Target Market</label>
              <input id="pl-market" name="market" className={FIELD} placeholder="e.g. GCC, Africa, CIS" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pl-timeline" className={LABEL}>Project Timeline</label>
              <select id="pl-timeline" name="timeline" defaultValue="" className={FIELD}>
                <option value="">Select timeline…</option>
                <option>Immediate</option>
                <option>3–6 months</option>
                <option>6–12 months</option>
                <option>12+ months</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pl-message" className={LABEL}>Message</label>
              <textarea id="pl-message" name="message" rows={5} className={FIELD} placeholder="Briefly describe your project, existing site conditions and any technical constraints." />
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-xs text-muted-foreground">
              Confidential. Used only to prepare your technical proposal.
            </p>
            <Button type="submit" variant="primary" size="lg" disabled={busy}>
              {busy ? (<><Loader2 className="mr-2 !size-4 animate-spin" /> Sending…</>) : (<>Submit Project Inquiry <ArrowRight className="!size-4" /></>)}
            </Button>
          </div>
        </form>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  FINAL CTA                                                          */
/* ------------------------------------------------------------------ */

function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 85% 20%, color-mix(in oklab, var(--color-accent) 22%, transparent), transparent 70%), radial-gradient(50% 60% at 10% 90%, rgba(255,255,255,0.06), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="container-wide section-y text-center">
        <div className="eyebrow mx-auto mb-6 flex items-center justify-center gap-2 text-accent">
          <span className="inline-flex size-1.5 rounded-full bg-accent" />
          Ready when you are
        </div>
        <h2 className="text-display mx-auto max-w-4xl text-balance text-primary-foreground">
          Let's engineer your next{" "}
          <span className="text-primary-foreground/55">production line.</span>
        </h2>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
            <a href="#inquiry">
              Request Technical Proposal
              <ArrowRight className="!size-4" />
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10"
          >
            <a href="#inquiry">
              Schedule Engineering Consultation
              <ArrowUpRight className="!size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
