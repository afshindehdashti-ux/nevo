import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Check,
  Download,
  Flame,
  Link2,
  MessageSquare,
  PhoneCall,
  Thermometer,
  Weight,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { buildSeo, orgJsonLd, breadcrumbJsonLd } from "@/lib/seo";

// ---------------- SEO ----------------
export const Route = createFileRoute("/$lang/panel-thickness-calculator")({
  component: PanelThicknessPage,
  head: ({ params }) => {
    const seo = buildSeo({
      lang: params.lang,
      title: "Panel Thickness Calculator — Sandwich Panel Sizing Tool | NEVO",
      description:
        "Dynamic sandwich panel thickness calculator. Live U-value, fire rating, weight and heat loss for cold storage, freezers, food, clean rooms and industrial buildings.",
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
      ],
    };
  },
});

// ---------------- Domain ----------------
type Application =
  | "Cold Storage"
  | "Freezer Room"
  | "Food Processing"
  | "Warehouse"
  | "Industrial Building"
  | "Clean Room"
  | "Commercial Building"
  | "Agriculture"
  | "Data Center";

type Core = "PIR" | "PUR" | "Rock Wool" | "EPS" | "Glass Wool";
type Climate = "Very Cold" | "Cold" | "Moderate" | "Hot" | "Very Hot";
type Fire = "None" | "30 min" | "60 min" | "90 min" | "120 min" | "180 min";
type Temp = "+20°C" | "+5°C" | "0°C" | "-18°C" | "-25°C" | "-40°C";

const THICKNESSES = [30, 40, 50, 60, 80, 100, 120, 150, 180, 200, 250, 300] as const;
type Thickness = (typeof THICKNESSES)[number];

const STEEL_GAUGES = [0.4, 0.45, 0.5, 0.6, 0.7, 0.8] as const;

// Thermal conductivity W/m·K (per spec)
const LAMBDA: Record<Core, number> = {
  PIR: 0.022,
  PUR: 0.026,
  "Rock Wool": 0.038,
  EPS: 0.036,
  "Glass Wool": 0.040,
};

// Density kg/m³ (per spec)
const DENSITY: Record<Core, number> = {
  PIR: 40,
  PUR: 38,
  "Rock Wool": 110,
  EPS: 22,
  "Glass Wool": 55,
};

const STEEL_DENSITY = 7850; // kg/m³

// Fire minutes achievable per core at a thickness
function fireMinutesOf(core: Core, thickness: number): number {
  if (core === "Rock Wool" || core === "Glass Wool") {
    if (thickness >= 150) return 180;
    if (thickness >= 120) return 120;
    if (thickness >= 100) return 90;
    if (thickness >= 80) return 60;
    return 30;
  }
  if (core === "PIR") {
    if (thickness >= 120) return 90;
    if (thickness >= 80) return 60;
    return 30;
  }
  if (core === "PUR") {
    if (thickness >= 100) return 60;
    return 30;
  }
  return 30; // EPS
}

function fireLabel(min: number): string {
  return min <= 0 ? "No rating" : `${min} min`;
}
function fireRequirementMinutes(f: Fire): number {
  if (f === "None") return 0;
  return parseInt(f, 10);
}

// Core visual palette for SVG cross-section
const CORE_STYLE: Record<
  Core,
  { base: string; accent: string; pattern: "foam-yellow" | "foam-warm" | "wool" | "beads" | "fiber" }
> = {
  PIR: { base: "#F5E6A0", accent: "#D9BC55", pattern: "foam-yellow" },
  PUR: { base: "#F1CE6E", accent: "#B98A2E", pattern: "foam-warm" },
  "Rock Wool": { base: "#8C6A45", accent: "#4E3A22", pattern: "wool" },
  EPS: { base: "#FAFAF6", accent: "#C9C9BE", pattern: "beads" },
  "Glass Wool": { base: "#F0E2A5", accent: "#B89A45", pattern: "fiber" },
};

// ---------------- Calculations ----------------
function calcUValue(core: Core, thickness_mm: number): number {
  const R_core = thickness_mm / 1000 / LAMBDA[core];
  const R_total = R_core + 0.17;
  return +(1 / R_total).toFixed(2);
}

function calcWeight(core: Core, thickness_mm: number, extSteel_mm: number, intSteel_mm: number): number {
  const coreKg = DENSITY[core] * (thickness_mm / 1000);
  const steelKg =
    (extSteel_mm / 1000) * STEEL_DENSITY + (intSteel_mm / 1000) * STEEL_DENSITY;
  return +(coreKg + steelKg).toFixed(1);
}

function calcHeatLoss(uValue: number, deltaT_K: number): number {
  // W/m² for a static delta-T
  return +(uValue * deltaT_K).toFixed(1);
}

function thermalPerformance(u: number): "Excellent" | "Very Good" | "Good" | "Standard" | "Basic" {
  if (u <= 0.15) return "Excellent";
  if (u <= 0.22) return "Very Good";
  if (u <= 0.32) return "Good";
  if (u <= 0.45) return "Standard";
  return "Basic";
}

function tempToNumber(t: Temp): number {
  return parseInt(t.replace("°C", "").replace("+", ""), 10);
}

// Recommended thickness range per spec
function recommendRange(
  app: Application,
  core: Core,
  temp: Temp,
  fire: Fire,
): { min: number; max: number; note: string } {
  const t = tempToNumber(temp);

  // High fire ratings force mineral cores
  const fireMin = fireRequirementMinutes(fire);
  if (fireMin >= 90 && (core === "PIR" || core === "PUR" || core === "EPS")) {
    // still return a functional range but the warning surfaces separately
  }

  if (app === "Freezer Room" || t <= -30) return { min: 180, max: 200, note: "Deep-freeze envelope — minimise thermal bridging." };
  if (t <= -15) return { min: 120, max: 150, note: "Freezer / low-temperature envelope." };
  if (app === "Cold Storage" || t <= 5) return { min: 80, max: 100, note: "Cold storage envelope." };
  if (app === "Clean Room") return { min: 60, max: 100, note: "Clean room hygienic envelope." };
  if (app === "Data Center") return { min: 80, max: 120, note: "Controlled-environment data hall." };
  if (app === "Food Processing") return { min: 80, max: 120, note: "Hygienic food processing envelope." };
  if (app === "Industrial Building") return { min: 50, max: 100, note: "Industrial building envelope." };
  if (app === "Warehouse") return { min: 40, max: 80, note: "Warehouse envelope." };
  if (app === "Agriculture") return { min: 40, max: 60, note: "Agricultural building." };
  return { min: 50, max: 80, note: "Commercial envelope." };
}

type ScoreValue = "Excellent" | "Very Good" | "Good" | "Limited" | "Not Recommended";

function performanceBadge(v: ScoreValue): string {
  return {
    Excellent: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
    "Very Good": "bg-emerald-400/10 text-emerald-300 border-emerald-400/30",
    Good: "bg-amber-400/10 text-amber-300 border-amber-400/30",
    Limited: "bg-orange-400/10 text-orange-300 border-orange-400/30",
    "Not Recommended": "bg-rose-400/10 text-rose-300 border-rose-400/30",
  }[v];
}

// ---------------- UI atoms ----------------
function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md border px-3 py-2 text-center text-xs font-medium leading-tight transition ${
        active
          ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Section({
  label,
  children,
  issue,
}: {
  label: string;
  children: React.ReactNode;
  issue?: { severity: "error" | "warning"; message: string };
}) {
  const tone =
    issue?.severity === "error"
      ? "text-rose-300"
      : issue?.severity === "warning"
        ? "text-amber-300"
        : "text-white/50";
  return (
    <div>
      <div className={`mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] ${tone}`}>
        <span>{label}</span>
        {issue && (
          <span aria-hidden="true">•</span>
        )}
        {issue && (
          <span className="normal-case tracking-normal">{issue.severity === "error" ? "Invalid" : "Check"}</span>
        )}
      </div>
      {children}
      {issue && (
        <p
          role={issue.severity === "error" ? "alert" : "status"}
          className={`mt-2 flex items-start gap-1.5 text-xs ${
            issue.severity === "error" ? "text-rose-300" : "text-amber-300"
          }`}
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{issue.message}</span>
        </p>
      )}
    </div>
  );
}


// ---------------- Dynamic SVG Cross-section ----------------
function CrossSection({
  core,
  thickness,
  extSteel,
  intSteel,
}: {
  core: Core;
  thickness: number;
  extSteel: number;
  intSteel: number;
}) {
  const W = 720;
  const H = 360;
  const padX = 90;
  const panelW = W - padX * 2;

  // Steel visual thickness
  const skinExt = 5 + (extSteel - 0.4) * 5;
  const skinInt = 5 + (intSteel - 0.4) * 5;

  // Core thickness scales linearly with real mm across 30..300
  const minCore = 20;
  const maxCore = 240;
  const coreH = minCore + ((thickness - 30) / (300 - 30)) * (maxCore - minCore);

  const totalH = coreH + skinExt + skinInt;
  const startY = (H - totalH) / 2;
  const coreTop = startY + skinExt;
  const intTop = coreTop + coreH;

  const style = CORE_STYLE[core];
  const patternId = `core-pattern-${core.replace(/\s+/g, "")}`;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block w-full" style={{ aspectRatio: `${W} / ${H}` }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <CorePattern id={patternId} kind={style.pattern} base={style.base} accent={style.accent} />
          <linearGradient id="skin-shade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
          </linearGradient>
        </defs>

        {/* Core — solid base color guarantees visibility; pattern overlay adds texture */}
        <rect
          x={padX}
          y={coreTop}
          width={panelW}
          height={coreH}
          fill={style.base}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth={0.8}
        />
        <rect
          x={padX}
          y={coreTop}
          width={panelW}
          height={coreH}
          fill={`url(#${patternId})`}
          opacity={0.9}
          pointerEvents="none"
        />


        {/* Exterior skin */}
        <rect
          x={padX}
          y={startY}
          width={panelW}
          height={skinExt}
          fill="#B7BEC6"
          stroke="rgba(0,0,0,0.5)"
          strokeWidth={0.6}
        />
        <rect
          x={padX}
          y={startY}
          width={panelW}
          height={skinExt}
          fill="url(#skin-shade)"
          opacity={0.6}
        />

        {/* Interior skin */}
        <rect
          x={padX}
          y={intTop}
          width={panelW}
          height={skinInt}
          fill="#E7EBDA"
          stroke="rgba(0,0,0,0.5)"
          strokeWidth={0.6}
        />
        <rect
          x={padX}
          y={intTop}
          width={panelW}
          height={skinInt}
          fill="url(#skin-shade)"
          opacity={0.4}
        />



        {/* Thickness dimension */}
        <g stroke="rgba(255,255,255,0.7)" strokeWidth={0.8} fill="rgba(255,255,255,0.85)">
          <line x1={padX + panelW + 28} y1={startY} x2={padX + panelW + 28} y2={intTop + skinInt} />
          <line x1={padX + panelW + 22} y1={startY} x2={padX + panelW + 34} y2={startY} />
          <line x1={padX + panelW + 22} y1={intTop + skinInt} x2={padX + panelW + 34} y2={intTop + skinInt} />
          <text
            x={padX + panelW + 40}
            y={startY + totalH / 2 + 4}
            fontSize={13}
            fontFamily="ui-monospace, Menlo, monospace"
            fontWeight={600}
          >
            {thickness} mm
          </text>
        </g>

        {/* Labels */}
        <g fontFamily="ui-monospace, Menlo, monospace" fill="rgba(255,255,255,0.75)" fontSize={11}>
          <text x={padX} y={startY - 10}>
            EXT STEEL · {extSteel.toFixed(2)} mm
          </text>
          <text x={padX} y={intTop + skinInt + 18}>
            INT STEEL · {intSteel.toFixed(2)} mm
          </text>
          <text x={padX + panelW - 4} y={coreTop + coreH / 2 + 4} textAnchor="end" fill="rgba(0,0,0,0.7)" fontSize={12} fontWeight={600}>
            CORE · {core}
          </text>
        </g>
      </svg>
    </div>
  );
}

function CorePattern({
  id,
  kind,
  base,
  accent,
}: {
  id: string;
  kind: "foam-yellow" | "foam-warm" | "wool" | "beads" | "fiber";
  base: string;
  accent: string;
}) {
  if (kind === "foam-yellow" || kind === "foam-warm") {
    return (
      <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
        <rect width="18" height="18" fill={base} />
        <circle cx="4" cy="5" r="1.4" fill={accent} opacity="0.55" />
        <circle cx="12" cy="9" r="1.9" fill={accent} opacity="0.45" />
        <circle cx="7" cy="14" r="1.2" fill={accent} opacity="0.6" />
        <circle cx="15" cy="15" r="0.9" fill={accent} opacity="0.5" />
      </pattern>
    );
  }
  if (kind === "wool") {
    return (
      <pattern id={id} width="26" height="12" patternUnits="userSpaceOnUse">
        <rect width="26" height="12" fill={base} />
        <path d="M0 4 Q6 1 13 4 T26 4" stroke={accent} strokeWidth="0.7" fill="none" opacity="0.8" />
        <path d="M0 8 Q7 5 14 9 T26 8" stroke={accent} strokeWidth="0.6" fill="none" opacity="0.6" />
      </pattern>
    );
  }
  if (kind === "fiber") {
    return (
      <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill={base} />
        <line x1="0" y1="4" x2="16" y2="6" stroke={accent} strokeWidth="0.6" opacity="0.65" />
        <line x1="0" y1="11" x2="16" y2="9" stroke={accent} strokeWidth="0.6" opacity="0.55" />
      </pattern>
    );
  }
  return (
    <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill={base} />
      <circle cx="4" cy="4" r="2" fill="none" stroke={accent} strokeWidth="0.5" />
      <circle cx="11" cy="9" r="2.4" fill="none" stroke={accent} strokeWidth="0.5" />
      <circle cx="6" cy="13" r="1.6" fill="none" stroke={accent} strokeWidth="0.5" />
      <circle cx="14" cy="14" r="1.2" fill="none" stroke={accent} strokeWidth="0.5" />
    </pattern>
  );
}

// ---------------- Charts ----------------
function UValueChart({ core, selected }: { core: Core; selected: number }) {
  const data = THICKNESSES.map((t) => ({ t, u: calcUValue(core, t) }));
  const maxU = Math.max(...data.map((d) => d.u));
  const W = 520;
  const H = 180;
  const padL = 42;
  const padB = 30;
  const padT = 10;
  const padR = 10;
  const cw = W - padL - padR;
  const ch = H - padT - padB;
  const points = data
    .map((d, i) => {
      const x = padL + (i / (data.length - 1)) * cw;
      const y = padT + (1 - d.u / maxU) * ch;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
        U-Value vs Thickness · {core}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={padL} y1={padT} x2={padL} y2={padT + ch} stroke="rgba(255,255,255,0.2)" />
        <line x1={padL} y1={padT + ch} x2={padL + cw} y2={padT + ch} stroke="rgba(255,255,255,0.2)" />
        <polyline points={points} fill="none" stroke="rgb(52,211,153)" strokeWidth={1.8} />
        {data.map((d, i) => {
          const x = padL + (i / (data.length - 1)) * cw;
          const y = padT + (1 - d.u / maxU) * ch;
          const active = d.t === selected;
          return (
            <g key={d.t}>
              <circle cx={x} cy={y} r={active ? 5 : 2.5} fill={active ? "rgb(52,211,153)" : "rgba(255,255,255,0.5)"} />
              {active && (
                <text x={x} y={y - 10} fontSize={10} fill="rgb(52,211,153)" textAnchor="middle" fontFamily="ui-monospace,Menlo,monospace">
                  U={d.u}
                </text>
              )}
              <text x={x} y={padT + ch + 14} fontSize={9} fill="rgba(255,255,255,0.5)" textAnchor="middle" fontFamily="ui-monospace,Menlo,monospace">
                {d.t}
              </text>
            </g>
          );
        })}
        <text x={4} y={padT + 6} fontSize={9} fill="rgba(255,255,255,0.5)" fontFamily="ui-monospace,Menlo,monospace">
          W/m²K
        </text>
      </svg>
    </div>
  );
}

function BarChart({
  title,
  data,
  selectedIndex,
  unit,
}: {
  title: string;
  data: { label: string; value: number }[];
  selectedIndex?: number;
  unit: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">{title}</div>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2">
            <div className="w-14 shrink-0 font-mono text-[10px] text-white/50">{d.label}</div>
            <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(d.value / max) * 100}%` }}
                transition={{ type: "spring", stiffness: 180, damping: 26 }}
                className={`h-full rounded-full ${
                  i === selectedIndex ? "bg-emerald-400" : "bg-white/25"
                }`}
              />
            </div>
            <div className={`w-16 shrink-0 text-right font-mono text-[10px] ${i === selectedIndex ? "text-emerald-300" : "text-white/60"}`}>
              {d.value} {unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Input validation / engineering guardrails ----------------
type IssueField =
  | "app"
  | "core"
  | "climate"
  | "temp"
  | "fire"
  | "thickness"
  | "extSteel"
  | "intSteel";

type Issue = {
  field: IssueField;
  severity: "error" | "warning";
  message: string;
};

function validateInputs(input: {
  app: Application;
  core: Core;
  climate: Climate;
  temp: Temp;
  fire: Fire;
  thickness: Thickness;
  extSteel: number;
  intSteel: number;
}): Issue[] {
  const { app, core, climate, temp, fire, thickness, extSteel, intSteel } = input;
  const issues: Issue[] = [];
  const requiredFireMin = fireRequirementMinutes(fire);
  const isCombustibleCore = core === "PIR" || core === "PUR" || core === "EPS";

  // --- Hard errors: physically / regulatorily impossible combinations ---

  if (requiredFireMin >= 120 && isCombustibleCore) {
    issues.push({
      field: "core",
      severity: "error",
      message: `${core} cannot achieve a ${fire} fire rating. Switch to Rock Wool or Glass Wool for ≥120 min.`,
    });
    issues.push({
      field: "fire",
      severity: "error",
      message: `A ${fire} rating requires a mineral (non-combustible) core.`,
    });
  }

  if (core === "EPS" && requiredFireMin >= 60) {
    issues.push({
      field: "core",
      severity: "error",
      message: `EPS cannot achieve a ${fire} fire rating; it is limited to short-duration ratings.`,
    });
  }

  if (app === "Freezer Room" && core === "EPS") {
    issues.push({
      field: "core",
      severity: "error",
      message: "EPS is not suitable for freezer rooms (moisture absorption and thermal drift).",
    });
  }

  if ((temp === "-25°C" || temp === "-40°C") && thickness < 120) {
    issues.push({
      field: "thickness",
      severity: "error",
      message: `Internal temperatures at ${temp} require ≥120 mm to prevent condensation and thermal loss.`,
    });
  }
  if (temp === "-40°C" && thickness < 150) {
    issues.push({
      field: "thickness",
      severity: "error",
      message: "Blast freezer (-40°C) applications require at least 150 mm of insulation.",
    });
  }

  if (app === "Clean Room" && (extSteel < 0.5 || intSteel < 0.5)) {
    if (extSteel < 0.5)
      issues.push({
        field: "extSteel",
        severity: "error",
        message: "Clean rooms require ≥0.50 mm exterior skin for rigidity and hygiene compliance.",
      });
    if (intSteel < 0.5)
      issues.push({
        field: "intSteel",
        severity: "error",
        message: "Clean rooms require ≥0.50 mm interior skin for rigidity and hygiene compliance.",
      });
  }

  // --- Warnings: unusual but not blocked ---

  if (intSteel > extSteel) {
    issues.push({
      field: "extSteel",
      severity: "warning",
      message: "Interior skin is thicker than exterior. Exterior faces weather; typically ext ≥ int.",
    });
  }

  if (climate === "Very Cold" && thickness < 100) {
    issues.push({
      field: "thickness",
      severity: "warning",
      message: "In very cold climates, ≥100 mm is usually recommended to control heat loss.",
    });
  }

  if (core === "EPS" && thickness > 150) {
    issues.push({
      field: "thickness",
      severity: "warning",
      message: "EPS panels above 150 mm are rarely produced; consider PIR or Rock Wool.",
    });
  }

  if (app === "Cold Storage" && thickness < 80) {
    issues.push({
      field: "thickness",
      severity: "warning",
      message: "Cold storage typically uses ≥80 mm to maintain stable interior temperatures.",
    });
  }

  if ((core === "Rock Wool" || core === "Glass Wool") && thickness >= 250) {
    issues.push({
      field: "thickness",
      severity: "warning",
      message: `${core} at ${thickness} mm becomes very heavy; verify structural support and handling.`,
    });
  }

  return issues;
}

function firstBy<T extends { field: IssueField; severity: "error" | "warning" }>(
  issues: T[],
  field: IssueField,
): T | undefined {
  return (
    issues.find((i) => i.field === field && i.severity === "error") ??
    issues.find((i) => i.field === field && i.severity === "warning")
  );
}

// ---------------- Shareable state (URL query encoding) ----------------
const APPLICATIONS_ALL: Application[] = [
  "Cold Storage",
  "Freezer Room",
  "Food Processing",
  "Warehouse",
  "Industrial Building",
  "Clean Room",
  "Commercial Building",
  "Agriculture",
  "Data Center",
];
const CORES_ALL: Core[] = ["PIR", "PUR", "Rock Wool", "EPS", "Glass Wool"];
const CLIMATES_ALL: Climate[] = ["Very Cold", "Cold", "Moderate", "Hot", "Very Hot"];
const TEMPS_ALL: Temp[] = ["+20°C", "+5°C", "0°C", "-18°C", "-25°C", "-40°C"];
const FIRES_ALL: Fire[] = ["None", "30 min", "60 min", "90 min", "120 min", "180 min"];

type SharedState = {
  app: Application;
  core: Core;
  climate: Climate;
  temp: Temp;
  fire: Fire;
  thickness: Thickness;
  extSteel: number;
  intSteel: number;
  compare: number[];
};

const DEFAULT_SHARED: SharedState = {
  app: "Cold Storage",
  core: "PIR",
  climate: "Moderate",
  temp: "+5°C",
  fire: "None",
  thickness: 100,
  extSteel: 0.5,
  intSteel: 0.4,
  compare: [80, 100, 150],
};

function pickIn<T extends string>(v: string | null, options: readonly T[], fallback: T): T {
  return v && (options as readonly string[]).includes(v) ? (v as T) : fallback;
}

function readSharedFromUrl(): SharedState {
  if (typeof window === "undefined") return DEFAULT_SHARED;
  const p = new URLSearchParams(window.location.search);
  if (![...p.keys()].length) return DEFAULT_SHARED;

  const thicknessNum = Number(p.get("th"));
  const thickness = (THICKNESSES as readonly number[]).includes(thicknessNum)
    ? (thicknessNum as Thickness)
    : DEFAULT_SHARED.thickness;

  const extNum = Number(p.get("ext"));
  const intNum = Number(p.get("int"));
  const extSteel = (STEEL_GAUGES as readonly number[]).includes(extNum) ? extNum : DEFAULT_SHARED.extSteel;
  const intSteel = (STEEL_GAUGES as readonly number[]).includes(intNum) ? intNum : DEFAULT_SHARED.intSteel;

  const cmp = (p.get("cmp") ?? "")
    .split(",")
    .map((x) => Number(x))
    .filter((n) => (THICKNESSES as readonly number[]).includes(n));
  const compare = cmp.length ? cmp.slice(0, 3) : DEFAULT_SHARED.compare;

  return {
    app: pickIn(p.get("app"), APPLICATIONS_ALL, DEFAULT_SHARED.app),
    core: pickIn(p.get("core"), CORES_ALL, DEFAULT_SHARED.core),
    climate: pickIn(p.get("cli"), CLIMATES_ALL, DEFAULT_SHARED.climate),
    temp: pickIn(p.get("tmp"), TEMPS_ALL, DEFAULT_SHARED.temp),
    fire: pickIn(p.get("fire"), FIRES_ALL, DEFAULT_SHARED.fire),
    thickness,
    extSteel,
    intSteel,
    compare,
  };
}

function buildSharedQuery(s: SharedState): string {
  return new URLSearchParams({
    app: s.app,
    core: s.core,
    cli: s.climate,
    tmp: s.temp,
    fire: s.fire,
    th: String(s.thickness),
    ext: String(s.extSteel),
    int: String(s.intSteel),
    cmp: s.compare.join(","),
  }).toString();
}

// ---------------- Page ----------------
function PanelThicknessPage() {
  const initial = readSharedFromUrl();
  const [app, setApp] = useState<Application>(initial.app);
  const [core, setCore] = useState<Core>(initial.core);
  const [climate, setClimate] = useState<Climate>(initial.climate);
  const [temp, setTemp] = useState<Temp>(initial.temp);
  const [fire, setFire] = useState<Fire>(initial.fire);
  const [thickness, setThickness] = useState<Thickness>(initial.thickness);
  const [extSteel, setExtSteel] = useState<number>(initial.extSteel);
  const [intSteel, setIntSteel] = useState<number>(initial.intSteel);
  const [compare, setCompare] = useState<number[]>(initial.compare);
  const [tab, setTab] = useState<"Inputs" | "Recommendation" | "Cross Section" | "Charts" | "Compare" | "Report">(
    "Inputs",
  );
  const [copied, setCopied] = useState(false);

  const shareQuery = useMemo(
    () => buildSharedQuery({ app, core, climate, temp, fire, thickness, extSteel, intSteel, compare }),
    [app, core, climate, temp, fire, thickness, extSteel, intSteel, compare],
  );

  // Keep URL in sync with current selections so a copy/refresh reproduces state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const next = `${window.location.pathname}?${shareQuery}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [shareQuery]);

  async function copyShareLink() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?${shareQuery}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for browsers without clipboard permission
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }


  // Live results
  const u = useMemo(() => calcUValue(core, thickness), [core, thickness]);
  const rTotal = useMemo(() => +(1 / u).toFixed(2), [u]);
  const w = useMemo(() => calcWeight(core, thickness, extSteel, intSteel), [core, thickness, extSteel, intSteel]);
  const deltaT = useMemo(() => Math.abs(20 - tempToNumber(temp)) + { "Very Cold": 15, Cold: 8, Moderate: 0, Hot: -3, "Very Hot": -6 }[climate], [temp, climate]);
  const hLoss = useMemo(() => calcHeatLoss(u, Math.max(1, deltaT)), [u, deltaT]);
  const perf = useMemo(() => thermalPerformance(u), [u]);
  const fireAchieved = useMemo(() => fireMinutesOf(core, thickness), [core, thickness]);
  const rec = useMemo(() => recommendRange(app, core, temp, fire), [app, core, temp, fire]);
  const requiredFireMin = fireRequirementMinutes(fire);
  const fireOk = fireAchieved >= requiredFireMin;
  const fireWarn = requiredFireMin >= 120 && (core === "PIR" || core === "PUR" || core === "EPS");

  const meetsRec = thickness >= rec.min && thickness <= rec.max;
  const belowRec = thickness < rec.min;

  const performanceScores = useMemo((): Record<"thermal" | "fire" | "weight" | "cost" | "appFit", ScoreValue> => {
    const thermal: ScoreValue =
      u <= 0.18 ? "Excellent" : u <= 0.28 ? "Very Good" : u <= 0.45 ? "Good" : "Limited";
    const fireS: ScoreValue = requiredFireMin === 0
      ? "Excellent"
      : fireAchieved >= requiredFireMin
        ? "Excellent"
        : fireAchieved >= requiredFireMin - 30
          ? "Limited"
          : "Not Recommended";
    const weightS: ScoreValue = w < 15 ? "Excellent" : w < 25 ? "Very Good" : w < 40 ? "Good" : "Limited";
    const costS: ScoreValue = thickness <= 80 ? "Excellent" : thickness <= 120 ? "Very Good" : thickness <= 180 ? "Good" : "Limited";
    const appFit: ScoreValue = meetsRec ? "Excellent" : belowRec ? "Not Recommended" : "Very Good";
    return { thermal, fire: fireS, weight: weightS, cost: costS, appFit };
  }, [u, w, thickness, meetsRec, belowRec, fireAchieved, requiredFireMin]);

  // ---------- Validation & guardrails ----------
  const issues = useMemo(
    () => validateInputs({ app, core, climate, temp, fire, thickness, extSteel, intSteel }),
    [app, core, climate, temp, fire, thickness, extSteel, intSteel],
  );
  const errors = useMemo(() => issues.filter((i) => i.severity === "error"), [issues]);
  const warnings = useMemo(() => issues.filter((i) => i.severity === "warning"), [issues]);
  const hasErrors = errors.length > 0;
  const fieldIssues: Partial<Record<IssueField, Issue>> = {
    app: firstBy(issues, "app"),
    core: firstBy(issues, "core"),
    climate: firstBy(issues, "climate"),
    temp: firstBy(issues, "temp"),
    fire: firstBy(issues, "fire"),
    thickness: firstBy(issues, "thickness"),
    extSteel: firstBy(issues, "extSteel"),
    intSteel: firstBy(issues, "intSteel"),
  };


  function toggleCompare(t: number) {
    setCompare((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 3) return [...prev.slice(1), t];
      return [...prev, t];
    });
  }

  function downloadReport() {
    const lines = [
      "NEVO Panel Thickness Calculation Report",
      "======================================",
      "",
      `Application:         ${app}`,
      `Core Material:       ${core}`,
      `Climate Zone:        ${climate}`,
      `Internal Temp:       ${temp}`,
      `Fire Requirement:    ${fire}`,
      `Selected Thickness:  ${thickness} mm`,
      `Exterior Steel:      ${extSteel.toFixed(2)} mm`,
      `Interior Steel:      ${intSteel.toFixed(2)} mm`,
      "",
      "RESULTS",
      "-------",
      `U-Value:             ${u} W/m²K`,
      `Thermal Resistance:  ${rTotal} m²K/W`,
      `Panel Weight:        ${w} kg/m²`,
      `Est. Heat Loss:      ${hLoss} W/m² (ΔT ${deltaT} K)`,
      `Fire Achieved:       ${fireLabel(fireAchieved)} (required ${fire})`,
      `Thermal Performance: ${perf}`,
      "",
      "RECOMMENDATION",
      "--------------",
      `Recommended range:   ${rec.min}–${rec.max} mm`,
      `Note: ${rec.note}`,
      fireWarn
        ? "WARNING: For high fire resistance requirements, Rock Wool is usually recommended."
        : "",
      "",
      "DISCLAIMER",
      "----------",
      "This calculator provides conceptual guidance only. Final sandwich panel",
      "thickness must be verified by project-specific engineering, local",
      "regulations, fire requirements and thermal performance calculations.",
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nevo-panel-thickness-${app.replace(/\s+/g, "-")}-${thickness}mm.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function downloadPdfReport() {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const marginX = 48;
    let y = 56;

    const line = (text: string, opts?: { size?: number; bold?: boolean; color?: [number, number, number] }) => {
      const size = opts?.size ?? 10;
      doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
      doc.setFontSize(size);
      const [r, g, b] = opts?.color ?? [30, 30, 30];
      doc.setTextColor(r, g, b);
      const wrapped = doc.splitTextToSize(text, pageW - marginX * 2);
      doc.text(wrapped, marginX, y);
      y += wrapped.length * (size + 3);
    };
    const spacer = (h = 8) => { y += h; };
    const rule = () => {
      doc.setDrawColor(200);
      doc.line(marginX, y, pageW - marginX, y);
      y += 10;
    };
    const kv = (k: string, v: string) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(k, marginX, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20);
      doc.text(v, marginX + 190, y);
      y += 15;
    };

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 40, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("NEVO Engineering", marginX, 26);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Panel Thickness Calculation Report", pageW - marginX, 26, { align: "right" });

    y = 72;
    line("Panel Thickness Calculation Report", { size: 18, bold: true });
    line(`Generated ${new Date().toLocaleString()}`, { size: 9, color: [110, 110, 110] });
    spacer(6);
    rule();

    line("Inputs", { size: 12, bold: true });
    spacer(2);
    kv("Application", app);
    kv("Core Material", core);
    kv("Climate Zone", climate);
    kv("Required Internal Temp", temp);
    kv("Fire Requirement", fire);
    kv("Selected Thickness", `${thickness} mm`);
    kv("Exterior Steel Skin", `${extSteel.toFixed(2)} mm`);
    kv("Interior Steel Skin", `${intSteel.toFixed(2)} mm`);
    spacer(4);
    rule();

    line("Computed Results", { size: 12, bold: true });
    spacer(2);
    kv("U-Value", `${u} W/m²K`);
    kv("Thermal Resistance (R)", `${rTotal} m²K/W`);
    kv("Panel Weight", `${w} kg/m²`);
    kv("Estimated Heat Loss", `${hLoss} W/m² (ΔT ${deltaT} K)`);
    kv("Fire Rating Achieved", `${fireLabel(fireAchieved)} (required: ${fire})`);
    kv("Thermal Performance", perf);
    spacer(4);
    rule();

    line("Recommendation", { size: 12, bold: true });
    spacer(2);
    kv("Recommended Range", `${rec.min}–${rec.max} mm`);
    kv("Selection Status", meetsRec ? "Within recommended range" : belowRec ? "Below recommended range" : "Above recommended range");
    line(`Note: ${rec.note}`, { size: 10 });
    if (fireWarn) {
      spacer(4);
      line("WARNING: For high fire resistance requirements (>=120 min), Rock Wool or Glass Wool cores are strongly recommended.", { size: 10, bold: true, color: [180, 60, 30] });
    }
    spacer(6);
    rule();

    line("Disclaimer", { size: 12, bold: true });
    spacer(2);
    line(
      "This calculator provides conceptual guidance only. Final sandwich panel thickness must be verified by project-specific engineering, local building regulations, fire safety requirements and detailed thermal performance calculations. Contact NEVO Engineering for a validated project specification.",
      { size: 9, color: [90, 90, 90] },
    );

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220);
    doc.line(marginX, pageH - 40, pageW - marginX, pageH - 40);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("NEVO Engineering · Panel Thickness Calculator", marginX, pageH - 24);
    doc.text("nevo.engineering", pageW - marginX, pageH - 24, { align: "right" });

    doc.save(`nevo-panel-thickness-${app.replace(/\s+/g, "-")}-${core.replace(/\s+/g, "-")}-${thickness}mm.pdf`);
  }

  const inquiryParams = new URLSearchParams({
    subject: "Panel Thickness Recommendation",
    application: app,
    core,
    thickness: String(thickness),
    temp,
    climate,
    fire,
    uValue: String(u),
    weight: String(w),
  }).toString();

  const APPLICATIONS: Application[] = [
    "Cold Storage",
    "Freezer Room",
    "Food Processing",
    "Warehouse",
    "Industrial Building",
    "Clean Room",
    "Commercial Building",
    "Agriculture",
    "Data Center",
  ];
  const CORES: Core[] = ["PIR", "PUR", "Rock Wool", "EPS", "Glass Wool"];
  const CLIMATES: Climate[] = ["Very Cold", "Cold", "Moderate", "Hot", "Very Hot"];
  const TEMPS: Temp[] = ["+20°C", "+5°C", "0°C", "-18°C", "-25°C", "-40°C"];
  const FIRES: Fire[] = ["None", "30 min", "60 min", "90 min", "120 min", "180 min"];

  const TABS = ["Inputs", "Recommendation", "Cross Section", "Charts", "Compare", "Report"] as const;

  const InputsPanel = (
    <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <Section label="Application">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {APPLICATIONS.map((a) => (
            <Chip key={a} active={app === a} onClick={() => setApp(a)}>
              {a}
            </Chip>
          ))}
        </div>
      </Section>

      <Section label="Core Material">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {CORES.map((c) => (
            <Chip key={c} active={core === c} onClick={() => setCore(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Section label="Climate Zone">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {CLIMATES.map((c) => (
              <Chip key={c} active={climate === c} onClick={() => setClimate(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </Section>

        <Section label="Required Internal Temperature">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {TEMPS.map((t) => (
              <Chip key={t} active={temp === t} onClick={() => setTemp(t)}>
                {t}
              </Chip>
            ))}
          </div>
        </Section>
      </div>

      <Section label="Fire Rating Requirement">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {FIRES.map((f) => (
            <Chip key={f} active={fire === f} onClick={() => setFire(f)}>
              {f}
            </Chip>
          ))}
        </div>
      </Section>

      <Section label="Panel Thickness (mm)">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-12">
          {THICKNESSES.map((t) => (
            <Chip key={t} active={thickness === t} onClick={() => setThickness(t)}>
              {t}
            </Chip>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Section label="Exterior Steel (mm)">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {STEEL_GAUGES.map((s) => (
              <Chip key={s} active={extSteel === s} onClick={() => setExtSteel(s)}>
                {s.toFixed(2)}
              </Chip>
            ))}
          </div>
        </Section>
        <Section label="Interior Steel (mm)">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {STEEL_GAUGES.map((s) => (
              <Chip key={s} active={intSteel === s} onClick={() => setIntSteel(s)}>
                {s.toFixed(2)}
              </Chip>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );

  const ResultCards = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <MetricCard icon={Thermometer} label="U-Value" value={`${u}`} unit="W/m²K" tone="emerald" />
      <MetricCard icon={Zap} label="Thermal Perf." value={perf} unit="" tone="emerald" />
      <MetricCard icon={Weight} label="Weight" value={`${w}`} unit="kg/m²" tone="white" />
      <MetricCard icon={Flame} label="Fire Achieved" value={fireLabel(fireAchieved)} unit="" tone={fireOk ? "emerald" : "amber"} />
      <MetricCard icon={Thermometer} label="R-Value" value={`${rTotal}`} unit="m²K/W" tone="white" />
      <MetricCard icon={Zap} label="Heat Loss" value={`${hLoss}`} unit={`W/m² · ΔT ${deltaT}K`} tone="white" />
      <MetricCard icon={Weight} label="Recommended" value={`${rec.min}–${rec.max}`} unit="mm" tone="emerald" />
      <MetricCard icon={CheckCircle2} label="Selected" value={`${thickness}`} unit="mm" tone={meetsRec ? "emerald" : belowRec ? "rose" : "amber"} />
    </div>
  );

  const RecommendationPanel = (
    <div className="space-y-4">
      {ResultCards}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">Engineering Note</div>
        <p className="text-sm text-white/80">
          For <span className="text-emerald-300">{app}</span> at{" "}
          <span className="text-emerald-300">{temp}</span> in a{" "}
          <span className="text-emerald-300">{climate}</span> climate, NEVO Engineering recommends a{" "}
          <span className="text-emerald-300">{rec.min}–{rec.max} mm {core}</span> panel. {rec.note}{" "}
          Your selected {thickness} mm gives a U-value of <span className="text-emerald-300">{u} W/m²K</span>{" "}
          ({perf.toLowerCase()}).
        </p>
        {fireWarn && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-400" />
            <p className="text-sm text-amber-200">
              For high fire resistance requirements ({fire}), Rock Wool is usually recommended. Final selection must be verified according to local fire regulations.
            </p>
          </div>
        )}
        {!fireOk && requiredFireMin > 0 && !fireWarn && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-400" />
            <p className="text-sm text-amber-200">
              The selected {core} at {thickness} mm reaches ~{fireLabel(fireAchieved)}. Increase thickness or switch to Rock Wool to meet the {fire} requirement.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <ScoreBadge label="Thermal" value={performanceScores.thermal} />
        <ScoreBadge label="Fire" value={performanceScores.fire} />
        <ScoreBadge label="Weight" value={performanceScores.weight} />
        <ScoreBadge label="Cost" value={performanceScores.cost} />
        <ScoreBadge label="App Fit" value={performanceScores.appFit} />
      </div>
    </div>
  );

  const ChartsPanel = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <UValueChart core={core} selected={thickness} />
      <BarChart
        title={`Weight vs Thickness · ${core}`}
        data={THICKNESSES.map((t) => ({ label: `${t}mm`, value: calcWeight(core, t, extSteel, intSteel) }))}
        selectedIndex={THICKNESSES.indexOf(thickness)}
        unit="kg/m²"
      />
      <BarChart
        title="Heat Loss (relative)"
        data={THICKNESSES.map((t) => ({ label: `${t}mm`, value: calcHeatLoss(calcUValue(core, t), Math.max(1, deltaT)) }))}
        selectedIndex={THICKNESSES.indexOf(thickness)}
        unit="W/m²"
      />
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">Fire Suitability</div>
        <div className="space-y-2">
          {(["30 min", "60 min", "90 min", "120 min", "180 min"] as Fire[]).map((f) => {
            const req = fireRequirementMinutes(f);
            const ok = fireAchieved >= req;
            return (
              <div key={f} className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
                <span className="font-mono text-xs text-white/70">{f}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                    ok
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                      : "border-rose-400/40 bg-rose-400/10 text-rose-300"
                  }`}
                >
                  {ok ? "Suitable" : "Not suitable"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const ComparePanel = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
          Pick up to 3 thicknesses to compare
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-12">
          {THICKNESSES.map((t) => (
            <Chip key={t} active={compare.includes(t)} onClick={() => toggleCompare(t)}>
              {t}
            </Chip>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-white/[0.04] font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
            <tr>
              <th className="px-4 py-3">Thickness</th>
              <th className="px-4 py-3">U-Value</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Fire</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Performance</th>
            </tr>
          </thead>
          <tbody>
            {compare
              .slice()
              .sort((a, b) => a - b)
              .map((t) => {
                const cu = calcUValue(core, t);
                const cw = calcWeight(core, t, extSteel, intSteel);
                const cf = fireMinutesOf(core, t);
                const perfC = thermalPerformance(cu);
                const cost = t <= 60 ? "$" : t <= 100 ? "$$" : t <= 150 ? "$$$" : "$$$$";
                return (
                  <tr key={t} className="border-t border-white/5 text-white/80">
                    <td className="px-4 py-3 font-mono">{t} mm</td>
                    <td className="px-4 py-3 font-mono">{cu} W/m²K</td>
                    <td className="px-4 py-3 font-mono">{cw} kg/m²</td>
                    <td className="px-4 py-3 font-mono">{fireLabel(cf)}</td>
                    <td className="px-4 py-3 font-mono">{cost}</td>
                    <td className="px-4 py-3">{perfC}</td>
                  </tr>
                );
              })}
            {compare.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-white/50">
                  Select thicknesses above to compare.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ReportPanel = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">Calculation Report</div>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <ReportRow k="Application" v={app} />
          <ReportRow k="Core Material" v={core} />
          <ReportRow k="Climate" v={climate} />
          <ReportRow k="Internal Temp" v={temp} />
          <ReportRow k="Fire Requirement" v={fire} />
          <ReportRow k="Panel Thickness" v={`${thickness} mm`} />
          <ReportRow k="Exterior Steel" v={`${extSteel.toFixed(2)} mm`} />
          <ReportRow k="Interior Steel" v={`${intSteel.toFixed(2)} mm`} />
          <ReportRow k="U-Value" v={`${u} W/m²K`} />
          <ReportRow k="R-Value" v={`${rTotal} m²K/W`} />
          <ReportRow k="Weight" v={`${w} kg/m²`} />
          <ReportRow k="Heat Loss" v={`${hLoss} W/m² (ΔT ${deltaT} K)`} />
          <ReportRow k="Fire Achieved" v={fireLabel(fireAchieved)} />
          <ReportRow k="Recommended" v={`${rec.min}–${rec.max} mm`} />
        </dl>
        <p className="mt-4 text-xs text-white/50">
          This calculator provides conceptual guidance only. Final sandwich panel thickness must be verified by project-specific engineering, local regulations, fire requirements and thermal performance calculations.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={downloadReport}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300"
        >
          <Download className="size-4" />
          Download Calculation Report
        </button>
        <button
          type="button"
          onClick={downloadPdfReport}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
        >
          <Download className="size-4" />
          Download PDF Report
        </button>
        <Link
          to={`/project-inquiry?${inquiryParams}` as never}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          <ArrowRight className="size-4" />
          Request Engineering Recommendation
        </Link>
        <Link
          to={"/contact" as never}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          <PhoneCall className="size-4" />
          Talk to an Engineer
        </Link>
        <button
          type="button"
          onClick={copyShareLink}
          aria-live="polite"
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          {copied ? <Check className="size-4 text-emerald-400" /> : <Link2 className="size-4" />}
          {copied ? "Link copied" : "Copy share link"}
        </button>
      </div>
    </div>
  );

  const CrossSectionPanel = (
    <div className="space-y-4">
      <CrossSection core={core} thickness={thickness} extSteel={extSteel} intSteel={intSteel} />
      {ResultCards}
    </div>
  );

  const tabContent = {
    Inputs: InputsPanel,
    Recommendation: RecommendationPanel,
    "Cross Section": CrossSectionPanel,
    Charts: ChartsPanel,
    Compare: ComparePanel,
    Report: ReportPanel,
  }[tab];

  return (
    <div className="min-h-screen bg-[#0A0B0C] text-white">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-400">
            Engineering Decision Support
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Panel Thickness Calculator
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-white/60">
            Dynamic sandwich panel sizing. Live U-value, weight, heat loss and fire suitability update as you change inputs. All values are computed in real time — no static tables, no images.
          </p>
        </div>

        {/* Tabs — always visible, work on desktop and mobile */}
        <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-1.5">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                tab === t
                  ? "bg-emerald-400 text-black"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Desktop: side-by-side inputs + selected tab; Mobile: single column */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">{tab === "Inputs" ? InputsPanel : (
            <div className="hidden lg:block">{InputsPanel}</div>
          )}
          {tab === "Inputs" && (
            <div className="mt-6 lg:hidden">
              <CrossSection core={core} thickness={thickness} extSteel={extSteel} intSteel={intSteel} />
            </div>
          )}
          </div>
          <div className="lg:col-span-7">
            {tab === "Inputs" ? (
              <div className="space-y-4">
                <CrossSection core={core} thickness={thickness} extSteel={extSteel} intSteel={intSteel} />
                {ResultCards}
              </div>
            ) : (
              tabContent
            )}
          </div>
        </div>

        {/* CTA row */}
        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/10 via-white/[0.02] to-transparent p-5">
          <div className="mr-auto">
            <div className="text-sm font-semibold text-white">
              Ready to lock in {thickness} mm {core}?
            </div>
            <div className="text-xs text-white/60">
              NEVO Engineering will validate the design against project-specific loads, fire and thermal requirements.
            </div>
          </div>
          <Link
            to={`/project-inquiry?${inquiryParams}` as never}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300"
          >
            Request Recommendation <ArrowRight className="size-4" />
          </Link>
          <button
            type="button"
            onClick={downloadReport}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            <Download className="size-4" /> Download Report
          </button>
          <button
            type="button"
            onClick={downloadPdfReport}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            <Download className="size-4" /> Download PDF
          </button>
          <Link
            to={"/contact" as never}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            <MessageSquare className="size-4" /> Talk to Engineer
          </Link>
        </div>

        <p className="mt-6 text-xs text-white/40">
          This calculator provides conceptual guidance only. Final sandwich panel thickness must be verified by project-specific engineering, local regulations, fire requirements and thermal performance calculations.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit: string;
  tone: "emerald" | "white" | "amber" | "rose";
}) {
  const toneCls = {
    emerald: "text-emerald-300",
    white: "text-white",
    amber: "text-amber-300",
    rose: "text-rose-300",
  }[tone];
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className={`font-mono text-lg font-semibold ${toneCls}`}>{value}</div>
      {unit && <div className="font-mono text-[10px] text-white/50">{unit}</div>}
    </div>
  );
}

function ScoreBadge({
  label,
  value,
}: {
  label: string;
  value: "Excellent" | "Very Good" | "Good" | "Limited" | "Not Recommended";
}) {
  return (
    <div className={`rounded-xl border p-3 ${performanceBadge(value)}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function ReportRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">{k}</dt>
      <dd className="font-mono text-sm text-white">{v}</dd>
    </div>
  );
}
