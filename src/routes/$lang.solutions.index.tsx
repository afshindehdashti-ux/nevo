import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { ArrowRight, Cpu, Layers, Wrench, Factory } from "lucide-react";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { SurfaceCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/seo";

const TITLE = "Solutions — Factory Development, Production Lines, Consultancy & Raw Materials | NEVO Industrial";
const DESCRIPTION =
  "Explore NEVO Industrial's engineering-led solutions: turnkey sandwich panel factories, high-speed production lines, engineering consultancy and premium raw materials for global manufacturers.";
const URL_PATH = "/solutions";

const SOLUTIONS = [
  {
    to: "/solutions/factory-development",
    icon: Factory,
    eyebrow: "Turnkey delivery",
    title: "Sandwich Panel Factories",
    lede: "End-to-end factory development — from feasibility and layout to commissioning and handover.",
  },
  {
    to: "/solutions/production-lines",
    icon: Cpu,
    eyebrow: "Line engineering",
    title: "Production Lines",
    lede: "PIR, PUR and rock-wool continuous lines engineered for capacity, uptime and product consistency.",
  },
  {
    to: "/solutions/engineering-consultancy",
    icon: Wrench,
    eyebrow: "Advisory",
    title: "Engineering Consultancy",
    lede: "Feasibility studies, plant audits, process optimisation and CAPEX/OPEX modelling for panel manufacturers.",
  },
  {
    to: "/solutions/raw-materials",
    icon: Layers,
    eyebrow: "Supply",
    title: "Raw Materials",
    lede: "Pre-painted steel coils, PIR/PUR chemistry, rock-wool cores and adhesives — sourced and delivered globally.",
  },
] as const;

function SolutionsIndex() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main">
        <Section tone="surface">
          <div className="max-w-3xl">
            <Eyebrow>Solutions</Eyebrow>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Engineering-led solutions for sandwich panel manufacturers.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Four integrated business areas — designed to be delivered together as a turnkey program, or independently as scoped engagements.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="primary">
                <Link to="/project-inquiry">Request a Quotation <ArrowRight className="!size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">Contact NEVO Sales</Link>
              </Button>
            </div>
          </div>
        </Section>

        <Section>
          <SectionHeader
            eyebrow="Four business areas"
            title="Choose an area to explore."
            lede="Each area is delivered by a dedicated engineering team, with shared documentation, standards and program governance."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {SOLUTIONS.map((s) => (
              <SurfaceCard key={s.to} className="p-8">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-md border border-border bg-background">
                    <s.icon className="size-5 text-accent" strokeWidth={1.5} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {s.eyebrow}
                  </span>
                </div>
                <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
                  {s.title}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">{s.lede}</p>
                <div className="mt-6">
                  <Link
                    to={s.to}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent"
                  >
                    Explore {s.title}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </SurfaceCard>
            ))}
          </div>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}

export const Route = createFileRoute("/$lang/solutions/")({
  head: ({ params }) => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/${params.lang}${URL_PATH}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/${params.lang}${URL_PATH}` }],
  }),

  component: SolutionsIndex,
});
