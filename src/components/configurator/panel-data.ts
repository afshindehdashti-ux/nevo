// Shared types, constants and helpers for the Panel Configurator.
// The configurator route imports from here so that types stay in one place.

export type PanelType = "wall" | "roof" | "coldroom" | "cleanroom" | "fire";
export type CoreMaterial = "PIR" | "PUR" | "Rock Wool" | "EPS" | "Glass Wool";
export type JointType = "Hidden Screw" | "Visible Screw" | "Tongue & Groove" | "Cam-Lock";
export type Coating = "PVDF" | "Polyester" | "Plastisol" | "HDP" | "SMP";
export type ProfileType =
  "Flat" | "Micro Rib" | "Mini Rib" | "Linear" | "Wave" | "Trapezoidal Roof";

export interface Config {
  panelType: PanelType;
  core: CoreMaterial;
  thickness: number;
  width: number;
  length: number;
  joint: JointType;
  extSteel: number;
  intSteel: number;
  coating: Coating;
  extColor: string; // RAL code
  intColor: string; // RAL code
  profile: ProfileType;
  accessories: string[];
}

export const DEFAULT_CONFIG: Config = {
  panelType: "wall",
  core: "PIR",
  thickness: 100,
  width: 1000,
  length: 6,
  joint: "Hidden Screw",
  extSteel: 0.5,
  intSteel: 0.4,
  coating: "PVDF",
  extColor: "RAL 9002",
  intColor: "RAL 9010",
  profile: "Micro Rib",
  accessories: [],
};

export const CORES: {
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

export const CORE_TEXTURES: Record<
  CoreMaterial,
  {
    base: string;
    accent: string;
    pattern: "foam-yellow" | "foam-warm" | "wool" | "fiber" | "beads";
  }
> = {
  PIR: { base: "#F5E6A0", accent: "#D9BC55", pattern: "foam-yellow" },
  PUR: { base: "#F1CE6E", accent: "#B98A2E", pattern: "foam-warm" },
  "Rock Wool": { base: "#8C6A45", accent: "#4E3A22", pattern: "wool" },
  "Glass Wool": { base: "#F0E2A5", accent: "#B89A45", pattern: "fiber" },
  EPS: { base: "#FAFAF6", accent: "#C9C9BE", pattern: "beads" },
};

export const COATING_META: Record<
  Coating,
  { warranty: number; durability: string; priceFactor: number }
> = {
  PVDF: { warranty: 25, durability: "Marine / harsh UV", priceFactor: 1.35 },
  Polyester: { warranty: 10, durability: "Standard exterior", priceFactor: 1.0 },
  Plastisol: { warranty: 15, durability: "Industrial / corrosive", priceFactor: 1.18 },
  HDP: { warranty: 20, durability: "High-durability polymer", priceFactor: 1.22 },
  SMP: { warranty: 15, durability: "Silicon-modified polyester", priceFactor: 1.1 },
};

export const PANEL_TYPE_META: Record<PanelType, { fireBoost: string | null; premium: number }> = {
  wall: { fireBoost: null, premium: 1.0 },
  roof: { fireBoost: null, premium: 1.05 },
  coldroom: { fireBoost: null, premium: 1.15 },
  cleanroom: { fireBoost: null, premium: 1.25 },
  fire: { fireBoost: "EI 120 (A1)", premium: 1.4 },
};

export const JOINTS: JointType[] = ["Hidden Screw", "Visible Screw", "Tongue & Groove", "Cam-Lock"];

export const COATINGS: Coating[] = ["PVDF", "Polyester", "Plastisol", "HDP", "SMP"];

export const PROFILES: ProfileType[] = [
  "Flat",
  "Micro Rib",
  "Mini Rib",
  "Linear",
  "Wave",
  "Trapezoidal Roof",
];

export const THICKNESSES = [30, 40, 50, 60, 80, 100, 120, 150, 200, 250];
export const STEEL_GAUGES = [0.4, 0.45, 0.5, 0.6, 0.7, 0.8];

/**
 * Common industrial sandwich-panel colours (RAL).
 * Hex values are approximate representations of the official RAL matches.
 */
export const COLOR_SWATCHES: { ral: string; name: string; hex: string }[] = [
  { ral: "RAL 9002", name: "Grey White", hex: "#E7EBDA" },
  { ral: "RAL 9010", name: "Pure White", hex: "#F1ECE1" },
  { ral: "RAL 9016", name: "Traffic White", hex: "#F6F6F6" },
  { ral: "RAL 9006", name: "White Aluminium", hex: "#A5A8A6" },
  { ral: "RAL 9007", name: "Grey Aluminium", hex: "#8F8F8C" },
  { ral: "RAL 7016", name: "Anthracite Grey", hex: "#293133" },
  { ral: "RAL 7035", name: "Light Grey", hex: "#D7D7D7" },
  { ral: "RAL 7024", name: "Graphite Grey", hex: "#474A50" },
  { ral: "RAL 5010", name: "Gentian Blue", hex: "#0E4C7E" },
  { ral: "RAL 5005", name: "Signal Blue", hex: "#005387" },
  { ral: "RAL 3000", name: "Flame Red", hex: "#AF2B1E" },
  { ral: "RAL 3020", name: "Traffic Red", hex: "#B81A1F" },
  { ral: "RAL 6005", name: "Moss Green", hex: "#114232" },
  { ral: "RAL 6029", name: "Mint Green", hex: "#00795B" },
  { ral: "RAL 1015", name: "Light Ivory", hex: "#E6D2B5" },
  { ral: "RAL 1003", name: "Signal Yellow", hex: "#F0BA0A" },
  { ral: "RAL 8004", name: "Copper Brown", hex: "#8E402A" },
  { ral: "RAL 8017", name: "Chocolate Brown", hex: "#45322E" },
  { ral: "RAL 9005", name: "Jet Black", hex: "#0A0A0A" },
  { ral: "RAL 9011", name: "Graphite Black", hex: "#1C1F21" },
];

export function findColor(ral: string): { ral: string; name: string; hex: string } {
  return COLOR_SWATCHES.find((c) => c.ral === ral) ?? COLOR_SWATCHES[0];
}

/* ------------------ Engineering result calculations ------------------ */

export function computeResults(cfg: Config) {
  const core = CORES.find((c) => c.id === cfg.core)!;
  const coating = COATING_META[cfg.coating];
  const ptype = PANEL_TYPE_META[cfg.panelType];
  const thicknessM = cfg.thickness / 1000;

  const uValue = core.lambda / thicknessM;
  const steelKg = (cfg.extSteel + cfg.intSteel) * 7.85;
  const coreKg = core.density * thicknessM;
  const weight = +(steelKg + coreKg).toFixed(1);

  const fireRating = ptype.fireBoost && core.fire !== "A1" ? ptype.fireBoost : core.fire;

  const sound =
    20 +
    Math.round(core.density / 12) +
    Math.round(cfg.thickness / 25) +
    Math.round((cfg.extSteel + cfg.intSteel) * 4);

  const thermalScore =
    uValue < 0.2 ? "Excellent" : uValue < 0.3 ? "Very Good" : uValue < 0.45 ? "Good" : "Standard";

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

  const basePrice =
    12 + core.density * 0.11 + cfg.thickness * 0.14 + (cfg.extSteel + cfg.intSteel) * 8;
  const pricePerM2 = +(basePrice * coating.priceFactor * ptype.premium).toFixed(1);
  const totalArea = +((cfg.width / 1000) * cfg.length).toFixed(2);
  const totalPrice = +(pricePerM2 * totalArea).toFixed(0);

  const leadTime =
    (core.id === "Rock Wool" || core.id === "Glass Wool" ? 5 : 3) +
    Math.ceil(cfg.accessories.length / 2) +
    (cfg.panelType === "cleanroom" || cfg.panelType === "fire" ? 2 : 0);

  return {
    uValue: +uValue.toFixed(3),
    weight,
    fireRating,
    sound,
    thermalScore,
    application: app,
    coreDensity: core.density,
    warranty: coating.warranty,
    coatingDurability: coating.durability,
    pricePerM2,
    totalArea,
    totalPrice,
    leadTime,
  };
}
