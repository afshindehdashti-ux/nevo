import { useEffect, useState } from "react";
import {
  type DevOverlayFlag,
  isDevOverlayEnabled,
} from "@/lib/dev-flags";
import { useRouteArea } from "@/lib/use-route-area";

/**
 * Subscribe to a dev-overlay flag.
 *
 * Always false on the server and on the first client render so an opt-in
 * stored in localStorage can never cause a hydration mismatch, and so nothing
 * paints during ordinary local authenticated testing.
 */
export function useDevOverlay(flag: DevOverlayFlag): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(isDevOverlayEnabled(flag));
  }, [flag]);
  return on;
}

/** Renders children only when `flag` is explicitly enabled in a dev build. */
export function DevOverlayGate({
  flag,
  children,
}: {
  flag: DevOverlayFlag;
  children: React.ReactNode;
}) {
  return useDevOverlay(flag) ? <>{children}</> : null;
}

function RouteAreaBadge() {
  const area = useRouteArea();
  return (
    <div
      data-dev-overlay="route-area-badge"
      className="pointer-events-none fixed bottom-2 left-2 z-[9999] rounded border border-border bg-background/90 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground shadow-sm"
    >
      dev · {area}
    </div>
  );
}

function LayoutGrid() {
  return (
    <div
      data-dev-overlay="layout-grid"
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9998]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, color-mix(in oklch, var(--color-accent) 22%, transparent) 0 1px, transparent 1px 64px)",
      }}
    />
  );
}

/**
 * Mount point for every dev-only overlay. Off unless the matching flag is
 * explicitly enabled — see src/lib/dev-flags.ts.
 */
export function DevOverlays() {
  return (
    <>
      <DevOverlayGate flag="route-area-badge">
        <RouteAreaBadge />
      </DevOverlayGate>
      <DevOverlayGate flag="layout-grid">
        <LayoutGrid />
      </DevOverlayGate>
    </>
  );
}
