import { useTranslation } from "react-i18next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/site/LocalizedLink";

export function CTABanner() {
  const { t } = useTranslation();
  const BULLETS = ["b1", "b2", "b3", "b4"] as const;
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 85% 20%, color-mix(in oklab, var(--color-accent) 22%, transparent), transparent 70%), radial-gradient(50% 60% at 10% 90%, rgba(255,255,255,0.06), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="container-wide section-y">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <div className="eyebrow mb-6 flex items-center gap-2 text-accent">
              <span className="inline-flex size-1.5 rounded-full bg-accent" />
              {t("home.ctaBanner.eyebrow")}
            </div>
            <h2 className="text-display text-balance text-primary-foreground">
              {t("home.ctaBanner.titlePart1")}{" "}
              <span className="text-primary-foreground/55">{t("home.ctaBanner.titlePart2")}</span>
            </h2>
            <p className="text-body-lg mt-8 max-w-2xl text-primary-foreground/70">
              {t("home.ctaBanner.lede")}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/project-inquiry">
                  {t("home.ctaBanner.primary")}
                  <ArrowRight className="!size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/ai-assistant">
                  {t("home.ctaBanner.secondary")}
                  <ArrowUpRight className="!size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-4">
            <ul className="grid gap-3">
              {BULLETS.map((k) => (
                <li
                  key={k}
                  className="flex items-start gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-primary-foreground/85 backdrop-blur-sm"
                >
                  <span className="mt-1.5 inline-flex size-1.5 shrink-0 rounded-full bg-accent" />
                  {t(`home.ctaBanner.${k}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
