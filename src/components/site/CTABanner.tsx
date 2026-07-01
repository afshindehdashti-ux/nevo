import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTABanner() {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      {/* Ambient accent glow */}
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
              Let's build together
            </div>
            <h2 className="text-display text-balance text-primary-foreground">
              Let's build your next{" "}
              <span className="text-primary-foreground/55">industrial project.</span>
            </h2>
            <p className="text-body-lg mt-8 max-w-2xl text-primary-foreground/70">
              Whether you are planning a new factory, upgrading production or
              sourcing premium materials, our engineering team is ready to support
              you.
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
                  Book Engineering Consultation
                  <ArrowUpRight className="!size-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-4">
            <ul className="grid gap-3">
              {[
                "Engineering-led scoping — not sales-led",
                "Technical response within 1 business day",
                "Confidential handling of project details",
                "Available in English, Arabic, Russian, Turkish",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-primary-foreground/85 backdrop-blur-sm"
                >
                  <span className="mt-1.5 inline-flex size-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
