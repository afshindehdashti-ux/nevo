import { useTranslation } from "react-i18next";
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
import { Link } from "@/components/site/LocalizedLink";

const SOLUTIONS = [
  { n: "01", icon: Building2, key: "factory", href: "/solutions/factory-development" },
  { n: "02", icon: ClipboardList, key: "consultancy", href: "/solutions/engineering-consultancy" },
  { n: "03", icon: Wrench, key: "productionLines", href: "/solutions/production-lines" },
  { n: "04", icon: Layers, key: "rawMaterials", href: "/solutions/raw-materials" },
  { n: "05", icon: PackageCheck, key: "finishedPanels", href: "/solutions/sandwich-panels" },
  { n: "06", icon: LifeBuoy, key: "aiAssistant", href: "/ai-assistant" },
] as const;

export function Solutions() {
  const { t } = useTranslation();
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow={t("home.solutionsSection.eyebrow")}
        title={t("home.solutionsSection.title")}
        aside={
          <Link
            to="/solutions/factory-development"
            className="text-xs font-medium uppercase tracking-widest text-foreground underline decoration-border decoration-1 underline-offset-4 hover:decoration-accent"
          >
            {t("home.solutionsSection.asideCta")}
          </Link>
        }
      />

      <GridBoard className="sm:grid-cols-2 lg:grid-cols-3">
        {SOLUTIONS.map((s) => (
          <BoardCell
            key={s.n}
            as={Link}
            // @ts-expect-error Link forwards to
            to={s.href}
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
              <h3 className="text-h3 text-foreground">
                {t(`home.solutionsSection.${s.key}.title`)}
              </h3>
              <p className="text-body mt-2">{t(`home.solutionsSection.${s.key}.desc`)}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-foreground">
              {t("home.solutionsSection.learnMore")}
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </BoardCell>
        ))}
      </GridBoard>
    </Section>
  );
}
