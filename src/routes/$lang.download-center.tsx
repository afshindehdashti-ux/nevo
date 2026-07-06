import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Download,
  X,
  ArrowRight,
  Factory,
  Cog,
  PackageSearch,
  Layers,
  Wrench,
  ClipboardCheck,
  Building2,
  FileText,
  Lock,
  CheckCircle2,
  Mail,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { RoutedDocumentsList } from "@/components/site/RoutedDocumentsList";
import { buildSeo, orgJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { submitInquiry } from "@/lib/inquiries.functions";
import { z } from "zod";

import heroImg from "@/assets/downloads/hero-engineering-portrait.png.asset.json";

/* ─────────────────────────────────────────────────────────────── */
/* Curated content                                                   */
/* ─────────────────────────────────────────────────────────────── */

type FilterKey =
  | "all"
  | "company"
  | "factory"
  | "lines"
  | "materials"
  | "panels"
  | "engineering"
  | "support";

type Access = "download" | "request";

interface Resource {
  id: string;
  title: string;
  desc: string;
  access: Access;
  filter: FilterKey;
}

interface Category {
  id: FilterKey;
  title: string;
  short: string;
  desc: string;
  icon: typeof Factory;
  items: string[];
}

const CATEGORIES: Category[] = [
  {
    id: "company",
    title: "Company & Corporate Profile",
    short: "Corporate identity, capabilities and global references.",
    desc: "Overview of NEVO Industrial, engineering capabilities, delivered projects and corporate credentials.",
    icon: Building2,
    items: [
      "NEVO Corporate Profile",
      "Global Reference List",
      "Engineering Capabilities Overview",
      "Company Credentials",
    ],
  },
  {
    id: "factory",
    title: "Factory Development Guides",
    short: "Plan, size and build a sandwich panel factory.",
    desc: "Feasibility, layout, utilities and investment inputs required before line procurement.",
    icon: Factory,
    items: [
      "Factory Planning Checklist",
      "Factory Investment Guide",
      "Utility Requirement Guide",
      "Factory Layout Preparation Guide",
    ],
  },
  {
    id: "lines",
    title: "Production Line Resources",
    short: "Continuous and discontinuous line configurations.",
    desc: "Line capacities, equipment lists and automation architecture for panel production.",
    icon: Cog,
    items: [
      "Continuous Line Catalogue",
      "Discontinuous Line Catalogue",
      "Equipment List",
      "Automation Overview",
    ],
  },
  {
    id: "materials",
    title: "Raw Material & Panel Specifications",
    short: "Steel, PIR/PUR chemistry and rock wool.",
    desc: "Substrates, chemicals and cores used across NEVO panel systems, with consumption and tolerance guidance.",
    icon: PackageSearch,
    items: [
      "PIR / PUR System Overview",
      "Steel Coil Specification Guide",
      "Rock Wool Panel Specification",
      "Finished Panel Datasheets",
    ],
  },
  {
    id: "panels",
    title: "Engineering & Technical Documentation",
    short: "U-value, fire, structural and acoustic design data.",
    desc: "Engineering references for specifiers, consultants and QA teams working with sandwich panel envelopes.",
    icon: Layers,
    items: [
      "Panel Thickness Selection Guide",
      "U-Value & Thermal Reference",
      "Fire Performance Reference",
      "Structural & Load Reference",
    ],
  },
  {
    id: "support",
    title: "Quality, Installation & Support",
    short: "Installation, commissioning and after-sales.",
    desc: "Site installation, quality control and long-term operation of NEVO panels and production lines.",
    icon: ClipboardCheck,
    items: [
      "Installation & Commissioning Guide",
      "Quality Control Checklist",
      "Maintenance Manual",
      "Operator Training Overview",
    ],
  },
];

const FEATURED: Resource[] = [
  {
    id: "corp-profile",
    title: "NEVO Corporate Profile",
    desc: "Company overview, engineering capabilities and global project references.",
    access: "download",
    filter: "company",
  },
  {
    id: "factory-dev",
    title: "Factory Development Guide",
    desc: "Planning inputs, utilities and layout preparation for a new sandwich panel factory.",
    access: "request",
    filter: "factory",
  },
  {
    id: "line-catalogue",
    title: "Production Line Catalogue",
    desc: "Continuous and discontinuous line configurations, capacities and footprints.",
    access: "request",
    filter: "lines",
  },
  {
    id: "raw-materials",
    title: "Raw Material Specification Pack",
    desc: "Steel coils, PIR/PUR chemistry and rock wool specifications used in NEVO panels.",
    access: "request",
    filter: "materials",
  },
  {
    id: "panel-datasheets",
    title: "Panel Technical Datasheets",
    desc: "U-value, fire class, weight and structural data for standard panel systems.",
    access: "request",
    filter: "panels",
  },
  {
    id: "install-commission",
    title: "Installation & Commissioning Guide",
    desc: "On-site installation, quality control and commissioning procedures.",
    access: "request",
    filter: "support",
  },
];

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: "all", label: "All Resources" },
  { id: "company", label: "Company" },
  { id: "factory", label: "Factory Development" },
  { id: "lines", label: "Production Lines" },
  { id: "materials", label: "Raw Materials" },
  { id: "panels", label: "Finished Panels" },
  { id: "engineering", label: "Engineering" },
  { id: "support", label: "Installation & Support" },
];

const FAQ = [
  {
    q: "Can I download all documents directly?",
    a: "No. Only the NEVO Corporate Profile is available as a direct download. All engineering, factory and production line documents are shared upon request so we can tailor them to your project.",
  },
  {
    q: "How do I request technical datasheets?",
    a: "Use the Request Technical Documents form on this page. Our engineering team reviews each request and shares the relevant datasheets by email, typically within 1–3 working days.",
  },
  {
    q: "Are engineering documents project-specific?",
    a: "Yes. Panel datasheets, U-value data and fire performance references are always aligned with the panel system, thickness and application you plan to use.",
  },
  {
    q: "Can NEVO provide factory layout documents?",
    a: "Yes. Factory planning checklists, utility requirement guides and reference layouts are shared upon request after a short project qualification.",
  },
  {
    q: "Can I request production line specifications?",
    a: "Yes. Continuous and discontinuous line catalogues, equipment lists and automation overviews are available on request for qualified projects.",
  },
];

/* ─────────────────────────────────────────────────────────────── */
/* Route                                                            */
/* ─────────────────────────────────────────────────────────────── */

export const Route = createFileRoute("/$lang/download-center")({
  component: DownloadCenterPage,
  head: ({ params }) => {
    const seo = buildSeo({
      lang: params.lang,
      title: "Engineering Knowledge & Technical Resources | NEVO",
      description:
        "Curated engineering resource center for sandwich panel manufacturing. Corporate profile, factory development, production line, raw material and installation documents — available upon request.",
      path: "/download-center",
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
              { name: "Knowledge", path: "/knowledge-hub" },
              { name: "Knowledge Center", path: "/download-center" },
            ]),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
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

/* ─────────────────────────────────────────────────────────────── */
/* Page                                                             */
/* ─────────────────────────────────────────────────────────────── */

function DownloadCenterPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [requestOpen, setRequestOpen] = useState(false);
  const [prefill, setPrefill] = useState<string>("");

  const openRequest = (category?: string) => {
    setPrefill(category ?? "");
    setRequestOpen(true);
  };

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORIES.filter((c) => {
      if (filter !== "all" && c.id !== filter && !(filter === "engineering" && c.id === "panels"))
        return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        c.items.some((i) => i.toLowerCase().includes(q))
      );
    });
  }, [query, filter]);

  return (
    <div className="min-h-screen bg-[#0a0d10] text-white">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden pt-40 pb-24 border-b border-white/5">
        <div className="absolute inset-0 -z-10">
          <img
            loading="lazy"
            decoding="async"
            src={heroImg.url}
            alt=""
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0d10] via-[#0a0d10]/80 to-[#0a0d10]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.12),transparent_55%)]" />
        </div>

        <div className="mx-auto max-w-6xl px-6">
          <nav className="text-xs text-white/50 font-mono uppercase tracking-widest">
            <Link to="/" className="hover:text-emerald-300">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white/80">Knowledge Center</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mt-10 max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-emerald-300">
              Curated Engineering Resources
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Engineering Knowledge &amp;{" "}
              <span className="text-emerald-400">Technical Resources</span>
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-2xl leading-relaxed">
              A curated technical library for sandwich panel manufacturing. Corporate profile,
              factory development, production lines, raw materials, panel systems and installation —
              reviewed and shared based on your project.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => openRequest("")}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-medium text-black hover:bg-emerald-400 transition"
              >
                Request Technical Documents <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white hover:bg-white/[0.06] transition"
              >
                Talk to an Engineer
              </Link>
              <button
                onClick={() => openRequest("NEVO Corporate Profile")}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-5 py-3 text-sm font-medium text-emerald-200 hover:bg-emerald-500/10 transition"
              >
                <Download className="h-4 w-4" /> Download Corporate Profile
              </button>
            </div>

            <p className="mt-6 flex items-start gap-2 text-xs text-white/50 max-w-2xl leading-relaxed">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
              Some technical documents are shared after project review to ensure the correct
              specifications are provided for each application.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="border-b border-white/5 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Curated Technical Resources for Sandwich Panel Manufacturing
              </h2>
              <p className="mt-3 text-white/60 max-w-2xl">
                Six featured resources covering the full lifecycle — from corporate profile to
                installation on site.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURED.map((r, i) => (
              <motion.article
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group relative rounded-2xl border border-white/8 bg-white/[0.02] p-6 hover:border-emerald-500/30 hover:bg-white/[0.04] transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <FileText className="h-5 w-5" />
                  </div>
                  <StatusBadge access={r.access} />
                </div>
                <h3 className="mt-5 text-lg font-medium leading-snug">{r.title}</h3>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">{r.desc}</p>

                <button
                  onClick={() => openRequest(r.title)}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-300 hover:text-emerald-200"
                >
                  {r.access === "download" ? "Download" : "Request Access"}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="border-b border-white/5 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Available Resource Categories
          </h2>
          <p className="mt-3 text-white/60 max-w-2xl">
            Six categories organize every technical document we share. Select a category to see what
            is available.
          </p>

          {/* Search + filters */}
          <div className="mt-10 flex flex-col gap-4">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search resources…"
                className="w-full rounded-full border border-white/10 bg-white/[0.03] pl-10 pr-4 py-3 text-sm outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                    filter === f.id
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {filteredCategories.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                  className="group rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-7 hover:border-emerald-500/30 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{c.title}</h3>
                      <p className="mt-1.5 text-sm text-white/60">{c.short}</p>
                    </div>
                  </div>

                  <ul className="mt-6 grid gap-2">
                    {c.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-sm"
                      >
                        <span className="text-white/80">{item}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-emerald-300/80">
                          <Lock className="h-3 w-3" /> On Request
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs text-white/40 font-mono uppercase tracking-widest">
                      {c.items.length} resources
                    </span>
                    <button
                      onClick={() => openRequest(c.title)}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-black hover:bg-emerald-400 transition"
                    >
                      Request Documents <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {filteredCategories.length === 0 && (
              <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/60">
                No categories match this filter. Try a different search.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* REQUEST CTA STRIP */}
      <section id="request" className="border-b border-white/5 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/[0.03] to-transparent p-10 md:p-14">
            <div className="flex flex-col md:flex-row md:items-center gap-8 justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  Request Technical Documents
                </h2>
                <p className="mt-3 text-white/70 leading-relaxed">
                  Our engineering team reviews each request and shares the relevant documents based
                  on your project requirements — usually within 1–3 working days.
                </p>
              </div>
              <button
                onClick={() => openRequest("")}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-black hover:bg-emerald-400 transition"
              >
                <Mail className="h-4 w-4" /> Open Request Form
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 divide-y divide-white/8 border-y border-white/8">
            {FAQ.map((f, i) => (
              <FaqRow key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />

      <AnimatePresence>
        {requestOpen && (
          <RequestDialog onClose={() => setRequestOpen(false)} prefillCategory={prefill} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Small UI                                                          */
/* ─────────────────────────────────────────────────────────────── */

function StatusBadge({ access }: { access: Access }) {
  if (access === "download") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-emerald-300">
        <Download className="h-3 w-3" /> Download
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-white/70">
      <Lock className="h-3 w-3" /> On Request
    </span>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span className="text-base font-medium">{q}</span>
        <ChevronDown className={`h-4 w-4 text-white/50 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-white/65 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Request Dialog                                                    */
/* ─────────────────────────────────────────────────────────────── */

const requestSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  company: z.string().trim().min(2, "Enter your company").max(120),
  country: z.string().trim().min(2, "Enter your country").max(80),
  email: z.string().trim().email("Enter a valid email").max(160),
  phone: z.string().trim().min(4, "Enter a phone number").max(40),
  category: z.string().trim().min(2).max(120),
  projectType: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(1200).optional().or(z.literal("")),
  contact: z.enum(["Email", "Phone", "WhatsApp"]),
});

function RequestDialog({
  onClose,
  prefillCategory,
}: {
  onClose: () => void;
  prefillCategory: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      company: String(fd.get("company") ?? ""),
      country: String(fd.get("country") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      category: String(fd.get("category") ?? ""),
      projectType: String(fd.get("projectType") ?? ""),
      message: String(fd.get("message") ?? ""),
      contact: String(fd.get("contact") ?? "Email") as "Email" | "Phone" | "WhatsApp",
    };
    const parsed = requestSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    const composedMessage = [
      `Document request: ${parsed.data.category}`,
      parsed.data.projectType ? `Project type: ${parsed.data.projectType}` : "",
      `Preferred contact: ${parsed.data.contact}`,
      parsed.data.message ? `\n${parsed.data.message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await submitInquiry({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          company: parsed.data.company,
          country: parsed.data.country,
          application: parsed.data.projectType || null,
          message: composedMessage,
          source_page: "/download-center",
        },
      });
      setSubmitting(false);
    } catch {
      setSubmitting(false);
      setError("Something went wrong. Please try again or email us directly.");
      return;
    }
    setDone(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-6"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full md:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-3xl border border-white/10 bg-[#0e1215] p-6 md:p-8"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-white/60 hover:text-white hover:bg-white/5"
        >
          <X className="h-5 w-5" />
        </button>

        {done ? (
          <div className="py-8 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-2xl font-semibold">Request received</h3>
            <p className="mt-3 text-white/65 max-w-md mx-auto">
              Our engineering team will review your request and share the relevant documents based
              on your project requirements.
            </p>
            <button
              onClick={onClose}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-black hover:bg-emerald-400"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Request Technical Documents</h3>
                <p className="mt-1 text-sm text-white/60">
                  Our engineering team will review your request and share the relevant documents
                  based on your project requirements.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
              <Field label="Name *" name="name" placeholder="Your full name" />
              <Field label="Company *" name="company" placeholder="Company name" />
              <Field label="Country *" name="country" placeholder="Country" />
              <Field label="Email *" name="email" type="email" placeholder="you@company.com" />
              <Field label="Phone / WhatsApp *" name="phone" placeholder="+00 000 000 000" />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/70">Document Category *</label>
                <select
                  name="category"
                  defaultValue={prefillCategory || CATEGORIES[0].title}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm outline-none focus:border-emerald-500/40"
                >
                  {prefillCategory && !CATEGORIES.some((c) => c.title === prefillCategory) && (
                    <option value={prefillCategory}>{prefillCategory}</option>
                  )}
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Project Type"
                name="projectType"
                placeholder="e.g. New factory, panel supply, upgrade"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/70">
                  Preferred Contact Method *
                </label>
                <select
                  name="contact"
                  defaultValue="Email"
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm outline-none focus:border-emerald-500/40"
                >
                  <option>Email</option>
                  <option>Phone</option>
                  <option>WhatsApp</option>
                </select>
              </div>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/70">Message</label>
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Briefly describe your project (capacity, application, timeline)…"
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm outline-none focus:border-emerald-500/40 resize-none"
                />
              </div>

              {error && (
                <p className="md:col-span-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="md:col-span-2 mt-2 flex flex-col-reverse md:flex-row items-stretch md:items-center gap-3 md:justify-between">
                <p className="text-xs text-white/45 max-w-md">
                  We will use these details only to review your document request and follow up.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-black hover:bg-emerald-400 transition disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {submitting ? "Sending…" : "Submit Request"}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-white/70">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm outline-none focus:border-emerald-500/40"
      />
    </div>
  );
}
