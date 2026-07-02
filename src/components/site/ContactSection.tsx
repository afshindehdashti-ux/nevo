import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Loader2 } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { submitLeadForm } from "@/lib/lead-submit";
import { SITE, WHATSAPP_URL } from "@/lib/seo";

const FIELD =
  "block w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40";
const LABEL =
  "mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground";

const SOLUTION_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;
const TIMELINE_KEYS = ["t1", "t2", "t3", "t4", "t5"] as const;

export function ContactSection() {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const ok = await submitLeadForm(e.currentTarget, {
      source: "homepage-contact",
      rules: [
        { field: "name", label: t("home.contactSection.fullName") },
        { field: "email", label: t("home.contactSection.email"), type: "email" },
        { field: "message", label: t("home.contactSection.message"), min: 10 },
      ],
      successTitle: t("home.contactSection.successTitle"),
      successDescription: t("home.contactSection.successDesc"),
    });
    setBusy(false);
    if (ok) formRef.current?.reset();
  }

  return (
    <Section id="contact" tone="default">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeader
            eyebrow={t("home.contactSection.eyebrow")}
            title={t("home.contactSection.title")}
            lede={t("home.contactSection.lede")}
          />
          <dl className="mt-4 space-y-5 border-t border-border pt-8">
            <div>
              <dt className={LABEL}>{t("home.contactSection.engineeringDesk")}</dt>
              <dd className="mt-1 text-sm text-foreground">solutions@nevoindustrial.com</dd>
            </div>
            <div>
              <dt className={LABEL}>{t("home.contactSection.whatsapp")}</dt>
              <dd className="mt-1 text-sm text-foreground">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {SITE.contact.whatsappDisplay}
                </a>
              </dd>
            </div>
            <div>
              <dt className={LABEL}>{t("home.contactSection.phone")}</dt>
              <dd className="mt-1 text-sm text-foreground">
                <a href={SITE.contact.phoneHref} className="hover:underline">{SITE.contact.phone}</a>
              </dd>
            </div>
            <div>
              <dt className={LABEL}>{t("home.contactSection.office")}</dt>
              <dd className="mt-1 text-sm text-foreground">{t("home.contactSection.officeCity")}</dd>
            </div>
          </dl>
        </div>

        <form
          ref={formRef}
          className="lg:col-span-7 rounded-2xl border border-border bg-surface p-6 sm:p-10"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className={LABEL}>{t("home.contactSection.fullName")}</label>
              <input id="name" name="name" required className={FIELD} placeholder={t("home.contactSection.fullNamePlaceholder")} />
            </div>
            <div>
              <label htmlFor="company" className={LABEL}>{t("home.contactSection.company")}</label>
              <input id="company" name="company" className={FIELD} placeholder={t("home.contactSection.companyPlaceholder")} />
            </div>
            <div>
              <label htmlFor="email" className={LABEL}>{t("home.contactSection.email")}</label>
              <input id="email" type="email" required className={FIELD} placeholder={t("home.contactSection.emailPlaceholder")} />
            </div>
            <div>
              <label htmlFor="phone" className={LABEL}>{t("home.contactSection.phoneField")}</label>
              <input id="phone" name="phone" className={FIELD} placeholder={t("home.contactSection.phonePlaceholder")} />
            </div>
            <div>
              <label htmlFor="country" className={LABEL}>{t("home.contactSection.country")}</label>
              <input id="country" name="country" className={FIELD} placeholder={t("home.contactSection.countryPlaceholder")} />
            </div>
            <div>
              <label htmlFor="solution" className={LABEL}>{t("home.contactSection.solution")}</label>
              <select id="solution" name="solution" className={FIELD} defaultValue="">
                <option value="">{t("home.contactSection.solutionPlaceholder")}</option>
                {SOLUTION_KEYS.map((k) => (
                  <option key={k}>{t(`home.contactSection.${k}`)}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="timeline" className={LABEL}>{t("home.contactSection.timeline")}</label>
              <select id="timeline" name="timeline" className={FIELD} defaultValue="">
                <option value="">{t("home.contactSection.timelinePlaceholder")}</option>
                {TIMELINE_KEYS.map((k) => (
                  <option key={k}>{t(`home.contactSection.${k}`)}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="message" className={LABEL}>{t("home.contactSection.message")}</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                className={FIELD}
                placeholder={t("home.contactSection.messagePlaceholder")}
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-xs text-muted-foreground">
              {t("home.contactSection.confidentiality")}
            </p>
            <Button type="submit" variant="primary" size="lg" disabled={busy}>
              {busy ? (
                <><Loader2 className="!size-4 animate-spin" /> {t("home.contactSection.sending")}</>
              ) : (
                <>{t("home.contactSection.submit")} <ArrowRight className="!size-4" /></>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Section>
  );
}
