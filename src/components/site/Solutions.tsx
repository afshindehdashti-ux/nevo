const SOLUTIONS = [
  {
    n: "01",
    title: "Factory Development",
    desc: "Turnkey guidance for investors building new sandwich panel factories — feasibility, layout, procurement and commissioning.",
  },
  {
    n: "02",
    title: "Engineering Consultancy",
    desc: "Factory layout, process design, production optimization, technical consulting and commissioning support.",
  },
  {
    n: "03",
    title: "Raw Material Solutions",
    desc: "PIR / PUR systems, PPGI, GI and Aluzinc coils, rock wool, adhesives and qualified consumables.",
  },
  {
    n: "04",
    title: "Production Line Solutions",
    desc: "Complete continuous & discontinuous lines, roll forming, PU/PIR foaming systems, automation and modernization.",
  },
  {
    n: "05",
    title: "Finished Panel Solutions",
    desc: "Supply of finished sandwich panels across selected regional markets in the Middle East, Africa and Eurasia.",
  },
  {
    n: "06",
    title: "Technical Support",
    desc: "Training, spare parts, factory audits, troubleshooting and long-term operational support.",
  },
];

export function Solutions() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-wide py-20 lg:py-28">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="eyebrow mb-4">Six engineering pillars</div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              A complete industrial partner for the sandwich panel industry.
            </h2>
          </div>
          <a
            href="#"
            className="text-xs font-medium uppercase tracking-widest text-foreground underline underline-offset-4 hover:text-accent"
          >
            View all solutions →
          </a>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((s) => (
            <article
              key={s.n}
              className="group relative flex flex-col gap-4 bg-background p-6 transition-colors hover:bg-surface sm:p-8"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[11px] tracking-widest text-muted-foreground">
                  {s.n}
                </span>
                <span className="h-px w-8 bg-border transition-all group-hover:w-16 group-hover:bg-accent" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
