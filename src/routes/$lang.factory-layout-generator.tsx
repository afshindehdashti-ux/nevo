import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Boxes,
  Building2,
  ChevronRight,
  Download,
  Factory,
  FileText,
  Layers,
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
  Maximize2,
  Eye,
  CheckCircle2,
  X,
  Info,
  ClipboardList,
  CalendarClock,
  Route as RouteIcon,
  Flame,
  Activity,
  Radar,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { buildSeo, orgJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import {
  AUTOMATIONS,
  BUILDINGS,
  CAPACITIES,
  CAPACITY_SPEC,
  CORES,
  SHIFTS,
  type Automation,
  type Building,
  type Capacity,
  type Core,
  type Shift,
  type Zone,
  computeEquipment,
  computeFactoryLayout,
  computeTechData,
  expansionRecommendation,
  formatRange,
  recommendedBuildingCopy,
  zoneFill,
} from "@/lib/factory-layout";

type ViewMode =
  | "top"
  | "iso"
  | "material"
  | "truck"
  | "operator"
  | "utility"
  | "expansion"
  | "equipment";

const VIEW_MODES: {
  id: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "top", label: "Top View", icon: Scan },
  { id: "iso", label: "3D / Iso", icon: Boxes },
  { id: "material", label: "Material Flow", icon: ArrowRight },
  { id: "truck", label: "Truck Flow", icon: Truck },
  { id: "operator", label: "Operator Flow", icon: Users },
  { id: "utility", label: "Utility Layout", icon: Zap },
  { id: "expansion", label: "Expansion", icon: Maximize2 },
  { id: "equipment", label: "Highlight Equipment", icon: Eye },
];

const FLOW_STYLES = {
  material: { stroke: "#34d399", label: "Material" },
  truck: { stroke: "#fb923c", label: "Truck" },
  operator: { stroke: "#e5e7eb", label: "Operator" },
  utility: { stroke: "#facc15", label: "Utility" },
  finished: { stroke: "#3b82f6", label: "Finished" },
} as const;

export const Route = createFileRoute("/$lang/factory-layout-generator")({
  component: FactoryLayoutPage,
  head: ({ params }) => {
    const seo = buildSeo({
      lang: params.lang,
      title: "Factory Layout Generator — Sandwich Panel Factory Design | NEVO",
      description:
        "Interactive engineering tool. Choose capacity, core, automation and building configuration — see the factory layout, flows, equipment, utilities and area requirements update live.",
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
      ],
    };
  },
});

// ─── Small UI primitives ────────────────────────────────────────────────
function Chip({
  children,
  tone = "emerald",
}: {
  children: React.ReactNode;
  tone?: "emerald" | "graphite" | "amber";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : tone === "amber"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
        : "border-white/10 bg-white/5 text-white/70";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono uppercase tracking-widest ${cls}`}
    >
      {children}
    </span>
  );
}

function StepPill({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 font-mono text-[11px] font-bold text-black">
        {n}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
        {label}
      </span>
    </div>
  );
}

function Select<T extends string | number>({
  value,
  options,
  onChange,
  format,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
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

// ─── SVG Layout Renderer ───────────────────────────────────────────────
function LayoutSVG({
  cfg,
  view,
  onZoneSelect,
  selectedZoneId,
  isoTilt = false,
  hiddenZones,
}: {
  cfg: { capacity: Capacity; core: Core; automation: Automation; building: Building };
  view: ViewMode;
  onZoneSelect: (z: Zone) => void;
  selectedZoneId?: string;
  isoTilt?: boolean;
  hiddenZones: Set<string>;
}) {
  const layout = useMemo(() => computeFactoryLayout(cfg), [cfg]);
  const visibleZones = useMemo(
    () => layout.zones.filter((z) => !hiddenZones.has(z.id)),
    [layout.zones, hiddenZones],
  );

  // Which flow categories are visible for this view mode.
  const visibleFlows = useMemo(() => {
    if (view === "material") return new Set(["material", "finished"]);
    if (view === "truck") return new Set(["truck"]);
    if (view === "operator") return new Set(["operator"]);
    if (view === "utility") return new Set(["utility"]);
    if (view === "top" || view === "iso" || view === "expansion" || view === "equipment")
      return new Set(["material", "truck"]);
    return new Set<string>();
  }, [view]);

  const dimHighlight =
    view === "equipment"
      ? (z: Zone) =>
          z.category !== "production" &&
          z.category !== "cutting" &&
          z.category !== "stacking" &&
          z.category !== "packaging"
      : () => false;

  const expansionEmphasis = view === "expansion";

  return (
    <svg
      viewBox={`0 0 ${layout.viewW} ${layout.viewH}`}
      className="h-full w-full"
      role="img"
      aria-label="Live factory layout"
      style={
        isoTilt
          ? {
              transform: "perspective(1600px) rotateX(38deg) rotateZ(-6deg) scale(0.92)",
              transformOrigin: "50% 60%",
              transition: "transform 0.4s ease",
            }
          : { transition: "transform 0.4s ease" }
      }
    >
      <defs>
        {(Object.keys(FLOW_STYLES) as Array<keyof typeof FLOW_STYLES>).map((k) => (
          <marker
            key={k}
            id={`arrow-${k}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={FLOW_STYLES[k].stroke} />
          </marker>
        ))}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        </pattern>
        <pattern id="gridMinor" width="10" height="10" patternUnits="userSpaceOnUse">
          <path
            d="M 10 0 L 0 0 0 10"
            fill="none"
            stroke="rgba(255,255,255,0.02)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>

      {/* Site background + grid */}
      <rect x={0} y={0} width={layout.viewW} height={layout.viewH} fill="#07090b" />
      <rect x={0} y={0} width={layout.viewW} height={layout.viewH} fill="url(#gridMinor)" />
      <rect x={0} y={0} width={layout.viewW} height={layout.viewH} fill="url(#grid)" />

      {/* Site outline (property line) */}
      <rect
        x={20}
        y={40}
        width={layout.viewW - 40}
        height={layout.viewH - 60}
        fill="none"
        stroke="rgba(52,211,153,0.35)"
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />
      <text x={30} y={34} className="font-mono" fontSize={10} fill="rgba(52,211,153,0.6)">
        SITE BOUNDARY
      </text>

      {/* Road */}
      <rect
        x={layout.road.x}
        y={layout.road.y}
        width={layout.road.w}
        height={layout.road.h}
        fill="#1a1d21"
      />
      <line
        x1={layout.road.x}
        y1={layout.road.y + layout.road.h / 2}
        x2={layout.road.x + layout.road.w}
        y2={layout.road.y + layout.road.h / 2}
        stroke="rgba(250,204,21,0.5)"
        strokeWidth={1}
        strokeDasharray="10 8"
      />
      <text
        x={layout.road.x + 8}
        y={layout.road.y + layout.road.h - 8}
        className="font-mono"
        fontSize={9}
        fill="rgba(255,255,255,0.35)"
      >
        SITE ACCESS ROAD
      </text>

      {/* Building envelope */}
      <motion.rect
        animate={{
          x: layout.building.x - 4,
          y: layout.building.y - 4,
          width: layout.building.w + 8,
          height: layout.building.h + 8,
        }}
        transition={{ type: "spring", damping: 24, stiffness: 180 }}
        fill="rgba(15,23,42,0.7)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.5}
      />
      <AnimatePresence>
        {layout.hall2 && (
          <motion.rect
            key="hall2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: layout.hall2.x - 4,
              y: layout.hall2.y - 4,
              width: layout.hall2.w + 8,
              height: layout.hall2.h + 8,
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 24, stiffness: 180 }}
            fill="rgba(15,23,42,0.7)"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1.5}
          />
        )}
        {layout.expansion && (
          <motion.rect
            key="expansion"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: layout.expansion.x - 4,
              y: layout.expansion.y - 4,
              width: layout.expansion.w + 8,
              height: layout.expansion.h + 8,
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 24, stiffness: 180 }}
            fill={expansionEmphasis ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.05)"}
            stroke="#10b981"
            strokeWidth={expansionEmphasis ? 2.5 : 1.5}
            strokeDasharray="8 6"
          />
        )}
      </AnimatePresence>

      {/* Zones — every rect is React state driven; capacity/core/automation/building
          buttons re-run computeFactoryLayout(cfg) which re-emits x/y/w/h that
          motion.rect springs to. Hidden zones drop out via AnimatePresence. */}
      <AnimatePresence>
        {visibleZones.map((z) => {
          const isSelected = z.id === selectedZoneId;
          const dim = dimHighlight(z);
          return (
            <motion.g
              key={z.id}
              onClick={() => onZoneSelect(z)}
              style={{ cursor: "pointer" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: dim ? 0.25 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <motion.rect
                animate={{ x: z.x, y: z.y, width: z.w, height: z.h }}
                transition={{ type: "spring", damping: 26, stiffness: 220 }}
                fill={zoneFill(z.category)}
                fillOpacity={z.dashed ? 0.15 : 0.85}
                stroke={isSelected ? "#fde047" : "rgba(255,255,255,0.35)"}
                strokeWidth={isSelected ? 2.5 : 1}
                strokeDasharray={z.dashed ? "6 4" : undefined}
                rx={4}
              />
              {z.w > 60 && z.h > 26 && (
                <motion.text
                  animate={{ x: z.x + z.w / 2, y: z.y + z.h / 2 + 4 }}
                  transition={{ type: "spring", damping: 26, stiffness: 220 }}
                  className="font-mono"
                  textAnchor="middle"
                  fontSize={Math.min(12, Math.max(9, z.w / 10))}
                  fill="white"
                  pointerEvents="none"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
                >
                  {z.short}
                </motion.text>
              )}
            </motion.g>
          );
        })}
      </AnimatePresence>

      {/* Flows */}
      {layout.flows
        .filter((f) => visibleFlows.has(f.category))
        .map((f, i) => {
          const s = FLOW_STYLES[f.category];
          return (
            <g key={i}>
              <path
                d={f.d}
                fill="none"
                stroke={s.stroke}
                strokeWidth={f.category === "truck" ? 3 : 2.5}
                strokeDasharray={f.category === "operator" ? "4 4" : undefined}
                markerEnd={`url(#arrow-${f.category})`}
                opacity={0.9}
              />
            </g>
          );
        })}

      {/* Scale bar */}
      <g transform={`translate(${layout.viewW - 220}, ${layout.viewH - 30})`}>
        <line x1={0} y1={0} x2={100} y2={0} stroke="white" strokeWidth={2} />
        <line x1={0} y1={-5} x2={0} y2={5} stroke="white" strokeWidth={2} />
        <line x1={100} y1={-5} x2={100} y2={5} stroke="white" strokeWidth={2} />
        <text x={50} y={-8} textAnchor="middle" fontSize={10} fill="white" className="font-mono">
          ≈ {layout.gridDimM} m
        </text>
      </g>

      {/* HUD */}
      <g transform={`translate(30, ${layout.viewH - 30})`}>
        <text fontSize={10} fill="rgba(255,255,255,0.5)" className="font-mono">
          {cfg.capacity.toLocaleString()} m²/day · {cfg.core} · {cfg.automation} · {cfg.building}
        </text>
      </g>
    </svg>
  );
}

// ─── Zone details drawer ───────────────────────────────────────────────
function ZoneDrawer({ zone, onClose }: { zone: Zone | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {zone && (
        <motion.div
          key="drawer"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 260 }}
          className="pointer-events-auto fixed right-4 top-24 z-40 w-[320px] rounded-2xl border border-white/10 bg-black/90 p-5 shadow-2xl backdrop-blur"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div
                className="mb-1.5 inline-flex h-2 w-2 rounded-full"
                style={{ background: zoneFill(zone.category) }}
              />
              <div className="text-sm font-semibold text-white">{zone.name}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs leading-relaxed text-white/70">{zone.fn}</p>
          <dl className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between border-t border-white/5 pt-2">
              <dt className="text-white/50">Approx. area</dt>
              <dd className="font-mono text-white">{zone.approxAreaM2.toLocaleString()} m²</dd>
            </div>
            <div className="border-t border-white/5 pt-2">
              <dt className="mb-1.5 text-white/50">Related equipment</dt>
              <dd className="flex flex-wrap gap-1.5">
                {zone.equipment.map((e) => (
                  <span
                    key={e}
                    className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/70"
                  >
                    {e}
                  </span>
                ))}
              </dd>
            </div>
            {zone.notes && (
              <div className="border-t border-white/5 pt-2">
                <dt className="mb-1 text-white/50">Notes</dt>
                <dd className="text-white/70">{zone.notes}</dd>
              </div>
            )}
          </dl>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Legend ────────────────────────────────────────────────────────────
function FlowLegend({ view }: { view: ViewMode }) {
  const rows: Array<{ k: keyof typeof FLOW_STYLES; visible: boolean }> = [
    {
      k: "material",
      visible:
        view === "material" ||
        view === "top" ||
        view === "iso" ||
        view === "equipment" ||
        view === "expansion",
    },
    {
      k: "truck",
      visible: view === "truck" || view === "top" || view === "iso" || view === "expansion",
    },
    { k: "operator", visible: view === "operator" },
    { k: "utility", visible: view === "utility" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-white/10 bg-black/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white/50">
      {rows.map(({ k, visible }) => (
        <span key={k} className={`inline-flex items-center gap-1.5 ${visible ? "" : "opacity-30"}`}>
          <span className="h-[3px] w-6" style={{ background: FLOW_STYLES[k].stroke }} />
          {FLOW_STYLES[k].label}
        </span>
      ))}
      <span className="ml-auto inline-flex items-center gap-1.5 opacity-70">
        <span
          className="h-3 w-3 rounded border border-emerald-400"
          style={{ background: "rgba(16,185,129,0.15)", borderStyle: "dashed" }}
        />
        Expansion
      </span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────
type MobileTab = "inputs" | "layout" | "flow" | "data" | "equipment" | "cta";
const MOBILE_TABS: { id: MobileTab; label: string }[] = [
  { id: "inputs", label: "Inputs" },
  { id: "layout", label: "Layout" },
  { id: "flow", label: "Flow" },
  { id: "data", label: "Data" },
  { id: "equipment", label: "Equipment" },
  { id: "cta", label: "Request" },
];

function FactoryLayoutPage() {
  const [capacity, setCapacity] = useState<Capacity>(8000);
  const [core, setCore] = useState<Core>("PIR");
  const [automation, setAutomation] = useState<Automation>("Fully Automatic");
  const [building, setBuilding] = useState<Building>("Expansion Ready");
  const [shift, setShift] = useState<Shift>("2 Shifts");
  const [view, setView] = useState<ViewMode>("top");
  const [zone, setZone] = useState<Zone | null>(null);
  const [tab, setTab] = useState<MobileTab>("layout");
  const [fullscreen, setFullscreen] = useState(false);
  const [hiddenZones, setHiddenZones] = useState<Set<string>>(() => new Set());
  const toggleZone = (id: string) =>
    setHiddenZones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const showAllZones = () => setHiddenZones(new Set());

  const cfg = useMemo(
    () => ({ capacity, core, automation, building }),
    [capacity, core, automation, building],
  );
  const tech = useMemo(
    () => computeTechData(capacity, core, automation, building, shift),
    [capacity, core, automation, building, shift],
  );
  const layoutPreview = useMemo(() => computeFactoryLayout(cfg), [cfg]);
  const equipment = useMemo(
    () => computeEquipment(capacity, core, automation),
    [capacity, core, automation],
  );
  const expansionCopy = expansionRecommendation({ capacity, building });
  const bldRecommendation = recommendedBuildingCopy({ capacity, core });

  const InputsPanel = (
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
          <StepPill n={2} label="Core Technology" />
          <div className="mt-3">
            <Select value={core} options={CORES} onChange={setCore} />
          </div>
        </div>
        <div className="border-t border-white/5 pt-6">
          <StepPill n={3} label="Automation Level" />
          <div className="mt-3">
            <Select value={automation} options={AUTOMATIONS} onChange={setAutomation} />
          </div>
        </div>
        <div className="border-t border-white/5 pt-6">
          <StepPill n={4} label="Building Configuration" />
          <div className="mt-3">
            <Select value={building} options={BUILDINGS} onChange={setBuilding} />
          </div>
        </div>
        <div className="border-t border-white/5 pt-6">
          <StepPill n={5} label="Shift Pattern" />
          <div className="mt-3">
            <Select value={shift} options={SHIFTS} onChange={setShift} />
          </div>
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-[11px] leading-relaxed text-amber-100/80">
        <Info className="mb-1 inline h-3 w-3" /> Conceptual layout only. Final dimensions and
        utilities require detailed engineering review.
      </div>
    </div>
  );

  const TechPanel = (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-300/80">
          Technical Data
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">Live</span>
      </div>
      <dl className="divide-y divide-white/5 text-sm">
        {[
          { i: Factory, l: "Production Lines", v: tech.lines },
          { i: Ruler, l: "Land Area", v: tech.landM2 },
          { i: Building2, l: "Building Area", v: tech.buildingM2 },
          { i: Cog2, l: "Production Area", v: tech.productionM2 },
          { i: Boxes, l: "Warehouse Area", v: tech.warehouseM2 },
          { i: Zap, l: "Utility Area", v: tech.utilityM2 },
          { i: Building2, l: "Office Area", v: tech.officeM2 },
          { i: Zap, l: "Power Requirement", v: tech.powerKW },
          { i: Droplets, l: "Water Consumption", v: tech.waterM3day },
          { i: Wind, l: "Compressed Air", v: tech.compressedAirM3min },
          { i: Gauge, l: "Steam Requirement", v: tech.steamKgH },
          { i: Users, l: "Operators", v: tech.operators },
          { i: Forklift, l: "Forklifts", v: tech.forklifts },
          { i: Truck, l: "Loading Bays", v: tech.loadingBays },
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
  );

  const RecommendationsPanel = (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-emerald-300/80">
          Recommended Building
        </div>
        <div className="text-sm text-white">{bldRecommendation}</div>
      </div>
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-emerald-300/80">
          Expansion Recommendation
        </div>
        <div className="text-sm text-white">{expansionCopy}</div>
      </div>
    </div>
  );

  const LayoutViewer = (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/40 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
          <Radar className="h-3.5 w-3.5 text-emerald-300" /> Live Factory Layout
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {VIEW_MODES.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setView(m.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                view === m.id ? "bg-emerald-500 text-black" : "text-white/60 hover:text-white"
              }`}
            >
              <m.icon className="h-3 w-3" /> {m.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFullscreen((f) => !f)}
            className="ml-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-white/60 transition hover:text-white"
            aria-label="Toggle fullscreen"
          >
            <Maximize2 className="h-3 w-3" /> {fullscreen ? "Exit" : "Fullscreen"}
          </button>
        </div>
      </div>

      <div className={`relative ${fullscreen ? "fixed inset-0 z-50 bg-[#07090b]" : ""}`}>
        <div
          className={`${fullscreen ? "h-screen" : "aspect-[16/10]"} w-full overflow-hidden bg-[#07090b]`}
        >
          <LayoutSVG
            cfg={cfg}
            view={view}
            onZoneSelect={setZone}
            selectedZoneId={zone?.id}
            isoTilt={view === "iso"}
            hiddenZones={hiddenZones}
          />
        </div>
        <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-1.5">
          <Chip>{capacity.toLocaleString()} m²/day</Chip>
          <Chip tone="graphite">{core}</Chip>
          <Chip tone="graphite">{automation}</Chip>
          <Chip tone="graphite">{building}</Chip>
          <Chip tone="amber">{shift}</Chip>
        </div>
        {fullscreen && (
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/60 p-2 text-white hover:bg-black"
            aria-label="Close fullscreen"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <FlowLegend view={view} />
    </div>
  );

  const ZoneTogglesPanel = (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
          Zone Visibility — {layoutPreview.zones.length - hiddenZones.size}/
          {layoutPreview.zones.length} shown
        </div>
        <button
          type="button"
          onClick={showAllZones}
          disabled={hiddenZones.size === 0}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white/70 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Show all
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 p-3">
        {layoutPreview.zones.map((z) => {
          const hidden = hiddenZones.has(z.id);
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => toggleZone(z.id)}
              aria-pressed={!hidden}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] transition ${
                hidden
                  ? "border-white/10 bg-white/[0.02] text-white/60 line-through"
                  : "border-white/15 bg-white/5 text-white hover:border-emerald-400/50"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: zoneFill(z.category), opacity: hidden ? 0.35 : 1 }}
              />
              {z.short}
            </button>
          );
        })}
      </div>
      <div className="border-t border-white/5 px-4 py-2 font-mono text-[10px] text-white/60">
        Each toggle is React state → filters <code>layout.zones</code> → SVG re-renders with a
        spring animation.
      </div>
    </div>
  );

  const EquipmentPanel = (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
          Equipment List — {equipment.length} items
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
          Auto-generated
        </span>
      </div>
      <div className="grid gap-0 divide-y divide-white/5 md:grid-cols-2 md:divide-y-0">
        {equipment.map((e) => (
          <div
            key={e.name}
            className="flex items-start justify-between gap-3 p-4 md:border-b md:border-white/5"
          >
            <div className="flex items-start gap-3">
              <CategoryIcon cat={e.category} />
              <div>
                <div className="text-sm font-medium text-white">{e.name}</div>
                {e.reason && <div className="mt-0.5 text-[11px] text-white/50">{e.reason}</div>}
              </div>
            </div>
            <span className="whitespace-nowrap rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/70">
              {e.qty}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const CTAPanel = (
    <div className="rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent p-6">
      <Chip>
        <ClipboardList className="h-3 w-3" /> Ready for next step
      </Chip>
      <h3 className="mt-4 text-2xl font-semibold text-white">
        Turn this concept into a real factory.
      </h3>
      <p className="mt-2 text-sm text-white/60">
        Send this configuration to NEVO engineering — you receive a complete masterplan, utilities
        layout, equipment list, CAPEX and delivery schedule.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to="/project-inquiry"
          search={{
            capacity: String(capacity),
            core,
            automation,
            building,
            shift,
            source: "factory-layout-generator",
          }}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-black transition hover:bg-emerald-400"
        >
          <ClipboardList className="h-4 w-4" /> Request Complete Factory Engineering
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <PhoneCall className="h-4 w-4" /> Talk to an Engineer
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <Download className="h-4 w-4" /> Download Concept Layout PDF
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0C0E] text-white">
      <SiteHeader />

      <nav aria-label="Breadcrumb" className="border-b border-white/5 bg-black/40">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-6 py-3 text-xs text-white/50">
          <Link to="/" className="hover:text-white">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/solutions/factory-development" className="hover:text-white">
            Factory Development
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white">Factory Layout Generator</span>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-white/5">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 20% 0%, rgba(16,185,129,0.15), transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(16,185,129,0.08), transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-[1440px] px-6 py-12 md:py-16">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Chip>
              <Sparkles className="h-3 w-3" /> Interactive Engineering Tool
            </Chip>
            <Chip tone="graphite">v3.0 · Dynamic Generator</Chip>
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
            Factory Layout <span className="text-emerald-400">Generator</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-white/60 md:text-lg">
            Choose capacity, core technology, automation and building configuration. The layout,
            flow diagrams, equipment list and utility requirements update instantly.
          </p>
        </div>
      </section>

      {/* Mobile tab bar */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur lg:hidden">
        <div className="scrollbar-hide flex gap-1 overflow-x-auto px-3 py-2">
          {MOBILE_TABS.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[11px] font-medium transition ${
                tab === t.id
                  ? "bg-emerald-500 text-black"
                  : "border border-white/10 bg-white/5 text-white/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <section className="border-b border-white/5">
        <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-6 md:py-12">
          {/* Desktop grid */}
          <div className="hidden gap-6 lg:grid lg:grid-cols-12">
            <aside className="space-y-4 lg:col-span-4">
              {InputsPanel}
              {TechPanel}
            </aside>
            <div className="space-y-4 lg:col-span-8">
              {LayoutViewer}
              {ZoneTogglesPanel}
              {RecommendationsPanel}
              {EquipmentPanel}
              {CTAPanel}
            </div>
          </div>

          {/* Mobile stack (tab-controlled) */}
          <div className="space-y-4 lg:hidden">
            {tab === "inputs" && InputsPanel}
            {tab === "layout" && (
              <>
                {LayoutViewer}
                {ZoneTogglesPanel}
                {RecommendationsPanel}
              </>
            )}
            {tab === "flow" && (
              <>
                {LayoutViewer}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs text-white/60">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-emerald-300/80">
                    Flow guide
                  </div>
                  Switch view modes above to see Material, Truck, Operator or Utility flows overlaid
                  on the layout.
                </div>
              </>
            )}
            {tab === "data" && (
              <>
                {TechPanel}
                {RecommendationsPanel}
              </>
            )}
            {tab === "equipment" && EquipmentPanel}
            {tab === "cta" && CTAPanel}
          </div>
        </div>
      </section>

      {/* Compact bottom CTA (desktop safety net) */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(16,185,129,0.2), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[1440px] px-6 py-16 text-center">
          <Chip>
            <ClipboardList className="h-3 w-3" /> From concept to reality
          </Chip>
          <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
            One configuration away from a <span className="text-emerald-400">real factory</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            NEVO Industrial delivers the masterplan, utilities, equipment, CAPEX and delivery
            schedule.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/project-inquiry"
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

      <ZoneDrawer zone={zone} onClose={() => setZone(null)} />

      <SiteFooter />
    </div>
  );
}

// small helpers
function Cog2({ className }: { className?: string }) {
  return <Layers className={className} />;
}

function CategoryIcon({
  cat,
}: {
  cat: "production" | "handling" | "utility" | "safety" | "control";
}) {
  const I =
    cat === "production"
      ? Factory
      : cat === "handling"
        ? Forklift
        : cat === "utility"
          ? Zap
          : cat === "safety"
            ? Flame
            : Activity;
  const color =
    cat === "production"
      ? "text-emerald-300"
      : cat === "handling"
        ? "text-blue-300"
        : cat === "utility"
          ? "text-yellow-300"
          : cat === "safety"
            ? "text-red-300"
            : "text-purple-300";
  return (
    <div className={`mt-0.5 rounded-lg border border-white/10 bg-white/5 p-2 ${color}`}>
      <I className="h-3.5 w-3.5" />
    </div>
  );
}

// silence unused-icon lint (referenced conditionally)
void RouteIcon;
void CAPACITY_SPEC;
void formatRange;
void FileText;
