import { ArrowRight } from "lucide-react";
import heroImg from "@/assets/engineering-philosophy.jpg";
import { Section, Eyebrow } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";

export function FeaturedFactory() {
  return (
    <Section tone="default">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <figure className="relative lg:col-span-7">
          <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
            <img
              src={heroImg}
              alt="Continuous sandwich panel production line inside a NEVO reference factory"
              className="aspect-[4/3] h-full w-full object-cover"
              loading="lazy"
            />
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/25 to-transparent p-5 text-white">
              <div className="font-mono text-[10px] tracking-widest text-white/70">
                FIG. 02 · CONTINUOUS PIR LINE
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-white/90">
                <span className="inline-flex size-1.5 rounded-full bg-accent" />
                Reference project
              </div>
            </figcaption>
          </div>
        </figure>

        <div className="flex flex-col justify-center lg:col-span-5">
          <Eyebrow>Engineering philosophy</Eyebrow>
          <h2 className="text-h1 mt-6 text-balance text-foreground">
            Engineering starts long before production begins.
          </h2>
          <p className="text-body-lg mt-6">
            A sandwich panel factory is a system, not a purchase. Before a single
            coil is ordered, our engineers define target output, panel spectrum,
            plant footprint, utilities and logistics — then engineer the line
            around that reality.
          </p>
          <p className="text-body mt-4">
            The result is a factory that meets its stated capacity on day one,
            operates predictably for decades, and adapts as your market changes.
          </p>

          <div className="mt-10">
            <Button asChild variant="primary" size="lg">
              <a href="/solutions/factory-development">
                Explore Factory Development
                <ArrowRight className="!size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
