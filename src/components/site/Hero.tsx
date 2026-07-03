import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import heroDesktopAsset from "@/assets/premium/homepage-hero-desktop.jpg.asset.json";
import heroMobileAsset from "@/assets/premium/homepage-hero-mobile.jpg.asset.json";
import heroVideoAsset from "@/assets/premium/hero-laminator.mp4.asset.json";
import heroPanelAsset from "@/assets/premium/hero-panel-foreground.png.asset.json";
import { Button } from "@/components/ui/button";

const heroDesktop = heroDesktopAsset.url;
const heroMobile = heroMobileAsset.url;
const heroVideo = heroVideoAsset.url;
const heroPanel = heroPanelAsset.url;

/**
 * Cinematic layered hero.
 *
 *   Layer 0  — background video: factory + double-belt laminator in motion
 *   Layer 1  — atmospheric haze / rim light (very slow parallax)
 *   Layer 2  — readability wash / vignette
 *   Layer 3  — foreground PIR sandwich panel PNG animated forward:
 *              starts small, deep, soft-blurred, low opacity;
 *              settles into a large, sharp, shadowed hero object.
 *              Then idles with subtle sine-driven float + scroll parallax.
 *
 * Respects prefers-reduced-motion: renders the final composed frame with
 * no forward push and no idle motion.
 */
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
/*  DESKTOP + TABLET                                                  */
/* ------------------------------------------------------------------ */

function HeroDesktop() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end start"],
  });

  return (
    <div
      ref={wrapRef}
      className="relative hidden min-h-[85vh] md:block lg:min-h-[95vh]"
      style={{ perspective: 1600 }}
    >
      <StageBackground
        src={heroVideo}
        poster={heroDesktop}
        objectPosition="72% center"
        scrollYProgress={scrollYProgress}
        reduce={!!reduce}
      />
      <StageWashes variant="desktop" />
      <ForegroundPanel
        variant="desktop"
        scrollYProgress={scrollYProgress}
        reduce={!!reduce}
      />

      <div className="container-wide relative z-20 flex min-h-[85vh] flex-col justify-between px-6 pt-36 pb-12 md:px-6 lg:min-h-[95vh] lg:px-8 lg:pt-44 lg:pb-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
          className="max-w-3xl"
        >
          <div className="eyebrow mb-6 flex items-center gap-2 text-white/70">
            <span className="inline-flex size-1.5 rounded-full bg-accent" />
            Dubai · Factory Development · Production Lines · Raw Materials
          </div>

          <motion.p
            aria-hidden
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 1, 0.5, 1], delay: 0.05 }}
            className="text-display text-balance text-white"
          >
            {t("home.heroTitle")}
          </motion.p>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1], delay: 0.15 }}
            className="text-body-lg mt-8 max-w-2xl leading-relaxed text-white/75"
          >
            {t("home.heroSubtitle")}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1], delay: 0.25 }}
            className="mt-10 flex flex-row items-center gap-3"
          >
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
          </motion.div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-16 flex flex-col gap-8 border-t border-white/15 pt-6 md:flex-row md:items-end md:justify-between"
        >
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
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MOBILE                                                            */
/* ------------------------------------------------------------------ */

function HeroMobile() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end start"],
  });

  return (
    <div
      ref={wrapRef}
      className="relative block min-h-[100svh] overflow-hidden md:hidden"
      style={{ perspective: 1200 }}
    >
      <StageBackground
        src={heroVideo}
        poster={heroMobile}
        objectPosition="50% center"
        scrollYProgress={scrollYProgress}
        reduce={!!reduce}
      />
      <StageWashes variant="mobile" />
      <ForegroundPanel
        variant="mobile"
        scrollYProgress={scrollYProgress}
        reduce={!!reduce}
      />

      <div className="relative z-20 flex min-h-[100svh] flex-col justify-between px-6 pt-32 pb-10">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
        >
          <div className="eyebrow mb-5 flex items-center gap-2 text-white/70">
            <span className="inline-flex size-1.5 rounded-full bg-accent" />
            {t("brand.location")} · {t("brand.sector")}
          </div>
          <p aria-hidden className="text-4xl font-semibold leading-[1.05] tracking-tight text-white">
            {t("home.heroTitle")}
          </p>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/75">
            {t("home.heroSubtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1], delay: 0.2 }}
          className="flex flex-col gap-3"
        >
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
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LAYER: BACKGROUND (video + subtle parallax)                       */
/* ------------------------------------------------------------------ */

function StageBackground({
  src,
  poster,
  objectPosition,
  scrollYProgress,
  reduce,
}: {
  src: string;
  poster: string;
  objectPosition: string;
  scrollYProgress: MotionValue<number>;
  reduce: boolean;
}) {
  // Very subtle depth parallax on the background — moves slower than scroll.
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 60]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.02, 1.08]);
  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 -z-10 overflow-hidden"
      style={{ y, scale, willChange: "transform" }}
    >
      <video
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        style={{ objectPosition }}
      />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  LAYER: WASHES (readability vignettes)                             */
/* ------------------------------------------------------------------ */

function StageWashes({ variant }: { variant: "desktop" | "mobile" }) {
  if (variant === "desktop") {
    return (
      <div className="absolute inset-0 -z-[5]" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0.35) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 -z-[5]" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 28%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.9) 100%)",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LAYER: FOREGROUND PANEL (the hero motion)                         */
/* ------------------------------------------------------------------ */

function ForegroundPanel({
  variant,
  scrollYProgress,
  reduce,
}: {
  variant: "desktop" | "mobile";
  scrollYProgress: MotionValue<number>;
  reduce: boolean;
}) {
  const scrollY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -120]);

  // Reduced motion: render the resolved (settled) frame, no push, no idle.
  if (reduce) {
    return (
      <div
        aria-hidden
        className={
          variant === "desktop"
            ? "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-end"
            : "pointer-events-none absolute inset-x-0 bottom-[38%] z-10 flex justify-center"
        }
      >
        <img
          src={heroPanel}
          alt=""
          className={
            variant === "desktop"
              ? "w-[62%] max-w-[900px] translate-x-[6%] translate-y-[18%] select-none"
              : "w-[92%] max-w-[520px] select-none"
          }
          style={{
            filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.55))",
          }}
        />
      </div>
    );
  }

  const isDesktop = variant === "desktop";

  // Cinematic push-forward: starts small/deep/blurred, settles large/sharp.
  const initial = isDesktop
    ? {
        opacity: 0,
        scale: 0.62,
        y: 60,
        x: 40,
        rotateX: 14,
        rotateY: -8,
        filter: "blur(8px) drop-shadow(0 10px 20px rgba(0,0,0,0.35))",
      }
    : {
        opacity: 0,
        scale: 0.7,
        y: 80,
        rotateX: 12,
        filter: "blur(8px) drop-shadow(0 10px 20px rgba(0,0,0,0.35))",
      };

  const settled = isDesktop
    ? {
        opacity: 1,
        scale: 1,
        y: 0,
        x: 0,
        rotateX: 0,
        rotateY: 0,
        filter: "blur(0px) drop-shadow(0 40px 60px rgba(0,0,0,0.55))",
      }
    : {
        opacity: 1,
        scale: 1,
        y: 0,
        rotateX: 0,
        filter: "blur(0px) drop-shadow(0 30px 45px rgba(0,0,0,0.55))",
      };

  return (
    <motion.div
      aria-hidden
      style={{
        y: scrollY,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      className={
        isDesktop
          ? "pointer-events-none absolute inset-x-0 bottom-[-6%] z-10 flex justify-end"
          : "pointer-events-none absolute inset-x-0 bottom-[30%] z-10 flex justify-center"
      }
    >
      <motion.img
        src={heroPanel}
        alt=""
        initial={initial}
        animate={settled}
        transition={{
          duration: 2.2,
          ease: [0.16, 0.84, 0.28, 1], // premium ease-out, no bounce
          delay: 0.15,
        }}
        className={
          isDesktop
            ? "w-[62%] max-w-[900px] translate-x-[6%] translate-y-[18%] select-none"
            : "w-[92%] max-w-[520px] select-none"
        }
      />
      {/* Subtle idle float once settled — sine-driven, no jitter */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 7,
          ease: "easeInOut",
          repeat: Infinity,
          delay: 2.4,
        }}
      />
    </motion.div>
  );
}
