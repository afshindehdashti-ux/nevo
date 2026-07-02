import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { SITE } from "@/lib/seo";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck, Award, FlaskConical } from "lucide-react";

import qa01 from "@/assets/quality/qa-01-lab.jpg";
import qa02 from "@/assets/quality/qa-02-thickness.jpg";
import qa03 from "@/assets/quality/qa-03-fire.jpg";
import qa04 from "@/assets/quality/qa-04-thermal.jpg";
import qa05 from "@/assets/quality/qa-05-adhesion.jpg";
import qa06 from "@/assets/quality/qa-06-dimensional.jpg";
import qa07 from "@/assets/quality/qa-07-density.jpg";
import qa08 from "@/assets/quality/qa-08-iso.jpg";
import qa09 from "@/assets/quality/qa-09-audit.jpg";
import qa10 from "@/assets/quality/qa-10-shipment.jpg";

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { SurfaceCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";

const TITLE =
  "Quality Assurance & Certifications — Sandwich Panel Testing | NEVO Industrial";
const DESCRIPTION =
  "Independent quality control: fire, thermal, adhesion and dimensional testing of sandwich panels. ISO 9001, 14001, 45001 certified. NEVO Industrial, Dubai.";
const URL_PATH = "/quality";

const TILES = [
  {
    tag: "01",
    title: "Quality Control Laboratory",
    body: "Advanced laboratory equipped with calibrated instruments to verify raw materials and finished panels against international standards.",
    img: qa01,
  },
  {
    tag: "02",
    title: "Panel Thickness Measurement",
    body: "Precise multi-point thickness measurement using calibrated digital gauges to guarantee dimensional accuracy on every panel.",
    img: qa02,
  },
  {
    tag: "03",
    title: "Fire Resistance Testing",
    body: "Panels tested to EN 13501-1 in a certified furnace to evaluate fire performance and ensure real-world safety.",
    img: qa03,
  },
  {
    tag: "04",
    title: "Thermal Conductivity Testing",
    body: "Heat-flow meters measure core lambda (λ) values to certify insulation efficiency and long-term energy savings.",
    img: qa04,
  },
  {
    tag: "05",
    title: "Adhesion & Bond Strength",
    body: "Universal tensile testing on skin-to-core bond verifies delamination resistance and long-term structural durability.",
    img: qa05,
  },
  {
    tag: "06",
    title: "Dimensional Inspection",
    body: "Comprehensive length, width, squareness and flatness checks confirm every panel meets exact design tolerances.",
    img: qa06,
  },
  {
    tag: "07",
    title: "Density & Core Analysis",
    body: "Core density and composition are analysed on precision analytical balances to guarantee lot-to-lot consistency.",
    img: qa07,
  },
  {
    tag: "08",
    title: "ISO & International Certification",
    body: "Management systems certified to ISO 9001, ISO 14001 and ISO 45001 by accredited third-party bodies.",
    img: qa08,
  },
  {
    tag: "09",
    title: "Factory Quality Audit",
    body: "Regular internal and third-party audits maintain the highest production, safety and continuous-improvement standards.",
    img: qa09,
  },
  {
    tag: "10",
    title: "Final Inspection Before Shipment",
    body: "Every panel is visually inspected, packed and sealed before dispatch to ensure flawless delivery worldwide.",
    img: qa10,
  },
];

const CERTS = [
  { code: "ISO 9001:2015", label: "Quality Management" },
  { code: "ISO 14001:2015", label: "Environmental Management" },
  { code: "ISO 45001:2018", label: "Occupational Health & Safety" },
  { code: "EN 14509", label: "Sandwich Panel Standard" },
  { code: "EN 13501-1", label: "Fire Reaction Classification" },
  { code: "CE Marking", label: "European Conformity" },
];

export const Route = createFileRoute("/$lang/quality")({
  component: QualityPage,
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
  }),
});

function QualityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-graphite text-white">
        <div className="absolute inset-0 opacity-40">
          <img loading="lazy" decoding="async"
            src={qa01}
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
            <Eyebrow className="text-emerald">Quality · Tested · Certified · Trusted</Eyebrow>
            <h1 className="mt-4 text-5xl md:text-6xl font-semibold tracking-tight">
              Engineering-grade quality, verified at every step.
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-2xl">
              From incoming raw materials to the final panel leaving our warehouse,
              NEVO applies certified test protocols and third-party audits to
              guarantee performance, safety and durability.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-emerald text-graphite hover:bg-emerald/90">
                <Link to="/download-center">Download Test Reports <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Link to="/project-inquiry">Request an Audit</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 10-tile grid */}
      <Section>
        <SectionHeader
          eyebrow="Quality Assurance Program"
          title="Ten controls, one uncompromising standard."
          lede="Each panel is measured, tested and documented against international specifications before it earns the NEVO stamp."
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
                  <h3 className="text-lg font-semibold tracking-tight">{tile.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {tile.body}
                  </p>
                </div>
              </SurfaceCard>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Certifications */}
      <Section className="bg-muted/30">
        <SectionHeader
          eyebrow="Certifications"
          title="Independently certified. Internationally trusted."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CERTS.map((c) => (
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
              <Award className="h-5 w-5" />
              <span className="text-xs font-mono uppercase tracking-widest">Quality guarantee</span>
            </div>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              Request project-specific test reports.
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">
              Fire, thermal, mechanical and dimensional test data for the exact panel
              specification of your project — delivered by our engineering team.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild size="lg" className="bg-emerald text-graphite hover:bg-emerald/90">
              <Link to="/project-inquiry">Contact Engineering <FlaskConical className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
