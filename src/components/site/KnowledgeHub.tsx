import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";
import { Link } from "@/components/site/LocalizedLink";

const KEYS = ["a1", "a2", "a3", "a4", "a5", "a6"] as const;

export function KnowledgeHub() {
  const { t } = useTranslation();
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow={t("home.knowledgeSection.eyebrow")}
        title={t("home.knowledgeSection.title")}
        lede={t("home.knowledgeSection.lede")}
        aside={
          <Link
            to="/knowledge-hub"
            className="text-xs font-medium uppercase tracking-widest text-foreground underline decoration-border decoration-1 underline-offset-4 hover:decoration-accent"
          >
            {t("home.knowledgeSection.browse")}
          </Link>
        }
      />

      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {KEYS.map((k) => (
          <Link
            key={k}
            to="/knowledge-hub"
            className="group flex min-h-[220px] flex-col justify-between gap-6 bg-background p-6 transition-colors hover:bg-surface-muted sm:p-8"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {t(`home.knowledgeSection.${k}.tag`)}
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground">
                {t(`home.knowledgeSection.${k}.title`)}
              </h3>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {t(`home.knowledgeSection.${k}.read`)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
