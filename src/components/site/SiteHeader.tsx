import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ArrowUpRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      {
        label: "Factory Development",
        desc: "Feasibility, layout, commissioning for new factories.",
      },
      {
        label: "Engineering Consultancy",
        desc: "Process design, optimization, technical consulting.",
      },
      {
        label: "Raw Material Solutions",
        desc: "PIR, PUR, PPGI, GI, Aluzinc, rock wool, adhesives.",
      },
      {
        label: "Production Line Solutions",
        desc: "Continuous & discontinuous lines, roll forming, automation.",
      },
      {
        label: "Finished Panel Solutions",
        desc: "Supply of finished panels across regional markets.",
      },
      {
        label: "Technical Support",
        desc: "Training, spare parts, audits, troubleshooting.",
      },
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
      { label: "Saudi Arabia" },
      { label: "Oman" },
      { label: "UAE" },
      { label: "Turkey" },
      { label: "Iraq" },
      { label: "Kenya" },
      { label: "Cameroon" },
      { label: "Russia" },
      { label: "Africa" },
    ],
  },
  {
    label: "Company",
    cols: 1,
    items: [
      { label: "About NEVO" },
      { label: "Why NEVO" },
      { label: "Dubai Advantage" },
      { label: "Global Network" },
      { label: "Contact" },
    ],
  },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container-wide flex h-16 items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2" aria-label="NEVO Industrial home">
          <span className="text-lg font-semibold tracking-tighter text-foreground">
            NEVO
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:inline">
            Industrial
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((group) => (
            <MegaMenu key={group.label} group={group} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <a href="#contact">
              Start Your Project
              <ArrowUpRight className="!size-3.5" />
            </a>
          </Button>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-10 items-center justify-center rounded-md text-foreground lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && <MobileMenu onClose={() => setOpen(false)} />}
    </header>
  );
}

function MegaMenu({ group }: { group: MenuGroup }) {
  const panelWidth =
    group.cols === 2 ? "min-w-[560px]" : "min-w-[280px]";
  return (
    <div className="group relative">
      <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-surface hover:text-foreground">
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
