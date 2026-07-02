import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { SITE } from "@/lib/seo";
import { motion } from "motion/react";
import { ArrowRight, Building2, Compass, Ruler } from "lucide-react";

import fl01 from "@/assets/factory-layouts/fl-01-master.jpg";
import fl02 from "@/assets/factory-layouts/fl-02-3d.jpg";
import fl03 from "@/assets/factory-layouts/fl-03-production-flow.jpg";
import fl04 from "@/assets/factory-layouts/fl-04-material-flow.jpg";
import fl05 from "@/assets/factory-layouts/fl-05-warehouse.jpg";
import fl06 from "@/assets/factory-layouts/fl-06-utility.jpg";
import fl07 from "@/assets/factory-layouts/fl-07-office.jpg";
import fl08 from "@/assets/factory-layouts/fl-08-truck.jpg";
import fl09 from "@/assets/factory-layouts/fl-09-expansion.jpg";
import fl10 from "@/assets/factory-layouts/fl-10-completed.jpg";

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { SurfaceCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";
import { ogImageMeta } from "@/lib/og-images";

const TITLE =
  "Factory Layouts & Masterplanning — Industrial EPC Design | NEVO Industrial";
const DESCRIPTION =
  "Master factory layouts, 3D visualisations, production and material flow planning, utility layouts and future expansion masterplans engineered by NEVO Industrial, Dubai.";
const URL_PATH = "/factory-layouts";

const TILES = [
  {
    tag: "01",
    title: "Master Factory Layout",
    body: "Comprehensive top-view masterplan showing all buildings, roads, utilities and green areas of the complete factory campus.",
    img: fl01,
  },
  {
    tag: "02",
    title: "3D Factory Layout",
    body: "Realistic 3D visualisation of the entire facility for better stakeholder alignment and construction planning.",
    img: fl02,
  },
  {
    tag: "03",
    title: "Production Flow Layout",
    body: "Detailed production hall layout showing all major equipment, lines and operational flow sequence.",
    img: fl03,
  },
  {
    tag: "04",
    title: "Material Flow Planning",
    body: "Colour-coded material flow diagram ensuring efficient movement of raw materials, WIP and finished products.",
    img: fl04,
  },
  {
    tag: "05",
    title: "Warehouse & Logistics Layout",
    body: "Optimised warehouse layout for high-density storage, inventory control and smooth logistics operations.",
    img: fl05,
  },
  {
    tag: "06",
    title: "Utility & Energy Plant Layout",
    body: "Utility systems layout for boilers, chillers, compressed air, water treatment and electrical distribution.",
    img: fl06,
  },
  {
    tag: "07",
    title: "Office & Administration Building",
    body: "Modern office and administration building designed for efficiency, comfort and functional integration with the plant.",
    img: fl07,
  },
  {
    tag: "08",
    title: "Truck Traffic & Loading Area",
    body: "Traffic circulation and loading dock layout designed for safe, efficient truck movement and dispatch operations.",
    img: fl08,
  },
  {
    tag: "09",
    title: "Future Expansion Masterplan",
    body: "Reserved expansion plots and utility corridors that support business growth and future production capacity.",
    img: fl09,
  },
  {
    tag: "10",
    title: "Completed Factory vs Original Design",
    body: "Our designs become reality — the executed factory delivered on the original masterplan intent.",
    img: fl10,
  },
];

const CAPABILITIES = [
  { code: "MASTERPLAN", label: "Campus & site masterplanning" },
  { code: "3D / BIM", label: "3D coordination and BIM modelling" },
  { code: "FLOW", label: "Production & material flow design" },
  { code: "UTILITIES", label: "Utility and energy plant design" },
  { code: "LOGISTICS", label: "Warehouse and traffic engineering" },
  { code: "EXPANSION", label: "Phased growth masterplans" },
];

export const Route = createFileRoute("/$lang/factory-layouts")({
  component: FactoryLayoutsPage,
  head: ({ params }) => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
        ...ogImageMeta("/factory-layouts"),
      { property: "og:url", content: `${SITE.url}/${params.lang}${URL_PATH}` },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/${params.lang}${URL_PATH}` }],
  }),
});

function FactoryLayoutsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-graphite text-white">
        <div className="absolute inset-0 opacity-40">
          <img loading="lazy" decoding="async"
            src={fl02}
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
              Masterplanning · Layouts · EPC Engineering
            </Eyebrow>
            <h1 className="mt-4 text-5xl md:text-6xl font-semibold tracking-tight">
              Every factory begins as a masterplan.
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-2xl">
              From the first site plot to the final commissioned building, NEVO
              engineers factories that flow — optimised for production, logistics,
              utilities and long-term expansion.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-emerald text-graphite hover:bg-emerald/90"
              >
                <Link to="/factory-layout-generator">
                  Try the Layout Generator{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Link to="/project-inquiry">Request a Masterplan</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 10-tile grid */}
      <Section>
        <SectionHeader
          eyebrow="Factory Layouts Portfolio"
          title="Ten disciplines. One integrated masterplan."
          lede="From orthographic masterplans to executed reality — every drawing engineered to construction-grade precision."
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
          eyebrow="Engineering Capabilities"
          title="A complete masterplanning discipline."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div
              key={c.code}
              className="flex items-center gap-4 rounded-lg border border-border bg-background p-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald/10 text-emerald">
                <Compass className="h-6 w-6" />
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
              <Ruler className="h-5 w-5" />
              <span className="text-xs font-mono uppercase tracking-widest">
                EPC Design Studio
              </span>
            </div>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              Turn your site into a construction-ready factory plan.
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">
              Share your plot, capacity target and product mix — our engineers
              will return a complete masterplan with production flow, utilities
              and expansion strategy.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              asChild
              size="lg"
              className="bg-emerald text-graphite hover:bg-emerald/90"
            >
              <Link to="/project-inquiry">
                Start a Masterplan <Building2 className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
