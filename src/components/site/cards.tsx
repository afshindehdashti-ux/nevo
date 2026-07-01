import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes, ElementType } from "react";

/**
 * <SurfaceCard> — locked card treatment for the entire platform.
 * White/light-grey background, subtle border, no shadow by default,
 * optional accent-line hover.
 */
interface SurfaceCardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  interactive?: boolean;
  padded?: boolean;
  children: ReactNode;
}

export function SurfaceCard({
  as: Tag = "div",
  interactive = false,
  padded = true,
  className,
  children,
  ...rest
}: SurfaceCardProps) {
  return (
    <Tag
      className={cn(
        "group relative flex flex-col bg-background border border-border rounded-lg",
        padded && "p-6 sm:p-7",
        interactive &&
          "transition-colors duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:border-border-strong hover:bg-surface",
        interactive && "card-accent-line",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * <GridBoard> — hairline grid of cells (used for solutions/industries).
 * Uses 1px gap on a border background to render pixel-perfect internal rules.
 */
export function GridBoard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-lg border border-border bg-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * <BoardCell> — a single cell inside <GridBoard>. Consistent inner padding.
 */
export function BoardCell({
  className,
  children,
  interactive = false,
  as: Tag = "div",
  ...rest
}: HTMLAttributes<HTMLElement> & {
  interactive?: boolean;
  as?: ElementType;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "bg-background p-6 sm:p-8",
        interactive &&
          "group transition-colors duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:bg-surface-muted",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
