// Shared knowledge-article registry — used by /knowledge-hub and /knowledge-hub/$slug
import k01 from "@/assets/knowledge/01-blueprint.jpg";
import k03 from "@/assets/knowledge/03-3d-factory.jpg";
import k06 from "@/assets/knowledge/06-production-line.jpg";
import k07 from "@/assets/knowledge/07-laminator.jpg";
import k14 from "@/assets/knowledge/14-polyol.jpg";
import k16 from "@/assets/knowledge/16-rockwool.jpg";
import k17 from "@/assets/knowledge/17-pir-panel.jpg";
import k21 from "@/assets/knowledge/21-coldroom-panel.jpg";
import k23 from "@/assets/knowledge/23-cleanroom.jpg";
import k26 from "@/assets/knowledge/26-industrial-bldg.jpg";
import k28 from "@/assets/knowledge/28-fire-rating.jpg";
import k33 from "@/assets/knowledge/33-layout.jpg";
import k36 from "@/assets/knowledge/36-investment-report.jpg";

export type Category =
  | "PIR"
  | "PUR"
  | "Rock Wool"
  | "EPS"
  | "Cold Rooms"
  | "Clean Rooms"
  | "Fire"
  | "Thermal"
  | "Production Lines"
  | "Factory Design"
  | "Steel Coils"
  | "Chemicals"
  | "Automation"
  | "Quality"
  | "Project Management";

export type ArticleSection = { h: string; p: string[] };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  category: Category;
  section: string;
  readMin: number;
  level: "Beginner" | "Professional" | "Expert";
  featured?: boolean;
  popular?: boolean;
  date: string;
  author: string;
  body: ArticleSection[];
  key_takeaways: string[];
};

const AUTHOR = "NEVO Engineering Desk";

export const ARTICLES: Article[] = [
  {
    slug: "pir-vs-rockwool",
    title: "PIR vs Rock Wool — the complete engineering comparison",
    excerpt: "Thermal, fire, mechanical and TCO comparison across 11 criteria with test data.",
    cover: k17,
    category: "PIR",
    section: "Technical Articles",
    readMin: 14,
    level: "Professional",
    featured: true,
    popular: true,
    date: "2026-05-18",
    author: AUTHOR,
    key_takeaways: [
      "PIR delivers λ ≈ 0.022 W/mK — roughly 60% better thermal performance than rock wool at the same thickness.",
      "Rock wool reaches A2-s1,d0 non-combustible; PIR typically achieves B-s1,d0 with modern formulations.",
      "For cold storage, PIR at 100–200 mm is standard. For fire-critical envelopes, rock wool remains the safe default.",
    ],
    body: [
      {
        h: "Why the comparison matters",
        p: [
          "Sandwich panel selection is the single biggest driver of a building's thermal envelope, fire behaviour and installed cost. PIR and rock wool are the two dominant cores in the industrial market — and they behave very differently.",
          "This guide compares them across eleven engineering criteria drawn from EN 14509, EN 13501-1 and NEVO's in-house test bench. Numbers reflect production panels, not laboratory samples.",
        ],
      },
      {
        h: "Thermal conductivity",
        p: [
          "PIR: λ ≈ 0.022 W/mK, stable across normal operating temperatures. Rock wool: λ ≈ 0.037–0.040 W/mK depending on density.",
          "In practical terms, a 100 mm PIR panel matches the U-value of a 170 mm rock wool panel — a decisive advantage where space or weight is limited.",
        ],
      },
      {
        h: "Fire performance",
        p: [
          "Rock wool is non-combustible and delivers A2-s1,d0. PIR delivers B-s1,d0 with limited smoke and no flaming droplets when produced with proper facer bonding and edge sealing.",
          "For petrochemical, power and high-rise projects, rock wool is often mandated. For food, cold storage and general industrial buildings, PIR is compliant and preferred for its thermal and structural benefits.",
        ],
      },
      {
        h: "Mechanical behaviour",
        p: [
          "PIR panels reach 100–150 kPa compressive strength, allowing longer spans with fewer sub-purlins. Rock wool lamella panels reach 40–80 kPa but offer superior shear performance and dimensional stability at temperature.",
        ],
      },
      {
        h: "Total cost of ownership",
        p: [
          "On a 25-year TCO basis, PIR wins in energy-driven envelopes (cold rooms, freezers, food plants). Rock wool wins where fire compartmentation, acoustic isolation or insurance-driven risk premiums dominate.",
        ],
      },
      {
        h: "Recommendation matrix",
        p: [
          "Cold rooms and freezers below 0 °C: PIR, 100–200 mm.",
          "Food processing, GMP clean rooms: PIR with hygienic facers or HPL.",
          "Petrochemical, power, high-rise, EI-rated compartments: rock wool.",
          "General industrial and logistics: PIR default, rock wool where required by code.",
        ],
      },
    ],
  },
  {
    slug: "u-value-thickness",
    title: "How to size panel thickness for any climate",
    excerpt: "A step-by-step method using U-value targets, degree days and hygrothermal safety.",
    cover: k28,
    category: "Thermal",
    section: "Engineering Guides",
    readMin: 11,
    level: "Professional",
    featured: true,
    date: "2026-05-02",
    author: AUTHOR,
    key_takeaways: [
      "Start with a target U-value from local code or client brief, then solve d = λ / U.",
      "Add a 10–15% margin for interface losses, joints and long-term ageing.",
      "Always verify hygrothermal safety with a WUFI or Glaser check for cold-side condensation.",
    ],
    body: [
      {
        h: "Step 1 — Establish the target U-value",
        p: [
          "For most European industrial envelopes, U-values fall between 0.16 and 0.28 W/m²K. For −25 °C freezers, drop to 0.14 W/m²K or lower. Middle East industrial buildings typically target 0.30–0.45 W/m²K.",
        ],
      },
      {
        h: "Step 2 — Solve for panel thickness",
        p: [
          "Thickness in metres d = λ / U. For PIR (λ = 0.022) and U = 0.20 W/m²K: d = 0.022 / 0.20 = 0.110 m → specify a 120 mm panel.",
        ],
      },
      {
        h: "Step 3 — Add engineering margin",
        p: [
          "Add 10–15% to compensate for joint losses, thermal bridging at fixings and long-term thermal drift.",
        ],
      },
      {
        h: "Step 4 — Hygrothermal safety",
        p: [
          "Run a Glaser or WUFI check to confirm the interstitial dewpoint stays inside the insulated envelope. Adjust vapour barriers if the check flags condensation risk.",
        ],
      },
      {
        h: "Worked example — cold storage in Dubai",
        p: [
          "Interior −22 °C, exterior 45 °C. Target U = 0.14 W/m²K. d = 0.022 / 0.14 = 0.157 m → specify 180 mm PIR with cam-lock joints and floor U-value ≤ 0.18 W/m²K.",
        ],
      },
    ],
  },
  {
    slug: "continuous-line-101",
    title: "Continuous sandwich panel line — 101",
    excerpt:
      "How a continuous PIR line works: coil, roll-forming, chemical mixing, laminator, saw.",
    cover: k07,
    category: "Production Lines",
    section: "Production Technology",
    readMin: 12,
    level: "Beginner",
    featured: true,
    popular: true,
    date: "2026-04-10",
    author: AUTHOR,
    key_takeaways: [
      "A continuous line is a single flow — coil unwinding, profiling, foaming, curing, cutting and stacking — all synchronised.",
      "Line speed of a modern PIR line runs 6–15 m/min depending on thickness.",
      "The laminator is the heart of the process; conveyor temperature and length define cure quality.",
    ],
    body: [
      {
        h: "The eight sub-stations",
        p: [
          "1. Coil accumulator, 2. Roll-former, 3. Corona / edge treatment, 4. Chemical mixing head, 5. Double-belt laminator, 6. Cooling zone, 7. Flying saw, 8. Stacker.",
        ],
      },
      {
        h: "Coil handling",
        p: [
          "Two decoilers with automatic strip-splicers keep the line running through coil changes. Accumulators buffer 60–120 seconds of strip to eliminate stoppages.",
        ],
      },
      {
        h: "Roll-forming and edge treatment",
        p: [
          "Precision roll-form stations profile the top and bottom facings. Corona or gas-flame treatment activates the steel surface for optimal foam-to-metal adhesion.",
        ],
      },
      {
        h: "Chemical mixing and foam deposition",
        p: [
          "High-pressure impingement mixing head delivers a homogeneous polyol/MDI blend across the strip width. Modern lines control mass flow to ±0.5% for perfect density.",
        ],
      },
      {
        h: "Laminator and cure",
        p: [
          "The double-belt laminator holds temperature at 55–75 °C for 90–180 seconds — the exact recipe depends on thickness and formulation. This is where density, adhesion and dimensional stability are locked in.",
        ],
      },
      {
        h: "Cutting, stacking and packing",
        p: [
          "A flying saw cuts panels to length on the fly. Automatic stackers protect edges and load pallets ready for shrink-wrap and dispatch.",
        ],
      },
    ],
  },
  {
    slug: "cold-room-design",
    title: "Cold room panel design for −25 °C freezers",
    excerpt: "Thickness, vapor barriers, cam-locks, floor buildup and door engineering.",
    cover: k21,
    category: "Cold Rooms",
    section: "Industry Applications",
    readMin: 10,
    level: "Professional",
    date: "2026-04-22",
    popular: true,
    author: AUTHOR,
    key_takeaways: [
      "180–200 mm PIR is the reference for −25 °C freezers in most climates.",
      "Cam-lock joints outperform tongue-and-groove for airtightness at low temperature.",
      "Floor build-up must include heater cables to prevent frost heave under freezer slabs.",
    ],
    body: [
      {
        h: "Envelope strategy",
        p: [
          "For a −25 °C freezer, target U ≤ 0.14 W/m²K on walls and roof, ≤ 0.18 W/m²K on the insulated floor. Use continuous PIR panels with cam-lock joints and internal vapour-tight sealant.",
        ],
      },
      {
        h: "Cam-lock joints",
        p: [
          "Cam-locks compress the joint gasket with 15–20 kN of force, ensuring long-term airtightness even after thermal cycling. Specify stainless cams for food-grade areas.",
        ],
      },
      {
        h: "Floor construction",
        p: [
          "Below the slab: 200 mm PIR + vapour barrier + heater cables (to prevent frost heave) + structural concrete + wear coat. Never omit the heater layer on ground-bearing freezer floors.",
        ],
      },
      {
        h: "Doors and lighting",
        p: [
          "Insulated sliding doors with heated frames, LED lighting rated for low temperature and door-opening curtains to control infiltration losses.",
        ],
      },
    ],
  },
  {
    slug: "cleanroom-gmp",
    title: "GMP clean rooms — the panel selection guide",
    excerpt: "Choosing flush panels, HPL finishes and coving for pharma-grade cleanrooms.",
    cover: k23,
    category: "Clean Rooms",
    section: "Industry Applications",
    readMin: 9,
    level: "Professional",
    date: "2026-03-30",
    author: AUTHOR,
    key_takeaways: [
      "Flush panels with rounded coving eliminate particle-trap corners.",
      "HPL and stainless facers are standard for Grade B/C areas; PVDF steel is acceptable for Grade D.",
      "All penetrations must be gasket-sealed and validated against ISO 14644 airtightness.",
    ],
    body: [
      {
        h: "GMP class targets",
        p: [
          "Grade A/B (aseptic filling) demands laminar flow and Class 5 particle counts. Grade C/D allow slightly higher particulate levels but still require smooth, cleanable envelopes.",
        ],
      },
      {
        h: "Panel selection",
        p: [
          "Choose flush-face PIR or rock wool panels with HPL, glass-reinforced polyester or stainless-steel facers. Avoid ribbed profiles — every rib is a particle trap.",
        ],
      },
      {
        h: "Coving and joints",
        p: [
          "Aluminium or stainless coving with 50 mm radius at all wall/floor and wall/ceiling transitions. Silicone joints applied post-installation and tested for continuity.",
        ],
      },
      {
        h: "Validation",
        p: [
          "Airtightness per ISO 14644-3, differential pressure holds for 60 minutes and full particle count validation before handover.",
        ],
      },
    ],
  },
  {
    slug: "fire-en13501",
    title: "Fire performance explained — EN 13501-1",
    excerpt: "Reading fire classifications A2-s1,d0 vs B-s1,d0 and what they mean on site.",
    cover: k28,
    category: "Fire",
    section: "Design Standards",
    readMin: 8,
    level: "Beginner",
    date: "2026-03-11",
    author: AUTHOR,
    key_takeaways: [
      "The letter (A1–F) is the reaction-to-fire class; A1 is non-combustible, F is unrated.",
      "The 's' code is smoke, the 'd' code is flaming droplets — both matter for evacuation safety.",
      "EN 13501-1 rates the material; EN 13501-2 covers fire-resistance of full assemblies (EI, REI).",
    ],
    body: [
      {
        h: "Classes at a glance",
        p: [
          "A1 — Non-combustible, no contribution to fire. A2 — Very limited contribution. B — Limited contribution. C/D — Increasing contribution. E — Ignitable. F — Not tested / not classified.",
        ],
      },
      {
        h: "Smoke and droplets",
        p: [
          "s1 — Little to no smoke. s2 — Moderate. s3 — High. d0 — No flaming droplets. d1 — Limited. d2 — Substantial.",
        ],
      },
      {
        h: "How to read a specification",
        p: [
          "'A2-s1,d0' means the panel is very limited contribution to fire, with little smoke and no droplets — the target for high-risk buildings.",
        ],
      },
      {
        h: "EN 13501-2 fire-resistance",
        p: [
          "Assemblies are rated EI 30/60/90/120 (integrity + insulation) or REI where load-bearing. Sandwich panels are typically tested to EI 30 or EI 60 as non-load-bearing partitions.",
        ],
      },
    ],
  },
  {
    slug: "factory-layout",
    title: "Sandwich panel factory layout — the master template",
    excerpt: "Optimal building shape, line orientation, warehouse and utilities placement.",
    cover: k33,
    category: "Factory Design",
    section: "Factory Development",
    readMin: 15,
    level: "Expert",
    featured: true,
    date: "2026-02-28",
    author: AUTHOR,
    key_takeaways: [
      "Plan a 240 × 60 m building for a single continuous line with room for phase-two expansion.",
      "Coil warehouse at one end, finished-goods at the other — straight-line material flow eliminates crossings.",
      "Utilities (chemical tanks, chiller, compressor) belong on the long side, not in the middle of the production hall.",
    ],
    body: [
      {
        h: "Building geometry",
        p: [
          "A modern continuous PIR line is 130–150 m long. Add 40 m for the coil accumulator and 60 m for finished-goods staging — the minimum building length is 230–250 m. Width 60 m allows two lines side-by-side in the long term.",
        ],
      },
      {
        h: "Material flow",
        p: [
          "Steel coils enter at one end, panels leave the other. This one-way flow removes forklift crossings and reduces the accident rate to near zero.",
        ],
      },
      {
        h: "Utilities placement",
        p: [
          "Chemical tank farm outside on the long side with bunded containment. Chillers on the roof of a mezzanine. Compressor room isolated for acoustic control.",
        ],
      },
      {
        h: "Office and QC",
        p: [
          "Mezzanine office overlooking the laminator gives line supervisors direct sight. QC lab adjacent to the saw with sample cutting station.",
        ],
      },
      {
        h: "Phase-two provisions",
        p: [
          "Design foundations, roof structure and utilities capacity for a second line from day one. Adding capacity later costs 30–40% more than building it in.",
        ],
      },
    ],
  },
  {
    slug: "investment-model",
    title: "The factory investment model, decoded",
    excerpt: "CAPEX line items, OPEX per m², IRR, NPV and phased expansion economics.",
    cover: k36,
    category: "Project Management",
    section: "Factory Development",
    readMin: 18,
    level: "Expert",
    popular: true,
    date: "2026-02-15",
    author: AUTHOR,
    key_takeaways: [
      "A 1 M m²/yr continuous PIR factory typically costs 8–12 M USD turnkey.",
      "Payback is 3.5–5 years at 35–45% gross margin.",
      "Phased CAPEX (line two in Year 3) usually delivers the best IRR.",
    ],
    body: [
      {
        h: "CAPEX line items",
        p: [
          "Continuous line (55–60% of CAPEX), building (18–22%), utilities and MEP (10–12%), auxiliaries and IT (5–7%), commissioning and training (3–5%).",
        ],
      },
      {
        h: "OPEX per m²",
        p: [
          "Raw materials 68–75%, labour 6–9%, energy 5–8%, maintenance 2–3%, overheads 8–12%. Raw material discipline is the single biggest OPEX lever.",
        ],
      },
      {
        h: "IRR and NPV",
        p: [
          "Base case: IRR 22–28%, NPV positive from Year 4. Sensitivity: ±10% steel price shifts IRR by 4–6 points.",
        ],
      },
      {
        h: "Phased expansion",
        p: [
          "Adding a rock wool line in Year 3 leverages shared utilities and slashes incremental CAPEX by 45–55%. Plan for it in the initial design.",
        ],
      },
    ],
  },
  {
    slug: "polyol-mdi",
    title: "PIR chemistry — polyol and MDI in production",
    excerpt: "Formulation, mixing, safety and how chemistry drives foam quality.",
    cover: k14,
    category: "Chemicals",
    section: "Raw Materials",
    readMin: 11,
    level: "Expert",
    date: "2026-01-22",
    author: AUTHOR,
    key_takeaways: [
      "PIR is a modified polyurethane with a high isocyanate index (250–350) to promote isocyanurate rings.",
      "Component ratio precision to ±0.5% is what separates good panels from great ones.",
      "MDI requires dedicated PPE and vapour extraction — treat safety as a first-order design decision.",
    ],
    body: [
      {
        h: "The two components",
        p: [
          "Polyol blend: polyol + catalysts + blowing agent (typically pentane) + surfactants + flame retardants. MDI (methylene diphenyl diisocyanate): the isocyanate.",
        ],
      },
      {
        h: "Isocyanate index",
        p: [
          "PUR: index 105–115. PIR: index 250–350 — the excess isocyanate reacts with itself to form thermally stable isocyanurate rings, giving PIR its fire performance.",
        ],
      },
      {
        h: "Mixing and quality",
        p: [
          "High-pressure impingement mixers deliver stoichiometric precision. Continuous mass-flow control keeps ratio within ±0.5% across the strip width.",
        ],
      },
      {
        h: "Safety",
        p: [
          "MDI handling requires closed loops, vapour extraction, PPE and worker exposure monitoring. Regular training and medical surveillance are mandatory.",
        ],
      },
    ],
  },
  {
    slug: "rockwool-lamella",
    title: "Rock wool lamella — orientation, density, quality",
    excerpt: "Why lamella orientation matters for fire, shear and thermal performance.",
    cover: k16,
    category: "Rock Wool",
    section: "Raw Materials",
    readMin: 9,
    level: "Professional",
    date: "2026-01-14",
    author: AUTHOR,
    key_takeaways: [
      "Fibres run perpendicular to the facers, giving high compressive strength and stable shear behaviour.",
      "Density 100–120 kg/m³ is standard for wall panels; 140–160 kg/m³ for roof and structural uses.",
      "Lamella quality is defined by fibre continuity — no interruptions in the cutting and re-orientation process.",
    ],
    body: [
      {
        h: "What is a lamella panel?",
        p: [
          "Rock wool is originally spun in a horizontal orientation. For sandwich panels, blocks are cut into strips and rotated 90° so the fibres run perpendicular to the facers — this delivers superior compressive strength and dimensional stability.",
        ],
      },
      {
        h: "Density and performance",
        p: [
          "Higher density improves compressive strength, acoustic performance and fire behaviour but also raises weight and cost. Match density to load and code requirements — do not over-specify.",
        ],
      },
      {
        h: "QC checkpoints",
        p: [
          "Fibre continuity, resin content (2.5–4.5%), density variance (±5%), moisture content (< 0.5%) and dimensional tolerance per EN 14509.",
        ],
      },
    ],
  },
  {
    slug: "industrial-buildings",
    title: "Panel selection for industrial buildings",
    excerpt: "Wall and roof panel systems for warehouses, plants and logistic hubs.",
    cover: k26,
    category: "Thermal",
    section: "Industry Applications",
    readMin: 8,
    level: "Beginner",
    date: "2025-12-19",
    author: AUTHOR,
    key_takeaways: [
      "Roof panels use 5-rib trapezoidal profiles for span and drainage.",
      "Wall panels use micro-rib or flush for aesthetics.",
      "Match panel U-value to local energy code and add fire compartment panels where required.",
    ],
    body: [
      {
        h: "Roof panels",
        p: [
          "5-rib trapezoidal profiles span 4–7 m between purlins with 40–80 mm PIR core. Standing-seam options are available for architectural roofs.",
        ],
      },
      {
        h: "Wall panels",
        p: [
          "Micro-rib panels are the workhorse of industrial cladding. Flush panels give a premium architectural look but cost 20–30% more.",
        ],
      },
      {
        h: "Fire compartments",
        p: [
          "Where local code requires EI 60/90 walls, specify rock wool core panels for the compartment lines and PIR elsewhere.",
        ],
      },
    ],
  },
  {
    slug: "qc-en14509",
    title: "Quality control per EN 14509 — the checklist",
    excerpt: "In-line and off-line QC methods, sample intervals and acceptance criteria.",
    cover: k01,
    category: "Quality",
    section: "Installation Guides",
    readMin: 12,
    level: "Professional",
    date: "2025-12-04",
    author: AUTHOR,
    key_takeaways: [
      "In-line QC catches problems in real time — density, thickness, temperature, mix ratio.",
      "Off-line QC covers structural, thermal and fire properties per EN 14509.",
      "Sample every 500 m or every product change — whichever is sooner.",
    ],
    body: [
      {
        h: "In-line QC",
        p: [
          "Continuous monitoring of laminator temperature, chemical mass flow ratio, strip speed and panel dimensional stability. Automatic alarms halt the line before defective product is stacked.",
        ],
      },
      {
        h: "Off-line QC (EN 14509)",
        p: [
          "Density, thermal conductivity, bond strength, dimensional stability, water absorption and reaction-to-fire tests on sample coupons.",
        ],
      },
      {
        h: "Sample plan",
        p: [
          "Every 500 m or every product change — whichever comes first. Full type-test recertification every 5 years or when raw material formulation changes.",
        ],
      },
      {
        h: "Traceability",
        p: [
          "Every panel carries a batch code linking it to raw material lots, line settings and QC results — essential for warranty and root-cause analysis.",
        ],
      },
    ],
  },
];

export const ARTICLES_BY_SLUG = Object.fromEntries(ARTICLES.map((a) => [a.slug, a]));

// Legacy k03/k06 references kept for future body imagery
export const _unused_covers = [k03, k06];
