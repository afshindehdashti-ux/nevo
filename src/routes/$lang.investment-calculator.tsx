import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Building2,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Download,
  Factory,
  Gauge,
  Layers,
  MessageSquare,
  PhoneCall,
  Zap,
  Droplets,
  Wind,
  Users,
  MapPin,
  ShieldCheck,
  FileText,
  BarChart3,
  TrendingUp,
  Landmark,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { buildSeo, orgJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { downloadInvestmentReport } from "@/lib/investment-pdf";

// ---------------- SEO ----------------
export const Route = createFileRoute("/$lang/investment-calculator")({
  component: InvestmentCalculatorPage,
  head: () => {
    const seo = buildSeo({
      lang: params.lang,
      title: "Factory Investment Calculator — Sandwich Panel Plant CAPEX & ROI",
      description:
        "Estimate CAPEX, OPEX, ROI, IRR, NPV and payback for a sandwich panel manufacturing plant. Engineered by NEVO Industrial for investors and developers.",
      path: "/investment-calculator",
    });
    return {
      meta: seo.meta,
      links: seo.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(orgJsonLd()),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Solutions", path: "/solutions/factory-development" },
              { name: "Investment Calculator", path: "/investment-calculator" },
            ]),
          ),
        },
      ],
    };
  },
});

// ---------------- Domain model ----------------
type Capacity = 1000 | 3000 | 5000 | 10000 | 20000;
type PanelType = "PIR" | "PUR" | "Rock Wool" | "EPS" | "Mixed";
type LineType = "Continuous" | "Discontinuous";
type Ownership = "Owned" | "To be Purchased";
type Automation = "Standard" | "Advanced" | "Fully Automated";

type Inputs = {
  capacity: Capacity;
  panel: PanelType;
  line: LineType;
  country: string;
  currency: "USD" | "EUR" | "AED" | "SAR";
  electricity: number; // USD / kWh
  labor: number; // USD / month per operator
  ownership: Ownership;
  landPrice: number; // USD / m² (only if to be purchased)
  automation: Automation;
  workingDays: number;
  shifts: 1 | 2 | 3;
  sellingPrice: number; // USD / m²
};

const DEFAULTS: Inputs = {
  capacity: 10000,
  panel: "PIR",
  line: "Continuous",
  country: "United Arab Emirates",
  currency: "USD",
  electricity: 0.08,
  labor: 850,
  ownership: "Owned",
  landPrice: 120,
  automation: "Advanced",
  workingDays: 300,
  shifts: 2,
  sellingPrice: 13.3,
};

const CURRENCY_SYMBOL: Record<Inputs["currency"], string> = {
  USD: "$",
  EUR: "€",
  AED: "AED ",
  SAR: "SAR ",
};

const CURRENCY_FX: Record<Inputs["currency"], number> = {
  USD: 1,
  EUR: 0.92,
  AED: 3.67,
  SAR: 3.75,
};

// ---------------- Engineering calculations ----------------
function computeModel(i: Inputs) {
  // Baseline CAPEX intensity ($ per m²/day capacity)
  const panelCapexFactor: Record<PanelType, number> = {
    PIR: 620,
    PUR: 560,
    "Rock Wool": 780,
    EPS: 480,
    Mixed: 700,
  };
  const lineFactor = i.line === "Continuous" ? 1.15 : 0.85;
  const automationFactor =
    i.automation === "Standard" ? 0.9 : i.automation === "Advanced" ? 1 : 1.18;

  const capacityScale = Math.pow(i.capacity / 10000, 0.92); // mild economies of scale
  const baseCapex =
    i.capacity * panelCapexFactor[i.panel] * lineFactor * automationFactor;
  const totalCapex = baseCapex * capacityScale;

  // Breakdown (weights approximate industry norms)
  const machinery = totalCapex * 0.48;
  const building = totalCapex * 0.17;
  const installation = totalCapex * 0.11;
  const electrical = totalCapex * 0.08;
  const rawTools = totalCapex * 0.06;
  const others = totalCapex - (machinery + building + installation + electrical + rawTools);

  // Land & building sizing
  const landArea = Math.round(i.capacity * 1.0); // m²
  const buildingArea = Math.round(i.capacity * 0.62);
  const landCost = i.ownership === "Owned" ? 0 : landArea * i.landPrice;

  const workingCapital = totalCapex * 0.17;
  const totalInvestment = totalCapex + landCost + workingCapital;

  // Utilities
  const powerKw = Math.round(i.capacity * 0.14);
  const waterM3 = Math.round(i.capacity * 0.002 * 10) / 10;
  const compressedAir = Math.round(i.capacity * 0.6);
  const steam = i.panel === "Rock Wool" ? Math.round(i.capacity * 0.15) : 0;
  const operators = Math.max(
    18,
    Math.round((i.capacity / 1000) * (i.automation === "Fully Automated" ? 3.2 : i.automation === "Advanced" ? 4.5 : 6.2)),
  );

  // Production & revenue
  const annualProduction = i.capacity * i.workingDays * (i.shifts / 2);
  const revenue = annualProduction * i.sellingPrice;

  // OPEX
  const rawMaterialsRate: Record<PanelType, number> = {
    PIR: 7.2,
    PUR: 6.4,
    "Rock Wool": 8.1,
    EPS: 5.2,
    Mixed: 7.0,
  };
  const rawMaterials = annualProduction * rawMaterialsRate[i.panel];
  const laborCost = operators * i.labor * 12;
  const energy = powerKw * 8 * i.workingDays * i.shifts * i.electricity;
  const maintenance = machinery * 0.03;
  const packaging = annualProduction * 0.15;
  const otherOpex = revenue * 0.02;
  const opex = rawMaterials + laborCost + energy + maintenance + packaging + otherOpex;

  const grossProfit = revenue - opex;
  const grossMargin = grossProfit / Math.max(revenue, 1);
  const netProfit = grossProfit * 0.82; // after tax/finance
  const roi5 = (netProfit * 5) / Math.max(totalInvestment, 1);
  const payback = totalInvestment / Math.max(netProfit, 1);
  const npv = netProfit * 3.79 - totalInvestment; // 10% discount, 5y annuity factor
  const irr = Math.max(0.05, netProfit / totalInvestment - 0.04);
  const breakEvenMonths = Math.round((totalInvestment / Math.max(netProfit, 1)) * 12);
  const marginOfSafety = Math.max(0.1, 1 - opex / Math.max(revenue, 1));
  const costPerM2Day = totalInvestment / Math.max(i.capacity, 1);

  const cashflow = Array.from({ length: 6 }, (_, y) => {
    const outflow =
      y === 0 ? totalCapex + workingCapital : opex * (1 + y * 0.03);
    const inflow = y === 0 ? 0 : revenue * (0.8 + y * 0.05);
    return {
      year: `Year ${y}`,
      Inflow: Math.round(inflow),
      Outflow: -Math.round(outflow),
      Net: Math.round(inflow - outflow),
    };
  });

  const sensitivity = [-0.2, -0.1, 0, 0.1, 0.2].map((d) => {
    const rev = revenue * (1 + d);
    const gp = rev - opex;
    const np = gp * 0.82;
    return {
      label: `${d > 0 ? "+" : ""}${(d * 100).toFixed(0)}%`,
      ROI: Math.round(((np * 5) / totalInvestment) * 100),
    };
  });

  return {
    totalCapex,
    breakdown: [
      { name: "Machinery & Equipment", value: machinery, color: "#22c55e" },
      { name: "Building & Infrastructure", value: building, color: "#3b82f6" },
      { name: "Installation & Commissioning", value: installation, color: "#06b6d4" },
      { name: "Electrical & Automation", value: electrical, color: "#a855f7" },
      { name: "Raw Materials & Tools", value: rawTools, color: "#f97316" },
      { name: "Others & Contingencies", value: others, color: "#eab308" },
    ],
    opexBreakdown: [
      { name: "Raw Materials", value: rawMaterials },
      { name: "Labor", value: laborCost },
      { name: "Energy", value: energy },
      { name: "Maintenance", value: maintenance },
      { name: "Packaging & Logistics", value: packaging },
      { name: "Other Expenses", value: otherOpex },
    ],
    landArea,
    buildingArea,
    landCost,
    workingCapital,
    totalInvestment,
    powerKw,
    waterM3,
    compressedAir,
    steam,
    operators,
    annualProduction,
    revenue,
    opex,
    grossProfit,
    grossMargin,
    netProfit,
    roi5,
    payback,
    npv,
    irr,
    breakEvenMonths,
    marginOfSafety,
    costPerM2Day,
    cashflow,
    sensitivity,
  };
}

// ---------------- Helpers ----------------
function fmtMoney(v: number, cur: Inputs["currency"]) {
  const scaled = v * CURRENCY_FX[cur];
  return `${CURRENCY_SYMBOL[cur]}${Math.round(scaled).toLocaleString()}`;
}
function fmtCompact(v: number, cur: Inputs["currency"]) {
  const scaled = v * CURRENCY_FX[cur];
  const abs = Math.abs(scaled);
  const sign = scaled < 0 ? "-" : "";
  if (abs >= 1e6) return `${CURRENCY_SYMBOL[cur]}${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${CURRENCY_SYMBOL[cur]}${sign}${(abs / 1e3).toFixed(0)}K`;
  return `${CURRENCY_SYMBOL[cur]}${Math.round(scaled)}`;
}

// ---------------- UI atoms (scoped dark theme) ----------------
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-400/80">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCx =
  "w-full rounded-md border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30";

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-xs font-medium transition ${
        active
          ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/25 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function KpiCell({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col justify-center gap-1 px-4 py-4">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
        {label}
      </span>
      <span
        className={`font-display text-xl md:text-2xl font-semibold tabular-nums ${
          accent ? "text-emerald-400" : "text-white"
        }`}
      >
        {value}
      </span>
      {hint ? <span className="text-[10px] text-white/40">{hint}</span> : null}
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-[#0b0f0d]/80 p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ${className}`}
    >
      {title ? (
        <div className="mb-4 flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-emerald-400" /> : null}
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-white/80">
            {title}
          </h3>
        </div>
      ) : null}
      {children}
    </div>
  );
}

// ---------------- Page ----------------
function InvestmentCalculatorPage() {
  const [i, setI] = useState<Inputs>(DEFAULTS);
  const [step, setStep] = useState(0);
  const m = useMemo(() => computeModel(i), [i]);
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) =>
    setI((s) => ({ ...s, [k]: v }));

  const steps = [
    { id: "inputs", label: "Inputs" },
    { id: "investment", label: "Investment" },
    { id: "operation", label: "Operation" },
    { id: "financial", label: "Financial Analysis" },
    { id: "summary", label: "Summary" },
  ];

  const totalKpis = [
    {
      label: "Total Investment",
      value: fmtCompact(m.totalInvestment, i.currency),
      accent: true,
      hint: i.currency,
    },
    {
      label: "Production Capacity",
      value: i.capacity.toLocaleString(),
      hint: "m² / day",
    },
    {
      label: "Annual Revenue",
      value: fmtCompact(m.revenue, i.currency),
      hint: i.currency,
    },
    {
      label: "Payback Period",
      value: `${m.payback.toFixed(1)}`,
      hint: "Years",
    },
    {
      label: "ROI (5 Years)",
      value: `${Math.round(m.roi5 * 100)}%`,
      accent: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Dark app shell */}
      <main className="bg-[#05070a] text-white">
        {/* Header band */}
        <section className="border-b border-white/10 bg-gradient-to-b from-[#0a0f10] to-[#05070a]">
          <div className="mx-auto max-w-[1440px] px-5 pb-8 pt-24 md:pt-28">
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex items-center gap-1.5 text-[12px] text-white/50"
            >
              <Link to="/" className="hover:text-white/80">
                Home
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/solutions" className="hover:text-white/80">
                Solutions
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/solutions/factory-development" className="hover:text-white/80">
                Factory Development
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white/80">Investment Calculator</span>
            </nav>

            <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-300">
                  <Sparkles className="h-3 w-3" />
                  Engineered for success — built for returns
                </div>
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="font-display text-4xl md:text-6xl font-semibold leading-[1.02] tracking-tight"
                >
                  Factory <span className="text-emerald-400">Investment</span>{" "}
                  Calculator
                </motion.h1>
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/60">
                  Estimate total investment, model operating cost and forecast
                  profitability of a sandwich panel manufacturing plant — in
                  minutes. Built by NEVO's engineers for investors, developers
                  and industrial groups.
                </p>
              </div>

              {/* Highlights */}
              <ul className="grid grid-cols-2 gap-2 text-[12px] text-white/70">
                {[
                  { icon: Calculator, label: "Accurate estimation" },
                  { icon: Gauge, label: "Real-time calculation" },
                  { icon: BarChart3, label: "Detailed breakdown" },
                  { icon: TrendingUp, label: "ROI & payback analysis" },
                  { icon: Download, label: "Export & share report" },
                  { icon: ShieldCheck, label: "Engineered by NEVO" },
                ].map((f) => (
                  <li
                    key={f.label}
                    className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2"
                  >
                    <f.icon className="h-3.5 w-3.5 text-emerald-400" />
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Stepper */}
        <section className="border-b border-white/10 bg-[#05070a]">
          <div className="mx-auto max-w-[1440px] px-5 py-4">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 overflow-x-auto text-[12px]">
              {steps.map((s, idx) => (
                <li key={s.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setStep(idx)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                      idx === step
                        ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
                        : "border-white/10 text-white/60 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold ${
                        idx === step
                          ? "bg-emerald-400 text-black"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="whitespace-nowrap font-medium tracking-wide uppercase text-[11px]">
                      {s.label}
                    </span>
                  </button>
                  {idx < steps.length - 1 ? (
                    <ChevronRight className="h-3.5 w-3.5 text-white/25" />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Working area */}
        <section className="mx-auto max-w-[1440px] px-5 py-8">
          <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
            {/* LEFT: inputs */}
            <Card title="Factory Configuration" icon={Factory}>
              <div className="grid gap-4">
                <Field label="Production Line Capacity">
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1000, 3000, 5000, 10000, 20000].map((c) => (
                      <Chip
                        key={c}
                        active={i.capacity === c}
                        onClick={() => set("capacity", c as Capacity)}
                      >
                        {c.toLocaleString()}
                      </Chip>
                    ))}
                  </div>
                  <div className="mt-1 text-[10px] text-white/40">m² / day</div>
                </Field>

                <Field label="Panel Type">
                  <select
                    className={inputCx}
                    value={i.panel}
                    onChange={(e) => set("panel", e.target.value as PanelType)}
                  >
                    {["PIR", "PUR", "Rock Wool", "EPS", "Mixed"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Production Line">
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["Continuous", "Discontinuous"] as LineType[]).map((l) => (
                      <Chip
                        key={l}
                        active={i.line === l}
                        onClick={() => set("line", l)}
                      >
                        {l}
                      </Chip>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Country">
                    <input
                      className={inputCx}
                      value={i.country}
                      onChange={(e) => set("country", e.target.value)}
                      placeholder="Select country"
                    />
                  </Field>
                  <Field label="Currency">
                    <select
                      className={inputCx}
                      value={i.currency}
                      onChange={(e) =>
                        set("currency", e.target.value as Inputs["currency"])
                      }
                    >
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="AED">AED — UAE Dirham</option>
                      <option value="SAR">SAR — Saudi Riyal</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Electricity ($/kWh)">
                    <input
                      type="number"
                      step="0.01"
                      className={inputCx}
                      value={i.electricity}
                      onChange={(e) =>
                        set("electricity", parseFloat(e.target.value) || 0)
                      }
                    />
                  </Field>
                  <Field label="Labor ($/mo·op)">
                    <input
                      type="number"
                      className={inputCx}
                      value={i.labor}
                      onChange={(e) => set("labor", parseFloat(e.target.value) || 0)}
                    />
                  </Field>
                </div>

                <Field label="Land Ownership">
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["Owned", "To be Purchased"] as Ownership[]).map((o) => (
                      <Chip
                        key={o}
                        active={i.ownership === o}
                        onClick={() => set("ownership", o)}
                      >
                        {o}
                      </Chip>
                    ))}
                  </div>
                </Field>

                {i.ownership === "To be Purchased" ? (
                  <Field label="Land Price ($/m²)">
                    <input
                      type="number"
                      className={inputCx}
                      value={i.landPrice}
                      onChange={(e) =>
                        set("landPrice", parseFloat(e.target.value) || 0)
                      }
                    />
                  </Field>
                ) : null}

                <Field label="Automation Level">
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["Standard", "Advanced", "Fully Automated"] as Automation[]).map(
                      (a) => (
                        <Chip
                          key={a}
                          active={i.automation === a}
                          onClick={() => set("automation", a)}
                        >
                          {a}
                        </Chip>
                      ),
                    )}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Working Days / Year">
                    <input
                      type="number"
                      className={inputCx}
                      value={i.workingDays}
                      onChange={(e) =>
                        set("workingDays", parseInt(e.target.value) || 0)
                      }
                    />
                  </Field>
                  <Field label="Shifts">
                    <select
                      className={inputCx}
                      value={i.shifts}
                      onChange={(e) =>
                        set("shifts", parseInt(e.target.value) as 1 | 2 | 3)
                      }
                    >
                      <option value={1}>1 shift</option>
                      <option value={2}>2 shifts</option>
                      <option value={3}>3 shifts</option>
                    </select>
                  </Field>
                </div>

                <Field label="Selling Price ($/m²)">
                  <input
                    type="number"
                    step="0.1"
                    className={inputCx}
                    value={i.sellingPrice}
                    onChange={(e) =>
                      set("sellingPrice", parseFloat(e.target.value) || 0)
                    }
                  />
                </Field>

                <button
                  type="button"
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
                >
                  <Calculator className="h-4 w-4" />
                  Calculate Investment
                </button>
              </div>
            </Card>

            {/* RIGHT: live results */}
            <div className="grid gap-5">
              {/* KPI strip */}
              <Card>
                <div className="grid grid-cols-2 divide-x divide-white/10 md:grid-cols-5">
                  {totalKpis.map((k) => (
                    <KpiCell key={k.label} {...k} />
                  ))}
                </div>
              </Card>

              {/* Investment breakdown + summary */}
              <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
                <Card title="Investment Breakdown" icon={Layers}>
                  <div className="grid gap-4 md:grid-cols-[240px_1fr]">
                    <div className="relative h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={m.breakdown}
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {m.breakdown.map((b, idx) => (
                              <Cell key={idx} fill={b.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                          Total
                        </span>
                        <span className="font-display text-lg font-semibold text-emerald-400">
                          {fmtCompact(m.totalCapex, i.currency)}
                        </span>
                      </div>
                    </div>
                    <ul className="grid content-center gap-2 text-[12px]">
                      {m.breakdown.map((b) => {
                        const pct = ((b.value / m.totalCapex) * 100).toFixed(1);
                        return (
                          <li
                            key={b.name}
                            className="flex items-center justify-between gap-3 border-b border-white/5 pb-1.5"
                          >
                            <span className="flex items-center gap-2 text-white/80">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ background: b.color }}
                              />
                              {b.name}
                            </span>
                            <span className="tabular-nums text-white">
                              {fmtCompact(b.value, i.currency)}{" "}
                              <span className="text-white/40">{pct}%</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Card>

                <div className="grid gap-5">
                  <Card title="Investment Summary" icon={Landmark}>
                    <dl className="text-[13px]">
                      {[
                        ["Total Fixed Cost", fmtMoney(m.totalCapex, i.currency)],
                        ["Land Cost", fmtMoney(m.landCost, i.currency)],
                        [
                          "Total Working Capital",
                          fmtMoney(m.workingCapital, i.currency),
                        ],
                      ].map(([k, v]) => (
                        <div
                          key={k}
                          className="flex items-center justify-between border-b border-white/5 py-2"
                        >
                          <dt className="text-white/60">{k}</dt>
                          <dd className="tabular-nums text-white">{v}</dd>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2">
                        <dt className="text-emerald-300">Total Investment</dt>
                        <dd className="tabular-nums font-semibold text-emerald-300">
                          {fmtMoney(m.totalInvestment, i.currency)}
                        </dd>
                      </div>
                    </dl>
                  </Card>
                  <Card title="Cost per m² / Day" icon={Gauge}>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-5xl font-semibold text-emerald-400 tabular-nums">
                        {fmtCompact(m.costPerM2Day, i.currency)}
                      </span>
                      <span className="text-xs text-white/50">{i.currency}</span>
                    </div>
                    <p className="mt-2 text-[11px] text-white/50">
                      Based on total capacity of {i.capacity.toLocaleString()} m²/day
                    </p>
                  </Card>
                </div>
              </div>

              {/* 5-card operational grid */}
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                <Card title="1. Investment Details">
                  <ul className="text-[12px]">
                    {m.breakdown.map((b) => (
                      <li
                        key={b.name}
                        className="flex justify-between border-b border-white/5 py-1.5"
                      >
                        <span className="text-white/60">{b.name}</span>
                        <span className="tabular-nums">
                          {fmtCompact(b.value, i.currency)}
                        </span>
                      </li>
                    ))}
                    <li className="mt-1.5 flex justify-between pt-1.5">
                      <span className="text-emerald-300">Total</span>
                      <span className="tabular-nums font-semibold text-emerald-300">
                        {fmtCompact(m.totalCapex, i.currency)}
                      </span>
                    </li>
                  </ul>
                </Card>

                <Card title="2. Operating Cost (Annual)">
                  <ul className="text-[12px]">
                    {m.opexBreakdown.map((o) => (
                      <li
                        key={o.name}
                        className="flex justify-between border-b border-white/5 py-1.5"
                      >
                        <span className="text-white/60">{o.name}</span>
                        <span className="tabular-nums">
                          {fmtCompact(o.value, i.currency)}
                        </span>
                      </li>
                    ))}
                    <li className="mt-1.5 flex justify-between pt-1.5">
                      <span className="text-emerald-300">Total OPEX</span>
                      <span className="tabular-nums font-semibold text-emerald-300">
                        {fmtCompact(m.opex, i.currency)}
                      </span>
                    </li>
                  </ul>
                </Card>

                <Card title="3. Revenue Analysis">
                  <div className="grid gap-3 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-white/60">Unit Price</span>
                      <span className="tabular-nums">
                        {CURRENCY_SYMBOL[i.currency]}
                        {i.sellingPrice.toFixed(2)} /m²
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Annual Production</span>
                      <span className="tabular-nums">
                        {Math.round(m.annualProduction).toLocaleString()} m²
                      </span>
                    </div>
                    <div className="rounded-md border border-emerald-400/20 bg-emerald-400/5 p-3">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-300/80">
                        Annual Revenue
                      </div>
                      <div className="font-display text-xl font-semibold text-emerald-400 tabular-nums">
                        {fmtCompact(m.revenue, i.currency)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded-md border border-white/10 p-2">
                        <div className="text-white/50">Gross Profit</div>
                        <div className="tabular-nums text-white">
                          {fmtCompact(m.grossProfit, i.currency)}
                        </div>
                      </div>
                      <div className="rounded-md border border-white/10 p-2">
                        <div className="text-white/50">Gross Margin</div>
                        <div className="tabular-nums text-emerald-400">
                          {(m.grossMargin * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="4. Cash Flow (5 Years)" className="xl:col-span-1">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={m.cashflow} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="year" tick={{ fill: "#ffffff70", fontSize: 10 }} />
                        <YAxis
                          tick={{ fill: "#ffffff70", fontSize: 10 }}
                          tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#0a0f10",
                            border: "1px solid #ffffff20",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          formatter={(v: number) => fmtCompact(v, i.currency)}
                        />
                        <Bar dataKey="Inflow" fill="#22c55e" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Outflow" fill="#374151" radius={[3, 3, 0, 0]} />
                        <Line type="monotone" dataKey="Net" stroke="#34d399" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card title="5. Financial Metrics">
                  <dl className="grid gap-2 text-[12px]">
                    {[
                      ["Payback Period", `${m.payback.toFixed(1)} yrs`, false],
                      ["ROI (5 yrs)", `${Math.round(m.roi5 * 100)}%`, true],
                      ["NPV (10%)", fmtCompact(m.npv, i.currency), true],
                      ["IRR", `${Math.round(m.irr * 100)}%`, true],
                      ["Break-even", `${m.breakEvenMonths} mo`, false],
                      ["Margin of Safety", `${Math.round(m.marginOfSafety * 100)}%`, false],
                    ].map(([k, v, accent]) => (
                      <div
                        key={String(k)}
                        className="flex items-center justify-between border-b border-white/5 py-1.5"
                      >
                        <dt className="text-white/60">{k}</dt>
                        <dd
                          className={`tabular-nums ${
                            accent ? "text-emerald-400 font-semibold" : "text-white"
                          }`}
                        >
                          {v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              </div>

              {/* Bottom row: requirements, sensitivity, downloads, CTA */}
              <div className="grid gap-5 lg:grid-cols-4">
                <Card title="Factory Size & Requirements" icon={Building2}>
                  <ul className="grid gap-2 text-[12px]">
                    {[
                      { icon: MapPin, k: "Land Area", v: `${m.landArea.toLocaleString()} m²` },
                      { icon: Building2, k: "Building Area", v: `${m.buildingArea.toLocaleString()} m²` },
                      { icon: Zap, k: "Power", v: `${m.powerKw.toLocaleString()} kW` },
                      { icon: Droplets, k: "Water", v: `${m.waterM3} m³/day` },
                      { icon: Wind, k: "Compressed Air", v: `${m.compressedAir} Nm³/h` },
                      { icon: Gauge, k: "Steam", v: m.steam ? `${m.steam} kg/h` : "—" },
                      { icon: Users, k: "Operators", v: `${m.operators} persons` },
                    ].map((r) => (
                      <li
                        key={r.k}
                        className="flex items-center justify-between border-b border-white/5 pb-1.5"
                      >
                        <span className="flex items-center gap-2 text-white/60">
                          <r.icon className="h-3.5 w-3.5 text-emerald-400/80" />
                          {r.k}
                        </span>
                        <span className="tabular-nums text-white">{r.v}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card title="Sensitivity Analysis" icon={TrendingUp} className="lg:col-span-2">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={m.sensitivity}>
                        <defs>
                          <linearGradient id="roiFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="label" tick={{ fill: "#ffffff70", fontSize: 11 }} />
                        <YAxis
                          tick={{ fill: "#ffffff70", fontSize: 11 }}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#0a0f10",
                            border: "1px solid #ffffff20",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          formatter={(v: number) => `${v}%`}
                        />
                        <Area
                          type="monotone"
                          dataKey="ROI"
                          stroke="#22c55e"
                          strokeWidth={2}
                          fill="url(#roiFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-[11px] text-white/50">
                    Impact of ±20% selling price variation on 5-year ROI.
                  </p>
                </Card>

                <Card title="Download Report" icon={FileText}>
                  <ul className="grid gap-2 text-[12px]">
                    {([
                      ["investment", "Investment Report (PDF)"],
                      ["roi", "ROI Report (PDF)"],
                      ["cashflow", "Cash Flow Report (PDF)"],
                      ["specification", "Factory Specification (PDF)"],
                      ["summary", "Project Summary (PDF)"],
                    ] as const).map(([kind, label]) => (
                      <li key={kind}>
                        <button
                          type="button"
                          onClick={() => downloadInvestmentReport(kind, i, m)}
                          className="flex w-full items-center justify-between rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-white/70 transition hover:border-emerald-400/40 hover:text-white"
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-emerald-400/80" />
                            {label}
                          </span>
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* CTA row */}
              <div className="grid gap-3 md:grid-cols-3">
                <Link
                  to="/project-inquiry"
                  className="group flex items-center justify-between rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-5 py-4 transition hover:bg-emerald-500/25"
                >
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-emerald-300/80">
                      Primary
                    </div>
                    <div className="font-semibold text-white">
                      Request Detailed Quotation
                    </div>
                    <div className="text-[11px] text-white/60">
                      Get a customized offer for your project
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-emerald-300 transition group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/solutions/engineering-consultancy"
                  className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-5 py-4 transition hover:border-white/25"
                >
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">
                      Secondary
                    </div>
                    <div className="font-semibold text-white">Talk to an Engineer</div>
                    <div className="text-[11px] text-white/60">
                      Discuss your project with our experts
                    </div>
                  </div>
                  <PhoneCall className="h-4 w-4 text-white/60" />
                </Link>
                <Link
                  to="/ai-assistant"
                  className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-5 py-4 transition hover:border-white/25"
                >
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">
                      Third
                    </div>
                    <div className="font-semibold text-white">
                      AI Engineering Assistant
                    </div>
                    <div className="text-[11px] text-white/60">
                      Book an online consultation instantly
                    </div>
                  </div>
                  <MessageSquare className="h-4 w-4 text-white/60" />
                </Link>
              </div>

              {/* Footer bar of trust cues */}
              <ul className="grid grid-cols-2 gap-3 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.14em] text-white/50 md:grid-cols-4 lg:grid-cols-7">
                {[
                  ["Accurate Calculations", "Data-driven & reliable"],
                  ["Real-time Results", "Instant & up-to-date"],
                  ["Engineered Solutions", "Optimized for performance"],
                  ["NEVO Industrial", "Dubai-based, global reach"],
                  ["Maximize Profitability", "Higher ROI · lower risk"],
                  ["Global Standards", "Compliant & certified"],
                  ["Long-term Success", "Sustainable growth"],
                ].map(([k, v]) => (
                  <li key={k} className="flex flex-col gap-0.5">
                    <span className="text-white/70 normal-case tracking-normal text-[12px] font-medium">
                      {k}
                    </span>
                    <span className="normal-case tracking-normal">{v}</span>
                  </li>
                ))}
              </ul>

              {/* Step nav */}
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <Button
                  variant="ghost"
                  className="text-white/70 hover:text-white"
                  onClick={() => setStep(Math.max(0, step - 1))}
                  disabled={step === 0}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <div className="text-[12px] text-white/50">
                  Step {step + 1} of {steps.length} — {steps[step].label}
                </div>
                <Button
                  className="bg-emerald-500 text-black hover:bg-emerald-400"
                  onClick={() =>
                    setStep(Math.min(steps.length - 1, step + 1))
                  }
                  disabled={step === steps.length - 1}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Internal links block for SEO */}
        <section className="border-t border-white/10 bg-[#0a0f10]">
          <div className="mx-auto max-w-[1440px] px-5 py-10">
            <h2 className="mb-4 font-display text-xl font-semibold text-white">
              Explore related engineering resources
            </h2>
            <div className="grid gap-3 md:grid-cols-4">
              {[
                { to: "/solutions/factory-development", label: "Factory Development" },
                { to: "/solutions/production-lines", label: "Production Lines" },
                { to: "/solutions/raw-materials", label: "Raw Materials" },
                { to: "/product-configurator", label: "Panel Configurator" },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/80 transition hover:border-emerald-400/40 hover:text-white"
                >
                  {l.label}
                  <ArrowRight className="h-4 w-4 text-emerald-400/70" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
