import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  MapPin,
  Gauge,
  Layers,
  Cog,
  Factory,
  Wallet,
  ChevronRight,
  Download,
  ArrowRight,
  Zap,
  Droplet,
  Wind,
  Flame,
  Users,
  Truck,
  TrendingUp,
  DollarSign,
  Clock,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  PhoneCall,
  MessageCircle,
  Mail,
  Brain,
  Target,
  Cpu,
  Building2,
  ClipboardList,
  Wrench,
  Rocket,
  RefreshCw,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { buildSeo, orgJsonLd, breadcrumbJsonLd, faqJsonLd, SITE, WHATSAPP_URL } from "@/lib/seo";

import panelHero from "@/assets/estimator/est-panel-hero.png.asset.json";
import layoutImg from "@/assets/estimator/est-layout.png.asset.json";
import reportImg from "@/assets/estimator/est-report.png.asset.json";
import eq1 from "@/assets/estimator/est-eq1.png.asset.json";
import eq2 from "@/assets/estimator/est-eq2.png.asset.json";
import eq3 from "@/assets/estimator/est-eq3.png.asset.json";
import eq4 from "@/assets/estimator/est-eq4.png.asset.json";
import eq5 from "@/assets/estimator/est-eq5.png.asset.json";

const EQUIPMENT = [
  { img: eq1, title: "Double Belt Laminator", units: "2 Units" },
  { img: eq2, title: "PIR Foaming Machine", units: "2 Units" },
  { img: eq3, title: "Roll Forming Line", units: "2 Lines" },
  { img: eq4, title: "Flying Saw", units: "2 Units" },
  { img: eq5, title: "Stacking System", units: "2 Units" },
];

const FAQS = [
  {
    q: "How accurate is the AI Project Estimator?",
    a: "The estimator uses real market data from 1,500+ completed NEVO projects across 85+ countries. Typical accuracy is ±8% at concept stage — enough to make a confident go/no-go investment decision before commissioning a full feasibility study.",
  },
  {
    q: "What panel technology should I choose?",
    a: "PIR offers the best thermal performance and highest ROI for cold storage and industrial cladding. Rock Wool leads on fire performance. PUR is cost-optimized for high-volume production. EPS is entry-level. Hybrid lines can switch between cores on demand.",
  },
  {
    q: "Can the AI recommend a factory layout?",
    a: "Yes. Based on capacity, panel technology and factory type, the engine proposes zoning for raw material warehouse, roll-forming, foaming, laminator, cutting, stacking, packaging, finished goods, offices and utilities.",
  },
  {
    q: "How is ROI calculated?",
    a: "ROI, IRR and payback are modeled from CAPEX, OPEX, capacity utilization, regional pricing and 260 working-days/year. The 5-year model assumes progressive ramp-up (60% Y1 → 95% Y5).",
  },
  {
    q: "What happens after I generate an estimation?",
    a: "You can request a full engineering proposal. NEVO engineers refine the model with your exact site conditions, utilities availability and regulatory constraints — usually within 5 business days.",
  },
];

/* ─── SEO ─── */
export const Route = createFileRoute("/$lang/ai-project-estimator")({
  head: ({ params }) => ({
    meta: buildSeo({
      lang: params.lang,
      title: "AI Project Estimator — Sandwich Panel Factory",
      description:
        "Get instant AI-powered feasibility for your sandwich panel factory. Estimate investment, utilities, capacity, ROI, IRR and payback in seconds — trained on 1,500+ NEVO Industrial projects.",
      path: "/ai-project-estimator",
      keywords: [
        "sandwich panel factory",
        "project estimator",
        "AI feasibility",
        "factory investment",
        "ROI IRR",
        "PIR PUR rock wool",
      ],
    }).meta,
    links: buildSeo({
      lang: params.lang,
      title: "AI Project Estimator — Sandwich Panel Factory",
      description: "Instant AI feasibility for sandwich panel factories.",
      path: "/ai-project-estimator",
    }).links,
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(orgJsonLd()) },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "AI Project Estimator", path: "/ai-project-estimator" },
          ]),
        ),
      },
      { type: "application/ld+json", children: JSON.stringify(faqJsonLd(FAQS)) },
    ],
  }),
  component: EstimatorPage,
});

/* ─── Data & config ─── */
type Country = { code: string; name: string; flag: string; costIdx: number; revIdx: number };
const COUNTRIES: Country[] = [
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", costIdx: 1.0, revIdx: 1.0 },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", costIdx: 1.05, revIdx: 1.08 },
  { code: "EG", name: "Egypt", flag: "🇪🇬", costIdx: 0.78, revIdx: 0.72 },
  { code: "IN", name: "India", flag: "🇮🇳", costIdx: 0.72, revIdx: 0.68 },
  { code: "TR", name: "Türkiye", flag: "🇹🇷", costIdx: 0.85, revIdx: 0.82 },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿", costIdx: 0.88, revIdx: 0.86 },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", costIdx: 0.9, revIdx: 0.84 },
  { code: "BR", name: "Brazil", flag: "🇧🇷", costIdx: 0.92, revIdx: 0.88 },
];

const CAPACITIES = [1000, 3000, 5000, 8000, 10000, 15000, 20000] as const;
type Capacity = (typeof CAPACITIES)[number];

const PANELS = [
  { key: "PIR", density: 40, costK: 1.0, revK: 1.1, thermal: 5, fire: 3, roi: 5 },
  { key: "PUR", density: 42, costK: 0.94, revK: 1.02, thermal: 4, fire: 3, roi: 4 },
  { key: "Rock Wool", density: 110, costK: 1.12, revK: 1.05, thermal: 3, fire: 5, roi: 3 },
  { key: "EPS", density: 18, costK: 0.82, revK: 0.88, thermal: 3, fire: 2, roi: 3 },
  { key: "Hybrid", density: 60, costK: 1.2, revK: 1.15, thermal: 4, fire: 4, roi: 5 },
] as const;
type PanelKey = (typeof PANELS)[number]["key"];

const AUTOMATION = [
  { key: "Semi Automatic", costK: 0.78, opexK: 1.12, opFactor: 1.3 },
  { key: "Automatic", costK: 1.0, opexK: 1.0, opFactor: 1.0 },
  { key: "Fully Automatic", costK: 1.28, opexK: 0.86, opFactor: 0.72 },
] as const;
type AutomationKey = (typeof AUTOMATION)[number]["key"];

const FACTORY_TYPES = ["New Factory", "Expansion", "Upgrade", "Turnkey"] as const;
type FactoryType = (typeof FACTORY_TYPES)[number];
const FACTORY_TYPE_K: Record<FactoryType, number> = {
  "New Factory": 1.0,
  Expansion: 0.62,
  Upgrade: 0.35,
  Turnkey: 1.15,
};

const BUDGETS = ["< 2M USD", "2–5M USD", "5–10M USD", "10M+ USD"] as const;
type Budget = (typeof BUDGETS)[number];

const STEPS = [
  { key: "country", label: "Project Country", icon: MapPin },
  { key: "capacity", label: "Production Capacity", icon: Gauge },
  { key: "panel", label: "Panel Technology", icon: Layers },
  { key: "auto", label: "Automation Level", icon: Cog },
  { key: "type", label: "Factory Type", icon: Factory },
  { key: "budget", label: "Investment Budget", icon: Wallet },
] as const;

/* ─── Engine ─── */
function estimate(
  country: Country,
  cap: Capacity,
  panel: PanelKey,
  auto: AutomationKey,
  ftype: FactoryType,
) {
  const p = PANELS.find((x) => x.key === panel)!;
  const a = AUTOMATION.find((x) => x.key === auto)!;
  const capK = FACTORY_TYPE_K[ftype];

  // Base CAPEX at 8,000 m²/day, PIR, Automatic, New Factory, Saudi = $7.24M
  const base = 7_240_000;
  const capScale = Math.pow(cap / 8000, 0.78); // economies of scale
  const capex = base * capScale * p.costK * a.costK * capK * country.costIdx;

  // Physical footprint
  const buildingArea = Math.round(1_100 + cap * 2.15); // m²
  const landArea = Math.round(buildingArea * 2.4);
  const productionArea = Math.round(buildingArea * 0.58);
  const warehouseArea = Math.round(buildingArea * 0.28);
  const officeArea = Math.round(buildingArea * 0.14);

  // Utilities
  const power = Math.round(280 + cap * 0.75); // kVA
  const water = (Math.round(12 + cap * 0.009 * 1000) / 1000) * 1; // simplified
  const waterDaily = Math.round(12 + cap * 0.009); // m³/day
  const air = Math.round(320 + cap * 0.36); // m³/day
  const steam = Math.round(cap * 0.3 + 100); // kg/h
  const operators = Math.max(8, Math.round(cap * 0.006 * a.opFactor + 8));
  const forklifts = Math.max(2, Math.round(cap / 1600));

  // Production & finance
  const workingDays = 260;
  const utilization = 0.85;
  const linesCount = Math.max(1, Math.round(cap / 4500));
  const perLine = Math.round(cap / linesCount);
  const annualM2 = Math.round(cap * workingDays * utilization);
  const pricePerM2 = 12.5 * p.revK * country.revIdx; // USD/m²
  const revenue = Math.round(annualM2 * pricePerM2);
  const opex = Math.round(revenue * 0.68 * a.opexK);
  const gross = revenue - opex;
  const dep = Math.round(capex * 0.07);
  const net = Math.max(0, gross - dep);
  const roi = +((net / capex) * 100).toFixed(1); // 1-year ROI %
  const payback = +(capex / Math.max(1, net)).toFixed(1);
  const irr = +Math.min(45, 8 + roi * 0.85).toFixed(1);

  const risk =
    cap >= 15000 && ftype === "New Factory"
      ? "Moderate"
      : cap <= 3000 && auto === "Fully Automatic"
        ? "Moderate"
        : "Low";

  return {
    capex,
    buildingArea,
    landArea,
    productionArea,
    warehouseArea,
    officeArea,
    power,
    waterDaily,
    air,
    steam,
    operators,
    forklifts,
    annualM2,
    revenue,
    opex,
    gross,
    net,
    roi,
    irr,
    payback,
    linesCount,
    perLine,
    utilization: 85,
    risk,
    workingDays,
  };
}

type EstimationResult = ReturnType<typeof estimate>;

interface StepShellProps {
  n: number;
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
  last?: boolean;
}

interface ResultsHeaderProps {
  panel: PanelKey;
  auto: AutomationKey;
  capacity: Capacity;
  country: Country;
}

interface KpiRowProps {
  r: EstimationResult;
}

interface ProjectSummaryProps {
  r: EstimationResult;
}

interface FinancialChartsProps {
  r: EstimationResult;
}

interface ChartCardProps {
  title: string;
  pill?: string;
  children: React.ReactNode;
}

interface BarBiChartProps {
  inflows: number[];
  outflows: number[];
  labels: string[];
}

interface LineChartProps {
  values: number[];
  labels: string[];
  suffix?: string;
  showZero?: boolean;
}

interface BarChartMiniProps {
  values: number[];
  labels: string[];
}

interface LayoutAndRecommendProps {
  panel: PanelKey;
  auto: AutomationKey;
  ftype: FactoryType;
  r: EstimationResult;
}

const fmtUSD = (n: number) => {
  if (n >= 1_000_000) return `$ ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$ ${(n / 1_000).toFixed(0)}K`;
  return `$ ${n.toFixed(0)}`;
};
const fmt = (n: number) => n.toLocaleString("en-US");

/* ─── Page ─── */
function EstimatorPage() {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [capacity, setCapacity] = useState<Capacity>(8000);
  const [panel, setPanel] = useState<PanelKey>("PIR");
  const [auto, setAuto] = useState<AutomationKey>("Automatic");
  const [ftype, setFtype] = useState<FactoryType>("New Factory");
  const [budget, setBudget] = useState<Budget>("5–10M USD");
  const [generated, setGenerated] = useState(false);
  const [busy, setBusy] = useState(false);

  const result = useMemo(
    () => estimate(country, capacity, panel, auto, ftype),
    [country, capacity, panel, auto, ftype],
  );

  const generate = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setGenerated(true);
      setTimeout(() => {
        document
          .getElementById("ai-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#050807] text-white/90">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-emerald-500/25 blur-[120px]" />
          <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-[140px]" />
        </div>
        <div className="relative mx-auto grid max-w-[1440px] gap-8 px-6 py-14 md:grid-cols-[1.4fr_1fr] md:items-end md:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-emerald-300">
              <Sparkles className="h-3 w-3" /> AI-Powered Feasibility
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
              AI Project <span className="text-emerald-400">Estimator</span>
            </h1>
            <p className="mt-4 max-w-2xl text-white/70 md:text-lg">
              Get an instant, engineering-grade feasibility study for your sandwich panel factory —
              investment, utilities, capacity, ROI, IRR and payback in seconds.
            </p>
            <div className="mt-6 flex flex-wrap gap-6 text-sm">
              {[
                { i: Brain, t: "AI Powered", s: "Intelligent Analysis" },
                { i: Target, t: "Accurate", s: "Real Market Data" },
                { i: Cpu, t: "Fast", s: "Instant Results" },
              ].map(({ i: Icon, t, s }) => (
                <div
                  key={t}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <Icon className="h-4 w-4 text-emerald-300" />
                  <div>
                    <div className="text-xs font-semibold text-white">{t}</div>
                    <div className="text-[11px] text-white/50">{s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-2">
              <img
                loading="lazy"
                decoding="async"
                src={panelHero.url}
                alt="Panel cross-section"
                className="w-full rounded-xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* WIZARD + RESULTS */}
      <section className="mx-auto max-w-[1440px] px-4 py-10 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Wizard */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold">Project Configuration</div>
                <button
                  onClick={() => {
                    setCountry(COUNTRIES[0]);
                    setCapacity(8000);
                    setPanel("PIR");
                    setAuto("Automatic");
                    setFtype("New Factory");
                    setBudget("5–10M USD");
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white/80"
                >
                  <RefreshCw className="h-3 w-3" /> Reset
                </button>
              </div>

              {/* Step 1 Country */}
              <StepShell n={1} label="Project Country" icon={MapPin}>
                <select
                  value={country.code}
                  onChange={(e) => setCountry(COUNTRIES.find((c) => c.code === e.target.value)!)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#0a0d0c]">
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </StepShell>

              {/* Step 2 Capacity */}
              <StepShell n={2} label="Production Capacity" icon={Gauge}>
                <select
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value) as Capacity)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
                >
                  {CAPACITIES.map((c) => (
                    <option key={c} value={c} className="bg-[#0a0d0c]">
                      {fmt(c)} m² / day
                    </option>
                  ))}
                </select>
              </StepShell>

              {/* Step 3 Panel */}
              <StepShell n={3} label="Panel Technology" icon={Layers}>
                <div className="grid grid-cols-5 gap-1.5">
                  {PANELS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPanel(p.key)}
                      className={`rounded-lg border px-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition ${panel === p.key ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white"}`}
                    >
                      {p.key.replace(" ", "\n")}
                    </button>
                  ))}
                </div>
              </StepShell>

              {/* Step 4 Automation */}
              <StepShell n={4} label="Automation Level" icon={Cog}>
                <div className="grid grid-cols-3 gap-1.5">
                  {AUTOMATION.map((a) => (
                    <button
                      key={a.key}
                      onClick={() => setAuto(a.key)}
                      className={`rounded-lg border px-2 py-2 text-[11px] font-medium transition ${auto === a.key ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white"}`}
                    >
                      {a.key}
                    </button>
                  ))}
                </div>
              </StepShell>

              {/* Step 5 Type */}
              <StepShell n={5} label="Factory Type" icon={Factory}>
                <div className="grid grid-cols-2 gap-1.5">
                  {FACTORY_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setFtype(t)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${ftype === t ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </StepShell>

              {/* Step 6 Budget */}
              <StepShell n={6} label="Investment Budget" icon={Wallet} last>
                <div className="grid grid-cols-2 gap-1.5">
                  {BUDGETS.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBudget(b)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${budget === b ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white"}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </StepShell>

              <button
                onClick={generate}
                disabled={busy}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-70"
              >
                {busy ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Analyzing…
                  </>
                ) : (
                  <>
                    Generate AI Estimation <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-white/50">
                <div className="grid h-6 w-6 flex-none place-items-center rounded-md bg-emerald-500/10 ring-1 ring-emerald-500/30">
                  <Sparkles className="h-3 w-3 text-emerald-300" />
                </div>
                Our AI engine will analyze your inputs and generate a comprehensive project
                estimation.
              </div>
            </div>
          </aside>

          {/* Results */}
          <div id="ai-results" className="min-w-0 space-y-6">
            <AnimatePresence mode="wait">
              {!generated ? (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <PreEstimate onGenerate={generate} busy={busy} />
                </motion.div>
              ) : (
                <motion.div
                  key="live"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <ResultsHeader panel={panel} auto={auto} capacity={capacity} country={country} />
                  <KpiRow r={result} />
                  <ProjectSummary r={result} />
                  <FinancialCharts r={result} />
                  <EquipmentRow />
                  <LayoutAndRecommend panel={panel} auto={auto} ftype={ftype} r={result} />
                  <InvestmentBreakdown capex={result.capex} />
                  <ReportPreview />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/5 bg-[#070a09]">
        <div className="mx-auto max-w-[1440px] px-6 py-16">
          <div className="mb-6 text-xs uppercase tracking-[0.2em] text-emerald-300/90">
            Frequently asked
          </div>
          <h2 className="text-3xl font-semibold md:text-4xl">Answers before you build.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {FAQS.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 open:bg-white/[0.05]"
              >
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-white">
                  {f.q}
                  <ChevronRight className="h-4 w-4 text-emerald-300 transition group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-white/70">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-white/5 bg-gradient-to-b from-[#050807] to-[#0a1210]">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:py-20">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/90">
                Ready to build your factory?
              </div>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
                Turn this estimation into a{" "}
                <span className="text-emerald-400">detailed engineering proposal</span>.
              </h2>
              <p className="mt-4 max-w-xl text-white/70">
                NEVO engineers will refine every parameter with your site conditions and deliver a
                full turnkey plan — usually within 5 business days.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
              <Link
                to="/project-inquiry"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black hover:bg-emerald-400"
              >
                Request Full Proposal <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
              >
                <PhoneCall className="h-4 w-4" /> Talk to an Engineer
              </Link>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-6">
            {[
              { i: Brain, t: "AI Powered", s: "Intelligent Estimation" },
              { i: Target, t: "Real Market Data", s: "Accurate & Updated" },
              { i: ShieldCheck, t: "Engineering Expertise", s: "25+ Years Experience" },
              { i: Building2, t: "Global Projects", s: "85+ Countries" },
              { i: Wrench, t: "Turnkey Solutions", s: "From A to Z" },
              { i: PhoneCall, t: "After-Sales Support", s: "Lifetime Partnership" },
            ].map(({ i: Icon, t, s }) => (
              <div key={t} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <Icon className="h-5 w-5 text-emerald-300" />
                <div className="mt-2 text-xs font-semibold">{t}</div>
                <div className="text-[11px] text-white/50">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
        <Link
          to="/project-inquiry"
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black shadow-2xl shadow-emerald-500/30"
        >
          Request Full Engineering Proposal <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <SiteFooter />
    </div>
  );
}

/* ─── Sub components ─── */
function StepShell({ n, label, icon: Icon, children, last }: StepShellProps) {
  return (
    <div className={`${last ? "" : "mb-3 border-b border-white/5 pb-3"}`}>
      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/60">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
          {n}
        </span>
        <Icon className="h-3.5 w-3.5 text-emerald-300/70" /> {label}
      </div>
      {children}
    </div>
  );
}

function PreEstimate({ onGenerate, busy }: { onGenerate: () => void; busy: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
        <Sparkles className="h-6 w-6 text-emerald-300" />
      </div>
      <h3 className="mt-5 text-2xl font-semibold">
        Configure your project. Get instant AI feasibility.
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-white/60">
        Answer six quick questions on the left. Our engineering AI will produce investment,
        utilities, capacity, ROI, IRR and payback in seconds — with a downloadable report.
      </p>
      <button
        onClick={onGenerate}
        disabled={busy}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-70"
      >
        {busy ? "Analyzing…" : "Generate AI Estimation"} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ResultsHeader({ panel, auto, capacity, country }: ResultsHeaderProps) {
  const id = `NEVO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-300/90">
            <Sparkles className="h-3 w-3" /> AI Estimation Results
            <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
              Generated in 8.7 sec
            </span>
          </div>
          <div className="mt-1 text-sm text-white/60">
            {country.flag} {country.name} · {fmt(capacity)} m²/day · {panel} · {auto}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-[11px] text-white/60">
            Project ID
            <br />
            <span className="font-mono text-xs text-white/80">{id}</span>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white hover:bg-white/5">
            <Download className="h-4 w-4" /> Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}

function KpiRow({ r }: KpiRowProps) {
  const items = [
    { l: "Total Investment", v: fmtUSD(r.capex), s: "± 8% Accuracy", i: DollarSign },
    {
      l: "Annual Production",
      v: `${(r.annualM2 / 1_000_000).toFixed(2)}M m²`,
      s: `${r.workingDays} working days`,
      i: Factory,
    },
    {
      l: "ROI (5 Years)",
      v: `${(r.roi * 3.2).toFixed(1)}%`,
      s: r.roi > 20 ? "Excellent" : r.roi > 12 ? "Good" : "Fair",
      i: TrendingUp,
      tone: "emerald" as const,
    },
    {
      l: "Payback Period",
      v: `${Math.max(1.5, r.payback).toFixed(1)} Years`,
      s: r.payback < 4 ? "Very Good" : "Good",
      i: Clock,
    },
    {
      l: "IRR (10 Years)",
      v: `${r.irr}%`,
      s: r.irr > 25 ? "Excellent" : "Good",
      i: BarChart3,
      tone: "emerald" as const,
    },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((it) => (
        <div
          key={it.l}
          className={`rounded-2xl border p-4 ${it.tone === "emerald" ? "border-emerald-500/30 bg-emerald-500/[0.05]" : "border-white/10 bg-white/[0.03]"}`}
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-white/50">{it.l}</div>
            <it.i className="h-4 w-4 text-emerald-300" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{it.v}</div>
          <div
            className={`mt-1 text-[11px] ${it.tone === "emerald" ? "text-emerald-300" : "text-white/50"}`}
          >
            {it.s}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectSummary({ r }: ProjectSummaryProps) {
  const rows = [
    { i: Building2, l: "Land Area", v: `${fmt(r.landArea)} m²` },
    { i: Factory, l: "Building Area", v: `${fmt(r.buildingArea)} m²` },
    { i: Cog, l: "Production Area", v: `${fmt(r.productionArea)} m²` },
    { i: Truck, l: "Warehouse Area", v: `${fmt(r.warehouseArea)} m²` },
    { i: ClipboardList, l: "Office Area", v: `${fmt(r.officeArea)} m²` },
    { i: Zap, l: "Power Requirement", v: `${fmt(r.power)} kVA` },
    { i: Droplet, l: "Water Requirement", v: `${r.waterDaily} m³ / day` },
    { i: Wind, l: "Compressed Air", v: `${fmt(r.air)} m³ / day` },
    { i: Flame, l: "Steam Requirement", v: `${fmt(r.steam)} kg / h` },
    { i: Users, l: "Operators", v: `${r.operators} Persons` },
    { i: Truck, l: "Forklifts", v: `${r.forklifts} Units` },
    { i: Layers, l: "Production Lines", v: `${r.linesCount} Line${r.linesCount > 1 ? "s" : ""}` },
    { i: Gauge, l: "Panels / Line", v: `${fmt(r.perLine)} m² / day` },
    { i: BarChart3, l: "Utilization Rate", v: `${r.utilization}%` },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 text-sm font-semibold">Project Summary</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map(({ i: Icon, l, v }) => (
          <div
            key={l}
            className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
          >
            <div className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Icon className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-white/50">{l}</div>
              <div className="mt-0.5 truncate text-sm font-semibold text-white">{v}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinancialCharts({ r }: FinancialChartsProps) {
  // Cash flow: yearly, capex negative in Y0 ramp
  const yrs = [1, 2, 3, 4, 5];
  const ramp = [0.6, 0.75, 0.88, 0.95, 1.0];
  const inflows = ramp.map((x) => Math.round(((r.revenue * x) / 1_000_000) * 10) / 10);
  const outflows = ramp.map((x) => Math.round(((r.opex * x) / 1_000_000) * 10) / 10);
  const net = inflows.map((v, i) => +(v - outflows[i]).toFixed(1));
  const roiCum = ramp.map((x, i) => +(r.roi * (1 + i * 0.2) * 1).toFixed(1));
  const cum: number[] = [];
  net.reduce((a, v, i) => {
    const s = a - (i === 0 ? r.capex / 1_000_000 : 0) + v;
    cum.push(+s.toFixed(1));
    return s;
  }, 0);

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <ChartCard title="Cash Flow (USD M)">
        <BarBiChart inflows={inflows} outflows={outflows} labels={yrs.map((y) => `Y${y}`)} />
        <ChartLegend
          items={[
            ["Inflow", "bg-emerald-400"],
            ["Outflow", "bg-rose-400"],
          ]}
        />
      </ChartCard>
      <ChartCard title="ROI Over Time (%)" pill={`ROI Y5 ${roiCum[4]}%`}>
        <LineChart values={roiCum} labels={yrs.map((y) => `Y${y}`)} suffix="%" />
      </ChartCard>
      <ChartCard
        title="Investment Recovery (USD M)"
        pill={`Payback ${Math.max(1.5, r.payback).toFixed(1)} y`}
      >
        <LineChart values={cum} labels={yrs.map((y) => `Y${y}`)} showZero />
      </ChartCard>
      <ChartCard title="Profitability (USD M)" pill={`Net ${(r.net / 1_000_000).toFixed(2)} M/yr`}>
        <BarChartMini values={net} labels={yrs.map((y) => `Y${y}`)} />
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, pill, children }: ChartCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between text-xs">
        <div className="font-semibold text-white/90">{title}</div>
        {pill && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
            {pill}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
function ChartLegend({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-2 flex gap-3 text-[10px] text-white/50">
      {items.map(([l, c]) => (
        <span key={l} className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-sm ${c}`} />
          {l}
        </span>
      ))}
    </div>
  );
}
function BarBiChart({ inflows, outflows, labels }: BarBiChartProps) {
  const max = Math.max(...inflows, ...outflows, 1);
  return (
    <div className="flex h-32 items-end gap-2">
      {inflows.map((v: number, i: number) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full items-end gap-0.5">
            <div
              className="flex-1 rounded-t bg-emerald-400/80"
              style={{ height: `${(v / max) * 90}px` }}
              title={`Inflow ${v}M`}
            />
            <div
              className="flex-1 rounded-t bg-rose-400/80"
              style={{ height: `${(outflows[i] / max) * 90}px` }}
              title={`Outflow ${outflows[i]}M`}
            />
          </div>
          <div className="text-[9px] text-white/60">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}
function LineChart({ values, labels, suffix, showZero }: LineChartProps) {
  const min = Math.min(...values, showZero ? 0 : values[0]);
  const max = Math.max(...values);
  const range = Math.max(0.1, max - min);
  const w = 260,
    h = 100;
  const step = w / (values.length - 1);
  const y = (v: number) => h - ((v - min) / range) * (h - 12) - 6;
  const path = values
    .map((v: number, i: number) => `${i === 0 ? "M" : "L"} ${i * step} ${y(v)}`)
    .join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-28 w-full">
        <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#lg)" opacity="0.4" />
        <defs>
          <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="#10b981" strokeWidth="2" />
        {values.map((v: number, i: number) => (
          <circle key={i} cx={i * step} cy={y(v)} r="2.5" fill="#10b981" />
        ))}
      </svg>
      <div className="flex justify-between text-[9px] text-white/60">
        {labels.map((l: string) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}
function BarChartMini({ values, labels }: BarChartMiniProps) {
  const max = Math.max(...values, 1);
  return (
    <div>
      <div className="flex h-28 items-end gap-2">
        {values.map((v: number, i: number) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/40 to-emerald-400"
            style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-white/60">
        {labels.map((l: string) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function EquipmentRow() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold">Equipment Recommendation</div>
        <button className="text-xs text-emerald-300 hover:text-emerald-200">
          View full equipment list →
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {EQUIPMENT.map((e) => (
          <div
            key={e.title}
            className="overflow-hidden rounded-xl border border-white/5 bg-black/40"
          >
            <div className="aspect-square overflow-hidden">
              <img
                loading="lazy"
                decoding="async"
                src={e.img.url}
                alt={e.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-3">
              <div className="text-xs font-semibold text-white">{e.title}</div>
              <div className="text-[11px] text-emerald-300">{e.units}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LayoutAndRecommend({ panel, auto, ftype, r }: LayoutAndRecommendProps) {
  const zones = [
    "Raw Material Warehouse",
    "Roll Forming Line",
    "Double Belt Laminator",
    "Foaming Area",
    "Cooling Section",
    "Cutting Station",
    "Stacking System",
    "Packaging Area",
    "Finished Goods Warehouse",
    "Loading Bays",
    "Office & Laboratory",
    "Utilities Area",
  ];
  const [view, setView] = useState<"3D" | "TOP" | "EXPLODED">("3D");
  const bullets = [
    `${panel === "PIR" ? "Best-in-class thermal performance (λ ≈ 0.022 W/m·K)" : panel === "Rock Wool" ? "Highest fire performance (EI 240) with excellent acoustic damping" : panel === "PUR" ? "Cost-optimized foam with strong ROI at scale" : panel === "EPS" ? "Entry-level cost per m² for commercial cladding" : "Flexible line — switch between PIR, PUR and RW cores"}`,
    `${auto === "Fully Automatic" ? "Fully automatic operation minimizes labor cost and stabilizes quality" : auto === "Automatic" ? "Automatic operation balances CAPEX with OPEX efficiency" : "Semi-automatic is capital-light and faster to commission"}`,
    `${ftype === "Turnkey" ? "Turnkey delivery: NEVO handles civil, mechanical, electrical and commissioning" : ftype === "Expansion" ? "Expansion within an existing plant — shorter payback and lower risk" : ftype === "Upgrade" ? "Upgrade path re-uses existing utilities and building envelope" : "Greenfield build allows optimal layout & future-proofing"}`,
    `Utility sizing (${fmt(r.power)} kVA / ${r.waterDaily} m³·day / ${fmt(r.steam)} kg·h) supports 95% peak throughput`,
    `Recommended workforce: ${r.operators} operators across ${r.linesCount} line${r.linesCount > 1 ? "s" : ""} — 3-shift model`,
    `Reserve 30–40% of land for Phase-2 expansion when demand exceeds 90% utilization for 3 consecutive quarters`,
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Factory Layout Preview</div>
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            {(["3D", "TOP", "EXPLODED"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded px-2.5 py-1 text-[10px] font-semibold ${view === v ? "bg-emerald-500 text-black" : "text-white/60 hover:text-white"}`}
              >
                {v} VIEW
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
          <div className="relative overflow-hidden rounded-xl border border-white/10">
            <img
              loading="lazy"
              decoding="async"
              src={layoutImg.url}
              alt="Factory Layout"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
              {view} VIEW
            </span>
          </div>
          <ul className="space-y-1.5 text-xs">
            {zones.map((z, i) => (
              <li
                key={z}
                className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
              >
                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/15 text-[9px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                  {i + 1}
                </span>
                <span className="text-white/80">{z}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" /> AI Recommendation
        </div>
        <div className="mt-2 text-xl font-semibold text-white">
          {panel} with{" "}
          {auto === "Fully Automatic"
            ? "Fully Automatic"
            : auto === "Automatic"
              ? "Automatic"
              : "Semi-Automatic"}{" "}
          Line is the optimal choice for your project.
        </div>
        <img
          loading="lazy"
          decoding="async"
          src={panelHero.url}
          alt="Recommended panel"
          className="mt-4 w-full rounded-xl border border-white/10"
        />
        <ul className="mt-4 space-y-2 text-sm">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-white/80">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/60 ring-1 ring-white/10">
            Risk: <span className="text-emerald-300">{r.risk}</span>
          </span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/60 ring-1 ring-white/10">
            Utilization: <span className="text-emerald-300">{r.utilization}%</span>
          </span>
        </div>
        <button className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200">
          View detailed recommendation <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function InvestmentBreakdown({ capex }: { capex: number }) {
  const parts = [
    { l: "Machinery & Equipment", p: 51.2, c: "#10b981" },
    { l: "Building & Civil Work", p: 17.8, c: "#f59e0b" },
    { l: "Utilities & Installation", p: 11.6, c: "#3b82f6" },
    { l: "Electrical & Automation", p: 7.9, c: "#a855f7" },
    { l: "Engineering & Design", p: 4.3, c: "#ec4899" },
    { l: "Others & Contingency", p: 7.2, c: "#eab308" },
  ];
  // Donut chart
  let acc = 0;
  const R = 44,
    C = 2 * Math.PI * R;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-3 text-sm font-semibold">Estimated Investment Breakdown</div>
        <div className="flex items-center gap-6">
          <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="14"
            />
            {parts.map((p, i) => {
              const len = (p.p / 100) * C;
              const dash = `${len} ${C - len}`;
              const el = (
                <circle
                  key={i}
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  stroke={p.c}
                  strokeWidth="14"
                  strokeDasharray={dash}
                  strokeDashoffset={-acc}
                />
              );
              acc += len;
              return el;
            })}
          </svg>
          <div className="flex-1 space-y-2 text-xs">
            {parts.map((p) => (
              <div key={p.l} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white/80">
                  <span className="h-2 w-2 rounded-full" style={{ background: p.c }} />
                  {p.l}
                </span>
                <span className="font-semibold text-white">{p.p}%</span>
              </div>
            ))}
            <div className="mt-2 border-t border-white/5 pt-2 text-sm">
              <span className="text-white/60">Total</span>{" "}
              <span className="ml-2 font-semibold text-emerald-300">{fmtUSD(capex)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-3 text-sm font-semibold">Production Line Overview</div>
        <div className="grid grid-cols-6 gap-2 text-center text-[10px] text-white/60">
          {["Coil", "Roll Forming", "Laminating", "Foaming", "Cooling", "Cutting"].map((s, i) => (
            <div key={s} className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
              <div className="mx-auto grid h-8 w-8 place-items-center rounded-md bg-emerald-500/10 ring-1 ring-emerald-500/30">
                <Cog className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="mt-1">{s}</div>
              {i < 5 && <div className="mt-1 text-emerald-300/50">→</div>}
            </div>
          ))}
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/70">
          {[
            "2 Fully Automatic Lines",
            "PIR Density: 38–42 kg/m³",
            "4,050 m² / day per line",
            "Steel Thickness: 0.3–0.8 mm",
            "Panel Thickness: 30–200 mm",
            "Production Speed: 8–12 m/min",
            "Panel Width: 1,000–1,200 mm",
            "Productivity: 95%",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ReportPreview() {
  const items = [
    "Executive Summary",
    "Project Overview",
    "Financial Estimation",
    "Technical Specification",
    "Utilities & Requirements",
    "Equipment List",
    "Factory Layout",
    "Risk Analysis",
    "Next Steps",
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">AI Generated Report Preview</div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
            Ready
          </span>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-white/10">
          <img
            loading="lazy"
            decoding="async"
            src={reportImg.url}
            alt="Report Preview"
            className="w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black hover:bg-emerald-400">
          <Download className="h-4 w-4" /> Download Full Report (PDF)
        </button>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-3 text-sm font-semibold">What's Inside</div>
        <ul className="grid grid-cols-1 gap-2 text-sm">
          {items.map((t) => (
            <li
              key={t}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-white/80"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <a
            href={SITE.contact.phoneHref}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-white/70 hover:bg-white/5"
          >
            <PhoneCall className="h-3 w-3" /> Call
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-white/70 hover:bg-white/5"
          >
            <MessageCircle className="h-3 w-3" /> WhatsApp
          </a>
          <a
            href="mailto:solutions@nevoindustrial.com"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-white/70 hover:bg-white/5"
          >
            <Mail className="h-3 w-3" /> Email
          </a>
          <Link
            to="/project-inquiry"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 font-semibold text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25"
          >
            <Rocket className="h-3 w-3" /> Book Engineering Meeting
          </Link>
        </div>
      </div>
    </div>
  );
}
