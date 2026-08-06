// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Empty-state tests: when the Supabase query resolves with zero rows, each
// admin list page MUST render the shared ListEmptyState card (role=status,
// icon, title, description, and telemetry) and NOT the raw table or the
// error card.

const logClientEvent = vi.fn();
const reportClientError = vi.fn();
vi.mock("@/lib/client-monitor", () => ({
  logClientEvent: (...args: unknown[]) => logClientEvent(...args),
  reportClientError: (...args: unknown[]) => reportClientError(...args),
}));

function makeBuilder(_table: string) {
  const chain: any = {
    select() {
      return chain;
    },
    order() {
      return chain;
    },
    eq() {
      return chain;
    },
    limit() {
      return Promise.resolve({ data: [], error: null });
    },
    then(onFulfilled: any, onRejected: any) {
      return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
    },
  };
  return chain;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (t: string) => makeBuilder(t) },
}));
vi.mock("@/components/ai/GuideMeButton", () => ({ GuideMeButton: () => null }));
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    createFileRoute: () => (opts: any) => ({ options: opts }),
  };
});

async function renderRoute(routePath: string) {
  const mod: any = await import(routePath);
  const Component = mod.Route.options.component;
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <Component />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.resetModules();
  logClientEvent.mockReset();
  reportClientError.mockReset();
});
afterEach(() => cleanup());

const cases: Array<{
  label: string;
  routePath: string;
  title: string;
  descriptionRegex: RegExp;
  resource: string;
}> = [
  {
    label: "opportunities",
    routePath: "@/routes/_authenticated/admin.opportunities",
    title: "No opportunities yet",
    descriptionRegex: /will show up here/i,
    resource: "opportunities",
  },
  {
    label: "commission-invoices",
    routePath: "@/routes/_authenticated/admin.commission-invoices",
    title: "No commissions yet",
    descriptionRegex: /will appear here/i,
    resource: "commission_invoices",
  },
  {
    label: "purchase-orders",
    routePath: "@/routes/_authenticated/admin.purchase-orders",
    title: "No purchase orders yet",
    descriptionRegex: /show up here/i,
    resource: "purchase_orders",
  },
];

describe.each(cases)(
  "admin.$label — empty state",
  ({ routePath, title, descriptionRegex, resource }) => {
    it("renders the ListEmptyState card with icon, title, and description", async () => {
      await renderRoute(routePath);

      const heading = await waitFor(() => screen.getByRole("heading", { name: title }));
      expect(heading).toBeTruthy();

      // The empty state card is exposed as role=status for a11y.
      const statusCard = screen.getByRole("status");
      expect(statusCard).toBeTruthy();
      expect(statusCard.textContent).toMatch(descriptionRegex);

      // A decorative icon (aria-hidden svg) sits above the title.
      expect(statusCard.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    });

    it("does not render the data table or the error card", async () => {
      await renderRoute(routePath);
      await waitFor(() => screen.getByRole("heading", { name: title }));

      expect(document.querySelector("table")).toBeNull();
      // ListErrorState uses role=alert; must be absent in the empty state.
      expect(screen.queryByRole("alert")).toBeNull();
      // Retry button belongs to the error card.
      expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
    });

    it(`emits admin_list_empty_shown for ${resource} once`, async () => {
      await renderRoute(routePath);
      await waitFor(() => screen.getByRole("heading", { name: title }));

      const emptyCalls = logClientEvent.mock.calls.filter(
        ([name]) => name === "admin_list_empty_shown",
      );
      expect(emptyCalls).toHaveLength(1);
      expect(emptyCalls[0][1]).toMatchObject({
        surface: "admin_list",
        resource,
        reason: "no_records",
      });
      // Should not be reported as a query failure.
      expect(reportClientError).not.toHaveBeenCalled();
    });
  },
);
