import { createFileRoute } from "@tanstack/react-router";
import { SITE, buildSeo } from "@/lib/seo";
import { motion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Download,
  FileText,
  Layers,
  Cpu,
  Gauge,
  Users,
  Wrench,
  Cog,
  Building2,
  ClipboardCheck,
  LineChart,
  Zap,
  Boxes,
  Ruler,
  Map,
  ShieldCheck,
  GraduationCap,
  Factory,
  Sparkles,
} from "lucide-react";

import img01 from "@/assets/engineering/01-hero.jpg";
import img02 from "@/assets/engineering/02-factory.jpg";
import img03 from "@/assets/engineering/03-team.jpg";
import img04 from "@/assets/engineering/04-3d.jpg";
import img05 from "@/assets/engineering/05-layout.jpg";
import img06 from "@/assets/engineering/06-flow.jpg";
import img07 from "@/assets/engineering/07-process.jpg";
import img08 from "@/assets/engineering/08-equip.jpg";
import img09 from "@/assets/engineering/09-utility.jpg";
import img10 from "@/assets/engineering/10-electrical.jpg";
import img11 from "@/assets/engineering/11-construction.jpg";
import img12 from "@/assets/engineering/12-installation.jpg";
import img13 from "@/assets/engineering/13-commissioning.jpg";
import img14 from "@/assets/engineering/14-training.jpg";
import img15 from "@/assets/engineering/15-optimization.jpg";
import img16 from "@/assets/engineering/16-qc.jpg";
import img17 from "@/assets/engineering/17-finished.jpg";
import img18 from "@/assets/engineering/18-raw.jpg";
import img19 from "@/assets/engineering/19-pid.jpg";
import img20 from "@/assets/engineering/20-general.jpg";
import img21 from "@/assets/engineering/21-structural.jpg";
import img22 from "@/assets/engineering/22-capacity.jpg";
import img23 from "@/assets/engineering/23-roi.jpg";
import img24 from "@/assets/engineering/24-timeline.jpg";
import img25 from "@/assets/engineering/25-materials.jpg";

import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { InquiryCTA } from "@/components/site/InquiryCTA";
import { KnowledgeHubPreview } from "@/components/site/KnowledgeHubPreview";
import { DownloadsCTA } from "@/components/site/DownloadsCTA";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { GridBoard, BoardCell, SurfaceCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";
import { ogImageMeta } from "@/lib/og-images";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TITLE =
  "Engineering Consultancy — Sandwich Panel Factory Engineering | NEVO Industrial";
const DESCRIPTION =
  "Engineering beyond equipment. Feasibility, master planning, factory layout, process and utility engineering, automation, commissioning and long-term technical support for sandwich panel factories worldwide.";
const URL_PATH = "/solutions/engineering-consultancy";

const FAQS: { q: string; a: string }[] = [
  { q: "What does NEVO's Engineering Consultancy actually cover?", a: "Everything upstream and around the machinery: feasibility, master planning, factory layout, process engineering, utility engineering, automation architecture, supplier selection, construction supervision, commissioning, operator training and long-term performance optimization." },
  { q: "Do I need to buy a production line from NEVO to hire your engineers?", a: "No. Our engineering practice is independent. We frequently engineer factories that source equipment from third parties, and we audit or upgrade existing lines we did not originally supply." },
  { q: "How is engineering different from just buying a production line?", a: "A line is a machine. A factory is a system — building, utilities, logistics, storage, people, chemistry, controls, safety. Engineering makes those pieces converge on a stated capacity, quality and cost per m²." },
  { q: "How long does a typical engineering study take?", a: "A feasibility study runs 3–5 weeks. Concept engineering 6–10 weeks. Detailed engineering for a full factory 3–5 months. Timelines depend on site data availability and decision speed on the investor side." },
  { q: "What information do I need before you can start?", a: "Target capacity (m²/year), panel spectrum, land or building option, utilities available (power, gas, water), local labour rate and target market. If any are missing we help you define them in the discovery phase." },
  { q: "Can you engineer a factory on a greenfield site?", a: "Yes. We handle site selection support, master plan, general arrangement, structural loads, utility sizing, road and truck flow, expansion reserves and phasing from bare land through operation." },
  { q: "Can you engineer an expansion of my existing factory?", a: "Yes. We audit the current line, identify bottlenecks (OEE, changeover, curing, cutting, packing) and engineer targeted upgrades or a parallel line with shared utilities." },
  { q: "What panel technologies do you engineer for?", a: "Continuous and discontinuous PIR, PUR, mineral rock wool, EPS and hybrid cores; wall, roof, cold-storage and clean-room panels; metal facings in PPGI, GI, Aluzinc, prepainted aluminium and stainless." },
  { q: "How do you determine the right capacity?", a: "From your market study, target payback, land envelope and utility ceiling — not from a catalogue. Capacity is engineered downward from demand and upward from feasible line speed, not guessed." },
  { q: "What deliverables do I receive from the engineering phase?", a: "Feasibility report, master plan, general arrangement, P&ID, material flow diagram, process flow diagram, utility load schedule, electrical single-line, structural loads, equipment selection report, ROI model and project timeline." },
  { q: "Do you provide 3D factory models?", a: "Yes. We build 3D layouts and clash-checked models so investors, contractors and operators can walk the plant before a single beam is erected." },
  { q: "Which automation platforms do you engineer around?", a: "Siemens (S7-1500, TIA Portal, WinCC), Rockwell (ControlLogix, FactoryTalk) and Beckhoff TwinCAT. SCADA over OPC UA, historian and MES integration for Industry 4.0 factories." },
  { q: "Can you integrate remote monitoring?", a: "Yes. Every NEVO-engineered line ships with an edge gateway, secure VPN and dashboards for OEE, uptime, alarm history and quality KPIs, accessible from any authorised device." },
  { q: "Do you handle utility engineering?", a: "Yes. Electrical HV/LV, compressed air, chilled water, hot oil / thermal fluid, steam, natural gas, nitrogen, dust and fume extraction — sized, routed and specified in coordination with the process." },
  { q: "Do you handle civil and structural engineering?", a: "We engineer the industrial building envelope: foundation loads for the laminator and press, crane rails, mezzanine loads, floor flatness, roof and cladding spec. Local licensed civil partners execute stamped drawings for permits." },
  { q: "Do you provide fire, safety and environmental design?", a: "Yes. Fire compartmentation, sprinkler zoning, foam suppression around chemical stores, MDI vapour containment, VOC extraction and process safety reviews are part of the standard engineering package." },
  { q: "What kind of ROI can I expect from a NEVO-engineered factory?", a: "Depending on market, capacity and product mix, payback typically lands in 3–5 years for continuous PIR/PUR lines with balanced utilisation. We model this transparently before contract, not after." },
  { q: "How do you select suppliers for equipment?", a: "By engineering fit, not by rebate. We shortlist against a written technical specification, request comparable bids, evaluate on lifecycle cost and reference visits, and recommend with a documented decision matrix." },
  { q: "Do you supervise construction and installation?", a: "Yes. Site engineers manage civil–mechanical–electrical interfaces, inspect deliveries, sign off milestones and enforce the design intent from foundation pour to first panel." },
  { q: "What is included in commissioning?", a: "Cold commissioning of utilities, hot commissioning of the line, chemistry setup and reactivity tuning, PLC/SCADA validation, quality qualification runs and performance acceptance against contractual OEE targets." },
  { q: "Do you train our team?", a: "Yes. Operators, line leaders, quality inspectors, maintenance and management each receive dedicated modules — classroom, on-line and structured shadowing — with skill matrices signed off before handover." },
  { q: "What ongoing support do you provide after handover?", a: "Remote monitoring, quarterly performance reviews, spare-parts planning, chemistry re-optimisation, upgrade roadmaps and on-call troubleshooting under an annual technical partnership agreement." },
  { q: "Can you audit a factory built by someone else?", a: "Yes. Independent technical audits cover OEE, quality yield, energy per m², safety, chemistry, maintenance and organisation, with a prioritised action plan and quantified savings." },
  { q: "How do you protect our project's confidentiality?", a: "All engagements begin under mutual NDA. Data is stored in access-controlled workspaces. Deliverables carry document control and are shared only with named recipients." },
  { q: "What markets have you engineered factories in?", a: "GCC, wider MENA, East Africa, Central Asia, the CIS and selected European and South-East Asian markets. Local codes, climate loads and grid conditions are integrated per project." },
  { q: "How is your engineering priced?", a: "Fixed-fee for feasibility and concept; milestone-based for detailed engineering; day-rate or retainer for supervision, commissioning and long-term optimisation. All scopes are contracted before mobilisation." },
  { q: "Do you work with investors who have no factory experience?", a: "A large share of our clients are first-time industrial investors. We translate market ambition into an engineered, financeable, buildable factory — and stay through operation." },
  { q: "Can you help arrange financing or bank documentation?", a: "We prepare the technical and ROI documentation banks and export-credit agencies require. Financing itself is arranged by the investor with their preferred institutions." },
  { q: "Do you engineer for cold-storage and clean-room applications?", a: "Yes. Both are core competencies: high-density PIR/PUR/rock-wool cold-storage panels and ISO-classified clean-room envelopes with matching factory quality controls." },
  { q: "How do I start an engineering engagement?", a: "Send us the brief — capacity target, market, site status, timeline. We respond with a scoped engineering proposal and a schedule for the first workshop, usually within one week." },
  { q: "What makes NEVO different from a machinery vendor's 'free' layout?", a: "Vendor layouts sell equipment. Our engineering serves the investor: independent, documented, benchmarked and accountable for the factory's operating performance — not for a purchase order." },
];

/* ------------------------------------------------------------------ */
/*  ROUTE                                                              */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/$lang/solutions/engineering-consultancy")({
  head: ({ params }) => {
    const canonical = `${SITE.url}/${params.lang}${URL_PATH}`;
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const crumbsLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/${params.lang}` },
        { "@type": "ListItem", position: 2, name: "Solutions", item: `${SITE.url}/${params.lang}/solutions` },
        { "@type": "ListItem", position: 3, name: "Engineering Consultancy", item: canonical },
      ],
    };
    const serviceLd = {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Sandwich Panel Engineering Consultancy",
      serviceType: "Industrial engineering consultancy",
      provider: { "@type": "Organization", name: SITE.name, url: SITE.url },
      areaServed: ["AE", "SA", "OM", "QA", "KW", "TR", "IQ", "KE", "CM", "RU", "EU"],
      url: canonical,
      description: DESCRIPTION,
      category: ["Feasibility study", "Factory layout", "Process engineering", "Automation architecture", "Commissioning support"],
    };
    const seo = buildSeo({
      title: TITLE,
      description: DESCRIPTION,
      path: URL_PATH,
      lang: params.lang,
      keywords: [
        "sandwich panel engineering consultancy",
        "sandwich panel factory feasibility study",
        "plant layout design",
        "process engineering sandwich panels",
        "factory commissioning support",
        "industrial engineering Dubai",
        "PIR panel plant engineering",
      ],
    });
    return {
      ...seo,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(faqLd) },
        { type: "application/ld+json", children: JSON.stringify(serviceLd) },
        { type: "application/ld+json", children: JSON.stringify(crumbsLd) },
      ],
    };
  },
  component: EngineeringConsultancyPage,
});

/* ------------------------------------------------------------------ */

function EngineeringConsultancyPage() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main">
        <Hero />
        <Philosophy />
        <EngineeringTeam />
        <Deliverables />
        <Automation />
        <Execution />
        <ContinuousImprovement />
        <IntegratedSolutions />
        <Documentation />
        <EngineeringMaterials />
        <Services />
        <Process />
        <DownloadsCTA />
        <FAQ />
        <KnowledgeHubPreview route="engineering-consultancy" />
        <InquiryCTA
          source="consultancy"
          eyebrow="Engineering inquiry"
          title="Brief the NEVO engineering desk."
          lede="Share your factory brief, feasibility question or engineering scope. The consultancy team responds with a scoped engineering package — feasibility, concept, detailed design or FAT/SAT support — within one business day."
          ctaLabel="Start Engineering Inquiry"
        />
        <FinalCTA />
      </main>
      <SiteFooter />
    </>
  );
}

/* ---------- HERO ---------- */

function Hero() {
  return (
    <section className="relative isolate -mt-20 overflow-hidden bg-black text-white md:-mt-24">
      <div className="absolute inset-0 -z-10">
        <img
          src={img01}
          alt="NEVO continuous sandwich panel production line"
          className="h-full w-full object-cover"
          style={{ objectPosition: "center", transform: "scale(1.05)" }}
          fetchPriority="high"
        />
        <div aria-hidden className="absolute inset-0 bg-black/55" />
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-[70%]"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.72) 55%, rgba(0,0,0,0.2) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent"
        />
      </div>

      <div className="container-wide relative flex min-h-[80vh] flex-col justify-between px-6 pt-36 pb-14 lg:min-h-[92vh] lg:px-8 lg:pt-44">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
          className="max-w-3xl"
        >
          <div className="eyebrow mb-6 flex items-center gap-2 text-white/70">
            <span className="inline-flex size-1.5 rounded-full bg-accent" />
            Engineering Consultancy
          </div>
          <h1 className="text-display text-balance text-white">
            Engineering{" "}
            <span className="italic text-accent">Beyond</span> Equipment.
          </h1>
          <p className="text-body-lg mt-6 max-w-2xl text-white/75">
            Complete engineering solutions for sandwich panel factories — from
            concept and feasibility studies to commissioning, optimisation and
            long-term technical support.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild variant="primary" size="lg" className="bg-white text-primary hover:bg-white/90">
              <a href="/project-inquiry">
                Book Engineering Consultation
                <ArrowRight className="!size-4" />
              </a>
            </Button>
            <Button asChild variant="secondary" size="lg" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              <a href="#downloads">
                Request Technical Proposal
                <ArrowUpRight className="!size-4" />
              </a>
            </Button>
          </div>
        </motion.div>

        <div className="mt-16 grid grid-cols-2 gap-6 border-t border-white/15 pt-8 text-white/80 md:mt-0 md:grid-cols-4">
          {[
            ["25+ yrs", "Engineering practice"],
            ["120+", "Factory projects"],
            ["30+", "Countries served"],
            ["24/7", "Remote engineering"],
          ].map(([k, v]) => (
            <div key={v}>
              <div className="font-mono text-xs tracking-widest text-accent">{k}</div>
              <div className="mt-1 text-sm">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- PHILOSOPHY ---------- */

function Philosophy() {
  return (
    <Section tone="default">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <figure className="relative lg:col-span-7">
          <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
            <img
              src={img02}
              alt="Factory engineering overview — 3D rendered production plant"
              className="aspect-[4/3] h-full w-full object-cover"
              loading="lazy"
            />
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/25 to-transparent p-5 text-white">
              <div className="font-mono text-[10px] tracking-widest text-white/70">
                FIG. 01 · FACTORY ENGINEERING OVERVIEW
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-white/90">
                <span className="inline-flex size-1.5 rounded-full bg-accent" />
                Engineering-led design
              </div>
            </figcaption>
          </div>
        </figure>

        <div className="flex flex-col justify-center lg:col-span-5">
          <Eyebrow>Engineering philosophy</Eyebrow>
          <h2 className="text-h1 mt-6 text-balance text-foreground">
            Engineering begins long before the first machine arrives.
          </h2>
          <p className="text-body-lg mt-6">
            A sandwich panel factory is a system of decisions — market, site,
            capacity, chemistry, utilities, people. Engineering is the
            discipline of resolving those decisions on paper, so the plant
            performs on the floor.
          </p>
          <p className="text-body mt-4">
            Factory performance begins with planning. Every kilowatt, every
            square metre, every second of cycle time is engineered before it is
            built — because a factory can only run as well as it was designed.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Independent of any machinery vendor",
              "Documented deliverables, benchmarked decisions",
              "Accountable to operating performance, not purchase orders",
            ].map((t) => (
              <li key={t} className="flex gap-3 text-sm text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ---------- TEAM ---------- */

function EngineeringTeam() {
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Engineering team"
        title="Senior engineers, working the way great factories are built."
        lede="Multi-disciplinary teams — process, mechanical, electrical, civil, chemistry, controls — collaborating around the same 3D model, the same P&ID, the same schedule."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <figure className="group relative overflow-hidden rounded-xl border border-border bg-background">
          <img src={img03} alt="NEVO engineering team reviewing factory plans" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
          <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/85 via-black/30 to-transparent p-6 text-white">
            <div>
              <div className="font-mono text-[10px] tracking-widest text-accent">FIG. 02</div>
              <div className="mt-1 text-lg font-medium">Engineering studio</div>
              <p className="mt-1 text-sm text-white/70">Cross-discipline review — process, mechanical, controls, chemistry — around one factory model.</p>
            </div>
          </figcaption>
        </figure>

        <figure className="group relative overflow-hidden rounded-xl border border-border bg-background">
          <img src={img04} alt="NEVO engineer working on a 3D factory model" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
          <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/85 via-black/30 to-transparent p-6 text-white">
            <div>
              <div className="font-mono text-[10px] tracking-widest text-accent">FIG. 03</div>
              <div className="mt-1 text-lg font-medium">3D factory modelling</div>
              <p className="mt-1 text-sm text-white/70">Every plant is walked through in 3D before it is built — clash-checked, load-verified, operator-reviewed.</p>
            </div>
          </figcaption>
        </figure>
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
        {[
          { icon: Users, k: "Multi-disciplinary", d: "Process, mechanical, electrical, civil, chemistry, controls." },
          { icon: Ruler, k: "Model-first", d: "3D layout and P&ID before any drawing is issued for construction." },
          { icon: ClipboardCheck, k: "Peer-reviewed", d: "Every deliverable signed off by a senior discipline lead." },
          { icon: ShieldCheck, k: "Accountable", d: "KPIs contracted at the start, measured at commissioning." },
        ].map(({ icon: Icon, k, d }) => (
          <div key={k} className="bg-background p-6">
            <Icon className="size-5 text-accent" />
            <div className="text-h3 mt-4 text-foreground">{k}</div>
            <p className="text-body mt-2">{d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- DELIVERABLES ---------- */

const DELIVERABLES = [
  { img: img05, title: "Factory Layout", desc: "3D general arrangement optimised for material flow, safety, expansion and future automation." },
  { img: img06, title: "Material Flow Diagram", desc: "End-to-end path of coils, chemistry and panels — from receiving to dispatch, sized to target capacity." },
  { img: img07, title: "Process Engineering", desc: "PFD, mass and heat balance, reaction chemistry and cure kinetics engineered around the panel recipe." },
  { img: img08, title: "Equipment Selection Report", desc: "Technical specifications and comparative evaluation of every major module, with a documented decision matrix." },
  { img: img09, title: "Utility Engineering", desc: "Electrical, compressed air, chilled water, hot oil, gas and extraction sized and routed alongside the process." },
];

function Deliverables() {
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Engineering deliverables"
        title="What arrives on your desk before construction begins."
        lede="Every engagement produces the same core set of engineering documents — the artefacts a bank, a builder and an operator can each rely on."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {DELIVERABLES.map((d, i) => (
          <motion.article
            key={d.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.25, 1, 0.5, 1] }}
            className="group overflow-hidden rounded-xl border border-border bg-background"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-surface">
              <img src={d.img} alt={d.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading="lazy" />
            </div>
            <div className="p-6">
              <div className="font-mono text-[10px] tracking-widest text-accent">DELIVERABLE / {String(i + 1).padStart(2, "0")}</div>
              <h3 className="text-h3 mt-2 text-foreground">{d.title}</h3>
              <p className="text-body mt-2">{d.desc}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}

/* ---------- AUTOMATION ---------- */

function Automation() {
  return (
    <section className="section-y bg-primary text-primary-foreground">
      <div className="container-wide grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Eyebrow className="text-accent">Automation engineering</Eyebrow>
          <h2 className="text-h1 mt-6 text-balance">
            PLC, SCADA and Industry 4.0 — engineered as one control layer.
          </h2>
          <p className="text-body-lg mt-6 text-primary-foreground/75">
            Every NEVO factory ships with a coherent controls architecture:
            deterministic PLC control on the line, plant-wide SCADA on top,
            secure edge gateways for remote monitoring and an MES-ready
            historian for Industry 4.0 analytics.
          </p>

          <div className="mt-10 grid gap-px overflow-hidden rounded-lg bg-white/10 sm:grid-cols-2">
            {[
              { icon: Cpu, k: "PLC control", d: "Siemens S7-1500 / Rockwell / Beckhoff." },
              { icon: Gauge, k: "SCADA & HMI", d: "WinCC / FactoryTalk with role-based access." },
              { icon: Zap, k: "Remote monitoring", d: "Edge gateway, VPN, 24/7 dashboards." },
              { icon: LineChart, k: "Industry 4.0", d: "OEE, historian, MES and ERP integration." },
            ].map(({ icon: Icon, k, d }) => (
              <div key={k} className="bg-primary p-5">
                <Icon className="size-5 text-accent" />
                <div className="mt-3 text-sm font-medium">{k}</div>
                <p className="mt-1 text-xs text-primary-foreground/65">{d}</p>
              </div>
            ))}
          </div>
        </div>

        <figure className="relative lg:col-span-7">
          <div className="relative overflow-hidden rounded-xl border border-white/10">
            <img src={img10} alt="NEVO electrical control cabinet and HMI" className="aspect-[4/3] w-full object-cover" loading="lazy" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-5 font-mono text-[10px] tracking-widest text-white/70">
              FIG. 04 · ELECTRICAL & AUTOMATION CABINET
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}

/* ---------- EXECUTION ---------- */

const EXECUTION = [
  { img: img11, title: "Factory Construction", desc: "Structural erection supervised against engineered loads and tolerances." },
  { img: img12, title: "Installation", desc: "Mechanical and electrical installation aligned to the engineered general arrangement." },
  { img: img13, title: "Commissioning", desc: "Cold and hot commissioning, chemistry setup and performance qualification." },
  { img: img14, title: "Training", desc: "Operators, maintenance, quality and leadership trained to signed-off skill matrices." },
];

function Execution() {
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Project execution"
        title="From foundations to first panel — engineered every step."
        lede="Execution is where engineering earns its fee. Our site teams enforce the design intent from ground-breaking to acceptance run."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {EXECUTION.map((e, i) => (
          <article key={e.title} className="group overflow-hidden rounded-xl border border-border bg-background">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={e.img} alt={e.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading="lazy" />
              <div className="absolute left-4 top-4 rounded bg-black/60 px-2 py-1 font-mono text-[10px] tracking-widest text-white">
                STEP · {String(i + 1).padStart(2, "0")}
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-medium text-foreground">{e.title}</h3>
              <p className="text-body mt-2 text-sm">{e.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ---------- CONTINUOUS IMPROVEMENT ---------- */

function ContinuousImprovement() {
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Continuous improvement"
        title="Engineering does not stop at handover."
        lede="A factory that stops evolving starts decaying. NEVO's optimisation practice keeps OEE, quality and cost per m² on a measurable improvement curve."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <figure className="group relative overflow-hidden rounded-xl border border-border bg-surface">
          <img src={img15} alt="OEE and production optimization dashboard" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-6 text-white">
            <div className="font-mono text-[10px] tracking-widest text-accent">FIG. 05</div>
            <div className="mt-1 text-lg font-medium">Production optimisation</div>
            <p className="mt-1 max-w-md text-sm text-white/75">OEE, availability, performance and quality tracked continuously — the north star of every optimisation project.</p>
          </figcaption>
        </figure>

        <figure className="group relative overflow-hidden rounded-xl border border-border bg-surface">
          <img src={img16} alt="NEVO quality control lab technician" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-6 text-white">
            <div className="font-mono text-[10px] tracking-widest text-accent">FIG. 06</div>
            <div className="mt-1 text-lg font-medium">Quality control lab</div>
            <p className="mt-1 max-w-md text-sm text-white/75">Density, peel, compression, dimensional and thermal testing — engineered laboratories, engineered discipline.</p>
          </figcaption>
        </figure>
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
        {[
          { k: "OEE tracking", d: "Availability × performance × quality, live." },
          { k: "Quality control", d: "Certified test regimes for every panel batch." },
          { k: "Performance monitoring", d: "Remote KPI dashboards and monthly reviews." },
          { k: "Factory audits", d: "Independent audits with prioritised action plans." },
        ].map((c) => (
          <div key={c.k} className="bg-background p-6">
            <div className="font-mono text-[10px] tracking-widest text-accent">SERVICE</div>
            <div className="text-h3 mt-2 text-foreground">{c.k}</div>
            <p className="text-body mt-2">{c.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- INTEGRATED ---------- */

function IntegratedSolutions() {
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Integrated solutions"
        title="Engineering, panels and raw materials — one engineered ecosystem."
        lede="Factories engineered by NEVO can be paired with NEVO-supplied panels and matched raw materials, so specification, chemistry and line behaviour are aligned from the first cell."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <figure className="group relative overflow-hidden rounded-xl border border-border bg-background">
          <img src={img17} alt="NEVO finished sandwich panels stacked and packaged" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-6 text-white">
            <div className="font-mono text-[10px] tracking-widest text-accent">FIG. 07</div>
            <div className="mt-1 text-lg font-medium">Finished sandwich panels</div>
            <p className="mt-1 max-w-md text-sm text-white/75">Bridge demand during factory build-up with panels engineered to the same standard as your future line.</p>
          </figcaption>
        </figure>
        <figure className="group relative overflow-hidden rounded-xl border border-border bg-background">
          <img src={img18} alt="NEVO raw materials — steel coils and chemical IBCs" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-6 text-white">
            <div className="font-mono text-[10px] tracking-widest text-accent">FIG. 08</div>
            <div className="mt-1 text-lg font-medium">Raw materials</div>
            <p className="mt-1 max-w-md text-sm text-white/75">Steel, chemistry, insulation cores and adhesives, matched to the recipe and line speed engineered for your plant.</p>
          </figcaption>
        </figure>
      </div>
    </Section>
  );
}

/* ---------- DOCUMENTATION ---------- */

const DOCS = [
  { img: img19, title: "P&ID Diagram", desc: "Piping and instrumentation — every valve, sensor and control loop on one page." },
  { img: img20, title: "General Arrangement", desc: "Dimensioned plant layout with clearances, access and safety envelopes." },
  { img: img21, title: "Structural Design", desc: "Loads, footings, mezzanines and crane rails engineered for the equipment above them." },
  { img: img22, title: "Capacity Analysis", desc: "Throughput vs line speed, mix and OEE — modelled scenario by scenario." },
  { img: img23, title: "ROI Analysis", desc: "Financial model tying capex, chemistry and utilisation to payback and IRR." },
  { img: img24, title: "Project Timeline", desc: "Gantt-level schedule from engineering release to hot commissioning." },
];

function Documentation() {
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Engineering documentation"
        title="Deliverables that read like a premium industrial spec."
        lede="Each document is a decision, captured. Preview a sample, request the full brief."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {DOCS.map((d, i) => (
          <SurfaceCard key={d.title} interactive padded={false} className="overflow-hidden">
            <div className="relative aspect-[16/10] overflow-hidden bg-surface">
              <img src={d.img} alt={d.title} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 font-mono text-[10px] tracking-widest text-white">
                DOC · {String(i + 1).padStart(2, "0")}
              </div>
            </div>
            <div className="flex flex-col p-5">
              <h3 className="text-h3 text-foreground">{d.title}</h3>
              <p className="text-body mt-2 text-sm">{d.desc}</p>
              <a href="/project-inquiry" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">
                <Download className="size-4" /> Request sample
              </a>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </Section>
  );
}

/* ---------- ENGINEERING + MATERIALS ---------- */

function EngineeringMaterials() {
  return (
    <section className="section-y bg-black text-white">
      <div className="container-wide">
        <div className="mb-12 max-w-2xl">
          <Eyebrow className="text-accent">Engineering + materials</Eyebrow>
          <h2 className="text-h1 mt-6 text-balance">
            The engineered material ecosystem behind every NEVO factory.
          </h2>
          <p className="text-body-lg mt-6 text-white/70">
            PPGI, GI, Aluzinc and prepainted coils; polyol and MDI in IBC and
            drum; PIR and rock wool cores; adhesives and sealants — engineered
            together, delivered together, performing together.
          </p>
        </div>

        <figure className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 md:p-8">
          <img src={img25} alt="NEVO raw materials and chemical systems lineup" className="w-full object-contain" loading="lazy" />
        </figure>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: Layers, k: "Engineered together", d: "Recipe, facings and chemistry designed as one system." },
            { icon: Boxes, k: "Delivered together", d: "Consolidated supply, one accountable partner." },
            { icon: Sparkles, k: "Performing together", d: "Line behaviour and panel quality validated at commissioning." },
          ].map(({ icon: Icon, k, d }) => (
            <div key={k} className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <Icon className="size-5 text-accent" />
              <div className="mt-3 text-lg font-medium">{k}</div>
              <p className="mt-1 text-sm text-white/70">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- SERVICES ---------- */

const SERVICES = [
  { icon: ClipboardCheck, k: "Factory Feasibility Study" },
  { icon: Map, k: "Master Planning" },
  { icon: Ruler, k: "Factory Layout" },
  { icon: Gauge, k: "Capacity Planning" },
  { icon: Factory, k: "Production Engineering" },
  { icon: Cpu, k: "Automation Engineering" },
  { icon: Wrench, k: "Mechanical Engineering" },
  { icon: Cog, k: "Process Engineering" },
  { icon: Zap, k: "Utility Engineering" },
  { icon: Boxes, k: "Material Flow" },
  { icon: Building2, k: "Factory Expansion" },
  { icon: ShieldCheck, k: "Commissioning" },
  { icon: GraduationCap, k: "Training" },
  { icon: FileText, k: "Technical Audits" },
  { icon: LineChart, k: "Continuous Improvement" },
];

function Services() {
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Engineering services"
        title="Fifteen disciplines, one engineering practice."
        lede="Engage the full scope or a single service. Each is delivered by a senior engineer, documented, and priced transparently before mobilisation."
      />
      <GridBoard className="md:grid-cols-3 lg:grid-cols-5">
        {SERVICES.map(({ icon: Icon, k }) => (
          <BoardCell key={k} interactive className="min-h-[140px]">
            <Icon className="size-5 text-accent" />
            <div className="mt-3 text-sm font-medium text-foreground">{k}</div>
          </BoardCell>
        ))}
      </GridBoard>
    </Section>
  );
}

/* ---------- PROCESS ---------- */

const STEPS = [
  ["01", "Engineering Brief", "Capacity, product mix, target markets, constraints."],
  ["02", "Feasibility Study", "ROI model, CAPEX/OPEX envelope, technology options."],
  ["03", "Concept Engineering", "Block layout, chemistry route, utility load estimate."],
  ["04", "Basic Design Package", "PFD, mass & heat balance, single-line diagrams."],
  ["05", "Detailed Engineering", "P&ID, GA drawings, structural, electrical, controls."],
  ["06", "Tender Documents", "Specifications, scope splits, bidder decision matrix."],
  ["07", "FAT Witnessing", "Factory acceptance tests at equipment builders."],
  ["08", "SAT & Performance Runs", "Cold, hot, chemistry and performance validation."],
  ["09", "Operator Training", "Line, maintenance, quality and management curricula."],
  ["10", "Technical Audits", "Post-launch OEE audits, upgrade and retrofit roadmap."],
];

function Process() {
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Engineering deliverables"
        title="Ten engineered outputs — one accountable engineer per stage."
      />
      <ol className="relative grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-5">
        {STEPS.map(([n, t, d], i) => (
          <motion.li
            key={n}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.03 }}
            className="flex min-h-[190px] flex-col justify-between bg-background p-6"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-widest text-accent">{n}</span>
              <span className="h-px w-6 bg-border-strong" />
            </div>
            <div>
              <div className="text-h3 text-foreground">{t}</div>
              <p className="text-body mt-2 text-sm">{d}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </Section>
  );
}

/* ---------- DOWNLOADS ---------- */

const DOWNLOADS = [
  "Engineering Capability Brochure",
  "Factory Planning Guide",
  "Engineering Checklist",
  "Capacity Calculator",
  "Technical Specifications",
  "Project Preparation Guide",
];

function Downloads() {
  return (
    <Section tone="surface" bordered id="downloads">
      <SectionHeader
        eyebrow="Downloads"
        title="Technical resources for investors and engineering teams."
        lede="Everything you need to prepare an internal review — engineered documents, no marketing filler."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DOWNLOADS.map((t) => (
          <a
            key={t}
            href="/project-inquiry"
            className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-5 transition-colors hover:border-border-strong hover:bg-surface-muted"
          >
            <div className="flex items-center gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                <FileText className="size-4" />
              </span>
              <div>
                <div className="text-sm font-medium text-foreground">{t}</div>
                <div className="mt-0.5 font-mono text-[10px] tracking-widest text-muted-foreground">PDF · ENGINEERING</div>
              </div>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
          </a>
        ))}
      </div>
    </Section>
  );
}

/* ---------- FAQ ---------- */

function FAQ() {
  return (
    <Section tone="default">
      <SectionHeader
        eyebrow="Frequently asked questions"
        title="Engineering, in plain answers."
        lede="Thirty of the questions investors and technical teams ask us most often."
      />
      <div className="mx-auto max-w-4xl">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`q-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-base font-medium text-foreground hover:no-underline">
                <span className="mr-4 font-mono text-xs tracking-widest text-accent">Q{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1">{f.q}</span>
              </AccordionTrigger>
              <AccordionContent className="text-body pl-10 pr-4">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

/* ---------- INQUIRY FORM ---------- */

function InquiryForm() {
  return (
    <Section tone="surface" id="inquiry">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Eyebrow>Engineering inquiry</Eyebrow>
          <h2 className="text-h1 mt-6 text-balance text-foreground">
            Start with a conversation with a senior engineer.
          </h2>
          <p className="text-body-lg mt-6">
            Share your factory ambition. We respond within one business day
            with a scoped engineering proposal and the first workshop agenda.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-foreground">
            {[
              "Response within 1 business day",
              "Scoped fixed-fee feasibility",
              "NDA in place before any data is shared",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <form
          className="rounded-xl border border-border bg-background p-6 shadow-sm lg:col-span-7 lg:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Thank you. A senior engineer will contact you within 1 business day.");
          }}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Company" name="company" required />
            <Field label="Country" name="country" required />
            <Select label="Existing factory" name="existing" options={["Greenfield / new investment", "Existing factory — expansion", "Existing factory — audit / optimisation", "Undecided"]} />
            <Select label="Target capacity" name="capacity" options={["< 500,000 m²/yr", "500,000 – 1,500,000 m²/yr", "1,500,000 – 3,000,000 m²/yr", "> 3,000,000 m²/yr", "To be defined"]} />
            <Field label="Project timeline" name="timeline" placeholder="e.g. commissioning Q4 2027" />
            <Field label="Email" name="email" type="email" required />
          </div>
          <div className="mt-5 grid gap-5">
            <Textarea label="Current challenges" name="challenges" rows={3} placeholder="Bottlenecks, quality issues, capacity gaps..." />
            <Textarea label="Message" name="message" rows={4} placeholder="Anything else our engineers should know before the first call." />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">By submitting, you agree to be contacted by a NEVO engineer regarding your project.</p>
            <Button type="submit" variant="primary" size="lg">
              Send inquiry
              <ArrowRight className="!size-4" />
            </Button>
          </div>
        </form>
      </div>
    </Section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}{required && " *"}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
      <select
        name={name}
        defaultValue=""
        className="w-full rounded-md border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      >
        <option value="" disabled>Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Textarea({ label, name, rows = 4, placeholder }: { label: string; name: string; rows?: number; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}

/* ---------- FINAL CTA ---------- */

function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-1/2 size-[420px] -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 size-[420px] rounded-full bg-accent/10 blur-3xl" />
      <div className="container-wide relative section-y">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow className="justify-center text-accent">Ready when you are</Eyebrow>
          <h2 className="text-display mt-6 text-balance">
            Every great factory starts with great engineering.
          </h2>
          <p className="text-body-lg mt-6 text-primary-foreground/70">
            Engineering transforms investment into long-term industrial
            performance. Let's engineer yours.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild variant="primary" size="lg" className="bg-white text-primary hover:bg-white/90">
              <a href="/project-inquiry">
                Book Engineering Consultation
                <ArrowRight className="!size-4" />
              </a>
            </Button>
            <Button asChild variant="secondary" size="lg" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              <a href="/project-inquiry">
                Talk to a Senior Engineer
                <ArrowUpRight className="!size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
