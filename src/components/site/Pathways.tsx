import { useTranslation } from "react-i18next";
import { ArrowUpRight, Factory, Cog, Layers, PackageCheck } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";
import { GridBoard, BoardCell } from "@/components/site/cards";
import { Link } from "@/components/site/LocalizedLink";

export function Pathways() {
  const { t } = useTranslation();
  const PATHS = [
    { n: "01", icon: Factory, key: "build", href: "/solutions/factory-development" },
    { n: "02", icon: Cog, key: "improve", href: "/solutions/engineering-consultancy" },
    { n: "03", icon: Layers, key: "source", href: "/solutions/raw-materials" },
    { n: "04", icon: PackageCheck, key: "buy", href: "/solutions/sandwich-panels" },
  ] as const;

  return (
    <Section id="pathways" tone="surface">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeader
            eyebrow={t("home.pathways.eyebrow")}
            title={t("home.pathways.title")}
            lede={t("home.pathways.lede")}
          />
        </div>

        <GridBoard className="lg:col-span-8 sm:grid-cols-2">
          {PATHS.map((p) => (
            <BoardCell
              key={p.n}
              as={Link}
              // @ts-expect-error Link forwards to
              to={p.href}
              interactive
              className="flex flex-col justify-between gap-8 card-accent-line min-h-[240px]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-widest text-accent">
                    {p.n} /04
                  </span>
                  <p.icon
                    className="size-5 text-muted-foreground transition-all duration-300 group-hover:text-foreground group-hover:-translate-y-0.5"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-h3 mt-8 text-foreground">
                  {t(`home.pathways.${p.key}.title`)}
                </h3>
                <p className="text-body mt-3">{t(`home.pathways.${p.key}.desc`)}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-foreground">
                {t(`home.pathways.${p.key}.cta`)}
                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </BoardCell>
          ))}
        </GridBoard>
      </div>
    </Section>
  );
}
