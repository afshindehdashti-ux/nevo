import { Section, SectionHeader } from "@/components/site/primitives";
import { GridBoard, BoardCell } from "@/components/site/cards";

const INDUSTRIES = [
  { name: "Cold Storage", note: "Low-temperature PIR envelopes" },
  { name: "Food Processing", note: "Hygienic wall & ceiling systems" },
  { name: "Pharmaceutical", note: "GMP-compliant clean environments" },
  { name: "Clean Rooms", note: "ISO-classified enclosures" },
  { name: "Warehousing & Logistics", note: "Large-span industrial roofing" },
  { name: "Industrial Buildings", note: "Structural insulated envelopes" },
  { name: "Modular Buildings", note: "Prefab & site-assembled units" },
  { name: "Commercial Construction", note: "Architectural panel facades" },
];

export function Industries() {
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Industries served"
        title="Sandwich panel systems engineered for demanding environments."
      />

      <GridBoard className="sm:grid-cols-2 lg:grid-cols-4">
        {INDUSTRIES.map((i) => (
          <BoardCell
            key={i.name}
            interactive
            className="card-accent-line justify-between gap-6"
          >
            <div className="h-px w-8 bg-border transition-all group-hover:bg-accent" />
            <div>
              <div className="text-base font-semibold tracking-tight text-foreground">
                {i.name}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{i.note}</div>
            </div>
          </BoardCell>
        ))}
      </GridBoard>
    </Section>
  );
}
