import {
  Snowflake,
  UtensilsCrossed,
  Factory,
  FlaskConical,
  Warehouse,
  Boxes,
  Building,
  Sprout,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";
import { GridBoard, BoardCell } from "@/components/site/cards";

const INDUSTRIES = [
  { name: "Cold Storage", note: "Low-temperature PIR envelopes", icon: Snowflake },
  { name: "Food Processing", note: "Hygienic wall & ceiling systems", icon: UtensilsCrossed },
  { name: "Industrial Buildings", note: "Structural insulated envelopes", icon: Factory },
  { name: "Clean Rooms", note: "ISO-classified enclosures", icon: FlaskConical },
  { name: "Warehousing", note: "Large-span industrial roofing", icon: Warehouse },
  { name: "Modular Buildings", note: "Prefab & site-assembled units", icon: Boxes },
  { name: "Commercial Buildings", note: "Architectural panel facades", icon: Building },
  { name: "Agriculture", note: "Insulated agri-industrial buildings", icon: Sprout },
];

export function Industries() {
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Industries served"
        title="Sandwich panel systems engineered for demanding environments."
      />

      <GridBoard className="sm:grid-cols-2 lg:grid-cols-4">
        {INDUSTRIES.map((i) => (
          <BoardCell
            key={i.name}
            interactive
            className="card-accent-line justify-between gap-6 min-h-[180px]"
          >
            <i.icon
              className="size-5 text-muted-foreground transition-colors group-hover:text-accent"
              strokeWidth={1.5}
            />
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
