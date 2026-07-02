import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Factory,
  Calculator,
  Layers,
  PackageSearch,
  Cog,
  Zap,
  BookOpen,
  BarChart3,
  Flame,
  ShieldCheck,
  MessageCircle,
  FileText,
  Phone,
  Upload,
  ArrowRight,
} from "lucide-react";
import { AIChat } from "@/components/site/AIChat";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import heroEngineer from "@/assets/ai/hero-engineer.jpg";
import ecoFactory from "@/assets/ai/eco-factory-development.jpg";
import ecoConsult from "@/assets/ai/eco-engineering-consultancy.jpg";
import ecoLines from "@/assets/ai/eco-production-lines.jpg";
import ecoMaterials from "@/assets/ai/eco-raw-materials.jpg";
import ecoPanels from "@/assets/ai/eco-finished-panels.jpg";
import ecoInquiry from "@/assets/ai/eco-project-inquiry.jpg";
import ecoKnowledge from "@/assets/ai/eco-knowledge-hub.jpg";
import digitalTwin from "@/assets/ai/digital-twin.jpg";
import drawingsReview from "@/assets/ai/drawings-review.jpg";
import liveConsult from "@/assets/ai/live-consultation.jpg";
import techProposal from "@/assets/ai/technical-proposal.jpg";
import whatsappSupport from "@/assets/ai/whatsapp-support.jpg";
import collab from "@/assets/ai/collab.jpg";

const TITLE = "NEVO AI Engineer — AI Engineering Assistant for the Sandwich Panel Industry";
const DESCRIPTION =
  "NEVO AI Engineer: an intelligent industrial engineering assistant for sandwich panel factories, production lines, raw materials, capacity planning and investment estimation. Built by NEVO Industrial, Dubai.";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AIAssistantPage,
});

const CAPABILITIES = [
  { icon: Factory, title: "Factory Planning", desc: "Layout, land, utilities & workflow sizing." },
  { icon: Calculator, title: "Capacity Calculator", desc: "m/min, m²/year, shift & OEE modelling." },
  { icon: Layers, title: "Panel Recommendation", desc: "PIR vs Rock Wool, thickness, U-value." },
  { icon: PackageSearch, title: "Material Selection", desc: "Steel coils, chemicals, mineral wool." },
  { icon: Cog, title: "Production Line Selection", desc: "Continuous / discontinuous line matching." },
  { icon: Zap, title: "Automation Advisory", desc: "Level of automation vs ROI & OPEX." },
  { icon: BarChart3, title: "Investment Estimation", desc: "CAPEX ranges & sensitivity assumptions." },
  { icon: BookOpen, title: "Knowledge Hub Search", desc: "Instant answers from technical library." },
];

const TOOLS = [
  { icon: BarChart3, title: "Project Cost Estimator" },
  { icon: Calculator, title: "Capacity Calculator" },
  { icon: Layers, title: "Panel Thickness Calculator" },
  { icon: Flame, title: "Thermal Performance Guide" },
  { icon: ShieldCheck, title: "Fire Rating Guide" },
  { icon: PackageSearch, title: "Material Selector" },
  { icon: Cog, title: "Production Line Selector" },
];

const QUICK_ACTIONS = [
  "Start Factory Project",
  "Compare PIR vs Rock Wool",
  "Estimate Investment",
  "Choose Production Line",
  "Download Engineering Guide",
  "Request Material Quote",
];

const VISUAL_SUPPORT = [
  { img: digitalTwin, title: "Digital Twin & 3D Factory Visualization" },
  { img: drawingsReview, title: "Engineering Drawings Review" },
  { img: liveConsult, title: "Live Engineering Consultation" },
  { img: techProposal, title: "Technical Proposal Generation" },
  { img: whatsappSupport, title: "24/7 WhatsApp Engineering Support" },
];

const ECOSYSTEM = [
  { img: ecoFactory, title: "Factory Development", href: "/about" },
  { img: ecoConsult, title: "Engineering Consultancy", href: "/solutions/engineering-consultancy" },
  { img: ecoLines, title: "Production Lines", href: "/solutions/production-lines" },
  { img: ecoMaterials, title: "Raw Materials", href: "/solutions/raw-materials" },
  { img: ecoPanels, title: "Finished Sandwich Panels", href: "/solutions/sandwich-panels" },
  { img: ecoInquiry, title: "Project Inquiry Center", href: "/project-inquiry" },
  { img: ecoKnowledge, title: "Knowledge Hub", href: "/knowledge-hub" },
];

function AIAssistantPage() {
  return (
    <div className="bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0B0F14] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,color-mix(in_oklab,var(--color-accent)_18%,transparent),transparent_60%)]" />
        <div className="container-wide relative grid gap-12 pt-32 pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-40 lg:pb-24">
          <div className="flex flex-col justify-center">
            <Eyebrow className="text-[color:var(--color-accent)]">Meet your AI Engineering Assistant</Eyebrow>
            <h1 className="mt-5 text-balance text-5xl font-semibold tracking-tightest sm:text-6xl lg:text-7xl">
              NEVO <span className="text-[color:var(--color-accent)]">AI Engineer</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70">
              Your intelligent engineering partner for sandwich panel projects. Get expert answers,
              technical guidance, instant calculations and the right solutions for your industrial
              investment — powered by NEVO's engineering knowledge base.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#assistant"
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-accent)] px-6 py-3 text-sm font-medium text-black transition hover:brightness-110"
              >
                Start a conversation <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/project-inquiry"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                Submit a project
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { k: "Engineering", v: "Expertise" },
                { k: "Instant", v: "Answers" },
                { k: "Smart", v: "Calculations" },
                { k: "Project", v: "Support" },
              ].map((s) => (
                <div key={s.k} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">{s.k}</div>
                  <div className="text-sm font-medium text-white">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-[color:var(--color-accent)]/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40">
              <img src={heroEngineer} alt="NEVO AI Engineer — engineer reviewing holographic factory model" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* LIVE ASSISTANT */}
      <section id="assistant" className="bg-[#0B0F14]">
        <div className="container-wide py-16 lg:py-24">
          <div className="mb-10 flex flex-col gap-3">
            <Eyebrow className="text-[color:var(--color-accent)]">Live assistant</Eyebrow>
            <h2 className="text-h2 text-balance text-white">
              Ask a Senior Process Engineer. In real time.
            </h2>
            <p className="max-w-2xl text-white/60">
              NEVO AI Engineer is trained on sandwich panel engineering — not generic chat.
              Ask about capacity, panels, materials, automation or investment. Evidence-based,
              never oversold.
            </p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0B0F14] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.7)]">
            <div className="h-[640px]">
              <AIChat />
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <Section tone="default">
        <SectionHeader
          eyebrow="What NEVO AI Engineer can do"
          title="Ten engineering capabilities, one assistant."
          lede="From factory-scale planning to panel-level specification, NEVO AI Engineer supports the full industrial decision path."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="group rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/50 hover:shadow-sm">
              <c.icon className="h-6 w-6 text-accent" strokeWidth={1.6} />
              <div className="mt-4 text-sm font-semibold text-foreground">{c.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{c.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* TOOLS */}
      <Section tone="surface">
        <SectionHeader
          eyebrow="Powerful engineering tools"
          title="Calculators built for real factories."
          lede="Order-of-magnitude estimates with transparent assumptions — a starting point for engineering, not a substitute for it."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t) => (
            <div key={t.title} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <t.icon className="h-4 w-4" />
              </div>
              <div className="text-sm font-medium text-foreground">{t.title}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* VISUAL SUPPORT */}
      <Section tone="default">
        <SectionHeader
          eyebrow="Visual knowledge & engineering support"
          title="From conversation to engineering deliverable."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {VISUAL_SUPPORT.map((v) => (
            <div key={v.title} className="group overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={v.img} alt={v.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-4 text-sm font-medium text-foreground">{v.title}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* QUICK ACTIONS + HOW IT WORKS */}
      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Eyebrow>Quick actions</Eyebrow>
            <h3 className="mt-4 text-h3 text-foreground">Jump straight into an engineering task.</h3>
            <div className="mt-6 flex flex-col gap-2">
              {QUICK_ACTIONS.map((a) => (
                <a
                  key={a}
                  href="#assistant"
                  className="group flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:border-accent/50"
                >
                  {a}
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-accent" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <Eyebrow>How it works</Eyebrow>
            <h3 className="mt-4 text-h3 text-foreground">Five steps from question to engineering answer.</h3>
            <ol className="mt-6 grid gap-4 sm:grid-cols-5">
              {["Ask", "Analyze", "Calculate", "Recommend", "Connect"].map((step, i) => (
                <li key={step} className="rounded-xl border border-border bg-background p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-accent">Step {i + 1}</div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{step}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[
                      "Ask your engineering question.",
                      "AI analyzes with domain knowledge.",
                      "Smart calculations & evaluation.",
                      "The best engineering solution.",
                      "Route to a NEVO engineer.",
                    ][i]}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* ECOSYSTEM */}
      <Section tone="default">
        <SectionHeader
          eyebrow="Integrated with the NEVO ecosystem"
          title="One assistant, connected to the full industrial platform."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {ECOSYSTEM.map((e) => (
            <Link
              key={e.title}
              to={e.href}
              className="group overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-accent/50"
            >
              <div className="aspect-square overflow-hidden">
                <img src={e.img} alt={e.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-3 text-xs font-medium text-foreground">{e.title}</div>
            </Link>
          ))}
        </div>
      </Section>

      {/* WHEN AI CAN'T ANSWER */}
      <section className="bg-[#0B0F14] text-white">
        <div className="container-wide grid gap-10 py-20 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <img src={collab} alt="NEVO engineering team reviewing a project" className="h-full w-full object-cover" />
          </div>
          <div>
            <Eyebrow className="text-[color:var(--color-accent)]">When AI isn't enough</Eyebrow>
            <h2 className="mt-4 text-h2 text-white">
              Your project. Our expertise. <br />
              <span className="text-white/60">Built together.</span>
            </h2>
            <p className="mt-4 max-w-xl text-white/60">
              For complex projects, NEVO's human engineers take the handoff — with your conversation
              context, drawings and specifications already in hand.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                { icon: MessageCircle, label: "Book Engineering Consultation", href: "/project-inquiry" },
                { icon: Upload, label: "Upload Drawings", href: "/project-inquiry" },
                { icon: Phone, label: "Talk to an Engineer", href: "/project-inquiry" },
                { icon: FileText, label: "Request Technical Proposal", href: "/project-inquiry" },
              ].map((a) => (
                <Link
                  key={a.label}
                  to={a.href}
                  className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white transition hover:border-[color:var(--color-accent)]/50 hover:bg-white/[0.06]"
                >
                  <span className="flex items-center gap-3">
                    <a.icon className="h-4 w-4 text-[color:var(--color-accent)]" />
                    {a.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-[color:var(--color-accent)]" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
