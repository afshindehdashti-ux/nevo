import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import heroDesktop from "@/assets/hero-nevo-line.jpg";
import heroMobile from "@/assets/hero-nevo-mobile.jpg";
import { Button } from "@/components/ui/button";

/**
 * Two hero compositions — the desktop cinematic frame keeps the full production
 * line + PIR panel + engineering annotations visible, while the mobile frame
 * uses the pre-composed mobile hero asset (already art-directed for portrait).
 * `-mt-20 md:-mt-24` pulls the section behind the fixed transparent header.
 */
export function Hero() {
  return (
    <section className="relative isolate -mt-20 overflow-hidden bg-black text-white md:-mt-24">
      {/* Screen-reader H1 — visual headline is inside each device-specific
          composition (baked into the mobile art asset). */}
      <h1 className="sr-only">
        Engineering the Future of Sandwich Panel Manufacturing — NEVO Industrial, Dubai
      </h1>

      <HeroDesktop />
      <HeroMobile />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  DESKTOP + TABLET (md and up)                                       */
/* ------------------------------------------------------------------ */

function HeroDesktop() {
  return (
    <div className="relative hidden min-h-[85vh] md:block lg:min-h-[95vh]">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src={heroDesktop}
          alt="NEVO continuous double-belt laminator producing a PIR sandwich panel with PPGI facings"
          className="h-full w-full object-cover"
          style={{ objectPosition: "88% center", transform: "scale(1.05)" }}
          fetchPriority="high"
          decoding="async"
        />
        {/* Solid black wash on the far left masks baked-in artwork so our
            headline reads cleanly on pure graphite. */}
        <div aria-hidden className="absolute inset-y-0 left-0 w-[52%] bg-black" />
        <div
          aria-hidden
          className="absolute inset-y-0 left-[52%] w-[18%]"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.35) 100%)",
          }}
        />
        {/* Uniform 30–35 % right-side dim — machinery + callouts remain visible. */}
        <div aria-hidden className="absolute inset-y-0 right-0 w-[30%] bg-black/30" />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent"
        />
      </div>

      <div className="container-wide relative flex min-h-[85vh] flex-col justify-between px-6 pt-36 pb-12 md:px-6 lg:min-h-[95vh] lg:px-8 lg:pt-44 lg:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
          className="max-w-3xl"
        >
          <div className="eyebrow mb-6 flex items-center gap-2 text-white/70">
            <span className="inline-flex size-1.5 rounded-full bg-accent" />
            Dubai · Industrial Engineering &amp; Supply
          </div>

          <motion.p
            aria-hidden
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 1, 0.5, 1], delay: 0.05 }}
            className="text-display text-balance text-white"
          >
            Engineering the Future of{" "}
            <span className="text-accent">Sandwich Panel Manufacturing.</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1], delay: 0.15 }}
            className="text-body-lg mt-8 max-w-2xl leading-relaxed text-white/75"
          >
            Engineering consultancy, factory development, production lines, raw
            materials and premium sandwich panel solutions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1], delay: 0.25 }}
            className="mt-10 flex flex-row items-center gap-3"
          >
            <Button
              asChild
              size="lg"
              className="bg-white text-primary transition-colors duration-200 hover:bg-white/90"
            >
              <a href="#contact">
                Start Your Project
                <ArrowRight className="!size-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="border-white/30 bg-transparent text-white transition-colors duration-200 hover:border-white hover:bg-white/10"
            >
              <a href="#contact">
                Talk to an Engineer
                <ArrowUpRight className="!size-4" />
              </a>
            </Button>
          </motion.div>
        </motion.div>

        {/* Bottom rail: capability spec strip + scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
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
/*  MOBILE (< md) — uses the pre-composed mobile hero asset             */
/* ------------------------------------------------------------------ */

function HeroMobile() {
  return (
    <div className="relative block md:hidden">
      {/* Composed mobile hero — headline, body, CTAs and engineering
          annotations are art-directed into the asset. We overlay interactive
          tap targets over the baked CTAs so they behave like real buttons. */}
      <motion.img
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}
        src={heroMobile}
        alt="NEVO double-belt laminator producing a PIR sandwich panel — engineering the future of sandwich panel manufacturing."
        className="block w-full select-none"
        fetchPriority="high"
        decoding="async"
        draggable={false}
      />

      {/* Interactive tap targets aligned to the baked CTAs (percentages of
          the asset height/width). Kept invisible — visuals live in the image. */}
      <a
        href="#contact"
        aria-label="Start your project"
        className="absolute left-[6%] right-[6%] rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
        style={{ top: "71.4%", height: "8.2%" }}
      />
      <a
        href="#contact"
        aria-label="Talk to an engineer"
        className="absolute left-[6%] right-[6%] rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
        style={{ top: "81.6%", height: "6.8%" }}
      />

      {/* Minimal scroll indicator */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-1 flex justify-center">
        <div className="mb-3 h-6 w-[2px] rounded-full bg-white/40" />
      </div>
    </div>
  );
}
