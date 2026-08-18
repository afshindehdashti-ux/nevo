import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { buildSeo } from "@/lib/seo";
import { localizedMeta } from "@/lib/seo-meta";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  Snowflake,
  FlaskConical,
  UtensilsCrossed,
  Factory,
  Warehouse,
  Building2,
  Wheat,
  Container,
  Server,
  ShoppingBag,
  Trophy,
  Plane,
  Compass,
  ClipboardList,
  Layers,
  Cpu,
  Wrench,
  LifeBuoy,
  Shield,
  Leaf,
  Globe2,
  ArrowUpRight,
} from "lucide-react";

import t01 from "@/assets/industries/tile-01.jpg";
import t02 from "@/assets/industries/tile-02.jpg";
import t03 from "@/assets/industries/tile-03.jpg";
import t04 from "@/assets/industries/tile-04.jpg";
import t05 from "@/assets/industries/tile-05.jpg";
import t06 from "@/assets/industries/tile-06.jpg";
import t07 from "@/assets/industries/tile-07.jpg";
import t08 from "@/assets/industries/tile-08.jpg";
import t09 from "@/assets/industries/tile-09.jpg";
import t10 from "@/assets/industries/tile-10.jpg";
import t11 from "@/assets/industries/tile-11.jpg";
import t12 from "@/assets/industries/tile-12.jpg";
import t13 from "@/assets/industries/tile-13.jpg";
import t14 from "@/assets/industries/tile-14.jpg";
import t15 from "@/assets/industries/tile-15.jpg";
import t16 from "@/assets/industries/tile-16.jpg";
import t17 from "@/assets/industries/tile-17.jpg";
import t18 from "@/assets/industries/tile-18.jpg";
import t19 from "@/assets/industries/tile-19.jpg";
import t20 from "@/assets/industries/tile-20.jpg";
import t21 from "@/assets/industries/tile-21.jpg";
import t22 from "@/assets/industries/tile-22.jpg";
import t23 from "@/assets/industries/tile-23.jpg";

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

const URL_PATH = "/industries";

const INDUSTRY_IMGS = [t01, t02, t03, t04, t05, t06, t07, t08, t09, t10, t11, t12];
const INDUSTRY_ICONS = [
  Snowflake,
  FlaskConical,
  UtensilsCrossed,
  Factory,
  Warehouse,
  Building2,
  Wheat,
  Container,
  Server,
  ShoppingBag,
  Trophy,
  Plane,
];
const APP_IMGS = [t13, t14, t15, t16, t17, t18];
const PANEL_IMGS = [t19, t20, t21, t22, t23];
const OVERVIEW_ICONS = [Snowflake, Shield, FlaskConical, Factory, Building2];
const ENG_ICONS = [Compass, ClipboardList, Layers, Factory, Cpu, LifeBuoy, Wrench];
const CONSULT_ICONS = [Shield, Leaf, Globe2];

// Non-translated FAQ payload used both for schema.org and for rendering.
// Localised copy can be added later; the questions/answers stay in English.
const FAQS_EN: { q: string; a: string }[] = [
  {
    q: "Which panel is best for cold storage?",
    a: "PIR sandwich panels 100–200 mm thick with cam-lock joints and vapour-tight sealing.",
  },
  {
    q: "When should Rock Wool be selected over PIR?",
    a: "When non-combustible A2-s1,d0 fire class or up to 120 minutes fire resistance is required.",
  },
];

export const Route = createFileRoute("/$lang/industries")({
  head: ({ params }) => {
    const { title, description } = localizedMeta(URL_PATH, params.lang);
    const base = buildSeo({ title, description, path: URL_PATH, lang: params.lang });
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS_EN.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    return {
      ...base,
      scripts: [{ type: "application/ld+json", children: JSON.stringify(faqLd) }],
    };
  },
  component: IndustriesPage,
});

function IndustriesPage() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main">
        <Hero />
        <Overview />
        <IndustryGrid />
        <ApplicationsSection />
        <PanelSolutions />
        <EngineeringSolutions />
        <WhyChoose />
        <CaseStudies />
        <Downloads />
        <FAQSection />
        <ConsultationForm />
        <FinalCTA />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  const { t } = useTranslation();
  const stats = t("industries.hero.stats", { returnObjects: true }) as Array<{
    k: string;
    v: string;
  }>;
  return (
    <section className="relative isolate -mt-20 overflow-hidden bg-black text-white md:-mt-24">
      <div className="absolute inset-0 -z-10">
        <img
          src={t05}
          alt=""
          className="h-full w-full object-cover"
          style={{ transform: "scale(1.05)" }}
          fetchPriority="high"
        />
        <div aria-hidden className="absolute inset-0 bg-black/60" />
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-[70%]"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.78) 55%, rgba(0,0,0,0.25) 100%)",
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
            {t("industries.hero.eyebrow")}
          </div>
          <h1 className="text-display text-balance text-white">
            {t("industries.hero.titleA")}{" "}
            <span className="text-accent">{t("industries.hero.titleB")}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
            {t("industries.hero.lede")}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button size="lg" variant="primary" asChild>
              <a href="#industries">
                {t("industries.hero.ctaExplore")} <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#consultation">{t("industries.hero.ctaTalk")}</a>
            </Button>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9 }}
          className="mt-16 grid max-w-3xl grid-cols-2 gap-8 border-t border-white/15 pt-8 text-white/85 sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.k}>
              <div className="text-xs font-mono uppercase tracking-widest text-accent">{s.k}</div>
              <div className="mt-2 text-sm text-white/80">{s.v}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Overview() {
  const { t } = useTranslation();
  const items = t("industries.overview.items", { returnObjects: true }) as Array<{
    t: string;
    d: string;
  }>;
  return (
    <Section id="overview" className="bg-white">
      <SectionHeader
        eyebrow={t("industries.overview.eyebrow")}
        title={t("industries.overview.title")}
        lede={t("industries.overview.lede")}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((it, i) => {
          const Icon = OVERVIEW_ICONS[i];
          return (
            <SurfaceCard key={it.t} className="h-full">
              <Icon className="size-5 text-accent" />
              <h3 className="mt-3 text-base font-medium text-foreground">{it.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.d}</p>
            </SurfaceCard>
          );
        })}
      </div>
    </Section>
  );
}

function IndustryGrid() {
  const { t } = useTranslation();
  const items = t("industries.grid.items", { returnObjects: true }) as Array<{
    t: string;
    d: string;
    apps: string[];
    panel: string;
  }>;
  return (
    <Section id="industries" className="bg-secondary/40">
      <SectionHeader eyebrow={t("industries.grid.eyebrow")} title={t("industries.grid.title")} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((ind, i) => {
          const Icon = INDUSTRY_ICONS[i];
          return (
            <motion.article
              data-testid="industry-card"
              data-industry-index={i}
              key={ind.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.6 }}
              className="group overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-black">
                <img
                  src={INDUSTRY_IMGS[i]}
                  alt={ind.t}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                  aria-hidden="true"
                />
                <span
                  className="absolute top-3 left-3 rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-4 text-white">
                  <Icon className="size-5 text-accent" aria-hidden="true" />
                  <h3 className="text-lg font-medium">{ind.t}</h3>
                </div>
              </div>

              <div className="p-6">
                <p className="text-sm text-muted-foreground">{ind.d}</p>
                <div className="mt-4">
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">
                    {t("industries.grid.typicalLabel")}
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {ind.apps.map((a) => (
                      <li
                        key={a}
                        className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground"
                      >
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 text-sm">
                  <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">
                    {t("industries.grid.panelLabel")}
                  </span>
                  <div className="mt-1 text-foreground">{ind.panel}</div>
                </div>
                <a
                  href="#consultation"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                >
                  {t("industries.grid.discuss")} <ArrowUpRight className="size-4" />
                </a>
              </div>
            </motion.article>
          );
        })}
      </div>
    </Section>
  );
}

function ApplicationsSection() {
  const { t } = useTranslation();
  const items = t("industries.applications.items", { returnObjects: true }) as Array<{
    t: string;
    n: string;
  }>;
  return (
    <Section id="applications" className="bg-black text-white">
      <SectionHeader
        eyebrow={t("industries.applications.eyebrow")}
        title={t("industries.applications.title")}
        lede={t("industries.applications.lede")}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a, i) => (
          <div
            key={a.t}
            className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-black">
              <img
                src={APP_IMGS[i]}
                alt=""
                className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute top-3 left-3 rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">
                {String(i + 13).padStart(2, "0")}
              </span>
            </div>
            <div className="p-5">
              <h3 className="text-base font-medium text-white">{a.t}</h3>
              <p className="mt-2 text-sm text-white/70">{a.n}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PanelSolutions() {
  const { t } = useTranslation();
  const items = t("industries.panels.items", { returnObjects: true }) as Array<{
    t: string;
    w: string;
  }>;
  return (
    <Section id="panels" className="bg-white">
      <SectionHeader
        eyebrow={t("industries.panels.eyebrow")}
        title={t("industries.panels.title")}
        lede={t("industries.panels.lede")}
        aside={
          <Button variant="secondary" asChild>
            <Link to="/solutions/sandwich-panels">
              {t("industries.panels.all")} <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((p, i) => (
          <SurfaceCard key={p.t} className="overflow-hidden p-0">
            <div className="relative aspect-[4/3] bg-black">
              <img
                src={PANEL_IMGS[i]}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <span className="absolute top-3 left-3 rounded bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">
                {String(i + 19).padStart(2, "0")}
              </span>
            </div>
            <div className="p-5">
              <h3 className="text-base font-medium text-foreground">{p.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.w}</p>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </Section>
  );
}

function EngineeringSolutions() {
  const { t } = useTranslation();
  const items = t("industries.engineering.items", { returnObjects: true }) as Array<{
    t: string;
    d: string;
  }>;
  return (
    <Section id="engineering" className="bg-secondary/40">
      <SectionHeader
        eyebrow={t("industries.engineering.eyebrow")}
        title={t("industries.engineering.title")}
        aside={
          <Button variant="secondary" asChild>
            <Link to="/solutions/engineering-consultancy">
              {t("industries.engineering.consultancy")} <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((e, i) => {
          const Icon = ENG_ICONS[i];
          return (
            <SurfaceCard key={e.t} className="h-full">
              <Icon className="size-5 text-accent" />
              <h3 className="mt-3 text-base font-medium text-foreground">{e.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{e.d}</p>
            </SurfaceCard>
          );
        })}
      </div>
    </Section>
  );
}

function WhyChoose() {
  const { t } = useTranslation();
  const items = t("industries.whyChoose.items", { returnObjects: true }) as string[];
  return (
    <Section id="why" className="bg-black text-white">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Eyebrow className="text-white/60">{t("industries.whyChoose.eyebrow")}</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight text-white md:text-5xl">
            {t("industries.whyChoose.title")}
          </h2>
          <p className="mt-5 max-w-xl text-white/70">{t("industries.whyChoose.lede")}</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((w) => (
            <li
              key={w}
              className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/85"
            >
              <Check className="mt-0.5 size-4 flex-none text-accent" /> {w}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function CaseStudies() {
  const { t } = useTranslation();
  const items = t("industries.caseStudies.items", { returnObjects: true }) as Array<{
    t: string;
    l: string;
    i: string;
  }>;
  return (
    <Section id="case-studies" className="bg-white">
      <SectionHeader
        eyebrow={t("industries.caseStudies.eyebrow")}
        title={t("industries.caseStudies.title")}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <div
            key={c.t}
            className="group overflow-hidden rounded-lg border border-border bg-secondary/30"
          >
            <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-secondary to-secondary/40 text-muted-foreground">
              <Globe2 className="size-10 text-accent/40" />
              <span className="absolute top-3 left-3 rounded bg-accent/90 px-2 py-1 font-mono text-xs text-accent-foreground">
                {c.i}
              </span>
            </div>
            <div className="p-5">
              <h3 className="text-base font-medium text-foreground">{c.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.l}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">{t("industries.caseStudies.note")}</p>
    </Section>
  );
}

function Downloads() {
  const { t } = useTranslation();
  const items = t("industries.downloads.items", { returnObjects: true }) as Array<{
    t: string;
    d: string;
  }>;
  return (
    <Section id="downloads" className="bg-secondary/40">
      <SectionHeader
        eyebrow={t("industries.downloads.eyebrow")}
        title={t("industries.downloads.title")}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((d) => (
          <SurfaceCard key={d.t} className="flex h-full flex-col">
            <FileText className="size-5 text-accent" />
            <h3 className="mt-3 text-base font-medium text-foreground">{d.t}</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{d.d}</p>
            <Button variant="ghost" className="mt-4 justify-start px-0" asChild>
              <a href="#consultation">
                <Download className="mr-2 size-4" /> {t("industries.downloads.request")}
              </a>
            </Button>
          </SurfaceCard>
        ))}
      </div>
    </Section>
  );
}

function FAQSection() {
  const { t } = useTranslation();
  const links = t("industries.faq.links", { returnObjects: true }) as Record<string, string>;
  return (
    <Section id="faq" className="bg-white">
      <SectionHeader eyebrow={t("industries.faq.eyebrow")} title={t("industries.faq.title")} />
      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {FAQS_EN.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="mt-14 grid gap-3 rounded-lg border border-border bg-secondary/30 p-6 text-sm sm:grid-cols-3">
        <Link to="/solutions/production-lines" className="hover:text-accent">
          → {links.production}
        </Link>
        <Link to="/solutions/engineering-consultancy" className="hover:text-accent">
          → {links.consultancy}
        </Link>
        <Link to="/solutions/raw-materials" className="hover:text-accent">
          → {links.materials}
        </Link>
        <Link to="/solutions/sandwich-panels" className="hover:text-accent">
          → {links.panels}
        </Link>
        <Link to="/" className="hover:text-accent">
          → {links.factory}
        </Link>
        <Link to="/" className="hover:text-accent">
          → {links.hub}
        </Link>
      </div>
    </Section>
  );
}

function ConsultationForm() {
  const { t } = useTranslation();
  const bullets = t("industries.consultation.bullets", { returnObjects: true }) as string[];
  const successMsg = t("industries.consultation.successMsg");
  return (
    <Section id="consultation" className="bg-black text-white">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <Eyebrow className="text-white/60">{t("industries.consultation.eyebrow")}</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight text-white md:text-5xl">
            {t("industries.consultation.title")}
          </h2>
          <p className="mt-5 max-w-lg text-white/70">{t("industries.consultation.lede")}</p>
          <ul className="mt-8 space-y-3 text-sm text-white/70">
            {bullets.map((b, i) => {
              const Icon = CONSULT_ICONS[i];
              return (
                <li key={b} className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-4 flex-none text-accent" /> {b}
                </li>
              );
            })}
          </ul>
        </div>
        <form
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            alert(successMsg);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("industries.consultation.company")} name="company" required />
            <Field
              label={t("industries.consultation.industry")}
              name="industry"
              placeholder={t("industries.consultation.industryPh")}
              required
            />
            <Field label={t("industries.consultation.country")} name="country" required />
            <Field
              label={t("industries.consultation.projectType")}
              name="projectType"
              placeholder={t("industries.consultation.projectTypePh")}
            />
            <Field
              label={t("industries.consultation.size")}
              name="size"
              placeholder={t("industries.consultation.sizePh")}
            />
            <Field
              label={t("industries.consultation.panel")}
              name="panel"
              placeholder={t("industries.consultation.panelPh")}
            />
            <Field
              label={t("industries.consultation.fire")}
              name="fire"
              placeholder={t("industries.consultation.firePh")}
            />
            <Field
              label={t("industries.consultation.timeline")}
              name="timeline"
              placeholder={t("industries.consultation.timelinePh")}
            />
          </div>
          <Field
            label={t("industries.consultation.message")}
            name="message"
            textarea
            className="mt-4"
          />
          <Button type="submit" size="lg" variant="primary" className="mt-6 w-full sm:w-auto">
            {t("industries.consultation.submit")} <ArrowRight className="ml-2 size-4" />
          </Button>
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
  textarea,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
  className?: string;
}) {
  const cls =
    "mt-2 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/60 focus:border-accent focus:outline-none";
  return (
    <label className={"block " + (className ?? "")}>
      <span className="text-xs font-mono uppercase tracking-widest text-white/60">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      {textarea ? (
        <textarea name={name} rows={4} placeholder={placeholder} className={cls} />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </label>
  );
}

function FinalCTA() {
  const { t } = useTranslation();
  return (
    <Section className="bg-white">
      <div className="relative overflow-hidden rounded-2xl bg-black p-10 md:p-16 text-white">
        <div className="relative z-10 max-w-3xl">
          <Eyebrow className="text-white/60">{t("industries.cta.eyebrow")}</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl">
            {t("industries.cta.title")}
          </h2>
          <p className="mt-5 max-w-2xl text-white/75">{t("industries.cta.lede")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="primary" asChild>
              <a href="#consultation">
                {t("industries.cta.primary")} <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#consultation">{t("industries.cta.secondary")}</a>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
