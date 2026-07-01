const PROOFS = [
  {
    title: "Engineering-led approach",
    desc: "Every project begins with technical understanding — not sales. Our engineers scope, specify and validate before any commercial step.",
  },
  {
    title: "Dubai advantage",
    desc: "A strategic base connecting the Middle East, Africa, Eurasia and Asia — with efficient logistics and multilingual technical teams.",
  },
  {
    title: "Full industry coverage",
    desc: "From factory setup to raw materials, production lines and finished panels — one accountable partner across the value chain.",
  },
  {
    title: "Long-term partnership",
    desc: "Ongoing audits, training, spare parts and troubleshooting — designed for factories that operate for decades, not quarters.",
  },
];

export function WhyNevo() {
  return (
    <section className="border-b border-border bg-primary text-primary-foreground">
      <div className="container-wide py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-widest text-accent">
              Why NEVO
            </div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Industrial credibility, engineered from the ground up.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-primary-foreground/70">
              NEVO exists because the sandwich panel industry deserves a partner that
              speaks its technical language — from PIR chemistry to line automation and
              coil metallurgy.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-lg bg-white/10 sm:grid-cols-2 lg:col-span-7">
            {PROOFS.map((p, i) => (
              <div key={p.title} className="bg-primary p-6 sm:p-8">
                <div className="mb-6 font-mono text-[11px] tracking-widest text-accent">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-primary-foreground/65">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
