import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { useMemo, useState } from "react";
import {
  Search,
  ArrowRight,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Video,
  FileText,
  Wrench,
  Factory,
  FlaskConical,
  Layers,
  Flame,
  Shield,
  Snowflake,
  Building2,
  ClipboardCheck,
  Sparkles,
  Calculator,
  Rss,
  PlayCircle,
  Download,
  Clock,
  Star,
  TrendingUp,
  HelpCircle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/knowledge/hub-hero.jpg";
import { SITE, buildSeo } from "@/lib/seo";
import { ARTICLES, type Category } from "@/lib/knowledge-articles";

// Reuse existing knowledge photography for cards outside the article list
import k01 from "@/assets/knowledge/01_blueprint.jpg";
import k03 from "@/assets/knowledge/03_3d_factory.jpg";
import k06 from "@/assets/knowledge/06_production_line.jpg";
import k07 from "@/assets/knowledge/07_laminator.jpg";
import k17 from "@/assets/knowledge/17_pir_panel.jpg";
import k21 from "@/assets/knowledge/21_coldroom_panel.jpg";
import k28 from "@/assets/knowledge/28_fire_rating.jpg";
import k33 from "@/assets/knowledge/33_layout.jpg";
import k36 from "@/assets/knowledge/36_investment_report.jpg";
import k38 from "@/assets/knowledge/38_factory_guide.jpg";
import k40 from "@/assets/knowledge/40_material_guide.jpg";

export const Route = createFileRoute("/$lang/knowledge-hub")({
  component: KnowledgeHub,
  head: ({ params }) => {
    const seo = buildSeo({
      title: "Knowledge Hub — Sandwich Panel Engineering Library",
      description:
        "The world's most comprehensive sandwich panel knowledge hub — technical articles, engineering guides, courses, videos, FAQs and downloads on PIR, PUR, rock wool panels, cold rooms, clean rooms, factory design and production.",
      path: "/knowledge-hub",
      lang: params.lang,
      image: heroImg,
    });
    return {
      ...seo,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Knowledge Hub", item: "/knowledge-hub" },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "NEVO Knowledge Hub",
            description:
              "Engineering knowledge library for sandwich panel technology, factory development and production.",
            url: "/knowledge-hub",
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.flatMap((g) => g.items).map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        },
      ],
    };
  },
});

/* ---------- Data ---------- */
// ARTICLES + types are imported from '@/lib/knowledge-articles'

const SECTIONS = [
  { name: "Technical Articles", icon: FileText, count: 128, href: "#articles" },
  { name: "Engineering Guides", icon: BookOpen, count: 42, href: "#articles" },
  { name: "Sandwich Panel Academy", icon: GraduationCap, count: 24, href: "#academy" },
  { name: "Factory Development", icon: Factory, count: 36, href: "#articles" },
  { name: "Production Technology", icon: Wrench, count: 48, href: "#articles" },
  { name: "Raw Materials", icon: FlaskConical, count: 22, href: "#articles" },
  { name: "Finished Products", icon: Layers, count: 30, href: "#articles" },
  { name: "Industry Applications", icon: Building2, count: 26, href: "#articles" },
  { name: "Installation Guides", icon: ClipboardCheck, count: 18, href: "#articles" },
  { name: "Maintenance Guides", icon: Shield, count: 14, href: "#articles" },
  { name: "Design Standards", icon: Flame, count: 16, href: "#articles" },
  { name: "Engineering Calculators", icon: Calculator, count: 20, href: "/engineering-tools" },
  { name: "Industry News", icon: Rss, count: 60, href: "#articles" },
  { name: "Innovation Center", icon: Sparkles, count: 12, href: "/research-innovation" },
];

const CATEGORIES: (Category | "All")[] = [
  "All",
  "PIR",
  "PUR",
  "Rock Wool",
  "EPS",
  "Cold Rooms",
  "Clean Rooms",
  "Fire",
  "Thermal",
  "Production Lines",
  "Factory Design",
  "Steel Coils",
  "Chemicals",
  "Automation",
  "Quality",
  "Project Management",
];

const COURSES = [
  {
    level: "Beginner",
    title: "Sandwich Panels — Foundations",
    hours: 6,
    lessons: 18,
    cover: k17,
    tag: "Free",
  },
  {
    level: "Beginner",
    title: "Reading a Panel Datasheet",
    hours: 3,
    lessons: 10,
    cover: k01,
    tag: "Free",
  },
  {
    level: "Professional",
    title: "PIR Line Operation Essentials",
    hours: 12,
    lessons: 28,
    cover: k07,
    tag: "Pro",
  },
  {
    level: "Professional",
    title: "Cold Room Engineering Masterclass",
    hours: 10,
    lessons: 24,
    cover: k21,
    tag: "Pro",
  },
  {
    level: "Expert",
    title: "Factory Investment & Financial Modeling",
    hours: 16,
    lessons: 32,
    cover: k36,
    tag: "Expert",
  },
  {
    level: "Expert",
    title: "Line Commissioning & FAT/SAT",
    hours: 14,
    lessons: 26,
    cover: k06,
    tag: "Expert",
  },
];

const VIDEOS = [
  { title: "Inside a NEVO PIR laminator", min: 6, cover: k07 },
  { title: "PIR vs Rock Wool — fire test", min: 4, cover: k28 },
  { title: "3D factory layout walkthrough", min: 8, cover: k33 },
  { title: "Cold room cam-lock installation", min: 5, cover: k21 },
];

const DOWNLOADS = [
  { title: "Factory Investment Guide (PDF)", size: "6.4 MB", cover: k38 },
  { title: "Panel Datasheet Pack (PDF)", size: "3.1 MB", cover: k40 },
  { title: "Production Line Brochure (PDF)", size: "8.2 MB", cover: k03 },
];

const FAQS: { group: string; icon: typeof HelpCircle; items: { q: string; a: string }[] }[] = [
  {
    group: "Technical Questions",
    icon: FileText,
    items: [
      {
        q: "What thickness of panel do I need for a −25 °C freezer?",
        a: "For −25 °C, a 150–180 mm PIR panel typically reaches U ≈ 0.14 W/m²K, meeting energy targets in most climates. Use our Panel Thickness Calculator to size for local conditions.",
      },
      {
        q: "What's the difference between PIR and PUR?",
        a: "PUR is a polyurethane rigid foam; PIR is polyisocyanurate — a modified PUR with higher aromatic content that improves fire performance (typically B-s1,d0) while retaining a low λ ≈ 0.022 W/mK.",
      },
      {
        q: "How is U-value calculated?",
        a: "U = λ / d, where λ is thermal conductivity (W/mK) and d is core thickness in metres. Skins and interfaces add small resistances; EN 14509 gives the full method.",
      },
    ],
  },
  {
    group: "Production Questions",
    icon: Factory,
    items: [
      {
        q: "What is a typical line speed?",
        a: "Continuous PIR lines run 6–15 m/min depending on thickness and panel type. Rock wool lines are slower — typically 3–8 m/min due to lamella insertion.",
      },
      {
        q: "How many people run a modern sandwich panel line?",
        a: "A fully automated NEVO line runs with 6–8 operators per shift, plus quality, maintenance and warehouse staff.",
      },
      {
        q: "What OEE should I target?",
        a: "World-class continuous lines reach 82–88% OEE. New factories typically start at 60–70% and improve over 12–18 months with SPC and TPM programmes.",
      },
    ],
  },
  {
    group: "Investment Questions",
    icon: TrendingUp,
    items: [
      {
        q: "How much does a sandwich panel factory cost?",
        a: "A 1 M m²/yr continuous PIR factory typically costs 8–12 M USD turnkey (line + building + utilities + working capital), depending on automation level and country.",
      },
      {
        q: "What payback period is realistic?",
        a: "Typical payback is 3.5–5 years at 35–45% gross margin. Our Investment Calculator models CAPEX, OPEX, IRR and NPV for your inputs.",
      },
      {
        q: "Can the factory be expanded in phases?",
        a: "Yes — plan a second line at Year 3 with ~55% incremental capex. Design the building and utilities for Phase II from day one.",
      },
    ],
  },
  {
    group: "Engineering Questions",
    icon: Wrench,
    items: [
      {
        q: "Which fire standard applies in my country?",
        a: "Most markets recognise EN 13501-1 (EU) or ASTM E84 (US). Petrochemical projects add EI-integrity per EN 1364-1. Ask our engineers for a country-specific reference.",
      },
      {
        q: "What is the difference between roof and wall panels?",
        a: "Roof panels use 5-rib trapezoidal profiles for drainage and load-span; wall panels use micro-rib or flush profiles for aesthetics. Both use the same core technology.",
      },
    ],
  },
  {
    group: "Installation Questions",
    icon: ClipboardCheck,
    items: [
      {
        q: "How are panels fixed to structure?",
        a: "Wall panels use hidden or exposed fasteners into steel purlins/rails per panel manufacturer detail. Cold room panels use cam-lock joints for tight thermal seal.",
      },
      {
        q: "What's the maximum panel length?",
        a: "Continuous lines produce panels up to 24 m for standard trucks. Special transport (flat-rack containers, break-bulk) enables longer panels for architectural projects.",
      },
    ],
  },
  {
    group: "Maintenance Questions",
    icon: Shield,
    items: [
      {
        q: "How often should facades be inspected?",
        a: "Annual visual inspection is standard; a full fastener and seal check every 3 years. Coastal environments require 6-month inspections and touch-up of any coating damage.",
      },
      {
        q: "How long do sandwich panels last?",
        a: "Well-maintained PVDF-coated panels have a service life of 30–40 years; polyester-coated panels 15–25 years. Cores retain thermal performance for the panel's full life.",
      },
    ],
  },
];

/* ---------- Component ---------- */

type Level = "All" | "Beginner" | "Professional" | "Expert";
type Tab = "Latest" | "Most Popular" | "Featured";

function KnowledgeHub() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");
  const [level, setLevel] = useState<Level>("All");
  const [tab, setTab] = useState<Tab>("Featured");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    let list = ARTICLES.filter((a) => {
      if (cat !== "All" && a.category !== cat) return false;
      if (level !== "All" && a.level !== level) return false;
      if (tokens.length === 0) return true;
      const hay = `${a.title} ${a.excerpt} ${a.category} ${a.section} ${a.level}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
    if (tab === "Latest") list = [...list].sort((a, b) => b.date.localeCompare(a.date));
    else if (tab === "Most Popular")
      list = list.filter((a) => a.popular).concat(list.filter((a) => !a.popular));
    else list = list.filter((a) => a.featured).concat(list.filter((a) => !a.featured));
    return list;
  }, [query, cat, level, tab]);

  return (
    <div className="min-h-screen bg-[#05070a] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <img
            loading="lazy"
            decoding="async"
            src={heroImg}
            alt=""
            className="h-full w-full object-cover opacity-45"
            width={1920}
            height={1088}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070a] via-[#05070a]/60 to-[#05070a]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_55%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 pt-28 pb-24">
          <nav
            aria-label="Breadcrumb"
            className="text-[11px] font-mono uppercase tracking-widest text-white/40 mb-6 flex gap-2 items-center"
          >
            <Link to="/" className="hover:text-emerald-400">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/70">Knowledge Hub</span>
          </nav>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-emerald-300">
            <BookOpen className="h-3 w-3" /> The Sandwich Panel Engineering Library
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02] max-w-4xl">
            Knowledge Hub — <span className="text-emerald-400">the industry's reference</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/60 leading-relaxed">
            Technical articles, engineering guides, courses, videos and FAQs on sandwich panels,
            factory development and production technology — written by NEVO engineers for investors,
            engineers, architects and factory owners.
          </p>

          {/* Live search */}
          <div className="mt-10 max-w-2xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles, guides, FAQs — PIR, cold room, ROI, factory layout…"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-12 pr-4 py-4 text-base placeholder:text-white/40 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden max-w-3xl">
            {[
              { k: "500+", v: "Articles & Guides" },
              { k: "24", v: "Academy Courses" },
              { k: "80+", v: "Videos & Webinars" },
              { k: "120+", v: "Technical Downloads" },
            ].map((m) => (
              <div key={m.v} className="bg-[#0a0d10] p-5">
                <div className="text-2xl font-semibold tracking-tight text-emerald-400">{m.k}</div>
                <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/50">
                  {m.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTIONS GRID */}
      <section className="border-b border-white/5 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
            Explore
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">14 knowledge sections</h2>
          <p className="mt-3 text-white/60 max-w-2xl">
            From beginner foundations to expert-level factory financial modeling — organized by
            discipline.
          </p>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isExternal = s.href.startsWith("/");
              const inner = (
                <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/30 p-5 transition">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono text-white/40">{s.count}</span>
                  </div>
                  <div className="mt-4 font-medium group-hover:text-emerald-300 transition">
                    {s.name}
                  </div>
                </div>
              );
              return isExternal ? (
                <Link key={s.name} to={s.href}>
                  {inner}
                </Link>
              ) : (
                <a key={s.name} href={s.href}>
                  {inner}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ARTICLES */}
      <section id="articles" className="border-b border-white/5 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                Editorial library
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Technical articles & engineering guides
              </h2>
            </div>
            <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
              {(["Featured", "Latest", "Most Popular"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs rounded-md transition ${tab === t ? "bg-emerald-500 text-black font-semibold" : "text-white/70 hover:text-white"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="mt-8 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-3 py-1.5 text-xs transition ${cat === c ? "bg-emerald-500 text-black font-semibold" : "border border-white/10 bg-white/[0.03] text-white/70 hover:text-white"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["All", "Beginner", "Professional", "Expert"] as Level[]).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`rounded-md px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest transition ${level === l ? "bg-white/10 text-white border border-white/20" : "border border-white/10 text-white/50 hover:text-white"}`}
              >
                {l}
              </button>
            ))}
            <span className="ml-auto text-xs font-mono text-white/40 self-center">
              {filtered.length} results
            </span>
          </div>

          {/* Grid */}
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((a) => (
              <Link
                key={a.slug}
                to="/knowledge-hub/$slug"
                params={{ slug: a.slug }}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:border-emerald-500/30 transition block"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                  <img
                    src={a.cover}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover opacity-90 group-hover:scale-[1.03] transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute top-3 left-3 text-[9px] font-mono uppercase tracking-widest text-emerald-300 border border-emerald-500/40 bg-black/50 rounded px-1.5 py-0.5">
                    {a.category}
                  </span>
                  {a.featured && (
                    <span className="absolute top-3 right-3 text-[9px] font-mono uppercase tracking-widest text-white/80 border border-white/30 bg-black/50 rounded px-1.5 py-0.5">
                      Featured
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                    {a.section} · {a.level}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight group-hover:text-emerald-300 transition leading-snug">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed line-clamp-2">
                    {a.excerpt}
                  </p>
                  <div className="mt-5 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-white/40">
                      <Clock className="h-3.5 w-3.5" /> {a.readMin} min read
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      Read more{" "}
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/50">
              No articles match — try clearing filters or searching a different term.
            </div>
          )}
        </div>
      </section>

      {/* ACADEMY */}
      <section id="academy" className="border-b border-white/5 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
            Sandwich Panel Academy
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Learning Center</h2>
          <p className="mt-3 text-white/60 max-w-2xl">
            Structured courses at three levels — from panel foundations to factory investment
            engineering.
          </p>

          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {COURSES.map((c) => (
              <Link
                to="/download-center"
                key={c.title}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:border-emerald-500/30 transition block"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={c.cover}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                    <span className="text-emerald-300 border border-emerald-500/40 bg-black/50 rounded px-1.5 py-0.5">
                      {c.level}
                    </span>
                    <span className="text-white/70 border border-white/20 bg-black/50 rounded px-1.5 py-0.5">
                      {c.tag}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold tracking-tight group-hover:text-emerald-300 transition">
                    {c.title}
                  </h3>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/50">
                    <span>
                      {c.lessons} lessons · {c.hours} h
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      Watch training <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Videos + Downloads split */}
          <div className="mt-16 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                <Video className="h-3.5 w-3.5" /> Engineering Videos
              </div>
              <div className="mt-5 space-y-3">
                {VIDEOS.map((v) => (
                  <Link
                    to="/download-center"
                    key={v.title}
                    className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:border-emerald-500/30 transition"
                  >
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={v.cover}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 grid place-items-center bg-black/40">
                        <PlayCircle className="h-6 w-6 text-emerald-400" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate group-hover:text-emerald-300 transition">
                        {v.title}
                      </div>
                      <div className="text-[11px] text-white/40 mt-1">{v.min} min</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-emerald-400 transition" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                <Download className="h-3.5 w-3.5" /> Technical Downloads
              </div>
              <div className="mt-5 space-y-3">
                {DOWNLOADS.map((d) => (
                  <Link
                    key={d.title}
                    to="/download-center"
                    className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:border-emerald-500/30 transition"
                  >
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={d.cover}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate group-hover:text-emerald-300 transition">
                        {d.title}
                      </div>
                      <div className="text-[11px] text-white/40 mt-1">PDF · {d.size}</div>
                    </div>
                    <Download className="h-4 w-4 text-white/40 group-hover:text-emerald-400 transition" />
                  </Link>
                ))}
                <Link
                  to="/download-center"
                  className="block text-center text-xs font-mono uppercase tracking-widest text-emerald-400 hover:text-emerald-300 py-3"
                >
                  Open Download Center →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ CENTER */}
      <section id="faq" className="border-b border-white/5 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
            FAQ Center
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Answers from our engineers</h2>
          <p className="mt-3 text-white/60 max-w-2xl">
            Six categories — technical, production, investment, engineering, installation and
            maintenance.
          </p>

          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {FAQS.map((g) => {
              const Icon = g.icon;
              return (
                <div
                  key={g.group}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight">{g.group}</h3>
                  </div>
                  <div className="mt-5 divide-y divide-white/5 border-y border-white/5">
                    {g.items.map((f) => (
                      <details key={f.q} className="group py-4">
                        <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                          <span className="text-sm font-medium">{f.q}</span>
                          <ChevronRight className="h-4 w-4 text-emerald-400 transition group-open:rotate-90 shrink-0" />
                        </summary>
                        <p className="mt-3 text-sm text-white/60 leading-relaxed">{f.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RELATED / TOOLS */}
      <section className="border-b border-white/5 py-20 bg-gradient-to-b from-emerald-500/[0.04] to-transparent">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
            Related
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Keep going — related content & tools
          </h2>

          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Calculator,
                title: "Engineering Tools",
                desc: "20 real-time calculators.",
                href: "/engineering-tools",
              },
              {
                icon: Download,
                title: "Download Center",
                desc: "CAD, BIM, certifications, manuals.",
                href: "/download-center",
              },
              {
                icon: Snowflake,
                title: "PIR vs Rock Wool",
                desc: "The full comparison page.",
                href: "/pir-vs-rock-wool",
              },
              {
                icon: Sparkles,
                title: "AI Engineer",
                desc: "Ask any panel or factory question.",
                href: "/ai-assistant",
              },
            ].map((r) => {
              const Icon = r.icon;
              return (
                <Link
                  key={r.title}
                  to={r.href}
                  className="group rounded-2xl border border-white/10 bg-white/[0.02] hover:border-emerald-500/30 p-5 transition"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 font-semibold group-hover:text-emerald-300 transition">
                    {r.title}
                  </div>
                  <div className="mt-1 text-xs text-white/50">{r.desc}</div>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                    Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <Star className="h-8 w-8 text-emerald-400 mx-auto" />
          <h2 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight">
            Talk to a NEVO engineer
          </h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto">
            Have a project or a question our library doesn't cover yet? A senior industrial engineer
            will reply within 24 hours.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold h-12 px-6"
            >
              <Link to="/project-inquiry">Talk to an Engineer</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/15 bg-white/[0.03] h-12 px-6">
              <Link to="/download-center">
                <Download className="h-4 w-4 mr-2" /> Download Engineering Guide
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white/70 hover:text-white h-12 px-6">
              <a href="#academy">
                <PlayCircle className="h-4 w-4 mr-2" /> Watch Training
              </a>
            </Button>
          </div>
          <div className="mt-6 text-xs text-white/40 inline-flex items-center gap-2 justify-center">
            <Mail className="h-3.5 w-3.5" /> engineers@nevo-industrial.com
          </div>
        </div>
      </section>
    </div>
  );
}
