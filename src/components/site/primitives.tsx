import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

/**
 * <Section> — locks vertical rhythm, background tone and border.
 * Every marketing section should be wrapped in it for consistency.
 */
type Tone = "default" | "surface" | "primary";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: Tone;
  bordered?: boolean;
  container?: "wide" | "narrow" | false;
  children: ReactNode;
}

const toneClasses: Record<Tone, string> = {
  default: "bg-background text-foreground",
  surface: "bg-surface text-foreground",
  primary: "bg-primary text-primary-foreground",
};

export function Section({
  tone = "default",
  bordered = true,
  container = "wide",
  className,
  children,
  ...rest
}: SectionProps) {
  const inner =
    container === "wide"
      ? "container-wide"
      : container === "narrow"
        ? "container-narrow"
        : "";
  return (
    <section
      className={cn(
        "section-y",
        toneClasses[tone],
        bordered && "border-b border-border",
        tone === "primary" && "border-border/0",
        className,
      )}
      {...rest}
    >
      {inner ? <div className={inner}>{children}</div> : children}
    </section>
  );
}

/**
 * <SectionHeader> — standard eyebrow + heading + optional lede & aside.
 */
interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  aside?: ReactNode;
  align?: "start" | "between";
  className?: string;
  onTone?: "default" | "primary";
}

export function SectionHeader({
  eyebrow,
  title,
  lede,
  aside,
  align = "between",
  className,
  onTone = "default",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-12 flex flex-col gap-6 md:mb-16",
        align === "between" && aside && "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <div
            className={cn(
              "eyebrow mb-4 flex items-center gap-2",
              onTone === "primary" && "text-accent",
            )}
          >
            <span className="inline-flex size-1.5 rounded-full bg-accent" />
            {eyebrow}
          </div>
        ) : null}
        <h2
          className={cn(
            "text-h2 text-balance",
            onTone === "primary" ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {title}
        </h2>
        {lede ? (
          <p
            className={cn(
              "text-body mt-5 max-w-xl",
              onTone === "primary" && "text-primary-foreground/70",
            )}
          >
            {lede}
          </p>
        ) : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}

/**
 * <Eyebrow> — inline standalone eyebrow label.
 */
export function Eyebrow({
  children,
  dot = true,
  className,
}: {
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("eyebrow flex items-center gap-2", className)}>
      {dot && <span className="inline-flex size-1.5 rounded-full bg-accent" />}
      {children}
    </div>
  );
}
