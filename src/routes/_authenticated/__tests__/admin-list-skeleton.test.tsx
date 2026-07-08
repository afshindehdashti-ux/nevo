// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Skeleton visibility tests: the loading skeleton MUST render on first paint
// (while the query is in-flight) and MUST disappear once data resolves. To
// exercise this we hand-control the Supabase promise so the useQuery stays
// pending across the initial render, then resolve it and assert the swap.

type Deferred<T> = { promise: Promise<T>; resolve: (v: T) => void };
function defer<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
}

let pending: Deferred<{ data: any[]; error: null }> | null = null;

function makeBuilder(_table: string) {
  const chain: any = {
    select() { return chain; },
    order() { return chain; },
    eq() { return chain; },
    limit() { return pending!.promise; },
    then(onFulfilled: any, onRejected: any) {
      return pending!.promise.then(onFulfilled, onRejected);
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
  pending = defer();
  vi.resetModules();
});
afterEach(() => cleanup());

const cases: Array<[string, string, any[]]> = [
  [
    "opportunities",
    "@/routes/_authenticated/admin.opportunities",
    [{
      id: "o1", name: "Deal A", stage: "qualified", amount: 1000,
      currency: "EUR", probability: 50, expected_close_date: "2026-08-01",
      customer: { name: "AcmeCo" }, partner: { company_name: "PartnerX" },
      created_at: "2026-07-01T00:00:00Z",
    }],
  ],
  [
    "commission-invoices",
    "@/routes/_authenticated/admin.commission-invoices",
    [{
      id: "c1", amount: 250, currency: "EUR", status: "pending",
      earned_at: "2026-07-01", paid_at: null,
      partner: { company_name: "PartnerX" }, customer: { name: "AcmeCo" },
      created_at: "2026-07-01T00:00:00Z",
    }],
  ],
  [
    "purchase-orders",
    "@/routes/_authenticated/admin.purchase-orders",
    [{
      id: "po1", order_number: "PO-1001", status: "confirmed",
      order_date: "2026-07-01", requested_delivery: "2026-07-15",
      currency: "EUR", total: 5000,
      customer: { name: "AcmeCo" },
    }],
  ],
];

describe.each(cases)("admin.%s — loading skeleton", (label, routePath, rows) => {
  it(`shows skeleton while ${label} query is pending, then removes it`, async () => {
    await renderRoute(routePath);

    // Initial render: skeleton visible, no table rows yet.
    const skeleton = screen.getByTestId("list-skeleton");
    expect(skeleton).toBeTruthy();
    expect(skeleton.getAttribute("aria-busy")).toBe("true");
    expect(document.querySelector("table tbody tr")).toBeNull();

    // Resolve the query; skeleton should disappear and rows should render.
    pending!.resolve({ data: rows, error: null });

    await waitFor(() => {
      expect(screen.queryByTestId("list-skeleton")).toBeNull();
    });
    expect(document.querySelector("table tbody tr")).not.toBeNull();
  });
});
