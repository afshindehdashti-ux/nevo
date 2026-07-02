import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Mail, MessageCircle, Linkedin, MapPin, ArrowUpRight, Phone } from "lucide-react";
import nevoLogoLight from "@/assets/nevo-logo-light.png";
import { SITE, WHATSAPP_URL } from "@/lib/seo";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";

const COLUMNS = [
  {
    title: "Solutions",
    links: [
      { label: "Factory Development", href: "/solutions/factory-development" },
      { label: "Engineering Consultancy", href: "/solutions/engineering-consultancy" },
      { label: "Raw Materials", href: "/solutions/raw-materials" },
      { label: "Production Lines", href: "/solutions/production-lines" },
      { label: "Finished Panels", href: "/solutions/sandwich-panels" },
      { label: "Panel Configurator", href: "/product-configurator" },
      { label: "Investment Calculator", href: "/investment-calculator" },
      { label: "Panel Thickness Calculator", href: "/panel-thickness-calculator" },
      { label: "PIR vs Rock Wool", href: "/pir-vs-rock-wool" },
      { label: "Factory Layout Generator", href: "/factory-layout-generator" },
      { label: "AI Engineering Assistant", href: "/ai-assistant" },
    ],
  },
  {
    title: "Industries",
    links: [
      { label: "Cold Storage", href: "/industries" },
      { label: "Food Processing", href: "/industries" },
      { label: "Pharmaceutical", href: "/industries" },
      { label: "Clean Rooms", href: "/industries" },
      { label: "Warehousing", href: "/industries" },
      { label: "Modular Buildings", href: "/industries" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Knowledge Hub", href: "/knowledge-hub" },
      { label: "Engineering Tools", href: "/engineering-tools" },
      { label: "Download Center", href: "/download-center" },
      { label: "Case Studies", href: "/factory-layouts" },
      { label: "Installation & Commissioning", href: "/installation-commissioning" },
      { label: "Project Inquiry", href: "/project-inquiry" },
      { label: "Customer Portal", href: "/customer-portal" },
      { label: "Partner Portal", href: "/partner-portal" },
      { label: "AI Project Estimator", href: "/ai-project-estimator" },
    ],
  },
  {
    title: "Markets",
    links: [
      { label: "Saudi Arabia", href: "/industries" },
      { label: "UAE", href: "/industries" },
      { label: "Oman", href: "/industries" },
      { label: "Turkey", href: "/industries" },
      { label: "Iraq", href: "/industries" },
      { label: "Kenya", href: "/industries" },
      { label: "Cameroon", href: "/industries" },
      { label: "Russia", href: "/industries" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About NEVO", href: "/about" },
      { label: "Quality Assurance", href: "/quality" },
      { label: "Sustainability & ESG", href: "/sustainability" },
      { label: "Research & Innovation", href: "/research-innovation" },
      { label: "Careers", href: "/careers" },
      { label: "Investor Relations", href: "/investors" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];


export function SiteFooter() {
  const { t } = useTranslation();
  const whatsappHref = SITE.contact.whatsapp ? WHATSAPP_URL : "/project-inquiry";

  const columnKeys: Record<string, string> = {
    Solutions: "footer.solutions",
    Industries: "footer.industries",
    Resources: "footer.resources",
    Markets: "footer.markets",
    Company: "footer.company",
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-wide section-y">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Company + contact */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-flex items-center" aria-label="NEVO Industrial home">
              <img
                src={nevoLogoLight}
                alt="NEVO Industrial"
                className="h-14 w-auto"
                loading="lazy"
                decoding="async"
              />
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
              {t("footer.description")}
            </p>

            <div className="mt-8 space-y-3 text-sm">
              <a
                href="mailto:solutions@nevoindustrial.com"
                className="flex items-center gap-3 text-primary-foreground/85 hover:text-primary-foreground"
              >
                <Mail
                  className="size-4 text-primary-foreground/50"
                  strokeWidth={1.75}
                />
                solutions@nevoindustrial.com
              </a>
              <a
                href={whatsappHref}
                className="flex items-center gap-3 text-primary-foreground/85 hover:text-primary-foreground"
              >
                <MessageCircle
                  className="size-4 text-primary-foreground/50"
                  strokeWidth={1.75}
                />
                {SITE.contact.whatsapp ? `WhatsApp · ${SITE.contact.whatsappDisplay}` : "Project Inquiry Center"}
              </a>
              <a
                href={SITE.contact.phoneHref}
                className="flex items-center gap-3 text-primary-foreground/85 hover:text-primary-foreground"
              >
                <Phone className="size-4 text-primary-foreground/50" strokeWidth={1.75} />
                {SITE.contact.phone}
              </a>
              <a
                href="https://www.linkedin.com/company/nevo-industrial"
                className="flex items-center gap-3 text-primary-foreground/85 hover:text-primary-foreground"
              >
                <Linkedin
                  className="size-4 text-primary-foreground/50"
                  strokeWidth={1.75}
                />
                LinkedIn
              </a>
              <div className="flex items-center gap-3 text-primary-foreground/85">
                <MapPin
                  className="size-4 text-primary-foreground/50"
                  strokeWidth={1.75}
                />
                Dubai, United Arab Emirates
              </div>
            </div>

            <a
              href="/project-inquiry"
              className="mt-8 inline-flex items-center gap-1.5 rounded-md border border-primary-foreground/25 px-4 py-2.5 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              {t("cta.startProject")}
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-primary-foreground/50">
                  {t(columnKeys[col.title] ?? "", col.title)}
                </div>
                <ul className="space-y-2.5">
                {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="text-sm text-primary-foreground/75 transition-colors hover:text-primary-foreground"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-primary-foreground/10 pt-8 text-xs text-primary-foreground/50">
          <div className="min-w-0 truncate">
            © {new Date().getFullYear()} NEVO Industrial. {t("footer.rights")}
          </div>
          <LanguageSwitcher variant="footer" />
          <div className="shrink-0 font-mono tracking-widest">
            NEVOINDUSTRIAL.COM · DUBAI · UAE
          </div>
        </div>
      </div>
    </footer>
  );
}
