import { Section, SectionHeader } from "@/components/site/primitives";
import { GridBoard, BoardCell } from "@/components/site/cards";

const SOLUTIONS = [
  {
    n: "01",
    title: "Factory Development",
    desc: "Turnkey guidance for investors building new sandwich panel factories — feasibility, layout, procurement and commissioning.",
  },
  {
    n: "02",
    title: "Engineering Consultancy",
    desc: "Factory layout, process design, production optimization, technical consulting and commissioning support.",
  },
  {
    n: "03",
    title: "Raw Material Solutions",
    desc: "PIR / PUR systems, PPGI, GI and Aluzinc coils, rock wool, adhesives and qualified consumables.",
  },
  {
    n: "04",
    title: "Production Line Solutions",
    desc: "Complete continuous & discontinuous lines, roll forming, PU/PIR foaming systems, automation and modernization.",
  },
  {
    n: "05",
    title: "Finished Panel Solutions",
    desc: "Supply of finished sandwich panels across selected regional markets in the Middle East, Africa and Eurasia.",
  },
  {
    n: "06",
    title: "Technical Support",
    desc: "Training, spare parts, factory audits, troubleshooting and long-term operational support.",
  },
];

export function Solutions() {
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Six engineering pillars"
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
          <BoardCell key={s.n} interactive className="card-accent-line gap-4">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-widest text-muted-foreground">
                {s.n}
              </span>
              <span className="h-px w-8 bg-border transition-all group-hover:w-16 group-hover:bg-accent" />
            </div>
            <h3 className="text-h3 mt-4 text-foreground">{s.title}</h3>
            <p className="text-body mt-2">{s.desc}</p>
          </BoardCell>
        ))}
      </GridBoard>
    </Section>
  );
}
