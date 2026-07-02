import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
import { SITE, WHATSAPP_URL } from "@/lib/seo";
import { ogImageMeta } from "@/lib/og-images";

const TITLE = "Global Offices & Contact — NEVO Industrial | Dubai · Germany · Turkey · Oman";
const DESCRIPTION =
  "Reach NEVO Industrial engineering teams worldwide. Dubai HQ, Germany, Turkey and Oman offices. Engineering hotline, international sales, project department, WhatsApp and booked meetings.";
const URL_PATH = "/contact";

const OFFICES = [
  { code: "DXB", city: "Dubai", country: "United Arab Emirates", role: "Global Headquarters", address: "Business Bay, Dubai, UAE", phone: SITE.contact.phone, email: "solutions@nevoindustrial.com", hours: "Sun–Thu · 08:30–18:00 GST", x: "62%", y: "52%" },
  { code: "DE",  city: "Düsseldorf", country: "Germany", role: "European Engineering Hub", address: "Königsallee, Düsseldorf", phone: SITE.contact.phone, email: "europe@nevoindustrial.com", hours: "Mon–Fri · 09:00–18:00 CET", x: "48%", y: "34%" },
  { code: "TR",  city: "Istanbul", country: "Türkiye", role: "Manufacturing & Sourcing", address: "Levent, Istanbul", phone: SITE.contact.phone, email: "turkey@nevoindustrial.com", hours: "Mon–Fri · 09:00–18:00 TRT", x: "55%", y: "40%" },
  { code: "OM",  city: "Muscat", country: "Sultanate of Oman", role: "GCC Projects Office", address: "Al Khuwair, Muscat", phone: SITE.contact.phone, email: "oman@nevoindustrial.com", hours: "Sun–Thu · 08:30–17:30 GST", x: "66%", y: "55%" },
  { code: "…",   city: "Riyadh · Cairo · Nairobi", country: "Opening 2026", role: "Future Offices", address: "Under establishment", phone: SITE.contact.phone, email: "expansion@nevoindustrial.com", hours: "Announced Q2 2026", x: "60%", y: "48%" },
];

const CONTACT_CARDS = [
  { icon: Headphones, title: "Engineering Hotline", desc: "24/7 senior engineer on call for active project sites.", value: SITE.contact.phone, href: SITE.contact.phoneHref },
  { icon: Globe2,     title: "International Sales", desc: "Panel supply, factory equipment and export enquiries.", value: "solutions@nevoindustrial.com", href: "mailto:solutions@nevoindustrial.com" },
  { icon: Wrench,     title: "Engineering Support", desc: "Technical drawings, U-value & fire compliance help.", value: "engineering@nevoindustrial.com", href: "mailto:engineering@nevoindustrial.com" },
  { icon: Briefcase,  title: "Project Department", desc: "Turn-key factories, EPC and consulting programs.", value: "projects@nevoindustrial.com", href: "mailto:projects@nevoindustrial.com" },
  { icon: MessageCircle, title: "WhatsApp", desc: "Fast response from our GCC engineering desk.", value: SITE.contact.whatsappDisplay, href: WHATSAPP_URL },
  { icon: Calendar,   title: "Book Online Meeting", desc: "30-minute video consultation with a senior engineer.", value: "Reserve a slot", href: "#request-callback" },
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
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleCallback(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const ok = await submitLeadForm(e.currentTarget, {
      source: "contact-callback",
      rules: [
        { field: "name", label: "Full name" },
        { field: "email", label: "Email", type: "email" },
        { field: "phone", label: "Phone / WhatsApp", type: "phone" },
      ],
      successTitle: "Callback requested",
      successDescription: "A senior engineer will call you within one business day.",
    });
    setBusy(false);
    if (ok) formRef.current?.reset();
  }

  const offices = useCounter(4);
  const countries = useCounter(38);
  const engineers = useCounter(120);

  return (
    <>
      <AnnouncementBar />
      <SiteHeader />

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-[#0a0d0c] text-white">
        <img loading="lazy" decoding="async" src={heroImg} alt="Dubai skyline at night" width={1920} height={1088}
             className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d0c]/85 via-[#0a0d0c]/60 to-[#0a0d0c]" />
        <div className="container-wide relative py-32 md:py-40">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Eyebrow className="text-emerald-400/90">Global Presence</Eyebrow>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
              Global Engineering. <span className="text-emerald-400">Local Presence.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/70">
              From our Dubai headquarters to European engineering hubs and GCC project offices, NEVO delivers
              industrial engineering with senior expertise wherever your project lives.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" asChild><a href="#offices">Explore Offices <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
              <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
                <a href="#request-callback">Request a Callback</a>
              </Button>
            </div>
            <div className="mt-16 grid max-w-2xl grid-cols-3 gap-8 border-t border-white/10 pt-8">
              <div><div className="text-4xl font-semibold text-emerald-400">{offices}</div><div className="mt-1 text-xs uppercase tracking-widest text-white/50">Offices</div></div>
              <div><div className="text-4xl font-semibold text-emerald-400">{countries}+</div><div className="mt-1 text-xs uppercase tracking-widest text-white/50">Countries Served</div></div>
              <div><div className="text-4xl font-semibold text-emerald-400">{engineers}+</div><div className="mt-1 text-xs uppercase tracking-widest text-white/50">Engineers On-Staff</div></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WORLD MAP */}
      <Section id="offices" tone="surface">
        <SectionHeader eyebrow="Interactive Map" title="Where NEVO operates" lede="Click any office to see contact details and local engineering capability." />
        <div className="relative overflow-hidden rounded-2xl border border-border bg-[#0a0d0c] p-4 md:p-8">
          <div className="relative aspect-[16/8] w-full">
            {/* stylised map dots on gradient */}
            <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.15),transparent_60%)]" />
            <svg viewBox="0 0 100 50" className="absolute inset-0 h-full w-full opacity-20" preserveAspectRatio="none">
              {Array.from({ length: 25 }).map((_, i) =>
                <line key={i} x1={i * 4} y1={0} x2={i * 4} y2={50} stroke="#3a4a44" strokeWidth="0.05" />)}
              {Array.from({ length: 12 }).map((_, i) =>
                <line key={`h${i}`} x1={0} y1={i * 4.2} x2={100} y2={i * 4.2} stroke="#3a4a44" strokeWidth="0.05" />)}
            </svg>
            {OFFICES.map((o) => (
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
          {OFFICES.map((o) => (
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
                <div className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{o.phone}</span></div>
                <div className="flex gap-3"><Mail  className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{o.email}</span></div>
                <div className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{o.hours}</span></div>
              </dl>
            </motion.article>
          ))}
        </div>
      </Section>

      {/* CONTACT CARDS */}
      <Section>
        <SectionHeader eyebrow="Direct Channels" title="Talk to the right team, fast" lede="Every enquiry is routed to a senior engineer or account director within one business day." />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CONTACT_CARDS.map((c) => (
            <a key={c.title} href={c.href}
               className="group flex flex-col rounded-2xl border border-border bg-background p-8 transition hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-xl">
              <c.icon className="h-8 w-8 text-emerald-600" />
              <h3 className="mt-6 text-xl font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
              <div className="mt-6 flex items-center justify-between text-sm font-medium text-emerald-700">
                <span>{c.value}</span>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </a>
          ))}
        </div>
      </Section>

      {/* MAP + CALLBACK */}
      <Section tone="surface" id="request-callback">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border">
            <iframe title="NEVO Dubai HQ" className="h-[420px] w-full"
              src="https://www.google.com/maps?q=Business+Bay+Dubai&output=embed" loading="lazy" />
          </div>
          <div className="rounded-2xl border border-border bg-background p-8 md:p-10">
            <Eyebrow>Request Callback</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Speak with a senior engineer</h2>
            <p className="mt-3 text-sm text-muted-foreground">Share a few details and we'll call within one business day.</p>
            <form ref={formRef} className="mt-8 grid gap-4" onSubmit={handleCallback} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <input name="name" placeholder="Full name" required className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
                <input name="company" placeholder="Company" className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
                <input name="email" placeholder="Email" type="email" required className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
                <input name="phone" placeholder="Phone / WhatsApp" required className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
              </div>
              <select name="interest" defaultValue="" className="rounded-md border border-input bg-background px-4 py-3 text-sm">
                <option value="" disabled>Select interest…</option>
                <option>Factory Development</option>
                <option>Sandwich Panels</option>
                <option>Production Lines</option>
                <option>Engineering Consultancy</option>
              </select>
              <textarea name="message" rows={4} placeholder="Project brief (capacity, location, timeline)"
                        className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>) : (<>Request Callback <ArrowRight className="ml-2 h-4 w-4" /></>)}
              </Button>
            </form>
          </div>
        </div>
      </Section>

      {/* STICKY CTA */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-40">
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
           className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:bg-emerald-600">
          <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
        </a>
      </div>

      <SiteFooter />
    </>
  );
}

export const Route = createFileRoute("/$lang/contact")({
  head: ({ params }) => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/${params.lang}${URL_PATH}` },
      { name: "twitter:card", content: "summary_large_image" },
        ...ogImageMeta("/contact"),
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/${params.lang}${URL_PATH}` }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "NEVO Industrial",
        url: `${SITE.url}/${params.lang}${URL_PATH}`,
        contactPoint: OFFICES.map(o => ({
          "@type": "ContactPoint",
          areaServed: o.country,
          contactType: o.role,
          telephone: o.phone,
          email: o.email,
        })),
      }),
    }],
  }),
  component: ContactPage,
});
