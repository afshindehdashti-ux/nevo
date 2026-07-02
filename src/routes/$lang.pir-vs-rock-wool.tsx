import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Download,
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
  Droplets,
  Wrench,
  Leaf,
  DollarSign,
  Clock,
  Shield,
  Wind,
  Zap,
  RotateCw,
  ZoomIn,
  Scan,
  Sparkles,
  Trophy,
  Building2,
  Factory,
  Warehouse,
  Info,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { buildSeo, orgJsonLd, breadcrumbJsonLd } from "@/lib/seo";

import crossPir from "@/assets/pir-vs-rockwool/cross-pir.png";
import crossRw from "@/assets/pir-vs-rockwool/cross-rockwool.png";
import firePir from "@/assets/pir-vs-rockwool/fire-pir.png";
import fireRw from "@/assets/pir-vs-rockwool/fire-rockwool.png";
import thermalPir from "@/assets/pir-vs-rockwool/thermal-pir.png";
import thermalRw from "@/assets/pir-vs-rockwool/thermal-rockwool.png";
import corePir from "@/assets/pir-vs-rockwool/core-pir.png";
import coreRw from "@/assets/pir-vs-rockwool/core-rockwool.png";
import ppgiCoil from "@/assets/pir-vs-rockwool/ppgi-coil.png";
import mechanical from "@/assets/pir-vs-rockwool/mechanical.png";
import appColdStorage from "@/assets/pir-vs-rockwool/app-cold-steel-coil.png";
import appIndustrial from "@/assets/pir-vs-rockwool/app-industrial-building.png";
import appCleanRoom from "@/assets/pir-vs-rockwool/app-clean-room.png";
import appWarehouse from "@/assets/pir-vs-rockwool/app-warehouse.png";
import appCommercial from "@/assets/pir-vs-rockwool/app-commercial-building.png";

// ---------------- SEO ----------------
export const Route = createFileRoute("/$lang/pir-vs-rock-wool")({
  component: PirVsRockWoolPage,
  head: () => {
    const seo = buildSeo({
      title: "PIR vs Rock Wool — Sandwich Panel Comparison Guide | NEVO",
      description:
        "The most complete PIR vs Rock Wool comparison. Thermal U-value, fire rating, weight, sound, moisture, installation speed, cost and lifecycle — engineered by NEVO Industrial.",
      path: "/pir-vs-rock-wool",
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
              { name: "Knowledge", path: "/knowledge-hub" },
              { name: "PIR vs Rock Wool", path: "/pir-vs-rock-wool" },
            ]),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        },
      ],
    };
  },
});

// ---------------- Data ----------------
type Row = {
  label: string;
  icon: any;
  pir: string;
  rw: string;
  winner: "PIR" | "RW" | "TIE";
  note?: string;
};

const ROWS: Row[] = [
  { label: "Thermal Conductivity (W/m·K)", icon: ThermometerSun, pir: "0.022 – 0.024", rw: "0.036 – 0.040", winner: "PIR", note: "Lower λ = better insulation" },
  { label: "Fire Resistance", icon: Flame, pir: "B-s2,d0", rw: "A1 (Non-combustible)", winner: "RW", note: "Rock Wool is non-combustible" },
  { label: "Density (kg/m³)", icon: Layers, pir: "32 – 42", rw: "100 – 150", winner: "PIR" },
  { label: "Weight @ 100mm (kg/m²)", icon: Weight, pir: "10.2", rw: "16.8", winner: "PIR" },
  { label: "Water Absorption (by volume)", icon: Droplets, pir: "< 2 %", rw: "1 – 3 %", winner: "PIR" },
  { label: "Installation Speed", icon: Zap, pir: "Very Fast", rw: "Fast", winner: "PIR" },
  { label: "Initial Cost", icon: DollarSign, pir: "Lower", rw: "Higher", winner: "PIR" },
  { label: "Lifespan", icon: Clock, pir: "25 – 30 yrs", rw: "30 – 40 yrs", winner: "RW" },
  { label: "Energy Saving", icon: Leaf, pir: "Excellent", rw: "Very Good", winner: "PIR" },
  { label: "Maintenance", icon: Wrench, pir: "Very Low", rw: "Low", winner: "PIR" },
  { label: "Environmental Impact", icon: Leaf, pir: "Low (CFC/HCFC free)", rw: "Recyclable", winner: "RW" },
];

const U_VALUES: Record<number, { pir: number; rw: number }> = {
  40: { pir: 0.55, rw: 0.80 },
  60: { pir: 0.37, rw: 0.56 },
  80: { pir: 0.28, rw: 0.42 },
  100: { pir: 0.22, rw: 0.34 },
  120: { pir: 0.18, rw: 0.28 },
  150: { pir: 0.15, rw: 0.23 },
  200: { pir: 0.11, rw: 0.17 },
};

const WEIGHTS: Record<number, { pir: number; rw: number }> = {
  50: { pir: 5.1, rw: 8.4 },
  80: { pir: 8.2, rw: 13.4 },
  100: { pir: 10.2, rw: 16.8 },
  120: { pir: 12.2, rw: 20.1 },
  150: { pir: 15.2, rw: 25.2 },
  200: { pir: 20.2, rw: 33.6 },
};

const FIRE_MIN: Record<string, { pir: number; rw: number; max: number }> = {
  "30 min": { pir: 28, rw: 30, max: 30 },
  "60 min": { pir: 55, rw: 60, max: 60 },
  "90 min": { pir: 82, rw: 90, max: 90 },
  "120 min": { pir: 105, rw: 120, max: 120 },
  "180 min": { pir: 150, rw: 180, max: 180 },
};

const SOUND: Record<number, { pir: number; rw: number }> = {
  50: { pir: 24, rw: 32 },
  80: { pir: 26, rw: 34 },
  100: { pir: 27, rw: 36 },
  120: { pir: 28, rw: 37 },
  150: { pir: 29, rw: 38 },
};

type AppKey = "Cold Storage" | "Food Factory" | "Warehouse" | "Industrial Building" | "Clean Room" | "Office" | "Commercial Building";

const APPLICATIONS: {
  key: AppKey; img: string; recommend: "PIR" | "RW" | "EITHER"; reason: string; icon: any;
}[] = [
  { key: "Cold Storage", img: appColdStorage, recommend: "PIR", reason: "Lowest λ, minimum heat loss, moisture resistant.", icon: Snowflake },
  { key: "Food Factory", img: appIndustrial, recommend: "PIR", reason: "Hygienic, low water absorption, HACCP compatible.", icon: Factory },
  { key: "Warehouse", img: appWarehouse, recommend: "PIR", reason: "Best cost-to-performance for large envelopes.", icon: Warehouse },
  { key: "Industrial Building", img: appIndustrial, recommend: "EITHER", reason: "PIR for thermal priority, Rock Wool for fire zones.", icon: Building2 },
  { key: "Clean Room", img: appCleanRoom, recommend: "PIR", reason: "Dimensionally stable, smooth surface, low VOC.", icon: Shield },
  { key: "Office", img: appCommercial, recommend: "RW", reason: "Superior acoustic and fire compartmentation.", icon: Volume2 },
  { key: "Commercial Building", img: appCommercial, recommend: "RW", reason: "Code-driven A1 fire class for façades > 18m.", icon: Building2 },
];

const FAQS = [
  { q: "Which is better, PIR or Rock Wool?", a: "Neither is universally better. PIR delivers superior thermal performance, lower weight and lower cost — ideal for cold storage, food and warehousing. Rock Wool is non-combustible (A1) and provides better acoustics — required for high-rise façades, offices and fire-critical compartments." },
  { q: "What is the U-value difference at 100 mm?", a: "PIR at 100 mm delivers ~0.22 W/m²K, Rock Wool ~0.34 W/m²K. PIR is roughly 35% more thermally efficient at the same thickness." },
  { q: "Is Rock Wool fireproof?", a: "Rock Wool is classified A1 non-combustible per EN 13501-1 — it does not burn, does not release smoke and withstands >1000°C. PIR is B-s2,d0 and self-extinguishing but combustible under sustained flame." },
  { q: "How much heavier is Rock Wool?", a: "A 100 mm Rock Wool panel weighs ~16.8 kg/m² vs ~10.2 kg/m² for PIR — Rock Wool is ~65% heavier, affecting structure, transport and installation." },
  { q: "Which panel installs faster?", a: "PIR installs 20–30% faster due to lower weight and lighter handling. Rock Wool requires more crew and rigging for the same area." },
  { q: "What is the lifecycle cost difference?", a: "PIR has ~15% lower CAPEX and 20–30% lower energy cost over 20 years. Rock Wool has a longer service life (30–40 yrs vs 25–30 yrs) and better residual value in fire-rated buildings." },
];

// ---------------- Small UI ----------------
function Chip({ children, tone = "emerald" }: { children: React.ReactNode; tone?: "emerald" | "graphite" | "amber" }) {
  const tones = {
    emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    graphite: "border-white/10 bg-white/5 text-white/70",
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono uppercase tracking-widest ${tones[tone]}`}>
      {children}
    </span>
  );
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 max-w-3xl">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-300/80">
        {eyebrow}
      </div>
      <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-white/60">{sub}</p>}
    </div>
  );
}

function Bar({ value, max, tone }: { value: number; max: number; tone: "emerald" | "graphite" }) {
  const pct = Math.min(100, (value / max) * 100);
  const cls = tone === "emerald" ? "bg-emerald-400" : "bg-white/40";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className={`h-full rounded-full ${cls}`}
      />
    </div>
  );
}

// ---------------- Page ----------------
function PirVsRockWoolPage() {
  const [selectedThickness, setSelectedThickness] = useState<number>(100);
  const [viewMode, setViewMode] = useState<"cross" | "exploded" | "thermal">("cross");
  const [selectedApp, setSelectedApp] = useState<AppKey>("Cold Storage");

  const thicknessKeys = [40, 60, 80, 100, 120, 150, 200];
  const currentU = U_VALUES[selectedThickness];

  const selectedAppData = useMemo(
    () => APPLICATIONS.find((a) => a.key === selectedApp)!,
    [selectedApp],
  );

  const pirWins = ROWS.filter((r) => r.winner === "PIR").length;
  const rwWins = ROWS.filter((r) => r.winner === "RW").length;

  return (
    <div className="min-h-screen bg-[#0A0C0E] text-white">
      <SiteHeader />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-white/5 bg-black/40">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-6 py-3 text-xs text-white/50">
          <Link to="/" className="hover:text-white">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/knowledge-hub" className="hover:text-white">Knowledge</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white">PIR vs Rock Wool</span>
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
        <div className="relative mx-auto max-w-[1440px] px-6 py-20 md:py-28">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Chip><Sparkles className="h-3 w-3" /> Engineering Guide</Chip>
            <Chip tone="graphite">Updated 2026</Chip>
            <Chip tone="graphite">14 min read</Chip>
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-7xl">
            PIR <span className="text-white/40">vs</span>{" "}
            <span className="text-emerald-400">Rock Wool</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/60">
            Different materials. Different performance. One right choice — the
            complete side-by-side comparison for engineers, consultants and
            factory owners.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { k: "Rows compared", v: `${ROWS.length}`, i: Layers },
              { k: "Applications", v: `${APPLICATIONS.length}`, i: Building2 },
              { k: "PIR advantages", v: `${pirWins}`, i: Trophy },
              { k: "Rock Wool advantages", v: `${rwWins}`, i: Shield },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <s.i className="mb-3 h-4 w-4 text-emerald-300/80" />
                <div className="font-mono text-3xl font-semibold text-white">{s.v}</div>
                <div className="mt-1 text-xs text-white/50">{s.k}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/product-configurator"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-black transition hover:bg-emerald-400"
            >
              Configure My Panel <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <MessageSquare className="h-4 w-4" /> Talk to an Engineer
            </Link>
          </div>
        </div>
      </section>

      {/* INTRODUCTION / CROSS SECTIONS */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-[1440px] px-6 py-20">
          <SectionTitle
            eyebrow="01 — Introduction"
            title="Two engineered cores. Two engineering philosophies."
            sub="PIR (polyisocyanurate) is a rigid closed-cell foam optimised for the lowest possible U-value. Rock Wool (mineral wool) is a fibrous mineral core engineered for non-combustibility and acoustic mass. Both are laminated between PPGI steel skins in the same NEVO production line."
          />
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { title: "PIR Panel", img: crossPir, badge: "Closed-cell foam", color: "emerald" as const, layers: ["PPGI Steel Sheet", "Adhesive", "PIR Core", "Adhesive", "PPGI Steel Sheet"] },
              { title: "Rock Wool Panel", img: crossRw, badge: "Mineral fibre", color: "graphite" as const, layers: ["PPGI Steel Sheet", "Adhesive", "Rock Wool Core", "Adhesive", "PPGI Steel Sheet"] },
            ].map((c) => (
              <div key={c.title} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                <div className="relative aspect-[16/10] overflow-hidden bg-black">
                  <img src={c.img} alt={`${c.title} cross section`} className="h-full w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" />
                </div>
                <div className="p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">{c.title}</h3>
                    <Chip tone={c.color}>{c.badge}</Chip>
                  </div>
                  <ul className="grid grid-cols-2 gap-2 font-mono text-[11px] uppercase tracking-wider text-white/60">
                    {c.layers.map((l) => (
                      <li key={l} className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTERACTIVE COMPARISON TABLE */}
      <section className="border-b border-white/5 bg-black/30">
        <div className="mx-auto max-w-[1440px] px-6 py-20">
          <SectionTitle
            eyebrow="02 — Interactive Comparison"
            title="Side-by-side performance table"
            sub="Eleven engineering criteria. Real values from EN-tested panels."
          />
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
            <div className="grid grid-cols-12 border-b border-white/10 bg-black/40 px-4 py-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50 md:px-6">
              <div className="col-span-5">Property</div>
              <div className="col-span-3">PIR</div>
              <div className="col-span-3">Rock Wool</div>
              <div className="col-span-1 text-right">Winner</div>
            </div>
            {ROWS.map((r, i) => (
              <motion.div
                key={r.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-12 items-center border-b border-white/5 px-4 py-4 text-sm last:border-b-0 hover:bg-white/[0.02] md:px-6"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <r.icon className="h-4 w-4 text-emerald-300/80" />
                  <div>
                    <div className="text-white">{r.label}</div>
                    {r.note && <div className="text-[11px] text-white/40">{r.note}</div>}
                  </div>
                </div>
                <div className={`col-span-3 font-mono ${r.winner === "PIR" ? "text-emerald-300" : "text-white/70"}`}>{r.pir}</div>
                <div className={`col-span-3 font-mono ${r.winner === "RW" ? "text-emerald-300" : "text-white/70"}`}>{r.rw}</div>
                <div className="col-span-1 text-right">
                  {r.winner === "TIE" ? (
                    <span className="font-mono text-[11px] text-white/40">TIE</span>
                  ) : (
                    <Chip>{r.winner === "PIR" ? "PIR" : "Rock Wool"}</Chip>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3D VIEWER + THERMAL SIMULATION */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-[1440px] px-6 py-20">
          <SectionTitle
            eyebrow="03 — Thermal Performance"
            title="Heat loss simulation across thicknesses"
            sub="Move the thickness selector to compare live U-values, heat flux and thermal image response."
          />

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Viewer */}
            <div className="lg:col-span-3 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
                  <Scan className="h-3.5 w-3.5" /> Technical Viewer
                </div>
                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                  {[
                    { id: "cross" as const, label: "Cross", icon: Layers },
                    { id: "exploded" as const, label: "Exploded", icon: RotateCw },
                    { id: "thermal" as const, label: "Thermal", icon: ThermometerSun },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setViewMode(m.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                        viewMode === m.id ? "bg-emerald-500 text-black" : "text-white/60 hover:text-white"
                      }`}
                    >
                      <m.icon className="h-3 w-3" /> {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px bg-white/5">
                {[
                  {
                    title: "PIR",
                    imgs: { cross: crossPir, exploded: corePir, thermal: thermalPir },
                    val: `U = ${currentU.pir} W/m²K`,
                  },
                  {
                    title: "Rock Wool",
                    imgs: { cross: crossRw, exploded: coreRw, thermal: thermalRw },
                    val: `U = ${currentU.rw} W/m²K`,
                  },
                ].map((p) => (
                  <div key={p.title} className="relative aspect-square overflow-hidden bg-black">
                    <img src={p.imgs[viewMode]} alt={`${p.title} ${viewMode}`} className="h-full w-full object-cover" loading="lazy" />
                    <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white/80 backdrop-blur">
                      {p.title}
                    </div>
                    <div className="absolute bottom-3 left-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 font-mono text-[11px] text-emerald-200 backdrop-blur">
                      {p.val}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-white/10 bg-black/40 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">
                <span className="inline-flex items-center gap-1"><RotateCw className="h-3 w-3" /> Rotate</span>
                <span className="inline-flex items-center gap-1"><ZoomIn className="h-3 w-3" /> Zoom</span>
                <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" /> Explode</span>
                <span className="inline-flex items-center gap-1"><Ruler className="h-3 w-3" /> Measure</span>
              </div>
            </div>

            {/* Thickness selector + U chart */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Thickness</div>
                  <div className="font-mono text-2xl font-semibold text-white">{selectedThickness}<span className="text-sm text-white/40"> mm</span></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {thicknessKeys.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedThickness(t)}
                      className={`rounded-full border px-3 py-1.5 font-mono text-xs transition ${
                        selectedThickness === t
                          ? "border-emerald-400 bg-emerald-500 text-black"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-emerald-300">PIR</span>
                      <span className="font-mono text-white/70">{currentU.pir} W/m²K</span>
                    </div>
                    <Bar value={currentU.pir} max={0.9} tone="emerald" />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-white/70">Rock Wool</span>
                      <span className="font-mono text-white/70">{currentU.rw} W/m²K</span>
                    </div>
                    <Bar value={currentU.rw} max={0.9} tone="graphite" />
                  </div>
                </div>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-white/40">
                  Lower U-value = Better insulation
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.04] p-6">
                <ThermometerSun className="mb-3 h-4 w-4 text-emerald-300" />
                <div className="text-sm text-white/80">
                  At <span className="font-mono text-emerald-300">{selectedThickness} mm</span>, PIR delivers{" "}
                  <span className="font-mono text-emerald-300">
                    {Math.round(((currentU.rw - currentU.pir) / currentU.rw) * 100)}%
                  </span>{" "}
                  lower heat loss than Rock Wool.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FIRE RATING */}
      <section className="border-b border-white/5 bg-black/30">
        <div className="mx-auto max-w-[1440px] px-6 py-20">
          <SectionTitle
            eyebrow="04 — Fire Rating"
            title="Real-world fire performance test"
            sub="Direct flame exposure. Rock Wool is A1 non-combustible. PIR is self-extinguishing (B-s2,d0) and does not propagate flame."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {[
              { title: "PIR Panel", img: firePir, tag: "Self-extinguishing", desc: "No flame propagation. B-s2,d0 EN 13501-1." },
              { title: "Rock Wool Panel", img: fireRw, tag: "Non-combustible", desc: "Excellent fire resistance. A1 EN 13501-1." },
            ].map((c) => (
              <div key={c.title} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                <div className="relative aspect-[16/10] bg-black">
                  <img src={c.img} alt={`${c.title} fire test`} className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur">
                    {c.title}
                  </div>
                </div>
                <div className="p-6">
                  <Chip>{c.tag}</Chip>
                  <p className="mt-3 text-sm text-white/70">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Fire Resistance Duration</div>
              <div className="flex items-center gap-3 text-[11px] text-white/60">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> PIR (intumescent)</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/40" /> Rock Wool</span>
              </div>
            </div>
            <div className="space-y-4">
              {Object.entries(FIRE_MIN).map(([label, v]) => (
                <div key={label} className="grid grid-cols-12 items-center gap-3">
                  <div className="col-span-2 font-mono text-xs text-white/60">{label}</div>
                  <div className="col-span-10 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1"><Bar value={v.pir} max={180} tone="emerald" /></div>
                      <div className="w-12 text-right font-mono text-xs text-emerald-300">{v.pir}m</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1"><Bar value={v.rw} max={180} tone="graphite" /></div>
                      <div className="w-12 text-right font-mono text-xs text-white/60">{v.rw}m</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WEIGHT + SOUND */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-[1440px] px-6 py-20 space-y-16">
          <div>
            <SectionTitle
              eyebrow="05 — Weight"
              title="PIR is significantly lighter"
              sub="Lower panel weight reduces structural steel, transport cost and installation crew size."
            />
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <div className="grid grid-cols-6 gap-4">
                {Object.entries(WEIGHTS).map(([thk, v]) => (
                  <div key={thk} className="text-center">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">{thk}mm</div>
                    <div className="mt-3 flex h-40 items-end justify-center gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <div className="font-mono text-[10px] text-emerald-300">{v.pir}</div>
                        <div className="w-6 rounded-t bg-emerald-400" style={{ height: `${(v.pir / 34) * 100}%` }} />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="font-mono text-[10px] text-white/60">{v.rw}</div>
                        <div className="w-6 rounded-t bg-white/40" style={{ height: `${(v.rw / 34) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-white/40">kg/m² · PIR (green) vs Rock Wool (grey)</div>
            </div>
          </div>

          <div>
            <SectionTitle
              eyebrow="06 — Sound Insulation"
              title="Rock Wool wins on acoustics"
              sub="Fibrous mineral mass absorbs airborne sound better than closed-cell foam. Critical for offices and hotel façades."
            />
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
              {Object.entries(SOUND).map(([thk, v]) => (
                <div key={thk} className="grid grid-cols-12 items-center gap-3">
                  <div className="col-span-2 font-mono text-xs text-white/60">{thk}mm</div>
                  <div className="col-span-10 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1"><Bar value={v.pir} max={40} tone="emerald" /></div>
                      <div className="w-12 text-right font-mono text-xs text-emerald-300">{v.pir} dB</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1"><Bar value={v.rw} max={40} tone="graphite" /></div>
                      <div className="w-12 text-right font-mono text-xs text-white/60">{v.rw} dB</div>
                    </div>
                  </div>
                </div>
              ))}
              <p className="pt-2 font-mono text-[10px] uppercase tracking-widest text-white/40">Higher dB = Better sound insulation</p>
            </div>
          </div>
        </div>
      </section>

      {/* MOISTURE + INSTALLATION + MECHANICAL */}
      <section className="border-b border-white/5 bg-black/30">
        <div className="mx-auto max-w-[1440px] px-6 py-20">
          <SectionTitle
            eyebrow="07 — Moisture · Installation · Mechanical"
            title="Field performance metrics"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Moisture Resistance", icon: Droplets, img: corePir,
                pir: "< 2% water absorption", rw: "1 – 3% water absorption",
                winner: "PIR", desc: "Closed-cell PIR does not wick moisture — essential for cold storage vapour barriers.",
              },
              {
                title: "Installation Speed", icon: Wrench, img: ppgiCoil,
                pir: "Very fast · 2-man crew", rw: "Fast · 3-man crew",
                winner: "PIR", desc: "Lighter panels install 20–30% faster with lower crane/rigging requirements.",
              },
              {
                title: "Mechanical Strength", icon: Shield, img: mechanical,
                pir: "High rigidity", rw: "High rigidity + fibre integrity",
                winner: "TIE", desc: "Both cores meet EN 14509 span requirements when steel skins are correctly gauged.",
              },
            ].map((c) => (
              <div key={c.title} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                <div className="relative aspect-[16/10] bg-black">
                  <img src={c.img} alt={c.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <c.icon className="h-4 w-4 text-emerald-300/80" />
                      <h3 className="font-semibold text-white">{c.title}</h3>
                    </div>
                    {c.winner !== "TIE" && <Chip>{c.winner === "PIR" ? "PIR" : "Rock Wool"}</Chip>}
                  </div>
                  <div className="space-y-2 border-y border-white/5 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-300">PIR</span>
                      <span className="font-mono text-xs text-white/70">{c.pir}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Rock Wool</span>
                      <span className="font-mono text-xs text-white/70">{c.rw}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-white/60">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPLICATIONS */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-[1440px] px-6 py-20">
          <SectionTitle
            eyebrow="08 — Application Recommendation"
            title="Which panel for your project?"
            sub="Pick your building type — our engineering matrix recommends the right core."
          />
          <div className="mb-6 flex flex-wrap gap-2">
            {APPLICATIONS.map((a) => (
              <button
                key={a.key}
                onClick={() => setSelectedApp(a.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition ${
                  selectedApp === a.key
                    ? "border-emerald-400 bg-emerald-500 text-black"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
                }`}
              >
                <a.icon className="h-3.5 w-3.5" /> {a.key}
              </button>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
              <div className="relative aspect-[16/9] bg-black">
                <img src={selectedAppData.img} alt={selectedAppData.key} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur">
                  {selectedAppData.key}
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Recommendation</div>
              <div className="mt-3 flex items-center gap-3">
                <Trophy className="h-6 w-6 text-emerald-400" />
                <div className="text-3xl font-semibold text-white">
                  {selectedAppData.recommend === "EITHER" ? "PIR or Rock Wool" : selectedAppData.recommend === "PIR" ? "PIR" : "Rock Wool"}
                </div>
              </div>
              <p className="mt-4 text-sm text-white/70">{selectedAppData.reason}</p>
              <div className="mt-6 flex flex-col gap-2">
                <Link to="/product-configurator" className="inline-flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10">
                  <span className="inline-flex items-center gap-2"><Layers className="h-4 w-4 text-emerald-300" /> Configure this panel</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/contact" className="inline-flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10">
                  <span className="inline-flex items-center gap-2"><MessageSquare className="h-4 w-4 text-emerald-300" /> Talk to an engineer</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COST + LIFECYCLE + ENERGY + MAINTENANCE */}
      <section className="border-b border-white/5 bg-black/30">
        <div className="mx-auto max-w-[1440px] px-6 py-20">
          <SectionTitle
            eyebrow="09 — Cost · Lifecycle · Energy · Maintenance"
            title="The complete economic picture"
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: DollarSign, title: "Initial Cost", pir: "Lower", rw: "Higher", pct: [40, 70], desc: "PIR CAPEX is ~15% below Rock Wool at equal U-value." },
              { icon: Clock, title: "Lifecycle (20 yr)", pir: "Best value", rw: "Higher TCO", pct: [55, 85], desc: "Energy savings compound over 20 years — PIR leads TCO." },
              { icon: Leaf, title: "Energy Saving", pir: "20 – 30%", rw: "10 – 15%", pct: [90, 55], desc: "Vs uninsulated envelope, over 20 years." },
              { icon: Wrench, title: "Maintenance", pir: "Very Low", rw: "Low", pct: [92, 78], desc: "Sealed skins on both; PIR edge integrity is superior." },
            ].map((c) => (
              <div key={c.title} className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <c.icon className="h-4 w-4 text-emerald-300/80" />
                <h3 className="mt-3 font-semibold text-white">{c.title}</h3>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-emerald-300">PIR</span>
                      <span className="font-mono text-white/70">{c.pir}</span>
                    </div>
                    <Bar value={c.pct[0]} max={100} tone="emerald" />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-white/60">Rock Wool</span>
                      <span className="font-mono text-white/70">{c.rw}</span>
                    </div>
                    <Bar value={c.pct[1]} max={100} tone="graphite" />
                  </div>
                </div>
                <p className="mt-4 text-xs text-white/50">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOWNLOADS */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-[1440px] px-6 py-20">
          <SectionTitle
            eyebrow="10 — Downloads"
            title="Technical documents"
            sub="Full engineering documentation, ready for your specification package."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "PIR vs Rock Wool Comparison", size: "PDF · 3.2 MB", icon: FileText },
              { title: "Engineering Guide", size: "PDF · 5.1 MB", icon: FileText },
              { title: "Technical Specification", size: "PDF · 2.4 MB", icon: FileText },
              { title: "Installation Guide", size: "PDF · 4.7 MB", icon: FileText },
            ].map((d) => (
              <button
                key={d.title}
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <d.icon className="h-4 w-4 text-emerald-300/80" />
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

      {/* FAQ */}
      <section className="border-b border-white/5 bg-black/30">
        <div className="mx-auto max-w-[1440px] px-6 py-20">
          <SectionTitle
            eyebrow="11 — FAQ"
            title="Engineering questions, answered"
          />
          <div className="grid gap-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 open:border-emerald-400/30">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                  <span className="text-base font-medium text-white">{f.q}</span>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/40 transition group-open:rotate-90" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-white/70">{f.a}</p>
              </details>
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
          <Chip><Info className="h-3 w-3" /> Still deciding?</Chip>
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Let a NEVO engineer <span className="text-emerald-400">specify the right panel</span> for your project.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-white/60">
            Free 30-minute engineering consultation. Send us your project brief and receive a specification pack within 24 hours.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-black transition hover:bg-emerald-400">
              <PhoneCall className="h-4 w-4" /> Talk to an Engineer
            </Link>
            <Link to="/product-configurator" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10">
              Request Quotation <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10">
              <Download className="h-4 w-4" /> Download Guide
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
