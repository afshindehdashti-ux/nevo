import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Boxes,
  Building2,
  ChevronRight,
  Download,
  Factory,
  FileText,
  Layers,
  MessageSquare,
  PhoneCall,
  Ruler,
  Scan,
  Sparkles,
  Zap,
  Droplets,
  Wind,
  Gauge,
  Users,
  Truck,
  Forklift,
  RotateCw,
  ZoomIn,
  Maximize2,
  Eye,
  CheckCircle2,
  Cog,
  FlaskConical,
  ShieldCheck,
  Wrench,
  Warehouse,
  ClipboardList,
  Play,
  CalendarClock,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { buildSeo, orgJsonLd, breadcrumbJsonLd } from "@/lib/seo";

import master3d from "@/assets/factory-layout/master-3d.png";
import topView from "@/assets/factory-layout/top-view.png";
import flowDiagram from "@/assets/factory-layout/flow-diagram.png";
import materialFlow from "@/assets/factory-layout/material-flow.png";
import rendering from "@/assets/factory-layout/rendering.png";
import expansionImg from "@/assets/factory-layout/expansion.png";
import lineLaminator from "@/assets/factory-layout/line-laminator.png";
import lineMixing from "@/assets/factory-layout/line-mixing.png";
import lineCutting from "@/assets/factory-layout/line-cutting.png";
import linePacking from "@/assets/factory-layout/line-packing.png";
import whCoil from "@/assets/factory-layout/wh-coil.png";
import whFinished from "@/assets/factory-layout/wh-finished.png";
import whTruck from "@/assets/factory-layout/wh-truck.png";
import whForklift from "@/assets/factory-layout/wh-forklift.png";

// ---------------- Domain ----------------
type Capacity = 3000 | 5000 | 8000 | 12000 | 20000;
type Core = "PIR" | "PUR" | "Rock Wool" | "EPS" | "Hybrid";
type Automation = "Semi Automatic" | "Automatic" | "Fully Automatic";
type Building = "Single Hall" | "Dual Hall" | "Expansion Ready";
type ViewMode = "top" | "3d" | "material" | "truck" | "operator" | "finished";

const CAPACITIES: Capacity[] = [3000, 5000, 8000, 12000, 20000];
const CORES: Core[] = ["PIR", "PUR", "Rock Wool", "EPS", "Hybrid"];
const AUTOMATIONS: Automation[] = ["Semi Automatic", "Automatic", "Fully Automatic"];
const BUILDINGS: Building[] = ["Single Hall", "Dual Hall", "Expansion Ready"];

// scale factors relative to 10,000 m²/day baseline factory data from board
function computeFactory(cap: Capacity, core: Core, auto: Automation, bld: Building) {
  const scale = cap / 10000;
  const coreFactor = core === "Rock Wool" ? 1.25 : core === "Hybrid" ? 1.15 : 1;
  const bldFactor = bld === "Dual Hall" ? 1.35 : bld === "Expansion Ready" ? 1.5 : 1;
  const autoOps = auto === "Fully Automatic" ? 0.75 : auto === "Automatic" ? 0.9 : 1.2;

  const land = Math.round(25000 * scale * bldFactor);
  const building = Math.round(11500 * scale * coreFactor);
  const production = Math.round(8200 * scale * coreFactor);
  const power = Math.round(2800 * scale * (core === "Rock Wool" ? 1.15 : 1));
  const water = Math.round(18 * scale);
  const air = Math.round(12 * scale);
  const steam = Math.round(1500 * scale * (core === "Rock Wool" ? 1.2 : 1));
  const operators = Math.round(50 * scale * autoOps);
  const forklifts = Math.max(2, Math.round(3.5 * scale));
  const trucks = Math.max(2, Math.round(2 * scale));

  return { land, building, production, power, water, air, steam, operators, forklifts, trucks };
}

const AREAS = [
  { key: "Production Line", icon: Cog },
  { key: "Raw Material Warehouse", icon: Boxes },
  { key: "Chemical Room", icon: FlaskConical },
  { key: "Coil Warehouse", icon: Layers },
  { key: "Finished Goods Warehouse", icon: Warehouse },
  { key: "Laboratory", icon: FlaskConical },
  { key: "Quality Control", icon: ShieldCheck },
  { key: "Utilities", icon: Zap },
  { key: "Maintenance", icon: Wrench },
  { key: "Loading Area", icon: Truck },
  { key: "Administration", icon: Building2 },
];

const VIEW_MODES: { id: ViewMode; label: string; img: string; icon: any }[] = [
  { id: "3d", label: "3D View", img: master3d, icon: Boxes },
  { id: "top", label: "Top View", img: topView, icon: Scan },
  { id: "material", label: "Material Flow", img: materialFlow, icon: ArrowRight },
  { id: "truck", label: "Truck Flow", img: materialFlow, icon: Truck },
  { id: "operator", label: "Operator Flow", img: topView, icon: Users },
  { id: "finished", label: "Finished Product", img: materialFlow, icon: Warehouse },
];

// ---------------- SEO ----------------
export const Route = createFileRoute("/$lang/factory-layout-generator")({
  component: FactoryLayoutPage,
  head: () => {
    const seo = buildSeo({
      title: "Factory Layout Generator — Sandwich Panel Factory Design | NEVO",
      description:
        "Visualize your future sandwich panel factory. Choose capacity, core, automation and building type — get instant land, building, utility and manpower requirements.",
      path: "/factory-layout-generator",
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
              { name: "Solutions", path: "/solutions/factory-development" },
              { name: "Factory Layout Generator", path: "/factory-layout-generator" },
            ]),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "NEVO Factory Layout Generator",
            applicationCategory: "EngineeringApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            description:
              "Interactive layout generator that sizes land, building, utilities and manpower for a sandwich panel factory.",
          }),
        },
      ],
    };
  },
});

// ---------------- UI ----------------
function Chip({ children, tone = "emerald" }: { children: React.ReactNode; tone?: "emerald" | "graphite" }) {
  const cls =
    tone === "emerald"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : "border-white/10 bg-white/5 text-white/70";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono uppercase tracking-widest ${cls}`}>
      {children}
    </span>
  );
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 max-w-3xl">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-300/80">{eyebrow}</div>
      <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-white/60">{sub}</p>}
    </div>
  );
}

function StepPill({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 font-mono text-[11px] font-bold text-black">
        {n}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">{label}</span>
    </div>
  );
}

function Select<T extends string | number>({
  value, options, onChange, format,
}: { value: T; options: readonly T[]; onChange: (v: T) => void; format?: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o)}
          onClick={() => onChange(o)}
          className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
            value === o
              ? "border-emerald-400 bg-emerald-500 text-black"
              : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
          }`}
        >
          {format ? format(o) : String(o)}
        </button>
      ))}
    </div>
  );
}

// ---------------- Page ----------------
function FactoryLayoutPage() {
  const [capacity, setCapacity] = useState<Capacity>(8000);
  const [core, setCore] = useState<Core>("PIR");
  const [automation, setAutomation] = useState<Automation>("Fully Automatic");
  const [building, setBuilding] = useState<Building>("Expansion Ready");
  const [view, setView] = useState<ViewMode>("3d");
  const [activeAreas, setActiveAreas] = useState<string[]>(AREAS.map((a) => a.key));

  const data = useMemo(
    () => computeFactory(capacity, core, automation, building),
    [capacity, core, automation, building],
  );

  const currentView = VIEW_MODES.find((v) => v.id === view)!;

  const toggleArea = (k: string) =>
    setActiveAreas((prev) => (prev.includes(k) ? prev.filter((a) => a !== k) : [...prev, k]));

  return (
    <div className="min-h-screen bg-[#0A0C0E] text-white">
      <SiteHeader />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-white/5 bg-black/40">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-6 py-3 text-xs text-white/50">
          <Link to="/" className="hover:text-white">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/solutions" className="hover:text-white">Solutions</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/solutions/factory-development" className="hover:text-white">Factory Development</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white">Factory Layout Generator</span>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 20% 0%, rgba(16,185,129,0.15), transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(16,185,129,0.08), transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-[1440px] px-6 py-16 md:py-20">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Chip><Sparkles className="h-3 w-3" /> Interactive Generator</Chip>
            <Chip tone="graphite">v2.0 · Engineering Preview</Chip>
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-7xl">
            Factory Layout <span className="text-emerald-400">Generator</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/60">
            Smart layout. Maximum efficiency. Higher profitability. Design your
            sandwich panel factory in minutes — visualize, optimize, and build
            better before a single foundation is poured.
          </p>
        </div>
      </section>

      {/* MAIN GENERATOR — Configuration + Live Layout */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-[1440px] px-6 py-12">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* CONFIGURATION PANEL */}
            <aside className="lg:col-span-4 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-300/80">
                  Configuration
                </div>

                <div className="space-y-6">
                  <div>
                    <StepPill n={1} label="Factory Capacity" />
                    <div className="mt-3">
                      <Select
                        value={capacity}
                        options={CAPACITIES}
                        onChange={(v) => setCapacity(v)}
                        format={(v) => `${(v as number).toLocaleString()} m²/day`}
                      />
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-6">
                    <StepPill n={2} label="Core Material" />
                    <div className="mt-3">
                      <Select value={core} options={CORES} onChange={setCore} />
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-6">
                    <StepPill n={3} label="Automation" />
                    <div className="mt-3">
                      <Select value={automation} options={AUTOMATIONS} onChange={setAutomation} />
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-6">
                    <StepPill n={4} label="Building Type" />
                    <div className="mt-3">
                      <Select value={building} options={BUILDINGS} onChange={setBuilding} />
                    </div>
                  </div>
                </div>

                <button className="mt-8 flex w-full items-center justify-between rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-medium text-black transition hover:bg-emerald-400">
                  <span className="inline-flex items-center gap-2"><Play className="h-4 w-4" /> Generate Layout</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* FACTORY DATA */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-300/80">Factory Data</div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Estimated</span>
                </div>
                <dl className="divide-y divide-white/5 text-sm">
                  {[
                    { i: Ruler, l: "Land Area", v: `${data.land.toLocaleString()} m²` },
                    { i: Building2, l: "Building Area", v: `${data.building.toLocaleString()} m²` },
                    { i: Factory, l: "Production Area", v: `${data.production.toLocaleString()} m²` },
                    { i: Zap, l: "Power Requirement", v: `${data.power.toLocaleString()} kW` },
                    { i: Droplets, l: "Water Consumption", v: `${data.water} m³/day` },
                    { i: Wind, l: "Compressed Air", v: `${data.air} m³/min` },
                    { i: Gauge, l: "Steam Requirement", v: `${data.steam.toLocaleString()} kg/h` },
                    { i: Users, l: "Operators", v: `${data.operators}` },
                    { i: Forklift, l: "Forklifts", v: `${data.forklifts}` },
                    { i: Truck, l: "Trucks / Bays", v: `${data.trucks}` },
                  ].map((r) => (
                    <div key={r.l} className="flex items-center justify-between py-2.5">
                      <span className="flex items-center gap-2 text-white/60">
                        <r.i className="h-3.5 w-3.5 text-emerald-300/80" /> {r.l}
                      </span>
                      <motion.span
                        key={r.v}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-mono text-white"
                      >
                        {r.v}
                      </motion.span>
                    </div>
                  ))}
                </dl>
              </div>
            </aside>

            {/* LIVE LAYOUT */}
            <div className="lg:col-span-8 space-y-4">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/40 px-4 py-3">
                  <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
                    <Scan className="h-3.5 w-3.5 text-emerald-300" /> Live Factory Layout
                  </div>
                  <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                    {VIEW_MODES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setView(m.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                          view === m.id ? "bg-emerald-500 text-black" : "text-white/60 hover:text-white"
                        }`}
                      >
                        <m.icon className="h-3 w-3" /> {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative aspect-[16/10] overflow-hidden bg-black">
                  <motion.img
                    key={view + capacity + core}
                    src={currentView.img}
                    alt={`Factory ${currentView.label}`}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="h-full w-full object-cover"
                  />
                  {/* Overlay HUD */}
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
                      <Chip>{capacity.toLocaleString()} m²/day</Chip>
                      <Chip tone="graphite">{core}</Chip>
                      <Chip tone="graphite">{automation}</Chip>
                      <Chip tone="graphite">{building}</Chip>
                    </div>
                    <div className="absolute right-4 top-4 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white/70 backdrop-blur">
                      {currentView.label}
                    </div>
                    <div className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-widest text-emerald-300/70">
                      120 m × 160 m
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-white/10 bg-black/40 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">
                  <span className="inline-flex items-center gap-1"><RotateCw className="h-3 w-3" /> Rotate</span>
                  <span className="inline-flex items-center gap-1"><ZoomIn className="h-3 w-3" /> Zoom</span>
                  <span className="inline-flex items-center gap-1"><Maximize2 className="h-3 w-3" /> Fullscreen</span>
                  <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" /> Exploded</span>
                  <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> Highlight</span>
                </div>
              </div>

              {/* PRODUCTION FLOW DIAGRAM */}
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                <div className="border-b border-white/10 bg-black/40 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
                  Production Flow Diagram
                </div>
                <div className="bg-black">
                  <img src={flowDiagram} alt="Production flow" className="h-full w-full object-cover" loading="lazy" />
                </div>
              </div>

              {/* AREAS TOGGLES */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300/80">Show / Hide Zones</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                    {activeAreas.length} / {AREAS.length} visible
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map((a) => {
                    const on = activeAreas.includes(a.key);
                    return (
                      <button
                        key={a.key}
                        onClick={() => toggleArea(a.key)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                          on
                            ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                            : "border-white/10 bg-white/5 text-white/40 line-through"
                        }`}
                      >
                        {on ? <CheckCircle2 className="h-3 w-3" /> : <a.icon className="h-3 w-3" />}
                        {a.key}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTION LINE HIGHLIGHTS */}
      <section className="border-b border-white/5 bg-black/30">
        <div className="mx-auto max-w-[1440px] px-6 py-16">
          <SectionTitle
            eyebrow="Production Line Highlights"
            title="Engineered stations, integrated flow"
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Double Belt Laminator", img: lineLaminator, desc: "High pressure, high speed laminating for perfect bonding." },
              { title: "PIR Mixing Unit", img: lineMixing, desc: "Precision mixing with exact ratio and density control." },
              { title: "Cutting Station", img: lineCutting, desc: "High accuracy cutting for perfect panel dimensions." },
              { title: "Packing Line", img: linePacking, desc: "Automatic packing for safe transport and storage." },
            ].map((s) => (
              <div key={s.title} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="aspect-[4/3] bg-black">
                  <img src={s.img} alt={s.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-300/80">Station</div>
                  <div className="mt-1 text-sm font-semibold text-white">{s.title}</div>
                  <p className="mt-1.5 text-xs text-white/60">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WAREHOUSE & LOGISTICS */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-[1440px] px-6 py-16">
          <SectionTitle eyebrow="Warehouse & Logistics" title="Storage, dispatch, and material handling" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Coil Warehouse", img: whCoil, desc: "Organized coil storage with easy access." },
              { title: "Finished Goods", img: whFinished, desc: "Spacious storage for finished panels." },
              { title: "Truck Loading", img: whTruck, desc: "Multiple loading bays for efficient dispatch." },
              { title: "Forklift Operations", img: whForklift, desc: "Smooth material handling and product flow." },
            ].map((s) => (
              <div key={s.title} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="aspect-[4/3] bg-black">
                  <img src={s.img} alt={s.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-300/80">Zone</div>
                  <div className="mt-1 text-sm font-semibold text-white">{s.title}</div>
                  <p className="mt-1.5 text-xs text-white/60">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MATERIAL FLOW + RENDERING + EXPANSION */}
      <section className="border-b border-white/5 bg-black/30">
        <div className="mx-auto max-w-[1440px] px-6 py-16">
          <SectionTitle
            eyebrow="Master Planning"
            title="Flow, façade & future expansion"
            sub="A NEVO factory is planned holistically — raw material flow, finished product flow, external rendering, and space reserved for scaling capacity."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { title: "Material Flow", img: materialFlow, tag: "Optimized" },
              { title: "Factory Rendering", img: rendering, tag: "Photorealistic" },
              { title: "Expansion Ready Layout", img: expansionImg, tag: "Scalable" },
            ].map((s) => (
              <div key={s.title} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                <div className="aspect-[16/10] bg-black">
                  <img src={s.img} alt={s.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="flex items-center justify-between p-5">
                  <div className="text-sm font-semibold text-white">{s.title}</div>
                  <Chip>{s.tag}</Chip>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOWNLOADS */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-[1440px] px-6 py-16">
          <SectionTitle eyebrow="Downloads" title="Engineering documents" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Factory Layout PDF", size: "PDF · 6.4 MB" },
              { title: "Masterplan", size: "PDF · 4.1 MB" },
              { title: "Utilities Layout", size: "PDF · 3.2 MB" },
              { title: "Equipment List", size: "PDF · 1.8 MB" },
            ].map((d) => (
              <button
                key={d.title}
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-300/80" />
                    <span className="text-sm font-medium text-white">{d.title}</span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/40">{d.size}</div>
                </div>
                <Download className="h-4 w-4 text-white/40 transition group-hover:text-emerald-300" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(16,185,129,0.2), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[1440px] px-6 py-24 text-center">
          <Chip><ClipboardList className="h-3 w-3" /> Ready for the next step</Chip>
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Turn this layout into a <span className="text-emerald-400">real factory</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-white/60">
            Request a complete engineering proposal — masterplan, utilities, equipment list, CAPEX and delivery schedule — from NEVO Industrial.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-black transition hover:bg-emerald-400"
            >
              <ClipboardList className="h-4 w-4" /> Request Full Factory Design
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <PhoneCall className="h-4 w-4" /> Talk to an Engineer
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <CalendarClock className="h-4 w-4" /> Schedule Meeting
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
