import { useTranslation } from "react-i18next";
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
  { key: "coldStorage", icon: Snowflake },
  { key: "food",        icon: UtensilsCrossed },
  { key: "industrial",  icon: Factory },
  { key: "cleanRooms",  icon: FlaskConical },
  { key: "warehousing", icon: Warehouse },
  { key: "modular",     icon: Boxes },
  { key: "commercial",  icon: Building },
  { key: "agriculture", icon: Sprout },
] as const;

export function Industries() {
  const { t } = useTranslation();
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow={t("home.industriesSection.eyebrow")}
        title={t("home.industriesSection.title")}
      />

      <GridBoard className="sm:grid-cols-2 lg:grid-cols-4">
        {INDUSTRIES.map((i) => (
          <BoardCell
            key={i.key}
            interactive
            className="card-accent-line justify-between gap-6 min-h-[180px]"
          >
            <i.icon
              className="size-5 text-muted-foreground transition-colors group-hover:text-accent"
              strokeWidth={1.5}
            />
            <div>
              <div className="text-base font-semibold tracking-tight text-foreground">
                {t(`home.industriesSection.${i.key}.name`)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t(`home.industriesSection.${i.key}.note`)}
              </div>
            </div>
          </BoardCell>
        ))}
      </GridBoard>
    </Section>
  );
}
