import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";

const ARTICLES = [
  {
    tag: "Raw materials",
    title: "What is PIR? Chemistry, properties and where it's used.",
    read: "6 min read",
  },
  {
    tag: "Comparison",
    title: "PIR vs PUR: how to select the right chemistry for your panel line.",
    read: "8 min read",
  },
  {
    tag: "Process",
    title: "How sandwich panels are manufactured — line by line.",
    read: "10 min read",
  },
  {
    tag: "Investment",
    title: "How much does a sandwich panel factory cost?",
    read: "12 min read",
  },
  {
    tag: "Raw materials",
    title: "Rock wool guide: density, fire behaviour and specification.",
    read: "7 min read",
  },
  {
    tag: "Guide",
    title: "Factory planning checklist for new panel manufacturers.",
    read: "9 min read",
  },
];

export function KnowledgeHub() {
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Knowledge hub"
        title="Engineering knowledge that creates better decisions."
        lede="Practical, technical, useful. Written for engineers, procurement leads and factory investors."
        aside={
          <a
            href="/knowledge"
            className="text-xs font-medium uppercase tracking-widest text-foreground underline decoration-border decoration-1 underline-offset-4 hover:decoration-accent"
          >
            Browse the library →
          </a>
        }
      />

      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {ARTICLES.map((a) => (
          <a
            key={a.title}
            href="/knowledge"
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
