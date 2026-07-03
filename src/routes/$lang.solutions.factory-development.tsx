import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { SITE, buildSeo } from "@/lib/seo";
import { motion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Factory,
  FileText,
  Gauge,
  Globe2,
  Layers,
  Network,
  PackageSearch,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react";

import heroAsset from "@/assets/premium/24-masterplan.jpg.asset.json";
import surveyAsset from "@/assets/premium/22-site-survey.jpg.asset.json";
import bimAsset from "@/assets/premium/12-engineer-bim.jpg.asset.json";
import commissioningAsset from "@/assets/premium/23-commissioning.jpg.asset.json";
import boardroomAsset from "@/assets/premium/18-boardroom.jpg.asset.json";
import warehouseAsset from "@/assets/premium/04-warehouse-racking.jpg.asset.json";

const heroImg = heroAsset.url;
const investmentImg = boardroomAsset.url;

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { InquiryCTA } from "@/components/site/InquiryCTA";
import { KnowledgeHubPreview } from "@/components/site/KnowledgeHubPreview";
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
import { ogImageMeta } from "@/lib/og-images";

const TITLE =
  "Factory Development — Turnkey Sandwich Panel Factory Engineering | NEVO Industrial";
const DESCRIPTION =
  "NEVO Industrial develops complete sandwich panel factories: feasibility, master planning, layouts, production lines, raw materials, utilities, commissioning and ramp-up support from Dubai.";
const URL_PATH = "/solutions/factory-development";

const PILLARS = [
  { icon: ClipboardList, title: "Feasibility & Business Case", body: "Market demand, product mix, target output, CAPEX model and launch roadmap before equipment selection." },
  { icon: Building2, title: "Factory Master Planning", body: "Land use, hall geometry, material flow, utilities, expansion zones and installation access engineered as one system." },
  { icon: Wrench, title: "Production Technology", body: "Continuous or discontinuous lines, roll forming, foaming, cutting, stacking, packaging and automation architecture." },
  { icon: PackageSearch, title: "Raw Material Strategy", body: "PPGI, GI, Aluzinc, PIR/PUR chemistry, rock wool, adhesives and safety stock defined around the production plan." },
  { icon: ShieldCheck, title: "Quality & Compliance", body: "EN, ASTM, GOST, SASO and local requirements translated into process controls, test plans and documentation." },
  { icon: Gauge, title: "Ramp-Up & OEE", body: "Commissioning, operator training, recipe stabilization, waste reduction and performance reporting after first panels." },
];

const SCOPE = [
  { title: "01 / Site & Market Definition", image: surveyAsset.url, body: "Location, utilities, logistics, climate, labour model and target customer segments." },
  { title: "02 / Process Layout", image: bimAsset.url, body: "Coil storage, chemical room, line hall, QC lab, finished goods and loading circulation." },
  { title: "03 / Production System", image: commissioningAsset.url, body: "Line sizing, equipment specifications, automation levels and future upgrade envelopes." },
  { title: "04 / Material Flow", image: warehouseAsset.url, body: "Incoming materials, FIFO control, safety stock, packaging, dispatch and traceability." },
];

const PROCESS = [
  "Site Assessment",
  "Feasibility & Business Case",
  "Master Planning",
  "Building & Utility Design",
  "Contractor Coordination",
  "Construction Supervision",
  "Handover & Commissioning",
  "Operational Ramp-Up",
];

const SYSTEMS = [
  "Continuous PIR/PUR panel lines",
  "Rock wool lamella handling and panel lines",
  "Roll forming and profile tooling",
  "Chemical storage, dosing and foaming systems",
  "Compressed air, chilled water, exhaust and fire systems",
  "SCADA, PLC, recipe control and production reporting",
  "QC laboratory, sampling routines and traceability",
  "Finished goods, packing and dispatch systems",
];

export const Route = createFileRoute("/$lang/solutions/factory-development")({
  head: ({ params }) => {
    const canonical = `${SITE.url}/${params.lang}${URL_PATH}`;
    const seo = buildSeo({
      title: TITLE,
      description: DESCRIPTION,
      path: URL_PATH,
      lang: params.lang,
      keywords: [
        "turnkey sandwich panel factory",
        "sandwich panel plant development",
        "sandwich panel manufacturing plant",
        "factory master planning",
        "PIR panel factory",
        "PUR panel factory setup",
        "greenfield sandwich panel investment",
        "sandwich panel factory Dubai",
      ],
    });
    return {
      ...seo,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Turnkey Sandwich Panel Factory Development",
            serviceType: "Turnkey industrial factory development",
            provider: { "@type": "Organization", name: SITE.name, url: SITE.url },
            areaServed: ["AE", "SA", "OM", "QA", "KW", "TR", "IQ", "KE", "CM", "RU"],
            url: canonical,
            description: DESCRIPTION,
            category: ["Feasibility", "Master planning", "Building & utilities", "Line procurement", "Commissioning", "Ramp-up"],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/${params.lang}` },
              { "@type": "ListItem", position: 2, name: "Solutions", item: `${SITE.url}/${params.lang}/solutions` },
              { "@type": "ListItem", position: 3, name: "Factory Development", item: canonical },
            ],
          }),
        },
      ],
    };
  },
  component: FactoryDevelopmentPage,
});

function FactoryDevelopmentPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />
      <main>
        <PageHero />
        <Breadcrumbs />
        <Pillars />
        <FactorySystem />
        <ScopeGrid />
        <DevelopmentProcess />
        <InvestmentModel />
        <ConnectedSolutions />
        <KnowledgeHubPreview slugs={["factory-layout", "investment-model", "continuous-line-101"]} />
        <InquiryCTA
          source="new-factory"
          eyebrow="Factory inquiry"
          title="Start scoping your greenfield factory."
          lede="Share your target market, capacity and site. We respond with a scoped development plan — feasibility, master plan, building, utilities and commissioning — within one business day."
          ctaLabel="Start Factory Inquiry"
        />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

function PageHero() {
  return (
    <section className="relative isolate -mt-20 overflow-hidden bg-black text-white md:-mt-24">
      <h1 className="sr-only">Factory Development for Sandwich Panel Manufacturing — NEVO Industrial</h1>
      <div className="relative min-h-[80vh] lg:min-h-[90vh]">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img
            src={heroImg}
            alt="NEVO engineered sandwich panel factory development concept"
            className="h-full w-full object-cover"
            style={{ objectPosition: "70% center", transform: "scale(1.04)" }}
            fetchPriority="high"
          />
          <div aria-hidden className="absolute inset-y-0 left-0 w-[55%] bg-black" />
          <div
            aria-hidden
            className="absolute inset-y-0 left-[55%] w-[24%]"
            style={{ background: "linear-gradient(90deg, rgba(0,0,0,1), rgba(0,0,0,0.58), rgba(0,0,0,0.16))" }}
          />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/75 to-transparent" />
        </div>

        <div className="container-wide relative flex min-h-[80vh] flex-col justify-between px-6 pt-36 pb-12 lg:min-h-[90vh] lg:px-8 lg:pt-44 lg:pb-16">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }} className="max-w-3xl">
            <div className="eyebrow mb-6 flex items-center gap-2 text-white/70">
              <span className="inline-flex size-1.5 rounded-full bg-accent" />
              Solutions · Factory Development
            </div>
            <p aria-hidden className="text-display text-balance text-white">
              Build a Sandwich Panel Factory <span className="text-accent">That Works From Day One.</span>
            </p>
            <p className="text-body-lg mt-8 max-w-2xl text-white/75">
              NEVO engineers the complete factory system — feasibility, layout, equipment, materials, utilities, commissioning and ramp-up — before procurement begins.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <a href="/project-inquiry">Start Factory Inquiry <ArrowRight className="!size-4" /></a>
              </Button>
              <Button asChild size="lg" variant="secondary" className="border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10">
                <a href="/ai-assistant">Ask the AI Engineer <ArrowUpRight className="!size-4" /></a>
              </Button>
            </div>
          </motion.div>

          <div className="hidden gap-8 border-t border-white/15 pt-6 text-[11px] uppercase tracking-widest text-white/60 md:grid md:grid-cols-4">
            <span>Feasibility</span>
            <span>Master Layout</span>
            <span>Line + Raw Materials</span>
            <span>Commissioning</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Breadcrumbs() {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-border bg-background">
      <div className="container-wide flex items-center gap-2 py-4 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ArrowRight className="size-3" />
        <Link to="/solutions" className="hover:text-foreground">Solutions</Link>
        <ArrowRight className="size-3" />
        <span className="text-foreground">Factory Development</span>
      </div>
    </nav>
  );
}

function Pillars() {
  return (
    <Section tone="default">
      <SectionHeader eyebrow="Development pillars" title="Factory development is an engineered sequence — not a shopping list." lede="Every decision affects capacity, cash flow, quality, safety and future expansion. NEVO connects those decisions into one executable factory plan." />
      <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
        {PILLARS.map((p, i) => (
          <div key={p.title} className="group bg-background p-7 transition-colors hover:bg-surface">
            <div className="flex items-center justify-between">
              <p.icon className="size-5 text-accent" strokeWidth={1.6} />
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h2 className="mt-7 text-xl font-semibold tracking-tight text-foreground">{p.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FactorySystem() {
  return (
    <Section tone="primary" bordered={false}>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Eyebrow className="text-accent">Complete factory system</Eyebrow>
          <h2 className="text-h1 mt-6 text-balance text-primary-foreground">The production line is only one part of the factory.</h2>
          <p className="text-body-lg mt-6 text-primary-foreground/70">A profitable panel plant needs the correct building, raw material flow, utility envelope, quality system, automation layer and trained team around the line.</p>
        </div>
        <div className="lg:col-span-7">
          <div className="grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-2">
            {SYSTEMS.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-primary p-5 text-sm text-primary-foreground/80">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function ScopeGrid() {
  return (
    <Section tone="surface">
      <SectionHeader eyebrow="Engineering scope" title="From investment idea to installation-ready factory plan." />
      <div className="grid gap-5 md:grid-cols-2">
        {SCOPE.map((s) => (
          <SurfaceCard key={s.title} className="overflow-hidden p-0">
            <img src={s.image} alt={s.title} className="aspect-[16/10] w-full object-cover" loading="lazy" />
            <div className="p-6">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </Section>
  );
}

function DevelopmentProcess() {
  return (
    <Section tone="default">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeader eyebrow="Development lifecycle" title="From site to running plant." lede="The eight phases NEVO owns when developing a new factory — site, building, utilities, contractors and handover." />
        </div>
        <div className="lg:col-span-8">
          <ol className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
            {PROCESS.map((step, i) => (
              <li key={step} className="flex items-center gap-4 bg-background p-5">
                <span className="font-mono text-[11px] tracking-widest text-accent">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm font-medium tracking-tight text-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}

function InvestmentModel() {
  return (
    <Section tone="surface">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <figure className="lg:col-span-6">
          <img src={investmentImg} alt="NEVO factory investment and ROI model" className="aspect-[4/3] w-full rounded-xl border border-border object-cover" loading="lazy" />
        </figure>
        <div className="flex flex-col justify-center lg:col-span-6">
          <Eyebrow>Investment model</Eyebrow>
          <h2 className="text-h1 mt-6 text-balance text-foreground">CAPEX decisions tied to capacity, margin and growth.</h2>
          <p className="text-body-lg mt-6">NEVO models your factory around demand, line speed, panel thickness mix, labour, utility load, raw material consumption, expected yield and expansion strategy.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {["CAPEX range", "Production capacity", "Raw material demand", "Payback scenarios"].map((item) => (
              <div key={item} className="rounded-lg border border-border bg-background p-4 text-sm font-medium text-foreground">{item}</div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function ConnectedSolutions() {
  const links = [
    { title: "Production Lines", href: "/solutions/production-lines", icon: Factory },
    { title: "Raw Materials", href: "/solutions/raw-materials", icon: Layers },
    { title: "Engineering Consultancy", href: "/solutions/engineering-consultancy", icon: Network },
    { title: "Finished Sandwich Panels", href: "/solutions/sandwich-panels", icon: Zap },
  ];
  return (
    <Section tone="default">
      <SectionHeader eyebrow="Connected NEVO platform" title="Every factory workstream connects to a live NEVO route." />
      <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
        {links.map((l) => (
          <a key={l.title} href={l.href} className="group flex min-h-[180px] flex-col justify-between bg-background p-6 transition-colors hover:bg-surface">
            <l.icon className="size-5 text-muted-foreground transition-colors group-hover:text-accent" />
            <span className="flex items-center justify-between text-base font-semibold tracking-tight text-foreground">
              {l.title}<ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </a>
        ))}
      </div>
    </Section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="container-wide section-y grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <Eyebrow className="text-accent">Start development</Eyebrow>
          <h2 className="text-display mt-6 text-balance text-primary-foreground">Plan your factory before you buy the line.</h2>
          <p className="text-body-lg mt-6 max-w-2xl text-primary-foreground/70">Submit your land, target products, required output and budget range. NEVO will turn the starting point into an engineering conversation.</p>
        </div>
        <div className="flex flex-col gap-3 lg:col-span-4">
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90"><a href="/project-inquiry">Open Project Inquiry <ArrowRight className="!size-4" /></a></Button>
          <Button asChild size="lg" variant="secondary" className="border-white/25 bg-transparent text-white hover:bg-white/10"><a href="/ai-assistant">Estimate With AI <FileText className="!size-4" /></a></Button>
        </div>
      </div>
    </section>
  );
}
