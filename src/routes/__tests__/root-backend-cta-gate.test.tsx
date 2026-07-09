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
    createRoute({ getParentRoute: () => rootRoute, path: "/about", component: () => <div>about</div> }),
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
      await router.navigate({ to: "/admin/$", params: { _splat: "dashboard" } });
    });
    await expectCtas(false);

    // /admin → /crm: still a backend route.
    await act(async () => {
      await router.navigate({ to: "/crm/$", params: { _splat: "leads" } });
    });
    await expectCtas(false);

    // /crm → /backoffice: still backend.
    await act(async () => {
      await router.navigate({ to: "/backoffice/$", params: { _splat: "tools" } });
    });
    await expectCtas(false);

    // Backend → public: CTAs must come back.
    await act(async () => {
      await router.navigate({ to: "/about" });
    });
    await expectCtas(true);
  });

  it("hides CTAs on first paint when the initial route is a backend route", async () => {
    const router = makeRouter("/admin/anything");
    render(<RouterProvider router={router} />);
    await expectCtas(false);

    // Backend-first → public: CTAs appear.
    await act(async () => {
      await router.navigate({ to: "/" });
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
});
