import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import heroImgAsset from "@/assets/premium/01-aerial-factory.jpg.asset.json";
const heroImg = heroImgAsset.url;
import { Section, Eyebrow } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/site/LocalizedLink";

export function FeaturedFactory() {
  const { t } = useTranslation();
  return (
    <Section tone="default">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <figure className="relative lg:col-span-7">
          <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
            <img
              src={heroImg}
              alt={t("home.featured.imgAlt")}
              className="aspect-[4/3] h-full w-full object-cover"
              loading="lazy"
            />
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/25 to-transparent p-5 text-white">
              <div className="font-mono text-[10px] tracking-widest text-white/70">
                {t("home.featured.figCaption")}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-white/90">
                <span className="inline-flex size-1.5 rounded-full bg-accent" />
                {t("home.featured.reference")}
              </div>
            </figcaption>
          </div>
        </figure>

        <div className="flex flex-col justify-center lg:col-span-5">
          <Eyebrow>{t("home.featured.eyebrow")}</Eyebrow>
          <h2 className="text-h1 mt-6 text-balance text-foreground">{t("home.featured.title")}</h2>
          <p className="text-body-lg mt-6">{t("home.featured.body1")}</p>
          <p className="text-body mt-4">{t("home.featured.body2")}</p>

          <div className="mt-10">
            <Button asChild variant="primary" size="lg">
              <Link to="/solutions/factory-development">
                {t("home.featured.cta")}
                <ArrowRight className="!size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
