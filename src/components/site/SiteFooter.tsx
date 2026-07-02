import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Linkedin, MapPin, ArrowUpRight } from "lucide-react";
import nevoLogoLight from "@/assets/nevo-logo-light.png";

const COLUMNS = [
  {
    title: "Solutions",
    links: [
      { label: "Factory Development", href: "/solutions/factory-development" },
      { label: "Engineering Consultancy", href: "/solutions/engineering-consultancy" },
      { label: "Raw Materials", href: "/solutions/raw-materials" },
      { label: "Production Lines", href: "/solutions/production-lines" },
      { label: "Finished Panels", href: "/solutions/sandwich-panels" },
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
      { label: "Knowledge Hub", href: "/knowledge" },
      { label: "Technical Library", href: "/knowledge" },
      { label: "Downloads", href: "/knowledge" },
      { label: "Case Studies", href: "/knowledge" },
      { label: "Project Inquiry", href: "/project-inquiry" },
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
      { label: "Why NEVO", href: "/about" },
      { label: "Dubai Advantage", href: "/about" },
      { label: "Global Network", href: "/industries" },
      { label: "Contact", href: "/project-inquiry" },
    ],
  },
];

export function SiteFooter() {
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
              NEVO is a Dubai-based Industrial Engineering &amp; Supply company
              specialized in sandwich panel solutions.
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
                href="https://wa.me/9710000000000"
                className="flex items-center gap-3 text-primary-foreground/85 hover:text-primary-foreground"
              >
                <MessageCircle
                  className="size-4 text-primary-foreground/50"
                  strokeWidth={1.75}
                />
                WhatsApp Engineering Desk
              </a>
              <a
                href="#"
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
              href="#contact"
              className="mt-8 inline-flex items-center gap-1.5 rounded-md border border-primary-foreground/25 px-4 py-2.5 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Start Your Project
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-primary-foreground/50">
                  {col.title}
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

        <div className="mt-16 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-primary-foreground/10 pt-8 text-xs text-primary-foreground/50 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0 truncate">
            © {new Date().getFullYear()} NEVO Industrial. All rights reserved.
          </div>
          <div className="shrink-0 font-mono tracking-widest">
            NEVOINDUSTRIAL.COM · DUBAI · UAE
          </div>
        </div>
      </div>
    </footer>
  );
}
