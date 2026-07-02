import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MapPin, Phone, Mail, MessageCircle, Calendar, ArrowRight,
  Building2, Headphones, Briefcase, Wrench, Globe2, Clock, Loader2,
} from "lucide-react";

import heroImg from "@/assets/corporate/contact-hero.jpg";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { submitLeadForm } from "@/lib/lead-submit";
import { SITE, WHATSAPP_URL, buildSeo } from "@/lib/seo";
import { localizedMeta } from "@/lib/seo-meta";

const URL_PATH = "/contact";

const OFFICE_META = [
  { code: "DXB", x: "62%", y: "52%", email: "solutions@nevoindustrial.com" },
  { code: "DE",  x: "48%", y: "34%", email: "europe@nevoindustrial.com" },
  { code: "TR",  x: "55%", y: "40%", email: "turkey@nevoindustrial.com" },
  { code: "OM",  x: "66%", y: "55%", email: "oman@nevoindustrial.com" },
  { code: "…",   x: "60%", y: "48%", email: "expansion@nevoindustrial.com" },
];

const CARD_ICONS = [Headphones, Globe2, Wrench, Briefcase, MessageCircle, Calendar];
const CARD_HREFS = (whats: string, phoneHref: string) => [
  phoneHref,
  "mailto:solutions@nevoindustrial.com",
  "mailto:engineering@nevoindustrial.com",
  "mailto:projects@nevoindustrial.com",
  whats,
  "#request-callback",
];
const CARD_VALUES = (phone: string, whatsappDisplay: string) => [
  phone,
  "solutions@nevoindustrial.com",
  "engineering@nevoindustrial.com",
  "projects@nevoindustrial.com",
  whatsappDisplay,
  null, // uses translation "v"
];

function useCounter(target: number, duration = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

function ContactPage() {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);

  const offices = (t("contact.offices.list", { returnObjects: true }) as Array<{
    city: string; country: string; role: string; address: string; hours: string;
  }>).map((o, i) => ({ ...o, ...OFFICE_META[i] }));

  const cards = (t("contact.cards.items", { returnObjects: true }) as Array<{ t: string; d: string; v?: string }>);
  const hrefs = CARD_HREFS(WHATSAPP_URL, SITE.contact.phoneHref);
  const values = CARD_VALUES(SITE.contact.phone, SITE.contact.whatsappDisplay);

  async function handleCallback(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const ok = await submitLeadForm(e.currentTarget, {
      source: "contact-callback",
      rules: [
        { field: "name",  label: t("contact.callback.name") },
        { field: "email", label: t("contact.callback.email"), type: "email" },
        { field: "phone", label: t("contact.callback.phone"), type: "phone" },
      ],
      successTitle: t("contact.callback.successTitle"),
      successDescription: t("contact.callback.successDesc"),
    });
    setBusy(false);
    if (ok) formRef.current?.reset();
  }

  const offCount = useCounter(4);
  const countries = useCounter(38);
  const engineers = useCounter(120);

  return (
    <>
      <AnnouncementBar />
      <SiteHeader />

      <section className="relative isolate overflow-hidden bg-[#0a0d0c] text-white">
        <img loading="lazy" decoding="async" src={heroImg} alt="" width={1920} height={1088}
             className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d0c]/85 via-[#0a0d0c]/60 to-[#0a0d0c]" />
        <div className="container-wide relative py-32 md:py-40">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Eyebrow className="text-emerald-400/90">{t("contact.hero.eyebrow")}</Eyebrow>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
              {t("contact.hero.titleA")} <span className="text-emerald-400">{t("contact.hero.titleB")}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/70">{t("contact.hero.lede")}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" asChild><a href="#offices">{t("contact.hero.ctaOffices")} <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
              <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
                <a href="#request-callback">{t("contact.hero.ctaCallback")}</a>
              </Button>
            </div>
            <div className="mt-16 grid max-w-2xl grid-cols-3 gap-8 border-t border-white/10 pt-8">
              <div><div className="text-4xl font-semibold text-emerald-400">{offCount}</div><div className="mt-1 text-xs uppercase tracking-widest text-white/50">{t("contact.hero.statOffices")}</div></div>
              <div><div className="text-4xl font-semibold text-emerald-400">{countries}+</div><div className="mt-1 text-xs uppercase tracking-widest text-white/50">{t("contact.hero.statCountries")}</div></div>
              <div><div className="text-4xl font-semibold text-emerald-400">{engineers}+</div><div className="mt-1 text-xs uppercase tracking-widest text-white/50">{t("contact.hero.statEngineers")}</div></div>
            </div>
          </motion.div>
        </div>
      </section>

      <Section id="offices" tone="surface">
        <SectionHeader eyebrow={t("contact.offices.eyebrow")} title={t("contact.offices.title")} lede={t("contact.offices.lede")} />
        <div className="relative overflow-hidden rounded-2xl border border-border bg-[#0a0d0c] p-4 md:p-8">
          <div className="relative aspect-[16/8] w-full">
            <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.15),transparent_60%)]" />
            <svg viewBox="0 0 100 50" className="absolute inset-0 h-full w-full opacity-20" preserveAspectRatio="none">
              {Array.from({ length: 25 }).map((_, i) =>
                <line key={i} x1={i * 4} y1={0} x2={i * 4} y2={50} stroke="#3a4a44" strokeWidth="0.05" />)}
              {Array.from({ length: 12 }).map((_, i) =>
                <line key={`h${i}`} x1={0} y1={i * 4.2} x2={100} y2={i * 4.2} stroke="#3a4a44" strokeWidth="0.05" />)}
            </svg>
            {offices.map((o) => (
              <a key={o.code} href={`#office-${o.code}`}
                 className="group absolute -translate-x-1/2 -translate-y-1/2"
                 style={{ left: o.x, top: o.y }}>
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white/80" />
                </span>
                <span className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-black/70 px-2 py-1 text-[10px] font-medium text-white opacity-0 backdrop-blur transition group-hover:opacity-100 md:block">
                  {o.city} · {o.role}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offices.map((o) => (
            <motion.article key={o.code} id={`office-${o.code}`}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-background p-8 transition hover:border-emerald-500/50 hover:shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{o.role}</div>
                  <h3 className="mt-2 text-2xl font-semibold">{o.city}</h3>
                  <div className="mt-1 text-sm text-muted-foreground">{o.country}</div>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <Building2 className="h-5 w-5" />
                </span>
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{o.address}</span></div>
                <div className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{SITE.contact.phone}</span></div>
                <div className="flex gap-3"><Mail  className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{o.email}</span></div>
                <div className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{o.hours}</span></div>
              </dl>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow={t("contact.cards.eyebrow")} title={t("contact.cards.title")} lede={t("contact.cards.lede")} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => {
            const Icon = CARD_ICONS[i];
            const value = values[i] ?? c.v ?? "";
            return (
              <a key={c.t} href={hrefs[i]}
                 className="group flex flex-col rounded-2xl border border-border bg-background p-8 transition hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-xl">
                <Icon className="h-8 w-8 text-emerald-600" />
                <h3 className="mt-6 text-xl font-semibold">{c.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
                <div className="mt-6 flex items-center justify-between text-sm font-medium text-emerald-700">
                  <span>{value}</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </a>
            );
          })}
        </div>
      </Section>

      <Section tone="surface" id="request-callback">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border">
            <iframe title={t("contact.callback.mapTitle")} className="h-[420px] w-full"
              src="https://www.google.com/maps?q=Business+Bay+Dubai&output=embed" loading="lazy" />
          </div>
          <div className="rounded-2xl border border-border bg-background p-8 md:p-10">
            <Eyebrow>{t("contact.callback.eyebrow")}</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{t("contact.callback.title")}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{t("contact.callback.lede")}</p>
            <form ref={formRef} className="mt-8 grid gap-4" onSubmit={handleCallback} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <input name="name" placeholder={t("contact.callback.name")} required className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
                <input name="company" placeholder={t("contact.callback.company")} className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
                <input name="email" placeholder={t("contact.callback.email")} type="email" required className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
                <input name="phone" placeholder={t("contact.callback.phone")} required className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
              </div>
              <select name="interest" defaultValue="" className="rounded-md border border-input bg-background px-4 py-3 text-sm">
                <option value="" disabled>{t("contact.callback.interestPlaceholder")}</option>
                <option>{t("contact.callback.interest1")}</option>
                <option>{t("contact.callback.interest2")}</option>
                <option>{t("contact.callback.interest3")}</option>
                <option>{t("contact.callback.interest4")}</option>
              </select>
              <textarea name="message" rows={4} placeholder={t("contact.callback.message")}
                        className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("contact.callback.sending")}</>) : (<>{t("contact.callback.submit")} <ArrowRight className="ml-2 h-4 w-4" /></>)}
              </Button>
            </form>
          </div>
        </div>
      </Section>

      <div className="pointer-events-none fixed bottom-6 right-6 z-40">
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
           className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:bg-emerald-600">
          <MessageCircle className="h-4 w-4" /> {t("contact.callback.whatsapp")}
        </a>
      </div>

      <SiteFooter />
    </>
  );
}

export const Route = createFileRoute("/$lang/contact")({
  head: ({ params }) => {
    const { title, description } = localizedMeta(URL_PATH, params.lang);
    return buildSeo({ title, description, path: URL_PATH, lang: params.lang });
  },
  component: ContactPage,
});
