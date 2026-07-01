import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  FileText,
  ClipboardList,
  Gauge,
  Zap,
  Boxes,
  ShieldCheck,
  TrendingUp,
  Cog,
  Factory,
  Wrench,
  GraduationCap,
  LifeBuoy,
  Building2,
  ScrollText,
  Compass,
  Layers,
  Snowflake,
  Scissors,
  PackageSearch,
  Package,
  Warehouse,
  Bolt,
  FlaskConical,
  Globe2,
  Handshake,
  BadgeCheck,
  MapPin,
  ChevronDown,
} from "lucide-react";

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader, Breadcrumbs } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { SurfaceCard, GridBoard, BoardCell } from "@/components/site/cards";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import heroImg from "@/assets/hero-nevo-line.jpg";
import philosophyImg from "@/assets/engineering-philosophy.jpg";

/* ─────────────────────────────────────────────────────────────
   SEO
   ───────────────────────────────────────────────────────────── */

const TITLE = "Factory Development for Sandwich Panel Manufacturers — NEVO Industrial";
const DESCRIPTION =
  "End-to-end sandwich panel factory development: feasibility, engineering, production lines, raw materials, commissioning and long-term support. Engineered by NEVO in Dubai for global investors.";
const CANONICAL = "/solutions/factory-development";

const FAQS: { q: string; a: string }[] = [
  { q: "How much investment is required to build a sandwich panel factory?", a: "Depending on capacity, target panel spectrum and level of automation, a modern PIR/PUR sandwich panel factory typically ranges from USD 3–6M for a small plant to USD 25M+ for an industrial mega plant. NEVO prepares a detailed CAPEX and OPEX model as part of the feasibility study." },
  { q: "What production capacity should I choose for a new factory?", a: "Capacity should be engineered to the served market, not the machine catalogue. We start from panel demand, transport radius and product mix, then reverse-engineer the required continuous or discontinuous line throughput." },
  { q: "How much land is needed for a sandwich panel factory?", a: "A small line typically fits on 8,000–12,000 m² including yard and storage. A medium plant needs 15,000–25,000 m², and a large plant 30,000–60,000 m². Storage of PPGI coils, finished panels and buffers usually dominates the footprint." },
  { q: "How many operators are required to run the factory?", a: "A continuous line typically runs with 12–18 operators per shift including QC, cutting, stacking and packaging. Discontinuous lines need fewer operators but more shift changes. We size the crew as part of layout engineering." },
  { q: "How long does factory commissioning take?", a: "From equipment arrival to steady production, commissioning typically takes 6–10 weeks. NEVO engineers commission mechanically, electrically and process-wise, then run panel trials against your target spectrum before hand-off." },
  { q: "Can the factory be expanded later?", a: "Yes — we design master plans with a Phase 2 corridor for a second line, additional injection capacity or extended packaging. Utility rooms, foundations and yard flow are sized for the final footprint from day one." },
  { q: "PIR or PUR — which chemistry should I choose?", a: "PIR delivers higher fire performance and better long-term thermal stability, and is standard for cold storage and clean rooms. PUR remains cost-competitive for warehousing and commercial buildings. Many factories run both on the same continuous line." },
  { q: "What panel thicknesses can a continuous line produce?", a: "Modern continuous lines produce PIR/PUR panels from 40 mm to 200 mm, and up to 240 mm on specialist configurations. Panel width is typically 1,000–1,200 mm with configurable profiles." },
  { q: "What raw materials do I need to secure before production?", a: "PPGI coils, PIR/PUR chemicals (polyol and MDI), edge tape, protective film and pallets. NEVO's raw material desk secures long-term supply from qualified mills and chemical majors." },
  { q: "What utilities does a sandwich panel factory need?", a: "Typically 800–2,500 kVA electrical supply, compressed air (10–15 bar), chilled water for the double belt, hot oil or steam for curing, and diesel or gas for start-up. Utility engineering is delivered as a separate package." },
  { q: "How is fire performance certified?", a: "Panels are tested to EN 13501-1 (Euroclass B-s1,d0 and above), and cold storage panels often add FM Approvals or LPCB. We engineer the recipe, joint and facing combination to reach your target class." },
  { q: "Do you support both continuous and discontinuous lines?", a: "Yes. Continuous lines suit high-volume, standardized production; discontinuous lines suit thicker insulated panels, low volumes and specialty products. Selection is driven by market fit, not preference." },
  { q: "Can NEVO help with permits and government approvals?", a: "We prepare the technical dossier — process description, emissions, safety and utility loads — that local consultants use to secure permits. In several markets we work directly with a local partner network." },
  { q: "Which markets do you deliver factories to?", a: "Active projects across Saudi Arabia, UAE, Oman, Turkey, Iraq, Russia, Kenya, Cameroon and wider Africa. Our Dubai HQ gives fast logistics access to MENA, CIS and East Africa." },
  { q: "Do you provide operator and maintenance training?", a: "Yes — structured training for line operators, chemists, maintenance and QC, both on-site during commissioning and periodically after hand-off. Digital training material is included." },
  { q: "What quality control equipment is needed?", a: "A basic QC lab includes core density, compressive strength, bond strength, dimensional stability and reaction-to-fire preconditioning. We specify equipment and SOPs during engineering." },
  { q: "How long does the full project take, from decision to production?", a: "Typical timelines run 12–18 months from signed feasibility to first commercial panels, depending on civil works and equipment lead times. Mega plants extend to 24 months." },
  { q: "Are the production lines automated?", a: "Modern lines are heavily automated — recipe control, thickness control, cut-to-length, stacking robots and vision QC. We select automation depth against payback, not fashion." },
  { q: "Can NEVO retrofit an existing factory instead of building new?", a: "Yes. Common retrofits include chemistry upgrades (PUR → PIR), thickness range extension, cutting/stacking automation and QC digitalization. We audit the plant first, then engineer the upgrade." },
  { q: "What is included in long-term support?", a: "Spare parts programs, remote diagnostics, annual audits, chemistry re-optimization, operator refreshers and market-driven product development. Support is contractual, not ad-hoc." },
];

/* ─────────────────────────────────────────────────────────────
   Route
   ───────────────────────────────────────────────────────────── */

export const Route = createFileRoute("/solutions/factory-development")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Sandwich Panel Factory Development",
          provider: {
            "@type": "Organization",
            name: "NEVO Industrial",
            address: { "@type": "PostalAddress", addressLocality: "Dubai", addressCountry: "AE" },
          },
          areaServed: ["Saudi Arabia", "UAE", "Oman", "Turkey", "Iraq", "Kenya", "Cameroon", "Russia"],
          description: DESCRIPTION,
          url: CANONICAL,
        }),
      },
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
            { "@type": "ListItem", position: 3, name: "Factory Development", item: CANONICAL },
          ],
        }),
      },
    ],
  }),
  component: FactoryDevelopmentPage,
});

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

function FactoryDevelopmentPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />
      <main>
        <PageHero />
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Solutions", href: "/solutions" },
            { label: "Factory Development" },
          ]}
        />
        <EngineeringFirst />
        <CompleteScope />
        <ProcessTimeline />
        <CapacityOptions />
        <FactoryComponents />
        <WhyInvestors />
        <InvestmentResources />
        <FactoryFAQ />
        <CaseStudies />
        <ProjectInquiry />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HERO
   ───────────────────────────────────────────────────────────── */

function PageHero() {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <img
        src={heroImg}
        alt="Sandwich panel factory production line engineered by NEVO"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
        style={{ objectPosition: "70% center" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,14,20,0.95)_0%,rgba(10,14,20,0.75)_45%,rgba(10,14,20,0.4)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-primary/90 to-transparent"
      />

      <div className="container-wide relative z-10 px-5 pb-24 pt-32 sm:px-6 md:pb-32 md:pt-40 lg:px-8 lg:pb-40 lg:pt-48">
        <div className="max-w-3xl">
          <Eyebrow className="text-white/70">Factory Development</Eyebrow>
          <h1 className="text-display mt-6 text-balance text-white">
            Build Your Sandwich Panel Factory with Confidence.
          </h1>
          <p className="text-body-lg mt-8 max-w-2xl text-white/75">
            From feasibility studies and engineering to production lines, raw materials
            and commissioning — NEVO delivers complete factory development solutions,
            engineered end-to-end from Dubai for global investors.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <a href="#inquiry">
                Start Your Factory Project
                <ArrowUpRight className="!size-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <a href="#inquiry">
                Talk to an Engineer
                <ArrowRight className="!size-4" />
              </a>
            </Button>
          </div>

          <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 border-t border-white/15 pt-8 md:grid-cols-4">
            {[
              { k: "12–24", v: "Month build" },
              { k: "8+", v: "Global markets" },
              { k: "PIR · PUR", v: "Chemistries" },
              { k: "40–240", v: "Panel mm range" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-mono text-[11px] uppercase tracking-widest text-white/50">
                  {s.v}
                </dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tight text-white">
                  {s.k}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 1 — Engineering-first
   ───────────────────────────────────────────────────────────── */

function EngineeringFirst() {
  const pillars = [
    { icon: ClipboardList, label: "Factory planning", desc: "Land, layout, phasing, expansion corridor." },
    { icon: Gauge, label: "Production capacity", desc: "Reverse-engineered from market demand." },
    { icon: TrendingUp, label: "Future expansion", desc: "Phase 2 corridor sized on day one." },
    { icon: Zap, label: "Utilities", desc: "Power, chilled water, compressed air, thermal fluid." },
    { icon: Boxes, label: "Material flow", desc: "Coil to warehouse, engineered without backtracks." },
    { icon: Cog, label: "Automation", desc: "Cut, stack, pack and QC — sized against payback." },
    { icon: ShieldCheck, label: "Safety", desc: "Chemistry, fire, evacuation, HSE by design." },
    { icon: TrendingUp, label: "ROI", desc: "CAPEX, OPEX, payback modeled per market." },
  ];

  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Why factories start with engineering"
        title="A sandwich panel factory is a system, not a purchase."
        lede="Before a single coil is ordered, our engineers define target output, panel spectrum, plant footprint, utilities and logistics — then engineer the line around that reality."
        aside={
          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 md:inline-flex">
            <span className="inline-flex size-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Fig. 01 · Engineering scope
            </span>
          </div>
        }
      />

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <ul className="lg:col-span-7 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {pillars.map((p) => (
            <li key={p.label} className="bg-background p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border text-foreground">
                  <p.icon className="size-[18px]" strokeWidth={1.6} />
                </span>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold tracking-tight text-foreground">{p.label}</div>
                  <div className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{p.desc}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="lg:col-span-5">
          <EngineeringDiagram />
        </div>
      </div>
    </Section>
  );
}

function EngineeringDiagram() {
  // Simple, technical block-flow diagram (SVG). Represents scope, not a real drawing.
  return (
    <figure className="relative overflow-hidden rounded-xl border border-border bg-surface p-5">
      <figcaption className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Factory scope · block flow
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Rev A · NEVO
        </span>
      </figcaption>
      <svg viewBox="0 0 340 260" className="block h-auto w-full">
        <defs>
          <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" className="fill-foreground/50" />
          </marker>
        </defs>
        {[
          { x: 12, y: 18, w: 90, h: 32, label: "PPGI Coils" },
          { x: 125, y: 18, w: 90, h: 32, label: "Feeding" },
          { x: 238, y: 18, w: 90, h: 32, label: "Roll Form" },
          { x: 12, y: 74, w: 90, h: 32, label: "PIR/PUR" },
          { x: 125, y: 74, w: 90, h: 32, label: "Double Belt" },
          { x: 238, y: 74, w: 90, h: 32, label: "Cooling" },
          { x: 12, y: 130, w: 90, h: 32, label: "Cutting" },
          { x: 125, y: 130, w: 90, h: 32, label: "Stacking" },
          { x: 238, y: 130, w: 90, h: 32, label: "Packing" },
          { x: 12, y: 186, w: 90, h: 32, label: "QC Lab" },
          { x: 125, y: 186, w: 90, h: 32, label: "Warehouse" },
          { x: 238, y: 186, w: 90, h: 32, label: "Dispatch" },
        ].map((b) => (
          <g key={b.label}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="4" className="fill-background stroke-border" />
            <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 4} textAnchor="middle" className="fill-foreground" style={{ font: "500 10px Inter, sans-serif" }}>
              {b.label}
            </text>
          </g>
        ))}
        {/* horizontal arrows */}
        {[18, 74, 130, 186].map((y) => (
          <g key={y}>
            <line x1="103" y1={y + 16} x2="124" y2={y + 16} className="stroke-foreground/40" strokeWidth="1" markerEnd="url(#arr)" />
            <line x1="216" y1={y + 16} x2="237" y2={y + 16} className="stroke-foreground/40" strokeWidth="1" markerEnd="url(#arr)" />
          </g>
        ))}
        {/* vertical hop from PIR/PUR up */}
        <line x1="170" y1="50" x2="170" y2="73" className="stroke-accent" strokeWidth="1.2" markerEnd="url(#arr)" />
        <circle cx="170" cy="90" r="18" className="fill-accent/15 stroke-accent" strokeDasharray="2 3" />
      </svg>
    </figure>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 2 — Complete Scope
   ───────────────────────────────────────────────────────────── */

function CompleteScope() {
  const items = [
    { icon: Compass, title: "Factory Feasibility Study", desc: "Market demand, panel spectrum, CAPEX/OPEX, IRR." },
    { icon: ClipboardList, title: "Master Planning", desc: "Site strategy, phasing, expansion corridor." },
    { icon: Building2, title: "Factory Layout", desc: "Material flow, utility rooms, safety and HSE." },
    { icon: Zap, title: "Utility Engineering", desc: "Power, chilled water, air, thermal fluid." },
    { icon: Wrench, title: "Machine Selection", desc: "Technology-neutral, matched to market fit." },
    { icon: Factory, title: "Production Line Engineering", desc: "Continuous, discontinuous, roll forming." },
    { icon: Cog, title: "Automation", desc: "Cutting, stacking, packaging, vision QC." },
    { icon: BadgeCheck, title: "Commissioning", desc: "Mechanical, electrical and process ramp-up." },
    { icon: GraduationCap, title: "Operator Training", desc: "Line, QC, maintenance and chemistry." },
    { icon: LifeBuoy, title: "After Sales Support", desc: "Spares, audits, remote diagnostics, upgrades." },
  ];
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Our complete scope"
        title="Ten disciplines. One engineered factory."
        lede="NEVO delivers the full stack of factory development — from the feasibility study that decides go / no-go to the long-term partnership that keeps the plant producing."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <li key={it.title}>
            <SurfaceCard interactive className="h-full">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-md border border-border text-foreground transition-colors group-hover:border-accent group-hover:text-accent">
                  <it.icon className="size-[18px]" strokeWidth={1.6} />
                </span>
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-6 text-[15px] font-semibold tracking-tight text-foreground">
                {it.title}
              </h3>
              <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
                {it.desc}
              </p>
            </SurfaceCard>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 3 — Process timeline
   ───────────────────────────────────────────────────────────── */

function ProcessTimeline() {
  const steps = [
    { n: "01", t: "Project Discovery", d: "Market, ambition, constraints, timeline." },
    { n: "02", t: "Technical Consultation", d: "Panel spectrum, chemistries, target markets." },
    { n: "03", t: "Feasibility Study", d: "CAPEX, OPEX, IRR, sensitivity, go / no-go." },
    { n: "04", t: "Engineering Design", d: "Process, layout, utilities, safety." },
    { n: "05", t: "Equipment Selection", d: "Technology-neutral vendor engineering." },
    { n: "06", t: "Factory Layout", d: "Material flow, storage, expansion corridor." },
    { n: "07", t: "Installation", d: "Civil interface, mechanical & electrical." },
    { n: "08", t: "Commissioning", d: "Process ramp, panel trials, sign-off." },
    { n: "09", t: "Training", d: "Operators, chemists, maintenance, QC." },
    { n: "10", t: "Long-Term Support", d: "Spares, audits, upgrades, chemistry." },
  ];

  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Factory development process"
        title="A predictable path from decision to steady production."
        lede="Each stage has clear deliverables and gates. You always know where the project stands, what's next and what it will cost."
      />
      <ol className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-5">
        {steps.map((s) => (
          <li key={s.n} className="group relative flex flex-col justify-between bg-background p-6 transition-colors hover:bg-surface">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-widest text-muted-foreground">STEP {s.n}</span>
              <span className="h-px w-8 bg-accent" />
            </div>
            <div className="mt-8">
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{s.t}</h3>
              <p className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 4 — Capacity options
   ───────────────────────────────────────────────────────────── */

function CapacityOptions() {
  const tiers = [
    {
      name: "Small Factory",
      output: "300k – 600k m² / year",
      capex: "USD 3 – 6M",
      market: "Regional cold storage & warehousing",
      expansion: "Phase 2 line ready",
      featured: false,
    },
    {
      name: "Medium Factory",
      output: "800k – 1.5M m² / year",
      capex: "USD 6 – 12M",
      market: "National contractors & industrial builds",
      expansion: "Second continuous line + storage",
      featured: true,
    },
    {
      name: "Large Factory",
      output: "1.8M – 3M m² / year",
      capex: "USD 12 – 22M",
      market: "Multi-country distribution",
      expansion: "Twin line + specialty PIR",
      featured: false,
    },
    {
      name: "Industrial Mega Plant",
      output: "3M+ m² / year",
      capex: "USD 25M+",
      market: "Regional hub & export",
      expansion: "Multi-line, dedicated logistics",
      featured: false,
    },
  ];
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Factory capacity options"
        title="Sized against your market — not the catalogue."
        lede="Four reference configurations we build and commission worldwide. Every plant is finalized against your panel spectrum, market fit and expansion horizon."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={cn(
              "relative flex flex-col rounded-xl border p-6 transition-all",
              t.featured
                ? "border-primary bg-primary text-primary-foreground shadow-panel-lg"
                : "border-border bg-background hover:border-border-strong",
            )}
          >
            {t.featured && (
              <span className="absolute -top-3 left-6 rounded-full bg-accent px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary">
                Most engineered
              </span>
            )}
            <h3 className={cn("text-[17px] font-semibold tracking-tight", t.featured ? "text-white" : "text-foreground")}>
              {t.name}
            </h3>
            <div className={cn("mt-1 h-px w-8", t.featured ? "bg-accent" : "bg-accent")} />

            <dl className="mt-6 space-y-4 text-[13px]">
              {[
                { k: "Output", v: t.output },
                { k: "Investment range", v: t.capex },
                { k: "Recommended market", v: t.market },
                { k: "Expansion potential", v: t.expansion },
              ].map((row) => (
                <div key={row.k}>
                  <dt className={cn("font-mono text-[10px] uppercase tracking-widest", t.featured ? "text-white/50" : "text-muted-foreground")}>
                    {row.k}
                  </dt>
                  <dd className={cn("mt-1 font-medium", t.featured ? "text-white" : "text-foreground")}>{row.v}</dd>
                </div>
              ))}
            </dl>

            <a
              href="#inquiry"
              className={cn(
                "mt-8 inline-flex items-center gap-1.5 text-[13px] font-medium",
                t.featured ? "text-white" : "text-foreground",
              )}
            >
              Discuss this scale
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </a>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 5 — Factory components
   ───────────────────────────────────────────────────────────── */

function FactoryComponents() {
  const items = [
    { icon: Warehouse, label: "Raw Material Storage" },
    { icon: PackageSearch, label: "PPGI Feeding" },
    { icon: Cog, label: "Roll Forming" },
    { icon: FlaskConical, label: "PU / PIR Injection" },
    { icon: Layers, label: "Double Belt" },
    { icon: Snowflake, label: "Cooling" },
    { icon: Scissors, label: "Cutting" },
    { icon: Boxes, label: "Stacking" },
    { icon: Package, label: "Packaging" },
    { icon: Warehouse, label: "Warehouse" },
    { icon: Bolt, label: "Utilities" },
    { icon: FlaskConical, label: "QC Laboratory" },
  ];
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Typical factory components"
        title="Every discipline, engineered as one system."
        lede="Twelve functional blocks make up a modern sandwich panel factory. NEVO engineers all of them — from PPGI feeding to the QC laboratory that certifies your panels."
      />
      <GridBoard className="sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it, i) => (
          <BoardCell key={it.label} interactive>
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-md border border-border text-foreground transition-colors group-hover:border-accent group-hover:text-accent">
                <it.icon className="size-5" strokeWidth={1.5} />
              </span>
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-6 text-[14px] font-semibold tracking-tight text-foreground">
              {it.label}
            </div>
          </BoardCell>
        ))}
      </GridBoard>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 6 — Why investors choose NEVO
   ───────────────────────────────────────────────────────────── */

function WhyInvestors() {
  const rows = [
    { icon: Cog, t: "Engineering first", d: "We design the factory before we specify the machine." },
    { icon: Globe2, t: "Global supply chain", d: "PPGI, PIR/PUR chemistries and equipment across three continents." },
    { icon: BadgeCheck, t: "Technology neutral", d: "We recommend the right vendor — not our preferred vendor." },
    { icon: Wrench, t: "Premium equipment", d: "Only long-track-record OEMs, engineered to your spectrum." },
    { icon: MapPin, t: "International experience", d: "Active projects across GCC, CIS, Turkey and Africa." },
    { icon: ClipboardList, t: "Complete project management", d: "One team, one plan, one point of accountability." },
    { icon: Building2, t: "Dubai headquarters", d: "Logistics and time-zone reach into MENA, CIS and East Africa." },
    { icon: Handshake, t: "Long-term partnership", d: "We stay on after commissioning — spares, audits, growth." },
  ];
  return (
    <Section tone="primary" className="text-primary-foreground">
      <SectionHeader
        onTone="primary"
        eyebrow="Why investors choose NEVO"
        title="An engineering partner, not a machinery supplier."
        lede="NEVO is engaged before the vendor conversation begins — and stays engaged long after commissioning is signed off."
      />
      <ul className="grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((r) => (
          <li key={r.t} className="bg-[color:var(--primary)] p-6">
            <span className="grid size-10 place-items-center rounded-md border border-white/20 text-white">
              <r.icon className="size-[18px]" strokeWidth={1.6} />
            </span>
            <h3 className="mt-6 text-[15px] font-semibold tracking-tight text-white">{r.t}</h3>
            <p className="mt-2 text-[13px] leading-snug text-white/65">{r.d}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 7 — Investment Resources
   ───────────────────────────────────────────────────────────── */

function InvestmentResources() {
  const downloads = [
    { icon: ScrollText, title: "Factory Investment Guide", meta: "PDF · 48 pages" },
    { icon: ClipboardList, title: "Factory Planning Checklist", meta: "PDF · 12 pages" },
    { icon: Zap, title: "Utility Requirement Guide", meta: "PDF · 18 pages" },
    { icon: FileText, title: "Project Timeline", meta: "PDF · 8 pages" },
    { icon: TrendingUp, title: "Budget Planning Guide", meta: "PDF · 22 pages" },
  ];

  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Investment resources"
        title="Engineered PDFs for serious investors."
        lede="Free, in-depth references that our engineers use with clients. No fluff, no gated funnels — the technical detail you need to plan a real project."
        aside={
          <a
            href="#inquiry"
            className="hidden items-center gap-1.5 text-[13px] font-medium text-foreground hover:text-accent md:inline-flex"
          >
            Request full library
            <ArrowRight className="size-3.5" strokeWidth={2} />
          </a>
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {downloads.map((d) => (
          <li key={d.title}>
            <a
              href="#"
              className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-5 transition-colors hover:border-border-strong hover:bg-surface"
              data-schema="DigitalDocument"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-md border border-border text-foreground transition-colors group-hover:border-accent group-hover:text-accent">
                  <d.icon className="size-[18px]" strokeWidth={1.6} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold tracking-tight text-foreground">
                    {d.title}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    {d.meta}
                  </div>
                </div>
              </div>
              <Download className="size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-accent" strokeWidth={1.75} />
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 8 — FAQ (20+)
   ───────────────────────────────────────────────────────────── */

function FactoryFAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Factory FAQ"
        title="Answers our engineers give investors, every week."
        lede="Twenty engineering-focused questions we hear most often from investors planning a new sandwich panel factory."
      />
      <ul className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-border bg-background">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <li key={f.q} className={cn("border-b border-border last:border-0")}>
              <button
                className="flex w-full items-start justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-surface"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className="flex min-w-0 items-start gap-4">
                  <span className="mt-0.5 font-mono text-[11px] tracking-widest text-muted-foreground">
                    Q{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[14.5px] font-medium tracking-tight text-foreground">
                    {f.q}
                  </span>
                </span>
                <ChevronDown
                  className={cn("mt-1 size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                  strokeWidth={2}
                />
              </button>
              <div
                className={cn(
                  "grid overflow-hidden px-6 transition-[grid-template-rows,padding] duration-[220ms] ease-[var(--ease-out-quart)]",
                  isOpen ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]",
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <p className="ml-[68px] max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
                    {f.a}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 9 — Case studies
   ───────────────────────────────────────────────────────────── */

function CaseStudies() {
  const cases = [
    { tag: "Factory Planning", title: "Feasibility for a 1.2M m² PIR plant, GCC", region: "Saudi Arabia" },
    { tag: "Engineering", title: "Layout & utility engineering, East Africa", region: "Kenya" },
    { tag: "Commissioning", title: "Continuous line commissioning, CIS", region: "Russia" },
    { tag: "Production Optimization", title: "Chemistry retrofit, PUR → PIR upgrade", region: "Turkey" },
    { tag: "Industrial Expansion", title: "Phase 2 line for a national manufacturer", region: "UAE" },
  ];
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Case studies"
        title="Factories, not brochures."
        lede="A selection of active and delivered projects across our core regions. Full case studies available under NDA."
      />
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cases.map((c, i) => (
          <li key={c.title}>
            <a
              href="#"
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-border bg-background transition-all hover:border-border-strong"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                <img
                  src={i % 2 === 0 ? philosophyImg : heroImg}
                  alt={c.title}
                  className="h-full w-full object-cover opacity-90 transition-transform duration-[500ms] group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-black/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur">
                  {c.tag}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="text-[14.5px] font-semibold tracking-tight text-foreground">
                    {c.title}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    <MapPin className="size-3" strokeWidth={2} />
                    {c.region}
                  </div>
                </div>
                <ArrowUpRight className="mt-1 size-4 text-muted-foreground transition-colors group-hover:text-accent" strokeWidth={2} />
              </div>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION 10 — Project Inquiry
   ───────────────────────────────────────────────────────────── */

function ProjectInquiry() {
  return (
    <Section tone="surface" id="inquiry">
      <SectionHeader
        eyebrow="Project inquiry"
        title="Tell us about your factory."
        lede="The more you share, the sharper our first response. Our engineers reply within one working day with a structured next step."
      />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <form
          className="lg:col-span-8 grid gap-5 rounded-2xl border border-border bg-background p-6 sm:p-8"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" name="name" placeholder="Your name" />
            <Field label="Company" name="company" placeholder="Company name" />
            <Field label="Country" name="country" placeholder="Country" />
            <Field label="Email" name="email" placeholder="you@company.com" type="email" />
            <Field label="Phone / WhatsApp" name="phone" placeholder="+971 …" />
            <Field label="Project location" name="location" placeholder="City, country" />
            <Select label="Planned capacity" name="capacity" options={[
              "Small — 300k–600k m²/yr",
              "Medium — 800k–1.5M m²/yr",
              "Large — 1.8M–3M m²/yr",
              "Mega — 3M+ m²/yr",
              "Not sure — advise",
            ]} />
            <Select label="Panel type" name="panelType" options={[
              "PIR",
              "PUR",
              "Rockwool",
              "PIR + PUR",
              "Full spectrum",
            ]} />
            <Select label="Estimated investment" name="investment" options={[
              "USD 3–6M",
              "USD 6–12M",
              "USD 12–22M",
              "USD 25M+",
              "To be defined",
            ]} />
            <Select label="Timeline" name="timeline" options={[
              "0–6 months",
              "6–12 months",
              "12–24 months",
              "Exploring",
            ]} />
          </div>
          <div>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Project description
            </label>
            <textarea
              rows={5}
              placeholder="Panel spectrum, target markets, land status, key constraints..."
              className="w-full resize-none rounded-md border border-border bg-background px-3.5 py-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
          </div>
          <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
            <p className="text-[12px] text-muted-foreground">
              By submitting, you agree to be contacted by NEVO's engineering team. No newsletters, no third parties.
            </p>
            <Button type="submit" variant="primary" size="lg">
              Submit inquiry
              <ArrowUpRight className="!size-4" />
            </Button>
          </div>
        </form>

        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-background p-6">
            <Eyebrow>Direct engineering line</Eyebrow>
            <p className="mt-4 text-[14px] text-foreground">
              Prefer a call? Our engineers are reachable in Dubai during GCC and CIS hours, and by WhatsApp worldwide.
            </p>
            <dl className="mt-6 space-y-4 text-[13px]">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">HQ</dt>
                <dd className="mt-1 font-medium text-foreground">Dubai, UAE</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Response</dt>
                <dd className="mt-1 font-medium text-foreground">Within one working day</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">NDA</dt>
                <dd className="mt-1 font-medium text-foreground">On request, before first exchange</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-2xl border border-border bg-primary p-6 text-primary-foreground">
            <Eyebrow className="text-white/70">What happens next</Eyebrow>
            <ol className="mt-4 space-y-4 text-[13.5px]">
              {[
                "Engineering triage of your submission",
                "30-min technical call — free of charge",
                "Written scope proposal & timeline",
              ].map((t, i) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-white/25 font-mono text-[10px] text-white">
                    {i + 1}
                  </span>
                  <span className="text-white/85">{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </Section>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
      />
    </div>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <select
          id={name}
          name={name}
          className="w-full appearance-none rounded-md border border-border bg-background px-3.5 py-2.5 pr-9 text-[14px] text-foreground focus:border-foreground focus:outline-none"
          defaultValue=""
        >
          <option value="" disabled>
            Select…
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FINAL CTA
   ───────────────────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <div aria-hidden className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(80% 60% at 80% 40%, color-mix(in oklab, var(--accent) 30%, transparent), transparent)" }} />
      <div aria-hidden className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(60% 60% at 10% 80%, color-mix(in oklab, var(--accent) 20%, transparent), transparent)" }} />
      <div className="container-wide relative z-10 px-5 py-24 sm:px-6 md:py-32 lg:px-8">
        <div className="max-w-3xl">
          <Eyebrow className="text-white/70">Let's build together</Eyebrow>
          <h2 className="text-h1 mt-6 text-balance text-white">
            Let's build your factory together.
          </h2>
          <p className="text-body-lg mt-6 max-w-xl text-white/70">
            Bring the ambition. We'll bring the engineering, the supply chain and the delivery discipline.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <a href="#inquiry">
                Request factory consultation
                <ArrowUpRight className="!size-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <a href="#inquiry">
                Schedule an engineering meeting
                <ArrowRight className="!size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
