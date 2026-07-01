import { ArrowUpRight, Factory, Cog, Layers, PackageCheck } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";
import { GridBoard, BoardCell } from "@/components/site/cards";

const PATHS = [
  {
    n: "01",
    icon: Factory,
    title: "Build a Factory",
    desc: "For investors and industrial companies planning a new sandwich panel factory. Feasibility, layout, engineering and commissioning.",
    cta: "Explore Factory Development",
  },
  {
    n: "02",
    icon: Cog,
    title: "Improve Production",
    desc: "For existing manufacturers who need optimization, engineering support, modernization or better line performance.",
    cta: "Engineering Consultancy",
  },
  {
    n: "03",
    icon: Layers,
    title: "Source Raw Materials",
    desc: "PIR & PUR systems, PPGI / GI / Aluzinc coils, rock wool, adhesives and consumables — sourced and qualified for panel manufacturing.",
    cta: "Raw Material Solutions",
  },
  {
    n: "04",
    icon: PackageCheck,
    title: "Buy Sandwich Panels",
    desc: "For contractors, developers and distributors sourcing finished panels across selected regional markets.",
    cta: "Finished Panel Solutions",
  },
];

export function Pathways() {
  return (
    <Section id="pathways" tone="surface">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeader
            eyebrow="Start here"
            title="What are you trying to achieve?"
            lede="Every NEVO engagement begins with your goal — not a product list. Choose a pathway to see how our engineering team supports each stage of the sandwich panel industry."
          />
        </div>

        <GridBoard className="lg:col-span-8 sm:grid-cols-2">
          {PATHS.map((p) => (
            <BoardCell
              key={p.n}
              as="a"
              // @ts-expect-error href is valid on anchor
              href="#contact"
              interactive
              className="flex flex-col justify-between gap-8 card-accent-line"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-widest text-accent">
                    {p.n} /04
                  </span>
                  <p.icon
                    className="size-5 text-muted-foreground transition-colors group-hover:text-foreground"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-h3 mt-8 text-foreground">{p.title}</h3>
                <p className="text-body mt-3">{p.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-foreground">
                {p.cta}
                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </BoardCell>
          ))}
        </GridBoard>
      </div>
    </Section>
  );
}
