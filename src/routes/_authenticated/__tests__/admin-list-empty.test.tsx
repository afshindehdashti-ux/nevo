// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Empty-state tests: when the Supabase query resolves with zero rows, each
// admin list page MUST render the friendly ListEmptyState card (title +
// description) and NOT the raw table.

function makeBuilder(_table: string) {
  const chain: any = {
    select() { return chain; },
    order() { return chain; },
    eq() { return chain; },
    limit() { return Promise.resolve({ data: [], error: null }); },
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

beforeEach(() => vi.resetModules());
afterEach(() => cleanup());

const cases: Array<[string, string, string]> = [
  ["opportunities",       "@/routes/_authenticated/admin.opportunities",       "No opportunities yet"],
  ["commission-invoices", "@/routes/_authenticated/admin.commission-invoices", "No commissions yet"],
  ["purchase-orders",     "@/routes/_authenticated/admin.purchase-orders",     "No purchase orders yet"],
];

describe.each(cases)("admin.%s — empty state", (_label, routePath, title) => {
  it(`shows the ${title} card and no table when the query returns []`, async () => {
    await renderRoute(routePath);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    });

    // Table should not render at all in the empty state.
    expect(document.querySelector("table")).toBeNull();
    // Description text is present (not just the title).
    expect(document.body.textContent).toMatch(/(show up|appear) here/i);
  });
});
