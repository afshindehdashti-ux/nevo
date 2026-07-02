import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  Flame,
  Layers,
  Ruler,
  Shield,
  Volume2,
  Thermometer,
  Palette,
  Wrench,
  Package,
  RotateCw,
  ZoomIn,
  Move3d,
  Scissors,
  RefreshCw,
  Share2,
  Plus,
  X,
  MessageCircle,
  Award,
  Globe,
  ChevronRight,
} from "lucide-react";

import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { buildSeo } from "@/lib/seo";
import { cn } from "@/lib/utils";

import panelPIR from "@/assets/configurator/panel-pir.jpg";
import panelPUR from "@/assets/configurator/panel-pur.jpg";
import panelRockwool from "@/assets/configurator/panel-rockwool.jpg";
import panelGlasswool from "@/assets/configurator/panel-glasswool.jpg";
import panelEPS from "@/assets/configurator/panel-eps.jpg";
import heroImg from "@/assets/configurator/hero-configurator.jpg";

export const Route = createFileRoute("/$lang/product-configurator")({
  head: () => ({
    ...buildSeo({
      title: "Product Configurator — Design Your Sandwich Panel",
      description:
        "Configure NEVO sandwich panels to your exact specification. Real-time thermal, fire and structural results with instant datasheets and quotation.",
      path: "/product-configurator",
      type: "product",
      keywords: [
        "sandwich panel configurator",
        "PIR panel calculator",
        "rock wool panel U-value",
        "cold room panel design",
        "NEVO Industrial",
      ],
    }),
  }),
  component: ProductConfiguratorPage,
});

/* --------------------------- Domain data --------------------------- */

type PanelType = "wall" | "roof" | "coldroom" | "cleanroom" | "fire";
type CoreMaterial = "PIR" | "PUR" | "Rock Wool" | "EPS" | "Glass Wool";
type JointType = "Hidden Screw" | "Visible Screw" | "Tongue & Groove" | "Cam-Lock";
type Coating = "PVDF" | "Polyester" | "Plastisol" | "HDP";

const PANEL_TYPES: {
  id: PanelType;
  label: string;
  desc: string;
  icon: typeof Shield;
}[] = [
  { id: "wall", label: "Wall Panel", desc: "Facade & partition envelope", icon: Layers },
  { id: "roof", label: "Roof Panel", desc: "Weatherproof roofing systems", icon: Shield },
  { id: "coldroom", label: "Cold Room Panel", desc: "-40°C to +8°C storage", icon: Thermometer },
  { id: "cleanroom", label: "Clean Room Panel", desc: "ISO 5–8 controlled spaces", icon: Award },
  { id: "fire", label: "Fire Rated Panel", desc: "EI 60 – EI 240 rated", icon: Flame },
];

const CORES: {
  id: CoreMaterial;
  density: number;
  lambda: number;
  fire: string;
  desc: string;
}[] = [
  { id: "PIR", density: 40, lambda: 0.022, fire: "B-s1,d0", desc: "Best thermal / weight ratio" },
  { id: "PUR", density: 40, lambda: 0.023, fire: "B-s2,d0", desc: "Cost-optimised insulation" },
  { id: "Rock Wool", density: 110, lambda: 0.041, fire: "A1", desc: "Non-combustible, acoustic" },
  { id: "EPS", density: 15, lambda: 0.038, fire: "E", desc: "Lightweight, economical" },
  { id: "Glass Wool", density: 90, lambda: 0.035, fire: "A1", desc: "Fire safety + acoustic" },
];

const PANEL_IMAGES: Record<CoreMaterial, string> = {
  PIR: panelPIR,
  PUR: panelPUR,
  "Rock Wool": panelRockwool,
  "Glass Wool": panelGlasswool,
  EPS: panelEPS,
};

const JOINTS: JointType[] = ["Hidden Screw", "Visible Screw", "Tongue & Groove", "Cam-Lock"];
const COATINGS: Coating[] = ["PVDF", "Polyester", "Plastisol", "HDP"];
const COLOR_SWATCHES = [
  { ral: "RAL 9002", hex: "#E7E7DE" },
  { ral: "RAL 7016", hex: "#293133" },
  { ral: "RAL 9010", hex: "#F1ECE1" },
  { ral: "RAL 5010", hex: "#0E4C7E" },
  { ral: "RAL 3020", hex: "#B81A1F" },
  { ral: "RAL 6005", hex: "#114232" },
];

interface Config {
  panelType: PanelType;
  core: CoreMaterial;
  thickness: number;
  width: number;
  length: number;
  joint: JointType;
  extSteel: number;
  intSteel: number;
  coating: Coating;
  color: string;
  accessories: string[];
}

const DEFAULT_CONFIG: Config = {
  panelType: "wall",
  core: "PIR",
  thickness: 100,
  width: 1000,
  length: 6,
  joint: "Hidden Screw",
  extSteel: 0.5,
  intSteel: 0.4,
  coating: "PVDF",
  color: "RAL 9002",
  accessories: [],
};

/* ------------------ Engineering result calculations ------------------ */

function computeResults(cfg: Config) {
  const core = CORES.find((c) => c.id === cfg.core)!;
  const thicknessM = cfg.thickness / 1000;
  const uValue = core.lambda / thicknessM;
  const steelKg = (cfg.extSteel + cfg.intSteel) * 7.85;
  const coreKg = core.density * thicknessM;
  const weight = +(steelKg + coreKg).toFixed(1);
  const fireRating = core.fire;
  const sound = 25 + Math.round(core.density / 10);
  const thermalScore =
    uValue < 0.25 ? "Excellent" : uValue < 0.35 ? "Very Good" : uValue < 0.5 ? "Good" : "Standard";
  const app =
    cfg.panelType === "coldroom"
      ? "Cold storage, food processing, logistics"
      : cfg.panelType === "cleanroom"
        ? "Pharma, semiconductor, laboratories"
        : cfg.panelType === "fire"
          ? "Compartmentation, escape routes, industrial fire zones"
          : cfg.panelType === "roof"
            ? "Industrial roofs, warehouses, factories"
            : "Facades, partitions, industrial envelopes";
  return {
    uValue: +uValue.toFixed(3),
    weight,
    fireRating,
    sound,
    thermalScore,
    application: app,
    coreDensity: core.density,
  };
}

/* --------------------------- Reusable studio frame --------------------------- */
/*  White studio card that renders any panel render at true aspect —            */
/*  never crops, never stretches. Soft engineering-software shadow.             */

function PanelStudio({
  core,
  ratio = "aspect-[16/10]",
  className,
  caption,
  overlay,
}: {
  core: CoreMaterial;
  ratio?: string;
  className?: string;
  caption?: React.ReactNode;
  overlay?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)] md:p-10",
        ratio,
        className,
      )}
    >
      {/* subtle floor gradient — engineering studio */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 bottom-4 h-8 rounded-full bg-black/10 blur-2xl"
      />
      <img
        src={PANEL_IMAGES[core]}
        alt={`${core} sandwich panel render`}
        className="relative z-10 max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-[1.02]"
        loading="lazy"
      />
      {overlay}
      {caption && (
        <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-black/50">
          {caption}
        </div>
      )}
    </div>
  );
}

/* --------------------------- Component --------------------------- */

function ProductConfiguratorPage() {
  const [cfg, setCfg] = useState<Config>(DEFAULT_CONFIG);
  const [step, setStep] = useState(0);
  const [view3d, setView3d] = useState<"solid" | "exploded" | "section">("solid");
  const [comparisons, setComparisons] = useState<Config[]>([]);
  const results = useMemo(() => computeResults(cfg), [cfg]);

  const update = <K extends keyof Config>(k: K, v: Config[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  const toggleAccessory = (a: string) =>
    setCfg((c) => ({
      ...c,
      accessories: c.accessories.includes(a)
        ? c.accessories.filter((x) => x !== a)
        : [...c.accessories, a],
    }));

  const addComparison = () => {
    if (comparisons.length < 3) setComparisons([...comparisons, cfg]);
  };

  const steps = [
    "Panel Type",
    "Core",
    "Dimensions",
    "Steel & Coating",
    "Accessories",
    "Results",
  ];

  return (
    <main className="bg-background">
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden border-b border-border bg-[hsl(220_18%_9%)] text-white">
        <div className="container-wide relative py-20 md:py-28">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight className="size-3" />
            <Link to="/solutions/sandwich-panels" className="hover:text-white">Sandwich Panels</Link>
            <ChevronRight className="size-3" />
            <span className="text-accent">Product Configurator</span>
          </nav>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Eyebrow className="text-accent">Engineered to your spec</Eyebrow>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
                Product <span className="text-accent">Configurator</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-white/70">
                Design your sandwich panel to the millimetre. Get instant thermal,
                fire, acoustic and structural results — then request a certified
                quotation from the NEVO engineering team.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-accent text-black hover:bg-accent/90">
                  <a href="#configurator">Start Configuring <ArrowRight className="ml-1 size-4" /></a>
                </Button>
                <Button asChild variant="secondary" size="lg" className="border-white/30 bg-white/5 text-white hover:bg-white/10">
                  <Link to="/project-inquiry">Talk to an Engineer</Link>
                </Button>
              </div>
              <div className="mt-12 grid max-w-3xl grid-cols-2 gap-6 border-t border-white/10 pt-8 md:grid-cols-4">
                {[
                  { k: "100+", v: "Panel options" },
                  { k: "5", v: "Core materials" },
                  { k: "10+", v: "Coating options" },
                  { k: "Global", v: "Certifications" },
                ].map((s) => (
                  <div key={s.v}>
                    <div className="text-2xl font-semibold text-accent md:text-3xl">{s.k}</div>
                    <div className="mt-1 text-xs uppercase tracking-widest text-white/50">{s.v}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white p-8 shadow-[0_40px_120px_-40px_rgba(16,185,129,0.35)] md:p-12"
            >
              <img loading="lazy" decoding="async"
                src={heroImg}
                alt="NEVO sandwich panel — engineering render"
                className="relative z-10 max-h-full max-w-full object-contain"
                width={1920}
                height={1280}
              />
              <div className="absolute left-5 top-5 z-20 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-black/50">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Live spec preview
              </div>
              <div className="absolute bottom-5 right-5 z-20 rounded-full border border-black/10 bg-white/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-black/60 backdrop-blur">
                NEVO-PIR-100 · RAL 9002
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================ CONFIGURATOR ============================ */}
      <section id="configurator" className="border-b border-border bg-[hsl(220_18%_7%)] text-white">
        <div className="container-wide py-16 md:py-24">
          <SectionHeader
            eyebrow="Configure. Calculate. Confirm."
            title={<span className="text-white">Design your perfect sandwich panel</span>}
            lede={<span className="text-white/60">Every choice updates the technical results in real time.</span>}
            onTone="primary"
          />

          {/* Stepper */}
          <div className="mb-8 flex flex-wrap items-center gap-2 md:gap-4">
            {steps.map((label, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <button
                  key={label}
                  onClick={() => setStep(i)}
                  className={cn(
                    "group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition md:text-sm",
                    active
                      ? "border-accent bg-accent text-black"
                      : done
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-white/15 text-white/60 hover:border-white/30 hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold",
                      active ? "bg-black text-accent" : done ? "bg-accent text-black" : "bg-white/10",
                    )}
                  >
                    {done ? <Check className="size-3" /> : i + 1}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Main configuration area */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
              {step === 0 && (
                <StepPanelType
                  selected={cfg.panelType}
                  onSelect={(v) => update("panelType", v)}
                  core={cfg.core}
                />
              )}
              {step === 1 && (
                <StepCore selected={cfg.core} onSelect={(v) => update("core", v)} />
              )}
              {step === 2 && <StepDimensions cfg={cfg} update={update} />}
              {step === 3 && <StepSteel cfg={cfg} update={update} />}
              {step === 4 && (
                <StepAccessories
                  selected={cfg.accessories}
                  onToggle={toggleAccessory}
                  core={cfg.core}
                />
              )}
              {step === 5 && <StepResults results={results} cfg={cfg} />}

              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                <Button
                  variant="ghost"
                  onClick={() => setStep(Math.max(0, step - 1))}
                  disabled={step === 0}
                  className="text-white/70 hover:bg-white/5 hover:text-white"
                >
                  ← Back
                </Button>
                {step < 5 ? (
                  <Button
                    onClick={() => setStep(Math.min(5, step + 1))}
                    className="bg-accent text-black hover:bg-accent/90"
                  >
                    Next Step <ArrowRight className="ml-1 size-4" />
                  </Button>
                ) : (
                  <Button asChild className="bg-accent text-black hover:bg-accent/90">
                    <a href="#quote">Request Quotation</a>
                  </Button>
                )}
              </div>
            </div>

            {/* Sidebar summary */}
            <aside className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-white/60">
                    Quick Summary
                  </h3>
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                    Live
                  </span>
                </div>
                <dl className="space-y-3 text-sm">
                  <Row label="Panel Type" value={PANEL_TYPES.find((p) => p.id === cfg.panelType)!.label} />
                  <Row label="Core Material" value={cfg.core} />
                  <Row label="Thickness" value={`${cfg.thickness} mm`} />
                  <Row label="Width" value={`${cfg.width} mm`} />
                  <Row label="Length" value={`Up to ${cfg.length} m`} />
                  <Row label="Steel Ext." value={`${cfg.extSteel} mm`} />
                  <Row label="Steel Int." value={`${cfg.intSteel} mm`} />
                  <Row label="Coating" value={`${cfg.coating} / ${cfg.color}`} />
                  <div className="my-3 border-t border-white/10" />
                  <Row label="U-Value" value={`${results.uValue} W/m²K`} accent />
                  <Row label="Fire Rating" value={results.fireRating} accent />
                  <Row label="Weight" value={`${results.weight} kg/m²`} accent />
                </dl>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-white/60">
                  Built to Global Standards
                </h3>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center text-[10px] uppercase tracking-wider text-white/60">
                  {["EN", "ASTM", "ISO", "FM", "UL", "CE"].map((s) => (
                    <div
                      key={s}
                      className="rounded-lg border border-white/10 bg-black/40 py-3 font-semibold text-white/80"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ============================ 3D PREVIEW ============================ */}
      <section className="border-b border-border bg-[hsl(220_18%_9%)] text-white">
        <div className="container-wide py-16 md:py-24">
          <SectionHeader
            eyebrow="Live Panel Preview"
            title={<span className="text-white">Inspect the exact panel you built</span>}
            lede={<span className="text-white/60">Studio-lit engineering renders. Update your spec — the preview updates instantly.</span>}
            onTone="primary"
          />
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <PanelStudio
              core={cfg.core}
              ratio="aspect-[16/10]"
              className={cn(
                "transition-all duration-700",
                view3d === "exploded" && "shadow-[0_50px_120px_-30px_rgba(16,185,129,0.35)]",
                view3d === "section" && "saturate-[.4]",
              )}
              caption={
                <>
                  <span>{cfg.core} · {cfg.thickness} mm · {cfg.color}</span>
                  <span>NEVO INDUSTRIAL · DUBAI</span>
                </>
              }
              overlay={
                <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
                  {[
                    { id: "solid", icon: RotateCw, label: "Rotate" },
                    { id: "exploded", icon: Move3d, label: "Explode" },
                    { id: "section", icon: Scissors, label: "Section" },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setView3d(v.id as typeof view3d)}
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full border backdrop-blur transition",
                        view3d === v.id
                          ? "border-accent bg-accent text-black"
                          : "border-black/10 bg-white/80 text-black/60 hover:text-black",
                      )}
                      aria-label={v.label}
                    >
                      <v.icon className="size-4" />
                    </button>
                  ))}
                </div>
              }
            />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {[
                { icon: RotateCw, label: "Rotate", hint: "Drag to orbit" },
                { icon: ZoomIn, label: "Zoom", hint: "Scroll / pinch" },
                { icon: Move3d, label: "Exploded View", hint: "Separate layers" },
                { icon: Ruler, label: "Measure", hint: "Real dimensions" },
                { icon: Scissors, label: "Cross Section", hint: "Cut through core" },
                { icon: RefreshCw, label: "Reset", hint: "Default view" },
              ].map((t) => (
                <div
                  key={t.label}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <t.icon className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.label}</div>
                    <div className="text-xs text-white/50">{t.hint}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Material selector — 5 studio thumbnails, always visible */}
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
              <span>Core material library</span>
              <span>{cfg.core} selected</span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {CORES.map((c) => {
                const active = c.id === cfg.core;
                return (
                  <button
                    key={c.id}
                    onClick={() => update("core", c.id)}
                    className={cn(
                      "group flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] transition",
                      active
                        ? "border-accent ring-2 ring-accent/40"
                        : "border-black/5 hover:-translate-y-0.5",
                    )}
                  >
                    <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-white p-3">
                      <img
                        src={PANEL_IMAGES[c.id]}
                        alt={`${c.id} panel render`}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="border-t border-black/5 bg-white px-3 py-2.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-black">
                        {c.id}
                        {active && <Check className="size-3.5 text-accent" />}
                      </div>
                      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-black/40">
                        λ {c.lambda} · {c.fire}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============================ TECHNICAL RESULTS ============================ */}
      <Section tone="surface">
        <SectionHeader
          eyebrow="Technical Performance"
          title="Instant results based on your configuration"
          lede="Every specification is calculated against European and international engineering standards."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ResultCard
            icon={Thermometer}
            title="Thermal"
            value={`${results.uValue} W/m²K`}
            hint={`U-Value · ${results.thermalScore}`}
          />
          <ResultCard icon={Flame} title="Fire" value={results.fireRating} hint={`EN 13501-1 class`} />
          <ResultCard
            icon={Volume2}
            title="Acoustic"
            value={`${results.sound} dB`}
            hint="Sound insulation Rw"
          />
          <ResultCard
            icon={Package}
            title="Panel Weight"
            value={`${results.weight} kg/m²`}
            hint="Nominal loaded weight"
          />
          <ResultCard
            icon={Layers}
            title="Core Density"
            value={`${results.coreDensity} kg/m³`}
            hint={`${cfg.core} insulation core`}
          />
          <ResultCard
            icon={Shield}
            title="Recommended Use"
            value={results.application}
            hint="Best-suited applications"
            wide
          />
        </div>
      </Section>

      {/* ============================ COMPARISON ============================ */}
      <Section>
        <SectionHeader
          eyebrow="Compare Configurations"
          title="Compare up to three panel options side-by-side"
          lede="Save your current configuration and stack alternatives to weigh thermal, fire and cost trade-offs."
          aside={
            <Button
              onClick={addComparison}
              disabled={comparisons.length >= 3}
              className="bg-accent text-primary hover:bg-accent/90"
            >
              <Plus className="mr-1 size-4" /> Add Current Config
            </Button>
          }
        />
        {comparisons.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-surface p-12 text-center">
            <p className="text-muted-foreground">
              No configurations saved yet. Add the current build to start comparing.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {comparisons.map((c, i) => {
              const r = computeResults(c);
              return (
                <div key={i} className="relative overflow-hidden rounded-3xl border border-border bg-surface">
                  <div className="relative flex aspect-[4/3] items-center justify-center bg-white p-6">
                    <img
                      src={PANEL_IMAGES[c.core]}
                      alt={`${c.core} panel`}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                    <button
                      onClick={() => setComparisons(comparisons.filter((_, x) => x !== i))}
                      className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full border border-black/10 bg-white text-black/60 hover:text-black"
                      aria-label="Remove"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <div className="border-t border-border p-6">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      Option {i + 1}
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      {c.core} · {c.thickness} mm
                    </div>
                    <dl className="mt-4 space-y-2.5 text-sm">
                      <Row label="U-Value" value={`${r.uValue} W/m²K`} light />
                      <Row label="Fire Rating" value={r.fireRating} light />
                      <Row label="Weight" value={`${r.weight} kg/m²`} light />
                      <Row label="Sound" value={`${r.sound} dB`} light />
                      <Row label="Thermal" value={r.thermalScore} light />
                    </dl>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ============================ EXPORT ============================ */}
      <Section tone="surface">
        <SectionHeader
          eyebrow="Export & Request"
          title="Download or send your configuration"
          lede="Everything you need to specify NEVO panels in your project."
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: FileText, label: "Download Datasheet (PDF)" },
              { icon: Ruler, label: "Download Technical Drawing (DWG)" },
              { icon: Package, label: "Download 3D Model (STEP)" },
              { icon: Layers, label: "Download BIM Model (IFC)" },
              { icon: Share2, label: "Share Configuration Link" },
              { icon: Download, label: "Print Specification Sheet" },
            ].map((e) => (
              <button
                key={e.label}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 text-left transition hover:border-accent hover:shadow-sm"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <e.icon className="size-4" />
                </div>
                <span className="text-sm font-medium">{e.label}</span>
              </button>
            ))}
          </div>

          {/* Engineering-style datasheet card — clean, white, monospaced */}
          <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-black/50">
              <span>Datasheet · NEVO-{cfg.core.replace(/\s/g, "").toUpperCase()}-{cfg.thickness}</span>
              <span>REV 01</span>
            </div>
            <div className="relative flex aspect-[4/3] items-center justify-center bg-white p-6">
              <img
                src={PANEL_IMAGES[cfg.core]}
                alt="Datasheet preview"
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-black/5 px-5 py-4 font-mono text-[11px]">
              <div className="flex justify-between text-black/60"><span>U-VALUE</span><span className="text-black">{results.uValue}</span></div>
              <div className="flex justify-between text-black/60"><span>FIRE</span><span className="text-black">{results.fireRating}</span></div>
              <div className="flex justify-between text-black/60"><span>WEIGHT</span><span className="text-black">{results.weight}</span></div>
              <div className="flex justify-between text-black/60"><span>Rw</span><span className="text-black">{results.sound} dB</span></div>
            </dl>
          </div>
        </div>
      </Section>

      {/* ============================ QUOTE FORM ============================ */}
      <section id="quote" className="border-b border-border bg-[hsl(220_18%_7%)] text-white">
        <div className="container-wide py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <Eyebrow className="text-accent">Request a Quotation</Eyebrow>
              <h2 className="mt-6 text-3xl font-semibold md:text-5xl">
                Send your configuration to the <span className="text-accent">NEVO engineering team</span>
              </h2>
              <p className="mt-6 max-w-lg text-white/70">
                We reply within one business day with pricing, lead time, technical
                validation and shipping options for your delivery country.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Reviewed by senior industrial engineers",
                  "Certified datasheets and drawings included",
                  "Global logistics from Dubai — EU, GCC, Africa, Asia",
                ].map((b) => (
                  <div key={b} className="flex items-start gap-3 text-sm text-white/80">
                    <Check className="mt-0.5 size-4 text-accent" />
                    {b}
                  </div>
                ))}
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button asChild variant="secondary" size="lg" className="border-white/30 bg-white/5 text-white hover:bg-white/10">
                  <Link to="/project-inquiry"><MessageCircle className="mr-2 size-4" /> Talk to an Engineer</Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="text-white/70 hover:bg-white/5 hover:text-white">
                  <Link to="/knowledge-hub">Read Engineering Notes</Link>
                </Button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Configuration sent — our engineers will be in touch shortly.");
              }}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full Name" name="name" required />
                <Field label="Company" name="company" required />
                <Field label="Country" name="country" required />
                <Field label="Email" name="email" type="email" required />
                <Field label="Phone / WhatsApp" name="phone" />
                <Field label="Project Type" name="projectType" placeholder="Warehouse, cold room, factory…" />
                <Field label="Quantity (m²)" name="quantity" type="number" />
                <Field label="Delivery Country" name="delivery" />
              </div>
              <div className="mt-4">
                <label className="text-xs font-medium uppercase tracking-widest text-white/60">
                  Selected Configuration
                </label>
                <div className="mt-2 rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
                  <div>
                    <span className="text-white/50">Panel:</span>{" "}
                    {PANEL_TYPES.find((p) => p.id === cfg.panelType)!.label} · {cfg.core} · {cfg.thickness}mm
                  </div>
                  <div className="mt-1">
                    <span className="text-white/50">Size:</span> {cfg.width}mm × {cfg.length}m ·{" "}
                    {cfg.joint}
                  </div>
                  <div className="mt-1">
                    <span className="text-white/50">Steel:</span> {cfg.extSteel}/{cfg.intSteel}mm ·{" "}
                    {cfg.coating} {cfg.color}
                  </div>
                  <div className="mt-1">
                    <span className="text-white/50">Results:</span> U={results.uValue} W/m²K · Fire{" "}
                    {results.fireRating} · {results.weight} kg/m²
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs font-medium uppercase tracking-widest text-white/60">
                  Message
                </label>
                <textarea
                  name="message"
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
                  placeholder="Tell us about your project, timeline and priorities…"
                />
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-white/50">By submitting you agree to our privacy policy.</p>
                <Button type="submit" size="lg" className="bg-accent text-black hover:bg-accent/90">
                  Send Quotation Request <ArrowRight className="ml-1 size-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ============================ FOOTER STRIP ============================ */}
      <Section>
        <div className="grid gap-8 rounded-3xl border border-border bg-surface p-8 md:grid-cols-[1.2fr_1fr] md:p-12">
          <div>
            <Eyebrow>One configurator. Endless possibilities.</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold md:text-4xl">
              From standard to highly specialised panels — configure exactly what
              your project needs.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { icon: Wrench, label: "Engineers" },
              { icon: Package, label: "Contractors" },
              { icon: Shield, label: "Building Owners" },
              { icon: Globe, label: "Distributors" },
            ].map((a) => (
              <div key={a.label} className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
                <a.icon className="size-4 text-accent" />
                <span className="font-medium">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </main>
  );
}

/* --------------------------- Sub-components --------------------------- */

function Row({
  label,
  value,
  accent,
  light,
}: {
  label: string;
  value: string;
  accent?: boolean;
  light?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={cn("text-xs uppercase tracking-widest", light ? "text-muted-foreground" : "text-white/50")}>
        {label}
      </dt>
      <dd
        className={cn(
          "text-right text-sm font-medium",
          light ? "text-foreground" : "text-white",
          accent && "text-accent",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-xs font-medium uppercase tracking-widest text-white/60">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
      />
    </div>
  );
}

function ResultCard({
  icon: Icon,
  title,
  value,
  hint,
  wide,
}: {
  icon: typeof Shield;
  title: string;
  value: string;
  hint: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-background p-6 transition hover:border-accent/50 hover:shadow-md",
        wide && "md:col-span-2 lg:col-span-3",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon className="size-4" />
        </div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{title}</div>
      </div>
      <div className="mt-4 text-2xl font-semibold md:text-3xl">{value}</div>
      <div className="mt-2 text-sm text-muted-foreground">{hint}</div>
    </div>
  );
}

/* --------------------------- Steps --------------------------- */

function StepPanelType({
  selected,
  onSelect,
  core,
}: {
  selected: PanelType;
  onSelect: (v: PanelType) => void;
  core: CoreMaterial;
}) {
  return (
    <div>
      <StepHeader n={1} title="Panel Type" desc="Choose the type of panel that fits your application." />
      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <PanelStudio core={core} ratio="aspect-[4/3]" />
        <div className="space-y-2">
          {PANEL_TYPES.map((p) => {
            const active = p.id === selected;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition",
                  active
                    ? "border-accent bg-accent/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg",
                    active ? "bg-accent text-black" : "bg-white/10 text-white/70",
                  )}
                >
                  <p.icon className="size-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{p.label}</div>
                  <div className="text-xs text-white/50">{p.desc}</div>
                </div>
                {active && <Check className="size-4 text-accent" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepCore({
  selected,
  onSelect,
}: {
  selected: CoreMaterial;
  onSelect: (v: CoreMaterial) => void;
}) {
  return (
    <div>
      <StepHeader n={2} title="Core Material" desc="Select the core material — each has its own dedicated studio render." />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {CORES.map((c) => {
          const active = c.id === selected;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "group flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-[0_25px_60px_-30px_rgba(0,0,0,0.55)] transition",
                active
                  ? "border-accent ring-2 ring-accent/40"
                  : "border-black/5 hover:-translate-y-0.5",
              )}
            >
              <div className="relative flex aspect-[4/3] items-center justify-center bg-white p-4">
                <img
                  src={PANEL_IMAGES[c.id]}
                  alt={`${c.id} sandwich panel render`}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="border-t border-black/5 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-black">{c.id}</span>
                  {active && <Check className="size-4 text-accent" />}
                </div>
                <p className="mt-1 text-xs text-black/50">{c.desc}</p>
                <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-black/50">
                  <span>λ {c.lambda} W/mK</span>
                  <span>Fire {c.fire}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDimensions({
  cfg,
  update,
}: {
  cfg: Config;
  update: <K extends keyof Config>(k: K, v: Config[K]) => void;
}) {
  return (
    <div>
      <StepHeader n={3} title="Dimensions" desc="Define the exact dimensions of your panel." />
      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="grid gap-6 md:grid-cols-2">
          <SliderField
            label="Thickness (mm)"
            value={cfg.thickness}
            min={40}
            max={250}
            step={10}
            onChange={(v) => update("thickness", v)}
          />
          <SliderField
            label="Width (mm)"
            value={cfg.width}
            min={600}
            max={1200}
            step={50}
            onChange={(v) => update("width", v)}
          />
          <SliderField
            label="Length (m)"
            value={cfg.length}
            min={2}
            max={16}
            step={0.5}
            onChange={(v) => update("length", v)}
          />
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-white/60">
              Joint Type
            </label>
            <select
              value={cfg.joint}
              onChange={(e) => update("joint", e.target.value as JointType)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white focus:border-accent focus:outline-none"
            >
              {JOINTS.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
        </div>
        <PanelStudio
          core={cfg.core}
          ratio="aspect-[4/3]"
          caption={
            <>
              <span>{cfg.thickness} × {cfg.width} mm · {cfg.length} m</span>
              <span>{cfg.joint}</span>
            </>
          }
        />
      </div>
    </div>
  );
}

function StepSteel({
  cfg,
  update,
}: {
  cfg: Config;
  update: <K extends keyof Config>(k: K, v: Config[K]) => void;
}) {
  return (
    <div>
      <StepHeader n={4} title="Steel & Coating" desc="Select steel type and coating for each side." />
      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <SliderField
              label="Exterior Steel (mm)"
              value={cfg.extSteel}
              min={0.4}
              max={0.8}
              step={0.05}
              onChange={(v) => update("extSteel", +v.toFixed(2))}
            />
            <SliderField
              label="Interior Steel (mm)"
              value={cfg.intSteel}
              min={0.4}
              max={0.8}
              step={0.05}
              onChange={(v) => update("intSteel", +v.toFixed(2))}
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-white/60">
              Coating Type
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {COATINGS.map((c) => {
                const active = cfg.coating === c;
                return (
                  <button
                    key={c}
                    onClick={() => update("coating", c)}
                    className={cn(
                      "rounded-xl border py-3 text-sm font-medium transition",
                      active
                        ? "border-accent bg-accent text-black"
                        : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20",
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/60">
              <Palette className="size-3.5" /> Color
            </label>
            <div className="mt-2 grid grid-cols-6 gap-2">
              {COLOR_SWATCHES.map((c) => {
                const active = cfg.color === c.ral;
                return (
                  <button
                    key={c.ral}
                    onClick={() => update("color", c.ral)}
                    title={c.ral}
                    className={cn(
                      "aspect-square rounded-xl border-2 transition",
                      active ? "border-accent scale-105" : "border-white/10 hover:border-white/30",
                    )}
                    style={{ background: c.hex }}
                    aria-label={c.ral}
                  />
                );
              })}
            </div>
            <div className="mt-2 text-xs text-white/60">Selected: {cfg.color}</div>
          </div>
        </div>
        <PanelStudio
          core={cfg.core}
          ratio="aspect-[4/5]"
          caption={
            <>
              <span>{cfg.coating}</span>
              <span>{cfg.color}</span>
            </>
          }
        />
      </div>
    </div>
  );
}

function StepAccessories({
  selected,
  onToggle,
  core,
}: {
  selected: string[];
  onToggle: (a: string) => void;
  core: CoreMaterial;
}) {
  const items = ["Flashings", "Sealants", "Fasteners", "Ventilation", "Skylights", "Others"];
  return (
    <div>
      <StepHeader n={5} title="Accessories" desc="Add finishing accessories and system components." />
      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <div className="grid grid-cols-2 gap-3">
          {items.map((a) => {
            const active = selected.includes(a);
            return (
              <button
                key={a}
                onClick={() => onToggle(a)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border p-4 text-left transition",
                  active
                    ? "border-accent bg-accent/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20",
                )}
              >
                <span className="text-sm font-medium">{a}</span>
                {active ? (
                  <Check className="size-4 text-accent" />
                ) : (
                  <Plus className="size-4 text-white/40" />
                )}
              </button>
            );
          })}
        </div>
        <PanelStudio core={core} ratio="aspect-[4/3]" />
      </div>
    </div>
  );
}

function StepResults({
  results,
  cfg,
}: {
  results: ReturnType<typeof computeResults>;
  cfg: Config;
}) {
  return (
    <div>
      <StepHeader n={6} title="Results" desc="Review full technical results and confirm your specification." />
      <div className="grid gap-4 md:grid-cols-3">
        <MiniResult label="U-Value" value={`${results.uValue} W/m²K`} />
        <MiniResult label="Fire Rating" value={results.fireRating} />
        <MiniResult label="Sound Insulation" value={`${results.sound} dB`} />
        <MiniResult label="Panel Weight" value={`${results.weight} kg/m²`} />
        <MiniResult label="Core Density" value={`${results.coreDensity} kg/m³`} />
        <MiniResult label="Thermal Score" value={results.thermalScore} />
      </div>
      <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-6">
        <div className="text-xs uppercase tracking-widest text-accent">Recommended Application</div>
        <div className="mt-2 text-lg font-medium text-white">{results.application}</div>
        <div className="mt-1 text-sm text-white/60">
          Based on {cfg.core} core at {cfg.thickness}mm with {cfg.coating} finish.
        </div>
      </div>
      <div className="mt-6">
        <PanelStudio
          core={cfg.core}
          ratio="aspect-[16/9]"
          caption={
            <>
              <span>NEVO-{cfg.core.replace(/\s/g, "").toUpperCase()}-{cfg.thickness} · {cfg.color}</span>
              <span>U {results.uValue} · Fire {results.fireRating}</span>
            </>
          }
        />
      </div>
    </div>
  );
}

function MiniResult({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-[10px] uppercase tracking-widest text-white/50">{label}</div>
      <div className="mt-2 text-xl font-semibold text-accent">{value}</div>
    </div>
  );
}

function StepHeader({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-black">
          {n}
        </span>
        <h3 className="text-xl font-semibold md:text-2xl">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-white/60">{desc}</p>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-widest text-white/60">
          {label}
        </label>
        <span className="text-sm font-semibold text-accent">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="mt-3 w-full accent-[hsl(var(--accent))]"
      />
      <div className="mt-1 flex justify-between text-[10px] text-white/40">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
