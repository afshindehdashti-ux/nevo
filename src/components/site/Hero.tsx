import { ArrowUpRight, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-production-line.jpg";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/site/primitives";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="container-wide grid gap-14 py-16 lg:grid-cols-12 lg:gap-16 lg:py-28">
        <div className="lg:col-span-7">
          <Eyebrow>Dubai · Engineering First</Eyebrow>
          <h1 className="text-display mt-6 text-balance text-foreground">
            Industrial Solutions.
            <br />
            <span className="text-foreground/45">Engineered with Expertise.</span>
          </h1>
          <p className="text-body-lg mt-6 max-w-xl">
            From factory development to raw materials, production lines and finished
            panels — NEVO supports the complete sandwich panel industry.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="primary" size="lg">
              <a href="#pathways">
                Start Your Project
                <ArrowRight className="!size-4" />
              </a>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <a href="#contact">
                Talk to an Engineer
                <ArrowUpRight className="!size-4" />
              </a>
            </Button>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-8 border-t border-border pt-8 sm:grid-cols-4">
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
          <figure className="relative overflow-hidden rounded-xl border border-border bg-surface">
            <img
              src={heroImg}
              alt="Continuous sandwich panel production line with steel coils and finished panels"
              width={1600}
              height={1200}
              className="aspect-[4/5] h-full w-full object-cover"
            />
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/25 to-transparent p-5 text-white">
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
