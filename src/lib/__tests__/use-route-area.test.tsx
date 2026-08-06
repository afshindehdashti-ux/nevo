// @vitest-environment happy-dom
/**
 * Unit tests for the shared route-area classifier and its subscribing hooks
 * (`src/lib/use-route-area.ts`).
 *
 * Covers:
 *   - `classifyRouteArea(pathname)` — pure function, every documented
 *     backend/auth/public shape plus lookalike-prefix and mid-path edge
 *     cases (e.g. `/administration`, `/blog/admin-guide`).
 *   - `useRouteArea()` and `useIsBackend()` — subscribing hooks; re-render
 *     on client-side navigation so layout-level components stay in sync.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, act, waitFor } from "@testing-library/react";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import { classifyRouteArea, useIsBackend, useRouteArea } from "@/lib/use-route-area";

afterEach(() => cleanup());

describe("classifyRouteArea", () => {
  describe("backend prefixes", () => {
    const cases: string[] = [
      "/admin",
      "/admin/",
      "/admin/dashboard",
      "/admin/orders/123",
      "/admin/orders/123/",
      "/admin/very/deeply/nested/path",
      "/crm",
      "/crm/",
      "/crm/leads",
      "/crm/leads/42",
      "/crm/leads/42/",
      "/backoffice",
      "/backoffice/",
      "/backoffice/tools",
      "/backoffice/tools/export",
      "/backoffice/tools/export/",
    ];
    for (const p of cases) {
      it(`"${p}" → backend`, () => {
        expect(classifyRouteArea(p)).toBe("backend");
      });
    }
  });

  describe("auth prefix", () => {
    const cases: string[] = [
      "/auth",
      "/auth/",
      "/auth/sign-in",
      "/auth/sign-up",
      "/auth/callback",
      "/auth/reset/token-abc",
    ];
    for (const p of cases) {
      it(`"${p}" → auth`, () => {
        expect(classifyRouteArea(p)).toBe("auth");
      });
    }
  });

  describe("public paths (default)", () => {
    const cases: string[] = [
      "/",
      "/about",
      "/about/",
      "/services",
      "/contact",
      "/blog",
      "/blog/how-we-work",
    ];
    for (const p of cases) {
      it(`"${p}" → public`, () => {
        expect(classifyRouteArea(p)).toBe("public");
      });
    }
  });

  describe("lookalike / edge-case prefixes must NOT match backend or auth", () => {
    // The regex requires the backend segment to be followed by "/" or the
    // end of the string. Any path that merely *starts with* those letters
    // but continues the segment must classify as public.
    const cases: string[] = [
      "/administration",
      "/administration/",
      "/administration/settings",
      "/administrator",
      "/adminify",
      "/crm-info",
      "/crm-support",
      "/crmsupport",
      "/backoffice-help",
      "/backoffice-portal",
      "/backofficehelp",
      "/authorize", // auth lookalike
      "/authority", // auth lookalike
      "/authenticated", // auth lookalike (the underscore-layout name)
      // "admin" as a mid-path segment is not a backend route:
      "/blog/admin-guide",
      "/docs/admin",
      "/api/crm/data",
      "/services/backoffice",
      // Case matters — TanStack pathnames are lowercase, but we still
      // verify we don't accidentally match uppercase.
      "/Admin",
      "/ADMIN",
      "/Crm",
      "/BACKOFFICE",
    ];
    for (const p of cases) {
      it(`"${p}" → public`, () => {
        expect(classifyRouteArea(p)).toBe("public");
      });
    }
  });

  describe("query strings and hashes are not part of pathname", () => {
    // TanStack Router's `location.pathname` never includes `?...` or
    // `#...`, but if some future call site ever passes the full href, the
    // classifier still must behave sensibly for the pathname portion. We
    // pin the *current* contract: pathname-only input, and query strings
    // appended to pathname are treated as pathname characters (so a
    // pathname like "/admin?tab=x" would classify as public because the
    // regex requires "/" or end-of-string after "/admin"). This test
    // documents that contract so a regression is loud.
    it("pathname-only backend paths classify as backend", () => {
      expect(classifyRouteArea("/admin/orders")).toBe("backend");
    });
    it("a pathname that accidentally contains a '?' does NOT match backend", () => {
      // If a caller passes "/admin?tab=open" as pathname (bug), regex sees
      // "admin?" — no "/" or end-of-string after "admin" — so it falls
      // through to public. This is the safe direction (missed-hide, not
      // false-hide) and documenting it here keeps the contract explicit.
      expect(classifyRouteArea("/admin?tab=open")).toBe("public");
    });
  });
});

// -----------------------------------------------------------------------------
// Hook tests — mount the hooks inside a real memory-history router and
// verify they update on client-side navigation.
// -----------------------------------------------------------------------------

function makeRouter(initial: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const routes = [
    createRoute({ getParentRoute: () => rootRoute, path: "/", component: Probe }),
    createRoute({ getParentRoute: () => rootRoute, path: "/about", component: Probe }),
    createRoute({ getParentRoute: () => rootRoute, path: "/administration", component: Probe }),
    createRoute({ getParentRoute: () => rootRoute, path: "/auth/$", component: Probe }),
    createRoute({ getParentRoute: () => rootRoute, path: "/admin/$", component: Probe }),
    createRoute({ getParentRoute: () => rootRoute, path: "/crm/$", component: Probe }),
    createRoute({ getParentRoute: () => rootRoute, path: "/backoffice/$", component: Probe }),
  ];
  return createRouter({
    routeTree: rootRoute.addChildren(routes),
    history: createMemoryHistory({ initialEntries: [initial] }),
    defaultPreload: false,
  });
}

type TestNavigateOptions = {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
  replace?: boolean;
};

function navigateTest(router: ReturnType<typeof makeRouter>, options: TestNavigateOptions) {
  return router.navigate(options as never);
}

function Probe() {
  const area = useRouteArea();
  const isBackend = useIsBackend();
  return (
    <div>
      <span data-testid="area">{area}</span>
      <span data-testid="is-backend">{String(isBackend)}</span>
    </div>
  );
}

async function expectArea(area: "backend" | "auth" | "public") {
  await waitFor(() => {
    expect(screen.getByTestId("area").textContent).toBe(area);
    expect(screen.getByTestId("is-backend").textContent).toBe(String(area === "backend"));
  });
}

describe("useRouteArea / useIsBackend", () => {
  it("returns the correct area on initial mount for each top-level prefix", async () => {
    for (const [initial, area] of [
      ["/", "public"],
      ["/about", "public"],
      ["/administration", "public"],
      ["/admin/dashboard", "backend"],
      ["/crm/leads/1", "backend"],
      ["/backoffice/tools", "backend"],
      ["/auth/sign-in", "auth"],
    ] as const) {
      cleanup();
      const router = makeRouter(initial);
      render(<RouterProvider router={router} />);
      await expectArea(area);
    }
  });

  it("re-evaluates on client-side navigation (public → backend → auth → public)", async () => {
    const router = makeRouter("/");
    render(<RouterProvider router={router} />);
    await expectArea("public");

    await act(async () => {
      await navigateTest(router, { to: "/admin/$", params: { _splat: "dashboard" } });
    });
    await expectArea("backend");

    await act(async () => {
      await navigateTest(router, { to: "/crm/$", params: { _splat: "leads/1" } });
    });
    await expectArea("backend");

    await act(async () => {
      await navigateTest(router, { to: "/backoffice/$", params: { _splat: "tools" } });
    });
    await expectArea("backend");

    await act(async () => {
      await navigateTest(router, { to: "/auth/$", params: { _splat: "sign-in" } });
    });
    await expectArea("auth");

    await act(async () => {
      await navigateTest(router, { to: "/about" });
    });
    await expectArea("public");
  });

  it("keeps CTAs enabled on /administration even after navigating in from /admin", async () => {
    // Regression guard: an earlier snapshot-based implementation returned
    // the stale area after client-side navigation. This proves the
    // lookalike prefix stays public no matter what the previous route was.
    const router = makeRouter("/admin/dashboard");
    render(<RouterProvider router={router} />);
    await expectArea("backend");

    await act(async () => {
      await navigateTest(router, { to: "/administration" });
    });
    await expectArea("public");
  });
});
