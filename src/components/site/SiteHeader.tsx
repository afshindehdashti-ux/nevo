import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu,
  X,
  ArrowUpRight,
  ArrowRight,
  Search,
  MapPin,
  Globe2,
  MessageCircle,
  Factory,
  Cog,
  Layers,
  PackageSearch,
  LifeBuoy,
  Wrench,
  Snowflake,
  UtensilsCrossed,
  Building2,
  ShieldCheck,
  Warehouse,
  Building,
  Boxes,
  Sprout,
  BookOpen,
  Library,
  Download,
  FileText,
  HelpCircle,
  LineChart,
  ScrollText,
  Calculator,
  
  Handshake,
  Briefcase,
  Mail,
  Compass,
  Network,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import nevoLogoDark from "@/assets/nevo-logo-dark.png";
import nevoLogoLight from "@/assets/nevo-logo-light.png";

/* ─────────────────────────────────────────────────────────────
   Navigation model
   ───────────────────────────────────────────────────────────── */

type NavItem = {
  label: string;
  desc?: string;
  icon?: LucideIcon;
  href?: string;
};

type Featured = {
  eyebrow: string;
  title: string;
  desc: string;
  href: string;
};

type MenuGroup = {
  label: string;
  items: NavItem[];
  featured?: Featured;
  layout?: "cards" | "grid" | "list" | "markets";
  width?: "md" | "lg" | "xl";
};

const SOLUTIONS: MenuGroup = {
  label: "Solutions",
  layout: "cards",
  width: "xl",
  items: [
    { label: "Factory Development", desc: "Feasibility, layout, commissioning.", icon: Factory, href: "/solutions/factory-development" },
    { label: "Engineering Consultancy", desc: "Process design & optimization.", icon: Cog, href: "/solutions/engineering-consultancy" },
    { label: "Production Lines", desc: "Continuous, discontinuous, roll forming.", icon: Wrench, href: "/solutions/production-lines" },
    { label: "Raw Materials", desc: "PIR, PUR, PPGI, GI, rock wool, adhesives.", icon: PackageSearch, href: "/solutions/raw-materials" },
    { label: "Finished Panels", desc: "Premium sandwich panels, delivered.", icon: Layers, href: "/solutions/sandwich-panels" },
    { label: "AI Engineering Assistant", desc: "Calculators, estimators and guided scoping.", icon: LifeBuoy, href: "/ai-assistant" },
  ],
  featured: {
    eyebrow: "Featured service",
    title: "Turnkey Factory Development",
    desc: "From feasibility study to first production run — engineered end-to-end.",
    href: "/solutions/factory-development",
  },
};

const INDUSTRIES: MenuGroup = {
  label: "Industries",
  layout: "grid",
  width: "lg",
  items: [
    { label: "Cold Storage", icon: Snowflake, href: "/industries" },
    { label: "Food Processing", icon: UtensilsCrossed, href: "/industries" },
    { label: "Industrial Buildings", icon: Building2, href: "/industries" },
    { label: "Clean Rooms", icon: ShieldCheck, href: "/industries" },
    { label: "Warehousing", icon: Warehouse, href: "/industries" },
    { label: "Commercial Buildings", icon: Building, href: "/industries" },
    { label: "Modular Buildings", icon: Boxes, href: "/industries" },
    { label: "Agriculture", icon: Sprout, href: "/industries" },
  ],
};

const KNOWLEDGE: MenuGroup = {
  label: "Knowledge",
  layout: "list",
  width: "xl",
  items: [
    { label: "Engineering Articles", desc: "Deep technical writing from our engineers.", icon: BookOpen, href: "/knowledge" },
    { label: "Technical Library", desc: "Specs, datasheets, drawings.", icon: Library, href: "/knowledge" },
    { label: "Downloads", desc: "Brochures, catalogues, PDFs.", icon: Download, href: "/knowledge" },
    { label: "Case Studies", desc: "Factories built with NEVO.", icon: FileText, href: "/knowledge" },
    { label: "FAQ", desc: "Common industrial questions.", icon: HelpCircle, href: "/knowledge" },
    { label: "Investment Guides", desc: "Feasibility and CAPEX planning.", icon: LineChart, href: "/knowledge" },
    { label: "White Papers", desc: "Peer-reviewed engineering perspectives.", icon: ScrollText, href: "/knowledge" },
    { label: "Engineering Tools", desc: "Calculators, selectors, references.", icon: Calculator, href: "/ai-assistant" },
  ],
  featured: {
    eyebrow: "Latest article",
    title: "PIR vs PUR: choosing the right core in 2026",
    desc: "A structural, thermal and fire-performance comparison for cold storage.",
    href: "/knowledge",
  },
};

const MARKETS: MenuGroup = {
  label: "Markets",
  layout: "markets",
  width: "lg",
  items: [
    { label: "Saudi Arabia", href: "/industries" },
    { label: "UAE", href: "/industries" },
    { label: "Oman", href: "/industries" },
    { label: "Turkey", href: "/industries" },
    { label: "Iraq", href: "/industries" },
    { label: "Russia", href: "/industries" },
    { label: "Kenya", href: "/industries" },
    { label: "Cameroon", href: "/industries" },
    { label: "Africa", href: "/industries" },
  ],
};

const COMPANY: MenuGroup = {
  label: "Company",
  layout: "list",
  width: "md",
  items: [
    { label: "About NEVO", icon: Compass, href: "/about" },
    { label: "Why NEVO", icon: Sparkles, href: "/about" },
    { label: "Engineering Process", icon: Cog, href: "/solutions/engineering-consultancy" },
    { label: "Global Network", icon: Network, href: "/industries" },
    { label: "Project Inquiry", icon: Handshake, href: "/project-inquiry" },
    { label: "AI Engineering Assistant", icon: Briefcase, href: "/ai-assistant" },
    { label: "Contact", icon: Mail, href: "/project-inquiry" },
  ],
};

const NAV: MenuGroup[] = [SOLUTIONS, INDUSTRIES, KNOWLEDGE, MARKETS, COMPANY];

/* ─────────────────────────────────────────────────────────────
   Header
   ───────────────────────────────────────────────────────────── */

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open || searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenu(null);
        setSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const solid = scrolled || open || activeMenu !== null;

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-[250ms] ease-[var(--ease-out-quart)]",
          solid
            ? "border-b border-border/70 bg-white/95 shadow-[0_1px_0_0_rgba(15,20,25,0.04),0_8px_28px_-18px_rgba(15,20,25,0.18)] backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <UtilityBar solid={solid} />

        <header>
          <div className="container-wide flex h-[72px] items-center justify-between gap-6 px-5 sm:px-6 md:h-20 md:px-6 lg:h-[88px] lg:px-8">
            <Link to="/" className="relative flex items-center py-2" aria-label="NEVO Industrial home">
              <span className="relative block w-[165px] md:w-[180px] lg:w-[200px]">
                <img
                  src={nevoLogoDark}
                  alt="NEVO Industrial"
                  className={cn(
                    "block h-auto w-full transition-opacity duration-[250ms]",
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
                    "absolute inset-0 block h-auto w-full transition-opacity duration-[250ms]",
                    solid ? "opacity-0" : "opacity-100",
                  )}
                  loading="eager"
                  decoding="async"
                />
              </span>
            </Link>

            <nav
              className="hidden items-center gap-0.5 lg:flex"
              aria-label="Primary"
              onMouseLeave={() => setActiveMenu(null)}
            >
              <TopLink label="Home" href="/" onLight={!solid} onEnter={() => setActiveMenu(null)} />
              {NAV.map((group) => (
                <MegaTrigger
                  key={group.label}
                  group={group}
                  onLight={!solid}
                  active={activeMenu === group.label}
                  onEnter={() => setActiveMenu(group.label)}
                />
              ))}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className={cn(
                  "hidden size-10 items-center justify-center rounded-full transition-colors md:inline-flex",
                  solid ? "text-foreground/80 hover:bg-surface" : "text-white/85 hover:bg-white/10",
                )}
              >
                <Search className="size-[18px]" strokeWidth={1.75} />
              </button>

              <PrimaryCTA solid={solid} />

              <button
                aria-label={open ? "Close menu" : "Open menu"}
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-md transition-colors lg:hidden",
                  solid ? "text-foreground hover:bg-surface" : "text-white hover:bg-white/10",
                )}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="size-6" strokeWidth={1.75} /> : <Menu className="size-6" strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          {/* Desktop mega-panel */}
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-full hidden lg:block",
              activeMenu ? "pointer-events-auto" : "",
            )}
          >
            {NAV.map((group) => (
              <MegaPanel
                key={group.label}
                group={group}
                open={activeMenu === group.label}
                onClose={() => setActiveMenu(null)}
              />
            ))}
          </div>
        </header>
      </div>

      {open && <MobileMenu onClose={() => setOpen(false)} onOpenSearch={() => { setOpen(false); setSearchOpen(true); }} />}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Utility bar
   ───────────────────────────────────────────────────────────── */

function UtilityBar({ solid }: { solid: boolean }) {
  return (
    <div
      className={cn(
        "hidden border-b transition-colors duration-[250ms] md:block",
        solid ? "border-border/60 bg-surface/60 text-foreground/70" : "border-white/10 bg-black/20 text-white/75",
      )}
    >
      <div className="container-wide flex h-9 items-center justify-between gap-6 px-6 text-[11px] font-medium tracking-wide lg:px-8">
        <div className="flex items-center gap-5">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 opacity-80" strokeWidth={1.75} />
            Dubai, UAE
          </span>
          <span className={cn("hidden h-3 w-px", solid ? "bg-border" : "bg-white/20")} aria-hidden />
          <span className="hidden lg:inline">Engineering &amp; Industrial Supply</span>
          <span className={cn("hidden h-3 w-px lg:block", solid ? "bg-border" : "bg-white/20")} aria-hidden />
          <span className="hidden lg:inline-flex items-center gap-1.5">
            <Globe2 className="size-3.5 opacity-80" strokeWidth={1.75} />
            Worldwide Projects
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://wa.me/"
            className={cn(
              "inline-flex items-center gap-1.5 transition-colors",
              solid ? "hover:text-foreground" : "hover:text-white",
            )}
          >
            <MessageCircle className="size-3.5" strokeWidth={1.75} />
            WhatsApp
          </a>
          <button
            className={cn(
              "inline-flex items-center gap-1.5 transition-colors",
              solid ? "hover:text-foreground" : "hover:text-white",
            )}
          >
            EN
            <ChevronRight className="size-3 rotate-90 opacity-60" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Top-level links & triggers
   ───────────────────────────────────────────────────────────── */

function topLinkClasses(onLight: boolean) {
  return cn(
    "relative inline-flex h-9 items-center gap-1 rounded-md px-3 text-[13px] font-medium tracking-tight transition-colors",
    "after:pointer-events-none after:absolute after:inset-x-3 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-[color:var(--accent)] after:transition-transform after:duration-[220ms]",
    onLight
      ? "text-white/85 hover:text-white hover:after:scale-x-100"
      : "text-foreground/75 hover:text-foreground hover:after:scale-x-100",
  );
}

function TopLink({
  label,
  href,
  onLight,
  onEnter,
}: {
  label: string;
  href: string;
  onLight: boolean;
  onEnter: () => void;
}) {
  return (
    <Link to={href} className={topLinkClasses(onLight)} onMouseEnter={onEnter}>
      {label}
    </Link>
  );
}

function MegaTrigger({
  group,
  onLight,
  active,
  onEnter,
}: {
  group: MenuGroup;
  onLight: boolean;
  active: boolean;
  onEnter: () => void;
}) {
  return (
    <button
      className={cn(
        topLinkClasses(onLight),
        active && (onLight ? "text-white after:scale-x-100" : "text-foreground after:scale-x-100"),
      )}
      onMouseEnter={onEnter}
      onFocus={onEnter}
    >
      {group.label}
    </button>
  );
}

function PrimaryCTA({ solid }: { solid: boolean }) {
  return (
    <a
      href="/project-inquiry"
      className={cn(
        "group relative hidden overflow-hidden rounded-lg px-4 py-2.5 text-[13px] font-medium tracking-tight transition-all duration-[220ms] sm:inline-flex sm:items-center sm:gap-1.5",
        solid
          ? "bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_rgba(15,20,25,0.4)]"
          : "bg-white text-primary hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]",
      )}
    >
      <span className="relative z-10">Start Your Project</span>
      <ArrowUpRight className="relative z-10 size-3.5 transition-transform duration-[220ms] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
      <span
        aria-hidden
        className="absolute inset-x-4 bottom-1 h-px origin-left scale-x-0 bg-[color:var(--accent)] transition-transform duration-[260ms] group-hover:scale-x-100"
      />
    </a>
  );
}

/* ─────────────────────────────────────────────────────────────
   Mega Panels
   ───────────────────────────────────────────────────────────── */

function MegaPanel({
  group,
  open,
  onClose,
}: {
  group: MenuGroup;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "border-b border-border/70 bg-white shadow-[0_20px_40px_-24px_rgba(15,20,25,0.18)] transition-all duration-[220ms] ease-[var(--ease-out-quart)]",
        open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
      )}
      onMouseLeave={onClose}
    >
      <div className="container-wide px-6 py-10 lg:px-8">
        {group.layout === "cards" && <CardsLayout group={group} />}
        {group.layout === "grid" && <GridLayout group={group} />}
        {group.layout === "list" && <ListLayout group={group} />}
        {group.layout === "markets" && <MarketsLayout group={group} />}
      </div>
    </div>
  );
}

function EyebrowRow({ label }: { label: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="h-px flex-1 bg-border/70" />
    </div>
  );
}

function CardsLayout({ group }: { group: MenuGroup }) {
  return (
    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-8">
        <EyebrowRow label="What we do" />
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
          {group.items.map((item) => (
            <li key={item.label}>
              <a
                href={item.href ?? "/project-inquiry"}
                className="group flex items-start gap-3 rounded-xl border border-transparent p-3.5 transition-all hover:border-border hover:bg-surface/60"
              >
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-white text-foreground transition-colors group-hover:border-[color:var(--accent)] group-hover:text-[color:var(--accent)]">
                  {item.icon ? <item.icon className="size-[18px]" strokeWidth={1.6} /> : null}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-[14px] font-semibold tracking-tight text-foreground">
                    {item.label}
                    <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" strokeWidth={2} />
                  </span>
                  {item.desc && (
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
                      {item.desc}
                    </span>
                  )}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      {group.featured && <FeaturedCard featured={group.featured} tone="dark" />}
    </div>
  );
}

function GridLayout({ group }: { group: MenuGroup }) {
  return (
    <div>
      <EyebrowRow label="Industries we engineer for" />
      <ul className="grid grid-cols-4 gap-2">
        {group.items.map((item) => (
          <li key={item.label}>
            <a
              href="#"
              className="group flex flex-col items-start gap-3 rounded-xl border border-transparent p-4 transition-all hover:border-border hover:bg-surface/60"
            >
              <span className="grid size-10 place-items-center rounded-lg border border-border bg-white transition-colors group-hover:border-[color:var(--accent)] group-hover:text-[color:var(--accent)]">
                {item.icon ? <item.icon className="size-[18px]" strokeWidth={1.6} /> : null}
              </span>
              <span className="text-[13.5px] font-medium tracking-tight text-foreground">
                {item.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListLayout({ group }: { group: MenuGroup }) {
  const hasFeatured = !!group.featured;
  return (
    <div className={cn("grid gap-8", hasFeatured ? "grid-cols-12" : "grid-cols-1")}>
      <div className={hasFeatured ? "col-span-8" : "col-span-12"}>
        <EyebrowRow label={group.label === "Company" ? "About NEVO" : "Learn & explore"} />
        <ul
          className={cn(
            "grid gap-x-6 gap-y-1",
            hasFeatured ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2",
          )}
        >
          {group.items.map((item) => (
            <li key={item.label}>
              <a
                href={item.href ?? "/industries"}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface/70"
              >
                {item.icon && (
                  <span className="grid size-8 shrink-0 place-items-center rounded-md text-foreground/70 transition-colors group-hover:text-[color:var(--accent)]">
                    <item.icon className="size-[16px]" strokeWidth={1.6} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium tracking-tight text-foreground">
                    {item.label}
                  </span>
                  {item.desc && (
                    <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                      {item.desc}
                    </span>
                  )}
                </span>
                <ArrowRight className="size-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" strokeWidth={2} />
              </a>
            </li>
          ))}
        </ul>
      </div>
      {group.featured && <FeaturedCard featured={group.featured} tone="light" />}
    </div>
  );
}

function MarketsLayout({ group }: { group: MenuGroup }) {
  return (
    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-7">
        <EyebrowRow label="Delivered worldwide" />
        <ul className="grid grid-cols-3 gap-x-6 gap-y-1">
          {group.items.map((item) => (
            <li key={item.label}>
              <a
                href={item.href ?? "/knowledge"}
                className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-surface/70"
              >
                <span className="inline-flex items-center gap-2 text-[13.5px] font-medium tracking-tight text-foreground">
                  <MapPin className="size-3.5 text-[color:var(--accent)]" strokeWidth={2} />
                  {item.label}
                </span>
                <ArrowRight className="size-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" strokeWidth={2} />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="col-span-5">
        <MapPreview />
      </div>
    </div>
  );
}

function MapPreview() {
  // Minimal decorative dot-grid map preview.
  const dots = useMemo(() => {
    const arr: { x: number; y: number }[] = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 22; x++) {
        arr.push({ x: 8 + x * 10, y: 8 + y * 10 });
      }
    }
    return arr;
  }, []);
  const pins = [
    { x: 128, y: 45 }, // Turkey
    { x: 138, y: 55 }, // KSA / UAE
    { x: 165, y: 40 }, // Russia
    { x: 150, y: 78 }, // Kenya
    { x: 128, y: 82 }, // Cameroon
  ];
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-[color:var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Global network
        </span>
        <span className="text-[11px] font-medium text-foreground">8+ markets</span>
      </div>
      <svg viewBox="0 0 236 108" className="block h-auto w-full">
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="0.9" className="fill-foreground/10" />
        ))}
        {pins.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4.5" className="fill-[color:var(--accent)]/20" />
            <circle cx={p.x} cy={p.y} r="1.8" className="fill-[color:var(--accent)]" />
          </g>
        ))}
      </svg>
    </div>
  );
}

function FeaturedCard({ featured, tone }: { featured: Featured; tone: "dark" | "light" }) {
  return (
    <a
      href={featured.href}
      className={cn(
        "group col-span-4 flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all",
        tone === "dark"
          ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
          : "border border-border bg-surface/60 text-foreground",
      )}
    >
      <div>
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.18em]",
            tone === "dark" ? "text-white/60" : "text-muted-foreground",
          )}
        >
          {featured.eyebrow}
        </span>
        <h4 className="mt-4 text-[18px] font-semibold leading-snug tracking-tight">
          {featured.title}
        </h4>
        <p
          className={cn(
            "mt-2 text-[13px] leading-relaxed",
            tone === "dark" ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {featured.desc}
        </p>
      </div>
      <div
        className={cn(
          "mt-6 inline-flex items-center gap-1.5 text-[12.5px] font-medium",
          tone === "dark" ? "text-white" : "text-foreground",
        )}
      >
        <span
          className={cn(
            "h-px w-6 transition-all group-hover:w-10",
            tone === "dark" ? "bg-[color:var(--accent)]" : "bg-[color:var(--accent)]",
          )}
        />
        Explore
        <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
      </div>
    </a>
  );
}

/* ─────────────────────────────────────────────────────────────
   Search overlay
   ───────────────────────────────────────────────────────────── */

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const suggestions = [
    "PIR sandwich panel specifications",
    "Cold storage factory feasibility",
    "Continuous production line commissioning",
    "PPGI coil sourcing — GCC",
    "Clean room panel jointing details",
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 backdrop-blur-sm">
      <button className="absolute inset-0" aria-label="Close search" onClick={onClose} />
      <div className="relative mt-24 w-full max-w-2xl rounded-2xl border border-border bg-background shadow-panel-lg">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="size-[18px] text-muted-foreground" strokeWidth={1.75} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search engineering knowledge..."
            className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>
        <div className="px-5 py-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Suggested
          </div>
          <ul className="grid gap-0.5">
            {suggestions
              .filter((s) => (q ? s.toLowerCase().includes(q.toLowerCase()) : true))
              .map((s) => (
                <li key={s}>
                  <button className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13.5px] text-foreground hover:bg-surface/70">
                    <span className="inline-flex items-center gap-2">
                      <Search className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                      {s}
                    </span>
                    <ArrowRight className="size-3.5 text-muted-foreground" strokeWidth={2} />
                  </button>
                </li>
              ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            {["Articles", "Downloads", "Products", "Services", "Markets", "Case Studies", "FAQ"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground/70"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Mobile menu — independent, fullscreen
   ───────────────────────────────────────────────────────────── */

function MobileMenu({ onClose, onOpenSearch }: { onClose: () => void; onOpenSearch: () => void }) {
  const sections: { label: string; items: NavItem[] }[] = [
    { label: "Solutions", items: SOLUTIONS.items },
    { label: "Industries", items: INDUSTRIES.items },
    { label: "Knowledge", items: KNOWLEDGE.items.slice(0, 6) },
    { label: "Markets", items: MARKETS.items },
    { label: "Company", items: COMPANY.items },
  ];

  return (
    <div className="fixed inset-0 top-[72px] z-40 flex flex-col bg-background lg:hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="border-b border-border px-5 py-4">
        <button
          onClick={onOpenSearch}
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 text-left text-[14px] text-muted-foreground"
        >
          <Search className="size-[18px]" strokeWidth={1.75} />
          Search engineering knowledge...
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 pt-2">
        <div className="mb-6 mt-4">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Popular solutions
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Factory Development", href: "/solutions/factory-development" },
              { label: "Production Lines", href: "/solutions/production-lines" },
              { label: "Sandwich Panels", href: "/solutions/sandwich-panels" },
              { label: "Cold Storage", href: "/industries" },
            ].map((t) => (
              <a
                key={t.label}
                href={t.href}
                className="rounded-full border border-border px-3 py-1.5 text-[12.5px] font-medium text-foreground"
                onClick={onClose}
              >
                {t.label}
              </a>
            ))}
          </div>
        </div>

        {sections.map((section) => (
          <details
            key={section.label}
            className="group border-b border-border py-2"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-[18px] font-semibold tracking-tight text-foreground">
              {section.label}
              <ChevronRight className="size-5 transition-transform group-open:rotate-90" strokeWidth={1.75} />
            </summary>
            <ul className="grid gap-0.5 pb-3">
              {section.items.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href ?? "/knowledge"}
                    className="flex items-center gap-3 rounded-lg px-2 py-3 text-[15px] text-foreground/85"
                    onClick={onClose}
                  >
                    {item.icon && (
                      <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border">
                        <item.icon className="size-[16px]" strokeWidth={1.6} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">{item.label}</span>
                    <ArrowRight className="size-4 text-muted-foreground" strokeWidth={1.75} />
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ))}

        <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Recent resources
          </div>
          <ul className="mt-3 grid gap-2">
            {[
              { label: "PIR vs PUR: choosing the right core", href: "/knowledge" },
              { label: "CAPEX guide for a 50k m² factory", href: "/solutions/factory-development" },
              { label: "Continuous line commissioning checklist", href: "/solutions/production-lines" },
            ].map(
              (t) => (
                <li key={t.label}>
                  <a href={t.href} className="flex items-start justify-between gap-3 py-1.5 text-[14px] text-foreground" onClick={onClose}>
                    <span className="min-w-0 flex-1">{t.label}</span>
                    <ArrowUpRight className="mt-0.5 size-4 text-muted-foreground" strokeWidth={1.75} />
                  </a>
                </li>
              ),
            )}
          </ul>
        </div>

        <Button asChild variant="primary" size="lg" className="mt-6 h-14 w-full text-[15px]">
          <a href="/project-inquiry" onClick={onClose}>
            Start Your Project
            <ArrowUpRight className="!size-4" />
          </a>
        </Button>

        <div className="mt-6 flex items-center justify-between text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" strokeWidth={1.75} /> Dubai, UAE
          </span>
          <a href="https://wa.me/" className="inline-flex items-center gap-1.5">
            <MessageCircle className="size-3.5" strokeWidth={1.75} /> WhatsApp
          </a>
          <span>EN</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Breadcrumbs (exported for internal pages)
   ───────────────────────────────────────────────────────────── */

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-border bg-surface/40">
      <ol className="container-wide flex flex-wrap items-center gap-1.5 px-6 py-3 text-[12.5px] text-muted-foreground lg:px-8">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="inline-flex items-center gap-1.5">
              {item.href && !last ? (
                <a href={item.href} className="hover:text-foreground">
                  {item.label}
                </a>
              ) : (
                <span className={cn(last && "text-foreground")}>{item.label}</span>
              )}
              {!last && <ChevronRight className="size-3 opacity-60" strokeWidth={2} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
