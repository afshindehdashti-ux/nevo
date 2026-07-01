import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";

const ARTICLES = [
  {
    tag: "Guide",
    title: "Planning a sandwich panel factory: the investor's technical checklist",
    read: "12 min read",
  },
  {
    tag: "Technical",
    title: "PIR vs PUR: how to select the right chemistry for your panel line",
    read: "8 min read",
  },
  {
    tag: "Case study",
    title: "Modernizing a discontinuous PU line for continuous PIR output",
    read: "6 min read",
  },
];

export function KnowledgeHub() {
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Knowledge hub"
        title="Education before sales. Practical, technical, useful."
        aside={
          <a
            href="#"
            className="text-xs font-medium uppercase tracking-widest text-foreground underline decoration-border decoration-1 underline-offset-4 hover:decoration-accent"
          >
            Browse the library →
          </a>
        }
      />

      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
        {ARTICLES.map((a) => (
          <a
            key={a.title}
            href="#"
            className="group flex min-h-[220px] flex-col justify-between gap-6 bg-background p-6 transition-colors hover:bg-surface-muted sm:p-8"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {a.tag}
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground">
                {a.title}
              </h3>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {a.read}
              </div>
            </div>
          </a>
        ))}
      </div>
    </Section>
  );
}
