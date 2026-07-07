import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Section } from "@/components/site/primitives";

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
  const { t } = useTranslation();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), {
      threshold: 0.3,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const STATS = [
    { num: 0, text: t("home.stats.yearsValue"), label: t("home.stats.yearsLabel") },
    { num: 0, text: t("home.stats.projectsValue"), label: t("home.stats.projectsLabel") },
    { num: 0, text: t("home.stats.worldwide"), label: t("home.stats.worldwideLabel") },
    { num: 0, text: t("home.stats.multiple"), label: t("home.stats.multipleLabel") },
  ];

  return (
    <Section tone="default">
      <div
        ref={ref}
        className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
      >
        {STATS.map((s, i) => (
          <StatCell key={i} stat={s} run={visible} index={i} />
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
  stat: { num: number; suffix?: string; text?: string; label: string };
  run: boolean;
  index: number;
}) {
  const n = useCountUp(stat.num, run && !!stat.num);
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
            stat.text
          )}
        </div>
        <div className="mt-4 text-sm text-muted-foreground">{stat.label}</div>
      </div>
    </div>
  );
}
