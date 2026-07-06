import { useTranslation } from "react-i18next";
import { Compass, MapPin, Globe2, BookOpenCheck, Layers3, HandshakeIcon } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";

const PROOFS = [
  { icon: Compass, key: "engineering" },
  { icon: MapPin, key: "dubai" },
  { icon: Globe2, key: "network" },
  { icon: BookOpenCheck, key: "consultancy" },
  { icon: Layers3, key: "integrated" },
  { icon: HandshakeIcon, key: "partnership" },
] as const;

export function WhyNevo() {
  const { t } = useTranslation();
  return (
    <Section tone="primary" bordered={false}>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeader
            eyebrow={t("home.whyNevo.eyebrow")}
            onTone="primary"
            title={t("home.whyNevo.title")}
            lede={t("home.whyNevo.lede")}
          />
        </div>

        <div className="grid gap-px overflow-hidden rounded-lg bg-white/10 sm:grid-cols-2 lg:col-span-7">
          {PROOFS.map((p, i) => (
            <div
              key={p.key}
              className="group relative bg-primary p-6 transition-colors hover:bg-white/[0.04] sm:p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <p.icon className="size-5 text-accent" strokeWidth={1.5} />
                <span className="font-mono text-[10px] tracking-widest text-white/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-h3 text-primary-foreground">
                {t(`home.whyNevo.${p.key}.title`)}
              </h3>
              <p className="text-body mt-3 text-primary-foreground/65">
                {t(`home.whyNevo.${p.key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
