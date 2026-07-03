import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { submitInquiry } from "@/lib/inquiries.functions";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Upload,
  Building2,
  Factory,
  Cog,
  Boxes,
  Layers,
  Wrench,
  Cpu,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  MapPin,
  Calendar,
  Globe2,
  ShieldCheck,
  Handshake,
  Sparkles,
  ClipboardCheck,
  Search,
  Users,
  FileSignature,
  Flag,
  Headphones,
  Loader2,
  X,
} from "lucide-react";

import { toast } from "sonner";

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { SurfaceCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import heroImg from "@/assets/project/hero-factory.jpg";
import tile01 from "@/assets/project/tile-01.jpg"; // CEO meeting
import tile02 from "@/assets/project/tile-02.jpg"; // engineering consultation
import tile03 from "@/assets/project/tile-03.jpg"; // technical workshop
import tile04 from "@/assets/project/tile-04.jpg"; // CAD review
import tile05 from "@/assets/project/tile-05.jpg"; // online meeting
import tile06 from "@/assets/project/tile-06.jpg"; // whatsapp
import tile07 from "@/assets/project/tile-07.jpg"; // blueprint
import tile08 from "@/assets/project/tile-08.jpg"; // masterplan
import tile09 from "@/assets/project/tile-09.jpg"; // CAD model
import tile10 from "@/assets/project/tile-10.jpg"; // 3D factory render
import tile11 from "@/assets/project/tile-11.jpg"; // process flow
import tile12 from "@/assets/project/tile-12.jpg"; // technical proposal
import tile13 from "@/assets/project/tile-13.jpg"; // factory construction
import tile14 from "@/assets/project/tile-14.jpg"; // installation
import tile15 from "@/assets/project/tile-15.jpg"; // commissioning
import tile16 from "@/assets/project/tile-16.jpg"; // completed factory
import tile17 from "@/assets/project/tile-17.jpg"; // drone view
import tile18 from "@/assets/project/tile-18.jpg"; // engineering support
import tile19 from "@/assets/project/tile-19.jpg"; // RFQ documents
import tile20 from "@/assets/project/tile-20.jpg"; // NDA
import tile21 from "@/assets/project/tile-21.jpg"; // technical drawings
import tile22 from "@/assets/project/tile-22.jpg"; // data sheets
import dubaiImg from "@/assets/project/dubai.jpg";
import { SITE, WHATSAPP_URL, buildSeo } from "@/lib/seo";
import { ogImageMeta } from "@/lib/og-images";

const TITLE = "Project Inquiry Center — Start Your Industrial Project | NEVO Industrial";
const DESCRIPTION =
  "Submit your factory, production line, raw material or engineering project to NEVO's Dubai engineering team. Multi-step technical intake, NDA on request, engineering proposal in 5–10 working days.";
const URL_PATH = "/project-inquiry";

// ---------------- Data ----------------

const PROJECT_TYPES = [
  { id: "new-factory", label: "Build a New Factory", desc: "Greenfield sandwich panel factory from concept to commissioning.", icon: Factory, img: tile10 },
  { id: "upgrade", label: "Upgrade an Existing Factory", desc: "Audit, debottleneck and modernize a running plant.", icon: Wrench, img: tile13 },
  { id: "production-line", label: "Production Line", desc: "Continuous PIR / Rock Wool lines, roll forming, cutting, stacking.", icon: Cog, img: tile14 },
  { id: "raw-materials", label: "Raw Materials", desc: "PPGI / GI / Aluzinc coils, PIR chemistry, rock wool, adhesives.", icon: Boxes, img: tile19 },
  { id: "panels", label: "Finished Sandwich Panels", desc: "PIR, Rock Wool, wall, roof and cold-room panels — engineered supply.", icon: Layers, img: tile22 },
  { id: "consultancy", label: "Engineering Consultancy", desc: "Feasibility, master plan, layout, process, utilities, automation.", icon: Building2, img: tile08 },
  { id: "automation", label: "Automation", desc: "PLC/SCADA, MES, quality control and smart factory integration.", icon: Cpu, img: tile11 },
  { id: "support", label: "Technical Support", desc: "Remote diagnostics, spare parts, operator training, optimization.", icon: LifeBuoy, img: tile18 },
];

const INDUSTRIES = [
  "Cold Storage", "Food Processing", "Pharmaceutical / Clean Room", "Logistics & Warehousing",
  "Industrial Buildings", "Commercial Buildings", "Data Centers", "Agricultural",
  "Modular Construction", "Retail", "Sports & Recreation", "Airport & Transport", "Other",
];

const PROJECT_STATUS = ["New Factory", "Existing Factory", "Expansion", "Modernization"];

const PANEL_TYPES = ["Wall Panel", "Roof Panel", "Cold Room Panel", "Facade Panel", "Mixed"];
const CORE_TYPES = ["PIR", "PUR", "Rock Wool", "Mineral Wool", "EPS", "Mixed"];
const STEEL_TYPES = ["PPGI", "GI", "Aluzinc", "Prepainted Aluzinc", "Stainless", "Mixed"];
const AUTOMATION_LEVELS = ["Manual", "Semi-Automatic", "Fully Automatic", "Smart Factory (MES/SCADA)"];
const SHIFTS = ["1 Shift", "2 Shifts", "3 Shifts (24/7)"];

const ENGINEERING_REQS = [
  "Factory Layout", "Utility Engineering", "Material Selection", "Automation",
  "Production Optimization", "Commissioning", "Operator Training", "Long-Term Technical Support",
];

const BUDGET_RANGES = [
  "Under 1M USD", "1–5M USD", "5–10M USD", "10–25M USD", "25–50M USD", "50M+ USD", "To be defined",
];
const TIMELINES = ["ASAP / < 3 months", "3–6 months", "6–12 months", "12–24 months", "24+ months"];
const INVESTMENT_STAGES = ["Studying feasibility", "Business plan approved", "Financing secured", "Under construction", "Operational upgrade"];
const DECISION_STATUS = ["Just researching", "Comparing suppliers", "Shortlisting", "Ready to sign"];

const WHY_NEVO = [
  { title: "Engineering First", desc: "Every proposal is engineered — never templated. Real capacity, real utilities, real cost per m².", icon: Sparkles },
  { title: "Global Supply Chain", desc: "Coils, chemistry, machinery and spare parts sourced from tier-1 mills and OEMs worldwide.", icon: Globe2 },
  { title: "Dubai Headquarters", desc: "Central time zone for EMEA, Africa, CIS and South Asia — fast decisions, one accountable partner.", icon: MapPin },
  { title: "Worldwide Support", desc: "Commissioning, training and remote diagnostics on active projects across four continents.", icon: Headphones },
  { title: "Complete Industrial Solutions", desc: "Factory, line, raw materials, panels, automation and after-sales under one engineering roof.", icon: Factory },
  { title: "Long-Term Partnership", desc: "We stay after handover — optimization, upgrades and expansions for the life of the plant.", icon: Handshake },
];

const WHAT_NEXT = [
  { t: "Project Review", d: "We read your intake, drawings and RFQ in detail — no auto-replies.", icon: ClipboardCheck },
  { t: "Technical Evaluation", d: "Engineers evaluate capacity, layout, utilities and feasibility.", icon: Search },
  { t: "Engineering Meeting", d: "Video call with process, mechanical and automation leads.", icon: Users },
  { t: "Proposal Preparation", d: "Technical proposal, scope of supply, drawings and assumptions.", icon: FileText },
  { t: "Quotation", d: "Commercial offer with payment terms, delivery and warranty.", icon: FileSignature },
  { t: "Project Kick-Off", d: "Contract signature, engineering release, production scheduling.", icon: Flag },
];

const FAQS: { q: string; a: string }[] = [
  { q: "How long does proposal preparation take?", a: "A first engineering proposal takes 5–10 working days after we receive a completed intake. Complex greenfield factories may require 3–4 weeks including a discovery call." },
  { q: "Do I need to fill in every field to submit?", a: "No. Company, contact, project type and a short description are enough to start. The more technical detail you share, the more accurate the first proposal." },
  { q: "Can I upload drawings, RFQs and CAD files?", a: "Yes. PDF, DWG, DXF, STEP, IFC, images and ZIP archives up to 50 MB per file. Larger sets — request a secure upload link." },
  { q: "Do you sign NDAs?", a: "Yes. We can sign your NDA or issue ours before any technical exchange. Request it in the additional information field." },
  { q: "Can NEVO review an existing factory?", a: "Yes. We run technical audits on running plants — OEE, changeover, curing, cutting, packing, utilities — and issue an upgrade roadmap." },
  { q: "Do you provide turnkey projects?", a: "Yes. From feasibility and building to commissioning and operator training, delivered as a single engineered scope." },
  { q: "Can you engineer only the factory building?", a: "Yes. We can engineer the shell, layout and utilities even when the production line is sourced elsewhere." },
  { q: "Which industries do you serve?", a: "Cold storage, food, pharma, clean rooms, logistics, data centers, industrial and commercial buildings, modular construction, agriculture and transport facilities." },
  { q: "Do you supply raw materials only?", a: "Yes. PPGI / GI / Aluzinc coils, PIR polyol & MDI, rock wool slabs, adhesives and sealants — engineered supply with QA documentation." },
  { q: "What is the minimum project size?", a: "There is no hard minimum for consultancy or raw materials. For turnkey factories, projects typically start around 1M m²/year of installed capacity." },
  { q: "Do you work on projects outside the Middle East?", a: "Yes. Active projects and clients in UAE, Saudi Arabia, Oman, Iraq, Turkey, Russia, Kenya, Cameroon and beyond." },
  { q: "How is pricing structured?", a: "Fixed-price engineering packages, CIF/FOB for materials and machinery, milestone-based payments for turnkey factories. All terms defined in the commercial offer." },
  { q: "Can you help with financing?", a: "We support your bank or ECA package with technical documentation, capex breakdown, ROI and payback modeling — we do not provide financing directly." },
  { q: "What warranty do you offer?", a: "12–24 months mechanical warranty on machinery, 10-year performance warranty on sandwich panels, and long-term technical support agreements on request." },
  { q: "Do you provide operator training?", a: "Yes. On-site and remote training programs for line operators, maintenance, quality and production management." },
  { q: "Can you commission an existing line we bought elsewhere?", a: "Yes. We commission or re-commission third-party lines, including automation retrofits and quality upgrades." },
  { q: "Do you handle installation and civil works?", a: "We supervise installation and civil works through vetted local partners, or coordinate with your appointed contractor." },
  { q: "How do I know my data is safe?", a: "Intake data is encrypted in transit, stored on access-controlled systems and shared only with the engineers assigned to your inquiry." },
  { q: "Can I book a call before submitting?", a: "Yes. Choose Talk to an Engineer or Book Engineering Consultation to schedule a call directly with our engineering team." },
  { q: "What happens after project kick-off?", a: "You get a dedicated project manager, weekly engineering reports, milestone reviews and continuous access to the technical team through project handover." },
  { q: "Do you offer long-term technical support after commissioning?", a: "Yes. Annual support agreements cover remote diagnostics, spare parts, preventive maintenance and periodic performance audits." },
];

const DOWNLOADS = [
  { title: "Project Preparation Checklist", desc: "Everything to prepare before the first engineering call.", icon: ClipboardCheck },
  { title: "Engineering Questionnaire", desc: "Full technical intake in PDF form for offline completion.", icon: FileText },
  { title: "Factory Data Sheet", desc: "Site, utilities and capacity data template.", icon: Layers },
  { title: "Technical Requirements Guide", desc: "How NEVO structures a factory engineering scope.", icon: FileSignature },
];

const STEPS = [
  "Company",
  "Project",
  "Production",
  "Engineering",
  "Budget",
  "Documents",
  "Notes",
] as const;

type FormState = {
  // step 1
  company: string; country: string; website: string; industry: string;
  contact: string; email: string; phone: string; whatsapp: string;
  // step 2
  location: string; projectStatus: string;
  // step 3
  capacity: string; panelType: string; coreType: string; thickness: string;
  steelType: string; automation: string; shifts: string;
  // step 4
  engineering: string[];
  // step 5
  budget: string; timeline: string; investmentStage: string; decision: string; startDate: string;
  // step 6
  files: { name: string; size: number }[];
  // step 7
  notes: string;
  // meta
  projectTypes: string[];
};

const EMPTY: FormState = {
  company: "", country: "", website: "", industry: "", contact: "", email: "", phone: "", whatsapp: "",
  location: "", projectStatus: "",
  capacity: "", panelType: "", coreType: "", thickness: "", steelType: "", automation: "", shifts: "",
  engineering: [],
  budget: "", timeline: "", investmentStage: "", decision: "", startDate: "",
  files: [],
  notes: "",
  projectTypes: [],
};

const STORAGE_KEY = "nevo:project-inquiry:v1";

// ---------------- Component ----------------

function ProjectInquiryPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [attachedConfig, setAttachedConfig] = useState<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const submitInquiryFn = useServerFn(submitInquiry);

  // Read ?config=<base64 json> to attach calculator/configurator state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = new URLSearchParams(window.location.search).get("config");
      if (!raw) return;
      const json = JSON.parse(
        decodeURIComponent(escape(atob(raw.replace(/-/g, "+").replace(/_/g, "/")))),
      );
      if (json && typeof json === "object") setAttachedConfig(json as Record<string, unknown>);
    } catch { /* ignore malformed config */ }
  }, []);

  // hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setForm({ ...EMPTY, ...JSON.parse(raw) });
    } catch { /* noop */ }
  }, []);

  // autosave
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
        setSavedAt(new Date());
      } catch { /* noop */ }
    }, 400);
    return () => clearTimeout(t);
  }, [form]);

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleArray = (k: "engineering" | "projectTypes", value: string) =>
    setForm((f) => {
      const arr = f[k];
      return { ...f, [k]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value] };
    });

  const canNext = () => {
    if (step === 0) return form.company.trim() && form.email.trim() && form.contact.trim();
    return true;
  };

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).map((f) => ({ name: f.name, size: f.size }));
    setForm((f) => ({ ...f, files: [...f.files, ...next].slice(0, 12) }));
  };

  const removeFile = (name: string) =>
    setForm((f) => ({ ...f, files: f.files.filter((x) => x.name !== name) }));

  const submit = async () => {
    if (submitting || submitted) return;
    // Validate the required contact details captured in step 1.
    const email = form.email.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    if (!form.company.trim() || !form.contact.trim() || !emailOk) {
      toast.error("Please complete required fields", {
        description: "Company, contact person, and a valid work email are required before submission.",
      });
      setStep(0);
      return;
    }
    setSubmitting(true);
    try {
      // Simulate secure delivery to the NEVO engineering desk.
      // A backend endpoint can replace this without touching UX.
      await new Promise((r) => setTimeout(r, 650));
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
      setSubmitted(true);
      toast.success("Project inquiry submitted", {
        description: "A senior NEVO engineer will contact you within one business day.",
      });
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <SiteHeader />

      {/* HERO */}
      <section className="relative min-h-[80vh] w-full overflow-hidden bg-[#0B0D10] text-white">
        <div className="absolute inset-0">
          <img loading="lazy" decoding="async" src={heroImg} alt="NEVO engineering — 3D factory render" className="h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D10]/70 via-[#0B0D10]/50 to-[#0B0D10]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D10]/80 via-transparent to-transparent" />
        </div>
        <div className="relative mx-auto flex min-h-[80vh] max-w-[1440px] flex-col justify-end px-6 pb-20 pt-40 md:pb-28 md:pt-48">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
            <Eyebrow className="text-emerald-400/90">Project Inquiry Center</Eyebrow>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Let's Start Your <span className="text-emerald-400">Industrial Project.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/75 md:text-xl">
              Tell us about your project and our engineering team will prepare the right technical solution — feasibility, factory, line, panels or full turnkey.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button variant="primary" size="lg" className="bg-emerald-500 text-white hover:bg-emerald-400" onClick={() => document.getElementById("wizard")?.scrollIntoView({ behavior: "smooth" })}>
                Submit Your Project <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="secondary" size="lg" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
                <a href="#contact-options"><MessageCircle className="mr-2 h-4 w-4" /> Talk to an Engineer</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs uppercase tracking-widest text-white/50">
              <span className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> NDA on Request</span>
              <span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Engineering Proposal in 5–10 Days</span>
              <span className="flex items-center gap-2"><Globe2 className="h-3.5 w-3.5 text-emerald-400" /> Projects on 4 Continents</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROJECT TYPES */}
      <Section className="bg-background">
        <SectionHeader
          eyebrow="Choose Your Project Type"
          title="What are you building?"
          lede="Select one or more scopes. This routes your inquiry to the right engineering lead from the start."
        />
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROJECT_TYPES.map((t) => {
            const active = form.projectTypes.includes(t.id);
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleArray("projectTypes", t.id)}
                className={`group relative overflow-hidden rounded-2xl border text-left transition-all ${active ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-border hover:border-foreground/30"}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img loading="lazy" decoding="async" src={t.img} alt={t.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/40 to-transparent" />
                  <div className="absolute left-4 top-4 rounded-md bg-black/40 p-2 backdrop-blur">
                    <Icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  {active && (
                    <div className="absolute right-4 top-4 rounded-full bg-emerald-500 p-1.5">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="bg-card p-5">
                  <div className="text-base font-semibold text-foreground">{t.label}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* WIZARD */}
      <section id="wizard" className="relative bg-[#0B0D10] py-24 text-white md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow className="text-emerald-400">Engineering Intake</Eyebrow>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">Project Intake Wizard</h2>
              <p className="mt-3 max-w-xl text-white/70">Seven short steps. Autosaved as you go. Skip fields you don't have — our engineers will follow up.</p>
            </div>
            <div className="text-xs uppercase tracking-widest text-white/50">
              Step {step + 1} / {STEPS.length} · {STEPS[step]}
              {savedAt && <span className="ml-3 text-emerald-400">● Saved</span>}
            </div>
          </div>

          {/* progress */}
          <div className="mb-10">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full bg-emerald-500" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>
            <div className="mt-4 hidden grid-cols-7 gap-2 text-[11px] uppercase tracking-widest text-white/50 md:grid">
              {STEPS.map((s, i) => (
                <button key={s} onClick={() => setStep(i)} className={`text-left transition-colors ${i <= step ? "text-emerald-400" : "hover:text-white/80"}`}>
                  0{i + 1} · {s}
                </button>
              ))}
            </div>
          </div>

          {submitted ? (
            <SubmittedCard />
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur md:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  {step === 0 && (
                    <StepGrid>
                      <TextField label="Company Name *" value={form.company} onChange={(v) => update("company", v)} placeholder="Acme Industrial LLC" />
                      <TextField label="Country" value={form.country} onChange={(v) => update("country", v)} placeholder="United Arab Emirates" />
                      <TextField label="Website" value={form.website} onChange={(v) => update("website", v)} placeholder="https://" />
                      <SelectField label="Industry" value={form.industry} onChange={(v) => update("industry", v)} options={INDUSTRIES} />
                      <TextField label="Contact Person *" value={form.contact} onChange={(v) => update("contact", v)} placeholder="Full name" />
                      <TextField label="Email *" type="email" value={form.email} onChange={(v) => update("email", v)} placeholder="you@company.com" />
                      <TextField label="Phone" value={form.phone} onChange={(v) => update("phone", v)} placeholder="+971 …" />
                      <TextField label="WhatsApp" value={form.whatsapp} onChange={(v) => update("whatsapp", v)} placeholder="+971 …" />
                    </StepGrid>
                  )}

                  {step === 1 && (
                    <StepGrid>
                      <TextField label="Project Location" value={form.location} onChange={(v) => update("location", v)} placeholder="City, Country" />
                      <SelectField label="Project Status" value={form.projectStatus} onChange={(v) => update("projectStatus", v)} options={PROJECT_STATUS} />
                      <div className="md:col-span-2">
                        <div className="text-xs uppercase tracking-widest text-white/60">Confirmed project types</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {PROJECT_TYPES.map((t) => {
                            const active = form.projectTypes.includes(t.id);
                            return (
                              <button key={t.id} type="button" onClick={() => toggleArray("projectTypes", t.id)}
                                className={`rounded-full border px-4 py-2 text-sm transition ${active ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-white/15 text-white/80 hover:border-white/40"}`}>
                                {t.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </StepGrid>
                  )}

                  {step === 2 && (
                    <StepGrid>
                      <TextField label="Target Capacity" value={form.capacity} onChange={(v) => update("capacity", v)} placeholder="e.g. 2,000,000 m²/year" />
                      <SelectField label="Panel Type" value={form.panelType} onChange={(v) => update("panelType", v)} options={PANEL_TYPES} />
                      <SelectField label="Core Type" value={form.coreType} onChange={(v) => update("coreType", v)} options={CORE_TYPES} />
                      <TextField label="Panel Thickness" value={form.thickness} onChange={(v) => update("thickness", v)} placeholder="e.g. 40–150 mm" />
                      <SelectField label="Steel Type" value={form.steelType} onChange={(v) => update("steelType", v)} options={STEEL_TYPES} />
                      <SelectField label="Automation Level" value={form.automation} onChange={(v) => update("automation", v)} options={AUTOMATION_LEVELS} />
                      <SelectField label="Shift Pattern" value={form.shifts} onChange={(v) => update("shifts", v)} options={SHIFTS} />
                    </StepGrid>
                  )}

                  {step === 3 && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-white/60">Select all engineering scopes you need</div>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {ENGINEERING_REQS.map((r) => {
                          const active = form.engineering.includes(r);
                          return (
                            <button key={r} type="button" onClick={() => toggleArray("engineering", r)}
                              className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm transition ${active ? "border-emerald-500 bg-emerald-500/10 text-white" : "border-white/10 bg-white/[0.02] text-white/80 hover:border-white/30"}`}>
                              <span>{r}</span>
                              {active ? <Check className="h-4 w-4 text-emerald-400" /> : <span className="h-4 w-4 rounded-sm border border-white/30" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <StepGrid>
                      <SelectField label="Budget Range" value={form.budget} onChange={(v) => update("budget", v)} options={BUDGET_RANGES} />
                      <SelectField label="Timeline" value={form.timeline} onChange={(v) => update("timeline", v)} options={TIMELINES} />
                      <SelectField label="Investment Stage" value={form.investmentStage} onChange={(v) => update("investmentStage", v)} options={INVESTMENT_STAGES} />
                      <SelectField label="Decision Status" value={form.decision} onChange={(v) => update("decision", v)} options={DECISION_STATUS} />
                      <TextField label="Expected Start Date" type="date" value={form.startDate} onChange={(v) => update("startDate", v)} />
                    </StepGrid>
                  )}

                  {step === 5 && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-white/60">Upload factory layouts, drawings, specifications, RFQ or technical files</div>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
                        className={`mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition ${dragOver ? "border-emerald-500 bg-emerald-500/5" : "border-white/15 bg-white/[0.02] hover:border-white/30"}`}
                      >
                        <Upload className="h-8 w-8 text-emerald-400" />
                        <div className="mt-4 text-lg font-medium">Drag and drop files here</div>
                        <div className="mt-1 text-sm text-white/60">PDF · CAD (DWG/DXF/STEP/IFC) · Images · ZIP — up to 50 MB per file</div>
                        <div className="mt-6">
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm hover:bg-white/10">
                            Or browse files
                          </button>
                          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
                        </div>
                      </div>
                      {form.files.length > 0 && (
                        <ul className="mt-6 divide-y divide-white/10 rounded-xl border border-white/10">
                          {form.files.map((f) => (
                            <li key={f.name} className="flex items-center justify-between px-4 py-3 text-sm">
                              <span className="flex items-center gap-3 text-white/85"><FileText className="h-4 w-4 text-emerald-400" /> {f.name}</span>
                              <span className="flex items-center gap-4 text-white/50">
                                <span>{(f.size / 1024).toFixed(0)} KB</span>
                                <button onClick={() => removeFile(f.name)} className="hover:text-white"><X className="h-4 w-4" /></button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {step === 6 && (
                    <div>
                      <label className="text-xs uppercase tracking-widest text-white/60">Additional Information</label>
                      <textarea
                        value={form.notes}
                        onChange={(e) => update("notes", e.target.value)}
                        rows={10}
                        placeholder="Anything else our engineers should know — site conditions, phasing, existing suppliers, constraints, target markets, standards, etc."
                        className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] p-5 text-base text-white placeholder:text-white/30 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* nav */}
              <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                {step < STEPS.length - 1 ? (
                  <button
                    onClick={() => canNext() && setStep((s) => s + 1)}
                    disabled={!canNext()}
                    className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:opacity-40"
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                    ) : (
                      <>Submit Project <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* WHY NEVO */}
      <Section className="bg-background">
        <SectionHeader eyebrow="Why NEVO" title="A serious partner for a serious project." lede="Six reasons investors, contractors and OEMs choose NEVO from the first inquiry." />
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {WHY_NEVO.map((w) => {
            const Icon = w.icon;
            return (
              <SurfaceCard key={w.title} className="p-8">
                <Icon className="h-6 w-6 text-emerald-600" />
                <h3 className="mt-6 text-lg font-semibold">{w.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{w.desc}</p>
              </SurfaceCard>
            );
          })}
        </div>
      </Section>

      {/* WHAT HAPPENS NEXT */}
      <section className="bg-[#0B0D10] py-24 text-white md:py-32">
        <div className="mx-auto max-w-[1440px] px-6">
          <SectionHeader
            eyebrow="What Happens Next"
            title="A structured path from inquiry to kick-off."
            lede="No black box. Every step is scheduled, documented and owned by an engineer."

          />
          <div className="relative mt-16">
            <div className="absolute left-6 top-0 h-full w-px bg-emerald-500/30 md:left-1/2 md:-translate-x-1/2" />
            <ol className="space-y-10">
              {WHAT_NEXT.map((s, i) => {
                const Icon = s.icon;
                const left = i % 2 === 0;
                return (
                  <li key={s.t} className="relative grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-16">
                    <div className={`${left ? "md:pr-16 md:text-right" : "md:order-2 md:pl-16"}`}>
                      <div className="pl-16 md:pl-0">
                        <div className="text-xs uppercase tracking-widest text-emerald-400">Step 0{i + 1}</div>
                        <h3 className="mt-2 text-2xl font-semibold">{s.t}</h3>
                        <p className="mt-2 max-w-md text-white/70 md:ml-auto">{s.d}</p>
                      </div>
                    </div>
                    <div className={`${left ? "" : "md:order-1"}`} />
                    <div className="absolute left-6 top-1 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-emerald-500 bg-[#0B0D10] md:left-1/2">
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* CONTACT OPTIONS */}
      <Section id="contact-options" className="bg-background">
        <SectionHeader eyebrow="Contact Options" title="Prefer to talk first?" lede="Reach the engineering team directly on any channel." />
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ContactCard icon={Mail} label="Engineering Email" value="engineering@nevoindustrial.com" href="mailto:engineering@nevoindustrial.com" />
            <ContactCard icon={MessageCircle} label="WhatsApp" value={SITE.contact.whatsappDisplay} href={WHATSAPP_URL} />
            <ContactCard icon={Phone} label="Phone" value={SITE.contact.phone} href={SITE.contact.phoneHref} />
            <ContactCard icon={MapPin} label="Dubai Head Office" value="Business Bay, Dubai, UAE" />
            <ContactCard icon={Calendar} label="Schedule Online Meeting" value="Book a 30-min engineering call" href="#wizard" className="sm:col-span-2" />
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-border lg:col-span-2">
            <img loading="lazy" decoding="async" src={dubaiImg} alt="NEVO Industrial — Dubai headquarters" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <div className="text-xs uppercase tracking-widest text-emerald-400">Global Presence</div>
              <div className="mt-2 text-lg font-semibold">Dubai · Saudi Arabia · Oman · Iraq · Turkey · Russia · Kenya · Cameroon</div>
            </div>
          </div>
        </div>
      </Section>

      {/* DOWNLOADS */}
      <Section className="bg-muted/40">
        <SectionHeader eyebrow="Downloads" title="Prepare offline." lede="Four documents to structure your project before the first call." />
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {DOWNLOADS.map((d) => {
            const Icon = d.icon;
            return (
              <SurfaceCard key={d.title} className="flex flex-col p-6">
                <Icon className="h-6 w-6 text-emerald-600" />
                <h3 className="mt-6 text-base font-semibold">{d.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{d.desc}</p>
                <button className="mt-6 flex items-center gap-2 text-sm font-medium text-foreground hover:text-emerald-600">
                  Download PDF <Download className="h-4 w-4" />
                </button>
              </SurfaceCard>
            );
          })}
        </div>
      </Section>

      {/* FAQ */}
      <Section className="bg-background">
        <SectionHeader eyebrow="FAQ" title="Answers before you ask." lede="Twenty-one of the most common questions from investors, contractors and engineers." />
        <div className="mx-auto mt-12 max-w-4xl">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border">
                <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-[#0B0D10] py-28 text-white md:py-36">
        <div className="absolute inset-0 opacity-40">
          <img loading="lazy" decoding="async" src={tile17} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/70 to-[#0B0D10]/40" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <Eyebrow className="text-emerald-400">Ready to start?</Eyebrow>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Let's Engineer Your <span className="text-emerald-400">Future Factory.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
            Our engineering team is ready to review your project and provide the right industrial solution.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="primary" size="lg" className="bg-emerald-500 text-white hover:bg-emerald-400" onClick={() => document.getElementById("wizard")?.scrollIntoView({ behavior: "smooth" })}>
              Submit Project <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="secondary" size="lg" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
              <a href="#contact-options">Book Engineering Consultation <ArrowUpRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

// ---------------- helpers ----------------

function StepGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{children}</div>;
}

function TextField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-widest text-white/60">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-base text-white placeholder:text-white/30 focus:border-emerald-500 focus:outline-none"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-widest text-white/60">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-base text-white focus:border-emerald-500 focus:outline-none"
      >
        <option value="" className="bg-[#0B0D10]">Select…</option>
        {options.map((o) => <option key={o} value={o} className="bg-[#0B0D10]">{o}</option>)}
      </select>
    </label>
  );
}

function ContactCard({ icon: Icon, label, value, href, className = "" }: {
  icon: typeof Mail; label: string; value: string; href?: string; className?: string;
}) {
  const inner = (
    <SurfaceCard className={`group flex items-start gap-4 p-6 transition hover:border-foreground/30 ${className}`}>
      <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-600"><Icon className="h-5 w-5" /></div>
      <div className="flex-1">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="mt-1 text-base font-medium text-foreground">{value}</div>
      </div>
      {href && <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />}
    </SurfaceCard>
  );
  return href ? <a href={href} className="block">{inner}</a> : inner;
}

function SubmittedCard() {
  return (
    <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/[0.06] p-10 text-center md:p-16">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-6 w-6" />
      </div>
      <h3 className="mt-6 text-3xl font-semibold">Project received.</h3>
      <p className="mx-auto mt-3 max-w-xl text-white/70">
        Our engineering team will review your intake and reply within 1–2 working days. You'll receive a technical proposal in 5–10 working days.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <a href="mailto:engineering@nevoindustrial.com" className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm hover:bg-white/10">
          <Mail className="mr-2 inline h-4 w-4" /> Email an engineer
        </a>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-400">
          <MessageCircle className="mr-2 inline h-4 w-4" /> WhatsApp us
        </a>
      </div>
    </div>
  );
}

// ---------------- Route ----------------

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "/" },
    { "@type": "ListItem", position: 2, name: "Project Inquiry", item: URL_PATH },
  ],
};

export const Route = createFileRoute("/$lang/project-inquiry")({
  component: ProjectInquiryPage,
  head: ({ params }) => {
    const seo = buildSeo({ title: TITLE, description: DESCRIPTION, path: URL_PATH, lang: params.lang });
    return {
      ...seo,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(FAQ_JSONLD) },
        { type: "application/ld+json", children: JSON.stringify(BREADCRUMB_JSONLD) },
      ],
    };
  },
});
