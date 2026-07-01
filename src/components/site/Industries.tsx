const INDUSTRIES = [
  { name: "Cold Storage", note: "Low-temperature PIR envelopes" },
  { name: "Food Processing", note: "Hygienic wall & ceiling systems" },
  { name: "Pharmaceutical", note: "GMP-compliant clean environments" },
  { name: "Clean Rooms", note: "ISO-classified enclosures" },
  { name: "Warehousing & Logistics", note: "Large-span industrial roofing" },
  { name: "Industrial Buildings", note: "Structural insulated envelopes" },
  { name: "Modular Buildings", note: "Prefab & site-assembled units" },
  { name: "Commercial Construction", note: "Architectural panel facades" },
];

export function Industries() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-wide py-20 lg:py-28">
        <div className="mb-14 max-w-2xl">
          <div className="eyebrow mb-4">Industries served</div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Sandwich panel systems engineered for demanding environments.
          </h2>
        </div>

        <ul className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRIES.map((i) => (
            <li
              key={i.name}
              className="group flex flex-col justify-between gap-6 bg-background p-6 transition-colors hover:bg-surface"
            >
              <div className="h-px w-8 bg-border transition-all group-hover:bg-accent" />
              <div>
                <div className="text-base font-semibold tracking-tight text-foreground">
                  {i.name}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{i.note}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
