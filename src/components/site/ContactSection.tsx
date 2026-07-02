import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { SITE, WHATSAPP_URL } from "@/lib/seo";

const FIELD =
  "block w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40";
const LABEL =
  "mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground";

const SOLUTIONS = [
  "Factory Development",
  "Engineering Consultancy",
  "Raw Material Solutions",
  "Production Line Solutions",
  "Finished Panel Solutions",
  "Technical Support",
];
const TIMELINES = ["Immediate", "1–3 months", "3–6 months", "6–12 months", "12+ months"];

export function ContactSection() {
  return (
    <Section id="contact" tone="default">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeader
            eyebrow="Project inquiry"
            title="Talk to a NEVO engineer."
            lede="Tell us about your project. A senior engineer will respond within one business day with a scoped technical proposal."
          />
          <dl className="mt-4 space-y-5 border-t border-border pt-8">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Engineering desk
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                solutions@nevoindustrial.com
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                WhatsApp
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {SITE.contact.whatsappDisplay}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Phone
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                <a href={SITE.contact.phoneHref} className="hover:underline">{SITE.contact.phone}</a>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Office
              </dt>
              <dd className="mt-1 text-sm text-foreground">Dubai, United Arab Emirates</dd>
            </div>
          </dl>
        </div>

        <form
          className="lg:col-span-7 rounded-2xl border border-border bg-surface p-6 sm:p-10"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className={LABEL}>Full name</label>
              <input id="name" name="name" required className={FIELD} placeholder="Your name" />
            </div>
            <div>
              <label htmlFor="company" className={LABEL}>Company</label>
              <input id="company" name="company" className={FIELD} placeholder="Company name" />
            </div>
            <div>
              <label htmlFor="email" className={LABEL}>Email</label>
              <input id="email" type="email" required className={FIELD} placeholder="you@company.com" />
            </div>
            <div>
              <label htmlFor="phone" className={LABEL}>Phone / WhatsApp</label>
              <input id="phone" className={FIELD} placeholder="+971 ..." />
            </div>
            <div>
              <label htmlFor="country" className={LABEL}>Country</label>
              <input id="country" className={FIELD} placeholder="e.g. Saudi Arabia" />
            </div>
            <div>
              <label htmlFor="solution" className={LABEL}>Interested solution</label>
              <select id="solution" className={FIELD}>
                <option value="">Select a solution…</option>
                {SOLUTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="timeline" className={LABEL}>Estimated timeline</label>
              <select id="timeline" className={FIELD}>
                <option value="">Select timeline…</option>
                {TIMELINES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="message" className={LABEL}>Project details</label>
              <textarea
                id="message"
                rows={5}
                className={FIELD}
                placeholder="Briefly describe your project, target output, market and any technical constraints."
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-xs text-muted-foreground">
              Your information is treated as confidential and used only to respond to
              your inquiry.
            </p>
            <Button type="submit" variant="primary" size="lg">
              Submit Project Inquiry
              <ArrowRight className="!size-4" />
            </Button>
          </div>
        </form>
      </div>
    </Section>
  );
}
