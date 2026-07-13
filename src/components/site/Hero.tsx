import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useTranslation } from "react-i18next";
import heroDesktopAsset from "@/assets/premium/homepage-hero-desktop.jpg.asset.json";
import heroMobileAsset from "@/assets/premium/homepage-hero-mobile.jpg.asset.json";
import { Button } from "@/components/ui/button";

const heroDesktop = heroDesktopAsset.url;
const heroMobile = heroMobileAsset.url;


/** Original hero photography only: no video, no added panel, no duplicated object. */
export function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative isolate -mt-20 overflow-hidden bg-black text-white md:-mt-24">
      <h1 className="sr-only">
        {t("home.heroTitle")} — {t("brand.name")}, {t("brand.location")}
      </h1>
      <HeroDesktop />
      <HeroMobile />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  DESKTOP + TABLET                                                   */
/* ------------------------------------------------------------------ */

function HeroDesktop() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const imageY = useTransform(scrollYProgress, [0, 0.35], [0, 18]);
  return (
    <div className="relative hidden min-h-[85vh] md:block lg:min-h-[95vh]">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.img
          src={heroDesktop}
          alt="NEVO continuous double-belt laminator producing a PIR sandwich panel with PPGI facings"
          className="h-full w-full object-cover will-change-transform"
          fetchPriority="high"
          decoding="async"
          style={{ objectPosition: "72% center", y: reduce ? 0 : imageY }}
        />
        {/* Left-side readability wash */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0.35) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent"
        />
      </div>

      <div className="container-wide relative flex min-h-[85vh] flex-col justify-between px-6 pt-36 pb-12 md:px-6 lg:min-h-[95vh] lg:px-8 lg:pt-44 lg:pb-16">
        <div className="max-w-3xl">
          <div className="eyebrow mb-6 flex items-center gap-2 text-white/70">
            <span className="inline-flex size-1.5 rounded-full bg-accent" />
            Dubai · Factory Development · Production Lines · Raw Materials
          </div>

          <p aria-hidden className="text-display text-balance text-white">
            {t("home.heroTitle")}
          </p>

          <p className="text-body-lg mt-8 max-w-2xl leading-relaxed text-white/75">
            {t("home.heroSubtitle")}
          </p>

          <div className="mt-10 flex flex-row items-center gap-3">
            <Button asChild size="lg">
              <a href="/project-inquiry">
                {t("home.heroCtaPrimary")}
                <ArrowRight className="!size-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="/ai-assistant">
                {t("home.heroCtaSecondary")}
                <ArrowUpRight className="!size-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-8 border-t border-white/15 pt-6 md:flex-row md:items-end md:justify-between">
          <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
            {[
              { k: "Top facing", v: "PPGI pre-painted steel" },
              { k: "Core", v: "PIR rigid foam" },
              { k: "Bottom facing", v: "PPGI pre-painted steel" },
            ].map((s) => (
              <div key={s.k} className="border-l border-accent/60 pl-3">
                <dt className="text-[11px] font-medium uppercase tracking-widest text-white/55">
                  {s.k}
                </dt>
                <dd className="mt-1 text-sm font-medium text-white">{s.v}</dd>
              </div>
            ))}
          </dl>

          <a
            href="#pathways"
            className="group inline-flex items-center gap-2 self-start font-mono text-[10px] uppercase tracking-widest text-white/60 transition-colors hover:text-white md:self-auto"
          >
            <span>Explore</span>
            <ChevronDown className="size-3.5 animate-bounce" />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MOBILE                                                             */
/* ------------------------------------------------------------------ */

function HeroMobile() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const imageY = useTransform(scrollYProgress, [0, 0.35], [0, 12]);
  return (
    <div className="relative block min-h-[100svh] overflow-hidden md:hidden">
      <motion.img
        src={heroMobile}
        alt="NEVO double-belt laminator producing a PIR sandwich panel with PPGI facings"
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
        style={{ objectPosition: "50% center", y: reduce ? 0 : imageY }}
        fetchPriority="high"
        decoding="async"
      />
      {/* Top + bottom readability washes */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 28%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.9) 100%)",
        }}
      />

      <div className="relative flex min-h-[100svh] flex-col justify-between px-6 pt-32 pb-10">
        <div>
          <div className="eyebrow mb-5 flex items-center gap-2 text-white/70">
            <span className="inline-flex size-1.5 rounded-full bg-accent" />
            {t("brand.location")} · {t("brand.sector")}
          </div>
          <p
            aria-hidden
            className="text-4xl font-semibold leading-[1.05] tracking-tight text-white"
          >
            {t("home.heroTitle")}
          </p>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/75">
            {t("home.heroSubtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <a href="/project-inquiry">
              {t("home.heroCtaPrimary")}
              <ArrowRight className="!size-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="secondary" className="w-full">
            <a href="/ai-assistant">
              {t("home.heroCtaSecondary")}
              <ArrowUpRight className="!size-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
