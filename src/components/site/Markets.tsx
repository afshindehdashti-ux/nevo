const REGIONAL = [
  { m: "Saudi Arabia", tag: "Regional supply" },
  { m: "United Arab Emirates", tag: "HQ · Full service" },
  { m: "Oman", tag: "Regional supply" },
  { m: "Turkey", tag: "Distribution" },
  { m: "Iraq", tag: "Regional supply" },
  { m: "Kenya", tag: "African hub" },
  { m: "Cameroon", tag: "African hub" },
  { m: "Russia", tag: "Eurasia network" },
];

export function Markets() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="container-wide py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="eyebrow mb-4">Global reach</div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Engineering worldwide. Panels where they're needed.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Engineering, consultancy, raw materials and production lines are delivered
              globally. Finished panel supply operates across selected regional markets.
            </p>
          </div>

          <div className="lg:col-span-8">
            <ul className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
              {REGIONAL.map((r) => (
                <li
                  key={r.m}
                  className="flex items-center justify-between bg-background px-5 py-4 transition-colors hover:bg-surface-muted"
                >
                  <span className="text-sm font-medium text-foreground">{r.m}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                    {r.tag}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
