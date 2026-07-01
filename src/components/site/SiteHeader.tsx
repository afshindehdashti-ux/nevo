import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";

const NAV = [
  {
    label: "Solutions",
    items: [
      "Factory Development",
      "Engineering Consultancy",
      "Raw Material Solutions",
      "Production Line Solutions",
      "Finished Panel Solutions",
      "Technical Support",
    ],
  },
  {
    label: "Industries",
    items: [
      "Cold Storage",
      "Food Processing",
      "Pharmaceutical",
      "Clean Rooms",
      "Warehousing & Logistics",
      "Industrial Buildings",
      "Modular Buildings",
      "Commercial Construction",
    ],
  },
  {
    label: "Resources",
    items: ["Knowledge Hub", "Technical Library", "Downloads", "Case Studies", "FAQ"],
  },
  {
    label: "Markets",
    items: [
      "Saudi Arabia",
      "Oman",
      "UAE",
      "Turkey",
      "Iraq",
      "Kenya",
      "Cameroon",
      "Russia",
      "Africa",
    ],
  },
  {
    label: "Company",
    items: ["About NEVO", "Why NEVO", "Dubai Advantage", "Global Network", "Contact"],
  },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container-wide flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="NEVO Industrial home">
          <span className="text-lg font-semibold tracking-tighter text-foreground">
            NEVO
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:inline">
            Industrial
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {NAV.map((group) => (
            <div key={group.label} className="group relative">
              <button className="flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground">
                {group.label}
              </button>
              <div className="invisible absolute left-1/2 top-full z-40 min-w-[240px] -translate-x-1/2 translate-y-1 rounded-lg border border-border bg-popover p-2 opacity-0 shadow-panel transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <ul className="grid gap-0.5">
                  {group.items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="block rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface hover:text-foreground"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#contact"
            className="hidden items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:opacity-95 active:scale-[0.98] sm:inline-flex"
          >
            Talk to an Engineer
            <ArrowUpRight className="size-3.5" strokeWidth={2.25} />
          </a>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-10 items-center justify-center rounded-md text-foreground lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="container-wide max-h-[80vh] overflow-y-auto py-4">
            {NAV.map((group) => (
              <div key={group.label} className="border-b border-border py-3 last:border-0">
                <div className="eyebrow mb-2">{group.label}</div>
                <ul className="grid gap-1">
                  {group.items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="block py-1.5 text-sm text-foreground/80"
                        onClick={() => setOpen(false)}
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <a
              href="#contact"
              className="mt-4 flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
              onClick={() => setOpen(false)}
            >
              Talk to an Engineer
              <ArrowUpRight className="size-3.5" strokeWidth={2.25} />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
