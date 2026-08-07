import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { LOCALES, useLanguage, type Locale } from "@/i18n/LanguageProvider";
import { SUPPORTED_LOCALES } from "@/i18n/config";

interface LanguageSwitcherProps {
  variant?: "header" | "mobile" | "footer";
  onLight?: boolean;
}

export function LanguageSwitcher({ variant = "header", onLight = false }: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === lang) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const navigate = useNavigate();
  const location = useLocation();

  const select = (code: Locale) => {
    setLang(code);
    setOpen(false);
    // Rewrite current path's locale segment
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length && (SUPPORTED_LOCALES as readonly string[]).includes(parts[0])) {
      parts[0] = code;
    } else {
      parts.unshift(code);
    }
    const next = "/" + parts.join("/");
    navigate({ to: next, replace: false });
  };

  if (variant === "mobile") {
    return (
      <div className="border-t border-border/70 px-5 py-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <Globe className="size-3.5" strokeWidth={1.75} />
          Language / فارسی / العربية / 语言
        </div>
        <div className="grid grid-cols-2 gap-2">
          {LOCALES.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                onClick={() => select(l.code)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "border-accent bg-accent/10 font-medium text-foreground"
                    : "border-border bg-background text-foreground/80 hover:bg-surface",
                )}
                aria-current={active ? "true" : undefined}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span className="truncate">{l.nativeName}</span>
                {active && <Check className="ms-auto size-3.5 text-accent" strokeWidth={2} />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div ref={ref} className="relative inline-flex">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs text-primary-foreground/70 transition-colors hover:text-primary-foreground"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <Globe className="size-3.5" strokeWidth={1.75} />
          <span>{current.flag}</span>
          <span>{current.nativeName}</span>
          <ChevronDown
            className={cn("size-3 transition-transform", open && "rotate-180")}
            strokeWidth={2}
          />
        </button>
        {open && <Menu current={lang} onSelect={select} anchor="up" />}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium tracking-wide transition-colors",
          onLight
            ? "text-white/85 hover:text-white hover:bg-white/10"
            : "text-foreground/70 hover:text-foreground hover:bg-surface",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
      >
        <Globe className="size-3.5" strokeWidth={1.75} />
        <span className="text-sm leading-none">{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
        <ChevronDown
          className={cn("size-3 transition-transform", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>
      {open && <Menu current={lang} onSelect={select} anchor="down" />}
    </div>
  );
}

function Menu({
  current,
  onSelect,
  anchor,
}: {
  current: Locale;
  onSelect: (code: Locale) => void;
  anchor: "up" | "down";
}) {
  return (
    <div
      role="listbox"
      className={cn(
        "absolute z-[60] w-64 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-black/40",
        anchor === "down" ? "end-0 top-full mt-2" : "end-0 bottom-full mb-2",
      )}
    >
      <ul className="max-h-[70vh] overflow-y-auto py-1">
        {LOCALES.map((l) => {
          const active = l.code === current;
          return (
            <li key={l.code}>
              <button
                role="option"
                aria-selected={active}
                onClick={() => onSelect(l.code)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent/10 font-medium text-foreground"
                    : "text-foreground/80 hover:bg-surface",
                )}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span className="flex-1 text-start">{l.nativeName}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {l.code}
                </span>
                {active && <Check className="size-3.5 text-accent" strokeWidth={2} />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
