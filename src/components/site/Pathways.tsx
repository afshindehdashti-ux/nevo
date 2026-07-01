import { ArrowUpRight, Factory, Cog, Layers, PackageCheck } from "lucide-react";

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
    <section id="pathways" className="border-b border-border bg-surface">
      <div className="container-wide py-20 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="eyebrow mb-4">Start here</div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              What are you trying to achieve?
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Every NEVO engagement begins with your goal — not a product list. Choose a
              pathway to see how our engineering team supports each stage of the sandwich
              panel industry.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:col-span-8">
            {PATHS.map((p) => (
              <a
                key={p.n}
                href="#contact"
                className="group relative flex flex-col justify-between gap-8 bg-background p-6 transition-colors hover:bg-surface-muted sm:p-8"
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
                  <h3 className="mt-8 text-xl font-semibold tracking-tight text-foreground">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {p.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-foreground">
                  {p.cta}
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
