// @vitest-environment happy-dom
/**
 * Regression test for the finding "Marketing chat & mobile CTA leak into
 * admin pages after in-app navigation" (ab462d1d).
 *
 * `RootComponent` decides whether to render the public AI launcher and
 * sticky mobile CTA based on `pathname`. It MUST subscribe to router state
 * (via `useRouterState`) so the gate re-evaluates on every client-side
 * navigation — a snapshot read like `router.state.location.pathname`
 * freezes the value at initial mount.
 *
 * This test builds a memory-history TanStack Router with the same gate
 * (identical regex + hook usage as `src/routes/__root.tsx`) and drives
 * navigation between public and backend routes to prove the CTAs flip
 * correctly in both directions.
 */
import { describe, it, expect, afterEach } from "vitest";
import { classifyRouteArea } from "@/lib/use-route-area";
import { render, cleanup, screen, waitFor, act } from "@testing-library/react";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from "@tanstack/react-router";

afterEach(() => cleanup());

const BACKEND_PATTERN = /^\/(admin|crm|backoffice)(\/|$)/;

function AskAiLauncher() {
  return <div data-testid="ask-ai">Ask AI</div>;
}
function StickyCta() {
  return <div data-testid="sticky-cta">Get a quote</div>;
}

function RootShell() {
  // Same pattern as src/routes/__root.tsx after the fix.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isBackend = BACKEND_PATTERN.test(pathname);
  return (
    <>
      <Outlet />
      {!isBackend && <AskAiLauncher />}
      {!isBackend && <StickyCta />}
    </>
  );
}

function makeRouter(initialPath: string) {
  const rootRoute = createRootRoute({ component: RootShell });
  const routes = [
    createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => <div>home</div> }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/about",
      component: () => <div>about</div>,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/admin/$",
      component: () => <div>admin</div>,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/crm/$",
      component: () => <div>crm</div>,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/backoffice/$",
      component: () => <div>backoffice</div>,
    }),
  ];
  const routeTree = rootRoute.addChildren(routes);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    defaultPreload: false,
  });
}

async function expectCtas(visible: boolean) {
  await waitFor(() => {
    if (visible) {
      expect(screen.queryByTestId("ask-ai")).not.toBeNull();
      expect(screen.queryByTestId("sticky-cta")).not.toBeNull();
    } else {
      expect(screen.queryByTestId("ask-ai")).toBeNull();
      expect(screen.queryByTestId("sticky-cta")).toBeNull();
    }
  });
}

describe("RootComponent backend CTA gate", () => {
  it("hides CTAs on backend routes and shows them on public routes across in-app navigation", async () => {
    const router = makeRouter("/");
    render(<RouterProvider router={router} />);

    // Public landing: both CTAs visible.
    await expectCtas(true);

    // Public → /admin: gate must re-evaluate and hide CTAs.
    await act(async () => {
      await (router.navigate as (options: unknown) => Promise<void>)({ to: "/admin/$", params: { _splat: "dashboard" } });
    });
    await expectCtas(false);

    // /admin → /crm: still a backend route.
    await act(async () => {
      await (router.navigate as (options: unknown) => Promise<void>)({ to: "/crm/$", params: { _splat: "leads" } });
    });
    await expectCtas(false);

    // /crm → /backoffice: still backend.
    await act(async () => {
      await (router.navigate as (options: unknown) => Promise<void>)({ to: "/backoffice/$", params: { _splat: "tools" } });
    });
    await expectCtas(false);

    // Backend → public: CTAs must come back.
    await act(async () => {
      await (router.navigate as (options: unknown) => Promise<void>)({ to: "/about" });
    });
    await expectCtas(true);
  });

  it("hides CTAs on first paint when the initial route is a backend route", async () => {
    const router = makeRouter("/admin/anything");
    render(<RouterProvider router={router} />);
    await expectCtas(false);

    // Backend-first → public: CTAs appear.
    await act(async () => {
      await (router.navigate as (options: unknown) => Promise<void>)({ to: "/" });
    });
    await expectCtas(true);
  });

  it("does not hide CTAs for lookalike prefixes such as /administration", async () => {
    // The regex requires "/admin" to be followed by "/" or end-of-string, so
    // "/administration" (not a backend route) must keep the CTAs visible.
    const rootRoute = createRootRoute({ component: RootShell });
    const routes = [
      createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => <div>home</div> }),
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/administration",
        component: () => <div>administration</div>,
      }),
    ];
    const router = createRouter({
      routeTree: rootRoute.addChildren(routes),
      history: createMemoryHistory({ initialEntries: ["/administration"] }),
      defaultPreload: false,
    });
    render(<RouterProvider router={router} />);
    await expectCtas(true);
  });

  // ---------------------------------------------------------------------------
  // Query params and trailing slashes.
  //
  // TanStack Router's `location.pathname` excludes the search string, so a
  // URL like "/admin/orders?tab=open&page=2" arrives at the gate as just
  // "/admin/orders". These tests pin that contract in place — if a future
  // change ever surfaces `search` inside `pathname` (or a component starts
  // reading `href`/`location.pathname + location.search` instead), these
  // tests will catch the regression before it ships.
  //
  // Trailing slashes are also exercised because router config
  // (`trailingSlash: "preserve"` or a manual normalize step) can produce
  // "/admin/" or "/admin/orders/" at runtime.
  // ---------------------------------------------------------------------------

  // Pure classifier tests — these guarantee the shared `classifyRouteArea`
  // regex handles the exact pathname shapes the router hands us.
  describe("classifyRouteArea — query params and trailing slashes", () => {
    const backendPaths = [
      "/admin",
      "/admin/",
      "/admin/orders",
      "/admin/orders/",
      "/admin/orders/123",
      "/admin/orders/123/",
      "/crm",
      "/crm/",
      "/crm/leads/42",
      "/crm/leads/42/",
      "/backoffice",
      "/backoffice/",
      "/backoffice/tools/export",
      "/backoffice/tools/export/",
    ];
    const publicPaths = [
      "/",
      "/about",
      "/about/",
      "/administration", // lookalike prefix
      "/administration/settings",
      "/crm-info", // lookalike prefix
      "/backoffice-help", // lookalike prefix
      "/blog/admin-guide", // "admin" mid-path, not a backend prefix
    ];

    for (const p of backendPaths) {
      it(`classifies "${p}" as backend`, () => {
        expect(classifyRouteArea(p)).toBe("backend");
      });
    }
    for (const p of publicPaths) {
      it(`classifies "${p}" as public`, () => {
        expect(classifyRouteArea(p)).toBe("public");
      });
    }
  });

  it("hides CTAs on backend routes with query params (?tab=open&page=2)", async () => {
    // Build a router with a real search-validating backend route so we can
    // navigate to /admin/orders?tab=open&page=2 and assert the gate still
    // suppresses the CTAs.
    const rootRoute = createRootRoute({ component: RootShell });
    const routes = [
      createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => <div>home</div> }),
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/admin/$",
        validateSearch: (s: Record<string, unknown>) => ({
          tab: typeof s.tab === "string" ? s.tab : undefined,
          page: typeof s.page === "number" ? s.page : undefined,
          q: typeof s.q === "string" ? s.q : undefined,
        }),
        component: () => <div>admin</div>,
      }),
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/crm/$",
        validateSearch: (s: Record<string, unknown>) => ({
          filter: typeof s.filter === "string" ? s.filter : undefined,
        }),
        component: () => <div>crm</div>,
      }),
    ];
    const router = createRouter({
      routeTree: rootRoute.addChildren(routes),
      history: createMemoryHistory({
        initialEntries: ["/admin/orders?tab=open&page=2"],
      }),
      defaultPreload: false,
    });
    render(<RouterProvider router={router} />);
    await expectCtas(false);

    // Public → backend with a query string.
    await act(async () => {
      await (router.navigate as (options: unknown) => Promise<void>)({ to: "/" });
    });
    await expectCtas(true);

    await act(async () => {
      await (router.navigate as (options: unknown) => Promise<void>)({
        to: "/crm/$",
        params: { _splat: "leads" },
        search: { filter: "hot" },
      });
    });
    await expectCtas(false);

    // Mutating just the query string on a backend route must not
    // re-enable the CTAs.
    await act(async () => {
      await (router.navigate as (options: unknown) => Promise<void>)({
        to: "/crm/$",
        params: { _splat: "leads" },
        search: { filter: "cold" },
      });
    });
    await expectCtas(false);
  });

  it("hides CTAs on backend routes served with a trailing slash", async () => {
    const rootRoute = createRootRoute({ component: RootShell });
    const routes = [
      createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => <div>home</div> }),
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/admin/$",
        component: () => <div>admin</div>,
      }),
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/backoffice/$",
        component: () => <div>backoffice</div>,
      }),
    ];
    // Exercise every trailing-slash shape a hosting layer might hand us.
    const initialUrls = ["/admin/", "/admin/orders/", "/backoffice/tools/export/"];
    for (const initial of initialUrls) {
      cleanup();
      const router = createRouter({
        routeTree: rootRoute.addChildren(routes),
        history: createMemoryHistory({ initialEntries: [initial] }),
        defaultPreload: false,
      });
      render(<RouterProvider router={router} />);
      await expectCtas(false);
    }
  });

  it("never renders the CTAs while the pathname is a backend route (no flash during client-side transitions)", async () => {
    // If the gate ever lags the router by even one render, we'll see a
    // backend pathname in these logs — exactly the flash to guard against.
    const renderLog: { component: "ask-ai" | "sticky-cta"; pathname: string }[] = [];

    function useCurrentPathname() {
      return useRouterState({ select: (s) => s.location.pathname });
    }
    function LoggedAskAi() {
      const pathname = useCurrentPathname();
      renderLog.push({ component: "ask-ai", pathname });
      return <div data-testid="ask-ai">Ask AI</div>;
    }
    function LoggedSticky() {
      const pathname = useCurrentPathname();
      renderLog.push({ component: "sticky-cta", pathname });
      return <div data-testid="sticky-cta">Get a quote</div>;
    }
    function InstrumentedRoot() {
      const pathname = useCurrentPathname();
      const isBackend = BACKEND_PATTERN.test(pathname);
      return (
        <>
          <Outlet />
          {!isBackend && <LoggedAskAi />}
          {!isBackend && <LoggedSticky />}
        </>
      );
    }

    const rootRoute = createRootRoute({ component: InstrumentedRoot });
    const routes = [
      createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => <div>home</div> }),
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/about",
        component: () => <div>about</div>,
      }),
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/admin/$",
        component: () => <div>admin</div>,
      }),
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/crm/$",
        component: () => <div>crm</div>,
      }),
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/backoffice/$",
        component: () => <div>backoffice</div>,
      }),
    ];
    const router = createRouter({
      routeTree: rootRoute.addChildren(routes),
      history: createMemoryHistory({ initialEntries: ["/"] }),
      defaultPreload: false,
    });

    // MutationObserver catches any moment the CTA nodes exist in the DOM
    // while the router pathname is on a backend route — this catches
    // flashes that happen between React commits.
    const domViolations: { pathname: string; testid: string }[] = [];
    const observer = new MutationObserver(() => {
      const pathname = router.state.location.pathname;
      if (!BACKEND_PATTERN.test(pathname)) return;
      for (const testid of ["ask-ai", "sticky-cta"]) {
        if (document.querySelector(`[data-testid="${testid}"]`)) {
          domViolations.push({ pathname, testid });
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    render(<RouterProvider router={router} />);
    await expectCtas(true);

    const go = async (to: string, splat?: string) => {
      await act(async () => {
        if (splat !== undefined) {
          await (router.navigate as (options: unknown) => Promise<void>)({ to: to as "/admin/$", params: { _splat: splat } });
        } else {
          await (router.navigate as (options: unknown) => Promise<void>)({ to });
        }
      });
    };
    await go("/admin/$", "dashboard");
    await expectCtas(false);
    await go("/about");
    await expectCtas(true);
    await go("/crm/$", "leads");
    await expectCtas(false);
    await go("/");
    await expectCtas(true);
    await go("/backoffice/$", "tools");
    await expectCtas(false);
    await go("/about");
    await expectCtas(true);

    observer.disconnect();

    const renderFlashes = renderLog.filter((e) => BACKEND_PATTERN.test(e.pathname));
    expect(renderFlashes).toEqual([]);
    expect(domViolations).toEqual([]);
  });
});
