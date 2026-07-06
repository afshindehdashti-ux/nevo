import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * NEVO Button system — dark premium industrial
 *
 * Locked variants:
 *   – primary   NEVO green bg, white text. Main CTA / conversion.
 *                (alias: `default` for shadcn compatibility)
 *   – secondary Transparent bg, white border + text.
 *                Green border + green text on hover.
 *                (alias: `outline`)
 *   – ghost     Transparent, subtle hover on charcoal surface.
 *   – link      Underlined white text, green on hover.
 *   – destructive
 *
 * Sizes: sm / md / lg / xl / icon.
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
          "bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-accent)_35%,transparent)]",
        default:
          "bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-accent)_35%,transparent)]",
        secondary:
          "border border-border-strong bg-transparent text-foreground hover:border-accent hover:text-accent",
        outline:
          "border border-border-strong bg-transparent text-foreground hover:border-accent hover:text-accent",
        ghost: "text-foreground hover:bg-surface hover:text-foreground",
        link: "text-foreground underline underline-offset-4 decoration-transparent hover:text-accent hover:decoration-accent",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
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
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
