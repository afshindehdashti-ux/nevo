/**
 * Factory Layout Generator — pure data + geometry engine.
 *
 * Everything the SVG renderer, technical panels and equipment list need
 * is derived here from the four user inputs (capacity / core / automation
 * / building) plus shift pattern. No React, no images, no side effects —
 * so the component tree stays declarative and every change flows through
 * one `computeFactoryLayout(config)` call.
 *
 * Numbers come straight from the conceptual engineering ranges the user
 * shipped (see `CAPACITY_SPEC`). They're intentionally shown as
 * "estimated / conceptual" — the UI must never present them as final.
 */

export type Capacity = 3000 | 5000 | 8000 | 12000 | 20000;
export type Core = "PIR" | "PUR" | "Rock Wool" | "EPS" | "Hybrid";
export type Automation = "Semi Automatic" | "Automatic" | "Fully Automatic";
export type Building = "Single Hall" | "Dual Hall" | "Expansion Ready";
export type Shift = "1 Shift" | "2 Shifts" | "3 Shifts";

export const CAPACITIES: Capacity[] = [3000, 5000, 8000, 12000, 20000];
export const CORES: Core[] = ["PIR", "PUR", "Rock Wool", "EPS", "Hybrid"];
export const AUTOMATIONS: Automation[] = ["Semi Automatic", "Automatic", "Fully Automatic"];
export const BUILDINGS: Building[] = ["Single Hall", "Dual Hall", "Expansion Ready"];
export const SHIFTS: Shift[] = ["1 Shift", "2 Shifts", "3 Shifts"];

// ─── Conceptual engineering spec (verbatim from brief) ─────────────────
type Range = [number, number];
export type CapacitySpec = {
  lines: Range;
  landM2: Range;
  buildingM2: Range;
  powerKW: Range;
  operators: Range;
  forklifts: Range;
  loadingBays: Range;
};

export const CAPACITY_SPEC: Record<Capacity, CapacitySpec> = {
  3000: {
    lines: [1, 1],
    landM2: [6000, 8000],
    buildingM2: [3000, 4500],
    powerKW: [500, 800],
    operators: [15, 25],
    forklifts: [1, 2],
    loadingBays: [1, 2],
  },
  5000: {
    lines: [1, 1],
    landM2: [10000, 13000],
    buildingM2: [5000, 7000],
    powerKW: [900, 1200],
    operators: [25, 35],
    forklifts: [2, 2],
    loadingBays: [2, 2],
  },
  8000: {
    lines: [1, 2],
    landM2: [15000, 20000],
    buildingM2: [7000, 9000],
    powerKW: [1200, 1800],
    operators: [30, 45],
    forklifts: [2, 3],
    loadingBays: [2, 3],
  },
  12000: {
    lines: [2, 2],
    landM2: [20000, 28000],
    buildingM2: [10000, 14000],
    powerKW: [1800, 2600],
    operators: [45, 60],
    forklifts: [3, 4],
    loadingBays: [3, 4],
  },
  20000: {
    lines: [2, 3],
    landM2: [35000, 50000],
    buildingM2: [18000, 25000],
    powerKW: [3000, 4500],
    operators: [70, 100],
    forklifts: [5, 7],
    loadingBays: [5, 8],
  },
};

const fmtRange = (r: Range, unit = "") =>
  r[0] === r[1] ? `${r[0]}${unit}` : `${r[0].toLocaleString()}–${r[1].toLocaleString()}${unit}`;

export const formatRange = fmtRange;

// ─── Derived technical data ─────────────────────────────────────────────
export type TechData = {
  lines: string;
  landM2: string;
  buildingM2: string;
  productionM2: string;
  warehouseM2: string;
  utilityM2: string;
  officeM2: string;
  powerKW: string;
  waterM3day: string;
  compressedAirM3min: string;
  steamKgH: string;
  operators: string;
  forklifts: string;
  loadingBays: string;
};

export function computeTechData(
  capacity: Capacity,
  core: Core,
  automation: Automation,
  building: Building,
  shift: Shift,
): TechData {
  const spec = CAPACITY_SPEC[capacity];
  const bMid = (spec.buildingM2[0] + spec.buildingM2[1]) / 2;

  // Core adjustments — Rock Wool needs more storage + dust rooms; Hybrid ~+15%.
  const coreBldMult =
    core === "Rock Wool" ? 1.15 : core === "Hybrid" ? 1.12 : core === "EPS" ? 1.05 : 1;
  // Building type adjustments.
  const bldMult = building === "Dual Hall" ? 1.18 : building === "Expansion Ready" ? 1.25 : 1;
  const totalBld = Math.round(bMid * coreBldMult * bldMult);

  // Room breakdown (share of total building area).
  const productionM2 = Math.round(totalBld * 0.42);
  const warehouseM2 = Math.round(totalBld * (core === "Rock Wool" ? 0.32 : 0.28));
  const utilityM2 = Math.round(totalBld * 0.12);
  const officeM2 = Math.round(totalBld * 0.06);

  // Automation shifts operator count within the spec range.
  const opsMult = automation === "Fully Automatic" ? 0.7 : automation === "Automatic" ? 0.9 : 1.1;
  const opsBase = (spec.operators[0] + spec.operators[1]) / 2;
  const shiftMult = shift === "3 Shifts" ? 1.8 : shift === "2 Shifts" ? 1.4 : 1;
  const opsFinal = Math.round(opsBase * opsMult * shiftMult);

  // Power adjustments for Rock Wool (curing ovens) + Fully Automatic (robots).
  const powerMult =
    (core === "Rock Wool" ? 1.15 : 1) * (automation === "Fully Automatic" ? 1.1 : 1);
  const powerMid = Math.round(((spec.powerKW[0] + spec.powerKW[1]) / 2) * powerMult);

  // Utility ratios keyed to capacity (per-day / per-min / per-hour).
  const scale = capacity / 10000;
  const waterM3 = Math.max(6, Math.round(18 * scale));
  const airM3 = Math.max(6, Math.round(14 * scale));
  const steamKg = core === "Rock Wool" ? 0 : Math.round(1400 * scale);

  return {
    lines: fmtRange(spec.lines),
    landM2: fmtRange(spec.landM2, " m²"),
    buildingM2: `${totalBld.toLocaleString()} m²`,
    productionM2: `${productionM2.toLocaleString()} m²`,
    warehouseM2: `${warehouseM2.toLocaleString()} m²`,
    utilityM2: `${utilityM2.toLocaleString()} m²`,
    officeM2: `${officeM2.toLocaleString()} m²`,
    powerKW: `${powerMid.toLocaleString()} kW`,
    waterM3day: `${waterM3} m³/day`,
    compressedAirM3min: `${airM3} m³/min`,
    steamKgH: steamKg > 0 ? `${steamKg.toLocaleString()} kg/h` : "—",
    operators: `${opsFinal}`,
    forklifts: fmtRange(spec.forklifts),
    loadingBays: fmtRange(spec.loadingBays),
  };
}

// ─── Equipment list ─────────────────────────────────────────────────────
export type EquipmentItem = {
  name: string;
  qty: string;
  category: "production" | "handling" | "utility" | "safety" | "control";
  reason?: string; // why it's on the list this configuration
};

export function computeEquipment(
  capacity: Capacity,
  core: Core,
  automation: Automation,
): EquipmentItem[] {
  const lines = CAPACITY_SPEC[capacity].lines;
  const lineQty = fmtRange(lines);
  const items: EquipmentItem[] = [];

  // Continuous line — always present.
  items.push({ name: "Decoiler (dual station)", qty: `×${lines[1] * 2}`, category: "production" });
  items.push({ name: "Roll Forming Machine", qty: `×${lines[1]}`, category: "production" });

  // Mixing head varies with chemistry.
  if (core === "PIR" || core === "PUR" || core === "Hybrid") {
    items.push({
      name: `${core === "PUR" ? "PUR" : "PIR"} High-Pressure Mixing Head`,
      qty: `×${lines[1]}`,
      category: "production",
      reason: `Required for ${core} continuous foaming`,
    });
    items.push({ name: "Polyol / MDI Day Tanks", qty: "×2 sets", category: "safety" });
    items.push({
      name: "Pentane Blowing Agent Skid",
      qty: "×1",
      category: "safety",
      reason: "Explosion-proof pentane handling",
    });
  }
  if (core === "Rock Wool" || core === "Hybrid") {
    items.push({
      name: "Rock Wool Lamella Cutting & Turning Unit",
      qty: "×1",
      category: "production",
      reason: "Fibre orientation for structural performance",
    });
    items.push({
      name: "Dust Extraction & Filtration Plant",
      qty: "×1",
      category: "utility",
      reason: "Mandatory for mineral fibre operations",
    });
    items.push({ name: "PU Adhesive Roller Coater", qty: `×${lines[1]}`, category: "production" });
  }
  if (core === "EPS") {
    items.push({ name: "EPS Block Storage & Silos", qty: "×1 zone", category: "handling" });
    items.push({ name: "EPS Hot-Wire Cutting System", qty: "×1", category: "production" });
    items.push({ name: "PU Adhesive Coater", qty: `×${lines[1]}`, category: "production" });
  }

  items.push({ name: "Double Belt Laminator", qty: `×${lines[1]}`, category: "production" });
  items.push({
    name: "Curing Oven / Cooling Section",
    qty: `×${lines[1]}`,
    category: "production",
  });
  items.push({ name: "Flying Saw / Cut-to-Length", qty: `×${lines[1]}`, category: "production" });

  // Stacking / packaging vary with automation.
  if (automation === "Fully Automatic") {
    items.push({
      name: "Robotic Stacking Cell (6-axis)",
      qty: `×${lines[1]}`,
      category: "production",
      reason: "Replaces manual stacking",
    });
    items.push({ name: "Automatic Strapping & Wrapping Line", qty: "×1", category: "production" });
    items.push({
      name: "Central SCADA Control Room",
      qty: "×1",
      category: "control",
      reason: "Line-wide MES / OEE monitoring",
    });
  } else if (automation === "Automatic") {
    items.push({ name: "Automatic Vacuum Stacker", qty: `×${lines[1]}`, category: "production" });
    items.push({ name: "Semi-Automatic Strapping Station", qty: "×1", category: "production" });
    items.push({ name: "PLC Control Cabinet", qty: `×${lines[1]}`, category: "control" });
  } else {
    items.push({ name: "Manual Stacking Table", qty: `×${lines[1]}`, category: "production" });
    items.push({ name: "Manual Strapping / Wrapping Station", qty: "×1", category: "production" });
    items.push({ name: "Local PLC Panels", qty: `×${lines[1]}`, category: "control" });
  }

  // Utilities scale with capacity.
  const compQty = capacity >= 12000 ? "×3" : capacity >= 5000 ? "×2" : "×1";
  items.push({ name: "Screw Air Compressor (oil-free)", qty: compQty, category: "utility" });
  items.push({
    name: "Process Chiller Unit",
    qty: capacity >= 12000 ? "×2" : "×1",
    category: "utility",
  });
  if (core !== "Rock Wool") {
    items.push({ name: "Thermal Oil / Steam Boiler", qty: "×1", category: "utility" });
  }
  items.push({ name: "MV Transformer & LV Distribution", qty: "×1 set", category: "utility" });
  items.push({ name: "Fire Detection & Foam Suppression", qty: "×1 system", category: "safety" });

  items.push({
    name: `Diesel Forklift (3–5 t)`,
    qty: fmtRange(CAPACITY_SPEC[capacity].forklifts),
    category: "handling",
  });

  return items;
}

// ─── SVG geometry ───────────────────────────────────────────────────────
export type ZoneCategory =
  | "raw"
  | "chemical"
  | "safety"
  | "production"
  | "cooling"
  | "cutting"
  | "stacking"
  | "packaging"
  | "finished"
  | "loading"
  | "lab"
  | "utility"
  | "office"
  | "workshop"
  | "expansion";

export type Zone = {
  id: string;
  name: string;
  short: string;
  x: number;
  y: number;
  w: number;
  h: number;
  category: ZoneCategory;
  fn: string;
  approxAreaM2: number;
  equipment: string[];
  notes?: string;
  dashed?: boolean;
};

export type FlowPath = {
  d: string;
  category: "material" | "truck" | "operator" | "utility" | "finished";
  label?: string;
};

export type Layout = {
  viewW: number;
  viewH: number;
  building: { x: number; y: number; w: number; h: number };
  hall2?: { x: number; y: number; w: number; h: number };
  expansion?: { x: number; y: number; w: number; h: number };
  road: { x: number; y: number; w: number; h: number };
  zones: Zone[];
  flows: FlowPath[];
  gridDimM: number; // physical metres per SVG unit for scale bar
};

const CAT_COLORS: Record<ZoneCategory, string> = {
  raw: "#3b6b46",
  chemical: "#8a4a1f",
  safety: "#a33232",
  production: "#0f5a54",
  cooling: "#1e4a7a",
  cutting: "#5a1e7a",
  stacking: "#1a4d80",
  packaging: "#274a8a",
  finished: "#1d4ed8",
  loading: "#b45309",
  lab: "#6b21a8",
  utility: "#a16207",
  office: "#374151",
  workshop: "#4b5563",
  expansion: "#10b981",
};

export const zoneFill = (c: ZoneCategory) => CAT_COLORS[c];

// Building envelope grows with capacity — very simple linear ramp within
// a fixed viewBox so proportions read correctly against the site outline.
const capacityScale = (c: Capacity) =>
  ({ 3000: 0.62, 5000: 0.75, 8000: 0.86, 12000: 0.95, 20000: 1.0 })[c];

export function computeFactoryLayout(cfg: {
  capacity: Capacity;
  core: Core;
  automation: Automation;
  building: Building;
}): Layout {
  const { capacity, core, automation, building } = cfg;
  const viewW = 1200;
  const viewH = 720;

  const s = capacityScale(capacity);
  const spec = CAPACITY_SPEC[capacity];
  const lines = spec.lines[1]; // upper bound → visible line count

  // Site + building envelope.
  const road = { x: 40, y: 620, w: viewW - 80, h: 60 };
  const bldW = Math.round((viewW - 260) * s);
  const bldH = Math.round(460 * s);
  const bldX = 80;
  const bldY = 100;
  const buildingRect = { x: bldX, y: bldY, w: bldW, h: bldH };

  const zones: Zone[] = [];
  const flows: FlowPath[] = [];

  // ── Warehouses on the left / storage cluster ──────────────────────────
  const wCoilW = Math.round(bldW * 0.14);
  zones.push({
    id: "coil",
    name: "PPGI / PPGL Coil Warehouse",
    short: "Coil WH",
    x: bldX,
    y: bldY,
    w: wCoilW,
    h: Math.round(bldH * 0.55),
    category: "raw",
    fn: "Vertical coil racks, C-hook crane, coil traceability.",
    approxAreaM2: Math.round(bldW * 0.14 * bldH * 0.55 * 0.4),
    equipment: ["Overhead crane 10 t", "C-hooks", "Coil racks", "Label printer"],
  });
  zones.push({
    id: "raw",
    name: "Raw Material Warehouse",
    short: "Raw WH",
    x: bldX,
    y: bldY + Math.round(bldH * 0.55),
    w: wCoilW,
    h: Math.round(bldH * 0.45),
    category: "raw",
    fn: "Films, adhesives, spare consumables, pallet racking.",
    approxAreaM2: Math.round(wCoilW * bldH * 0.45 * 0.4),
    equipment: ["Pallet racks", "Reach truck lane"],
  });

  // ── Chemistry / core-specific zone ─────────────────────────────────────
  const chemX = bldX + wCoilW + 6;
  const chemW = Math.round(bldW * 0.16);
  if (core === "PIR" || core === "PUR" || core === "Hybrid") {
    zones.push({
      id: "chem",
      name: "Chemical Storage Room",
      short: "Chem Room",
      x: chemX,
      y: bldY,
      w: chemW,
      h: Math.round(bldH * 0.36),
      category: "chemical",
      fn: `${core === "PUR" ? "PUR" : "PIR"} polyol & MDI storage with bunded tanks.`,
      approxAreaM2: Math.round(chemW * bldH * 0.36 * 0.4),
      equipment: ["Polyol tanks", "MDI tanks", "Metering pumps", "Bunded floor"],
      notes: "ATEX-compliant temperature control.",
    });
    zones.push({
      id: "pentane",
      name: "Pentane Safety Zone",
      short: "Pentane",
      x: chemX,
      y: bldY + Math.round(bldH * 0.36) + 4,
      w: chemW,
      h: Math.round(bldH * 0.22),
      category: "safety",
      fn: "ATEX-rated pentane blowing agent skid & venting.",
      approxAreaM2: Math.round(chemW * bldH * 0.22 * 0.4),
      equipment: ["Pentane skid", "Gas detection", "Explosion-proof lighting"],
      notes: "Physically separated with fire wall.",
    });
    zones.push({
      id: "mixing",
      name: `${core === "PUR" ? "PUR" : "PIR"} Mixing / Foaming Unit`,
      short: "Foaming",
      x: chemX,
      y: bldY + Math.round(bldH * 0.6),
      w: chemW,
      h: Math.round(bldH * 0.4),
      category: "production",
      fn: "High-pressure mixing head, exact ratio & density control.",
      approxAreaM2: Math.round(chemW * bldH * 0.4 * 0.4),
      equipment: ["High-pressure mixing head", "Chillers", "Metering skid"],
    });
  } else if (core === "Rock Wool") {
    zones.push({
      id: "rwfeed",
      name: "Rock Wool Feeding & Cutting",
      short: "RW Feed",
      x: chemX,
      y: bldY,
      w: chemW,
      h: Math.round(bldH * 0.58),
      category: "cutting",
      fn: "Lamella cutting, fibre turning 90°, adhesive coating.",
      approxAreaM2: Math.round(chemW * bldH * 0.58 * 0.4),
      equipment: ["Lamella saw", "Turning unit", "Adhesive coater"],
    });
    zones.push({
      id: "dust",
      name: "Dust Extraction Plant",
      short: "Dust Ext.",
      x: chemX,
      y: bldY + Math.round(bldH * 0.58) + 4,
      w: chemW,
      h: Math.round(bldH * 0.42),
      category: "utility",
      fn: "High-flow filtration for mineral fibre dust.",
      approxAreaM2: Math.round(chemW * bldH * 0.42 * 0.4),
      equipment: ["Bag filters", "Cyclones", "Extraction fans"],
      notes: "Mandatory for mineral wool lines.",
    });
  } else if (core === "EPS") {
    zones.push({
      id: "eps",
      name: "EPS Block Storage",
      short: "EPS WH",
      x: chemX,
      y: bldY,
      w: chemW,
      h: Math.round(bldH * 0.55),
      category: "raw",
      fn: "Pre-expanded EPS block storage & aging.",
      approxAreaM2: Math.round(chemW * bldH * 0.55 * 0.4),
      equipment: ["Block racks", "Aging bins"],
    });
    zones.push({
      id: "epscut",
      name: "EPS Hot-Wire Cutting",
      short: "EPS Cut",
      x: chemX,
      y: bldY + Math.round(bldH * 0.55) + 4,
      w: chemW,
      h: Math.round(bldH * 0.45),
      category: "cutting",
      fn: "Hot-wire slicing to core thickness + PU coating.",
      approxAreaM2: Math.round(chemW * bldH * 0.45 * 0.4),
      equipment: ["Hot-wire cutter", "PU adhesive coater"],
    });
  }

  // ── Production spine (roll form → laminator → cooling → cut → stack → pack) ──
  const prodX = chemX + chemW + 6;
  const prodW = Math.round(bldW * 0.4);
  const stationH = (bldH - 20) / (lines + 1);
  for (let i = 0; i < lines; i++) {
    const y = bldY + 10 + i * stationH * (lines === 1 ? 0.5 : 1);
    const h = lines === 1 ? bldH - 20 : stationH - 10;
    const stepW = prodW / 5;
    const stations: Array<{
      id: string;
      name: string;
      short: string;
      cat: ZoneCategory;
      eq: string[];
      fn: string;
    }> = [
      {
        id: "rf",
        name: "Roll Forming",
        short: "Roll Form",
        cat: "production",
        eq: ["Roll former", "Decoiler"],
        fn: "Profile forming of upper/lower skins.",
      },
      {
        id: "lam",
        name: "Double Belt Laminator",
        short: "Laminator",
        cat: "production",
        eq: ["Double belt press"],
        fn: "Continuous bonding under pressure & heat.",
      },
      {
        id: "cool",
        name: "Cooling Section",
        short: "Cooling",
        cat: "cooling",
        eq: ["Cooling tunnel"],
        fn: "Controlled curing / cooling of the panel.",
      },
      {
        id: "cut",
        name: "Flying Saw",
        short: "Flying Saw",
        cat: "cutting",
        eq: ["Flying cut-to-length saw"],
        fn: "Cut-to-length on the move.",
      },
      {
        id: automation === "Fully Automatic" ? "rstack" : "stack",
        name:
          automation === "Fully Automatic"
            ? "Robotic Stacking"
            : automation === "Automatic"
              ? "Automatic Stacking"
              : "Manual Stacking",
        short: "Stacking",
        cat: "stacking",
        eq:
          automation === "Fully Automatic"
            ? ["6-axis robot", "Vacuum EOAT"]
            : automation === "Automatic"
              ? ["Vacuum stacker"]
              : ["Manual table"],
        fn:
          automation === "Fully Automatic"
            ? "Robotic bundle building."
            : "Bundle formation for packaging.",
      },
    ];
    stations.forEach((st, k) => {
      zones.push({
        id: `${st.id}-${i}`,
        name: `${st.name}${lines > 1 ? ` · Line ${i + 1}` : ""}`,
        short: st.short,
        x: prodX + k * stepW,
        y,
        w: stepW - 4,
        h,
        category: st.cat,
        fn: st.fn,
        approxAreaM2: Math.round(stepW * h * 0.4),
        equipment: st.eq,
      });
    });

    // Material flow arrow along this line.
    const cy = y + h / 2;
    flows.push({
      d: `M${prodX} ${cy} L${prodX + prodW - 6} ${cy}`,
      category: "material",
      label: lines > 1 ? `Line ${i + 1}` : "Material",
    });
    // Operator flow (below the line, dashed).
    flows.push({
      d: `M${prodX + 40} ${y + h - 14} L${prodX + prodW - 40} ${y + h - 14}`,
      category: "operator",
    });
  }

  // ── Packaging + Finished goods + Loading (right cluster) ───────────────
  const rightX = prodX + prodW + 6;
  const rightW = bldW - (rightX - bldX);
  zones.push({
    id: "pack",
    name: automation === "Fully Automatic" ? "Automatic Packaging Line" : "Packaging Area",
    short: "Packaging",
    x: rightX,
    y: bldY,
    w: rightW,
    h: Math.round(bldH * 0.22),
    category: "packaging",
    fn: "Strapping, wrapping, labeling.",
    approxAreaM2: Math.round(rightW * bldH * 0.22 * 0.4),
    equipment:
      automation === "Fully Automatic"
        ? ["Auto strapper", "Stretch wrapper", "Label robot"]
        : ["Strapping tool", "Manual wrapper"],
  });
  zones.push({
    id: "fin",
    name: "Finished Goods Warehouse",
    short: "Finished WH",
    x: rightX,
    y: bldY + Math.round(bldH * 0.22) + 4,
    w: rightW,
    h: Math.round(bldH * 0.5),
    category: "finished",
    fn: "Buffer storage of finished bundles before dispatch.",
    approxAreaM2: Math.round(rightW * bldH * 0.5 * 0.4),
    equipment: ["Heavy-duty racks", "Reach trucks"],
  });
  zones.push({
    id: "load",
    name: "Loading Bays",
    short: "Loading",
    x: rightX,
    y: bldY + Math.round(bldH * 0.76),
    w: rightW,
    h: Math.round(bldH * 0.24),
    category: "loading",
    fn: `${fmtRange(spec.loadingBays)} dock doors with dock levellers.`,
    approxAreaM2: Math.round(rightW * bldH * 0.24 * 0.4),
    equipment: ["Dock levellers", "Dock shelters"],
  });

  // ── Bottom row: Utilities + QC + Office + Workshop ─────────────────────
  const bottomY = bldY + bldH + 12;
  const bottomH = 90;
  const bottomZones: Array<{
    id: string;
    name: string;
    short: string;
    cat: ZoneCategory;
    fn: string;
    eq: string[];
  }> = [
    {
      id: "util",
      name: "Utility Room",
      short: "Utility",
      cat: "utility",
      fn: "Chillers, boilers, water treatment.",
      eq: ["Chiller", "Boiler", "Softener"],
    },
    {
      id: "elec",
      name: "Electrical Room",
      short: "Electrical",
      cat: "utility",
      fn: "MV transformer, LV distribution.",
      eq: ["Transformer", "LV switchgear"],
    },
    {
      id: "air",
      name: "Air Compressor Room",
      short: "Compressors",
      cat: "utility",
      fn: "Oil-free screw compressors + receivers.",
      eq: ["Screw compressor", "Air dryer", "Receiver"],
    },
    {
      id: "lab",
      name: "Quality Control Lab",
      short: "QC Lab",
      cat: "lab",
      fn: "Density, adhesion, fire, thermal testing.",
      eq: ["Density scale", "Peel tester", "Cone calorimeter"],
    },
    {
      id: "maint",
      name: "Maintenance Workshop",
      short: "Workshop",
      cat: "workshop",
      fn: "Preventive maintenance & spares.",
      eq: ["Lathe", "Welder", "Spare parts racks"],
    },
    {
      id: "office",
      name: "Administration / Office",
      short: "Office",
      cat: "office",
      fn: "Production office, planning, control room.",
      eq: ["SCADA HMI", "Meeting rooms"],
    },
  ];
  const stepBW = bldW / bottomZones.length;
  bottomZones.forEach((bz, i) => {
    zones.push({
      id: bz.id,
      name: bz.name,
      short: bz.short,
      x: bldX + i * stepBW,
      y: bottomY,
      w: stepBW - 4,
      h: bottomH,
      category: bz.cat,
      fn: bz.fn,
      approxAreaM2: Math.round(stepBW * bottomH * 0.4),
      equipment: bz.eq,
    });
  });

  // ── Second hall (Dual Hall) ───────────────────────────────────────────
  let hall2: Layout["hall2"];
  if (building === "Dual Hall") {
    const h2X = bldX + bldW + 20;
    const h2W = viewW - h2X - 40;
    hall2 = { x: h2X, y: bldY, w: h2W, h: bldH };
    zones.push({
      id: "hall2-fin",
      name: "Dispatch Hall — Finished Goods",
      short: "Dispatch Hall",
      x: h2X + 6,
      y: bldY + 6,
      w: h2W - 12,
      h: Math.round(bldH * 0.7),
      category: "finished",
      fn: "Dedicated dispatch hall for finished bundles.",
      approxAreaM2: Math.round((h2W - 12) * bldH * 0.7 * 0.4),
      equipment: ["Reach trucks", "Heavy racks"],
    });
    zones.push({
      id: "hall2-load",
      name: "Dispatch Loading Bays",
      short: "Dispatch",
      x: h2X + 6,
      y: bldY + Math.round(bldH * 0.72),
      w: h2W - 12,
      h: Math.round(bldH * 0.28),
      category: "loading",
      fn: "Truck loading dedicated to outbound only.",
      approxAreaM2: Math.round((h2W - 12) * bldH * 0.28 * 0.4),
      equipment: ["Dock levellers", "Dock shelters"],
    });
  }

  // ── Expansion pad (Expansion Ready) ───────────────────────────────────
  let expansion: Layout["expansion"];
  if (building === "Expansion Ready") {
    const exX = bldX + bldW + 20;
    const exW = viewW - exX - 40;
    expansion = { x: exX, y: bldY, w: exW, h: bldH };
    zones.push({
      id: "expansion",
      name: "Future Expansion Zone",
      short: "Expansion",
      x: exX + 8,
      y: bldY + 8,
      w: exW - 16,
      h: bldH - 16,
      category: "expansion",
      fn: "Reserved land for second production line & warehouse.",
      approxAreaM2: Math.round((exW - 16) * (bldH - 16) * 0.4),
      equipment: ["Reserved utility taps", "Reserved dock positions"],
      notes: "Utilities pre-sized for scale-up.",
      dashed: true,
    });
  }

  // ── Flows: truck (perimeter), material (already added per line) ────────
  flows.push({
    d: `M${road.x} ${road.y + 30} L${road.x + road.w} ${road.y + 30}`,
    category: "truck",
    label: "Truck circulation",
  });
  // Inbound truck route (coil warehouse)
  flows.push({
    d: `M${road.x + 30} ${road.y + 15} Q ${bldX + wCoilW / 2} ${bldY + bldH + 100} ${bldX + wCoilW / 2} ${bldY + bldH + 20}`,
    category: "truck",
  });
  // Outbound (loading bays)
  flows.push({
    d: `M${rightX + rightW / 2} ${bldY + bldH + 20} Q ${rightX + rightW / 2} ${road.y + 100} ${road.x + road.w - 30} ${road.y + 15}`,
    category: "truck",
    label: "Outbound",
  });
  // Utility flow spine (yellow)
  flows.push({
    d: `M${bldX + wCoilW + chemW / 2} ${bottomY - 4} L${bldX + wCoilW + chemW / 2} ${bldY + bldH / 2}`,
    category: "utility",
  });

  return {
    viewW,
    viewH,
    building: buildingRect,
    hall2,
    expansion,
    road,
    zones,
    flows,
    gridDimM: Math.round(80 / s), // metres per 100 SVG units, informative
  };
}

// ─── Expansion recommendation copy ──────────────────────────────────────
export function expansionRecommendation(cfg: { capacity: Capacity; building: Building }): string {
  if (cfg.building === "Expansion Ready") {
    return `Reserve ${Math.round(CAPACITY_SPEC[cfg.capacity].landM2[1] * 0.5).toLocaleString()} m² adjacent land; pre-size utilities for +50% throughput.`;
  }
  if (cfg.building === "Dual Hall") {
    return "Dual-hall layout already separates production & dispatch — plan future line inside production hall.";
  }
  return "Single hall is compact; if scaling beyond 50%, switch to Dual Hall or Expansion Ready.";
}

export function recommendedBuildingCopy(cfg: { capacity: Capacity; core: Core }): string {
  if (cfg.capacity >= 12000) return "Dual Hall or Expansion Ready recommended for 12,000+ m²/day.";
  if (cfg.core === "Rock Wool") return "Extra warehouse depth recommended for lamella storage.";
  return "Single hall is efficient for this configuration.";
}
