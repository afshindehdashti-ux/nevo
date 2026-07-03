import { createFileRoute } from "@tanstack/react-router";
import { SITE, buildSeo } from "@/lib/seo";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { submitLeadForm } from "@/lib/lead-submit";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Download,
  FileText,
  Beaker,
  Layers,
  Package,
  Shield,
  Ship,
  Warehouse,
  Flame,
  Gauge,
  Ruler,
  Sparkles,
  Factory,
  Loader2,
} from "lucide-react";

import hero from "@/assets/raw-materials/hero-production-line.jpg";
import imgPPGI from "@/assets/raw-materials/ppgi-coil.jpg";
import imgGI from "@/assets/raw-materials/gi-coil.jpg";
import imgAluzinc from "@/assets/raw-materials/aluzinc-coil.jpg";
import imgPrepainted from "@/assets/raw-materials/prepainted-coil.jpg";
import imgPolyolIBC from "@/assets/raw-materials/polyol-ibc.jpg";
import imgMDIIBC from "@/assets/raw-materials/mdi-ibc.jpg";
import imgPolyolDrum from "@/assets/raw-materials/polyol-drum.jpg";
import imgPIRCore from "@/assets/raw-materials/pir-core.jpg";
import imgPIRPanel from "@/assets/raw-materials/pir-sandwich.jpg";
import imgRockCore from "@/assets/raw-materials/rock-wool-core.jpg";
import imgRockPanel from "@/assets/raw-materials/rock-wool-panel.jpg";
import imgFinished from "@/assets/raw-materials/finished-panels.jpg";
import imgAdhesive from "@/assets/raw-materials/adhesive-sealants.jpg";
import imgProdLine from "@/assets/raw-materials/production-line.jpg";
import imgWhRaw from "@/assets/raw-materials/warehouse-raw.jpg";
import imgWhCoil from "@/assets/raw-materials/warehouse-coil.jpg";
import imgWhChem from "@/assets/raw-materials/warehouse-chemical.jpg";
import imgWhShip from "@/assets/raw-materials/warehouse-shipping.jpg";

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { GridBoard, BoardCell, SurfaceCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";
import { ogImageMeta } from "@/lib/og-images";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TITLE =
  "Raw Material Solutions — PPGI, PIR, Rock Wool, Polyol & MDI | NEVO Industrial";
const DESCRIPTION =
  "Engineered raw material solutions for sandwich panel manufacturing: PPGI/GI/Aluzinc steel coils, polyol and MDI chemical systems, PIR and rock wool cores, adhesives and finished panels — sourced, tested and delivered by NEVO Industrial, Dubai.";
const URL_PATH = "/solutions/raw-materials";

const FAQS: { q: string; a: string }[] = [
  { q: "What raw materials do you supply?", a: "Complete raw material systems for sandwich panel manufacturing: PPGI/GI/Aluzinc/prepainted aluminium coils, polyol and MDI chemical systems (IBC and drum), PIR and rock wool insulation cores, structural adhesives, sealants, release films and packaging consumables." },
  { q: "Do you sell single materials or full systems?", a: "Both. Manufacturers can source a single item (e.g. one polyol tanker) or a fully engineered material package matched to a specific line, panel spectrum and target market." },
  { q: "What steel thicknesses are available for PPGI?", a: "Standard PPGI facings range 0.30–0.80 mm. For sandwich panels we typically supply 0.40, 0.45, 0.50, 0.55 and 0.60 mm on request. Yield strengths S250GD to S350GD with Z100–Z275 zinc coating." },
  { q: "What paint systems do you offer on PPGI?", a: "Polyester (SMP), high-durability polyester (HDP), PVDF and food-grade coatings. Top coats 15–35 μm, backer 5–10 μm, in RAL and custom colours. Certificates for VOC, food contact and salt-spray resistance provided." },
  { q: "What is the difference between PIR and PUR?", a: "PIR (polyisocyanurate) uses a higher isocyanate index, producing a denser cross-linked foam with superior fire behaviour, thermal stability and B-s2,d0 / Bs1d0 classifications. PUR is lower cost with slightly better thermal conductivity but weaker fire performance." },
  { q: "Which polyol system should I choose?", a: "Selection depends on target density (38–42 kg/m³ typical), reactivity profile, line speed, facing type and required fire class. Our chemists match the polyol/MDI recipe to your line and panel spec before the first delivery." },
  { q: "Do you supply polyol in IBC or drums?", a: "Both. 1000 L IBCs for continuous lines with bulk consumption, 200 L drums for discontinuous presses, R&D and low-volume operations. Bulk tanker delivery available in select regions." },
  { q: "How is chemical compatibility guaranteed?", a: "Polyol and MDI are delivered as matched pairs from qualified producers, with batch reactivity profile, viscosity, hydroxyl number and NCO content reported on every certificate of analysis." },
  { q: "What is the shelf life of the chemicals?", a: "Polyol: 6 months in sealed original packaging at 15–25 °C. MDI: 6 months in sealed original packaging at 20–35 °C, protected from moisture. FIFO stock rotation is documented on every delivery." },
  { q: "What rock wool densities do you supply?", a: "Lamella density 90–130 kg/m³ for sandwich panels, slab density 40–100 kg/m³ for insulation applications. Fibre orientation, tensile strength and shear performance are certified per batch." },
  { q: "What is the fire classification of your PIR panels?", a: "PIR sandwich panels typically achieve B-s2,d0 or B-s1,d0 to EN 13501-1 depending on facing and core recipe. Rock wool panels achieve A2-s1,d0 or A1. Test reports from notified bodies are provided." },
  { q: "Can you supply materials to match my existing production line?", a: "Yes. Our engineers analyse your current line — decoiler width, foaming machine head, curing zone, cutting system — and specify facings and chemistry that run stably on your equipment." },
  { q: "What are the typical PPGI coil weights?", a: "Coil weight 3–10 tons, inner diameter 508 or 610 mm, coil width 1000–1250 mm slit to panel width. Coils are packed with steel straps, VCI paper and edge protectors." },
  { q: "How do you handle Aluzinc vs GI selection?", a: "Aluzinc (AZ150) offers 3–6× better corrosion resistance than GI in coastal, cold-storage and chemical environments. GI is preferred for cost-sensitive interior applications. We advise per project climate and lifespan target." },
  { q: "What adhesives do you supply?", a: "Structural PU adhesives for cold-formed metal / rock wool bonding, edge sealants for panel joints, and profile sealants for concealed-fix systems. Application rate and open time matched to your line speed." },
  { q: "Can you supply finished sandwich panels?", a: "Yes. When local production is not yet online, NEVO can supply finished PIR, PUR and rock wool wall/roof/cold-storage panels from qualified partner factories to bridge demand during factory build-up." },
  { q: "What quality documentation do you provide?", a: "Mill test certificates (EN 10204 3.1) for steel, certificates of analysis for chemistry, fire and thermal test reports for panels, and full batch traceability from source mill to your factory gate." },
  { q: "Which incoterms do you work with?", a: "EXW, FOB, CFR, CIF and DAP. For strategic customers we operate DDP with in-country warehousing in the GCC, Levant and East Africa." },
  { q: "What minimum order quantities apply?", a: "Steel coils: from 25 tons per specification. Polyol / MDI: from one full IBC or drum SKU. Rock wool lamella: from one 20-foot container. Consolidated multi-item containers are supported for pilot orders." },
  { q: "What is the typical lead time?", a: "Steel coils: 4–8 weeks from confirmed order. Chemicals: 3–6 weeks. Rock wool: 4–6 weeks. Adhesives and consumables: 2–4 weeks. Stocked SKUs ship within days from Dubai." },
  { q: "How do you ensure supply chain reliability?", a: "Dual-source strategy on every critical SKU, safety stock in Jebel Ali, live production planning with our mills, and transparent shipment tracking from PO to delivery." },
  { q: "Do you provide technical training on material use?", a: "Yes. Foaming recipe workshops, steel handling and coil storage training, quality inspection procedures and troubleshooting sessions — on site during commissioning or remote via video." },
  { q: "Can NEVO handle blended containers for small projects?", a: "Yes. LCL and consolidated FCL shipments combining steel, chemistry and consumables are available for pilot production runs and R&D orders." },
  { q: "What sustainability data can you share?", a: "EPDs for steel and rock wool, GWP declarations on chemistry, HFC-free blowing agents, and take-back programmes for IBCs and drums in select markets." },
  { q: "How does material selection affect panel quality?", a: "Facing paint chemistry drives corrosion life; steel yield strength drives panel stiffness; polyol reactivity drives foaming consistency; MDI index drives fire behaviour; core density drives compression strength. Materials define the panel — the line only assembles them." },
  { q: "How do I request a technical quotation?", a: "Submit the inquiry form on this page with your panel specification, target market and required volume. A NEVO material specialist responds within one business day with a technical proposal and indicative pricing." },
];

export const Route = createFileRoute("/$lang/solutions/raw-materials")({
  head: ({ params }) => {
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
        { "@type": "ListItem", position: 2, name: "Solutions", item: "/solutions" },
        { "@type": "ListItem", position: 3, name: "Raw Materials", item: URL_PATH },
      ],
    };
    const seo = buildSeo({ title: TITLE, description: DESCRIPTION, path: URL_PATH, lang: params.lang });
    return {
      ...seo,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(faqLd) },
        { type: "application/ld+json", children: JSON.stringify(crumbsLd) },
      ],
    };
  },
  component: RawMaterialsPage,
});

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

function RawMaterialsPage() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main">
        <Hero />
        <Portfolio />
        <ChemicalSystems />
        <SteelSystems />
        <InsulationSystems />
        <Accessories />
        <EngineeringBefore />
        <Logistics />
        <QualityAssurance />
        <Downloads />
        <FAQ />
        <InquiryCTA />
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
          src={hero}
          alt="NEVO continuous double-belt laminator producing a PIR sandwich panel"
          className="h-full w-full object-cover"
          style={{ objectPosition: "center", transform: "scale(1.05)" }}
          fetchPriority="high"
        />
        <div aria-hidden className="absolute inset-0 bg-black/55" />
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-[65%]"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0.25) 100%)",
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
            Raw Material Solutions
          </div>
          <h1 className="text-display text-balance text-white">
            Premium Raw Material Solutions{" "}
            <span className="text-accent">Engineered for Sandwich Panel Manufacturing.</span>
          </h1>
          <p className="text-body-lg mt-8 max-w-2xl leading-relaxed text-white/75">
            Helping manufacturers improve production quality through engineering-driven
            material selection and global industrial supply — from PPGI facings and PIR
            chemistry to rock wool cores, adhesives and finished panels.
          </p>
          <div className="mt-10 flex flex-row items-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
            >
              <a href="/project-inquiry">
                Request Material Quotation
                <ArrowRight className="!size-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10"
            >
              <a href="/project-inquiry">
                Talk to a Material Specialist
                <ArrowUpRight className="!size-4" />
              </a>
            </Button>
          </div>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 gap-x-8 gap-y-4 border-t border-white/15 pt-6 md:grid-cols-4"
        >
          {[
            { k: "Steel systems", v: "PPGI · GI · Aluzinc" },
            { k: "Chemistry", v: "Polyol · MDI · PIR / PUR" },
            { k: "Insulation", v: "PIR · Rock wool" },
            { k: "Logistics", v: "Global · DDP capable" },
          ].map((s) => (
            <div key={s.k} className="border-l border-accent/60 pl-3">
              <dt className="text-[11px] font-medium uppercase tracking-widest text-white/55">
                {s.k}
              </dt>
              <dd className="mt-1 text-sm font-medium text-white">{s.v}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  PORTFOLIO — every card uses an official uploaded product image     */
/* ------------------------------------------------------------------ */

type Product = {
  img: string;
  name: string;
  desc: string;
  apps: string;
};

function ProductCard({ p }: { p: Product }) {
  return (
    <SurfaceCard interactive padded={false} className="overflow-hidden">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
        <img
          src={p.img}
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-[var(--ease-out-quart)] group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="text-xl font-semibold text-foreground">{p.name}</h3>
        <p className="text-body mt-3">{p.desc}</p>
        <div className="mt-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Applications
        </div>
        <p className="mt-1 text-sm text-foreground/80">{p.apps}</p>
        <a
          href="/project-inquiry"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-accent"
        >
          Learn more
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </SurfaceCard>
  );
}

const PORTFOLIO: Product[] = [
  {
    img: imgPPGI,
    name: "PPGI Steel Coil",
    desc: "Pre-painted galvanised steel facings, 0.30–0.80 mm, polyester / HDP / PVDF, S250GD–S350GD, RAL and custom colours.",
    apps: "Wall, roof and cold-storage sandwich panel facings.",
  },
  {
    img: imgPIRPanel,
    name: "PIR Sandwich Panel",
    desc: "Continuous double-belt PIR panels with PPGI facings, 30–200 mm thickness, B-s2,d0 fire behaviour, high thermal performance.",
    apps: "Industrial, logistics, cold-storage and commercial envelopes.",
  },
  {
    img: imgProdLine,
    name: "Complete Production Line",
    desc: "Turn-key continuous PIR/PUR and rock wool sandwich panel lines — engineered, installed and commissioned by NEVO.",
    apps: "New factories and greenfield capacity expansion.",
  },
];

function Portfolio() {
  return (
    <Section id="portfolio" tone="default">
      <SectionHeader
        eyebrow="Material Portfolio"
        title="A complete engineered material ecosystem — not a catalogue of parts."
        lede="Every material NEVO supplies is qualified against real production data, matched to line and panel specification, and delivered with full technical documentation."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PORTFOLIO.map((p) => (
          <ProductCard key={p.name} p={p} />
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  CHEMICAL SYSTEMS                                                   */
/* ------------------------------------------------------------------ */

function ChemicalSystems() {
  const items: Product[] = [
    {
      img: imgPolyolIBC,
      name: "Polyol — IBC (1000 L)",
      desc: "Formulated polyol blends for PIR / PUR continuous lines. Reactivity profile matched to your foaming head and line speed.",
      apps: "High-volume continuous double-belt lamination.",
    },
    {
      img: imgMDIIBC,
      name: "MDI — IBC (1000 L)",
      desc: "Polymeric MDI paired with our polyol systems. NCO content, viscosity and reactivity certified per batch.",
      apps: "Continuous PIR / PUR panel production.",
    },
    {
      img: imgPolyolDrum,
      name: "Polyol — Drum (200 L)",
      desc: "Drum packaging for discontinuous presses, R&D and pilot runs. Same qualified chemistry, smaller SKU.",
      apps: "Discontinuous presses and laboratory work.",
    },
    {
      img: imgAdhesive,
      name: "MDI — Drum (200 L)",
      desc: "Moisture-protected drum packaging with FIFO batch tracking and shelf-life monitoring on every delivery.",
      apps: "Discontinuous presses, spot repair and small runs.",
    },
  ];
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Chemical Systems"
        title="Foaming consistency starts in the drum."
        lede="Polyol and MDI are delivered as matched pairs from qualified producers — engineered for foaming consistency, chemical compatibility and production stability on your specific line."
      />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.name} p={p} />
        ))}
      </div>
      <GridBoard className="mt-10 md:grid-cols-3">
        {[
          { icon: Beaker, k: "Foaming consistency", v: "Reactivity matched to your line speed, mould temperature and belt travel." },
          { icon: Shield, k: "Chemical compatibility", v: "Polyol/MDI supplied as engineered pairs, tested for hydroxyl number and NCO index." },
          { icon: Gauge, k: "Production stability", v: "Batch-to-batch consistency documented on every certificate of analysis." },
        ].map((b) => (
          <BoardCell key={b.k}>
            <b.icon className="size-5 text-accent" strokeWidth={1.5} />
            <div className="text-h4 mt-4 text-foreground">{b.k}</div>
            <p className="text-body mt-2">{b.v}</p>
          </BoardCell>
        ))}
      </GridBoard>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  STEEL SYSTEMS                                                      */
/* ------------------------------------------------------------------ */

function SteelSystems() {
  const items: Product[] = [
    {
      img: imgPPGI,
      name: "PPGI Steel Coil",
      desc: "Pre-painted galvanised steel, 0.30–0.80 mm, polyester / HDP / PVDF paint systems in RAL and custom colours.",
      apps: "Standard wall and roof panel facings.",
    },
    {
      img: imgGI,
      name: "GI Steel Coil",
      desc: "Hot-dip galvanised steel, Z100–Z275 zinc coating, S250GD–S350GD yield, unpainted substrate for downstream coating.",
      apps: "Interior facings and specialty coated products.",
    },
    {
      img: imgAluzinc,
      name: "Aluzinc Steel Coil",
      desc: "AZ150 55 % Al – Zn coated steel, 3–6× the corrosion life of standard GI in aggressive environments.",
      apps: "Coastal, cold-storage and chemical facilities.",
    },
    {
      img: imgPrepainted,
      name: "Prepainted Aluminium Coil",
      desc: "Coil-coated aluminium substrate for architectural and hygienic applications where steel is not permitted.",
      apps: "Marine, food processing and specialty envelopes.",
    },
  ];
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Steel Systems"
        title="Facings define panel life. Choose them like an engineer."
        lede="Steel thickness, paint chemistry, yield strength, corrosion class and surface flatness together determine mechanical performance and 25-year durability."
      />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.name} p={p} />
        ))}
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-5">
        {[
          { icon: Ruler, k: "Thickness", v: "0.30–0.80 mm" },
          { icon: Sparkles, k: "Paint systems", v: "SMP · HDP · PVDF" },
          { icon: Gauge, k: "Yield strength", v: "S250GD–S350GD" },
          { icon: Shield, k: "Corrosion class", v: "Z100–Z275 · AZ150" },
          { icon: Layers, k: "Surface quality", v: "Class B — panel grade" },
        ].map((b) => (
          <div
            key={b.k}
            className="rounded-lg border border-border bg-surface p-5"
          >
            <b.icon className="size-5 text-accent" strokeWidth={1.5} />
            <div className="mt-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {b.k}
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">{b.v}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  INSULATION SYSTEMS                                                 */
/* ------------------------------------------------------------------ */

function InsulationSystems() {
  const items: Product[] = [
    {
      img: imgPIRCore,
      name: "PIR Core Material",
      desc: "Rigid polyisocyanurate foam, 38–42 kg/m³, λ ≈ 0.022 W/m·K, B-s2,d0 fire behaviour and dimensional stability across 25 years.",
      apps: "Continuous PIR panels for industrial and cold-storage envelopes.",
    },
    {
      img: imgRockCore,
      name: "Rock Wool Core",
      desc: "Stone wool lamella, 90–130 kg/m³, non-combustible A1 / A2-s1,d0, engineered fibre orientation for shear and compression.",
      apps: "Fire-rated wall and roof sandwich panels.",
    },
    {
      img: imgRockPanel,
      name: "Rock Wool Sandwich Panel",
      desc: "Fire-rated stone wool panels, EI 30–EI 240, PPGI facings, tongue-and-groove joint with concealed fixing options.",
      apps: "Fire compartmentation, warehouses, industrial buildings.",
    },
    {
      img: imgFinished,
      name: "Finished Sandwich Panels",
      desc: "Ready-to-install PIR, PUR and rock wool panels — wall, roof and cold-storage profiles, packed and delivered to site.",
      apps: "Turn-key envelope supply during factory ramp-up.",
    },
  ];
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Insulation Systems"
        title="Cores that perform for the life of the building."
        lede="Thermal performance, fire resistance, mechanical strength and long-term durability are set at the core — not at installation."
      />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.name} p={p} />
        ))}
      </div>
      <GridBoard className="mt-10 md:grid-cols-4">
        {[
          { icon: Flame, k: "Fire resistance", v: "A1 / A2 rock wool · B-s2,d0 PIR" },
          { icon: Gauge, k: "Thermal performance", v: "λ 0.022 – 0.040 W/m·K" },
          { icon: Shield, k: "Mechanical strength", v: "Certified shear & compression" },
          { icon: Layers, k: "Long-term durability", v: "25-year dimensional stability" },
        ].map((b) => (
          <BoardCell key={b.k}>
            <b.icon className="size-5 text-accent" strokeWidth={1.5} />
            <div className="text-h4 mt-4 text-foreground">{b.k}</div>
            <p className="text-body mt-2">{b.v}</p>
          </BoardCell>
        ))}
      </GridBoard>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  ACCESSORIES                                                        */
/* ------------------------------------------------------------------ */

function Accessories() {
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Accessories & Consumables"
        title="The small parts that decide the panel's long-term life."
        lede="Structural adhesives, edge sealants and production consumables engineered to match your line speed, panel joint geometry and climate."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <ProductCard
          p={{
            img: imgAdhesive,
            name: "Adhesives & Sealants",
            desc: "Structural PU adhesives for metal / rock wool bonding, 20 L pails; edge and joint sealants for waterproofing panel systems in 310 ml cartridges.",
            apps: "Rock wool lamination, panel joints, cold-storage sealing.",
          }}
        />
        <SurfaceCard padded={false} className="overflow-hidden">
          <div className="flex flex-col gap-6 p-8 sm:p-10">
            {[
              { icon: Layers, k: "Panel bonding", v: "PU structural adhesives specified per facing / core combination." },
              { icon: Shield, k: "Waterproofing", v: "Butyl and hybrid sealants for concealed and standing-seam joints." },
              { icon: Gauge, k: "Production efficiency", v: "Open times and viscosity tuned to your line speed and belt temperature." },
            ].map((b) => (
              <div key={b.k} className="flex gap-4 border-b border-border pb-6 last:border-0 last:pb-0">
                <b.icon className="size-5 shrink-0 text-accent" strokeWidth={1.5} />
                <div>
                  <div className="font-semibold text-foreground">{b.k}</div>
                  <p className="text-body mt-1">{b.v}</p>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  ENGINEERING BEFORE PROCUREMENT                                     */
/* ------------------------------------------------------------------ */

function EngineeringBefore() {
  const impacts = [
    { k: "Panel quality", v: "Facing flatness, core density and adhesive selection define the panel a customer receives." },
    { k: "Production speed", v: "Reactivity profile and coil geometry determine the maximum stable belt speed." },
    { k: "Machine stability", v: "Consistent chemistry and steel gauge protect the laminator, cutter and stacker from stoppages." },
    { k: "Waste reduction", v: "Correct material specification cuts trim, rework and off-grade production." },
    { k: "Energy efficiency", v: "Reactivity and curing profile directly reduce kWh per ton produced." },
    { k: "Fire rating", v: "MDI index, polyol chemistry and core density set the panel's classified fire performance." },
    { k: "Customer satisfaction", v: "Every complaint on a finished building traces back to a material decision made at procurement." },
  ];
  return (
    <Section tone="primary" bordered={false}>
      <SectionHeader
        eyebrow="Engineering Before Procurement"
        title="Materials are engineered decisions — not shopping-list items."
        lede="NEVO is an engineering company. Every raw material we deliver is selected against production data, panel specification and market conditions — not against price alone."
        onTone="primary"
      />
      <div className="grid gap-px overflow-hidden rounded-lg bg-white/10 md:grid-cols-2 lg:grid-cols-3">
        {impacts.map((i) => (
          <div key={i.k} className="bg-primary p-7">
            <Check className="size-5 text-accent" strokeWidth={2} />
            <div className="mt-4 text-lg font-semibold text-primary-foreground">
              {i.k}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">
              {i.v}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  LOGISTICS                                                          */
/* ------------------------------------------------------------------ */

function Logistics() {
  const bays = [
    { img: imgWhRaw, k: "Raw Material Warehouse", v: "Palletised chemistry, insulation and consumables under climate control." },
    { img: imgWhCoil, k: "Steel Coil Warehouse", v: "Coil storage on cradles with humidity and temperature monitoring." },
    { img: imgWhChem, k: "Chemical Storage", v: "IBC and drum bays with bunded flooring, spill kits and FIFO rotation." },
    { img: imgWhShip, k: "Loading & Shipping", v: "Container loading with lashing plans, seal control and shipment documentation." },
  ];
  const points = [
    { icon: Package, k: "Inventory control", v: "Live SKU-level stock in Jebel Ali with safety-stock rules per critical material." },
    { icon: Ship, k: "International logistics", v: "FCL, LCL and consolidated container programmes across GCC, Levant, Africa and CIS." },
    { icon: Warehouse, k: "Global sourcing", v: "Dual-source mills and chemical producers qualified against NEVO technical criteria." },
    { icon: Shield, k: "Quality assurance", v: "Inspection at origin, in-transit tracking and inbound QC at destination." },
    { icon: Factory, k: "Container loading", v: "Engineered load plans protect coils, IBCs and panels through long-haul transit." },
    { icon: Check, k: "Supply chain reliability", v: "Transparent ETAs, dedicated coordinators and escalation SLAs on every shipment." },
  ];
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Warehousing & Logistics"
        title="Materials that arrive on time, in specification, ready to run."
        lede="A global supply chain engineered around your production schedule — not the other way round."
      />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {bays.map((b) => (
          <figure
            key={b.k}
            className="overflow-hidden rounded-lg border border-border bg-background"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-black">
              <img
                src={b.img}
                alt={b.k}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="p-5">
              <div className="font-semibold text-foreground">{b.k}</div>
              <p className="text-body mt-2 text-sm">{b.v}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <GridBoard className="mt-10 md:grid-cols-3">
        {points.map((p) => (
          <BoardCell key={p.k}>
            <p.icon className="size-5 text-accent" strokeWidth={1.5} />
            <div className="text-h4 mt-4 text-foreground">{p.k}</div>
            <p className="text-body mt-2">{p.v}</p>
          </BoardCell>
        ))}
      </GridBoard>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  QUALITY ASSURANCE                                                  */
/* ------------------------------------------------------------------ */

function QualityAssurance() {
  const items = [
    { k: "Supplier qualification", v: "Mills and chemical producers audited against technical and commercial criteria before onboarding." },
    { k: "Batch traceability", v: "Every coil, IBC and pallet carries a batch identifier traceable from source to your factory gate." },
    { k: "Incoming inspection", v: "Dimensional, mechanical and chemical checks at origin and destination warehouse." },
    { k: "Material compatibility", v: "Cross-validated polyol/MDI/facing combinations avoid foaming and adhesion incidents." },
    { k: "Technical verification", v: "Certificates of analysis, mill test certificates and fire test reports on every delivery." },
    { k: "Factory integration", v: "Materials commissioned into your production process with NEVO engineers on the belt." },
  ];
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Quality Assurance"
        title="Traceable from source mill to your production line."
        lede="Six controls, applied to every SKU, on every shipment."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <div key={i.k} className="rounded-lg border border-border bg-background p-6">
            <Check className="size-5 text-accent" strokeWidth={2} />
            <div className="mt-4 font-semibold text-foreground">{i.k}</div>
            <p className="text-body mt-2">{i.v}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  DOWNLOADS                                                          */
/* ------------------------------------------------------------------ */

function Downloads() {
  const files = [
    "Raw Material Catalogue",
    "Steel Guide",
    "PIR Technical Guide",
    "Rock Wool Guide",
    "Material Selection Guide",
    "Engineering Checklist",
  ];
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Downloads"
        title="Technical documentation for your engineering team."
        lede="Specifications, selection guides and pre-procurement checklists. Available on request — send us a note with the form below."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((f) => (
          <a
            key={f}
            href="/project-inquiry"
            className="group flex items-center justify-between rounded-lg border border-border bg-background p-5 transition-colors hover:border-border-strong hover:bg-surface"
          >
            <div className="flex items-center gap-4">
              <FileText className="size-5 text-accent" strokeWidth={1.5} />
              <div>
                <div className="font-semibold text-foreground">{f}</div>
                <div className="mt-0.5 text-xs uppercase tracking-widest text-muted-foreground">
                  PDF · On request
                </div>
              </div>
            </div>
            <Download className="size-4 text-muted-foreground transition-transform group-hover:translate-y-0.5 group-hover:text-foreground" />
          </a>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */

function FAQ() {
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Frequently Asked Questions"
        title="Engineering answers to the questions manufacturers actually ask."
      />
      <div className="mx-auto max-w-4xl">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`q-${i}`}>
              <AccordionTrigger className="text-left text-base font-semibold">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-body">{f.a}</AccordionContent>
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
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const ok = await submitLeadForm(e.currentTarget, {
      source: "raw-materials-inquiry",
      rules: [
        { field: "company", label: "Company" },
        { field: "country", label: "Country" },
        { field: "email", label: "Email", type: "email" },
        { field: "category", label: "Material category" },
      ],
      successTitle: "Quotation request received",
      successDescription: "A NEVO material specialist will respond within one business day.",
    });
    setBusy(false);
    if (ok) formRef.current?.reset();
  }

  return (
    <Section id="inquiry" tone="default">
      <SectionHeader
        eyebrow="Material Inquiry"
        title="Request a technical quotation."
        lede="A NEVO material specialist responds within one business day with a proposal, specification sheet and indicative pricing."
      />
      <form
        ref={formRef}
        className="grid gap-5 md:grid-cols-2"
        onSubmit={onSubmit}
        noValidate
      >
        <Field label="Company" name="company" required />
        <Field label="Country" name="country" required />
        <Field label="Email" name="email" type="email" placeholder="you@company.com" required />
        <Field label="Phone" name="phone" placeholder="+971 …" />
        <Field label="Material category" name="category" placeholder="Steel · Chemistry · Insulation · Panels · Adhesives" required />
        <Field label="Annual demand" name="demand" placeholder="e.g. 2,500 tons steel + 400 t chemistry" />
        <Field label="Panel type" name="paneltype" placeholder="PIR · PUR · Rock wool · Custom" />
        <Field label="Required thickness" name="thickness" placeholder="e.g. 40, 60, 100 mm" />
        <Field label="Required quantity" name="quantity" placeholder="Tons / m² / units" />
        <Field label="Delivery country" name="delivery" />
        <Field label="Project timeline" name="timeline" placeholder="Immediate · Q3 2026 · Ongoing" />
        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Message
          </label>
          <textarea
            name="message"
            rows={5}
            className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
            placeholder="Panel specification, target market, existing line details, certifications required…"
          />
        </div>
        <div className="md:col-span-2">
          <Button size="lg" variant="primary" type="submit" disabled={busy}>
            {busy ? (<><Loader2 className="mr-2 !size-4 animate-spin" /> Sending…</>) : (<>Submit Inquiry <ArrowRight className="!size-4" /></>)}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Your details are used only to respond to your inquiry.
          </p>
        </div>
      </form>
    </Section>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-medium uppercase tracking-widest text-muted-foreground"
      >
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FINAL CTA                                                          */
/* ------------------------------------------------------------------ */

function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden bg-primary py-24 text-primary-foreground md:py-32">
      <div aria-hidden className="absolute -left-40 top-1/3 size-[520px] rounded-full bg-accent/15 blur-3xl" />
      <div aria-hidden className="absolute -right-32 bottom-0 size-[420px] rounded-full bg-accent/10 blur-3xl" />
      <div className="container-wide relative mx-auto max-w-4xl px-6 text-center lg:px-8">
        <Eyebrow className="justify-center text-accent">Ready when you are</Eyebrow>
        <h2 className="text-h1 mt-6 text-balance text-primary-foreground">
          Choose Better Materials. Manufacture Better Panels.
        </h2>
        <p className="text-body-lg mt-6 text-primary-foreground/70">
          Engineering begins long before production. Talk to a NEVO material engineer
          about the specification behind your next panel.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
            <a href="/project-inquiry">
              Request Material Quotation
              <ArrowRight className="!size-4" />
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10"
          >
            <a href="/project-inquiry">
              Talk to a Material Engineer
              <ArrowUpRight className="!size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
