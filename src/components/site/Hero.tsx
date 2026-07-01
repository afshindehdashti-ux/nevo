import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import heroImg from "@/assets/hero-nevo-line.jpg";
import { Button } from "@/components/ui/button";

/**
 * Because the header is fixed-transparent over the hero, we need this section
 * to extend behind it. We pull the section up by the header's height with a
 * negative margin, then compensate with top padding so content still sits
 * below the header.
 */
export function Hero() {
  return (
    <section className="relative isolate -mt-20 overflow-hidden bg-black text-white md:-mt-24">
      {/* Background image — cropped to the right so the machinery + PIR panel
          + baked-in engineering callouts stay centered on all sizes. */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt="NEVO continuous double-belt laminator producing a PIR sandwich panel with PPGI facings"
          className="h-full w-full object-cover"
          style={{ objectPosition: "70% center" }}
          fetchPriority="high"
        />
        {/* Left-weighted dark gradient — hides baked left-side artwork,
            keeps machinery + callouts visible. ~35% overall dim on the right. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.80) 30%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.35) 100%)",
          }}
        />
        {/* Soft bottom fade for the scroll strip legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent"
        />
      </div>

      <div className="container-wide relative flex min-h-[100svh] flex-col justify-between pt-32 pb-12 md:pt-40 md:pb-16">
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

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 1, 0.5, 1], delay: 0.05 }}
            className="text-display text-balance text-white"
          >
            Engineering the Future of{" "}
            <span className="text-accent">Sandwich Panel Manufacturing.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1], delay: 0.15 }}
            className="text-body-lg mt-8 max-w-2xl text-white/75"
          >
            Engineering consultancy, factory development, production lines, raw
            materials and premium sandwich panel solutions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1], delay: 0.25 }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <a href="#contact">
                Start Your Project
                <ArrowRight className="!size-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10"
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
          <dl className="grid grid-cols-3 gap-x-8 gap-y-4 sm:grid-cols-3">
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
            className="group inline-flex items-center gap-2 self-start font-mono text-[10px] uppercase tracking-widest text-white/60 hover:text-white md:self-auto"
          >
            <span>Explore</span>
            <ChevronDown className="size-3.5 animate-bounce" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
