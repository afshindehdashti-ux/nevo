import { useEffect, useState } from "react";
import { X, Sparkles, ArrowUpRight } from "lucide-react";
import { AIChat } from "./AIChat";
import { cn } from "@/lib/utils";

export function AIAssistantLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open NEVO AI Engineer"
        className={cn(
          "group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 rounded-full",
          "border border-white/10 bg-[#0B0F14]/95 py-3 pl-3 pr-4 text-sm text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur",
          "transition hover:border-[color:var(--color-accent)]/50 hover:shadow-[0_25px_70px_-15px_rgba(16,185,129,0.35)]",
          "sm:bottom-6 sm:right-6",
          open && "pointer-events-none opacity-0",
        )}
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-accent)]/15 ring-1 ring-[color:var(--color-accent)]/40">
          <Sparkles className="h-4 w-4 text-[color:var(--color-accent)]" />
          <span className="absolute -bottom-0 -right-0 h-2 w-2 rounded-full bg-[color:var(--color-accent)] ring-2 ring-[#0B0F14]" />
        </span>
        <span className="hidden sm:inline font-medium tracking-tight">Ask NEVO AI Engineer</span>
        <span className="sm:hidden font-medium tracking-tight">AI Engineer</span>
      </button>

      {/* Slide-over panel */}
      <div
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-50 transition",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          className={cn(
            "absolute inset-y-0 right-0 flex h-full w-full flex-col overflow-hidden border-l border-white/10 bg-[#0B0F14] shadow-2xl transition-transform duration-300",
            "sm:w-[440px] md:w-[520px] lg:w-[560px]",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/70 transition hover:bg-white/[0.1] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          {open && <AIChat compact />}
          <a
            href="/ai-assistant"
            className="border-t border-white/10 bg-black/40 px-5 py-3 text-center text-[11px] uppercase tracking-[0.16em] text-white/60 transition hover:text-[color:var(--color-accent)]"
          >
            Open full AI Engineer workspace <ArrowUpRight className="ml-1 inline h-3 w-3" />
          </a>
        </aside>
      </div>
    </>
  );
}
