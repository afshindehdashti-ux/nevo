import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Linkedin, MapPin } from "lucide-react";

const COLUMNS = [
  {
    title: "Solutions",
    links: [
      "Factory Development",
      "Engineering Consultancy",
      "Raw Materials",
      "Production Lines",
      "Finished Panels",
      "Technical Support",
    ],
  },
  {
    title: "Resources",
    links: ["Knowledge Hub", "Technical Library", "Downloads", "Case Studies", "FAQ"],
  },
  {
    title: "Markets",
    links: [
      "Saudi Arabia",
      "UAE",
      "Oman",
      "Turkey",
      "Iraq",
      "Kenya",
      "Cameroon",
      "Russia",
    ],
  },
  {
    title: "Company",
    links: ["About NEVO", "Why NEVO", "Dubai Advantage", "Global Network", "Contact"],
  },
];

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-border bg-surface">
      <div className="container-wide py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tighter text-foreground">
                NEVO
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Industrial
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              NEVO is a Dubai-based Industrial Engineering &amp; Supply company
              specialized in sandwich panel solutions.
            </p>

            <div className="mt-8 space-y-3 text-sm">
              <a
                href="mailto:solutions@nevoindustrial.com"
                className="flex items-center gap-2.5 text-foreground/80 hover:text-foreground"
              >
                <Mail className="size-4 text-muted-foreground" strokeWidth={1.75} />
                solutions@nevoindustrial.com
              </a>
              <a
                href="https://wa.me/9710000000000"
                className="flex items-center gap-2.5 text-foreground/80 hover:text-foreground"
              >
                <MessageCircle
                  className="size-4 text-muted-foreground"
                  strokeWidth={1.75}
                />
                WhatsApp Engineering Desk
              </a>
              <a
                href="#"
                className="flex items-center gap-2.5 text-foreground/80 hover:text-foreground"
              >
                <Linkedin className="size-4 text-muted-foreground" strokeWidth={1.75} />
                LinkedIn
              </a>
              <div className="flex items-center gap-2.5 text-foreground/80">
                <MapPin className="size-4 text-muted-foreground" strokeWidth={1.75} />
                Dubai, United Arab Emirates
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <div className="eyebrow mb-4">{col.title}</div>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-sm text-foreground/70 transition-colors hover:text-foreground"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>&copy; {new Date().getFullYear()} NEVO Industrial. All rights reserved.</div>
          <div className="font-mono tracking-wider">
            NEVOINDUSTRIAL.COM · DUBAI · UAE
          </div>
        </div>
      </div>
    </footer>
  );
}
