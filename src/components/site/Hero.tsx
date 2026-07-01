import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import heroImg from "@/assets/hero-production-line.jpg";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt="NEVO continuous sandwich panel production line"
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        {/* Overlay stack: dark gradient + slight vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/70" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_20%,rgba(0,0,0,0.35),transparent_60%)]" />
      </div>

      <div className="container-wide relative flex min-h-[92vh] flex-col justify-between pt-28 pb-14 md:pt-40 md:pb-20">
        <div className="max-w-4xl">
          <div className="eyebrow mb-6 flex items-center gap-2 text-white/70">
            <span className="inline-flex size-1.5 rounded-full bg-accent" />
            Dubai · Industrial Engineering &amp; Supply
          </div>

          <h1 className="text-display text-balance text-white">
            Engineering the Future of{" "}
            <span className="text-white/55">Sandwich Panel Manufacturing.</span>
          </h1>

          <p className="text-body-lg mt-8 max-w-2xl text-white/75">
            From factory development and engineering consultancy to raw materials,
            production lines and finished sandwich panels, NEVO delivers integrated
            industrial solutions for manufacturers worldwide.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
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
          </div>
        </div>

        {/* Footer strip: capability tags + scroll indicator */}
        <div className="mt-16 flex flex-col gap-8 border-t border-white/15 pt-8 md:flex-row md:items-end md:justify-between">
          <dl className="grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-4">
            {[
              { k: "Factory", v: "Development" },
              { k: "Engineering", v: "Consultancy" },
              { k: "Raw", v: "Materials" },
              { k: "Production", v: "Lines" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="text-sm font-semibold tracking-tight text-white">
                  {s.k}
                </dt>
                <dd className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-white/55">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>

          <a
            href="#pathways"
            className="group inline-flex items-center gap-2 self-start font-mono text-[10px] uppercase tracking-widest text-white/70 hover:text-white md:self-auto"
          >
            <span>Scroll</span>
            <ChevronDown className="size-3.5 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
}
