import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Boxes,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Download,
  Factory,
  FileText,
  Flame,
  Layers,
  MessageSquare,
  PhoneCall,
  Ruler,
  Snowflake,
  ThermometerSun,
  Volume2,
  Weight,
  Wind,
  Zap,
  RotateCw,
  ZoomIn,
  Scan,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { buildSeo, orgJsonLd, breadcrumbJsonLd } from "@/lib/seo";

import crossSection from "@/assets/thickness/cross-section.png.asset.json";
import th40 from "@/assets/thickness/th-40.png.asset.json";
import th50 from "@/assets/thickness/th-50.png.asset.json";
import th60 from "@/assets/thickness/th-60.png.asset.json";
import th80 from "@/assets/thickness/th-80.png.asset.json";
import th100 from "@/assets/thickness/th-100.png.asset.json";
import th120 from "@/assets/thickness/th-120.png.asset.json";
import th150 from "@/assets/thickness/th-150.png.asset.json";
import th200 from "@/assets/thickness/th-200.png.asset.json";
import corePIR from "@/assets/thickness/core-pir.png.asset.json";
import coreRW from "@/assets/thickness/core-rockwool.png.asset.json";
import coreEPS from "@/assets/thickness/core-eps.png.asset.json";
import corePUR from "@/assets/thickness/core-pur.png.asset.json";
import appCold from "@/assets/thickness/app-cold.png.asset.json";
import appFood from "@/assets/thickness/app-food.png.asset.json";
import appWH from "@/assets/thickness/app-warehouse.png.asset.json";
import appClean from "@/assets/thickness/app-cleanroom.png.asset.json";
import appIndustrial from "@/assets/thickness/app-industrial.png.asset.json";
import appCommercial from "@/assets/thickness/app-commercial.png.asset.json";
import matPIR from "@/assets/thickness/mat-pir.png.asset.json";
import matRW from "@/assets/thickness/mat-rockwool.png.asset.json";
import matPPGI from "@/assets/thickness/mat-ppgi.png.asset.json";
import matSteel from "@/assets/thickness/mat-steel.png.asset.json";
import thermalCam from "@/assets/thickness/thermal-cam.png.asset.json";

// ---------------- SEO ----------------
export const Route = createFileRoute("/$lang/panel-thickness-calculator")({
  component: PanelThicknessPage,
  head: ({ params }) => {
    const seo = buildSeo({
      lang: params.lang,
      title: "Panel Thickness Calculator — Sandwich Panel Sizing Tool | NEVO",
      description:
        "Choose the correct sandwich panel thickness. Live U-value, fire rating, weight, heat loss and cost. Engineered by NEVO Industrial for cold storage, food, clean rooms and industrial buildings.",
      path: "/panel-thickness-calculator",
    });
    return {
      meta: seo.meta,
      links: seo.links,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(orgJsonLd()) },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Solutions", path: "/solutions/sandwich-panels" },
              { name: "Panel Thickness Calculator", path: "/panel-thickness-calculator" },
            ]),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "NEVO Panel Thickness Calculator",
            applicationCategory: "EngineeringApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            description:
              "Engineering decision-support tool that recommends sandwich panel thickness by application, core, climate, fire rating and design temperature.",
          }),
        },
      ],
    };
  },
});

// ---------------- Domain ----------------
type Application =
  | "Cold Storage" | "Food Factory" | "Warehouse" | "Industrial Building"
  | "Clean Room" | "Commercial Building" | "Freezer" | "Office";
type Core = "PIR" | "PUR" | "Rock Wool" | "EPS";
type Climate = "Very Cold" | "Cold" | "Moderate" | "Hot" | "Very Hot";
type Fire = "30 min" | "60 min" | "90 min" | "120 min" | "180 min";
type Temp = "+20°C" | "+5°C" | "0°C" | "-18°C" | "-40°C";
type Thickness = 40 | 50 | 60 | 80 | 100 | 120 | 150 | 200;

const THICKNESSES: Thickness[] = [40, 50, 60, 80, 100, 120, 150, 200];

const THICK_IMG: Record<Thickness, { url: string }> = {
  40: th40, 50: th50, 60: th60, 80: th80,
  100: th100, 120: th120, 150: th150, 200: th200,
};

// Lambda (thermal conductivity W/m·K)
const LAMBDA: Record<Core, number> = {
  PIR: 0.022,
  PUR: 0.024,
  "Rock Wool": 0.041,
  EPS: 0.036,
};
// kg/m³ (typical density)
const DENSITY: Record<Core, number> = {
  PIR: 40, PUR: 40, "Rock Wool": 110, EPS: 20,
};

const FIRE_BY_CORE: Record<Core, Fire[]> = {
  PIR: ["30 min", "60 min", "90 min"],
  PUR: ["30 min", "60 min"],
  "Rock Wool": ["60 min", "90 min", "120 min", "180 min"],
  EPS: ["30 min"],
};

// steel skin thickness by application
const STEEL_BY_APP: Record<Application, string> = {
  "Cold Storage": "0.50 / 0.50 mm",
  Freezer: "0.60 / 0.50 mm",
  "Food Factory": "0.50 / 0.50 mm",
  "Clean Room": "0.60 / 0.50 mm",
  Warehouse: "0.50 / 0.40 mm",
  "Industrial Building": "0.50 / 0.40 mm",
  "Commercial Building": "0.50 / 0.50 mm",
  Office: "0.50 / 0.40 mm",
};

// Target U-value (W/m²·K) by application + temperature
function targetUValue(app: Application, temp: Temp): number {
  const base: Record<Application, number> = {
    "Cold Storage": 0.22,
    Freezer: 0.16,
    "Food Factory": 0.30,
    "Clean Room": 0.25,
    Warehouse: 0.45,
    "Industrial Building": 0.45,
    "Commercial Building": 0.35,
    Office: 0.35,
  };
  const tShift: Record<Temp, number> = {
    "+20°C": 0.08, "+5°C": 0.02, "0°C": 0, "-18°C": -0.06, "-40°C": -0.10,
  };
  return Math.max(0.09, base[app] + tShift[temp]);
}

function climateShift(c: Climate): number {
  return { "Very Cold": -0.05, Cold: -0.02, Moderate: 0, Hot: 0.03, "Very Hot": 0.05 }[c];
}

function uValue(core: Core, thickness: Thickness): number {
  // simplified: U = lambda / thickness(m). Ignore surface resistances for consistency.
  return +(LAMBDA[core] / (thickness / 1000)).toFixed(2);
}

function weight(core: Core, thickness: Thickness): number {
  // core weight + ~7.85 kg/m² for two steel skins
  const skin = 7.85 * (0.5 + 0.5) / 1; // ~7.85 * 1 = ~7.85 kg/m² for 0.5+0.5
  const coreKg = DENSITY[core] * (thickness / 1000);
  return +(coreKg + skin).toFixed(1);
}

function heatLoss(core: Core, thickness: Thickness): number {
  // kWh/m²·yr indicative (using U * degree-hours factor)
  return +(uValue(core, thickness) * 300).toFixed(0);
}

function fireRatingFor(core: Core, thickness: Thickness): Fire {
  // approximate mapping
  if (core === "Rock Wool") {
    if (thickness >= 150) return "180 min";
    if (thickness >= 120) return "120 min";
    if (thickness >= 100) return "90 min";
    if (thickness >= 80) return "60 min";
    return "60 min";
  }
  if (core === "PIR") {
    if (thickness >= 100) return "90 min";
    if (thickness >= 80) return "60 min";
    return "30 min";
  }
  if (core === "PUR") {
    if (thickness >= 100) return "60 min";
    return "30 min";
  }
  return "30 min";
}

function costLevel(core: Core, thickness: Thickness): string {
  const base = { EPS: 1, PUR: 2, PIR: 2, "Rock Wool": 3 }[core];
  const t = thickness <= 60 ? 0 : thickness <= 100 ? 1 : thickness <= 150 ? 2 : 3;
  return "$".repeat(Math.min(5, base + t));
}

function thermalPerformance(u: number): string {
  if (u <= 0.15) return "Excellent";
  if (u <= 0.22) return "Very Good";
  if (u <= 0.32) return "Good";
  if (u <= 0.45) return "Standard";
  return "Basic";
}

function soundInsulation(core: Core, thickness: Thickness): string {
  if (core === "Rock Wool") return thickness >= 100 ? "Excellent" : "Very Good";
  if (thickness >= 120) return "Very Good";
  if (thickness >= 80) return "Good";
  return "Standard";
}

function recommendThickness(
  app: Application, core: Core, climate: Climate, fire: Fire, temp: Temp,
): Thickness {
  const target = targetUValue(app, temp) + climateShift(climate);
  // pick the smallest thickness that meets both U-target and fire requirement
  const fireMinutes = parseInt(fire);
  for (const t of THICKNESSES) {
    const u = uValue(core, t);
    const fm = parseInt(fireRatingFor(core, t));
    if (u <= target && fm >= fireMinutes) return t;
  }
  return 200;
}

// ---------------- UI atoms ----------------
function Chip({
  active, onClick, children, icon: Icon,
}: {
  active?: boolean; onClick: () => void; children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full min-w-0 items-center justify-center gap-2 rounded-md border px-3 py-2 text-center text-xs font-medium leading-tight transition [overflow-wrap:anywhere] ${
        active
          ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/25 hover:text-white"
      }`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
      <span className="min-w-0">{children}</span>
    </button>
  );
}

function StepHeader({ n, title, icon: Icon }: { n: number; title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-400/15 text-[11px] font-semibold text-emerald-300">{n}</span>
      <Icon className="h-4 w-4 text-emerald-300/80" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">{title}</span>
    </div>
  );
}

function Card({ title, icon: Icon, children, className = "" }: {
  title?: string; icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.02] p-5 ${className}`}>
      {title ? (
        <div className="mb-3 flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-emerald-300/80" /> : null}
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/80">{title}</h3>
        </div>
      ) : null}
      {children}
    </div>
  );
}

// ---------------- Page ----------------
function PanelThicknessPage() {
  const [app, setApp] = useState<Application>("Cold Storage");
  const [core, setCore] = useState<Core>("PIR");
  const [climate, setClimate] = useState<Climate>("Very Cold");
  const [fire, setFire] = useState<Fire>("90 min");
  const [temp, setTemp] = useState<Temp>("-18°C");
  const [view, setView] = useState<"cross" | "exploded" | "3d" | "thermal">("cross");
  const [compare, setCompare] = useState<Thickness[]>([60, 100, 150]);

  const recommended = useMemo(
    () => recommendThickness(app, core, climate, fire, temp),
    [app, core, climate, fire, temp],
  );

  const u = uValue(core, recommended);
  const w = weight(core, recommended);
  const fr = fireRatingFor(core, recommended);
  const perf = thermalPerformance(u);
  const sound = soundInsulation(core, recommended);
  const steel = STEEL_BY_APP[app];

  const toggleCompare = (t: Thickness) => {
    setCompare((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length >= 4 ? [...prev.slice(1), t] : [...prev, t],
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <SiteHeader />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-[1440px] px-4 pt-24 text-[12px] text-white/50 md:px-8">
        <ol className="flex items-center gap-1">
          <li><Link to="/" className="hover:text-white">Home</Link></li>
          <li><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link to="/solutions/sandwich-panels" className="hover:text-white">Sandwich Panels</Link></li>
          <li><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="text-white/80">Panel Thickness Calculator</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-[1440px] px-4 pt-8 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Engineering Decision Tool
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              Panel Thickness <span className="text-emerald-400">Calculator</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/60 md:text-base">
              Choose the right sandwich panel thickness. Optimize performance. Reduce costs. Backed by
              engineering data on U-value, fire rating, weight and lifecycle heat loss.
            </p>
          </div>
          <div className="text-right text-[11px] uppercase tracking-[0.18em] text-emerald-300/80">
            Engineered for Performance<br />Built for Excellence
          </div>
        </motion.div>
      </section>

      {/* Steps + Result grid */}
      <section className="mx-auto max-w-[1440px] px-4 py-10 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* LEFT — steps */}
          <div className="space-y-4">
            <Card>
              <StepHeader n={1} title="Application" icon={Building2} />
              <div className="grid grid-cols-2 gap-2">
                {(["Cold Storage","Food Factory","Warehouse","Industrial Building","Clean Room","Commercial Building","Freezer","Office"] as Application[]).map((a) => (
                  <Chip key={a} active={app === a} onClick={() => setApp(a)}>{a}</Chip>
                ))}
              </div>
            </Card>

            <Card>
              <StepHeader n={2} title="Core Material" icon={Layers} />
              <div className="grid grid-cols-2 gap-2">
                {(["PIR","PUR","Rock Wool","EPS"] as Core[]).map((c) => (
                  <Chip key={c} active={core === c} onClick={() => {
                    setCore(c);
                    if (!FIRE_BY_CORE[c].includes(fire)) setFire(FIRE_BY_CORE[c][0]);
                  }}>{c}</Chip>
                ))}
              </div>
            </Card>

            <Card>
              <StepHeader n={3} title="Climate Zone" icon={Wind} />
              <div className="grid grid-cols-3 gap-2">
                {(["Very Cold","Cold","Moderate","Hot","Very Hot"] as Climate[]).map((c) => (
                  <Chip key={c} active={climate === c} onClick={() => setClimate(c)}>{c}</Chip>
                ))}
              </div>
            </Card>

            <Card>
              <StepHeader n={4} title="Fire Rating" icon={Flame} />
              <div className="grid grid-cols-3 gap-2">
                {(["30 min","60 min","90 min","120 min","180 min"] as Fire[]).map((f) => {
                  const disabled = !FIRE_BY_CORE[core].includes(f);
                  return (
                    <button
                      key={f}
                      disabled={disabled}
                      onClick={() => setFire(f)}
                      className={`rounded-md border px-3 py-2 text-xs font-medium transition ${
                        fire === f
                          ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
                          : disabled
                          ? "cursor-not-allowed border-white/5 bg-white/[0.01] text-white/25"
                          : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-white/40">Availability depends on selected core.</p>
            </Card>

            <Card>
              <StepHeader n={5} title="Design Temperature" icon={ThermometerSun} />
              <div className="grid grid-cols-5 gap-2">
                {(["+20°C","+5°C","0°C","-18°C","-40°C"] as Temp[]).map((t) => (
                  <Chip key={t} active={temp === t} onClick={() => setTemp(t)}>{t}</Chip>
                ))}
              </div>
            </Card>
          </div>

          {/* RIGHT — recommended + preview */}
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              {/* Recommended */}
              <Card>
                <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/80">Recommended Thickness</div>
                <div className="mt-1 text-6xl font-semibold tracking-tight text-emerald-400">
                  {recommended}<span className="text-2xl text-white/60"> mm</span>
                </div>
                <ul className="mt-4 space-y-2 text-[13px]">
                  {[
                    [Zap, "U-Value", `${u} W/m²·K`],
                    [Flame, "Fire Rating", fr],
                    [Sparkles, "Thermal Performance", perf],
                    [Weight, "Weight", `${w} kg/m²`],
                    [Volume2, "Sound Insulation", sound],
                    [Ruler, "Steel Skin", steel],
                  ].map(([Icon, k, v]) => (
                    <li key={k as string} className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="flex items-center gap-2 text-white/60">
                        {(() => { const I = Icon as React.ComponentType<{ className?: string }>; return <I className="h-3.5 w-3.5 text-emerald-300/80" />; })()}
                        {k as string}
                      </span>
                      <span className="font-medium text-white">{v as string}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/project-inquiry"
                  className="mt-4 flex items-center justify-between rounded-md border border-emerald-400/40 bg-emerald-500/15 px-3 py-2.5 text-[12px] font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
                >
                  Request Engineering Consultation
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Card>

              {/* Preview */}
              <Card>
                <div className="mb-3 flex items-center gap-2 overflow-x-auto">
                  {([
                    ["cross", "Cross Section"],
                    ["exploded", "Exploded View"],
                    ["3d", "3D View"],
                    ["thermal", "Thermal Viewer"],
                  ] as const).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setView(id)}
                      className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition ${
                        view === id
                          ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
                          : "border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black">
                  <img loading="lazy" decoding="async"
                    src={crossSection.url}
                    alt={`Sandwich panel ${recommended}mm ${core} cross section`}
                    className={`w-full object-cover transition duration-500 ${
                      view === "exploded" ? "scale-110 opacity-90" :
                      view === "3d" ? "rotate-[-2deg] scale-105" :
                      view === "thermal" ? "opacity-80 [filter:hue-rotate(300deg)_saturate(1.4)_contrast(1.1)]" :
                      "scale-100"
                    }`}
                    style={{ aspectRatio: "16 / 9" }}
                  />
                  {/* thickness callout */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 rounded border border-emerald-400/50 bg-black/60 px-2 py-1 text-[10px] font-mono text-emerald-300 backdrop-blur">
                    {recommended} mm
                  </div>
                  {/* controls */}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 border-t border-white/10 bg-black/60 px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-white/60 backdrop-blur">
                    <span className="flex items-center gap-1"><RotateCw className="h-3 w-3 text-emerald-300/80" /> Rotate</span>
                    <span className="flex items-center gap-1"><ZoomIn className="h-3 w-3 text-emerald-300/80" /> Zoom</span>
                    <span className="flex items-center gap-1"><Boxes className="h-3 w-3 text-emerald-300/80" /> Explode</span>
                    <span className="flex items-center gap-1"><Scan className="h-3 w-3 text-emerald-300/80" /> Measure</span>
                  </div>
                </div>

                {/* Live metrics vs. target */}
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/50">Target U</div>
                    <div className="text-sm font-semibold text-white">{(targetUValue(app, temp) + climateShift(climate)).toFixed(2)}</div>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/50">Achieved U</div>
                    <div className="text-sm font-semibold text-emerald-300">{u}</div>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
                    <div className="text-[10px] uppercase tracking-widest text-white/50">Heat Loss</div>
                    <div className="text-sm font-semibold text-white">{heatLoss(core, recommended)} kWh/m²·yr</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Thickness Options row */}
            <Card title="Panel Thickness Options" icon={Ruler}>
              <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
                {THICKNESSES.map((t) => {
                  const active = t === recommended;
                  return (
                    <button
                      key={t}
                      onClick={() => toggleCompare(t)}
                      className={`group overflow-hidden rounded-lg border text-left transition ${
                        active ? "border-emerald-400/70 ring-1 ring-emerald-400/40"
                               : compare.includes(t) ? "border-emerald-400/40"
                               : "border-white/10 hover:border-white/25"
                      } bg-black/40`}
                    >
                      <div className="border-b border-white/10 px-2 py-1 text-center text-[11px] font-semibold text-emerald-300">
                        {t} mm
                      </div>
                      <img loading="lazy" decoding="async" src={THICK_IMG[t].url} alt={`${t} mm panel`} className="h-16 w-full object-cover" />
                      <div className="px-2 py-1 text-[10px] text-white/50 group-hover:text-white/70">
                        Tap to compare
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-white/40">
                * Thickness availability depends on core type and project requirements.
              </p>
            </Card>

            {/* Compare table */}
            <Card title="Compare Thicknesses" icon={Boxes}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-white/50">
                      <th className="py-2 pr-3">Metric</th>
                      {compare.map((t) => (
                        <th key={t} className={`px-3 py-2 text-center ${t === recommended ? "text-emerald-300" : "text-white/70"}`}>
                          {t} mm{t === recommended ? " ★" : ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-white/80">
                    {[
                      { label: "U-Value (W/m²·K)", get: (t: Thickness) => uValue(core, t).toString() },
                      { label: "Heat Loss (kWh/m²·yr)", get: (t: Thickness) => heatLoss(core, t).toString() },
                      { label: "Weight (kg/m²)", get: (t: Thickness) => weight(core, t).toString() },
                      { label: "Fire Rating", get: (t: Thickness) => fireRatingFor(core, t) },
                      { label: "Cost Level", get: (t: Thickness) => costLevel(core, t) },
                      { label: "Recommended Use", get: (t: Thickness) => "★".repeat(Math.min(5, 1 + Math.floor(t / 40))) },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-white/5">
                        <td className="py-2 pr-3 text-white/60">{row.label}</td>
                        {compare.map((t) => (
                          <td key={t} className={`px-3 py-2 text-center ${t === recommended ? "font-semibold text-emerald-300" : ""}`}>
                            {row.get(t)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11px] text-white/40">Tap thickness tiles above to add/remove from comparison (max 4).</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Materials */}
      <section className="mx-auto max-w-[1440px] px-4 pb-10 md:px-8">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">Core Materials</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { c: "PIR" as Core, img: corePIR.url, bullets: ["Best Thermal Performance", "High Fire Resistance", "Rigid & Durable", "Ideal for Cold Rooms"] },
            { c: "Rock Wool" as Core, img: coreRW.url, bullets: ["Excellent Fire Resistance", "High Sound Insulation", "Non-Combustible", "Ideal for Industrial Buildings"] },
            { c: "EPS" as Core, img: coreEPS.url, bullets: ["Cost Effective", "Lightweight", "Good Insulation", "General Purpose Use"] },
            { c: "PUR" as Core, img: corePUR.url, bullets: ["High Insulation", "Good Fire Performance", "Moisture Resistant", "Versatile Applications"] },
          ].map((m) => (
            <button
              key={m.c}
              onClick={() => setCore(m.c)}
              className={`overflow-hidden rounded-lg border bg-white/[0.02] p-3 text-left transition ${
                core === m.c ? "border-emerald-400/60" : "border-white/10 hover:border-white/25"
              }`}
            >
              <div className="mb-2 text-[13px] font-semibold text-white">{m.c}</div>
              <img loading="lazy" decoding="async" src={m.img} alt={`${m.c} core`} className="h-24 w-full rounded object-cover" />
              <ul className="mt-2 space-y-0.5 text-[11px] text-white/60">
                {m.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400/70" /> {b}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </section>

      {/* Applications */}
      <section className="mx-auto max-w-[1440px] px-4 pb-10 md:px-8">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">Application Examples</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Cold Storage", img: appCold.url, target: "Cold Storage" as Application },
            { label: "Food Factory", img: appFood.url, target: "Food Factory" as Application },
            { label: "Warehouse", img: appWH.url, target: "Warehouse" as Application },
            { label: "Clean Room", img: appClean.url, target: "Clean Room" as Application },
            { label: "Industrial Building", img: appIndustrial.url, target: "Industrial Building" as Application },
            { label: "Commercial Building", img: appCommercial.url, target: "Commercial Building" as Application },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => setApp(a.target)}
              className={`group relative overflow-hidden rounded-lg border transition ${
                app === a.target ? "border-emerald-400/60" : "border-white/10 hover:border-white/25"
              }`}
            >
              <img loading="lazy" decoding="async" src={a.img} alt={a.label} className="h-24 w-full object-cover transition group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white">
                {a.label}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Material details + Thermal inspection + Quality */}
      <section className="mx-auto max-w-[1440px] px-4 pb-14 md:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="Material Details" icon={Layers}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: "PIR Foam", i: matPIR.url },
                { l: "Rock Wool", i: matRW.url },
                { l: "PPGI Coil", i: matPPGI.url },
                { l: "Steel Surface", i: matSteel.url },
              ].map((m) => (
                <div key={m.l} className="overflow-hidden rounded-md border border-white/10 bg-black/30">
                  <img loading="lazy" decoding="async" src={m.i} alt={m.l} className="h-20 w-full object-cover" />
                  <div className="px-2 py-1 text-[11px] text-white/70">{m.l}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Thermal Inspection" icon={ThermometerSun}>
            <img loading="lazy" decoding="async" src={thermalCam.url} alt="Thermal inspection camera" className="mb-3 h-32 w-full rounded object-contain" />
            <ul className="space-y-1.5 text-[12px] text-white/70">
              {["Identify Heat Loss", "Improve Efficiency", "Ensure Quality", "Save Energy"].map((b) => (
                <li key={b} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/80" /> {b}</li>
              ))}
            </ul>
          </Card>

          <Card title="Engineering & Quality" icon={Factory}>
            <ul className="space-y-2 text-[12px] text-white/70">
              {[
                "High Quality Raw Materials",
                "Advanced Production Lines",
                "ISO 9001:2015 Certified",
                "Strict Quality Control",
              ].map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {b}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Downloads + CTAs */}
      <section className="mx-auto max-w-[1440px] px-4 pb-16 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card title="Downloads" icon={Download}>
            <ul className="grid gap-2 text-[12px] md:grid-cols-2">
              {[
                "Technical Datasheet (PDF)",
                "Panel Specification (PDF)",
                "Installation Guide (PDF)",
                "Engineering Guide (PDF)",
              ].map((r) => (
                <li key={r}>
                  <Link
                    to="/project-inquiry"
                    className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-white/70 transition hover:border-emerald-400/40 hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-emerald-400/80" />
                      {r}
                    </span>
                    <Download className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-3">
            <Link
              to="/project-inquiry"
              className="group flex items-center justify-between rounded-lg border border-emerald-400/50 bg-emerald-500/15 px-5 py-4 transition hover:bg-emerald-500/25"
            >
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-emerald-300/80">Primary</div>
                <div className="font-semibold text-white">Request Quotation</div>
                <div className="text-[11px] text-white/60">Get a customized offer for your project</div>
              </div>
              <ArrowRight className="h-4 w-4 text-emerald-300 transition group-hover:translate-x-1" />
            </Link>
            <Link
              to="/ai-assistant"
              className="group flex items-center justify-between rounded-lg border border-white/15 bg-white/[0.03] px-5 py-4 transition hover:border-white/30"
            >
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Engineer</div>
                <div className="font-semibold text-white">Talk to an Engineer</div>
                <div className="text-[11px] text-white/60">Discuss your project with our experts</div>
              </div>
              <MessageSquare className="h-4 w-4 text-white/60" />
            </Link>
            <Link
              to="/project-inquiry"
              className="group flex items-center justify-between rounded-lg border border-white/15 bg-white/[0.03] px-5 py-4 transition hover:border-white/30"
            >
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Consultation</div>
                <div className="font-semibold text-white">Book Online Consultation</div>
                <div className="text-[11px] text-white/60">Schedule a meeting at your convenience</div>
              </div>
              <PhoneCall className="h-4 w-4 text-white/60" />
            </Link>
          </div>
        </div>

        {/* Internal links */}
        <div className="mt-10 grid gap-3 border-t border-white/10 pt-6 text-[12px] text-white/60 md:grid-cols-4">
          <Link to="/solutions/sandwich-panels" className="hover:text-white">Sandwich Panels →</Link>
          <Link to="/product-configurator" className="hover:text-white">3D Panel Configurator →</Link>
          <Link to="/investment-calculator" className="hover:text-white">Investment Calculator →</Link>
          <Link to="/industries" className="hover:text-white">All Industries →</Link>
        </div>

        <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.16em] text-white/50 md:grid-cols-4">
          <div className="flex items-center gap-2"><Snowflake className="h-3.5 w-3.5 text-emerald-400/70" /> Right Thickness · Better Performance</div>
          <div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-emerald-400/70" /> Energy Saving · Lower Costs</div>
          <div className="flex items-center gap-2"><Calculator className="h-3.5 w-3.5 text-emerald-400/70" /> Engineered Solutions · Global Support</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/70" /> Built to Perform · Built to Last</div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
