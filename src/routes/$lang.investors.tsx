import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/lib/seo";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  TrendingUp, Building2, Target, Handshake, LineChart, FileText,
  ArrowRight, Globe2, Rocket, Layers,
} from "lucide-react";

import heroImg from "@/assets/corporate/investor-hero.jpg";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";

const TITLE = "Investor Relations — Building Long-Term Industrial Growth | NEVO Industrial";
const DESCRIPTION =
  "NEVO Industrial investor relations: corporate structure, strategic vision, joint ventures, partnership programs, annual reports, financial highlights and future expansion.";
const URL_PATH = "/investors";

const HIGHLIGHTS = [
  { label: "Revenue 2024", value: "USD 218M", note: "+27% YoY" },
  { label: "EBITDA Margin", value: "22.4%", note: "vs 19.1% 2023" },
  { label: "Order Book",    value: "USD 340M", note: "24-month coverage" },
  { label: "Active Countries", value: "38", note: "delivery footprint" },
];

const SECTIONS = [
  { icon: Building2, title: "Company Overview",       body: "Dubai-based industrial group operating across engineering, factory development, raw materials and sandwich panel manufacturing." },
  { icon: Layers,    title: "Corporate Structure",    body: "NEVO Holding oversees four operating divisions with independent P&Ls and a shared engineering backbone." },
  { icon: Target,    title: "Strategic Vision",       body: "To be the reference industrial engineering platform for emerging markets — building 100+ factories by 2035." },
  { icon: TrendingUp,title: "Investment Opportunities", body: "Growth capital for regional expansion, greenfield lines and vertical raw material integration." },
  { icon: Handshake, title: "Joint Ventures",         body: "Structured JVs with local industrial partners for factory ownership, technology transfer and shared distribution." },
  { icon: Globe2,    title: "Partnership Programs",   body: "Long-term supply, engineering and licensing agreements for OEMs, EPCs and sovereign industrial funds." },
];

const REPORTS = [
  { year: "2025", title: "Half-Year Report H1 2025", pages: 42 },
  { year: "2024", title: "Annual Report 2024",       pages: 116 },
  { year: "2024", title: "ESG Report 2024",          pages: 84  },
  { year: "2023", title: "Annual Report 2023",       pages: 102 },
];

function useCounter(target: number, duration = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

function InvestorsPage() {
  const cagr = useCounter(31);
  const capacity = useCounter(2400000);
  const factories = useCounter(24);

  return (
    <>
      <AnnouncementBar />
      <SiteHeader />

      <section className="relative isolate overflow-hidden bg-[#0a0d0c] text-white">
        <img loading="lazy" decoding="async" src={heroImg} alt="Executive boardroom Dubai" width={1920} height={1088}
             className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d0c]/85 via-[#0a0d0c]/55 to-[#0a0d0c]" />
        <div className="container-wide relative py-32 md:py-40">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Eyebrow className="text-emerald-400/90">Investor Relations</Eyebrow>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
              Building long-term <span className="text-emerald-400">industrial growth.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/70">
              NEVO Industrial combines engineering discipline with disciplined capital allocation — building
              factories, supply chains and long-duration cash flows across emerging markets.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" asChild><a href="#reports">Download Investor Pack <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
              <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
                <a href="#contact-ir">Contact IR</a>
              </Button>
            </div>
            <div className="mt-16 grid max-w-3xl grid-cols-3 gap-8 border-t border-white/10 pt-8">
              <div><div className="text-4xl font-semibold text-emerald-400">{cagr}%</div><div className="mt-1 text-xs uppercase tracking-widest text-white/50">Revenue CAGR 5Y</div></div>
              <div><div className="text-4xl font-semibold text-emerald-400">{(capacity/1_000_000).toFixed(1)}M</div><div className="mt-1 text-xs uppercase tracking-widest text-white/50">m² Annual Panel Output</div></div>
              <div><div className="text-4xl font-semibold text-emerald-400">{factories}</div><div className="mt-1 text-xs uppercase tracking-widest text-white/50">Factories Delivered</div></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <Section tone="surface">
        <SectionHeader eyebrow="Financial Highlights" title="FY 2024 at a glance" lede="Audited by Big-4. Full statements available in the 2024 Annual Report." />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h) => (
            <div key={h.label} className="rounded-2xl border border-border bg-background p-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{h.label}</div>
              <div className="mt-4 text-4xl font-semibold tracking-tight">{h.value}</div>
              <div className="mt-2 text-sm text-emerald-700">{h.note}</div>
            </div>
          ))}
        </div>

        {/* Simple growth chart */}
        <div className="mt-12 rounded-2xl border border-border bg-background p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Revenue Growth · USD Millions</div>
              <div className="mt-1 text-lg font-semibold">2020 → 2024</div>
            </div>
            <LineChart className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="mt-8 flex h-56 items-end gap-4">
            {[68, 94, 128, 172, 218].map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <motion.div initial={{ height: 0 }} whileInView={{ height: `${(v/218)*100}%` }}
                  viewport={{ once: true }} transition={{ duration: 1.1, delay: i * 0.1, ease: "easeOut" }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-emerald-700 to-emerald-400" />
                <div className="text-xs text-muted-foreground">{2020 + i}</div>
                <div className="text-sm font-semibold">${v}M</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* SECTIONS GRID */}
      <Section>
        <SectionHeader eyebrow="Corporate & Strategy" title="How NEVO is built to compound" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <motion.div key={s.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5 }}
              className="rounded-2xl border border-border bg-background p-6 transition hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-xl">
              <s.icon className="h-7 w-7 text-emerald-600" />
              <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* FUTURE EXPANSION */}
      <Section tone="surface">
        <SectionHeader eyebrow="Future Expansion" title="2026–2030 growth plan" />
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { icon: Rocket,  label: "New Factories", value: "+12", note: "greenfield lines" },
            { icon: Globe2,  label: "Markets Entered", value: "+9", note: "Africa · CIS · SEA" },
            { icon: Layers,  label: "Product Lines",   value: "+5", note: "vertical integration" },
            { icon: TrendingUp, label: "Revenue Target", value: "USD 600M", note: "by FY 2030" },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl border border-border bg-background p-6">
              <m.icon className="h-7 w-7 text-emerald-600" />
              <div className="mt-6 text-3xl font-semibold">{m.value}</div>
              <div className="mt-2 text-sm font-medium">{m.label}</div>
              <div className="text-xs text-muted-foreground">{m.note}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* REPORTS */}
      <Section id="reports">
        <SectionHeader eyebrow="Annual Reports & Filings" title="Download investor documents" />
        <div className="overflow-hidden rounded-2xl border border-border">
          {REPORTS.map((r, i) => (
            <div key={r.title}
              className={`grid grid-cols-1 gap-3 p-6 transition hover:bg-muted/60 md:grid-cols-[80px_1fr_auto_auto] md:items-center ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="text-sm font-mono text-muted-foreground">{r.year}</div>
              <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-emerald-600" /><span className="font-semibold">{r.title}</span></div>
              <div className="text-xs text-muted-foreground">{r.pages} pages · PDF</div>
              <Button variant="outline" size="sm" asChild><a href="/download-center">Download <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
            </div>
          ))}
        </div>
      </Section>

      {/* IR CONTACT */}
      <Section id="contact-ir" tone="primary">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <Eyebrow className="text-emerald-300">Investor Relations</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Speak with our IR team</h2>
            <p className="mt-3 text-primary-foreground/70">Confidential briefings for institutional investors, sovereign funds and strategic partners.</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button size="lg" variant="secondary" asChild><a href="mailto:ir@nevo-industrial.com">ir@nevo-industrial.com</a></Button>
            <Button size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" asChild>
              <a href="/contact">Book a Meeting</a>
            </Button>
          </div>
        </div>
      </Section>

      <SiteFooter />
    </>
  );
}

export const Route = createFileRoute("/$lang/investors")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}${URL_PATH}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}${URL_PATH}` }],
  }),
  component: InvestorsPage,
});
