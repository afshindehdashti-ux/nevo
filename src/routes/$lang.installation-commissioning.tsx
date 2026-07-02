import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { SITE } from "@/lib/seo";
import { motion } from "motion/react";
import { ArrowRight, Wrench, LifeBuoy, ShieldCheck } from "lucide-react";

import inst01 from "@/assets/installation/inst-01-machine-installation.jpg";
import inst02 from "@/assets/installation/inst-02-mechanical-alignment.jpg";
import inst03 from "@/assets/installation/inst-03-electrical-installation.jpg";
import inst04 from "@/assets/installation/inst-04-plc-scada.jpg";
import inst05 from "@/assets/installation/inst-05-first-panel.jpg";
import inst06 from "@/assets/installation/inst-06-fat.jpg";
import inst07 from "@/assets/installation/inst-07-sat.jpg";
import inst08 from "@/assets/installation/inst-08-training.jpg";
import inst09 from "@/assets/installation/inst-09-remote-support.jpg";
import inst10 from "@/assets/installation/inst-10-aftersales.jpg";

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { SurfaceCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";

const TITLE =
  "Installation, Commissioning & After-Sales Support | NEVO Industrial";
const DESCRIPTION =
  "NEVO field engineers install, commission and support your sandwich panel factory — from mechanical alignment and PLC/SCADA commissioning to FAT, SAT, operator training and lifetime after-sales service.";
const URL_PATH = "/installation-commissioning";

const TILES = [
  {
    tag: "01",
    title: "Machine Installation",
    body: "Heavy modules positioned, levelled and anchored by NEVO field engineers with certified rigging and lifting protocols.",
    img: inst01,
  },
  {
    tag: "02",
    title: "Mechanical Alignment",
    body: "Laser alignment of rollers, shafts and press modules to sub-millimetre tolerance for stable, high-speed production.",
    img: inst02,
  },
  {
    tag: "03",
    title: "Electrical Installation",
    body: "Power distribution, motor drives, sensors and safety circuits wired and tested to IEC standards before energisation.",
    img: inst03,
  },
  {
    tag: "04",
    title: "PLC & SCADA Commissioning",
    body: "Control logic, recipes and SCADA dashboards commissioned line-by-line — with full traceability and cybersecurity hardening.",
    img: inst04,
  },
  {
    tag: "05",
    title: "First Production Panel",
    body: "The moment your factory becomes real: the first sandwich panel exits the line under NEVO engineering supervision.",
    img: inst05,
  },
  {
    tag: "06",
    title: "Factory Acceptance Test (FAT)",
    body: "Formal FAT protocol executed with the customer — verifying speed, quality, safety and process parameters against contract.",
    img: inst06,
  },
  {
    tag: "07",
    title: "Site Acceptance Test (SAT)",
    body: "On-site SAT and handover — line signed off with full documentation, spare parts inventory and warranty activation.",
    img: inst07,
  },
  {
    tag: "08",
    title: "Operator Training",
    body: "Structured training programme for operators, maintenance crews and supervisors — classroom, HMI and hands-on shifts.",
    img: inst08,
  },
  {
    tag: "09",
    title: "Remote Technical Support",
    body: "24/7 remote diagnostics, PLC access and live SCADA monitoring from NEVO's engineering support centre.",
    img: inst09,
  },
  {
    tag: "10",
    title: "Lifetime After-Sales Support",
    body: "Field service, spare parts, upgrades and preventive maintenance for the entire operational lifetime of the plant.",
    img: inst10,
  },
];

const CAPABILITIES = [
  { code: "SUPERVISION", label: "Erection & installation supervision" },
  { code: "COMMISSIONING", label: "Mechanical, electrical, PLC/SCADA" },
  { code: "FAT / SAT", label: "Formal acceptance test protocols" },
  { code: "TRAINING", label: "Operator & maintenance certification" },
  { code: "24 / 7", label: "Remote diagnostics & technical support" },
  { code: "LIFETIME", label: "Spares, upgrades & preventive maintenance" },
];

export const Route = createFileRoute("/$lang/installation-commissioning")({
  component: InstallationCommissioningPage,
  head: ({ params }) => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/${params.lang}${URL_PATH}` },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/${params.lang}${URL_PATH}` }],
  }),
});

function InstallationCommissioningPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-graphite text-white">
        <div className="absolute inset-0 opacity-40">
          <img loading="lazy" decoding="async"
            src={inst01}
            alt=""
            className="h-full w-full object-cover"
            width={1600}
            height={1067}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite/85 to-graphite/40" />
        </div>
        <div className="relative mx-auto max-w-[1440px] px-6 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <Eyebrow className="text-emerald">
              Installation · Commissioning · Lifetime Support
            </Eyebrow>
            <h1 className="mt-4 text-5xl md:text-6xl font-semibold tracking-tight">
              We don't just deliver machines. We commission factories.
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-2xl">
              NEVO field engineers install, align, wire, commission and support
              every production line we build — from the first anchor bolt to
              lifetime after-sales service.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-emerald text-graphite hover:bg-emerald/90"
              >
                <Link to="/project-inquiry">
                  Request Service Visit{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Link to="/customer-portal">Open Support Portal</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 10-tile grid */}
      <Section>
        <SectionHeader
          eyebrow="Field Engineering Portfolio"
          title="Ten stages. One handover-ready factory."
          lede="From heavy erection to lifetime service — every step executed by NEVO engineers under formal quality and safety protocols."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TILES.map((tile, i) => (
            <motion.div
              key={tile.tag}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <SurfaceCard className="overflow-hidden h-full">
                <div className="relative aspect-[3/2] overflow-hidden bg-muted">
                  <img
                    src={tile.img}
                    alt={tile.title}
                    loading="lazy"
                    width={1600}
                    height={1067}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-sm bg-emerald px-2 py-1 font-mono text-xs font-semibold text-graphite">
                    {tile.tag}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {tile.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {tile.body}
                  </p>
                </div>
              </SurfaceCard>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Capabilities */}
      <Section className="bg-muted/30">
        <SectionHeader
          eyebrow="Service Capabilities"
          title="A complete field engineering & support discipline."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div
              key={c.code}
              className="flex items-center gap-4 rounded-lg border border-border bg-background p-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald/10 text-emerald">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="font-mono text-sm font-semibold">{c.code}</div>
                <div className="text-sm text-muted-foreground">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div className="rounded-2xl bg-graphite text-white p-10 md:p-14 flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 text-emerald">
              <LifeBuoy className="h-5 w-5" />
              <span className="text-xs font-mono uppercase tracking-widest">
                After-Sales & Field Service
              </span>
            </div>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              Book a field engineer, spare part or upgrade.
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">
              Whether it's commissioning a new line, resolving a production
              issue or scheduling preventive maintenance — NEVO's field
              engineering team is one request away.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              asChild
              size="lg"
              className="bg-emerald text-graphite hover:bg-emerald/90"
            >
              <Link to="/project-inquiry">
                Request Service <Wrench className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
