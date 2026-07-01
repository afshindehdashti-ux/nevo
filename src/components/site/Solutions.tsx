import {
  ArrowUpRight,
  Building2,
  ClipboardList,
  Wrench,
  Layers,
  PackageCheck,
  LifeBuoy,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";
import { GridBoard, BoardCell } from "@/components/site/cards";

const SOLUTIONS = [
  {
    n: "01",
    icon: Building2,
    title: "Factory Development",
    desc: "Turnkey guidance for new sandwich panel factories — feasibility, layout, procurement and commissioning.",
  },
  {
    n: "02",
    icon: ClipboardList,
    title: "Engineering Consultancy",
    desc: "Process design, layout, production optimization, modernization and commissioning support.",
  },
  {
    n: "03",
    icon: Wrench,
    title: "Production Lines",
    desc: "Continuous & discontinuous lines, roll forming, PU/PIR foaming systems and automation.",
  },
  {
    n: "04",
    icon: Layers,
    title: "Raw Materials",
    desc: "PIR / PUR systems, PPGI, GI and Aluzinc coils, rock wool, adhesives and consumables.",
  },
  {
    n: "05",
    icon: PackageCheck,
    title: "Finished Panels",
    desc: "Supply of finished sandwich panels across selected regional markets.",
  },
  {
    n: "06",
    icon: LifeBuoy,
    title: "Technical Support",
    desc: "Training, spare parts, factory audits, troubleshooting and long-term operational support.",
  },
];

export function Solutions() {
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Solutions"
        title="A complete industrial partner for the sandwich panel industry."
        aside={
          <a
            href="#"
            className="text-xs font-medium uppercase tracking-widest text-foreground underline decoration-border decoration-1 underline-offset-4 hover:decoration-accent"
          >
            Explore Solutions →
          </a>
        }
      />

      <GridBoard className="sm:grid-cols-2 lg:grid-cols-3">
        {SOLUTIONS.map((s) => (
          <BoardCell
            key={s.n}
            as="a"
            // @ts-expect-error href on anchor
            href="#contact"
            interactive
            className="card-accent-line flex flex-col gap-6 min-h-[240px]"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-widest text-muted-foreground">
                {s.n}
              </span>
              <s.icon
                className="size-5 text-muted-foreground transition-colors group-hover:text-foreground"
                strokeWidth={1.5}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-h3 text-foreground">{s.title}</h3>
              <p className="text-body mt-2">{s.desc}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-foreground">
              Learn more
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </BoardCell>
        ))}
      </GridBoard>
    </Section>
  );
}
