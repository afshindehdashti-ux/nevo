import type { LucideIcon } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  FolderKanban,
  GitBranch,
  FileText,
  Truck,
  MessagesSquare,
  Download,
  ShieldCheck,
  LineChart,
  LogIn,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Bell,
  Search,
  Settings,
  ChevronRight,
  CheckCircle2,
  Clock,
  Factory,
  ClipboardCheck,
  PackageCheck,
  Wrench,
  GraduationCap,
  Award,
  Video,
  PhoneCall,
  MessageCircle,
  Ticket,
  Calendar,
  Sparkles,
  ArrowRight,
  Menu,
  X,
  User,
  Building2,
  Plane,
  MapPin,
  TrendingUp,
  DollarSign,
  Target,
  ListChecks,
  Image as ImageIcon,
  Play,
  ShieldAlert,
  BarChart3,
  Zap,
  HelpCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { RoutedDocumentsList } from "@/components/site/RoutedDocumentsList";
import { buildSeo, orgJsonLd, breadcrumbJsonLd } from "@/lib/seo";

import p01 from "@/assets/portal/portal-01.png.asset.json";
import p02 from "@/assets/portal/portal-02.png.asset.json";
import p03 from "@/assets/portal/portal-03.png.asset.json";
import p04 from "@/assets/portal/portal-04.png.asset.json";
import p05 from "@/assets/portal/portal-05.png.asset.json";
import p06 from "@/assets/portal/portal-06.png.asset.json";
import p07 from "@/assets/portal/portal-07.png.asset.json";
import p08 from "@/assets/portal/portal-08.png.asset.json";
import p09 from "@/assets/portal/portal-09.png.asset.json";
import p10 from "@/assets/portal/portal-10.png.asset.json";
import p11 from "@/assets/portal/portal-11.png.asset.json";
import p12 from "@/assets/portal/portal-12.png.asset.json";
import p13 from "@/assets/portal/portal-13.png.asset.json";
import p14 from "@/assets/portal/portal-14.png.asset.json";
import p15 from "@/assets/portal/portal-15.png.asset.json";
import p16 from "@/assets/portal/portal-16.png.asset.json";
import p17 from "@/assets/portal/portal-17.png.asset.json";
import p18 from "@/assets/portal/portal-18.png.asset.json";
import p19 from "@/assets/portal/portal-19.png.asset.json";
import p20 from "@/assets/portal/portal-20.png.asset.json";
import p21 from "@/assets/portal/portal-21.png.asset.json";

const ASSETS = [
  p01,
  p02,
  p03,
  p04,
  p05,
  p06,
  p07,
  p08,
  p09,
  p10,
  p11,
  p12,
  p13,
  p14,
  p15,
  p16,
  p17,
  p18,
  p19,
  p20,
  p21,
];

/* ─── SEO ─── */
export const Route = createFileRoute("/$lang/customer-portal")({
  head: ({ params }) => ({
    meta: buildSeo({
      lang: params.lang,
      title: "Customer Engineering Portal",
      description:
        "Secure customer portal for NEVO Industrial clients — monitor factory builds, production lines and panel projects with live tracking, documents, quality and analytics.",
      path: "/customer-portal",
      keywords: [
        "customer portal",
        "project dashboard",
        "engineering portal",
        "factory tracking",
        "nevo",
      ],
    }).meta,
    links: buildSeo({
      lang: params.lang,
      title: "Customer Engineering Portal",
      description: "Secure customer portal for NEVO Industrial clients.",
      path: "/customer-portal",
    }).links,
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(orgJsonLd()) },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Customer Portal", path: "/customer-portal" },
          ]),
        ),
      },
    ],
  }),
  component: CustomerPortalPage,
});

/* ─── Types & data ─── */
type SectionKey =
  | "dashboard"
  | "projects"
  | "timeline"
  | "documents"
  | "tracking"
  | "communication"
  | "downloads"
  | "quality"
  | "analytics";

const NAV: { key: SectionKey; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "timeline", label: "Project Timeline", icon: GitBranch },
  { key: "documents", label: "Document Center", icon: FileText },
  { key: "tracking", label: "Live Tracking", icon: Truck },
  { key: "communication", label: "Communication", icon: MessagesSquare },
  { key: "downloads", label: "Downloads", icon: Download },
  { key: "quality", label: "Quality", icon: ShieldCheck },
  { key: "analytics", label: "Analytics", icon: LineChart },
];

const PROJECTS = [
  {
    id: "NVO-2401",
    name: "Al-Nahda Cold Storage — Turnkey Factory",
    type: "Factory Design",
    status: "In Manufacturing",
    progress: 62,
    stage: "Manufacturing",
    value: "USD 8.4 M",
    eta: "Q1 2027",
    country: "UAE",
    img: p02.url,
  },
  {
    id: "NVO-2408",
    name: "Continuous PIR Line — 12,000 m²/day",
    type: "Production Line",
    status: "Engineering Review",
    progress: 24,
    stage: "Engineering Review",
    value: "USD 6.1 M",
    eta: "Q3 2027",
    country: "Saudi Arabia",
    img: p03.url,
  },
  {
    id: "NVO-2412",
    name: "PIR Chemicals & Steel Coils — Q3 Supply",
    type: "Raw Materials",
    status: "Shipping",
    progress: 88,
    stage: "Shipping",
    value: "USD 1.9 M",
    eta: "Sep 2026",
    country: "Kenya",
    img: p04.url,
  },
  {
    id: "NVO-2415",
    name: "Feasibility Study — Panel Factory Egypt",
    type: "Engineering Consultancy",
    status: "Proposal",
    progress: 12,
    stage: "Proposal",
    value: "USD 240 K",
    eta: "Q4 2026",
    country: "Egypt",
    img: p05.url,
  },
  {
    id: "NVO-2317",
    name: "Rock Wool Line Upgrade — Retrofit",
    type: "Production Line",
    status: "Completed",
    progress: 100,
    stage: "Completed",
    value: "USD 2.8 M",
    eta: "Delivered",
    country: "Oman",
    img: p06.url,
  },
  {
    id: "NVO-2422",
    name: "Clean Room Panel Package",
    type: "Raw Materials",
    status: "Pending Quotation",
    progress: 5,
    stage: "Proposal",
    value: "USD 480 K",
    eta: "TBD",
    country: "Qatar",
    img: p07.url,
  },
];

const TIMELINE_STAGES = [
  { key: "review", label: "Engineering Review", icon: ClipboardCheck, done: true },
  { key: "proposal", label: "Proposal", icon: FileText, done: true },
  { key: "contract", label: "Contract", icon: Award, done: true },
  { key: "manufacturing", label: "Manufacturing", icon: Factory, done: true, active: true },
  { key: "inspection", label: "Inspection", icon: ShieldCheck, done: false },
  { key: "fat", label: "Factory Acceptance Test", icon: PackageCheck, done: false },
  { key: "shipping", label: "Shipping", icon: Truck, done: false },
  { key: "installation", label: "Installation", icon: Wrench, done: false },
  { key: "commissioning", label: "Commissioning", icon: Zap, done: false },
  { key: "training", label: "Training", icon: GraduationCap, done: false },
  { key: "completion", label: "Project Completion", icon: CheckCircle2, done: false },
];

const DOC_CATEGORIES = [
  { name: "Contracts", count: 6, icon: FileText, img: p08.url },
  { name: "Technical Drawings", count: 42, icon: FileText, img: p09.url },
  { name: "Datasheets", count: 18, icon: FileText, img: p10.url },
  { name: "Factory Layouts", count: 9, icon: Factory, img: p11.url },
  { name: "Inspection Reports", count: 14, icon: ShieldCheck, img: p12.url },
  { name: "Certificates", count: 22, icon: Award, img: p13.url },
  { name: "Invoices", count: 11, icon: DollarSign, img: p14.url },
  { name: "Packing Lists", count: 8, icon: PackageCheck, img: p15.url },
  { name: "Shipping Documents", count: 10, icon: Truck, img: p16.url },
  { name: "Manuals", count: 17, icon: FileText, img: p17.url },
];

/* ─── Component ─── */
function CustomerPortalPage() {
  const [authed, setAuthed] = useState(false);
  return (
    <div className="min-h-screen bg-[#0B0F13] text-white">
      <SiteHeader />
      {!authed ? (
        <LoginScreen onLogin={() => setAuthed(true)} />
      ) : (
        <PortalShell onLogout={() => setAuthed(false)} />
      )}
      <div className="container mx-auto px-4 py-10">
        <RoutedDocumentsList visibility="customer" title="Project Documents" />
      </div>
      <SiteFooter />
    </div>
  );
}

/* ─── Login ─── */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  return (
    <section className="relative min-h-[calc(100vh-80px)] overflow-hidden">
      <img
        loading="lazy"
        decoding="async"
        src={p01.url}
        alt="NEVO customer portal"
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F13] via-[#0B0F13]/85 to-emerald-950/60" />
      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-widest text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure Engineering Portal
          </div>
          <h1 className="mt-6 font-mono text-4xl font-semibold leading-tight md:text-6xl">
            Your project.
            <br />
            <span className="text-emerald-400">Fully engineered visibility.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-white/70">
            Monitor every stage of your NEVO project — from proposal to commissioning — with live
            tracking, documents, quality reports and direct access to your engineering team.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/80">
            {[
              "Two-factor authentication ready",
              "End-to-end encrypted document exchange",
              "24/7 direct line to your project manager",
              "Live manufacturing & shipping tracking",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onLogin();
            }}
            className="w-full rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-emerald-300">
                  Client Sign-In
                </div>
                <h2 className="mt-1 text-2xl font-semibold">Welcome back</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-black/40 p-2">
                <Lock className="h-4 w-4 text-emerald-400" />
              </div>
            </div>

            <label className="block text-xs uppercase tracking-widest text-white/60">Email</label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
              <Mail className="h-4 w-4 text-white/50" />
              <input
                required
                type="email"
                placeholder="you@company.com"
                defaultValue="engineer@client.com"
                className="w-full bg-transparent text-sm outline-none placeholder:text-white/60"
              />
            </div>

            <label className="mt-5 block text-xs uppercase tracking-widest text-white/60">
              Password
            </label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
              <Lock className="h-4 w-4 text-white/50" />
              <input
                required
                type={show ? "text" : "password"}
                placeholder="••••••••"
                defaultValue="demo-password"
                className="w-full bg-transparent text-sm outline-none placeholder:text-white/60"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="text-white/50 hover:text-white"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-white/70">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black/40 accent-emerald-500"
                />
                Remember me
              </label>
              <Link to="/contact" className="text-emerald-400 hover:text-emerald-300">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              <LogIn className="h-4 w-4" /> Sign in securely
            </button>

            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3 text-xs text-emerald-200/90">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" /> Two-factor authentication enabled
              </div>
              <p className="mt-1 text-emerald-200/70">
                A 6-digit code will be sent to your registered device on first sign-in.
              </p>
            </div>

            <p className="mt-5 text-center text-xs text-white/50">
              Need access?{" "}
              <Link to="/project-inquiry" className="text-emerald-400 hover:text-emerald-300">
                Request a portal account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ─── Portal Shell ─── */
function PortalShell({ onLogout }: { onLogout: () => void }) {
  const [active, setActive] = useState<SectionKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-6 lg:py-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-white/50">
        <Link to="/" className="hover:text-white">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-white">Customer Portal</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-emerald-400 capitalize">{active.replace("-", " ")}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />} Portal Menu
            </button>
            <button onClick={onLogout} className="text-xs text-white/60 hover:text-white">
              Sign out
            </button>
          </div>
          <div
            className={`${mobileOpen ? "block" : "hidden"} lg:block rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl`}
          >
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">Eng. Karim Habib</div>
                <div className="truncate text-xs text-white/50">Al-Nahda Industries · Client</div>
              </div>
            </div>
            <ul className="space-y-1">
              {NAV.map((n) => {
                const Icon = n.icon;
                const on = active === n.key;
                return (
                  <li key={n.key}>
                    <button
                      onClick={() => {
                        setActive(n.key);
                        setMobileOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition
                        ${on ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                    >
                      <Icon className="h-4 w-4" /> {n.label}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 border-t border-white/10 pt-3">
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white"
              >
                <LogIn className="h-4 w-4 rotate-180" /> Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0">
          {/* Topbar */}
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
              <Search className="h-4 w-4 text-white/50" />
              <input
                placeholder="Search projects, documents, drawings…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-white/60"
              />
            </div>
            <button className="relative rounded-xl border border-white/10 bg-black/40 p-2 hover:bg-white/5">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-400" />
            </button>
            <button className="rounded-xl border border-white/10 bg-black/40 p-2 hover:bg-white/5">
              <Settings className="h-4 w-4" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {active === "dashboard" && <DashboardSection />}
              {active === "projects" && <ProjectsSection />}
              {active === "timeline" && <TimelineSection />}
              {active === "documents" && <DocumentsSection />}
              {active === "tracking" && <TrackingSection />}
              {active === "communication" && <CommunicationSection />}
              {active === "downloads" && <DownloadsSection />}
              {active === "quality" && <QualitySection />}
              {active === "analytics" && <AnalyticsSection />}
            </motion.div>
          </AnimatePresence>

          <FinalCTA />
        </main>
      </div>
    </div>
  );
}

/* ─── Reusable ─── */
function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}
function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <div className="text-xs uppercase tracking-widest text-emerald-300">{eyebrow}</div>
      <h2 className="mt-1 font-mono text-2xl font-semibold md:text-3xl">{title}</h2>
      {sub && <p className="mt-2 text-sm text-white/60">{sub}</p>}
    </div>
  );
}
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
function Stat({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
}) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between text-white/60">
        <span className="text-xs uppercase tracking-widest">{label}</span>
        <Icon className="h-4 w-4 text-emerald-300" />
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold">{value}</div>
      {delta && <div className="mt-1 text-xs text-emerald-300">{delta}</div>}
    </GlassCard>
  );
}

/* ─── Dashboard ─── */
function DashboardSection() {
  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <GlassCard className="relative overflow-hidden">
        <img
          loading="lazy"
          decoding="async"
          src={p02.url}
          alt="Project overview"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F13] via-[#0B0F13]/80 to-transparent" />
        <div className="relative grid grid-cols-1 gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:p-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-emerald-300">Welcome back</div>
            <h1 className="mt-2 font-mono text-3xl font-semibold md:text-4xl">
              Good morning, Karim.
            </h1>
            <p className="mt-3 max-w-lg text-sm text-white/70">
              6 active projects across 4 markets. Your Al-Nahda Cold Storage factory is in
              manufacturing — 62% complete, tracking Q1 2027 delivery.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400">
                Open Project NVO-2401
              </button>
              <button className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
                Talk to Project Manager
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Active projects" value="6" delta="+2 this quarter" icon={FolderKanban} />
            <Stat label="Portfolio value" value="$19.9M" delta="on budget" icon={DollarSign} />
            <Stat label="On-time delivery" value="98%" delta="last 24 mo" icon={Target} />
            <Stat label="Open tickets" value="3" delta="1 in review" icon={Ticket} />
          </div>
        </div>
      </GlassCard>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Project status */}
        <GlassCard className="lg:col-span-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm uppercase tracking-widest text-white/60">Project status</h3>
            <button className="text-xs text-emerald-300 hover:text-emerald-200">View all →</button>
          </div>
          <div className="space-y-4">
            {PROJECTS.slice(0, 4).map((p) => (
              <div key={p.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-white/50">
                      {p.id} · {p.type} · {p.country}
                    </div>
                    <div className="mt-0.5 truncate font-medium">{p.name}</div>
                  </div>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                    {p.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar value={p.progress} />
                  <span className="w-10 text-right font-mono text-xs text-white/70">
                    {p.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Notifications & messages */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-white/60">
              <Bell className="h-4 w-4" /> Notifications
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { c: "Inspection report ready — NVO-2317", t: "12 min ago", tag: "Quality" },
                { c: "Shipping ETA updated — NVO-2412", t: "1 h ago", tag: "Logistics" },
                { c: "Contract signed — NVO-2401", t: "Yesterday", tag: "Contract" },
              ].map((n, i) => (
                <li key={i} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                      {n.tag}
                    </span>
                    <span>{n.t}</span>
                  </div>
                  <div className="mt-1.5 text-white/90">{n.c}</div>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-white/60">
              <MessagesSquare className="h-4 w-4" /> Unread messages
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                {
                  f: "Eng. Layla · PM",
                  m: "FAT dossier attached, please review by Friday.",
                  t: "2 h",
                },
                { f: "QA Team", m: "NCR-0083 resolved. Awaiting your sign-off.", t: "6 h" },
                { f: "Logistics", m: "Vessel MSC Aurora departed Jebel Ali.", t: "1 d" },
              ].map((m, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span className="truncate">{m.f}</span>
                      <span>{m.t}</span>
                    </div>
                    <div className="mt-0.5 truncate text-white/90">{m.m}</div>
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>

      {/* Milestones + recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-white/60">
            <Calendar className="h-4 w-4" /> Upcoming milestones
          </h3>
          <ol className="space-y-4">
            {[
              { d: "12 Jul", t: "Factory Acceptance Test — NVO-2401", loc: "Dubai" },
              { d: "22 Jul", t: "Steel coils arrival — NVO-2412", loc: "Mombasa" },
              { d: "05 Aug", t: "Engineering review sign-off — NVO-2408", loc: "Riyadh" },
              { d: "18 Aug", t: "Installation kickoff — NVO-2317", loc: "Muscat" },
            ].map((m, i) => (
              <li key={i} className="flex items-center gap-4">
                <div className="grid h-12 w-14 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 font-mono text-xs text-emerald-300">
                  {m.d}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{m.t}</div>
                  <div className="text-xs text-white/50 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {m.loc}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/60" />
              </li>
            ))}
          </ol>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-white/60">
            <Sparkles className="h-4 w-4" /> Recent activity
          </h3>
          <ul className="space-y-3 text-sm">
            {[
              "Uploaded: Foundation drawings Rev C — NVO-2401",
              "Approved: Panel color RAL 9002 — NVO-2408",
              "Payment received: Milestone 3 invoice — NVO-2317",
              "Meeting scheduled with Eng. Layla · Thu 14:00 GST",
              "Downloaded: Continuous PIR Line datasheet",
            ].map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span className="text-white/80">{a}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}

/* ─── Projects ─── */
function ProjectsSection() {
  const [filter, setFilter] = useState<"all" | "current" | "completed" | "pending">("all");
  const filtered = useMemo(
    () =>
      PROJECTS.filter((p) => {
        if (filter === "all") return true;
        if (filter === "completed") return p.status === "Completed";
        if (filter === "pending")
          return p.status === "Pending Quotation" || p.status === "Proposal";
        return p.status !== "Completed" && p.status !== "Pending Quotation";
      }),
    [filter],
  );

  return (
    <div>
      <SectionTitle
        eyebrow="Portfolio"
        title="Your projects with NEVO"
        sub="Turnkey factories, production lines, raw materials and engineering consultancy — organised in one workspace."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { k: "all", l: "All" },
          { k: "current", l: "Current Projects" },
          { k: "completed", l: "Completed" },
          { k: "pending", l: "Pending Quotations" },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k as "all" | "current" | "completed" | "pending")}
            className={`rounded-full border px-3 py-1.5 text-xs transition
              ${filter === f.k ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
          >
            {f.l}
          </button>
        ))}
        <span className="ml-auto text-xs text-white/50">
          Types: Factory Design · Production Line · Raw Materials · Engineering Consultancy
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <GlassCard key={p.id} className="overflow-hidden">
            <div className="relative h-40">
              <img
                loading="lazy"
                decoding="async"
                src={p.img}
                alt={p.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F13] via-[#0B0F13]/40 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/80">
                {p.type}
              </span>
              <span className="absolute right-3 top-3 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">
                {p.status}
              </span>
            </div>
            <div className="p-4">
              <div className="text-xs text-white/50">
                {p.id} · {p.country}
              </div>
              <div className="mt-0.5 line-clamp-2 font-medium">{p.name}</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-white/50">Value</div>
                  <div className="mt-0.5 font-mono text-emerald-300">{p.value}</div>
                </div>
                <div>
                  <div className="text-white/50">ETA</div>
                  <div className="mt-0.5 font-mono">{p.eta}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={p.progress} />
                <span className="w-10 text-right font-mono text-xs text-white/70">
                  {p.progress}%
                </span>
              </div>
              <button className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl border border-white/10 bg-black/30 py-2 text-xs hover:bg-white/5">
                Open project <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

/* ─── Timeline ─── */
function TimelineSection() {
  return (
    <div>
      <SectionTitle
        eyebrow="Project timeline"
        title="NVO-2401 · Al-Nahda Cold Storage Turnkey Factory"
        sub="11-stage engineering lifecycle. Every stage carries drawings, checklists, sign-offs and photos."
      />

      <GlassCard className="relative overflow-hidden p-6 md:p-8">
        <img
          loading="lazy"
          decoding="async"
          src={p03.url}
          alt="Timeline"
          className="absolute inset-0 h-full w-full object-cover opacity-15"
        />
        <div className="relative">
          <ol className="relative border-l border-white/10 pl-6 md:pl-8">
            {TIMELINE_STAGES.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.key} className="relative mb-6 last:mb-0">
                  <span
                    className={`absolute -left-[35px] md:-left-[43px] grid h-8 w-8 place-items-center rounded-full border
                    ${
                      s.done
                        ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                        : s.active
                          ? "border-emerald-400 bg-emerald-500 text-black"
                          : "border-white/15 bg-black/40 text-white/60"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div
                    className={`rounded-xl border p-4 ${s.active ? "border-emerald-400/40 bg-emerald-500/5" : "border-white/10 bg-black/30"}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium">
                        {i + 1}. {s.label}
                      </div>
                      <span
                        className={`text-xs ${s.done ? "text-emerald-300" : s.active ? "text-emerald-200" : "text-white/50"}`}
                      >
                        {s.done ? "Completed" : s.active ? "In Progress" : "Upcoming"}
                      </span>
                    </div>
                    {s.active && (
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs">
                          <div className="text-white/50">Progress</div>
                          <div className="mt-1 font-mono text-lg text-emerald-300">62%</div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs">
                          <div className="text-white/50">Owner</div>
                          <div className="mt-1">Eng. Layla · PM</div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs">
                          <div className="text-white/50">Next milestone</div>
                          <div className="mt-1">FAT · 12 Jul 2026</div>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </GlassCard>
    </div>
  );
}

/* ─── Documents ─── */
function DocumentsSection() {
  return (
    <div>
      <SectionTitle
        eyebrow="Document center"
        title="Every drawing, contract & certificate in one place"
        sub="Version-controlled, encrypted document exchange for your engineering team."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {DOC_CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <GlassCard key={c.name} className="group overflow-hidden">
              <div className="relative h-24">
                <img
                  loading="lazy"
                  decoding="async"
                  src={c.img}
                  alt={c.name}
                  className="absolute inset-0 h-full w-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F13] via-[#0B0F13]/50 to-transparent" />
                <Icon className="absolute right-3 top-3 h-5 w-5 text-emerald-300" />
              </div>
              <div className="p-4">
                <div className="text-xs uppercase tracking-widest text-emerald-300">
                  {c.count} files
                </div>
                <div className="mt-1 font-medium">{c.name}</div>
                <button className="mt-3 flex items-center gap-1 text-xs text-white/70 group-hover:text-emerald-300">
                  Browse <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Tracking ─── */
function TrackingSection() {
  return (
    <div>
      <SectionTitle
        eyebrow="Live tracking"
        title="Manufacturing, shipping & delivery"
        sub="Real-time signals from the factory floor to your job site."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <GlassCard className="relative overflow-hidden">
          <img
            loading="lazy"
            decoding="async"
            src={p04.url}
            alt="Shipping tracker"
            className="h-72 w-full object-cover opacity-60 md:h-96"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F13] via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="text-xs uppercase tracking-widest text-emerald-300">
              Vessel MSC Aurora · NVO-2412
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold">
              Jebel Ali → Mombasa · ETA 22 Jul
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-white/70">
              <span className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-emerald-300" /> Shipping 68%
              </span>
              <span className="flex items-center gap-1">
                <Plane className="h-3.5 w-3.5 text-emerald-300" /> 5 days remaining
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-emerald-300" /> Arabian Sea
              </span>
            </div>
            <div className="mt-3">
              <ProgressBar value={68} />
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <Stat
            label="Overall project progress"
            value="62%"
            delta="+8% this month"
            icon={TrendingUp}
          />
          <Stat
            label="Manufacturing status"
            value="On track"
            delta="Line 2 · Panel #1,842/3,000"
            icon={Factory}
          />
          <Stat label="Estimated completion" value="Q1 2027" delta="No slippage" icon={Target} />
          <Stat
            label="Next delivery window"
            value="12 – 18 Sep"
            delta="Confirmed"
            icon={Calendar}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { t: "Manufacturing", v: "62%", d: "Continuous PIR Line 2 · Dubai", i: Factory },
          { t: "Quality Checks", v: "48 / 62", d: "NCR closed · 3 open", i: ShieldCheck },
          { t: "Shipping", v: "1 vessel", d: "MSC Aurora · Arabian Sea", i: Truck },
        ].map((c, i) => {
          const Icon = c.i;
          return (
            <GlassCard key={i} className="p-5">
              <div className="flex items-center justify-between text-white/60">
                <span className="text-xs uppercase tracking-widest">{c.t}</span>
                <Icon className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="mt-2 font-mono text-2xl">{c.v}</div>
              <div className="mt-1 text-xs text-white/60">{c.d}</div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Communication ─── */
function CommunicationSection() {
  const channels = [
    {
      t: "Direct Messaging",
      d: "Chat with your PM and engineers",
      i: MessagesSquare,
      cta: "Open inbox",
    },
    {
      t: "Engineering Support",
      d: "Ask a senior industrial engineer",
      i: HelpCircle,
      cta: "Ask now",
    },
    { t: "Schedule Meeting", d: "Book a review with your PM", i: Calendar, cta: "Choose time" },
    { t: "Video Consultation", d: "HD engineering video calls", i: Video, cta: "Start call" },
    { t: "WhatsApp", d: "Fast direct WhatsApp channel", i: MessageCircle, cta: "Open chat" },
    { t: "Support Tickets", d: "Track and resolve issues", i: Ticket, cta: "Create ticket" },
  ];
  return (
    <div>
      <SectionTitle
        eyebrow="Communication"
        title="One direct line to your engineering team"
        sub="Messaging, video, WhatsApp and tickets — everything logged against your project."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map((c, i) => {
          const Icon = c.i;
          return (
            <GlassCard key={i} className="p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{c.t}</h3>
              <p className="mt-1 text-sm text-white/60">{c.d}</p>
              <button className="mt-4 flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200">
                {c.cta} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </GlassCard>
          );
        })}
      </div>

      <GlassCard className="mt-6 grid grid-cols-1 gap-6 overflow-hidden p-0 md:grid-cols-[1fr_1.2fr]">
        <div className="relative">
          <img
            loading="lazy"
            decoding="async"
            src={p05.url}
            alt="Engineering support"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F13]/40 to-transparent" />
        </div>
        <div className="p-6 md:p-8">
          <div className="text-xs uppercase tracking-widest text-emerald-300">
            Your Project Manager
          </div>
          <h3 className="mt-2 font-mono text-2xl">Eng. Layla Rahman</h3>
          <p className="mt-2 text-sm text-white/70">
            Senior Industrial Engineer · 14 years in continuous PIR lines & cold-storage factories.
            Available 09:00–19:00 GST, Mon–Sat.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400">
              Message Layla
            </button>
            <button className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5 inline-flex items-center gap-2">
              <PhoneCall className="h-4 w-4" />
              Call
            </button>
            <button className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5 inline-flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

/* ─── Downloads ─── */
function DownloadsSection() {
  const groups = [
    { t: "All Project Documents", n: 132, i: FileText, img: p08.url },
    { t: "Certificates", n: 22, i: Award, img: p13.url },
    { t: "Reports", n: 38, i: BarChart3, img: p12.url },
    { t: "CAD Files", n: 64, i: Wrench, img: p09.url },
    { t: "Technical Specifications", n: 47, i: ClipboardCheck, img: p10.url },
  ];
  return (
    <div>
      <SectionTitle eyebrow="Downloads" title="Every asset, one click away" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {groups.map((g, i) => {
          const Icon = g.i;
          return (
            <GlassCard key={i} className="overflow-hidden">
              <div className="relative h-28">
                <img
                  loading="lazy"
                  decoding="async"
                  src={g.img}
                  alt={g.t}
                  className="absolute inset-0 h-full w-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F13] to-transparent" />
                <Icon className="absolute right-3 top-3 h-5 w-5 text-emerald-300" />
              </div>
              <div className="p-4">
                <div className="text-xs text-white/50">{g.n} files</div>
                <div className="mt-1 font-medium">{g.t}</div>
                <button className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200">
                  <Download className="h-3.5 w-3.5" /> Download all
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Quality ─── */
function QualitySection() {
  return (
    <div>
      <SectionTitle
        eyebrow="Quality"
        title="Inspection, FAT, photos & video reports"
        sub="Every panel is inspected. Every batch is documented. Every acceptance test is on record."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                Inspection reports
              </div>
              <div className="font-mono text-2xl">14</div>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              "Incoming raw materials — PASS",
              "Foaming machine calibration — PASS",
              "Panel dimensional check — PASS",
              "NCR-0083 corrective action — CLOSED",
            ].map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-white/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {r}
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">QC checklists</div>
              <div className="font-mono text-2xl">62</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs text-white/60">Completion</div>
            <div className="mt-1 flex items-center gap-3">
              <ProgressBar value={77} />
              <span className="font-mono text-xs">77%</span>
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 48 items closed
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-300" /> 11 in review
            </li>
            <li className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-yellow-300" /> 3 open (non-critical)
            </li>
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                Factory Acceptance Test
              </div>
              <div className="font-mono text-2xl">Scheduled</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/70">
            On-site FAT scheduled for 12 Jul 2026, Dubai. Full protocol, witness team and travel
            logistics attached.
          </p>
          <button className="mt-4 inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200">
            View FAT protocol <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </GlassCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm uppercase tracking-widest text-white/60">
              <ImageIcon className="h-4 w-4" /> Photo gallery
            </h3>
            <button className="text-xs text-emerald-300">Open gallery →</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[p06, p07, p11, p12, p14, p16].map((im, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-lg border border-white/10"
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src={im.url}
                  alt="QA photo"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm uppercase tracking-widest text-white/60">
              <Video className="h-4 w-4" /> Video reports
            </h3>
            <button className="text-xs text-emerald-300">All videos →</button>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              { t: "Continuous PIR line — running trial", d: "04:12" },
              { t: "Panel dimensional inspection", d: "02:38" },
              { t: "Packing & container loading", d: "03:05" },
            ].map((v, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
                  <Play className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate">{v.t}</div>
                  <div className="text-xs text-white/50">{v.d}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/60" />
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}

/* ─── Analytics ─── */
function AnalyticsSection() {
  const kpis = [
    { l: "Completion %", v: "62%", i: Target },
    { l: "Budget progress", v: "58%", i: DollarSign },
    { l: "Timeline progress", v: "64%", i: Clock },
    { l: "Milestones", v: "7 / 11", i: ListChecks },
    { l: "Open tasks", v: "14", i: ClipboardCheck },
    { l: "Team utilisation", v: "92%", i: TrendingUp },
  ];
  const timeline = [55, 62, 68, 72, 76, 82, 88, 94]; // arbitrary bars
  return (
    <div>
      <SectionTitle
        eyebrow="Analytics"
        title="Project dashboard"
        sub="Budget, timeline, tasks and milestones — visualised for executive review."
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k, i) => {
          const Icon = k.i;
          return (
            <GlassCard key={i} className="p-4">
              <Icon className="h-4 w-4 text-emerald-300" />
              <div className="mt-3 font-mono text-2xl">{k.v}</div>
              <div className="mt-1 text-xs text-white/60">{k.l}</div>
            </GlassCard>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 p-6">
          <h3 className="mb-4 text-sm uppercase tracking-widest text-white/60">
            Progress trend · last 8 weeks
          </h3>
          <div className="flex h-56 items-end gap-3">
            {timeline.map((v, i) => (
              <div key={i} className="flex-1">
                <div
                  className="mx-auto w-full rounded-t-md bg-gradient-to-t from-emerald-600/60 to-emerald-300/80"
                  style={{ height: `${v}%` }}
                />
                <div className="mt-2 text-center text-[10px] text-white/50">W{i + 1}</div>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="mb-4 text-sm uppercase tracking-widest text-white/60">
            Budget vs. actual
          </h3>
          <div className="space-y-4 text-sm">
            {[
              { l: "Engineering", p: 100, a: "$780K / $780K" },
              { l: "Manufacturing", p: 64, a: "$3.9M / $6.1M" },
              { l: "Shipping", p: 20, a: "$120K / $600K" },
              { l: "Installation", p: 0, a: "$0 / $920K" },
            ].map((r, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-white/70">{r.l}</span>
                  <span className="font-mono text-white/60">{r.a}</span>
                </div>
                <ProgressBar value={r.p} />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/* ─── Final CTA ─── */
function FinalCTA() {
  return (
    <GlassCard className="relative mt-10 overflow-hidden">
      <img
        loading="lazy"
        decoding="async"
        src={p21.url}
        alt="Engineering assistance"
        className="absolute inset-0 h-full w-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F13] via-[#0B0F13]/70 to-transparent" />
      <div className="relative grid grid-cols-1 gap-6 p-8 md:grid-cols-[1.4fr_1fr] md:p-10">
        <div>
          <div className="text-xs uppercase tracking-widest text-emerald-300">
            Need engineering assistance?
          </div>
          <h3 className="mt-2 font-mono text-3xl">Your engineering team is on standby.</h3>
          <p className="mt-3 max-w-xl text-white/70">
            Talk to your Project Manager, escalate to a senior industrial engineer, or open a
            support ticket — every conversation is logged against your project.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <button className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black hover:bg-emerald-400">
            Contact Your Project Manager
          </button>
          <Link
            to="/ai-assistant"
            className="rounded-xl border border-white/15 px-5 py-3 text-sm hover:bg-white/5"
          >
            Talk to an Engineer
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}
