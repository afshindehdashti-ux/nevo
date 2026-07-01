import { ArrowRight } from "lucide-react";
import { Section } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";

export function CTABanner() {
  return (
    <Section tone="default">
      <div className="grid gap-10 rounded-2xl border border-border bg-surface p-8 sm:p-12 lg:grid-cols-12 lg:gap-16 lg:p-16">
        <div className="lg:col-span-7">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-widest text-accent">
            Talk to an engineer
          </div>
          <h2 className="text-h1 text-balance text-foreground">
            Ready to engineer your next industrial project?
          </h2>
          <p className="text-body-lg mt-5 max-w-lg">
            Share your goal and timeline. A NEVO engineer will respond with a scoped
            technical proposal — no pressure, no generic sales decks.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="primary" size="lg">
              <a href="#contact">
                Request Technical Proposal
                <ArrowRight className="!size-4" />
              </a>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <a href="#contact">Request Engineering Consultation</a>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <ul className="grid gap-3">
            {[
              "Engineering-led scoping — not sales-led",
              "Response from a technical team within 1 business day",
              "Confidential handling of project details",
              "Available in English, Arabic, Russian, Turkish",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-md border border-border bg-background p-4 text-sm text-foreground/85"
              >
                <span className="mt-1.5 inline-flex size-1.5 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
