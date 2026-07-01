import { ArrowUpRight, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-production-line.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="container-wide grid gap-12 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
        <div className="lg:col-span-7">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-1.5 rounded-full bg-accent" />
            <span className="eyebrow">Dubai · Engineering First</span>
          </div>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tightest text-foreground sm:text-5xl lg:text-6xl xl:text-[4.5rem]">
            Industrial Solutions.
            <br />
            <span className="text-foreground/45">Engineered with Expertise.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            From factory development to raw materials, production lines and finished
            panels — NEVO supports the complete sandwich panel industry.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href="#pathways"
              className="group inline-flex items-center justify-between gap-3 rounded-md bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-95 sm:justify-start"
            >
              Start Your Project
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center justify-between gap-3 rounded-md border border-border bg-background px-5 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface sm:justify-start"
            >
              Talk to an Engineer
              <ArrowUpRight className="size-4" />
            </a>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-8 border-t border-border pt-8 sm:grid-cols-4">
            {[
              { k: "12+", v: "Global markets" },
              { k: "PIR / PUR", v: "Core systems" },
              { k: "Dubai", v: "Engineering HQ" },
              { k: "24/7", v: "Technical support" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="text-2xl font-semibold tracking-tight text-foreground">
                  {s.k}
                </dt>
                <dd className="mt-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5">
          <figure className="relative overflow-hidden rounded-lg border border-border bg-surface">
            <img
              src={heroImg}
              alt="Continuous sandwich panel production line with steel coils and finished panels"
              width={1600}
              height={1200}
              className="aspect-[4/5] h-full w-full object-cover"
            />
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5 text-white">
              <div className="font-mono text-[10px] tracking-widest text-white/70">
                FIG. 01 · PIR CONTINUOUS LINE
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-white/90">
                <span className="inline-flex size-1.5 rounded-full bg-accent" />
                Live capability
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
