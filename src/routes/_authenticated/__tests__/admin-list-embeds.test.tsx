// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Integration tests for the three admin list pages that regressed when the
// customer embed was written as `customers(company_name)` (a column that
// doesn't exist) instead of `customers(name)`. These tests:
//   1. Assert the select() string uses the correct embed field.
//   2. Render the component with a stubbed Supabase client returning rows
//      shaped like the real embed response, and confirm the table renders
//      the customer name from `customer.name`.
//
// If a future edit reintroduces `customers(company_name)` the string
// assertion fails; if the JSX renders `customer.company_name` again the
// customer cell renders "—" and the "AcmeCo" assertion fails.

// -- Supabase mock -----------------------------------------------------------
const selectCalls: string[] = [];
let mockRows: any[] = [];

function makeBuilder(table: string) {
  const chain: any = {
    _table: table,
    select(cols: string) {
      selectCalls.push(`${table}:${cols}`);
      return chain;
    },
    order() {
      return chain;
    },
    eq() {
      return chain;
    },
    limit() {
      return Promise.resolve({ data: mockRows, error: null });
    },
    then(onFulfilled: any, onRejected: any) {
      return Promise.resolve({ data: mockRows, error: null }).then(onFulfilled, onRejected);
    },
  };
  return chain;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (t: string) => makeBuilder(t) },
}));
vi.mock("@/components/ai/GuideMeButton", () => ({
  GuideMeButton: () => null,
}));

// TanStack's createFileRoute must not run during tests (no router registered).
// We stub it to return an object exposing the component so we can render it.
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
  selectCalls.length = 0;
  mockRows = [];
  vi.resetModules();
});
afterEach(() => cleanup());

describe("admin.opportunities — customer embed integration", () => {
  it("selects customer:customers(name) and renders customer.name in the table", async () => {
    mockRows = [
      {
        id: "o1",
        name: "Deal A",
        stage: "qualified",
        amount: 1000,
        currency: "EUR",
        probability: 50,
        expected_close_date: "2026-08-01",
        customer: { name: "AcmeCo" },
        partner: { company_name: "PartnerX" },
        created_at: "2026-07-01T00:00:00Z",
      },
    ];
    await renderRoute("@/routes/_authenticated/admin.opportunities");

    await waitFor(() => expect(screen.getByText("Deal A")).toBeTruthy());
    expect(screen.getByText("AcmeCo")).toBeTruthy();
    expect(screen.getByText("PartnerX")).toBeTruthy();

    const opportunitiesSelect = selectCalls.find((c) => c.startsWith("opportunities:"));
    expect(opportunitiesSelect).toBeDefined();
    expect(opportunitiesSelect!).toContain("customer:customers(name)");
    expect(opportunitiesSelect!).not.toContain("customers(company_name)");
    // partner embed IS company_name (partners table has that column)
    expect(opportunitiesSelect!).toContain("partner:partners(company_name)");
  });
});

describe("admin.commission-invoices — customer embed integration", () => {
  it("selects customer:customers(name) and renders customer.name in the table", async () => {
    mockRows = [
      {
        id: "c1",
        amount: 250,
        currency: "EUR",
        status: "pending",
        earned_at: "2026-07-01",
        paid_at: null,
        partner: { company_name: "PartnerX" },
        customer: { name: "AcmeCo" },
        created_at: "2026-07-01T00:00:00Z",
      },
    ];
    await renderRoute("@/routes/_authenticated/admin.commission-invoices");

    await waitFor(() => expect(screen.getByText("PartnerX")).toBeTruthy());
    expect(screen.getByText("AcmeCo")).toBeTruthy();

    const commSelect = selectCalls.find((c) => c.startsWith("partner_commissions:"));
    expect(commSelect).toBeDefined();
    expect(commSelect!).toContain("customer:customers(name)");
    expect(commSelect!).not.toContain("customers(company_name)");
    expect(commSelect!).toContain("partner:partners(company_name)");
  });
});

describe("admin.purchase-orders — customer embed integration", () => {
  it("selects customer:customers(name) and renders customer.name in the table", async () => {
    mockRows = [
      {
        id: "po1",
        order_number: "PO-1001",
        status: "confirmed",
        order_date: "2026-07-01",
        requested_delivery: "2026-07-15",
        currency: "EUR",
        total: 5000,
        customer: { name: "AcmeCo" },
      },
    ];
    await renderRoute("@/routes/_authenticated/admin.purchase-orders");

    await waitFor(() => expect(screen.getByText("PO-1001")).toBeTruthy());
    expect(screen.getByText("AcmeCo")).toBeTruthy();

    const ordersSelect = selectCalls.find((c) => c.startsWith("orders:"));
    expect(ordersSelect).toBeDefined();
    expect(ordersSelect!).toContain("customer:customers(name)");
    expect(ordersSelect!).not.toContain("customers(company_name)");
  });
});
