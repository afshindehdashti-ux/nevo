import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/lib/seo";
import { motion } from "motion/react";
import {
  ArrowRight,
  Compass,
  Layers,
  Factory,
  FlaskConical,
  Cpu,
  Wrench,
  Shield,
  Globe2,
  Leaf,
  Users,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  Building2,
  Gauge,
  BookOpen,
  Handshake,
  Target,
  Rocket,
  Mail,
} from "lucide-react";

import k01 from "@/assets/knowledge/01_blueprint.jpg";
import k02 from "@/assets/knowledge/02_cad.jpg";
import k03 from "@/assets/knowledge/03_3d_factory.jpg";
import k04 from "@/assets/knowledge/04_meeting.jpg";
import k05 from "@/assets/knowledge/05_calculations.jpg";
import k06 from "@/assets/knowledge/06_production_line.jpg";
import k07 from "@/assets/knowledge/07_laminator.jpg";
import k10 from "@/assets/knowledge/10_stacking.jpg";
import k11 from "@/assets/knowledge/11_ppgi.jpg";
import k17 from "@/assets/knowledge/17_pir_panel.jpg";
import k22 from "@/assets/knowledge/22_cold_storage.jpg";
import k26 from "@/assets/knowledge/26_industrial_bldg.jpg";
import k30 from "@/assets/knowledge/30_flow_diagram.jpg";
import k31 from "@/assets/knowledge/31_material_flow.jpg";
import k33 from "@/assets/knowledge/33_layout.jpg";
import k36 from "@/assets/knowledge/36_investment_report.jpg";

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";

const TITLE =
  "About NEVO Industrial — Engineering the Future of Sandwich Panel Manufacturing | Dubai";
const DESCRIPTION =
  "NEVO Industrial is a Dubai-based engineering and industrial solutions company. We integrate engineering, factory development, production technologies, raw materials and sandwich panel supply into one complete industrial partner.";
const URL_PATH = "/about";

/* ----------------------------- DATA ----------------------------- */

const MISSION = [
  { icon: Compass, title: "Engineering Excellence", body: "Every project starts with rigorous engineering — never with a catalogue." },
  { icon: Sparkles, title: "Industrial Innovation", body: "We adopt proven technologies faster and integrate them deeper than legacy suppliers." },
  { icon: Handshake, title: "Global Partnerships", body: "A curated network of the world's best machinery, chemistry and steel partners." },
  { icon: Target, title: "Long-Term Value", body: "Designed for 20-year performance — not lowest bid, not shortest lead time." },
  { icon: HeartHandshake, title: "Customer Success", body: "We are measured by our clients' plant uptime, quality yield and margin — not by ours." },
  { icon: Leaf, title: "Sustainable Growth", body: "Energy-efficient production, responsible sourcing and lifecycle thinking in every design." },
];

const VISION = [
  { icon: Compass, label: "Engineering" },
  { icon: Cpu, label: "Technology" },
  { icon: Globe2, label: "Global Manufacturing" },
  { icon: Sparkles, label: "Innovation" },
  { icon: BookOpen, label: "Knowledge" },
  { icon: Rocket, label: "Industrial Growth" },
];

const WHAT_WE_DO = [
  { icon: Building2, title: "Factory Development", body: "Greenfield and brownfield sandwich panel plants — feasibility to commissioning.", img: k03 },
  { icon: Compass, title: "Engineering Consultancy", body: "Process, layout, utilities, automation and quality engineering.", img: k02 },
  { icon: Factory, title: "Production Lines", body: "Continuous double-belt lines, roll formers, flying saws, stackers.", img: k06 },
  { icon: FlaskConical, title: "Raw Materials", body: "PPGI, GI, Aluzinc, PIR chemistry (polyol/MDI), Rock Wool.", img: k11 },
  { icon: Layers, title: "Finished Sandwich Panels", body: "PIR, Rock Wool, roof, wall and cold room systems.", img: k17 },
  { icon: Wrench, title: "Technical Support", body: "Commissioning, training, spare parts, process optimisation.", img: k07 },
  { icon: Cpu, title: "Automation", body: "PLC, HMI, SCADA, MES integration and Industry 4.0 modules.", img: k10 },
  { icon: Gauge, title: "Project Management", body: "Single point of accountability from PO to production ramp-up.", img: k30 },
];

const APPROACH = [
  "Understand", "Engineer", "Design", "Source",
  "Build", "Install", "Commission", "Support", "Optimize",
];

const WHY = [
  { icon: Compass, title: "Engineering Before Products", body: "We solve the problem before we quote the equipment." },
  { icon: Sparkles, title: "Technology Neutral", body: "We specify what fits — not what we're contracted to sell." },
  { icon: Globe2, title: "Global Supplier Network", body: "The best machinery, chemistry and steel — regardless of geography." },
  { icon: Shield, title: "Premium Quality", body: "Only vetted suppliers with verified test data and traceability." },
  { icon: BookOpen, title: "Technical Expertise", body: "Engineers, chemists, process specialists and installation leads." },
  { icon: HeartHandshake, title: "Long-Term Partnership", body: "Support that continues long after commissioning." },
  { icon: Wrench, title: "Worldwide Support", body: "Remote diagnostics, on-site interventions, spare-parts logistics." },
  { icon: Building2, title: "Dubai Headquarters", body: "Positioned between Europe, Asia and Africa for global reach." },
];

const COUNTRIES = [
  { name: "United Arab Emirates", tag: "HQ" },
  { name: "Saudi Arabia", tag: "Active" },
  { name: "Oman", tag: "Active" },
  { name: "Turkey", tag: "Partner" },
  { name: "Iraq", tag: "Active" },
  { name: "Russia", tag: "Partner" },
  { name: "Kenya", tag: "Active" },
  { name: "Cameroon", tag: "Active" },
  { name: "Future Global Expansion", tag: "Next" },
];

const VALUES = [
  "Integrity", "Engineering Precision", "Innovation", "Quality",
  "Reliability", "Continuous Improvement", "Customer Partnership", "Sustainability",
];

const PROCESS = [
  { title: "Discovery", body: "Requirements, site, capacity, market — mapped in engineering terms.", img: k04 },
  { title: "Engineering", body: "Process design, mass balance, utility sizing, layout, DFMEA.", img: k05 },
  { title: "Planning", body: "CAPEX model, schedule, procurement plan, risk register.", img: k36 },
  { title: "Procurement", body: "Vetted machinery, chemistry, steel and auxiliary suppliers.", img: k11 },
  { title: "Execution", body: "Manufacturing oversight, FATs, logistics, on-site coordination.", img: k07 },
  { title: "Commissioning", body: "Installation, cold and hot commissioning, performance runs.", img: k06 },
  { title: "Optimization", body: "Yield, energy, cycle-time and quality improvement programs.", img: k30 },
  { title: "Long-Term Support", body: "Spare parts, training, remote diagnostics, upgrades.", img: k02 },
];

const COMMITMENTS = [
  "Transparent communication.",
  "Engineering-first thinking.",
  "Premium quality.",
  "Long-term partnership.",
  "Technical support.",
  "Continuous improvement.",
];

/* ----------------------------- ROUTE ---------------------------- */

export const Route = createFileRoute("/about")({
  head: () => {
    const orgLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "NEVO Industrial",
      url: `${SITE.url}${URL_PATH}`,
      description: DESCRIPTION,
      foundingLocation: "Dubai, United Arab Emirates",
      areaServed: ["AE", "SA", "OM", "TR", "IQ", "RU", "KE", "CM"],
      knowsAbout: [
        "Sandwich panel factories",
        "Production line engineering",
        "Raw material supply",
        "PIR and Rock Wool sandwich panels",
        "Industrial project development",
      ],
    };
    const crumbsLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "/" },
        { "@type": "ListItem", position: 2, name: "About", item: URL_PATH },
      ],
    };
    return {
      meta: [
        { title: TITLE },
        { name: "description", content: DESCRIPTION },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE.url}${URL_PATH}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `${SITE.url}${URL_PATH}` }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(orgLd) },
        { type: "application/ld+json", children: JSON.stringify(crumbsLd) },
      ],
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

/* HERO */
function Hero() {
  return (
    <section className="relative isolate -mt-20 overflow-hidden bg-black text-white md:-mt-24">
      <div className="absolute inset-0 -z-10">
        <img
          src={k03}
          alt="NEVO Industrial — 3D factory model"
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
            About NEVO Industrial
          </div>
          <h1 className="text-display text-balance text-white">
            Engineering the Future.{" "}
            <span className="text-accent">Building Industrial Excellence.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
            NEVO Industrial is a Dubai-based engineering and industrial solutions company
            specialising in sandwich panel factories, production technologies, raw materials
            and complete industrial project development.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button size="lg" variant="primary" asChild>
              <a href="#cta">Start Your Project <ArrowRight className="ml-2 size-4" /></a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#story">Meet Our Engineering Team</a>
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
            { k: "Dubai", v: "Global HQ" },
            { k: "8+", v: "Countries served" },
            { k: "40+", v: "Engineering projects" },
            { k: "1", v: "Integrated partner" },
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

/* OUR STORY */
function OurStory() {
  return (
    <Section id="story" className="bg-white">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Eyebrow>Our Story</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            An engineering company built to close the gap between design and industry.
          </h2>
        </div>
        <div className="space-y-6 text-black/75 lg:col-span-7">
          <p className="text-lg">
            NEVO Industrial was founded on a straightforward observation: the sandwich panel
            industry is served by machinery suppliers, chemistry traders and panel producers —
            but rarely by engineers who understand all three.
          </p>
          <p>
            Investors were forced to stitch together a factory from disconnected vendors,
            each optimising their own scope. The result was long commissioning cycles,
            inconsistent quality and factories that never reached their nameplate capacity.
          </p>
          <p>
            NEVO was created to bridge engineering, industrial supply and project execution
            under one brand. From feasibility to commissioning — and long after — a single
            engineering-led partner owns the outcome.
          </p>
          <p>
            Headquartered in Dubai and operating across eight countries, we work with
            ambitious industrialists building the next generation of production capacity for
            cold chain, food, pharma, logistics and heavy industry.
          </p>
        </div>
      </div>
      <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[k04, k02, k05, k33].map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="aspect-[4/5] overflow-hidden rounded-2xl bg-black"
          >
            <img src={img} alt="" className="h-full w-full object-cover" />
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* OUR MISSION */
function OurMission() {
  return (
    <Section className="bg-[#f6f6f4]">
      <SectionHeader
        eyebrow="Our Mission"
        title="Six commitments that shape every project."
        lede="Not a mission statement — a mission architecture."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MISSION.map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.05 }}
            className="group rounded-2xl bg-white p-7 ring-1 ring-black/5 transition hover:shadow-xl"
          >
            <m.icon className="size-6 text-accent" />
            <h3 className="mt-5 text-lg font-medium">{m.title}</h3>
            <p className="mt-2 text-sm text-black/65">{m.body}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* OUR VISION */
function OurVision() {
  return (
    <Section className="bg-black text-white">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <Eyebrow className="text-white/60">Our Vision</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            Building the world's most trusted{" "}
            <span className="text-accent">engineering partner.</span>
          </h2>
          <p className="mt-6 max-w-xl text-white/70">
            To become the reference engineering partner for the global sandwich panel
            industry — combining deep technical expertise, curated technology, and a
            network of premium suppliers into one integrated offer.
          </p>
          <p className="mt-4 max-w-xl text-white/70">
            We measure our vision in factories commissioned, engineers trained, and
            long-term partnerships built — not in units shipped.
          </p>
        </div>
        <div className="lg:col-span-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {VISION.map((v, i) => (
              <motion.div
                key={v.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10"
              >
                <v.icon className="size-5 text-accent" />
                <div className="mt-3 text-sm font-medium">{v.label}</div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-white/10">
            <img src={k31} alt="NEVO material flow illustration" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* WHAT WE DO */
function WhatWeDo() {
  return (
    <Section className="bg-white">
      <SectionHeader
        eyebrow="What We Do"
        title="Eight disciplines. One integrated engineering partner."
        lede="Every service listed below is owned end-to-end by NEVO — never subcontracted, never resold without engineering."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {WHAT_WE_DO.map((w, i) => (
          <motion.div
            key={w.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: (i % 4) * 0.05 }}
            className="group overflow-hidden rounded-2xl bg-black text-white ring-1 ring-black/5 transition hover:ring-accent/40"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img src={w.img} alt={w.title} className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
            </div>
            <div className="p-6">
              <w.icon className="size-5 text-accent" />
              <h3 className="mt-3 text-base font-medium">{w.title}</h3>
              <p className="mt-2 text-sm text-white/65">{w.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* OUR APPROACH */
function OurApproach() {
  return (
    <Section className="bg-[#f6f6f4]">
      <SectionHeader
        eyebrow="Our Approach"
        title="Nine engineering steps, one continuous partnership."
      />
      <div className="mt-14 relative">
        <div aria-hidden className="absolute left-0 right-0 top-6 hidden h-px bg-black/10 md:block" />
        <ol className="grid grid-cols-3 gap-6 md:grid-cols-9">
          {APPROACH.map((step, i) => (
            <motion.li
              key={step}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="relative flex flex-col items-center text-center"
            >
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

/* WHY NEVO */
function WhyNEVO() {
  return (
    <Section className="bg-white">
      <SectionHeader
        eyebrow="Why NEVO"
        title="Eight reasons industrialists choose us."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {WHY.map((w, i) => (
          <motion.div
            key={w.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: (i % 4) * 0.05 }}
            className="rounded-2xl bg-[#f6f6f4] p-6 ring-1 ring-black/5"
          >
            <w.icon className="size-5 text-accent" />
            <h3 className="mt-4 text-base font-medium">{w.title}</h3>
            <p className="mt-2 text-sm text-black/65">{w.body}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* GLOBAL PRESENCE */
function GlobalPresence() {
  return (
    <Section className="bg-black text-white">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow className="text-white/60">Global Presence</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            Dubai headquartered.{" "}
            <span className="text-accent">Global by design.</span>
          </h2>
          <p className="mt-6 max-w-xl text-white/70">
            NEVO delivers engineering, materials and production technologies across the
            Middle East, Africa, CIS and beyond — with a curated partner network that
            follows every project.
          </p>
          <div className="mt-8 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/50">
            <Globe2 className="size-4 text-accent" /> Serving 8+ countries
          </div>
        </div>
        <div className="lg:col-span-7">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COUNTRIES.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10"
              >
                <span className="text-sm">{c.name}</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-accent">{c.tag}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* OUR VALUES */
function OurValues() {
  return (
    <Section className="bg-white">
      <SectionHeader eyebrow="Our Values" title="The principles we hire, engineer and partner by." />
      <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
        {VALUES.map((v, i) => (
          <motion.div
            key={v}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: (i % 4) * 0.04 }}
            className="flex items-center gap-3 rounded-xl bg-[#f6f6f4] px-5 py-4 ring-1 ring-black/5"
          >
            <CheckCircle2 className="size-4 shrink-0 text-accent" />
            <span className="text-sm font-medium">{v}</span>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* OUR DIFFERENCE */
function OurDifference() {
  return (
    <Section className="bg-[#f6f6f4]">
      <SectionHeader eyebrow="Our Difference" title="What NEVO is — and what NEVO is not." />
      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-8 ring-1 ring-black/5 md:p-10">
          <div className="text-xs font-mono uppercase tracking-widest text-black/50">NEVO is NOT</div>
          <ul className="mt-6 space-y-4 text-black/75">
            {[
              "Only a machinery supplier.",
              "Only a raw material trader.",
              "Only a sandwich panel supplier.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-black/30" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-black p-8 text-white ring-1 ring-black/5 md:p-10">
          <div aria-hidden className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(60% 60% at 90% 20%, rgba(16,185,129,0.25), transparent 70%)" }} />
          <div className="relative">
            <div className="text-xs font-mono uppercase tracking-widest text-accent">NEVO IS</div>
            <p className="mt-6 text-lg leading-relaxed">
              An engineering-led industrial partner that integrates{" "}
              <span className="text-accent">engineering, technology, industrial supply</span>{" "}
              and <span className="text-accent">project execution</span> into one complete
              solution — for the entire lifecycle of a sandwich panel factory.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* OUR PROCESS */
function OurProcess() {
  return (
    <Section className="bg-white">
      <SectionHeader eyebrow="Our Process" title="From first conversation to long-term optimization." />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PROCESS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: (i % 4) * 0.05 }}
            className="group overflow-hidden rounded-2xl bg-[#f6f6f4] ring-1 ring-black/5 transition hover:shadow-xl"
          >
            <div className="aspect-[4/3] overflow-hidden bg-black">
              <img src={p.img} alt={p.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
            </div>
            <div className="p-6">
              <div className="text-[10px] font-mono uppercase tracking-widest text-accent">
                Step {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-2 text-base font-medium">{p.title}</h3>
              <p className="mt-2 text-sm text-black/65">{p.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* OUR COMMITMENT */
function OurCommitment() {
  return (
    <Section className="bg-black text-white">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow className="text-white/60">Our Commitment</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            The promise behind every NEVO partnership.
          </h2>
          <p className="mt-6 max-w-xl text-white/70">
            A relationship with NEVO is designed for the full lifecycle of your factory —
            not the duration of a single purchase order.
          </p>
        </div>
        <ul className="grid gap-3 lg:col-span-7 sm:grid-cols-2">
          {COMMITMENTS.map((c, i) => (
            <motion.li
              key={c}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="flex items-start gap-3 rounded-xl bg-white/[0.04] px-5 py-4 ring-1 ring-white/10"
            >
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" />
              <span className="text-sm">{c}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* FINAL CTA */
function FinalCTA() {
  return (
    <Section id="cta" className="bg-white">
      <div className="relative overflow-hidden rounded-2xl bg-black p-10 md:p-16 text-white">
        <div aria-hidden className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(60% 60% at 80% 20%, rgba(16,185,129,0.25), transparent 70%)" }} />
        <div className="relative z-10 max-w-3xl">
          <Eyebrow className="text-white/60">Let's Build</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            Let's build something{" "}
            <span className="text-accent">exceptional together.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-white/75">
            Bring your factory ambition, cold-chain project, or panel programme to a team
            that engineers the outcome — not just the equipment.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="primary" asChild>
              <a href="mailto:engineering@nevo-industrial.com">
                Talk to an Engineer <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="mailto:engineering@nevo-industrial.com">
                <Mail className="mr-2 size-4" /> Request a Consultation
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
