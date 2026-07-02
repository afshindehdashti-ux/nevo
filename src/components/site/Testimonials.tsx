import { useTranslation } from "react-i18next";
import { Quote } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";

const KEYS = ["q1", "q2", "q3"] as const;

export function Testimonials() {
  const { t } = useTranslation();
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow={t("home.testimonials.eyebrow")}
        title={t("home.testimonials.title")}
        lede={t("home.testimonials.lede")}
      />

      <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
        {KEYS.map((k) => (
          <figure
            key={k}
            className="flex h-full flex-col justify-between gap-10 bg-background p-8 sm:p-10"
          >
            <Quote className="size-6 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <blockquote className="text-[1.0625rem] leading-relaxed tracking-[-0.01em] text-foreground">
              &ldquo;{t(`home.testimonials.${k}.quote`)}&rdquo;
            </blockquote>
            <figcaption className="border-t border-border pt-5">
              <div className="text-sm font-semibold text-foreground">
                {t(`home.testimonials.${k}.author`)}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {t(`home.testimonials.${k}.org`)}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
