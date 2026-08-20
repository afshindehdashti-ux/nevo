import { useNavigate } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { localizeNavLabel } from "@/i18n/nav-labels";
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
import { SITE, WHATSAPP_URL } from "@/lib/seo";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { logClientEvent } from "@/lib/client-monitor";
import { LOGO_TELEMETRY_CONFIG } from "@/lib/logo-telemetry-config";
import nevoLogoLight from "@/assets/nevo-logo-light.png";
import nevoLogoFullPointer from "@/assets/nevo-logo-full.png.asset.json";

/**
 * Defensive logo fallback chain.
 * 1) Primary: bundled white/green light logo (nevo-logo-light.png).
 * 2) Fallback A: CDN-hosted full logo pointer (independent origin — survives
 *    a bundle/cache miss on the primary asset).
 * 3) Fallback B: inline SVG data-URI rendering "NEVO" in white with a green
 *    triangle accent. Zero network dependency — guarantees the sticky header
 *    stays readable even if both PNGs fail to load.
 */
const LOGO_FALLBACK_CDN = nevoLogoFullPointer.url;
const LOGO_FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" role="img" aria-label="NEVO Industrial">
      <polygon points="18,86 46,30 74,86" fill="#22c55e"/>
      <text x="92" y="78" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="72" fill="#ffffff" letter-spacing="2">NEVO</text>
      <text x="94" y="106" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="18" fill="#22c55e" letter-spacing="6">INDUSTRIAL</text>
    </svg>`,
  );

/**
 * Per-session correlation ID for header logo telemetry.
 *
 * Stored in sessionStorage (per tab) so every `header.logo.render` and
 * `header.logo.error` event fired during a single page/tab session shares
 * the same ID — letting us trace an end-to-end fallback chain in the log
 * sink even when multiple errors and one render event arrive out of order.
 */
const LOGO_CID_KEY = "__nevoLogoCid";
function getLogoCorrelationId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = window.sessionStorage.getItem(LOGO_CID_KEY);
    if (existing) return existing;
    const cid =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `cid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(LOGO_CID_KEY, cid);
    return cid;
  } catch {
    // sessionStorage blocked (private mode, cookie policy) — fall back to
    // a per-tab in-memory ID hung off window so events still correlate.
    const w = window as unknown as Record<string, string | undefined>;
    if (!w[LOGO_CID_KEY]) {
      w[LOGO_CID_KEY] =
        `cid-mem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }
    return w[LOGO_CID_KEY]!;
  }
}

/**
 * Client-side rate limiting + sampling for header logo telemetry.
 *
 * Goals: keep production log volume tiny while preserving signal.
 *  - Render events are high-volume (every page load) → sampled per session.
 *    Only one render event per tab session.
 *  - Error events are rare and high-value → always sampled, but capped per
 *    session and throttled per-stage so a broken CDN can't flood the sink.
 *  - Terminal SVG-fallback errors bypass the per-stage throttle (still
 *    capped) so we never miss a total-outage signal.
 *
 * The three knobs below are read from Vite env vars at build time via
 * `LOGO_TELEMETRY_CONFIG`, so ops can retune sampling per environment
 * without touching component code. See `src/lib/logo-telemetry-config.ts`.
 */
import { shouldLogRender, shouldLogError } from "@/lib/logo-telemetry";
import { withLogoEventSchema } from "@/lib/logo-event-schema";

const LOGO_RENDER_SAMPLE_RATE = LOGO_TELEMETRY_CONFIG.renderSampleRate;

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
    {
      label: "Factory Development",
      desc: "Feasibility, layout, commissioning.",
      icon: Factory,
      href: "/solutions/factory-development",
    },
    {
      label: "Engineering Consultancy",
      desc: "Process design & optimization.",
      icon: Cog,
      href: "/solutions/engineering-consultancy",
    },
    {
      label: "Production Lines",
      desc: "Continuous, discontinuous, roll forming.",
      icon: Wrench,
      href: "/solutions/production-lines",
    },
    {
      label: "Raw Materials",
      desc: "PIR, PUR, PPGI, GI, rock wool, adhesives.",
      icon: PackageSearch,
      href: "/solutions/raw-materials",
    },
    {
      label: "Finished Panels",
      desc: "Premium sandwich panels, delivered.",
      icon: Layers,
      href: "/solutions/sandwich-panels",
    },
    {
      label: "Panel Configurator",
      desc: "Configure panels in 3D with live engineering results.",
      icon: Boxes,
      href: "/product-configurator",
    },
    {
      label: "Panel Thickness Calculator",
      desc: "Recommend the correct panel thickness by application, climate & fire.",
      icon: Calculator,
      href: "/panel-thickness-calculator",
    },
    {
      label: "Factory Layout Generator",
      desc: "Design your sandwich panel factory — capacity, core, automation, utilities.",
      icon: Factory,
      href: "/factory-layout-generator",
    },
    {
      label: "AI Engineering Assistant",
      desc: "Calculators, estimators and guided scoping.",
      icon: LifeBuoy,
      href: "/ai-assistant",
    },
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
    {
      label: "Engineering Articles",
      desc: "Deep technical writing from our engineers.",
      icon: BookOpen,
      href: "/knowledge-hub",
    },
    {
      label: "Technical Library",
      desc: "Specs, datasheets, drawings.",
      icon: Library,
      href: "/download-center",
    },
    {
      label: "Download Center",
      desc: "Engineering guides, catalogs, datasheets.",
      icon: Download,
      href: "/download-center",
    },
    {
      label: "Case Studies",
      desc: "Factories built with NEVO.",
      icon: FileText,
      href: "/factory-layouts",
    },
    {
      label: "FAQ",
      desc: "Common industrial questions.",
      icon: HelpCircle,
      href: "/knowledge-hub",
    },
    {
      label: "Investment Guides",
      desc: "Feasibility and CAPEX planning.",
      icon: LineChart,
      href: "/knowledge-hub",
    },
    {
      label: "Investment Calculator",
      desc: "Model CAPEX, OPEX, ROI, IRR & payback.",
      icon: Calculator,
      href: "/investment-calculator",
    },
    {
      label: "AI Project Estimator",
      desc: "Instant AI feasibility: investment, utilities, ROI, IRR.",
      icon: Sparkles,
      href: "/ai-project-estimator",
    },
    {
      label: "PIR vs Rock Wool",
      desc: "Complete side-by-side comparison guide.",
      icon: Layers,
      href: "/pir-vs-rock-wool",
    },
    {
      label: "Research & Innovation",
      desc: "R&D roadmap, prototypes and applied testing.",
      icon: ScrollText,
      href: "/research-innovation",
    },
    {
      label: "Engineering Tools",
      desc: "Calculators, selectors, references.",
      icon: Calculator,
      href: "/engineering-tools",
    },
    {
      label: "Customer Portal",
      desc: "Secure client dashboard: projects, tracking, documents.",
      icon: ShieldCheck,
      href: "/customer-portal",
    },
    {
      label: "Partner Portal",
      desc: "Global distributor & EPC workspace: leads, marketing, AI sales.",
      icon: Handshake,
      href: "/partner-portal",
    },
  ],
  featured: {
    eyebrow: "Latest article",
    title: "PIR vs Rock Wool: choosing the right core in 2026",
    desc: "A structural, thermal and fire-performance comparison for cold storage.",
    href: "/pir-vs-rock-wool",
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
    { label: "Quality Assurance", icon: ShieldCheck, href: "/quality" },
    { label: "Sustainability & ESG", icon: Sprout, href: "/sustainability" },
    { label: "Careers", icon: Briefcase, href: "/careers" },
    { label: "Investor Relations", icon: LineChart, href: "/investors" },
    { label: "Global Offices", icon: Network, href: "/contact" },
    { label: "Project Inquiry", icon: Handshake, href: "/project-inquiry" },
    { label: "Contact", icon: Mail, href: "/contact" },
  ],
};

const NAV: MenuGroup[] = [SOLUTIONS, INDUSTRIES, KNOWLEDGE, MARKETS, COMPANY];

/* ─────────────────────────────────────────────────────────────
   Header
   ───────────────────────────────────────────────────────────── */

const NAV_KEY: Record<string, string> = {
  Solutions: "nav.solutions",
  Industries: "nav.industries",
  Knowledge: "nav.knowledge",
  Markets: "nav.markets",
  Company: "nav.company",
};

export function SiteHeader() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openMenu = useCallback(
    (label: string | null) => {
      cancelClose();
      setActiveMenu(label);
    },
    [cancelClose],
  );

  // Delay closing so the pointer can travel from the trigger into the panel.
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActiveMenu(null), 220);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  useEffect(() => {
    if (!activeMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeMenu]);


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
            ? "border-b border-border bg-background/90 shadow-[0_1px_0_0_rgba(0,0,0,0.4),0_8px_28px_-18px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <UtilityBar solid={solid} />

        <header>
          <div className="container-wide flex h-[72px] items-center justify-between gap-6 px-5 sm:px-6 md:h-20 md:px-6 lg:h-[88px] lg:px-8">
            <Link
              to="/"
              className="relative flex items-center py-2"
              aria-label="NEVO Industrial home"
            >
              <span className="relative block w-[165px] md:w-[180px] lg:w-[200px]">
                {/*
                  Header background is dark in both scroll states (transparent
                  over dark hero, or solid dark surface when scrolled). Always
                  render the LIGHT logo variant so the wordmark stays visible.
                  Do NOT apply CSS filters, opacity, mix-blend-mode, invert, or
                  brightness — they destroy the white ink.
                */}
                <img
                  src={nevoLogoLight}
                  alt="NEVO Industrial"
                  data-testid="header-logo"
                  data-logo-variant="light"
                  className="relative z-10 block h-auto w-full"
                  style={{
                    objectFit: "contain",
                    opacity: 1,
                    mixBlendMode: "normal",
                    filter: "none",
                    visibility: "visible",
                  }}
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  onLoad={(event) => {
                    // One sampled success ping per tab session (see
                    // shouldLogRender) so production traffic stays low-volume
                    // while confirming the correct sticky logo actually
                    // rendered.
                    if (typeof window === "undefined") return;
                    if (!shouldLogRender()) return;
                    const img = event.currentTarget;
                    const step = img.dataset.fallbackStep ?? "0";
                    const variant =
                      step === "0"
                        ? "primary-light-png"
                        : step === "1"
                          ? "fallback-cdn-full"
                          : "fallback-inline-svg";
                    logClientEvent(
                      "header.logo.render",
                      withLogoEventSchema({
                        correlationId: getLogoCorrelationId(),
                        variant,
                        sampleRate: LOGO_RENDER_SAMPLE_RATE,
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        viewportWidth: window.innerWidth,
                        viewportHeight: window.innerHeight,
                        dpr: window.devicePixelRatio,
                        src: img.currentSrc || img.src,
                      }),
                      "info",
                    );
                  }}
                  onError={(event) => {
                    // Defensive fallback chain: if the bundled light logo
                    // fails to load (bundle miss, cache poisoning, blocked
                    // asset), swap to the CDN-hosted white/green variant.
                    // If that also fails, fall back to an inline SVG so the
                    // sticky header stays readable no matter what.
                    const img = event.currentTarget;
                    const step = img.dataset.fallbackStep ?? "0";
                    const failedSrc = img.currentSrc || img.src;
                    const correlationId = getLogoCorrelationId();
                    if (step === "0") {
                      img.dataset.fallbackStep = "1";
                      img.dataset.logoVariant = "fallback-cdn";
                      if (shouldLogError("primary-light-png", false)) {
                        logClientEvent(
                          "header.logo.error",
                          withLogoEventSchema({
                            correlationId,
                            stage: "primary-light-png",
                            failedSrc,
                            nextSrc: LOGO_FALLBACK_CDN,
                            viewportWidth: window.innerWidth,
                            online: navigator.onLine,
                          }),
                          "error",
                        );
                      }
                      img.src = LOGO_FALLBACK_CDN;
                    } else if (step === "1") {
                      img.dataset.fallbackStep = "2";
                      img.dataset.logoVariant = "fallback-svg";
                      if (shouldLogError("fallback-cdn-full", false)) {
                        logClientEvent(
                          "header.logo.error",
                          withLogoEventSchema({
                            correlationId,
                            stage: "fallback-cdn-full",
                            failedSrc,
                            nextSrc: "inline-svg",
                            viewportWidth: window.innerWidth,
                            online: navigator.onLine,
                          }),
                          "error",
                        );
                      }
                      img.src = LOGO_FALLBACK_SVG;
                    } else if (shouldLogError("fallback-inline-svg", true)) {
                      logClientEvent(
                        "header.logo.error",
                        withLogoEventSchema({
                          correlationId,
                          stage: "fallback-inline-svg",
                          failedSrc,
                          terminal: true,
                        }),
                        "error",
                      );
                    }
                  }}
                />
              </span>
            </Link>

            <nav
              className="hidden items-center gap-0.5 lg:flex"
              aria-label="Primary"
              onMouseLeave={() => setActiveMenu(null)}
            >
              <TopLink
                label={t("nav.home")}
                href="/"
                onLight={!solid}
                onEnter={() => setActiveMenu(null)}
              />
              {NAV.map((group) => (
                <MegaTrigger
                  key={group.label}
                  group={group}
                  displayLabel={t(NAV_KEY[group.label] ?? group.label, group.label)}
                  onLight={!solid}
                  active={activeMenu === group.label}
                  onEnter={() => setActiveMenu(group.label)}
                />
              ))}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                aria-label={t("nav.search")}
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
                type="button"
                aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
                aria-expanded={open}
                aria-controls="mobile-menu-drawer"
                className={cn(
                  "inline-flex size-11 touch-manipulation items-center justify-center rounded-md transition-colors lg:hidden",
                  solid ? "text-foreground hover:bg-surface" : "text-white hover:bg-white/10",
                )}
                onPointerDown={(e) => {
                  // Open on pointerdown so the first tap after hydration is
                  // never lost to a cancelled click (scroll, layout shift, or
                  // React 19 discrete-event replay racing the touch).
                  if (e.pointerType === "touch" || e.pointerType === "pen") {
                    e.preventDefault();
                    setOpen((v) => !v);
                  }
                }}
                onClick={(e) => {
                  // Mouse + keyboard path. Touch is handled in onPointerDown.
                  const nativeType = (e.nativeEvent as PointerEvent).pointerType;
                  if (nativeType === "touch" || nativeType === "pen") return;
                  setOpen((v) => !v);
                }}
              >
                {open ? (
                  <X className="size-6" strokeWidth={1.75} />
                ) : (
                  <Menu className="size-6" strokeWidth={1.75} />
                )}
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

      {open && (
        <MobileMenu
          onClose={() => setOpen(false)}
          onOpenSearch={() => {
            setOpen(false);
            setSearchOpen(true);
          }}
        />
      )}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Utility bar
   ───────────────────────────────────────────────────────────── */

function UtilityBar({ solid }: { solid: boolean }) {
  const { t } = useTranslation();
  const whatsappHref = SITE.contact.whatsapp ? WHATSAPP_URL : "/project-inquiry";

  return (
    <div
      className={cn(
        "hidden border-b transition-colors duration-[250ms] md:block",
        solid
          ? "border-border/60 bg-surface/60 text-foreground/70"
          : "border-white/10 bg-black/20 text-white/75",
      )}
    >
      <div className="container-wide flex h-9 items-center justify-between gap-6 px-6 text-[11px] font-medium tracking-wide lg:px-8">
        <div className="flex items-center gap-5">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 opacity-80" strokeWidth={1.75} />
            {t("brand.location")}
          </span>
          <span
            className={cn("hidden h-3 w-px", solid ? "bg-border" : "bg-white/20")}
            aria-hidden
          />
          <span className="hidden lg:inline">{t("brand.sector")}</span>
          <span
            className={cn("hidden h-3 w-px lg:block", solid ? "bg-border" : "bg-white/20")}
            aria-hidden
          />
          <span className="hidden lg:inline-flex items-center gap-1.5">
            <Globe2 className="size-3.5 opacity-80" strokeWidth={1.75} />
            {t("brand.worldwide")}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={whatsappHref}
            className={cn(
              "inline-flex items-center gap-1.5 transition-colors",
              solid ? "hover:text-foreground" : "hover:text-white",
            )}
          >
            <MessageCircle className="size-3.5" strokeWidth={1.75} />
            {SITE.contact.whatsapp ? t("nav.whatsapp") : t("nav.engineeringDesk")}
          </a>
          <LanguageSwitcher variant="header" onLight={!solid} />
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
  displayLabel,
  onLight,
  active,
  onEnter,
}: {
  group: MenuGroup;
  displayLabel?: string;
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
      {displayLabel ?? group.label}
    </button>
  );
}

function PrimaryCTA({ solid }: { solid: boolean }) {
  const { t } = useTranslation();
  return (
    <a
      href="/project-inquiry"
      className={cn(
        "group relative hidden overflow-hidden rounded-lg px-4 py-2.5 text-[13px] font-medium tracking-tight transition-all duration-[220ms] sm:inline-flex sm:items-center sm:gap-1.5",
        solid
          ? "bg-accent text-accent-foreground hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--color-accent)_55%,transparent)]"
          : "bg-accent text-accent-foreground hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--color-accent)_55%,transparent)]",
      )}
    >
      <span className="relative z-10">{t("cta.startProject")}</span>
      <ArrowUpRight
        className="relative z-10 size-3.5 transition-transform duration-[220ms] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        strokeWidth={2}
      />
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
        "border-b border-border bg-background shadow-[0_20px_40px_-24px_rgba(0,0,0,0.6)] transition-all duration-[220ms] ease-[var(--ease-out-quart)]",
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
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-8">
        <EyebrowRow label="What we do" />
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
          {group.items.map((item) => (
            <li key={localizeNavLabel(t, item.label)}>
              <a
                href={item.href ?? "/project-inquiry"}
                className="group flex items-start gap-3 rounded-xl border border-transparent p-3.5 transition-all hover:border-border hover:bg-surface/60"
              >
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-foreground transition-colors group-hover:border-[color:var(--accent)] group-hover:text-[color:var(--accent)]">
                  {item.icon ? <item.icon className="size-[18px]" strokeWidth={1.6} /> : null}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-[14px] font-semibold tracking-tight text-foreground">
                    {localizeNavLabel(t, item.label)}
                    <ArrowRight
                      className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                      strokeWidth={2}
                    />
                  </span>
                  {item.desc && (
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
                      {localizeNavLabel(t, item.desc)}
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
  const { t } = useTranslation();
  return (
    <div>
      <EyebrowRow label="Industries we engineer for" />
      <ul className="grid grid-cols-4 gap-2">
        {group.items.map((item) => (
          <li key={localizeNavLabel(t, item.label)}>
            <a
              href={item.href ?? "/industries"}
              className="group flex flex-col items-start gap-3 rounded-xl border border-transparent p-4 transition-all hover:border-border hover:bg-surface/60"
            >
              <span className="grid size-10 place-items-center rounded-lg border border-border bg-surface transition-colors group-hover:border-[color:var(--accent)] group-hover:text-[color:var(--accent)]">
                {item.icon ? <item.icon className="size-[18px]" strokeWidth={1.6} /> : null}
              </span>
              <span className="text-[13.5px] font-medium tracking-tight text-foreground">
                {localizeNavLabel(t, item.label)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListLayout({ group }: { group: MenuGroup }) {
  const { t } = useTranslation();
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
            <li key={localizeNavLabel(t, item.label)}>
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
                    {localizeNavLabel(t, item.label)}
                  </span>
                  {item.desc && (
                    <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                      {localizeNavLabel(t, item.desc)}
                    </span>
                  )}
                </span>
                <ArrowRight
                  className="size-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                  strokeWidth={2}
                />
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
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-7">
        <EyebrowRow label="Delivered worldwide" />
        <ul className="grid grid-cols-3 gap-x-6 gap-y-1">
          {group.items.map((item) => (
            <li key={localizeNavLabel(t, item.label)}>
              <a
                href={item.href ?? "/knowledge-hub"}
                className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-surface/70"
              >
                <span className="inline-flex items-center gap-2 text-[13.5px] font-medium tracking-tight text-foreground">
                  <MapPin className="size-3.5 text-[color:var(--accent)]" strokeWidth={2} />
                  {localizeNavLabel(t, item.label)}
                </span>
                <ArrowRight
                  className="size-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                  strokeWidth={2}
                />
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
  const { t } = useTranslation();
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
          {localizeNavLabel(t, featured.eyebrow)}
        </span>
        <h4 className="mt-4 text-[18px] font-semibold leading-snug tracking-tight">
          {localizeNavLabel(t, featured.title)}
        </h4>
        <p
          className={cn(
            "mt-2 text-[13px] leading-relaxed",
            tone === "dark" ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {localizeNavLabel(t, featured.desc)}
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
        <ArrowUpRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          strokeWidth={2}
        />
      </div>
    </a>
  );
}

/* ─────────────────────────────────────────────────────────────
   Search overlay
   ───────────────────────────────────────────────────────────── */

const SEARCH_INDEX: {
  title: string;
  desc: string;
  href: string;
  group: string;
  keywords: string;
}[] = [
  // Solutions
  {
    title: "Sandwich Panels",
    desc: "PIR, PUR, rock wool wall and roof panels.",
    href: "/solutions/sandwich-panels",
    group: "Solutions",
    keywords: "pir pur rockwool rock wool wall roof panel insulation",
  },
  {
    title: "Production Lines",
    desc: "Continuous and discontinuous PIR / rock wool lines.",
    href: "/solutions/production-lines",
    group: "Solutions",
    keywords: "line laminator continuous discontinuous factory equipment",
  },
  {
    title: "Engineering Consultancy",
    desc: "Feasibility, layout, commissioning, operations.",
    href: "/solutions/engineering-consultancy",
    group: "Solutions",
    keywords: "consultancy feasibility engineering advisory",
  },
  {
    title: "Raw Materials",
    desc: "PPGI, GI coils, PIR chemicals, adhesives, rock wool.",
    href: "/solutions/raw-materials",
    group: "Solutions",
    keywords: "ppgi gi steel coil chemicals polyol mdi adhesive rockwool",
  },
  {
    title: "Installation & Commissioning",
    desc: "Site installation, start-up, after-sales support.",
    href: "/installation-commissioning",
    group: "Solutions",
    keywords: "installation commissioning start-up support after sales",
  },
  // Tools
  {
    title: "Engineering Tools Center",
    desc: "20 calculators — thickness, U-value, ROI, layout.",
    href: "/engineering-tools",
    group: "Tools",
    keywords: "tools calculator engineering thickness u-value roi layout",
  },
  {
    title: "Panel Thickness Calculator",
    desc: "Recommend thickness by climate, fire, application.",
    href: "/panel-thickness-calculator",
    group: "Tools",
    keywords: "thickness u-value climate fire panel calculator",
  },
  {
    title: "Product Configurator",
    desc: "Configure panel type, core, dimensions, coating.",
    href: "/product-configurator",
    group: "Tools",
    keywords: "configurator panel type core dimensions coating quotation",
  },
  {
    title: "Investment Calculator",
    desc: "CAPEX, OPEX, ROI, IRR, NPV, payback.",
    href: "/investment-calculator",
    group: "Tools",
    keywords: "investment capex opex roi irr npv payback financial",
  },
  {
    title: "Factory Layout Generator",
    desc: "Interactive plant layout — line, warehouse, utilities.",
    href: "/factory-layout-generator",
    group: "Tools",
    keywords: "factory layout plant warehouse utilities floor plan",
  },
  {
    title: "AI Project Estimator",
    desc: "AI feasibility for full factory investment.",
    href: "/ai-project-estimator",
    group: "Tools",
    keywords: "ai project estimator feasibility factory investment",
  },
  {
    title: "AI Engineering Assistant",
    desc: "Ask any engineering question — 24/7.",
    href: "/ai-assistant",
    group: "Tools",
    keywords: "ai assistant chat engineer help question",
  },
  {
    title: "PIR vs Rock Wool",
    desc: "Full comparison — thermal, fire, TCO.",
    href: "/pir-vs-rock-wool",
    group: "Tools",
    keywords: "pir rockwool comparison fire thermal tco",
  },
  // Knowledge
  {
    title: "Knowledge Hub",
    desc: "Articles, guides, courses, videos, FAQ.",
    href: "/knowledge-hub",
    group: "Knowledge",
    keywords: "knowledge articles guides courses videos faq library",
  },
  {
    title: "Download Center",
    desc: "Datasheets, brochures, CAD/BIM, certifications.",
    href: "/download-center",
    group: "Knowledge",
    keywords: "downloads datasheet brochure cad bim certification pdf",
  },
  {
    title: "Factory Layouts Library",
    desc: "Reference plant layouts and case studies.",
    href: "/factory-layouts",
    group: "Knowledge",
    keywords: "factory layouts case studies plant reference",
  },
  {
    title: "Research & Innovation",
    desc: "R&D roadmap, prototypes, applied testing.",
    href: "/research-innovation",
    group: "Knowledge",
    keywords: "research innovation r&d rd prototypes testing",
  },
  {
    title: "Quality Assurance",
    desc: "EN 14509 QC, testing, certifications.",
    href: "/quality",
    group: "Knowledge",
    keywords: "quality qc en 14509 testing certification",
  },
  // Company
  {
    title: "About NEVO",
    desc: "Engineering-led industrial group, Dubai.",
    href: "/about",
    group: "Company",
    keywords: "about company nevo dubai group",
  },
  {
    title: "Sustainability & ESG",
    desc: "Environment, social and governance strategy.",
    href: "/sustainability",
    group: "Company",
    keywords: "sustainability esg environment governance carbon",
  },
  {
    title: "Careers",
    desc: "Engineering, production and commercial roles.",
    href: "/careers",
    group: "Company",
    keywords: "careers jobs hiring engineer production",
  },
  {
    title: "Investor Relations",
    desc: "Reports, governance, strategy.",
    href: "/investors",
    group: "Company",
    keywords: "investor relations reports governance",
  },
  {
    title: "Contact & Global Offices",
    desc: "Dubai HQ, WhatsApp, sales, engineering.",
    href: "/contact",
    group: "Company",
    keywords: "contact offices whatsapp phone sales engineering dubai",
  },
  {
    title: "Customer Portal",
    desc: "Project timeline, documents, logistics.",
    href: "/customer-portal",
    group: "Company",
    keywords: "customer portal project timeline documents",
  },
  {
    title: "Partner Portal",
    desc: "Distributors, EPCs, marketing, training.",
    href: "/partner-portal",
    group: "Company",
    keywords: "partner distributor epc portal marketing training",
  },
  {
    title: "Request a Quotation",
    desc: "7-stage engineering intake wizard.",
    href: "/project-inquiry",
    group: "Company",
    keywords: "quotation quote inquiry rfq request price",
  },
];

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return SEARCH_INDEX.slice(0, 8);
    const tokens = query.split(/\s+/).filter(Boolean);
    return SEARCH_INDEX.map((item) => {
      const hay = `${item.title} ${item.desc} ${item.keywords} ${item.group}`.toLowerCase();
      const score = tokens.reduce((s, t) => (hay.includes(t) ? s + 1 : s), 0);
      return { item, score };
    })
      .filter((r) => r.score === tokens.length)
      .map((r) => r.item)
      .slice(0, 12);
  }, [q]);

  useEffect(() => {
    setActiveIdx(0);
  }, [q]);

  const go = (href: string) => {
    onClose();
    navigate({
      to: href.startsWith("/$lang") ? href : (`/$lang${href}` as never),
      params: { lang } as never,
    });
  };

  const groups = useMemo(() => {
    const m: Record<string, typeof SEARCH_INDEX> = {};
    results.forEach((r) => {
      (m[r.group] ||= []).push(r);
    });
    return m;
  }, [results]);

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 backdrop-blur-sm">
      <button className="absolute inset-0" aria-label="Close search" onClick={onClose} />
      <div className="relative mt-24 w-full max-w-2xl mx-4 rounded-2xl border border-border bg-background shadow-panel-lg">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="size-[18px] text-muted-foreground" strokeWidth={1.75} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIdx((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIdx((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && results[activeIdx]) {
                e.preventDefault();
                go(results[activeIdx].href);
              }
            }}
            placeholder="Search pages, tools, downloads, articles…"
            className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results for "{q}". Try "PIR", "ROI", "layout" or "quotation".
            </div>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group} className="mb-4 last:mb-0">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {group}
                </div>
                <ul className="grid gap-0.5">
                  {items.map((r) => {
                    const idx = results.indexOf(r);
                    const active = idx === activeIdx;
                    return (
                      <li key={r.href}>
                        <button
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={() => go(r.href)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition ${active ? "bg-surface" : "hover:bg-surface/70"}`}
                        >
                          <span className="min-w-0">
                            <span className="block text-[13.5px] text-foreground truncate">
                              {r.title}
                            </span>
                            <span className="block text-[11.5px] text-muted-foreground truncate">
                              {r.desc}
                            </span>
                          </span>
                          <ArrowRight
                            className="size-3.5 text-muted-foreground shrink-0"
                            strokeWidth={2}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Mobile menu — independent, fullscreen
   ───────────────────────────────────────────────────────────── */

function MobileMenu({ onClose, onOpenSearch }: { onClose: () => void; onOpenSearch: () => void }) {
  const { t } = useTranslation();
  const whatsappHref = SITE.contact.whatsapp ? WHATSAPP_URL : "/project-inquiry";
  const sections: { label: string; i18nKey: string; items: NavItem[] }[] = [
    { label: "Solutions", i18nKey: "nav.solutions", items: SOLUTIONS.items },
    { label: "Industries", i18nKey: "nav.industries", items: INDUSTRIES.items },
    { label: "Knowledge", i18nKey: "nav.knowledge", items: KNOWLEDGE.items.slice(0, 6) },
    { label: "Markets", i18nKey: "nav.markets", items: MARKETS.items },
    { label: "Company", i18nKey: "nav.company", items: COMPANY.items },
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
            ].map((chip) => (
              <a
                key={chip.label}
                href={chip.href}
                className="rounded-full border border-border px-3 py-1.5 text-[12.5px] font-medium text-foreground"
                onClick={onClose}
              >
                {localizeNavLabel(t, chip.label)}
              </a>
            ))}
          </div>
        </div>

        {sections.map((section) => (
          <details key={section.label} className="group border-b border-border py-2">
            <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-[18px] font-semibold tracking-tight text-foreground">
              {t(section.i18nKey, section.label)}
              <ChevronRight
                className="size-5 transition-transform group-open:rotate-90"
                strokeWidth={1.75}
              />
            </summary>
            <ul className="grid gap-0.5 pb-3">
              {section.items.map((item) => (
                <li key={localizeNavLabel(t, item.label)}>
                  <a
                    href={item.href ?? "/knowledge-hub"}
                    className="flex items-center gap-3 rounded-lg px-2 py-3 text-[15px] text-foreground/85"
                    onClick={onClose}
                  >
                    {item.icon && (
                      <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border">
                        <item.icon className="size-[16px]" strokeWidth={1.6} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">{localizeNavLabel(t, item.label)}</span>
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
              { label: "PIR vs Rock Wool: choosing the right core", href: "/pir-vs-rock-wool" },
              { label: "CAPEX guide for a 50k m² factory", href: "/solutions/factory-development" },
              {
                label: "Continuous line commissioning checklist",
                href: "/solutions/production-lines",
              },
            ].map((t) => (
              <li key={t.label}>
                <a
                  href={t.href}
                  className="flex items-start justify-between gap-3 py-1.5 text-[14px] text-foreground"
                  onClick={onClose}
                >
                  <span className="min-w-0 flex-1">{t.label}</span>
                  <ArrowUpRight
                    className="mt-0.5 size-4 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Button asChild variant="primary" size="lg" className="mt-6 h-14 w-full text-[15px]">
          <a href="/project-inquiry" onClick={onClose}>
            {t("cta.startProject")}
            <ArrowUpRight className="!size-4" />
          </a>
        </Button>

        <LanguageSwitcher variant="mobile" />

        <div className="mt-6 flex items-center justify-between text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" strokeWidth={1.75} /> Dubai, UAE
          </span>
          <a href={whatsappHref} className="inline-flex items-center gap-1.5" onClick={onClose}>
            <MessageCircle className="size-3.5" strokeWidth={1.75} />{" "}
            {SITE.contact.whatsapp ? "WhatsApp" : "Engineering Desk"}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Breadcrumbs (exported for internal pages)
   ───────────────────────────────────────────────────────────── */

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const { t } = useTranslation();
  return (
    <nav aria-label="Breadcrumb" className="border-b border-border bg-surface/40">
      <ol className="container-wide flex flex-wrap items-center gap-1.5 px-6 py-3 text-[12.5px] text-muted-foreground lg:px-8">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="inline-flex items-center gap-1.5">
              {item.href && !last ? (
                <a href={item.href} className="hover:text-foreground">
                  {localizeNavLabel(t, item.label)}
                </a>
              ) : (
                <span className={cn(last && "text-foreground")}>{localizeNavLabel(t, item.label)}</span>
              )}
              {!last && <ChevronRight className="size-3 opacity-60" strokeWidth={2} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
