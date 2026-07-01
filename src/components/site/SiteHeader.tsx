import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import nevoLogoDark from "@/assets/nevo-logo-dark.png";
import nevoLogoLight from "@/assets/nevo-logo-light.png";

type MenuGroup = {
  label: string;
  items: { label: string; desc?: string }[];
  cols?: 1 | 2;
};

const NAV: MenuGroup[] = [
  {
    label: "Solutions",
    cols: 2,
    items: [
      { label: "Factory Development", desc: "Feasibility, layout, commissioning for new factories." },
      { label: "Engineering Consultancy", desc: "Process design, optimization, technical consulting." },
      { label: "Raw Material Solutions", desc: "PIR, PUR, PPGI, GI, Aluzinc, rock wool, adhesives." },
      { label: "Production Line Solutions", desc: "Continuous & discontinuous lines, roll forming, automation." },
      { label: "Finished Panel Solutions", desc: "Supply of finished panels across regional markets." },
      { label: "Technical Support", desc: "Training, spare parts, audits, troubleshooting." },
    ],
  },
  {
    label: "Industries",
    cols: 2,
    items: [
      { label: "Cold Storage" },
      { label: "Food Processing" },
      { label: "Pharmaceutical" },
      { label: "Clean Rooms" },
      { label: "Warehousing & Logistics" },
      { label: "Industrial Buildings" },
      { label: "Modular Buildings" },
      { label: "Commercial Construction" },
    ],
  },
  {
    label: "Resources",
    cols: 1,
    items: [
      { label: "Knowledge Hub", desc: "Guides, technical notes and thought leadership." },
      { label: "Technical Library", desc: "Specs, datasheets, drawings and references." },
      { label: "Downloads", desc: "Brochures, catalogues and technical PDFs." },
      { label: "Case Studies", desc: "Factories built and modernized with NEVO." },
      { label: "FAQ", desc: "Common questions across all solutions." },
    ],
  },
  {
    label: "Markets",
    cols: 2,
    items: [
      { label: "Saudi Arabia" }, { label: "Oman" }, { label: "UAE" },
      { label: "Turkey" }, { label: "Iraq" }, { label: "Kenya" },
      { label: "Cameroon" }, { label: "Russia" }, { label: "Africa" },
    ],
  },
  {
    label: "Company",
    cols: 1,
    items: [
      { label: "About NEVO" }, { label: "Why NEVO" },
      { label: "Dubai Advantage" }, { label: "Global Network" }, { label: "Contact" },
    ],
  },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // When menu is open on mobile, force the solid state for legibility.
  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ease-[var(--ease-out-quart)]",
        solid
          ? "border-b border-border bg-background/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-wide flex h-24 items-center justify-between gap-6 px-5 sm:px-6 md:h-28 md:px-6 lg:px-8">
        <Link
          to="/"
          className="relative flex items-center py-2"
          aria-label="NEVO Industrial home"
        >
          {/* Locked widths per spec: 165px mobile · 180px tablet · 200px desktop */}
          <span className="relative block w-[165px] md:w-[180px] lg:w-[200px]">
            <img
              src={nevoLogoDark}
              alt="NEVO Industrial"
              className={cn(
                "block h-auto w-full transition-opacity duration-300",
                solid ? "opacity-100" : "opacity-0",
              )}
              loading="eager"
              decoding="async"
            />
            <img
              src={nevoLogoLight}
              alt=""
              aria-hidden="true"
              className={cn(
                "absolute inset-0 block h-auto w-full transition-opacity duration-300",
                solid ? "opacity-0" : "opacity-100",
              )}
              loading="eager"
              decoding="async"
            />
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Primary"
          data-tone={solid ? "dark" : "light"}
        >
          {NAV.map((group) => (
            <MegaMenu key={group.label} group={group} onLight={!solid} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className={cn(
              "hidden transition-colors sm:inline-flex",
              solid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-white text-primary hover:bg-white/90",
            )}
          >
            <a href="#contact">
              Start Your Project
              <ArrowUpRight className="!size-3.5" />
            </a>
          </Button>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            className={cn(
              "inline-flex size-12 items-center justify-center rounded-md transition-colors lg:hidden",
              solid ? "text-foreground hover:bg-surface" : "text-white hover:bg-white/10",
            )}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6" strokeWidth={1.75} /> : <Menu className="size-6" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {open && <MobileMenu onClose={() => setOpen(false)} />}
    </header>
  );
}

function MegaMenu({ group, onLight }: { group: MenuGroup; onLight: boolean }) {
  const panelWidth = group.cols === 2 ? "min-w-[560px]" : "min-w-[280px]";
  return (
    <div className="group relative">
      <button
        className={cn(
          "flex items-center gap-1 rounded-md px-3.5 py-2 text-[13px] font-medium tracking-tight transition-colors",
          onLight
            ? "text-white/85 hover:bg-white/10 hover:text-white"
            : "text-foreground/80 hover:bg-surface hover:text-foreground",
        )}
      >
        {group.label}
        <ChevronDown
          className="size-3.5 opacity-60 transition-transform group-hover:rotate-180"
          strokeWidth={2}
        />
      </button>
      <div
        className={cn(
          "invisible absolute left-1/2 top-full z-40 -translate-x-1/2 translate-y-1 opacity-0",
          "transition-all duration-[var(--duration-base)] ease-[var(--ease-out-quart)]",
          "group-hover:visible group-hover:translate-y-0 group-hover:opacity-100",
          "pt-2",
        )}
      >
        <div
          className={cn(
            "rounded-xl border border-border bg-popover p-3 shadow-panel-lg",
            panelWidth,
          )}
        >
          <ul
            className={cn(
              "grid gap-1",
              group.cols === 2 ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            {group.items.map((item) => (
              <li key={item.label}>
                <a
                  href="#"
                  className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-surface"
                >
                  <div className="text-sm font-medium text-foreground">
                    {item.label}
                  </div>
                  {item.desc ? (
                    <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {item.desc}
                    </div>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="border-t border-border bg-background lg:hidden">
      <div className="container-wide max-h-[80vh] overflow-y-auto py-4">
        {NAV.map((group) => (
          <div
            key={group.label}
            className="border-b border-border py-3 last:border-0"
          >
            <div className="eyebrow mb-2">{group.label}</div>
            <ul className="grid gap-1">
              {group.items.map((item) => (
                <li key={item.label}>
                  <a
                    href="#"
                    className="block py-1.5 text-sm text-foreground/85"
                    onClick={onClose}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Button asChild variant="primary" size="lg" className="mt-5 w-full">
          <a href="#contact" onClick={onClose}>
            Start Your Project
            <ArrowUpRight className="!size-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}
