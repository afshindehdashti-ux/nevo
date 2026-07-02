import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { useMemo, useState } from "react";
import {
  Ruler, Thermometer, Flame, Factory, Wallet, TrendingUp, Zap, Package,
  FlaskConical, Weight, Home, LayoutGrid, Snowflake, Sparkles, Map,
  Boxes, DollarSign, ClipboardList, Container, Bot, ArrowRight, Search,
  Calculator, FileDown, Share2, Mail, Save, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroCockpit from "@/assets/tools/hero-cockpit.jpg";
import { SITE } from "@/lib/seo";

export const Route = createFileRoute("/$lang/engineering-tools")({
  component: EngineeringToolsCenter,
  head: ({ params }) => ({
    meta: [
      { title: "Engineering Tools Center — NEVO Industrial" },
      { name: "description", content: "20 professional engineering tools for sandwich panel factories: thickness, U-value, fire rating, capacity, investment, ROI, utility, panel selectors, layout planner and AI engineer." },
      { property: "og:title", content: "Engineering Tools Center — NEVO Industrial" },
      { property: "og:description", content: "Professional engineering software — 20 real-time calculators, AI recommendations and PDF reports for sandwich panel projects." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/${params.lang}/engineering-tools` },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/${params.lang}/engineering-tools` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "/" },
            { "@type": "ListItem", position: 2, name: "Engineering Tools", item: "/engineering-tools" },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Are the NEVO engineering tools free to use?", acceptedAnswer: { "@type": "Answer", text: "Yes. All 20 engineering calculators are free. You can export PDF reports, share results and request a full engineering proposal." } },
            { "@type": "Question", name: "How accurate are the calculations?", acceptedAnswer: { "@type": "Answer", text: "The tools use industry-standard formulas (EN 14509, EN 13501-1, ASTM) calibrated against NEVO's production data. Results are engineering estimates suitable for feasibility and pre-design." } },
            { "@type": "Question", name: "Can I get an engineer to review my results?", acceptedAnswer: { "@type": "Answer", text: "Yes — after any calculation you can request a proposal and a senior industrial engineer will review your inputs within 24 hours." } },
          ],
        }),
      },
    ],
  }),
});

type Category = "Panels" | "Factory" | "Financial" | "Selectors" | "Logistics" | "AI";

type Tool = {
  slug: string;
  title: string;
  desc: string;
  icon: typeof Ruler;
  category: Category;
  href?: string;
  featured?: boolean;
  metric?: string;
};

const TOOLS: Tool[] = [
  { slug: "panel-thickness", title: "Panel Thickness Calculator", desc: "Recommended thickness by application, climate, fire and temperature.", icon: Ruler, category: "Panels", href: "/panel-thickness-calculator", featured: true, metric: "40–200 mm" },
  { slug: "u-value", title: "U-Value Calculator", desc: "Thermal transmittance for PIR, rock wool and EPS across thickness.", icon: Thermometer, category: "Panels", metric: "W/m²K" },
  { slug: "fire-rating", title: "Fire Rating Estimator", desc: "Reaction-to-fire and integrity/insulation estimate per EN 13501.", icon: Flame, category: "Panels", metric: "EI 30–240" },
  { slug: "panel-weight", title: "Panel Weight Calculator", desc: "Weight per m² and per panel — steel + core density.", icon: Weight, category: "Panels", metric: "kg / m²" },
  { slug: "capacity", title: "Production Capacity Calculator", desc: "Annual m² output by line speed, shifts and OEE.", icon: Factory, category: "Factory", featured: true, metric: "m² / year" },
  { slug: "investment", title: "Factory Investment Calculator", desc: "Full CAPEX, OPEX, ROI, IRR, NPV and payback model.", icon: Wallet, category: "Financial", href: "/investment-calculator", featured: true, metric: "USD" },
  { slug: "roi", title: "ROI Calculator", desc: "Return on investment, IRR and payback for a panel factory.", icon: TrendingUp, category: "Financial", metric: "%" },
  { slug: "utility", title: "Utility Consumption Calculator", desc: "Electricity, gas, water and compressed air per m² of panel.", icon: Zap, category: "Factory", metric: "kWh / m²" },
  { slug: "coil", title: "Steel Coil Weight Calculator", desc: "Coil weight, linear meters and panels per coil.", icon: Package, category: "Logistics", metric: "kg / m" },
  { slug: "chemical", title: "Chemical Consumption Calculator", desc: "Polyol, isocyanate and additives per m³ of PIR foam.", icon: FlaskConical, category: "Factory", metric: "kg / m³" },
  { slug: "roof", title: "Roof Panel Selector", desc: "Best roof panel profile for span, snow and wind loads.", icon: Home, category: "Selectors" },
  { slug: "wall", title: "Wall Panel Selector", desc: "Best wall panel for façade type, fire and thermal targets.", icon: LayoutGrid, category: "Selectors" },
  { slug: "cold", title: "Cold Room Panel Selector", desc: "Panel for freezer, chiller and blast rooms −40 °C to +5 °C.", icon: Snowflake, category: "Selectors" },
  { slug: "clean", title: "Clean Room Panel Selector", desc: "GMP class panel — flush profile, HPL, pharma & food.", icon: Sparkles, category: "Selectors" },
  { slug: "layout", title: "Factory Layout Planner", desc: "Interactive plant layout — line, warehouse, utilities.", icon: Map, category: "Factory", href: "/factory-layout-generator", featured: true },
  { slug: "material", title: "Raw Material Consumption", desc: "Steel, chemicals, adhesives per m² of finished panel.", icon: Boxes, category: "Factory", metric: "kg / m²" },
  { slug: "cost", title: "Production Cost Calculator", desc: "Cost per m² — materials, labor, utilities, overhead.", icon: DollarSign, category: "Financial", metric: "USD / m²" },
  { slug: "budget", title: "Project Budget Calculator", desc: "Total budget for a complete panel factory project.", icon: ClipboardList, category: "Financial" },
  { slug: "shipping", title: "Shipping Container Calculator", desc: "Panels per 20'/40' HC container and total containers.", icon: Container, category: "Logistics" },
  { slug: "ai", title: "Engineering AI Assistant", desc: "Ask any engineering question — panels, lines, utilities.", icon: Bot, category: "AI", href: "/ai-assistant", featured: true },
];

const CATEGORIES: (Category | "All")[] = ["All", "Panels", "Factory", "Financial", "Selectors", "Logistics", "AI"];

function EngineeringToolsCenter() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");
  const [activeTool, setActiveTool] = useState<Tool | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    return TOOLS.filter((t) => {
      if (cat !== "All" && t.category !== cat) return false;
      if (tokens.length === 0) return true;
      const hay = `${t.title} ${t.desc} ${t.category} ${t.slug}`.toLowerCase();
      return tokens.every((tok) => hay.includes(tok));
    });
  }, [query, cat]);

  return (
    <div className="min-h-screen bg-[#05070a] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <img loading="lazy" decoding="async" src={heroCockpit} alt="" className="h-full w-full object-cover opacity-40" width={1920} height={1088} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070a] via-[#05070a]/60 to-[#05070a]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.18),transparent_55%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 pt-28 pb-24">
          <nav aria-label="Breadcrumb" className="text-[11px] font-mono uppercase tracking-widest text-white/40 mb-6 flex gap-2 items-center">
            <Link to="/" className="hover:text-emerald-400">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/70">Engineering Tools</span>
          </nav>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-emerald-300">
            <Calculator className="h-3 w-3" /> 20 Engineering Tools · Real-time
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02] max-w-4xl">
            The Engineering <span className="text-emerald-400">Tools Center</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/60 leading-relaxed">
            Professional engineering software for the sandwich panel industry. Twenty calculators — panel thickness, U-value, fire rating, capacity, investment, ROI, utilities, layout — with instant AI recommendations and PDF reports.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold h-12 px-6">
              <Link to="/investment-calculator">Calculate Your Factory <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="border-white/15 bg-white/[0.03] hover:bg-white/[0.06] h-12 px-6">
              <Link to="/download-center">Download Engineering Report</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/15 bg-white/[0.03] hover:bg-white/[0.06] h-12 px-6">
              <Link to="/project-inquiry">Request Engineering Proposal</Link>
            </Button>
            <Button asChild variant="ghost" className="text-white/70 hover:text-white h-12 px-6">
              <Link to="/ai-assistant">Talk to an Engineer</Link>
            </Button>
          </div>

          {/* Metrics strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
            {[
              { k: "20", v: "Engineering Tools" },
              { k: "< 200 ms", v: "Real-time Compute" },
              { k: "PDF · CSV", v: "Exportable Reports" },
              { k: "AI", v: "Senior Engineer Review" },
            ].map((m) => (
              <div key={m.v} className="bg-[#0a0d10] p-6">
                <div className="text-2xl font-semibold tracking-tight text-emerald-400">{m.k}</div>
                <div className="mt-1 text-[11px] font-mono uppercase tracking-widest text-white/50">{m.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTROL BAR */}
      <section className="sticky top-16 z-30 border-b border-white/5 bg-[#05070a]/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 20 engineering tools — thickness, U-value, ROI, layout…"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] pl-10 pr-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-md px-3 py-2 text-xs font-medium transition ${
                  cat === c ? "bg-emerald-500 text-black" : "bg-white/[0.03] border border-white/10 text-white/70 hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TOOL GRID */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-baseline justify-between mb-10">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Engineering library</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Choose a tool — get an answer in seconds</h2>
            </div>
            <span className="text-xs font-mono text-white/40">{filtered.length} tools</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t) => {
              const Icon = t.icon;
              const inner = (
                <div className={`group relative h-full overflow-hidden rounded-2xl border p-6 transition ${
                  t.featured
                    ? "border-emerald-500/25 bg-gradient-to-b from-emerald-500/[0.08] to-transparent hover:border-emerald-500/50"
                    : "border-white/10 bg-white/[0.02] hover:border-emerald-500/30 hover:bg-white/[0.04]"
                }`}>
                  {t.featured && (
                    <span className="absolute top-4 right-4 text-[9px] font-mono uppercase tracking-widest text-emerald-300 border border-emerald-500/30 rounded px-1.5 py-0.5">
                      Featured
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">{t.category}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight group-hover:text-emerald-300 transition">{t.title}</h3>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed">{t.desc}</p>
                  <div className="mt-5 flex items-center justify-between">
                    {t.metric ? (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">{t.metric}</span>
                    ) : <span />}
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                      Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              );
              return t.href ? (
                <Link key={t.slug} to={t.href} className="block h-full">{inner}</Link>
              ) : (
                <button key={t.slug} type="button" onClick={() => setActiveTool(t)} className="text-left h-full">{inner}</button>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI ENGINEER STRIP */}
      <section className="border-y border-white/5 bg-gradient-to-b from-emerald-500/[0.04] to-transparent py-20">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">AI Engineer</div>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Every result — reviewed by a senior industrial engineer</h2>
            <p className="mt-4 text-white/60 leading-relaxed">
              After each calculation, our AI engineer explains the result, recommends the best production line, the right panel type, the utilities you'll need and a phased plan for future expansion.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Explains the engineering behind the number",
                "Recommends the ideal production line for your capacity",
                "Suggests the best panel type, core and thickness",
                "Sizes utilities: power, gas, water, compressed air",
                "Plans phased expansion — Phase I, II, III",
              ].map((li) => (
                <li key={li} className="flex gap-3 text-white/80">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" /> {li}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold h-11">
                <Link to="/ai-assistant">Open AI Engineer <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" className="border-white/15 bg-white/[0.03] h-11">
                <Link to="/ai-project-estimator">AI Project Estimator</Link>
              </Button>
            </div>
          </div>

          {/* Feature chips */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: FileDown, label: "Export PDF" },
              { icon: Save, label: "Save Calculation" },
              { icon: Share2, label: "Share Results" },
              { icon: Mail, label: "Email Report" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <Icon className="h-6 w-6 text-emerald-400" />
                  <div className="mt-4 font-semibold">{f.label}</div>
                  <div className="mt-1 text-xs text-white/50">Available after any calculation.</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Frequently asked</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">About the engineering tools</h2>
          <div className="mt-10 divide-y divide-white/5 border-y border-white/5">
            {[
              { q: "Are the NEVO engineering tools free to use?", a: "Yes. All 20 engineering calculators are free. You can export PDF reports, share results and request a full engineering proposal at no cost." },
              { q: "How accurate are the calculations?", a: "The tools use industry-standard formulas (EN 14509, EN 13501-1, ASTM) calibrated against NEVO's production data. Results are engineering estimates suitable for feasibility and pre-design; final design is validated by our engineering team." },
              { q: "Can I get an engineer to review my results?", a: "Yes — after any calculation you can request a proposal and a senior industrial engineer will review your inputs and reply within 24 hours." },
              { q: "Can I export and share the results?", a: "Yes. Every tool supports PDF export, CSV export, share links and email reports." },
            ].map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                  <span className="font-medium">{f.q}</span>
                  <ChevronRight className="h-4 w-4 text-emerald-400 transition group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-white/60 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">Ready to engineer your factory?</h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto">
            Run the numbers, get an AI review, then talk to a senior engineer. From feasibility to commissioning — one platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold h-12 px-6">
              <Link to="/investment-calculator">Calculate Your Factory</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/15 bg-white/[0.03] h-12 px-6">
              <Link to="/project-inquiry">Request Engineering Proposal</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/15 bg-white/[0.03] h-12 px-6">
              <Link to="/ai-assistant">Talk to an Engineer</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* MINI TOOL MODAL */}
      {activeTool && <MiniToolModal tool={activeTool} onClose={() => setActiveTool(null)} />}
    </div>
  );
}

/* ============================================================
   MINI TOOL MODAL — light real-time compute + AI recommendation
   ============================================================ */

function MiniToolModal({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a0d10] p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl">×</button>
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <tool.icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">{tool.category}</div>
            <h3 className="text-xl font-semibold tracking-tight">{tool.title}</h3>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/60">{tool.desc}</p>

        <MiniCompute slug={tool.slug} />

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold h-10">
            <Link to="/project-inquiry">Request Engineering Proposal</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/15 bg-white/[0.03] h-10">
            <Link to="/ai-assistant">Ask the AI Engineer</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function MiniCompute({ slug }: { slug: string }) {
  // Simple per-tool interactive preview so no calculator feels empty.
  switch (slug) {
    case "u-value":       return <UValueMini />;
    case "fire-rating":   return <FireRatingMini />;
    case "panel-weight":  return <PanelWeightMini />;
    case "capacity":      return <CapacityMini />;
    case "roi":           return <RoiMini />;
    case "utility":       return <UtilityMini />;
    case "coil":          return <CoilMini />;
    case "chemical":      return <ChemicalMini />;
    case "material":      return <MaterialMini />;
    case "cost":          return <CostMini />;
    case "budget":        return <BudgetMini />;
    case "shipping":      return <ShippingMini />;
    case "roof":
    case "wall":
    case "cold":
    case "clean":         return <SelectorMini slug={slug} />;
    default:              return null;
  }
}

/* --- shared UI --- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
function NumInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" {...props} className={`w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50 ${props.className ?? ""}`} />;
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function ResultCard({ label, value, unit, note }: { label: string; value: string | number; unit?: string; note?: string }) {
  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-300">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">
        {value}{unit && <span className="ml-1 text-sm text-white/50">{unit}</span>}
      </div>
      {note && <div className="mt-1 text-[11px] text-white/50">{note}</div>}
    </div>
  );
}
function AiHint({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-400">
        <Bot className="h-3.5 w-3.5" /> AI Engineer
      </div>
      <p className="mt-2 text-sm text-white/70 leading-relaxed">{text}</p>
    </div>
  );
}

/* --- calculators --- */
const CORE_LAMBDA: Record<string, number> = { PIR: 0.022, "Rock Wool": 0.038, EPS: 0.036 };

function UValueMini() {
  const [core, setCore] = useState("PIR");
  const [th, setTh] = useState(100);
  const u = (CORE_LAMBDA[core] / (th / 1000));
  const rec = u < 0.25 ? "cold storage / freezer" : u < 0.4 ? "chiller / clean room" : "industrial building";
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Core"><Select value={core} onChange={setCore} options={["PIR", "Rock Wool", "EPS"]} /></Field>
        <Field label="Thickness (mm)"><NumInput value={th} onChange={(e) => setTh(+e.target.value)} min={40} max={240} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ResultCard label="U-Value" value={u.toFixed(3)} unit="W/m²K" />
        <ResultCard label="R-Value" value={(1 / u).toFixed(2)} unit="m²K/W" />
      </div>
      <AiHint text={`At ${th} mm ${core}, U = ${u.toFixed(3)} W/m²K — ideal for ${rec}. Pair with a continuous ${core === "PIR" ? "PIR" : "mineral wool"} line at 8–12 m/min for consistent thermal quality.`} />
    </div>
  );
}

function FireRatingMini() {
  const [core, setCore] = useState("Rock Wool");
  const [th, setTh] = useState(100);
  const reaction = core === "Rock Wool" ? "A2-s1,d0" : core === "PIR" ? "B-s1,d0" : "E";
  const ei = core === "Rock Wool" ? Math.min(240, Math.round(th * 1.8)) : core === "PIR" ? Math.min(90, Math.round(th * 0.6)) : 15;
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Core"><Select value={core} onChange={setCore} options={["Rock Wool", "PIR", "EPS"]} /></Field>
        <Field label="Thickness (mm)"><NumInput value={th} onChange={(e) => setTh(+e.target.value)} min={50} max={240} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ResultCard label="Reaction to fire" value={reaction} note="EN 13501-1" />
        <ResultCard label="Integrity / Insulation" value={`EI ${ei}`} unit="min" />
      </div>
      <AiHint text={`${core} at ${th} mm reaches ${reaction} and EI ${ei}. For petrochemical, tunnel or high-rise use rock wool. For cold storage where fire load is low, PIR delivers superior thermal performance.`} />
    </div>
  );
}

function PanelWeightMini() {
  const [core, setCore] = useState("PIR");
  const [th, setTh] = useState(80);
  const [steel, setSteel] = useState(0.5);
  const density = core === "PIR" ? 40 : core === "Rock Wool" ? 110 : 15;
  const w = (steel * 2 * 7.85) + (th / 1000) * density;
  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Core"><Select value={core} onChange={setCore} options={["PIR", "Rock Wool", "EPS"]} /></Field>
        <Field label="Thickness (mm)"><NumInput value={th} onChange={(e) => setTh(+e.target.value)} /></Field>
        <Field label="Steel (mm)"><NumInput step={0.05} value={steel} onChange={(e) => setSteel(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ResultCard label="Panel weight" value={w.toFixed(1)} unit="kg / m²" />
        <ResultCard label="Core density" value={density} unit="kg / m³" />
      </div>
      <AiHint text={`Weight of ${w.toFixed(1)} kg/m² is typical for a ${th} mm ${core} panel with ${steel} mm skins — dimension your lifting equipment and truck loads accordingly.`} />
    </div>
  );
}

function CapacityMini() {
  const [speed, setSpeed] = useState(10);       // m/min
  const [width, setWidth] = useState(1.15);     // m
  const [shifts, setShifts] = useState(2);
  const [oee, setOee] = useState(75);
  const daily = speed * 60 * 8 * shifts * width * (oee / 100);
  const yearly = daily * 300;
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Line speed (m/min)"><NumInput value={speed} onChange={(e) => setSpeed(+e.target.value)} /></Field>
        <Field label="Panel width (m)"><NumInput step={0.05} value={width} onChange={(e) => setWidth(+e.target.value)} /></Field>
        <Field label="Shifts / day"><NumInput value={shifts} onChange={(e) => setShifts(+e.target.value)} min={1} max={3} /></Field>
        <Field label="OEE (%)"><NumInput value={oee} onChange={(e) => setOee(+e.target.value)} min={40} max={95} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ResultCard label="Daily output" value={Math.round(daily).toLocaleString()} unit="m² / day" />
        <ResultCard label="Annual output" value={Math.round(yearly).toLocaleString()} unit="m² / year" />
      </div>
      <AiHint text={`At ${speed} m/min with ${shifts} shifts and ${oee}% OEE you reach ~${(yearly / 1e6).toFixed(2)} M m²/year. Recommend a NEVO ${speed < 8 ? "Compact" : speed < 14 ? "Standard" : "High-Speed"} continuous line and a 2-shift maintenance rotation.`} />
    </div>
  );
}

function RoiMini() {
  const [capex, setCapex] = useState(8);        // MUSD
  const [rev, setRev] = useState(12);           // MUSD/yr
  const [margin, setMargin] = useState(18);     // %
  const profit = rev * (margin / 100);
  const payback = capex / profit;
  const roi = (profit * 10 - capex) / capex * 100;
  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-3">
        <Field label="CAPEX (M USD)"><NumInput value={capex} onChange={(e) => setCapex(+e.target.value)} /></Field>
        <Field label="Revenue (M USD/yr)"><NumInput value={rev} onChange={(e) => setRev(+e.target.value)} /></Field>
        <Field label="EBITDA margin (%)"><NumInput value={margin} onChange={(e) => setMargin(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <ResultCard label="EBITDA" value={profit.toFixed(2)} unit="M USD" />
        <ResultCard label="Payback" value={payback.toFixed(1)} unit="years" />
        <ResultCard label="10-yr ROI" value={roi.toFixed(0)} unit="%" />
      </div>
      <AiHint text={`Payback of ${payback.toFixed(1)} years is ${payback < 4 ? "excellent" : payback < 6 ? "healthy" : "long — consider a higher-speed line or a second shift"}. For a 10-year horizon the investment returns ${roi.toFixed(0)}% cumulative.`} />
    </div>
  );
}

function UtilityMini() {
  const [m2, setM2] = useState(1_000_000);
  const power = m2 * 4.2;
  const gas   = m2 * 1.1;
  const water = m2 * 0.05;
  const air   = m2 * 0.9;
  return (
    <div className="mt-6">
      <Field label="Annual production (m²/yr)"><NumInput value={m2} onChange={(e) => setM2(+e.target.value)} /></Field>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ResultCard label="Electricity" value={(power / 1e6).toFixed(2)} unit="GWh / yr" />
        <ResultCard label="Natural gas" value={(gas / 1e3).toFixed(0)} unit="MWh / yr" />
        <ResultCard label="Water" value={(water).toFixed(0)} unit="m³ / yr" />
        <ResultCard label="Compressed air" value={(air / 1e3).toFixed(0)} unit="k Nm³ / yr" />
      </div>
      <AiHint text={`For ${(m2 / 1e6).toFixed(2)} M m²/yr size the transformer at ~${Math.round(power / 8000)} kVA and a ${Math.round(air / 20000)} m³/min compressor room. Recommend heat-recovery on the oven for 12–18% gas savings.`} />
    </div>
  );
}

function CoilMini() {
  const [w, setW] = useState(1.25);
  const [t, setT] = useState(0.5);
  const [id, setId] = useState(508);
  const [od, setOd] = useState(1500);
  const vol = Math.PI / 4 * ((od / 1000) ** 2 - (id / 1000) ** 2) * w; // m³
  const weight = vol * 7850;
  const length = weight / (w * (t / 1000) * 7850);
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Coil width (m)"><NumInput step={0.05} value={w} onChange={(e) => setW(+e.target.value)} /></Field>
        <Field label="Steel thickness (mm)"><NumInput step={0.05} value={t} onChange={(e) => setT(+e.target.value)} /></Field>
        <Field label="Inner Ø (mm)"><NumInput value={id} onChange={(e) => setId(+e.target.value)} /></Field>
        <Field label="Outer Ø (mm)"><NumInput value={od} onChange={(e) => setOd(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ResultCard label="Coil weight" value={Math.round(weight).toLocaleString()} unit="kg" />
        <ResultCard label="Coil length" value={Math.round(length).toLocaleString()} unit="m" />
      </div>
      <AiHint text={`A ${Math.round(weight).toLocaleString()} kg coil feeds ~${Math.round(length).toLocaleString()} m of panel. Plan two decoilers to overlap coil changes and keep line utilisation above 90%.`} />
    </div>
  );
}

function ChemicalMini() {
  const [m3, setM3] = useState(1000); // m³ foam/yr
  const polyol = m3 * 22;
  const iso = m3 * 27;
  return (
    <div className="mt-6">
      <Field label="PIR foam volume (m³/yr)"><NumInput value={m3} onChange={(e) => setM3(+e.target.value)} /></Field>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ResultCard label="Polyol" value={polyol.toLocaleString()} unit="kg / yr" />
        <ResultCard label="Isocyanate (MDI)" value={iso.toLocaleString()} unit="kg / yr" />
      </div>
      <AiHint text={`Recommend two 50 m³ heated tanks (polyol + MDI) and a high-pressure mixing head calibrated at 130 bar. Nitrogen blanketing on MDI is mandatory.`} />
    </div>
  );
}

function MaterialMini() {
  const [m2, setM2] = useState(500_000);
  const steel = m2 * 8;
  const foam = m2 * 3.6;
  const adhesive = m2 * 0.15;
  return (
    <div className="mt-6">
      <Field label="Annual production (m²/yr)"><NumInput value={m2} onChange={(e) => setM2(+e.target.value)} /></Field>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <ResultCard label="Pre-painted steel" value={(steel / 1000).toFixed(0)} unit="t / yr" />
        <ResultCard label="Chemicals" value={(foam / 1000).toFixed(0)} unit="t / yr" />
        <ResultCard label="Adhesive" value={(adhesive / 1000).toFixed(1)} unit="t / yr" />
      </div>
      <AiHint text={`Secure two steel suppliers to hedge coil price; keep 45–60 days of chemical stock. Recommend NEVO's supply desk to lock long-term pricing.`} />
    </div>
  );
}

function CostMini() {
  const [mat, setMat] = useState(9);
  const [lab, setLab] = useState(1.2);
  const [util, setUtil] = useState(0.9);
  const [ovh, setOvh] = useState(1.5);
  const total = mat + lab + util + ovh;
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Materials (USD/m²)"><NumInput step={0.1} value={mat} onChange={(e) => setMat(+e.target.value)} /></Field>
        <Field label="Labor (USD/m²)"><NumInput step={0.1} value={lab} onChange={(e) => setLab(+e.target.value)} /></Field>
        <Field label="Utilities (USD/m²)"><NumInput step={0.1} value={util} onChange={(e) => setUtil(+e.target.value)} /></Field>
        <Field label="Overhead (USD/m²)"><NumInput step={0.1} value={ovh} onChange={(e) => setOvh(+e.target.value)} /></Field>
      </div>
      <div className="mt-4">
        <ResultCard label="Total production cost" value={total.toFixed(2)} unit="USD / m²" />
      </div>
      <AiHint text={`At ${total.toFixed(2)} USD/m² total cost, target a 35–45% gross margin on standard PIR wall panels. Automation can cut labor by ~30%.`} />
    </div>
  );
}

function BudgetMini() {
  const [line, setLine] = useState(5.5);
  const [bldg, setBldg] = useState(2.2);
  const [util, setUtil] = useState(0.9);
  const [wc, setWc] = useState(1.4);
  const total = line + bldg + util + wc;
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Production line (M USD)"><NumInput step={0.1} value={line} onChange={(e) => setLine(+e.target.value)} /></Field>
        <Field label="Building (M USD)"><NumInput step={0.1} value={bldg} onChange={(e) => setBldg(+e.target.value)} /></Field>
        <Field label="Utilities (M USD)"><NumInput step={0.1} value={util} onChange={(e) => setUtil(+e.target.value)} /></Field>
        <Field label="Working capital (M USD)"><NumInput step={0.1} value={wc} onChange={(e) => setWc(+e.target.value)} /></Field>
      </div>
      <div className="mt-4">
        <ResultCard label="Total project budget" value={total.toFixed(2)} unit="M USD" />
      </div>
      <AiHint text={`A ${total.toFixed(1)} M USD project is typical for a 1 M m²/yr NEVO continuous line. Phase in a second line at Year 3 to double capacity with ~55% incremental capex.`} />
    </div>
  );
}

function ShippingMini() {
  const [panels, setPanels] = useState(2000);
  const [len, setLen] = useState(6);
  const perContainer = Math.floor(80 / len) * 8; // rough
  const containers = Math.ceil(panels / perContainer);
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Panel quantity"><NumInput value={panels} onChange={(e) => setPanels(+e.target.value)} /></Field>
        <Field label="Panel length (m)"><NumInput value={len} onChange={(e) => setLen(+e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ResultCard label="Panels per 40' HC" value={perContainer} />
        <ResultCard label="Containers needed" value={containers} unit="× 40' HC" />
      </div>
      <AiHint text={`Recommend flat-rack containers for panels above 12 m and a break-bulk vessel above 40 containers to save 18–25% freight.`} />
    </div>
  );
}

function SelectorMini({ slug }: { slug: string }) {
  const map: Record<string, { core: string; th: number; profile: string; note: string }> = {
    roof:  { core: "PIR",       th: 80,  profile: "5-rib trapezoidal",       note: "Optimal for spans up to 5.5 m under EU snow loads." },
    wall:  { core: "PIR",       th: 100, profile: "Micro-rib hidden fix",    note: "Best for industrial façades with clean aesthetics." },
    cold:  { core: "PIR",       th: 150, profile: "Flush cam-lock",          note: "For −25 °C freezer rooms; U ≈ 0.15 W/m²K." },
    clean: { core: "Rock Wool", th: 100, profile: "Flush GMP",               note: "Hospital / pharma cleanrooms — A2 fire, hygienic finish." },
  };
  const r = map[slug];
  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-3">
        <ResultCard label="Recommended core" value={r.core} />
        <ResultCard label="Thickness" value={r.th} unit="mm" />
        <ResultCard label="Profile" value={r.profile} />
      </div>
      <AiHint text={r.note + " Configure the exact panel in our Product Configurator."} />
    </div>
  );
}
