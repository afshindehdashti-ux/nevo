import { ArrowRight } from "lucide-react";

export function CTABanner() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-wide py-20 lg:py-28">
        <div className="grid gap-10 rounded-2xl border border-border bg-surface p-8 sm:p-12 lg:grid-cols-12 lg:gap-16 lg:p-16">
          <div className="lg:col-span-7">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-widest text-accent">
              Talk to an engineer
            </div>
            <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Ready to engineer your next industrial project?
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Share your goal and timeline. A NEVO engineer will respond with a scoped
              technical proposal — no pressure, no generic sales decks.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-95"
              >
                Request a Technical Proposal
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-5 py-3.5 text-sm font-medium text-foreground hover:bg-surface-muted"
              >
                Request Engineering Consultation
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <ul className="grid gap-4">
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
      </div>
    </section>
  );
}
