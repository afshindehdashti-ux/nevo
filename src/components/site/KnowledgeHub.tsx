import { ArrowUpRight } from "lucide-react";

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
    <section className="border-b border-border bg-surface">
      <div className="container-wide py-20 lg:py-28">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="eyebrow mb-4">Knowledge hub</div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Education before sales. Practical, technical, useful.
            </h2>
          </div>
          <a
            href="#"
            className="text-xs font-medium uppercase tracking-widest text-foreground underline underline-offset-4 hover:text-accent"
          >
            Browse the library →
          </a>
        </div>

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
      </div>
    </section>
  );
}
