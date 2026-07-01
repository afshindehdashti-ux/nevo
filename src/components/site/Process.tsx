import { Section, SectionHeader } from "@/components/site/primitives";

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
    <Section tone="default">
      <SectionHeader
        eyebrow="Engineering process"
        title="A disciplined path from idea to operating factory."
      />

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
              <h3 className="text-h3 text-foreground">{s.title}</h3>
              <p className="text-body mt-2">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
