import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/lib/seo";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, FlaskConical, Cpu } from "lucide-react";

import ri01 from "@/assets/research/ri-01-rd-lab.jpg";
import ri02 from "@/assets/research/ri-02-material-science.jpg";
import ri03 from "@/assets/research/ri-03-pir-foam.jpg";
import ri04 from "@/assets/research/ri-04-fire.jpg";
import ri05 from "@/assets/research/ri-05-thermal.jpg";
import ri06 from "@/assets/research/ri-06-digital-twin.jpg";
import ri07 from "@/assets/research/ri-07-prototype-line.jpg";
import ri08 from "@/assets/research/ri-08-ai-analytics.jpg";
import ri09 from "@/assets/research/ri-09-collaboration.jpg";
import ri10 from "@/assets/research/ri-10-future-lab.jpg";

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { SurfaceCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";

const TITLE =
  "Research & Innovation Center — Sandwich Panel R&D | NEVO Industrial";
const DESCRIPTION =
  "Inside the NEVO Research & Innovation Center: PIR foam research, fire and thermal testing, digital twins, AI analytics and prototype production for next-generation sandwich panels.";
const URL_PATH = "/research-innovation";

const TILES = [
  {
    tag: "01",
    title: "Research & Development Laboratory",
    body: "State-of-the-art R&D laboratory focused on developing innovative panel solutions and advanced insulation technologies.",
    img: ri01,
  },
  {
    tag: "02",
    title: "Material Science Laboratory",
    body: "Advanced material analysis and micro-structural testing to engineer high-performance core materials and panel systems.",
    img: ri02,
  },
  {
    tag: "03",
    title: "PIR Foam Research",
    body: "Continuous research to refine PIR formulations for superior insulation, mechanical strength and environmental performance.",
    img: ri03,
  },
  {
    tag: "04",
    title: "Fire Resistance Research",
    body: "Developing and validating fire-safe panel systems in certified furnaces to advance building safety worldwide.",
    img: ri04,
  },
  {
    tag: "05",
    title: "Thermal Performance Testing",
    body: "Precision heat-flow measurement of core lambda values to optimise insulation efficiency and lifetime energy savings.",
    img: ri05,
  },
  {
    tag: "06",
    title: "Digital Twin & 3D Simulation",
    body: "Advanced simulation and digital-twin models predict panel and factory performance long before physical production.",
    img: ri06,
  },
  {
    tag: "07",
    title: "Prototype Manufacturing Line",
    body: "Compact pilot line for testing new formulations, facings and production technologies before full-scale roll-out.",
    img: ri07,
  },
  {
    tag: "08",
    title: "AI Engineering & Data Analytics",
    body: "Leveraging AI and industrial data analytics to optimise processes, improve quality and drive continuous innovation.",
    img: ri08,
  },
  {
    tag: "09",
    title: "Engineering Collaboration",
    body: "Cross-functional engineering teams co-create innovative solutions that deliver measurable customer value.",
    img: ri09,
  },
  {
    tag: "10",
    title: "Future Technology Innovation Lab",
    body: "Exploring next-generation sustainable materials and building systems that shape the factories of tomorrow.",
    img: ri10,
  },
];

const PILLARS = [
  { code: "R&D", label: "Applied Research Program" },
  { code: "AI/ML", label: "Data-Driven Optimisation" },
  { code: "BIM", label: "Digital Twin Modelling" },
  { code: "ESG", label: "Sustainable Materials" },
  { code: "IP", label: "Proprietary Formulations" },
  { code: "EDU", label: "Engineering Knowledge Hub" },
];

export const Route = createFileRoute("/research-innovation")({
  component: ResearchInnovationPage,
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

function ResearchInnovationPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-graphite text-white">
        <div className="absolute inset-0 opacity-40">
          <img
            src={ri01}
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
            <Eyebrow className="text-emerald">Innovate Today · Build Tomorrow</Eyebrow>
            <h1 className="mt-4 text-5xl md:text-6xl font-semibold tracking-tight">
              Research and innovation, engineered into every panel.
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-2xl">
              Our Research & Innovation Center advances the science of insulated
              sandwich panels — from PIR chemistry and fire performance to digital
              twins and AI-driven manufacturing intelligence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-emerald text-graphite hover:bg-emerald/90">
                <Link to="/download-center">
                  Explore R&D Publications <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Link to="/project-inquiry">Partner with Our Engineers</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 10-tile grid */}
      <Section>
        <SectionHeader
          eyebrow="Research & Innovation Program"
          title="Ten disciplines. One innovation engine."
          lede="From molecular chemistry to AI-controlled production lines, our R&D program drives every generation of NEVO panel technology."
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

      {/* Pillars */}
      <Section className="bg-muted/30">
        <SectionHeader
          eyebrow="Innovation Pillars"
          title="Where our research investment goes."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.code}
              className="flex items-center gap-4 rounded-lg border border-border bg-background p-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald/10 text-emerald">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="font-mono text-sm font-semibold">{p.code}</div>
                <div className="text-sm text-muted-foreground">{p.label}</div>
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
              <Cpu className="h-5 w-5" />
              <span className="text-xs font-mono uppercase tracking-widest">
                Co-development
              </span>
            </div>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              Build the next generation of panels with our engineers.
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">
              Joint development, custom formulations and prototype runs — bring
              your specification to our R&D team and take a proven solution to
              production.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild size="lg" className="bg-emerald text-graphite hover:bg-emerald/90">
              <Link to="/project-inquiry">
                Start a Research Project <FlaskConical className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
