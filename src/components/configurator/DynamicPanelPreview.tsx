import { cn } from "@/lib/utils";
import {
  type Config,
  type PanelType,
  type ProfileType,
  CORE_TEXTURES,
  findColor,
  PROFILES,
} from "./panel-data";

interface Props {
  cfg: Config;
  className?: string;
  /** Show dimension arrow + textual labels on the SVG. */
  showLabels?: boolean;
  /** Show floating badges (panel type + profile) over the preview. */
  showBadges?: boolean;
  /** Aspect ratio wrapper class, defaults to 16/10. */
  ratio?: string;
}

/**
 * Dynamic, state-driven sandwich-panel preview rendered entirely with SVG.
 *
 * - Exterior & interior steel skins are two independent <path>/<rect> layers,
 *   each filled with its own RAL colour. Changing a colour only ever repaints
 *   that one layer — never the core, never the background.
 * - The core layer uses a per-material SVG <pattern> (foam, wool, fiber, beads).
 * - Thickness scales the core height. Profile changes the geometry of the
 *   exterior skin's top edge (ribs, wave, trapezoidal).
 * - Panel type drives the overall silhouette (roof panels use trapezoidal
 *   ribs regardless of the chosen profile, cold-room panels emphasise
 *   thickness, cleanroom stays flush).
 */
export function DynamicPanelPreview({
  cfg,
  className,
  showLabels = true,
  showBadges = true,
  ratio = "aspect-[16/10]",
}: Props) {
  const ext = findColor(cfg.extColor);
  const intC = findColor(cfg.intColor);
  const coreDef = CORE_TEXTURES[cfg.core];

  const width = 720;
  const height = 440;
  const padX = 72;
  const panelW = width - padX * 2;

  // Steel visual thickness — realistic-looking, scales slightly with gauge.
  const skinExtH = 8 + (cfg.extSteel - 0.4) * 6;
  const skinIntH = 8 + (cfg.intSteel - 0.4) * 6;

  // Core visual thickness — scales linearly with real thickness (30..250 mm).
  const minCore = 24;
  const maxCore = 260;
  const t = Math.max(30, Math.min(250, cfg.thickness));
  const coreH = minCore + ((t - 30) / (250 - 30)) * (maxCore - minCore);

  const totalH = coreH + skinExtH + skinIntH + 40; // 40 = space for profile rise
  const startY = (height - totalH) / 2 + 20; // top of exterior base line

  const patternId = `nevo-core-${cfg.core.replace(/\s/g, "")}`;

  // Effective profile — roof panels always use trapezoidal ribs.
  const effectiveProfile: ProfileType = cfg.panelType === "roof" ? "Trapezoidal Roof" : cfg.profile;

  const extPath = buildExteriorPath(
    padX,
    startY,
    panelW,
    skinExtH,
    effectiveProfile,
    cfg.panelType,
  );

  const coreTop = startY + skinExtH;
  const intTop = coreTop + coreH;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-black/5 bg-white p-4 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)] md:p-6",
        ratio,
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`${cfg.core} sandwich panel, ${cfg.thickness}mm, exterior ${cfg.extColor}, interior ${cfg.intColor}, ${effectiveProfile} profile`}
      >
        <defs>
          <CorePattern
            id={patternId}
            kind={coreDef.pattern}
            base={coreDef.base}
            accent={coreDef.accent}
          />
          <linearGradient id="nevo-skin-shade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
          </linearGradient>
          <linearGradient id="nevo-core-shade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0.15)" />
            <stop offset="45%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </linearGradient>
        </defs>

        {/* CORE — only changes when core material or thickness changes */}
        <g data-layer="core">
          <rect x={padX} y={coreTop} width={panelW} height={coreH} fill={`url(#${patternId})`} />
          <rect x={padX} y={coreTop} width={panelW} height={coreH} fill="url(#nevo-core-shade)" />
          <rect
            x={padX}
            y={coreTop}
            width={panelW}
            height={coreH}
            fill="none"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={0.8}
          />
        </g>

        {/* EXTERIOR STEEL SKIN — colour controlled ONLY by cfg.extColor */}
        <g data-layer="exterior-skin">
          <path d={extPath} fill={ext.hex} stroke="rgba(0,0,0,0.35)" strokeWidth={0.8} />
          <path d={extPath} fill="url(#nevo-skin-shade)" opacity={0.55} />
        </g>

        {/* INTERIOR STEEL SKIN — colour controlled ONLY by cfg.intColor */}
        <g data-layer="interior-skin">
          <rect
            x={padX}
            y={intTop}
            width={panelW}
            height={skinIntH}
            fill={intC.hex}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={0.8}
          />
          <rect
            x={padX}
            y={intTop}
            width={panelW}
            height={skinIntH}
            fill="url(#nevo-skin-shade)"
            opacity={0.4}
          />
        </g>

        {/* Joint markers at panel edges */}
        <g data-layer="joints" opacity={0.35}>
          <rect
            x={padX - 6}
            y={startY}
            width={6}
            height={coreH + skinExtH + skinIntH}
            fill="#000"
            opacity={0.1}
          />
          <rect
            x={padX + panelW}
            y={startY}
            width={6}
            height={coreH + skinExtH + skinIntH}
            fill="#000"
            opacity={0.1}
          />
        </g>

        {showLabels && (
          <g data-layer="labels" fontFamily="ui-monospace, 'SF Mono', Menlo, monospace">
            {/* Thickness dimension */}
            <g stroke="#111" strokeWidth={0.7} fill="#111">
              <line
                x1={padX + panelW + 28}
                y1={startY}
                x2={padX + panelW + 28}
                y2={intTop + skinIntH}
              />
              <line x1={padX + panelW + 24} y1={startY} x2={padX + panelW + 32} y2={startY} />
              <line
                x1={padX + panelW + 24}
                y1={intTop + skinIntH}
                x2={padX + panelW + 32}
                y2={intTop + skinIntH}
              />
              <text
                x={padX + panelW + 40}
                y={startY + (coreH + skinExtH + skinIntH) / 2 + 4}
                fontSize={12}
                fontWeight={600}
              >
                {cfg.thickness} mm
              </text>
            </g>
            {/* Skin + core annotations */}
            <g fontSize={10} fill="#4b5563">
              <text x={padX} y={startY - 14}>
                EXT · {cfg.extColor} · {cfg.extSteel.toFixed(2)} mm
              </text>
              <text x={padX} y={intTop + skinIntH + 20}>
                INT · {cfg.intColor} · {cfg.intSteel.toFixed(2)} mm
              </text>
              <text
                x={padX + panelW - 6}
                y={coreTop + coreH / 2 + 4}
                textAnchor="end"
                fontSize={11}
                fill="rgba(0,0,0,0.7)"
              >
                CORE · {cfg.core}
              </text>
            </g>
          </g>
        )}
      </svg>

      {showBadges && (
        <>
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-black/10 bg-white/95 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-black/70 backdrop-blur">
            <span
              className="size-2 rounded-full"
              style={{ background: ext.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)" }}
            />
            {panelTypeLabel(cfg.panelType)}
          </div>
          <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-black/10 bg-white/95 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-black/70 backdrop-blur">
            {effectiveProfile}
          </div>
        </>
      )}
    </div>
  );
}

function panelTypeLabel(t: PanelType): string {
  return t === "wall"
    ? "Wall Panel"
    : t === "roof"
      ? "Roof Panel"
      : t === "coldroom"
        ? "Cold Room Panel"
        : t === "cleanroom"
          ? "Clean Room Panel"
          : "Fire Rated Panel";
}

/* --------------------------- Core patterns --------------------------- */

function CorePattern({
  id,
  kind,
  base,
  accent,
}: {
  id: string;
  kind: "foam-yellow" | "foam-warm" | "wool" | "fiber" | "beads";
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
        <path
          d="M0 4 Q6 1 13 4 T26 4"
          stroke={accent}
          strokeWidth="0.7"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M0 8 Q7 5 14 9 T26 8"
          stroke={accent}
          strokeWidth="0.6"
          fill="none"
          opacity="0.6"
        />
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
  // beads (EPS)
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

/* --------------------------- Profile geometry --------------------------- */

function buildExteriorPath(
  x: number,
  y: number,
  w: number,
  h: number,
  profile: ProfileType,
  panelType: PanelType,
): string {
  const bottom = y + h;
  const top = y;

  // Start bottom-left, go up left edge, then draw the top profile, then down right edge, close.
  let d = `M ${x} ${bottom} L ${x} ${top} `;

  if (profile === "Trapezoidal Roof") {
    const ribCount = 6;
    const rw = w / ribCount;
    const rise = 26;
    for (let i = 0; i < ribCount; i++) {
      const rx = x + i * rw;
      d += `L ${rx + rw * 0.12} ${top} `;
      d += `L ${rx + rw * 0.28} ${top - rise} `;
      d += `L ${rx + rw * 0.72} ${top - rise} `;
      d += `L ${rx + rw * 0.88} ${top} `;
    }
    d += `L ${x + w} ${top} `;
  } else if (profile === "Wave") {
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const px = x + (w * i) / steps;
      const py = top - (Math.sin((i / steps) * Math.PI * 10) + 1) * 3;
      d += `L ${px} ${py} `;
    }
  } else if (profile === "Micro Rib") {
    const ribs = 80;
    const rw = w / ribs;
    for (let i = 0; i < ribs; i++) {
      const rx = x + i * rw;
      d += `L ${rx} ${top} L ${rx + rw * 0.5} ${top - 1.2} L ${rx + rw} ${top} `;
    }
  } else if (profile === "Mini Rib") {
    const ribs = 28;
    const rw = w / ribs;
    for (let i = 0; i < ribs; i++) {
      const rx = x + i * rw;
      d += `L ${rx + rw * 0.3} ${top} L ${rx + rw * 0.4} ${top - 3.5} L ${rx + rw * 0.6} ${top - 3.5} L ${rx + rw * 0.7} ${top} `;
    }
    d += `L ${x + w} ${top} `;
  } else if (profile === "Linear") {
    const ribs = 10;
    const rw = w / ribs;
    for (let i = 0; i < ribs; i++) {
      const rx = x + i * rw;
      d += `L ${rx + rw * 0.4} ${top} L ${rx + rw * 0.47} ${top - 6} L ${rx + rw * 0.53} ${top - 6} L ${rx + rw * 0.6} ${top} `;
    }
    d += `L ${x + w} ${top} `;
  } else {
    // Flat
    d += `L ${x + w} ${top} `;
  }

  d += `L ${x + w} ${bottom} Z`;
  return d;
}

// Re-export for consumers that want to iterate profile options next to the preview.
export { PROFILES };
