import { Quote } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";

const QUOTES = [
  {
    quote:
      "NEVO's engineering team scoped our line upgrade with a level of technical honesty we rarely see from suppliers. Throughput matched the model within the first commissioning week.",
    author: "Plant Director",
    org: "Panel manufacturer, GCC",
  },
  {
    quote:
      "They treated our factory feasibility as an engineering problem before a commercial one. The layout and utility plan avoided a seven-figure rework later in the project.",
    author: "Industrial Investor",
    org: "Greenfield factory, East Africa",
  },
  {
    quote:
      "Consistent PIR quality, transparent lead times, and a technical contact who actually understands our line. That combination is the reason we consolidated our sourcing.",
    author: "Procurement Manager",
    org: "Sandwich panel producer, Eurasia",
  },
];

export function Testimonials() {
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Industry voices"
        title="Trusted by engineers, operators and industrial investors."
        lede="Selected quotes from factory owners, plant directors and procurement leaders NEVO works with. Identities are withheld out of respect for project confidentiality."
      />

      <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
        {QUOTES.map((q) => (
          <figure
            key={q.author + q.org}
            className="flex h-full flex-col justify-between gap-10 bg-background p-8 sm:p-10"
          >
            <Quote
              className="size-6 text-accent"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <blockquote className="text-[1.0625rem] leading-relaxed tracking-[-0.01em] text-foreground">
              "{q.quote}"
            </blockquote>
            <figcaption className="border-t border-border pt-5">
              <div className="text-sm font-semibold text-foreground">{q.author}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {q.org}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
