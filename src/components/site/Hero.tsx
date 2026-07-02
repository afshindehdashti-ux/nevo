import { motion } from "motion/react";
import heroAsset from "@/assets/hero-homepage.png.asset.json";

const heroImg = heroAsset.url;

/**
 * The hero image is a pre-composed art-directed mockup: NEVO logo, headline,
 * subhead, CTAs and engineering callouts are baked into the artwork. We render
 * it as a single asset on every breakpoint and layer invisible tap targets
 * over the baked CTAs so they behave as real links.
 *
 * Sizing strategy:
 *  - mobile (< md):  full-bleed width, natural portrait height
 *  - tablet (md):    contained to viewport height with side letterboxing
 *  - desktop (lg+):  same, capped max-width for balanced framing
 */
export function Hero() {
  return (
    <section className="relative isolate -mt-20 overflow-hidden bg-black text-white md:-mt-24">
      <h1 className="sr-only">
        Engineering the Future of Sandwich Panel Manufacturing — NEVO Industrial, Dubai
      </h1>

      {/* Mobile — full-bleed */}
      <div className="relative block md:hidden">
        <HeroImage className="block w-full select-none" />
        <TapTargets />
      </div>

      {/* Tablet & Desktop — contained, centered, letterboxed on black */}
      <div className="relative hidden min-h-screen items-center justify-center md:flex">
        <div className="relative mx-auto flex h-screen w-auto max-w-[min(100vw,900px)] items-center justify-center">
          <HeroImage className="block h-full w-auto max-h-screen select-none object-contain" />
          <TapTargets />
        </div>
      </div>
    </section>
  );
}

function HeroImage({ className }: { className?: string }) {
  return (
    <motion.img
      initial={{ opacity: 0, scale: 1.01 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}
      src={heroImg}
      alt="NEVO Industrial — engineering the future of sandwich panel manufacturing. Double-belt laminator producing a PIR sandwich panel with PPGI facings."
      className={className}
      fetchPriority="high"
      decoding="async"
      draggable={false}
    />
  );
}

/**
 * Invisible tap targets aligned to the CTAs baked into the artwork.
 * Percentages are relative to the rendered image box, so they hold on any
 * breakpoint as long as the image itself is the sizing parent.
 */
function TapTargets() {
  return (
    <>
      <a
        href="/project-inquiry"
        aria-label="Start your project"
        className="absolute left-[6%] right-[6%] rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
        style={{ top: "71.4%", height: "8.2%" }}
      />
      <a
        href="/ai-assistant"
        aria-label="Talk to an engineer"
        className="absolute left-[6%] right-[6%] rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
        style={{ top: "81.6%", height: "6.8%" }}
      />
    </>
  );
}
