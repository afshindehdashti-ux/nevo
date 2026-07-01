import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/site/primitives";

const STATS = [
  { k: "20+", v: "Years of industry experience", num: 20, suffix: "+" },
  { k: "100+", v: "Industrial projects", num: 100, suffix: "+" },
  { k: "Worldwide", v: "Engineering support", label: "Worldwide" },
  { k: "Multiple", v: "International supply partners", label: "Multiple" },
];

function useCountUp(target: number, run: boolean, duration = 1600) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return n;
}

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Section tone="default">
      <div
        ref={ref}
        className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
      >
        {STATS.map((s, i) => (
          <StatCell key={s.v} stat={s} run={visible} index={i} />
        ))}
      </div>
    </Section>
  );
}

function StatCell({
  stat,
  run,
  index,
}: {
  stat: (typeof STATS)[number];
  run: boolean;
  index: number;
}) {
  const n = useCountUp(stat.num ?? 0, run && !!stat.num);
  return (
    <div
      className="group relative flex flex-col justify-between gap-8 bg-background p-8 transition-colors hover:bg-surface"
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
        {String(index + 1).padStart(2, "0")} /04
      </span>
      <div>
        <div className="text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-none tracking-[-0.03em] text-foreground">
          {stat.num ? (
            <>
              {n}
              <span className="text-accent">{stat.suffix}</span>
            </>
          ) : (
            stat.label
          )}
        </div>
        <div className="mt-4 text-sm text-muted-foreground">{stat.v}</div>
      </div>
    </div>
  );
}
