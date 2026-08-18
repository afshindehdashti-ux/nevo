import { createFileRoute } from "@tanstack/react-router";
import { SITE, buildSeo } from "@/lib/seo";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Leaf,
  Zap,
  Wind,
  Droplets,
  Recycle,
  Factory,
  Sun,
  TreePine,
  Target,
  TrendingDown,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import heroImg from "@/assets/corporate/sustainability-hero.jpg";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";

const TITLE = "Sustainability & ESG — Engineering a Sustainable Future | NEVO Industrial";
const DESCRIPTION =
  "NEVO's ESG strategy: energy-efficient factories, carbon reduction, green manufacturing, circular economy, water saving and sustainable materials. Interactive ESG dashboard and 2030 targets.";
const URL_PATH = "/sustainability";

const PILLARS = [
  {
    icon: Zap,
    title: "Energy Efficient Factories",
    body: "Heat-recovery ovens, VFD-driven lines and rooftop PV reduce energy intensity by up to 42%.",
  },
  {
    icon: Wind,
    title: "Carbon Reduction",
    body: "Scope 1 & 2 targets aligned to SBTi — 50% cut by 2030 versus 2022 baseline.",
  },
  {
    icon: Factory,
    title: "Green Manufacturing",
    body: "Low-GWP PIR blowing agents, PCR steel content and closed-loop cooling water systems.",
  },
  {
    icon: Recycle,
    title: "Waste Reduction",
    body: "Panel edge-trim, coil off-cuts and chemical drums reclaimed through certified partners.",
  },
  {
    icon: Droplets,
    title: "Water Saving",
    body: "Closed cooling circuits and rainwater harvesting cut freshwater use by 60% per m² produced.",
  },
  {
    icon: Sun,
    title: "Circular Economy",
    body: "End-of-life take-back for insulated panels — steel recycled, core recovered as fuel.",
  },
  {
    icon: Leaf,
    title: "Sustainable Materials",
    body: "Pre-painted galvanized steel with recycled content, EPD-published sandwich panels.",
  },
  {
    icon: TreePine,
    title: "Community & Nature",
    body: "Native landscaping around every plant, plus reforestation offsets for residual emissions.",
  },
];

const GOALS = [
  { year: "2025", label: "ISO 14001 certified in all owned plants", pct: 90 },
  { year: "2027", label: "40% renewable electricity across operations", pct: 55 },
  { year: "2030", label: "50% Scope 1 & 2 emission reduction", pct: 32 },
  { year: "2035", label: "Net-zero manufacturing operations", pct: 12 },
];

function useCounter(target: number, duration = 1500) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

function SustainabilityPage() {
  const co2 = useCounter(42);
  const water = useCounter(60);
  const renew = useCounter(38);
  const waste = useCounter(87);

  return (
    <>
      <AnnouncementBar />
      <SiteHeader />

      <section className="relative isolate overflow-hidden bg-[#0a0d0c] text-white">
        <img
          loading="lazy"
          decoding="async"
          src={heroImg}
          alt="Solar-panel factory rooftop at golden hour"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d0c]/85 via-[#0a0d0c]/55 to-[#0a0d0c]" />
        <div className="container-wide relative py-32 md:py-40">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Eyebrow className="text-emerald-400/90">Sustainability & ESG</Eyebrow>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
              Engineering a <span className="text-emerald-400">Sustainable Future.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/70">
              We treat sustainability as an engineering problem — measurable, auditable, and
              continuously improved across every factory we build and every panel we ship.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <a href="#dashboard">
                  View ESG Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <a href="#goals">2030 Targets</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DASHBOARD */}
      <Section id="dashboard" tone="surface">
        <SectionHeader
          eyebrow="ESG Dashboard"
          title="Measured progress, not marketing"
          lede="Live KPIs from our owned operations and audited annually against GRI / SASB frameworks."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: TrendingDown,
              label: "CO₂ Intensity Reduction",
              value: co2,
              suffix: "%",
              note: "vs 2022 baseline",
            },
            {
              icon: Droplets,
              label: "Water Savings per m²",
              value: water,
              suffix: "%",
              note: "closed-loop cooling",
            },
            {
              icon: Sun,
              label: "Renewable Electricity",
              value: renew,
              suffix: "%",
              note: "on-site PV + PPA",
            },
            {
              icon: Recycle,
              label: "Waste Diverted from Landfill",
              value: waste,
              suffix: "%",
              note: "certified recyclers",
            },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-border bg-background p-6">
              <k.icon className="h-8 w-8 text-emerald-600" />
              <div className="mt-6 text-5xl font-semibold tracking-tight">
                {k.value}
                <span className="text-2xl text-emerald-600">{k.suffix}</span>
              </div>
              <div className="mt-3 text-sm font-medium">{k.label}</div>
              <div className="text-xs text-muted-foreground">{k.note}</div>
            </div>
          ))}
        </div>

        {/* Chart-ish energy bars */}
        <div className="mt-12 rounded-2xl border border-border bg-background p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Energy Mix — Owned Operations
              </div>
              <div className="mt-1 text-lg font-semibold">Rolling 12 months</div>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
              Verified
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {[
              { label: "On-site solar PV", pct: 24, color: "bg-emerald-500" },
              { label: "PPA renewable grid", pct: 14, color: "bg-emerald-400" },
              { label: "Natural gas (recovery)", pct: 41, color: "bg-neutral-400" },
              { label: "Grid electricity (residual)", pct: 21, color: "bg-neutral-600" },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{r.label}</span>
                  <span>{r.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${r.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`h-full ${r.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* PILLARS */}
      <Section>
        <SectionHeader
          eyebrow="Environmental Commitment"
          title="Eight pillars of our ESG program"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="group rounded-2xl border border-border bg-background p-6 transition hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-xl"
            >
              <p.icon className="h-7 w-7 text-emerald-600" />
              <h3 className="mt-6 text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* GOALS TIMELINE */}
      <Section id="goals" tone="surface">
        <SectionHeader
          eyebrow="ESG Strategy"
          title="Targets on a public timeline"
          lede="Progress is reviewed by our board every quarter and published in the annual ESG report."
        />
        <div className="space-y-8">
          {GOALS.map((g) => (
            <div key={g.year} className="rounded-2xl border border-border bg-background p-6 md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      {g.year}
                    </div>
                    <div className="text-lg font-semibold">{g.label}</div>
                  </div>
                </div>
                <div className="w-full md:w-72">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{g.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${g.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2 }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section tone="primary">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <Eyebrow className="text-emerald-300">Download</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              ESG Report 2025 — 84 pages of data
            </h2>
            <p className="mt-3 text-primary-foreground/70">
              GRI, SASB and TCFD-aligned. Includes third-party audit letter and full KPI appendix.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button size="lg" variant="secondary" asChild>
              <a href="/download-center">
                Download ESG Report <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <a href="/contact">Talk to ESG Team</a>
            </Button>
          </div>
        </div>
      </Section>

      <SiteFooter />
    </>
  );
}

export const Route = createFileRoute("/$lang/sustainability")({
  head: ({ params }) =>
    buildSeo({ title: TITLE, description: DESCRIPTION, path: URL_PATH, lang: params.lang }),
  component: SustainabilityPage,
});
