import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * NEVO Button system
 *
 * Locked variants:
 *   – primary   Graphite black bg, white text. Main CTAs.
 *                (alias: `default` for shadcn compatibility)
 *   – secondary White bg, graphite border + text. Explore/View.
 *                (alias: `outline`)
 *   – ghost     Transparent, minimal, arrow-forward pattern. Read more / details.
 *   – link      Underlined text link.
 *   – destructive
 *
 * Sizes: sm / md / lg / xl / icon.
 * Radius, spacing and hover states are unified across the platform.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md text-sm font-medium cursor-pointer",
    "transition-all duration-[var(--duration-base)] ease-[var(--ease-out-quart)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/92 active:bg-primary",
        default:
          "bg-primary text-primary-foreground hover:bg-primary/92 active:bg-primary",
        secondary:
          "border border-border-strong bg-background text-foreground hover:bg-surface hover:border-foreground/60",
        outline:
          "border border-border-strong bg-background text-foreground hover:bg-surface hover:border-foreground/60",
        ghost:
          "text-foreground hover:bg-surface hover:text-foreground",
        link:
          "text-foreground underline underline-offset-4 hover:text-accent-foreground hover:decoration-accent",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        sm: "h-9 px-3.5 text-xs",
        md: "h-11 px-5 text-sm",
        default: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-sm",
        xl: "h-14 px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
