import { useRouterState } from "@tanstack/react-router";

/**
 * Route "area" classification used by layout-level components to decide
 * whether to render public marketing UI (AI chat launcher, sticky CTAs,
 * cookie banners, marketing analytics) versus authenticated back-office
 * chrome.
 *
 *   - "backend": /admin, /crm, /backoffice (and any nested paths)
 *   - "auth":    /auth (sign-in / sign-up flow)
 *   - "public":  everything else
 *
 * Keep this list in sync when adding a new top-level back-office prefix.
 */
export type RouteArea = "backend" | "auth" | "public";

const BACKEND_PATTERN = /^\/(admin|crm|backoffice)(\/|$)/;
const AUTH_PATTERN = /^\/auth(\/|$)/;

export function classifyRouteArea(pathname: string): RouteArea {
  if (BACKEND_PATTERN.test(pathname)) return "backend";
  if (AUTH_PATTERN.test(pathname)) return "auth";
  return "public";
}

/**
 * Subscribing hook — re-renders on every client-side navigation. Never
 * read `router.state.location.pathname` directly in a component body;
 * that is a snapshot and freezes at initial mount, so the value never
 * updates after in-app `<Link>` navigation.
 */
export function useRouteArea(): RouteArea {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return classifyRouteArea(pathname);
}

/** Convenience: true on /admin, /crm, /backoffice (and children). */
export function useIsBackend(): boolean {
  return useRouteArea() === "backend";
}
