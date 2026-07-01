import { Section, SectionHeader } from "@/components/site/primitives";

// Approximate normalized coordinates (0-100) for pins on an equirectangular projection.
const MARKETS = [
  { m: "Saudi Arabia", x: 58.5, y: 44 },
  { m: "UAE", x: 61.5, y: 46 },
  { m: "Oman", x: 63, y: 47 },
  { m: "Turkey", x: 55.5, y: 34 },
  { m: "Iraq", x: 58, y: 39 },
  { m: "Russia", x: 62, y: 22 },
  { m: "Kenya", x: 58, y: 60 },
  { m: "Cameroon", x: 51, y: 56 },
];

export function Markets() {
  return (
    <Section tone="default">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeader
            eyebrow="Global markets"
            title="Engineering delivered worldwide."
            lede="Engineering, consultancy, raw materials and production lines shipped globally. Finished panel supply operates across selected regional markets in the Middle East, Africa and Eurasia."
          />
          <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {MARKETS.map((r) => (
              <li key={r.m} className="flex items-center gap-2">
                <span className="inline-flex size-1 rounded-full bg-accent" />
                {r.m}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-8">
          <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 sm:p-10">
            {/* Dot-grid world map */}
            <div className="relative aspect-[2/1] w-full">
              <DotWorldMap className="absolute inset-0 h-full w-full text-border-strong/70" />

              {MARKETS.map((r) => (
                <div
                  key={r.m}
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${r.x}%`, top: `${r.y}%` }}
                >
                  <span className="absolute inset-0 -z-10 size-3 animate-ping rounded-full bg-accent/40" />
                  <span className="block size-2 rounded-full bg-accent ring-4 ring-accent/15" />
                  <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-background px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    {r.m}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-border pt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>NEVO · Global reach map</span>
              <span className="flex items-center gap-2">
                <span className="inline-flex size-1.5 rounded-full bg-accent" />
                Active markets
              </span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/**
 * Minimal dot-grid world silhouette. Rendered from a compact land mask so
 * we get a recognizable map without shipping heavy topojson.
 */
function DotWorldMap({ className }: { className?: string }) {
  // Rough continental mask on a 60x30 grid (width x height). '1' = land.
  const rows = [
    "000000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000000000000000000000000000000000000",
    "000000000000000111111111111111111111100000000000000000000000",
    "000000000011111111111111111111111111111111111100000000000000",
    "000000001111111111111111111111111111111111111111100000000000",
    "000000011111111111111111111111111111111111111111111100000000",
    "000001111111111111111111111111111111111111111111111111100000",
    "000000111111111111111111111111111111111111111111111111100000",
    "000000011110000011111111111111000011111111111111111111100000",
    "000000000000000011111111111100000001111111111111111111000000",
    "000000000000000011111111100000000000011111111111111100000000",
    "000000000000000011111100000000000000000111111111111000000000",
    "000000000000000011111000000000000000000001111111100000000000",
    "000000000000000011110000000000000000000000011111000000000000",
    "000000000000000011110000000000000000000000011111000000000000",
    "000000000000000011100000000000000000000000001111000000000000",
    "000000000000000011000000000000000000000000000111000000000000",
    "000000000000000011000000000000000000000000000011000000000000",
    "000000000000000011100000000000000000000000000010000000000000",
    "000000000000000000111000000000000000000000000000000000000000",
    "000000000000000000011000000000000000000000000000000000000000",
    "000000000000000000010000000000000000000000000000000000000000",
    "000000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000000000000000000000000000000000000",
  ];
  const cols = rows[0].length;
  const rowsN = rows.length;
  const dots: { x: number; y: number }[] = [];
  for (let y = 0; y < rowsN; y++) {
    for (let x = 0; x < cols; x++) {
      if (rows[y][x] === "1") dots.push({ x, y });
    }
  }
  return (
    <svg
      viewBox={`0 0 ${cols} ${rowsN}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.x + 0.5} cy={d.y + 0.5} r={0.28} fill="currentColor" />
      ))}
    </svg>
  );
}
