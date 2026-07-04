import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Users, Package, Megaphone, GraduationCap, Download,
  MessagesSquare, BarChart3, Sparkles, Smartphone, LogIn, Lock, Mail,
  Eye, EyeOff, Bell, Search, ChevronRight, ArrowRight, ShieldCheck,
  Globe2, TrendingUp, DollarSign, Target, Award, FileText, Video,
  PhoneCall, MessageCircle, Ticket, Calendar, Play, Factory, Layers,
  Wrench, BadgeCheck, ClipboardList, Handshake, Building2, MapPin,
  CheckCircle2, ExternalLink, Filter,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { buildSeo, orgJsonLd, breadcrumbJsonLd } from "@/lib/seo";

import p01 from "@/assets/partner-portal/partner-01.png.asset.json";
import p02 from "@/assets/partner-portal/partner-02.png.asset.json";
import p03 from "@/assets/partner-portal/partner-03.png.asset.json";
import p04 from "@/assets/partner-portal/partner-04.png.asset.json";
import p05 from "@/assets/partner-portal/partner-05.png.asset.json";
import p06 from "@/assets/partner-portal/partner-06.png.asset.json";
import p07 from "@/assets/partner-portal/partner-07.png.asset.json";
import p08 from "@/assets/partner-portal/partner-08.png.asset.json";
import p09 from "@/assets/partner-portal/partner-09.png.asset.json";
import p10 from "@/assets/partner-portal/partner-10.png.asset.json";
import p11 from "@/assets/partner-portal/partner-11.png.asset.json";
import p12 from "@/assets/partner-portal/partner-12.png.asset.json";
import p13 from "@/assets/partner-portal/partner-13.png.asset.json";
import p14 from "@/assets/partner-portal/partner-14.png.asset.json";
import p15 from "@/assets/partner-portal/partner-15.png.asset.json";
import p16 from "@/assets/partner-portal/partner-16.png.asset.json";
import p17 from "@/assets/partner-portal/partner-17.png.asset.json";
import p18 from "@/assets/partner-portal/partner-18.png.asset.json";
import p19 from "@/assets/partner-portal/partner-19.png.asset.json";
import p20 from "@/assets/partner-portal/partner-20.png.asset.json";
import p21 from "@/assets/partner-portal/partner-21.png.asset.json";

const A = [p01,p02,p03,p04,p05,p06,p07,p08,p09,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19,p20,p21];

/* ─── SEO ─── */
export const Route = createFileRoute("/$lang/partner-portal")({
  head: ({ params }) => ({
    meta: buildSeo({
      lang: params.lang,
      title: "Global Partner Portal",
      description:
        "NEVO Industrial Global Partner Portal — a premium workspace for distributors, EPCs, consultants and international sales partners. Leads, products, marketing, training, analytics and AI sales tools in one place.",
      path: "/partner-portal",
      image: p01.url,
      keywords: ["partner portal","distributor portal","nevo partners","international sales","EPC partner"],
    }).meta,
    links: buildSeo({
      lang: params.lang,
      title: "Global Partner Portal",
      description: "NEVO Industrial Global Partner Portal.",
      path: "/partner-portal",
    }).links,
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(orgJsonLd()) },
      { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([
        { name: "Home", path: "/" }, { name: "Partner Portal", path: "/partner-portal" },
      ])) },
    ],
  }),
  component: PartnerPortalPage,
});

/* ─── Nav ─── */
type Key =
  | "dashboard" | "leads" | "products" | "marketing" | "training"
  | "downloads" | "communication" | "analytics" | "ai" | "mobile";

const NAV: { key: Key; label: string; icon: any }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "leads", label: "Leads", icon: Users },
  { key: "products", label: "Product Center", icon: Package },
  { key: "marketing", label: "Marketing", icon: Megaphone },
  { key: "training", label: "Training", icon: GraduationCap },
  { key: "downloads", label: "Downloads", icon: Download },
  { key: "communication", label: "Communication", icon: MessagesSquare },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "ai", label: "AI Sales Assistant", icon: Sparkles },
  { key: "mobile", label: "Mobile App", icon: Smartphone },
];

/* ─── Data ─── */
const KPI = [
  { label: "Total Leads", value: "48", delta: "+18% MoM", icon: Users },
  { label: "Open Opportunities", value: "22", delta: "$ 2,850,000", icon: Target },
  { label: "Revenue (YTD)", value: "$ 1.245M", delta: "+24% YoY", icon: TrendingUp },
  { label: "Commission Earned", value: "$ 124,500", delta: "+20% MoM", icon: DollarSign },
];

const LEADS = [
  { co: "ABC Construction", country: "Saudi Arabia", val: "$ 420,000", stage: "Proposal", close: "Aug 12, 2026" },
  { co: "Zenith Cold Chain", country: "UAE", val: "$ 685,000", stage: "Negotiation", close: "Jul 28, 2026" },
  { co: "Al Rashid Group", country: "Qatar", val: "$ 210,000", stage: "New", close: "Sep 05, 2026" },
  { co: "Bharat Panels Pvt", country: "India", val: "$ 1,120,000", stage: "Contacted", close: "Oct 14, 2026" },
  { co: "Sahara EPC", country: "Egypt", val: "$ 340,000", stage: "Proposal", close: "Aug 30, 2026" },
  { co: "Nordic ColdStore", country: "Kazakhstan", val: "$ 175,000", stage: "Closed Won", close: "Jun 20, 2026" },
];

const PRODUCTS = [
  { title: "PIR Production Lines", cat: "Production Line", img: A[3], stat: "12 units YTD" },
  { title: "Rock Wool Production Lines", cat: "Production Line", img: A[8], stat: "8 units YTD" },
  { title: "PU Production Lines", cat: "Production Line", img: A[10], stat: "6 units YTD" },
  { title: "Sandwich Panels — PIR / RW / PU / EPS", cat: "Finished Panels", img: A[13], stat: "3,250 m² this month" },
  { title: "Raw Materials — Steel Coils & Chemicals", cat: "Raw Materials", img: A[16], stat: "42 SKUs" },
  { title: "Accessories & Spare Parts", cat: "Accessories", img: A[7], stat: "180+ items" },
];

const MARKETING = [
  { title: "Brand Guidelines", type: "PDF", icon: BadgeCheck },
  { title: "Logo Package", type: "ZIP", icon: Layers },
  { title: "Corporate Presentation", type: "PPTX", icon: FileText },
  { title: "Product Brochures", type: "PDF Bundle", icon: FileText },
  { title: "Videos & Reels", type: "MP4", icon: Video },
  { title: "Social Media Kit", type: "ZIP", icon: Megaphone },
  { title: "Advertising Materials", type: "AI / PSD", icon: Sparkles },
];

const TRAINING = [
  { title: "Technical Course — Sandwich Panel Engineering", h: "12h", level: "Advanced" },
  { title: "Sales Course — International B2B Selling", h: "8h", level: "Intermediate" },
  { title: "Factory Knowledge — Line Operations", h: "6h", level: "Intermediate" },
  { title: "Product Knowledge — PIR vs Rock Wool", h: "4h", level: "Foundation" },
  { title: "Live Webinar — Cold Storage Market 2026", h: "1h", level: "All" },
  { title: "Certification — NEVO Partner Level 2", h: "Exam", level: "Certified" },
];

const DOWNLOADS = [
  { title: "CAD Files — Panel Profiles", type: "DWG", size: "42 MB" },
  { title: "BIM Files — Revit Family", type: "RVT", size: "88 MB" },
  { title: "Technical Drawings — Production Lines", type: "PDF", size: "24 MB" },
  { title: "Datasheets — PIR / RW / PU / EPS", type: "PDF", size: "6 MB" },
  { title: "Installation Manuals", type: "PDF", size: "18 MB" },
  { title: "Engineering Guides", type: "PDF", size: "12 MB" },
];

const AI_TOOLS = [
  { title: "Generate Proposal", desc: "Draft a branded partner proposal from a lead brief.", icon: FileText },
  { title: "Product Recommendation", desc: "Match customer needs to the right panel / line.", icon: Package },
  { title: "Quotation Support", desc: "Assist pricing with region, volume & margin logic.", icon: DollarSign },
  { title: "Technical Comparison", desc: "PIR vs Rock Wool, U-values, fire class, cost.", icon: BarChart3 },
  { title: "Customer FAQ", desc: "Instant answers for common technical & sales questions.", icon: MessageCircle },
];

const ANNOUNCEMENTS = [
  { t: "New PIR Production Line Released", d: "Jun 26, 2026" },
  { t: "Webinar: Sandwich Panel Market Trends 2026", d: "Jun 18, 2026" },
  { t: "Updated Price List Available", d: "Jun 10, 2026" },
  { t: "NEVO Partner Conference — Dubai", d: "May 10, 2026" },
];

const TERRITORIES = [
  { r: "GCC", rev: "$ 520K", conv: "34%" },
  { r: "North Africa", rev: "$ 285K", conv: "28%" },
  { r: "South Asia", rev: "$ 240K", conv: "31%" },
  { r: "CIS", rev: "$ 200K", conv: "22%" },
];

/* ─── UI helpers ─── */
function Chip({ children, tone="emerald" }: { children: React.ReactNode; tone?: "emerald"|"muted"|"amber" }) {
  const map: Record<string,string> = {
    emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
    muted: "bg-white/5 text-white/70 ring-white/10",
    amber: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${map[tone]}`}>{children}</span>;
}

function Card({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm ${className}`}>{children}</div>;
}

/* ─── Page ─── */
function PartnerPortalPage() {
  const [authed, setAuthed] = useState(false);
  const [active, setActive] = useState<Key>("dashboard");
  const [showPw, setShowPw] = useState(false);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<string>("All");

  const filteredLeads = useMemo(() => LEADS.filter(l =>
    (stage === "All" || l.stage === stage) &&
    (query === "" || (l.co + l.country).toLowerCase().includes(query.toLowerCase()))
  ), [query, stage]);

  return (
    <div className="min-h-screen bg-[#0a0d0c] text-white/90">
      <SiteHeader />

      {/* Hero band using board hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <img loading="lazy" decoding="async" src={A[6].url} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d0c]/70 via-[#0a0d0c]/85 to-[#0a0d0c]" />
        </div>
        <div className="relative mx-auto max-w-[1440px] px-6 py-14 md:py-20">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-300/90">
            <Handshake className="h-3.5 w-3.5" /> Global Partner Network
          </div>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Global <span className="text-emerald-400">Partner</span> Portal
          </h1>
          <p className="mt-4 max-w-2xl text-white/70 md:text-lg">
            Your gateway to grow with NEVO Industrial. Tools, resources and support engineered for
            distributors, EPCs, consultants and international sales partners.
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-white/60">
            <div><span className="text-white font-semibold text-lg">85+</span> Countries</div>
            <div><span className="text-white font-semibold text-lg">320+</span> Partners</div>
            <div><span className="text-white font-semibold text-lg">1,500+</span> Projects</div>
            <div><span className="text-white font-semibold text-lg">25,000+</span> Customers</div>
          </div>
        </div>
      </section>

      {!authed ? (
        <LoginGate onSignIn={() => setAuthed(true)} showPw={showPw} setShowPw={setShowPw} />
      ) : (
        <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card className="p-3">
                <div className="flex items-center gap-3 px-2 py-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30">
                    <Building2 className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">NEVO Partner</div>
                    <div className="text-[11px] text-white/50">ID · NVP-24801 · Level 2</div>
                  </div>
                </div>
                <div className="my-2 h-px bg-white/5" />
                <nav className="flex flex-col">
                  {NAV.map(n => {
                    const Icon = n.icon;
                    const on = active === n.key;
                    return (
                      <button
                        key={n.key}
                        onClick={() => setActive(n.key)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${on ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20" : "text-white/70 hover:bg-white/5"}`}
                      >
                        <span className="flex items-center gap-3"><Icon className="h-4 w-4" />{n.label}</span>
                        <ChevronRight className={`h-3.5 w-3.5 transition ${on ? "translate-x-0.5 text-emerald-300" : "text-white/30"}`} />
                      </button>
                    );
                  })}
                </nav>
                <div className="my-2 h-px bg-white/5" />
                <button onClick={() => setAuthed(false)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/50 hover:bg-white/5">
                  <Lock className="h-4 w-4" /> Sign out
                </button>
              </Card>
            </aside>

            {/* Main */}
            <main className="min-w-0">
              {/* Top bar */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <Search className="h-4 w-4 text-white/40" />
                  <input placeholder="Search leads, products, documents…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/40" />
                </div>
                <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/5">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[10px] font-bold text-black">7</span>
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400">
                  New Lead <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  {active === "dashboard" && <Dashboard />}
                  {active === "leads" && (
                    <LeadsPanel
                      leads={filteredLeads}
                      query={query} setQuery={setQuery}
                      stage={stage} setStage={setStage}
                    />
                  )}
                  {active === "products" && <ProductCenter />}
                  {active === "marketing" && <MarketingCenter />}
                  {active === "training" && <TrainingCenter />}
                  {active === "downloads" && <DownloadCenter />}
                  {active === "communication" && <CommunicationCenter />}
                  {active === "analytics" && <AnalyticsPanel />}
                  {active === "ai" && <AiAssistant />}
                  {active === "mobile" && <MobileApp />}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="relative border-t border-white/5 bg-gradient-to-b from-[#0a0d0c] to-[#0d1210]">
        <div className="absolute inset-0 opacity-20">
          <img loading="lazy" decoding="async" src={A[20].url} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative mx-auto max-w-[1440px] px-6 py-16 md:py-20">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/90">Ready to partner with NEVO?</div>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
                Become a <span className="text-emerald-400">NEVO Partner</span>.
              </h2>
              <p className="mt-4 max-w-xl text-white/70">
                Join a global industrial engineering network with the technical, commercial
                and marketing support you need to close larger projects — faster.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
              <Link to="/project-inquiry" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black hover:bg-emerald-400">
                Request Partnership <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white hover:bg-white/5">
                Talk to International Sales
              </Link>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              { l: "World-Class Quality", s: "Certified & Compliant", i: BadgeCheck },
              { l: "Innovative Technology", s: "Advanced Engineering", i: Sparkles },
              { l: "Global Presence", s: "Local Support", i: Globe2 },
              { l: "Strong Partnership", s: "Shared Growth", i: Handshake },
              { l: "High Commission", s: "Long-Term Value", i: DollarSign },
            ].map(({ l, s, i: Icon }) => (
              <div key={l} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <Icon className="h-5 w-5 text-emerald-300" />
                <div className="mt-2 text-sm font-semibold">{l}</div>
                <div className="text-xs text-white/50">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* ─── Login ─── */
function LoginGate({ onSignIn, showPw, setShowPw }: { onSignIn: () => void; showPw: boolean; setShowPw: (b: boolean) => void }) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-6 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <Card className="overflow-hidden">
          <div className="relative aspect-[16/10] w-full">
            <img loading="lazy" decoding="async" src={A[6].url} alt="Global partner network map" className="h-full w-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d0c] via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-300/90">Our Global Partner Network</div>
              <div className="mt-1 text-lg font-semibold">Strong Partners. Global Growth. Shared Success.</div>
            </div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-white/5 border-t border-white/5 text-center">
            {[["85+","Countries"],["320+","Partners"],["1,500+","Projects"],["25,000+","Customers"]].map(([v,l]) => (
              <div key={l} className="px-3 py-4">
                <div className="text-lg font-semibold">{v}</div>
                <div className="text-[11px] text-white/50">{l}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-7 md:p-9">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-300/90">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure Partner Login
          </div>
          <h2 className="mt-3 text-2xl font-semibold">Welcome Back</h2>
          <p className="text-sm text-white/60">Sign in to your NEVO partner account.</p>

          <form onSubmit={(e) => { e.preventDefault(); onSignIn(); }} className="mt-6 space-y-4">
            <div>
              <label className="text-xs text-white/60">Partner ID</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <BadgeCheck className="h-4 w-4 text-white/40" />
                <input required defaultValue="NVP-24801" className="w-full bg-transparent text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/60">Email</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <Mail className="h-4 w-4 text-white/40" />
                <input required type="email" defaultValue="partner@nevo-industrial.com" className="w-full bg-transparent text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/60">Password</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <Lock className="h-4 w-4 text-white/40" />
                <input required type={showPw ? "text" : "password"} defaultValue="••••••••••" className="w-full bg-transparent text-sm outline-none" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-white/40 hover:text-white">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-white/60">
                <input type="checkbox" className="accent-emerald-500" /> Remember me
              </label>
              <Link to="/contact" className="text-emerald-300 hover:text-emerald-200">Forgot password?</Link>
            </div>
            <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black hover:bg-emerald-400">
              <LogIn className="h-4 w-4" /> Sign in to Portal
            </button>
            <div className="flex items-center justify-center gap-2 text-[11px] text-white/50">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Two-Factor Authentication Ready
            </div>
          </form>
        </Card>
      </div>
    </section>
  );
}

/* ─── Dashboard ─── */
function Dashboard() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/90">Partner Dashboard</div>
            <h2 className="mt-1 text-2xl font-semibold">Welcome back, NEVO Partner</h2>
            <p className="text-sm text-white/60">Here's what's happening with your business today.</p>
          </div>
          <Chip>Level 2 · Certified</Chip>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI.map(({ label, value, delta, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-white/50">{label}</div>
              <Icon className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="mt-3 text-2xl font-semibold">{value}</div>
            <div className="mt-1 text-xs text-emerald-300">↑ {delta}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Sales Performance</div>
            <Chip tone="muted">This Year</Chip>
          </div>
          <SalesChart />
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Leads by Status</div>
            <Chip tone="muted">48 Total</Chip>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              ["New", 16, "33%", "bg-emerald-500"],
              ["Contacted", 12, "25%", "bg-emerald-400"],
              ["Proposal", 11, "23%", "bg-emerald-300"],
              ["Negotiation", 6, "13%", "bg-amber-400"],
              ["Closed Won", 3, "6%", "bg-white/60"],
            ].map(([l,c,p,col]) => (
              <li key={l as string} className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${col as string}`} />
                <span className="flex-1 text-white/80">{l}</span>
                <span className="text-white/60">{c}</span>
                <span className="text-white/40">({p})</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Recent Activity</div>
            <button className="text-xs text-emerald-300 hover:text-emerald-200">View all</button>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              { t: "New lead assigned from Saudi Arabia", d: "2 hours ago", i: Users },
              { t: "Quotation sent to ABC Construction", d: "5 hours ago", i: FileText },
              { t: "New order received from UAE", d: "1 day ago", i: Package },
              { t: "Payment received from India", d: "2 days ago", i: DollarSign },
            ].map(({ t, d, i: Icon }) => (
              <li key={t} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/[0.03]">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <Icon className="h-4 w-4 text-emerald-300" />
                </div>
                <div className="flex-1"><div className="text-white/90">{t}</div></div>
                <div className="text-xs text-white/40">{d}</div>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Latest Announcements</div>
            <button className="text-xs text-emerald-300 hover:text-emerald-200">View all</button>
          </div>
          <ul className="space-y-3 text-sm">
            {ANNOUNCEMENTS.map(a => (
              <li key={a.t} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/[0.03]">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10">
                  <Megaphone className="h-4 w-4 text-emerald-300" />
                </div>
                <div className="flex-1"><div className="text-white/90">{a.t}</div></div>
                <div className="text-xs text-white/40">{a.d}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
          <div className="p-6">
            <div className="text-xs uppercase tracking-wider text-white/50">Top Products this month</div>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                { t: "PIR Production Line", v: "12 Units" },
                { t: "Rock Wool Production Line", v: "8 Units" },
                { t: "PU Production Line", v: "6 Units" },
                { t: "Cold Storage Panels", v: "3,250 m²" },
              ].map(p => (
                <li key={p.t} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/[0.03]">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10"><Factory className="h-4 w-4 text-emerald-300" /></div>
                  <div className="flex-1 text-white/90">{p.t}</div>
                  <div className="text-white/60">{p.v}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative min-h-[220px]">
            <img loading="lazy" decoding="async" src={A[9].url} alt="Top production lines" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d0c] via-transparent to-transparent md:from-[#0a0d0c]/90" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function SalesChart() {
  const pts = [40, 55, 48, 68, 82, 74, 92, 105, 118, 132, 148, 172];
  const max = Math.max(...pts);
  const w = 640, h = 160;
  const step = w / (pts.length - 1);
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * (h - 20)}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <div className="relative h-[200px] w-full overflow-hidden">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sales" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25,0.5,0.75].map(f => (
          <line key={f} x1="0" x2={w} y1={h*f} y2={h*f} stroke="rgba(255,255,255,0.05)" />
        ))}
        <path d={area} fill="url(#sales)" />
        <path d={path} fill="none" stroke="#10b981" strokeWidth="2" />
        {pts.map((v, i) => (
          <circle key={i} cx={i * step} cy={h - (v / max) * (h - 20)} r="2.5" fill="#10b981" />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 grid grid-cols-12 text-[10px] text-white/40">
        {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => <div key={m} className="text-center">{m}</div>)}
      </div>
    </div>
  );
}

/* ─── Leads ─── */
function LeadsPanel({ leads, query, setQuery, stage, setStage }: any) {
  const stages = ["All","New","Contacted","Proposal","Negotiation","Closed Won"];
  const stageTone: Record<string, "emerald"|"muted"|"amber"> = {
    "New": "muted", "Contacted": "muted", "Proposal": "emerald",
    "Negotiation": "amber", "Closed Won": "emerald",
  };
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <Search className="h-4 w-4 text-white/40" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search company or country…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/40" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1">
            <Filter className="ml-1 h-3.5 w-3.5 text-white/40" />
            {stages.map(s => (
              <button key={s} onClick={() => setStage(s)} className={`rounded-lg px-2.5 py-1 text-xs ${stage===s ? "bg-emerald-500 text-black font-semibold" : "text-white/60 hover:bg-white/5"}`}>{s}</button>
            ))}
          </div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_.6fr] gap-3 border-b border-white/5 px-5 py-3 text-[11px] uppercase tracking-wider text-white/50">
          <div>Company</div><div>Country</div><div>Project Value</div><div>Stage</div><div>Expected Close</div><div className="text-right">Action</div>
        </div>
        {leads.map((l: any, i: number) => (
          <div key={i} className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_.6fr] items-center gap-3 border-b border-white/5 px-5 py-4 text-sm last:border-0 hover:bg-white/[0.02]">
            <div className="font-medium text-white">{l.co}</div>
            <div className="flex items-center gap-2 text-white/70"><MapPin className="h-3.5 w-3.5 text-emerald-300" />{l.country}</div>
            <div className="text-white/80">{l.val}</div>
            <div><Chip tone={stageTone[l.stage]}>{l.stage}</Chip></div>
            <div className="text-white/60">{l.close}</div>
            <div className="text-right"><button className="text-emerald-300 hover:text-emerald-200"><ArrowRight className="ml-auto h-4 w-4" /></button></div>
          </div>
        ))}
      </Card>
      <Card className="p-5">
        <div className="mb-2 text-sm font-semibold">Lead Notes</div>
        <textarea rows={3} placeholder="Add a note for the selected lead…" className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm outline-none placeholder:text-white/40" />
      </Card>
    </div>
  );
}

/* ─── Product Center ─── */
function ProductCenter() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map(p => (
          <Card key={p.title} className="group overflow-hidden">
            <div className="relative aspect-[4/3]">
              <img loading="lazy" decoding="async" src={p.img.url} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-3 left-3"><Chip>{p.cat}</Chip></div>
            </div>
            <div className="p-4">
              <div className="text-sm font-semibold">{p.title}</div>
              <div className="mt-1 text-xs text-white/50">{p.stat}</div>
              <div className="mt-3 flex items-center gap-3 text-xs">
                <button className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200">Technical Specs <ExternalLink className="h-3 w-3" /></button>
                <span className="text-white/20">·</span>
                <button className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200">Certificates <ExternalLink className="h-3 w-3" /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Price List Dashboard</div>
          <Chip tone="muted">Updated May 2026</Chip>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/5">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_.6fr] bg-white/[0.03] px-5 py-3 text-[11px] uppercase tracking-wider text-white/50">
            <div>Product Category</div><div>Latest Update</div><div>Region</div><div className="text-right">Download</div>
          </div>
          {[
            ["PIR Production Lines","May 18, 2026","Global"],
            ["Rock Wool Production Lines","May 18, 2026","Global"],
            ["PU Production Lines","May 18, 2026","Global"],
            ["EPS Production Lines","May 18, 2026","Global"],
            ["Sandwich Panels","May 18, 2026","GCC / MENA"],
            ["Accessories & Spare Parts","May 18, 2026","Global"],
          ].map(r => (
            <div key={r[0]} className="grid grid-cols-[1.4fr_1fr_1fr_.6fr] items-center border-t border-white/5 px-5 py-3 text-sm">
              <div className="text-white/90">{r[0]}</div>
              <div className="text-white/60">{r[1]}</div>
              <div className="text-white/60">{r[2]}</div>
              <div className="flex justify-end"><button className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20"><Download className="h-4 w-4" /></button></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ─── Marketing Center ─── */
function MarketingCenter() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">
          <div className="relative aspect-[4/3] md:aspect-auto"><img loading="lazy" decoding="async" src={A[0].url} alt="Marketing Center" className="h-full w-full object-cover" /></div>
          <div className="p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/90">Marketing Center</div>
            <h3 className="mt-2 text-2xl font-semibold">Everything you need to sell NEVO.</h3>
            <p className="mt-2 text-sm text-white/60">Brand assets, presentations, brochures and campaign material — all co-brandable for your market.</p>
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {MARKETING.map(m => {
                const Icon = m.icon;
                return (
                  <button key={m.title} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm hover:bg-white/5">
                    <span className="flex items-center gap-3"><Icon className="h-4 w-4 text-emerald-300" />{m.title}</span>
                    <span className="text-[11px] text-white/40">{m.type}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── Training Center ─── */
function TrainingCenter() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="relative aspect-[21/8]">
          <img loading="lazy" decoding="async" src={A[8].url} alt="Training Center" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d0c] via-transparent to-transparent" />
          <div className="absolute bottom-5 left-6 right-6">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/90">Training Center</div>
            <div className="mt-1 text-2xl font-semibold">Expand your knowledge. Earn certifications.</div>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {TRAINING.map((c, i) => (
          <Card key={c.title} className="p-5">
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>Course #{String(i+1).padStart(2, "0")}</span>
              <Chip tone={c.level === "Certified" ? "emerald" : "muted"}>{c.level}</Chip>
            </div>
            <div className="mt-2 text-sm font-semibold text-white">{c.title}</div>
            <div className="mt-1 text-xs text-white/50">Duration · {c.h}</div>
            <div className="mt-4 flex items-center gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400"><Play className="h-3.5 w-3.5" /> Start</button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/80 hover:bg-white/5"><Award className="h-3.5 w-3.5" /> Certificate</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Download Center ─── */
function DownloadCenter() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
          <div className="p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/90">Download Center</div>
            <h3 className="mt-2 text-2xl font-semibold">Technical documents & engineering files.</h3>
            <p className="mt-2 text-sm text-white/60">CAD, BIM, drawings, datasheets, installation manuals and engineering guides.</p>
          </div>
          <div className="relative aspect-[4/3] md:aspect-auto"><img loading="lazy" decoding="async" src={A[13].url} alt="Downloads" className="h-full w-full object-cover" /></div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.4fr_.6fr_.6fr_.6fr] gap-3 border-b border-white/5 px-5 py-3 text-[11px] uppercase tracking-wider text-white/50">
          <div>File</div><div>Type</div><div>Size</div><div className="text-right">Action</div>
        </div>
        {DOWNLOADS.map(d => (
          <div key={d.title} className="grid grid-cols-[1.4fr_.6fr_.6fr_.6fr] items-center gap-3 border-b border-white/5 px-5 py-3 text-sm last:border-0">
            <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-emerald-300" /><span className="text-white/90">{d.title}</span></div>
            <div><Chip tone="muted">{d.type}</Chip></div>
            <div className="text-white/60">{d.size}</div>
            <div className="flex justify-end"><button className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20"><Download className="h-3.5 w-3.5" /> Download</button></div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ─── Communication ─── */
function CommunicationCenter() {
  const channels = [
    { t: "Partner Support", d: "24/7 partner desk", i: MessagesSquare },
    { t: "Engineering Support", d: "Technical Q&A within 4h", i: Wrench },
    { t: "Sales Manager", d: "Your dedicated NEVO SM", i: Handshake },
    { t: "Video Meeting", d: "Book a Google Meet slot", i: Video },
    { t: "WhatsApp", d: "Instant chat with the team", i: MessageCircle },
    { t: "Support Tickets", d: "Track requests end-to-end", i: Ticket },
  ];
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="relative aspect-[21/7]">
          <img loading="lazy" decoding="async" src={A[7].url} alt="Communication Center" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d0c] via-[#0a0d0c]/40 to-transparent" />
          <div className="absolute bottom-5 left-6 right-6">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/90">Communication Center</div>
            <div className="mt-1 text-2xl font-semibold">We're here to support you — every channel, every timezone.</div>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map(({ t, d, i: Icon }) => (
          <Card key={t} className="p-5 hover:bg-white/[0.05]">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30"><Icon className="h-5 w-5 text-emerald-300" /></div>
            <div className="mt-3 text-sm font-semibold">{t}</div>
            <div className="text-xs text-white/50">{d}</div>
            <button className="mt-4 inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200">Open <ArrowRight className="h-3 w-3" /></button>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between text-sm">
          <div className="font-semibold">Global Events & Webinars</div>
          <Chip tone="muted"><Calendar className="mr-1 inline h-3 w-3" /> Upcoming</Chip>
        </div>
        <ul className="space-y-2 text-sm">
          {[
            ["Webinar: PIR vs Rock Wool", "May 30, 2026"],
            ["Partner Conference 2026 — Dubai", "Jun 20–22, 2026"],
            ["Training: Sales Mastery", "Jun 10, 2026"],
          ].map(([t, d]) => (
            <li key={t} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
              <span className="text-white/90">{t}</span><span className="text-xs text-white/40">{d}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ─── Analytics ─── */
function AnalyticsPanel() {
  const bars = [42, 55, 48, 68, 82, 74, 92, 105, 118, 132, 148, 172];
  const max = Math.max(...bars);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Revenue (YTD)", "$ 1.245M", "+24%"],
          ["Commission", "$ 124,500", "+20%"],
          ["Lead Conversion", "31%", "+4.2 pts"],
          ["Monthly Perf.", "$ 172K", "+16%"],
        ].map(([l, v, d]) => (
          <Card key={l} className="p-5">
            <div className="text-xs uppercase tracking-wider text-white/50">{l}</div>
            <div className="mt-2 text-2xl font-semibold">{v}</div>
            <div className="mt-1 text-xs text-emerald-300">↑ {d}</div>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 text-sm font-semibold">Monthly Performance</div>
          <div className="flex h-40 items-end gap-2">
            {bars.map((v, i) => (
              <div key={i} className="flex-1">
                <div className="rounded-t-md bg-gradient-to-t from-emerald-500/30 to-emerald-400" style={{ height: `${(v / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-white/40">
            {["J","F","M","A","M","J","J","A","S","O","N","D"].map((m,i) => <span key={i}>{m}</span>)}
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-4 text-sm font-semibold">Territory Performance</div>
          <ul className="space-y-3 text-sm">
            {TERRITORIES.map(t => (
              <li key={t.r}>
                <div className="flex items-center justify-between"><span className="text-white/80">{t.r}</span><span className="text-white/60">{t.rev} · Conv {t.conv}</span></div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5"><div className="h-full bg-emerald-500" style={{ width: t.conv }} /></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ─── AI Assistant ─── */
function AiAssistant() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">
          <div className="relative aspect-[4/3] md:aspect-auto"><img loading="lazy" decoding="async" src={A[11].url} alt="AI Sales Assistant" className="h-full w-full object-cover" /></div>
          <div className="p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/90">AI Sales Assistant</div>
            <h3 className="mt-2 text-2xl font-semibold">Your smart selling co-pilot.</h3>
            <p className="mt-2 text-sm text-white/60">Draft proposals, price quotes and technical comparisons in seconds — trained on NEVO products.</p>
            <div className="mt-5 grid grid-cols-1 gap-2">
              {AI_TOOLS.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.title} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm hover:bg-white/5">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30"><Icon className="h-4 w-4 text-emerald-300" /></div>
                    <div className="flex-1"><div className="font-medium text-white">{t.title}</div><div className="text-xs text-white/50">{t.desc}</div></div>
                    <ArrowRight className="h-4 w-4 text-white/40" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
      <Card className="p-5">
        <div className="mb-3 text-sm font-semibold">Ask the AI</div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <Sparkles className="h-4 w-4 text-emerald-300" />
          <input placeholder="e.g. Draft a proposal for 5,000 m² cold storage panels in Riyadh" className="w-full bg-transparent text-sm outline-none placeholder:text-white/40" />
          <button className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400">Generate</button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Mobile App ─── */
function MobileApp() {
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
        <div className="relative aspect-[4/3] md:aspect-auto"><img loading="lazy" decoding="async" src={A[17].url} alt="Mobile Partner App" className="h-full w-full object-cover" /></div>
        <div className="p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/90">Mobile Partner App</div>
          <h3 className="mt-2 text-2xl font-semibold">Manage your business on the go.</h3>
          <p className="mt-2 text-sm text-white/60">Responsive dashboard, quick actions and push notifications — iOS & Android.</p>
          <ul className="mt-5 space-y-2 text-sm">
            {[
              "Responsive dashboard mirroring the portal",
              "Quick actions: new lead, quote, ticket",
              "Push notifications for opportunities & payments",
              "Offline access to brochures & datasheets",
            ].map(t => (
              <li key={t} className="flex items-start gap-2 text-white/80"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />{t}</li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded-xl bg-white/[0.06] px-4 py-2 text-xs font-semibold ring-1 ring-white/10 hover:bg-white/10">Download on the App Store</button>
            <button className="rounded-xl bg-white/[0.06] px-4 py-2 text-xs font-semibold ring-1 ring-white/10 hover:bg-white/10">Get it on Google Play</button>
          </div>
        </div>
      </div>
    </Card>
  );
}
