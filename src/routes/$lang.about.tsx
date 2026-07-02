import { createFileRoute } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import { localizedMeta } from "@/lib/seo-meta";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight, Compass, Layers, Factory, FlaskConical, Cpu, Wrench, Shield,
  Globe2, Leaf, Sparkles, HeartHandshake, CheckCircle2, Building2, Gauge,
  BookOpen, Handshake, Target, Rocket, Mail,
} from "lucide-react";

import k02 from "@/assets/knowledge/02_cad.jpg";
import k03 from "@/assets/knowledge/03_3d_factory.jpg";
import k04 from "@/assets/knowledge/04_meeting.jpg";
import k05 from "@/assets/knowledge/05_calculations.jpg";
import k06 from "@/assets/knowledge/06_production_line.jpg";
import k07 from "@/assets/knowledge/07_laminator.jpg";
import k10 from "@/assets/knowledge/10_stacking.jpg";
import k11 from "@/assets/knowledge/11_ppgi.jpg";
import k17 from "@/assets/knowledge/17_pir_panel.jpg";
import k30 from "@/assets/knowledge/30_flow_diagram.jpg";
import k31 from "@/assets/knowledge/31_material_flow.jpg";
import k33 from "@/assets/knowledge/33_layout.jpg";
import k36 from "@/assets/knowledge/36_investment_report.jpg";

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";

const URL_PATH = "/about";

const MISSION_ICONS = [Compass, Sparkles, Handshake, Target, HeartHandshake, Leaf];
const VISION_ICONS = [Compass, Cpu, Globe2, Sparkles, BookOpen, Rocket];
const WHATDO_ICONS = [Building2, Compass, Factory, FlaskConical, Layers, Wrench, Cpu, Gauge];
const WHATDO_IMGS = [k03, k02, k06, k11, k17, k07, k10, k30];
const WHY_ICONS = [Compass, Sparkles, Globe2, Shield, BookOpen, HeartHandshake, Wrench, Building2];
const PROCESS_IMGS = [k04, k05, k36, k11, k07, k06, k30, k02];

export const Route = createFileRoute("/$lang/about")({
  head: ({ params }) => {
    const TITLE = "About NEVO Industrial — Engineering the Future of Sandwich Panel Manufacturing | Dubai";
    const DESCRIPTION = "NEVO Industrial — Dubai-based engineering and industrial solutions company.";
    return {
      meta: [
        { title: TITLE },
        { name: "description", content: DESCRIPTION },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE.url}/${params.lang}${URL_PATH}` },
        { name: "twitter:card", content: "summary_large_image" },
        ...ogImageMeta("/about"),
      ],
      links: [{ rel: "canonical", href: `${SITE.url}/${params.lang}${URL_PATH}` }],
    };
  },
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main">
        <Hero />
        <OurStory />
        <OurMission />
        <OurVision />
        <WhatWeDo />
        <OurApproach />
        <WhyNEVO />
        <GlobalPresence />
        <OurValues />
        <OurDifference />
        <OurProcess />
        <OurCommitment />
        <FinalCTA />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  const { t } = useTranslation();
  const stats = t("about.hero.stats", { returnObjects: true }) as Record<string, string>;
  return (
    <section className="relative isolate -mt-20 overflow-hidden bg-black text-white md:-mt-24">
      <div className="absolute inset-0 -z-10">
        <img src={k03} alt="" className="h-full w-full object-cover" style={{ transform: "scale(1.05)" }} fetchPriority="high" />
        <div aria-hidden className="absolute inset-0 bg-black/70" />
        <div aria-hidden className="absolute inset-y-0 left-0 w-[75%]" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.82) 55%, rgba(0,0,0,0.35) 100%)" }} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/85 to-transparent" />
      </div>
      <div className="container-wide relative flex min-h-[80vh] flex-col justify-between px-6 pt-36 pb-16 lg:min-h-[92vh] lg:px-8 lg:pt-44">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }} className="max-w-4xl">
          <div className="eyebrow mb-6 flex items-center gap-2 text-white/70">
            <span className="inline-flex size-1.5 rounded-full bg-accent" />
            {t("about.hero.eyebrow")}
          </div>
          <h1 className="text-display text-balance text-white">
            {t("about.hero.titleA")} <span className="text-accent">{t("about.hero.titleB")}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">{t("about.hero.lede")}</p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button size="lg" variant="primary" asChild><a href="#cta">{t("about.hero.ctaProject")} <ArrowRight className="ml-2 size-4" /></a></Button>
            <Button size="lg" variant="secondary" asChild><a href="#story">{t("about.hero.ctaTeam")}</a></Button>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }} className="mt-12 grid max-w-4xl grid-cols-2 gap-x-8 gap-y-4 border-t border-white/10 pt-8 md:grid-cols-4">
          {[["hqK","hqV"],["ctK","ctV"],["prK","prV"],["pnK","pnV"]].map(([k,v]) => (
            <div key={v}>
              <div className="text-3xl font-medium text-white">{stats[k]}</div>
              <div className="mt-1 text-xs font-mono uppercase tracking-widest text-white/55">{stats[v]}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function OurStory() {
  const { t } = useTranslation();
  return (
    <Section id="story" className="bg-white">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Eyebrow>{t("about.story.eyebrow")}</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">{t("about.story.title")}</h2>
        </div>
        <div className="space-y-6 text-black/75 lg:col-span-7">
          <p className="text-lg">{t("about.story.p1")}</p>
          <p>{t("about.story.p2")}</p>
          <p>{t("about.story.p3")}</p>
          <p>{t("about.story.p4")}</p>
        </div>
      </div>
      <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[k04, k02, k05, k33].map((img, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5, delay: i * 0.05 }} className="aspect-[4/5] overflow-hidden rounded-2xl bg-black">
            <img loading="lazy" decoding="async" src={img} alt="" className="h-full w-full object-cover" />
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function OurMission() {
  const { t } = useTranslation();
  const items = t("about.mission.items", { returnObjects: true }) as Array<{t:string;b:string}>;
  return (
    <Section className="bg-[#f6f6f4]">
      <SectionHeader eyebrow={t("about.mission.eyebrow")} title={t("about.mission.title")} lede={t("about.mission.lede")} />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((m, i) => {
          const Icon = MISSION_ICONS[i];
          return (
            <motion.div key={m.t} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5, delay: (i % 3) * 0.05 }} className="group rounded-2xl bg-white p-7 ring-1 ring-black/5 transition hover:shadow-xl">
              <Icon className="size-6 text-accent" />
              <h3 className="mt-5 text-lg font-medium">{m.t}</h3>
              <p className="mt-2 text-sm text-black/65">{m.b}</p>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

function OurVision() {
  const { t } = useTranslation();
  const labels = t("about.vision.labels", { returnObjects: true }) as string[];
  return (
    <Section className="bg-black text-white">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <Eyebrow className="text-white/60">{t("about.vision.eyebrow")}</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            {t("about.vision.titleA")} <span className="text-accent">{t("about.vision.titleB")}</span>
          </h2>
          <p className="mt-6 max-w-xl text-white/70">{t("about.vision.p1")}</p>
          <p className="mt-4 max-w-xl text-white/70">{t("about.vision.p2")}</p>
        </div>
        <div className="lg:col-span-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {labels.map((label, i) => {
              const Icon = VISION_ICONS[i];
              return (
                <motion.div key={label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.4, delay: i * 0.04 }} className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                  <Icon className="size-5 text-accent" />
                  <div className="mt-3 text-sm font-medium">{label}</div>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-white/10">
            <img loading="lazy" decoding="async" src={k31} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </Section>
  );
}

function WhatWeDo() {
  const { t } = useTranslation();
  const items = t("about.whatWeDo.items", { returnObjects: true }) as Array<{t:string;b:string}>;
  return (
    <Section className="bg-white">
      <SectionHeader eyebrow={t("about.whatWeDo.eyebrow")} title={t("about.whatWeDo.title")} lede={t("about.whatWeDo.lede")} />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {items.map((w, i) => {
          const Icon = WHATDO_ICONS[i];
          return (
            <motion.div key={w.t} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5, delay: (i % 4) * 0.05 }} className="group overflow-hidden rounded-2xl bg-black text-white ring-1 ring-black/5 transition hover:ring-accent/40">
              <div className="aspect-[4/3] overflow-hidden">
                <img loading="lazy" decoding="async" src={WHATDO_IMGS[i]} alt="" className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
              </div>
              <div className="p-6">
                <Icon className="size-5 text-accent" />
                <h3 className="mt-3 text-base font-medium">{w.t}</h3>
                <p className="mt-2 text-sm text-white/65">{w.b}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

function OurApproach() {
  const { t } = useTranslation();
  const steps = t("about.approach.steps", { returnObjects: true }) as string[];
  return (
    <Section className="bg-[#f6f6f4]">
      <SectionHeader eyebrow={t("about.approach.eyebrow")} title={t("about.approach.title")} />
      <div className="mt-14 relative">
        <div aria-hidden className="absolute left-0 right-0 top-6 hidden h-px bg-black/10 md:block" />
        <ol className="grid grid-cols-3 gap-6 md:grid-cols-9">
          {steps.map((step, i) => (
            <motion.li key={step} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.4, delay: i * 0.04 }} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 grid size-12 place-items-center rounded-full bg-white ring-1 ring-black/10">
                <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="mt-3 text-sm font-medium">{step}</div>
            </motion.li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

function WhyNEVO() {
  const { t } = useTranslation();
  const items = t("about.why.items", { returnObjects: true }) as Array<{t:string;b:string}>;
  return (
    <Section className="bg-white">
      <SectionHeader eyebrow={t("about.why.eyebrow")} title={t("about.why.title")} />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {items.map((w, i) => {
          const Icon = WHY_ICONS[i];
          return (
            <motion.div key={w.t} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5, delay: (i % 4) * 0.05 }} className="rounded-2xl bg-[#f6f6f4] p-6 ring-1 ring-black/5">
              <Icon className="size-5 text-accent" />
              <h3 className="mt-4 text-base font-medium">{w.t}</h3>
              <p className="mt-2 text-sm text-black/65">{w.b}</p>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

function GlobalPresence() {
  const { t } = useTranslation();
  const countries = t("about.presence.countries", { returnObjects: true }) as Array<{n:string;g:string}>;
  return (
    <Section className="bg-black text-white">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow className="text-white/60">{t("about.presence.eyebrow")}</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            {t("about.presence.titleA")} <span className="text-accent">{t("about.presence.titleB")}</span>
          </h2>
          <p className="mt-6 max-w-xl text-white/70">{t("about.presence.lede")}</p>
          <div className="mt-8 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/50">
            <Globe2 className="size-4 text-accent" /> {t("about.presence.serving")}
          </div>
        </div>
        <div className="lg:col-span-7">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((c, i) => (
              <motion.div key={c.n} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.4, delay: i * 0.03 }} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10">
                <span className="text-sm">{c.n}</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-accent">{c.g}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function OurValues() {
  const { t } = useTranslation();
  const items = t("about.values.items", { returnObjects: true }) as string[];
  return (
    <Section className="bg-white">
      <SectionHeader eyebrow={t("about.values.eyebrow")} title={t("about.values.title")} />
      <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((v, i) => (
          <motion.div key={v} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.4, delay: (i % 4) * 0.04 }} className="flex items-center gap-3 rounded-xl bg-[#f6f6f4] px-5 py-4 ring-1 ring-black/5">
            <CheckCircle2 className="size-4 shrink-0 text-accent" />
            <span className="text-sm font-medium">{v}</span>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function OurDifference() {
  const { t } = useTranslation();
  const notItems = t("about.difference.notItems", { returnObjects: true }) as string[];
  return (
    <Section className="bg-[#f6f6f4]">
      <SectionHeader eyebrow={t("about.difference.eyebrow")} title={t("about.difference.title")} />
      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-8 ring-1 ring-black/5 md:p-10">
          <div className="text-xs font-mono uppercase tracking-widest text-black/50">{t("about.difference.notLabel")}</div>
          <ul className="mt-6 space-y-4 text-black/75">
            {notItems.map((x) => (
              <li key={x} className="flex items-start gap-3">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-black/30" />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-black p-8 text-white ring-1 ring-black/5 md:p-10">
          <div aria-hidden className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(60% 60% at 90% 20%, rgba(16,185,129,0.25), transparent 70%)" }} />
          <div className="relative">
            <div className="text-xs font-mono uppercase tracking-widest text-accent">{t("about.difference.isLabel")}</div>
            <p className="mt-6 text-lg leading-relaxed">{t("about.difference.isText")}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}

function OurProcess() {
  const { t } = useTranslation();
  const items = t("about.process.items", { returnObjects: true }) as Array<{t:string;b:string}>;
  return (
    <Section className="bg-white">
      <SectionHeader eyebrow={t("about.process.eyebrow")} title={t("about.process.title")} />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {items.map((p, i) => (
          <motion.div key={p.t} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5, delay: (i % 4) * 0.05 }} className="group overflow-hidden rounded-2xl bg-[#f6f6f4] ring-1 ring-black/5 transition hover:shadow-xl">
            <div className="aspect-[4/3] overflow-hidden bg-black">
              <img loading="lazy" decoding="async" src={PROCESS_IMGS[i]} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
            </div>
            <div className="p-6">
              <div className="text-[10px] font-mono uppercase tracking-widest text-accent">
                {t("about.process.stepLabel")} {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-2 text-base font-medium">{p.t}</h3>
              <p className="mt-2 text-sm text-black/65">{p.b}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function OurCommitment() {
  const { t } = useTranslation();
  const items = t("about.commitment.items", { returnObjects: true }) as string[];
  return (
    <Section className="bg-black text-white">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow className="text-white/60">{t("about.commitment.eyebrow")}</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">{t("about.commitment.title")}</h2>
          <p className="mt-6 max-w-xl text-white/70">{t("about.commitment.lede")}</p>
        </div>
        <ul className="grid gap-3 lg:col-span-7 sm:grid-cols-2">
          {items.map((c, i) => (
            <motion.li key={c} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.4, delay: i * 0.04 }} className="flex items-start gap-3 rounded-xl bg-white/[0.04] px-5 py-4 ring-1 ring-white/10">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" />
              <span className="text-sm">{c}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function FinalCTA() {
  const { t } = useTranslation();
  return (
    <Section id="cta" className="bg-white">
      <div className="relative overflow-hidden rounded-2xl bg-black p-10 md:p-16 text-white">
        <div aria-hidden className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(60% 60% at 80% 20%, rgba(16,185,129,0.25), transparent 70%)" }} />
        <div className="relative z-10 max-w-3xl">
          <Eyebrow className="text-white/60">{t("about.cta.eyebrow")}</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            {t("about.cta.titleA")} <span className="text-accent">{t("about.cta.titleB")}</span>
          </h2>
          <p className="mt-5 max-w-2xl text-white/75">{t("about.cta.lede")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="primary" asChild>
              <a href="mailto:engineering@nevo-industrial.com">
                {t("about.cta.primary")} <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="mailto:engineering@nevo-industrial.com">
                <Mail className="mr-2 size-4" /> {t("about.cta.secondary")}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
