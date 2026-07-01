import { Section, SectionHeader } from "@/components/site/primitives";

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
    <Section tone="surface">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeader
            eyebrow="Global reach"
            title="Engineering worldwide. Panels where they're needed."
            lede="Engineering, consultancy, raw materials and production lines are delivered globally. Finished panel supply operates across selected regional markets."
          />
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
    </Section>
  );
}
