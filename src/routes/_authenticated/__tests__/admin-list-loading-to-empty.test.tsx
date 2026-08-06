// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Transition test: while the Supabase query is pending, the loading skeleton
// must be visible AND the empty-state card must NOT render yet. Once the
// query resolves with [], the skeleton disappears and the empty-state card
// takes its place — never both, never neither.

type Deferred<T> = { promise: Promise<T>; resolve: (v: T) => void };
function defer<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

let pending: Deferred<{ data: any[]; error: null }> | null = null;

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
      return pending!.promise;
    },
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
vi.mock("@/lib/client-monitor", () => ({
  logClientEvent: vi.fn(),
  reportClientError: vi.fn(),
}));
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

const cases: Array<[string, string, string]> = [
  ["opportunities", "@/routes/_authenticated/admin.opportunities", "No opportunities yet"],
  [
    "commission-invoices",
    "@/routes/_authenticated/admin.commission-invoices",
    "No commissions yet",
  ],
  ["purchase-orders", "@/routes/_authenticated/admin.purchase-orders", "No purchase orders yet"],
];

describe.each(cases)("admin.%s — skeleton → empty transition", (_label, routePath, emptyTitle) => {
  it("shows skeleton while pending, then swaps to empty-state on []", async () => {
    await renderRoute(routePath);

    // Phase 1 — loading: skeleton on, empty-state off, no table.
    expect(screen.getByTestId("list-skeleton")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: emptyTitle })).toBeNull();
    expect(document.querySelector("table")).toBeNull();

    // Resolve with zero rows.
    pending!.resolve({ data: [], error: null });

    // Phase 2 — resolved-empty: skeleton off, empty-state on, no table.
    await waitFor(() => {
      expect(screen.queryByTestId("list-skeleton")).toBeNull();
    });
    expect(screen.getByRole("heading", { name: emptyTitle })).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
    expect(document.querySelector("table")).toBeNull();
  });

  it("never renders skeleton and empty-state simultaneously", async () => {
    await renderRoute(routePath);

    // While pending, the empty card must not leak through.
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByTestId("list-skeleton")).toBeTruthy();

    pending!.resolve({ data: [], error: null });

    await waitFor(() => {
      expect(screen.queryByTestId("list-skeleton")).toBeNull();
    });
    // Post-resolve the skeleton is gone and only the empty card remains.
    expect(screen.queryByTestId("list-skeleton")).toBeNull();
    expect(screen.getByRole("status")).toBeTruthy();
  });
});
