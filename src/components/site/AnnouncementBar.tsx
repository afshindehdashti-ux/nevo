export function AnnouncementBar() {
  return (
    <div className="border-b border-border bg-primary text-primary-foreground">
      <div className="container-wide flex h-9 items-center justify-between gap-4 text-[11px]">
        <div className="flex items-center gap-2 font-mono tracking-widest">
          <span className="inline-flex size-1.5 rounded-full bg-accent" />
          <span className="uppercase text-primary-foreground/70">
            NEVO Industrial · Dubai, UAE
          </span>
        </div>
        <a
          href="#contact"
          className="hidden items-center gap-1 font-medium uppercase tracking-widest text-primary-foreground/85 hover:text-primary-foreground sm:inline-flex"
        >
          Engineering desk open →
        </a>
      </div>
    </div>
  );
}
