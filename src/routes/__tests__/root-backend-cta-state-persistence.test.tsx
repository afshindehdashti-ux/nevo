// @vitest-environment happy-dom
/**
 * Regression: interactive state of the public marketing chrome must not
 * persist when the user navigates from a public page into a backend area
 * (/admin, /crm, /backoffice).
 *
 * Concrete failure modes this test guards against:
 *   1. The user opens the Ask AI drawer on `/`, then follows a link into
 *      `/admin`. The launcher must unmount and its `open` state must be
 *      destroyed — the drawer must NOT remain visible over admin chrome.
 *   2. The Ask AI drawer's open-state side effect (`document.body.style
 *      .overflow = "hidden"`) must be reverted when it unmounts, so admin
 *      pages remain scrollable.
 *   3. The sticky mobile CTA's dismissed / expanded state must reset
 *      after a full unmount cycle — a return trip public → backend →
 *      public gives the user a fresh, un-interacted CTA (which is what
 *      "unmount on backend" is supposed to guarantee).
 *
 * We use minimal stand-in components that reproduce the real components'
 * self-gating pattern (`if (useIsBackend()) return null`) and the same
 * `open`-state + body-overflow side effect the real `AIAssistantLauncher`
 * uses. Testing the contract at this layer (rather than importing the
 * real components with all their i18n / router-link deps) keeps the
 * regression signal narrow and fast; the actual components are already
 * covered by the CTA-gate render tests and by the Playwright hard-refresh
 * suite.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, act, waitFor, fireEvent } from "@testing-library/react";
import { useEffect, useState } from "react";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import { useIsBackend } from "@/lib/use-route-area";

afterEach(() => {
  cleanup();
  // Ensure no leaked body-overflow between tests.
  document.body.style.overflow = "";
});

// Mirror of AIAssistantLauncher's contract: self-gates on useIsBackend,
// holds an internal `open` state, and locks body scroll while open.
function AskAiLauncherProbe() {
  const [open, setOpen] = useState(false);
  const isBackend = useIsBackend();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (isBackend) return null;

  return (
    <>
      <button
        type="button"
        data-testid="ask-ai-launcher"
        onClick={() => setOpen(true)}
      >
        Ask AI
      </button>
      {open && (
        <div role="dialog" aria-modal="true" data-testid="ask-ai-drawer">
          <button
            type="button"
            data-testid="ask-ai-close"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
          <span>drawer contents</span>
        </div>
      )}
    </>
  );
}

// Mirror of StickyMobileCTA's contract: self-gates on useIsBackend and
// holds a "dismissed" state a user could set on a public page.
function StickyMobileCtaProbe() {
  const [dismissed, setDismissed] = useState(false);
  const isBackend = useIsBackend();

  if (isBackend) return null;
  if (dismissed) return <div data-testid="sticky-cta-dismissed" />;
  return (
    <button
      type="button"
      data-testid="sticky-cta"
      onClick={() => setDismissed(true)}
    >
      WhatsApp
    </button>
  );
}

function RootShell() {
  // Mirror the real `RootComponent` in `src/routes/__root.tsx`: gate at
  // the parent level so navigating into a backend route fully UNMOUNTS
  // the marketing components (destroying their state), rather than
  // relying only on the components' internal `if (isBackend) return null`
  // early-return (which keeps them mounted and preserves state).
  const isBackend = useIsBackend();
  return (
    <>
      <Outlet />
      {!isBackend && <AskAiLauncherProbe />}
      {!isBackend && <StickyMobileCtaProbe />}
    </>
  );
}

function makeRouter(initial: string) {
  const rootRoute = createRootRoute({ component: RootShell });
  const routes = [
    createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => <div>home</div> }),
    createRoute({ getParentRoute: () => rootRoute, path: "/about", component: () => <div>about</div> }),
    createRoute({ getParentRoute: () => rootRoute, path: "/admin/$", component: () => <div>admin</div> }),
    createRoute({ getParentRoute: () => rootRoute, path: "/crm/$", component: () => <div>crm</div> }),
    createRoute({ getParentRoute: () => rootRoute, path: "/backoffice/$", component: () => <div>backoffice</div> }),
  ];
  return createRouter({
    routeTree: rootRoute.addChildren(routes),
    history: createMemoryHistory({ initialEntries: [initial] }),
    defaultPreload: false,
  });
}

describe("Public marketing chrome — state does not persist across the backend gate", () => {
  it("closes an open Ask AI drawer when navigating from public into /admin", async () => {
    const router = makeRouter("/");
    render(<RouterProvider router={router} />);
    await waitFor(() => expect(screen.getByTestId("ask-ai-launcher")).toBeTruthy());

    // Open the drawer on the public page.
    fireEvent.click(screen.getByTestId("ask-ai-launcher"));
    await waitFor(() => {
      expect(screen.getByTestId("ask-ai-drawer")).toBeTruthy();
    });
    expect(document.body.style.overflow).toBe("hidden");

    // Navigate to /admin. The drawer, launcher, and body-overflow lock
    // must all be gone.
    await act(async () => {
      await router.navigate({ to: "/admin/$", params: { _splat: "dashboard" } });
    });
    await waitFor(() => {
      expect(screen.queryByTestId("ask-ai-launcher")).toBeNull();
      expect(screen.queryByTestId("ask-ai-drawer")).toBeNull();
      expect(document.body.style.overflow).toBe("");
    });

    // Return to a public page — the drawer must NOT still be open (state
    // reset because the component unmounted, not just hid).
    await act(async () => {
      await router.navigate({ to: "/about" });
    });
    await waitFor(() => {
      expect(screen.getByTestId("ask-ai-launcher")).toBeTruthy();
    });
    expect(screen.queryByTestId("ask-ai-drawer")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  for (const [label, target, splat] of [
    ["/admin", "/admin/$", "orders"],
    ["/crm", "/crm/$", "leads"],
    ["/backoffice", "/backoffice/$", "tools"],
  ] as const) {
    it(`resets sticky mobile CTA dismissed state across public → ${label} → public`, async () => {
      const router = makeRouter("/");
      render(<RouterProvider router={router} />);
      await waitFor(() => expect(screen.getByTestId("sticky-cta")).toBeTruthy());

      // Dismiss on the public page.
      fireEvent.click(screen.getByTestId("sticky-cta"));
      await waitFor(() => {
        expect(screen.getByTestId("sticky-cta-dismissed")).toBeTruthy();
      });

      // Enter backend — CTA must be fully gone.
      await act(async () => {
        await router.navigate({ to: target, params: { _splat: splat } });
      });
      await waitFor(() => {
        expect(screen.queryByTestId("sticky-cta")).toBeNull();
        expect(screen.queryByTestId("sticky-cta-dismissed")).toBeNull();
      });

      // Back to public — the CTA re-appears in its *initial* (un-dismissed)
      // state because unmounting destroyed the previous instance's state.
      await act(async () => {
        await router.navigate({ to: "/about" });
      });
      await waitFor(() => {
        expect(screen.getByTestId("sticky-cta")).toBeTruthy();
      });
      expect(screen.queryByTestId("sticky-cta-dismissed")).toBeNull();
    });
  }

  it("does not carry drawer/CTA state across three-way public → /crm → public → /backoffice trips", async () => {
    const router = makeRouter("/");
    render(<RouterProvider router={router} />);
    await waitFor(() => expect(screen.getByTestId("ask-ai-launcher")).toBeTruthy());

    // Open drawer + dismiss sticky on the public page.
    fireEvent.click(screen.getByTestId("ask-ai-launcher"));
    fireEvent.click(screen.getByTestId("sticky-cta"));
    await waitFor(() => {
      expect(screen.getByTestId("ask-ai-drawer")).toBeTruthy();
      expect(screen.getByTestId("sticky-cta-dismissed")).toBeTruthy();
    });
    expect(document.body.style.overflow).toBe("hidden");

    // /crm — both gone, body-overflow reset.
    await act(async () => {
      await router.navigate({ to: "/crm/$", params: { _splat: "leads" } });
    });
    await waitFor(() => {
      expect(screen.queryByTestId("ask-ai-drawer")).toBeNull();
      expect(screen.queryByTestId("sticky-cta")).toBeNull();
      expect(screen.queryByTestId("sticky-cta-dismissed")).toBeNull();
      expect(document.body.style.overflow).toBe("");
    });

    // Public — fresh instances.
    await act(async () => {
      await router.navigate({ to: "/" });
    });
    await waitFor(() => {
      expect(screen.getByTestId("ask-ai-launcher")).toBeTruthy();
      expect(screen.getByTestId("sticky-cta")).toBeTruthy();
    });
    expect(screen.queryByTestId("ask-ai-drawer")).toBeNull();
    expect(screen.queryByTestId("sticky-cta-dismissed")).toBeNull();

    // /backoffice — gone again; body remains unlocked.
    await act(async () => {
      await router.navigate({ to: "/backoffice/$", params: { _splat: "tools" } });
    });
    await waitFor(() => {
      expect(screen.queryByTestId("ask-ai-launcher")).toBeNull();
      expect(screen.queryByTestId("sticky-cta")).toBeNull();
    });
    expect(document.body.style.overflow).toBe("");
  });
});
