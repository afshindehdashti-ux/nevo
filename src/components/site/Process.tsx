const STEPS = [
  {
    n: "01",
    title: "Discovery",
    desc: "We map your goal, constraints, market and technical baseline before proposing anything.",
  },
  {
    n: "02",
    title: "Engineering",
    desc: "Layouts, specifications, process design and material selection — reviewed by senior engineers.",
  },
  {
    n: "03",
    title: "Sourcing & Supply",
    desc: "Qualified raw materials, equipment and production lines matched to your target output.",
  },
  {
    n: "04",
    title: "Commissioning",
    desc: "Installation supervision, trials, operator training and handover with documented procedures.",
  },
  {
    n: "05",
    title: "Long-term Support",
    desc: "Audits, spare parts, troubleshooting and optimization across the factory lifecycle.",
  },
];

export function Process() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-wide py-20 lg:py-28">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="eyebrow mb-4">Engineering process</div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              A disciplined path from idea to operating factory.
            </h2>
          </div>
        </div>

        <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-5">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="flex flex-col gap-6 bg-background p-6 md:min-h-[220px]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-widest text-accent">
                  {s.n}
                </span>
                <span className="h-px w-6 bg-border-strong" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
