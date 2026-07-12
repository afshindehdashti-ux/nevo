// @vitest-environment happy-dom
/**
 * Contract test: every admin list page MUST emit `admin_list_empty_shown`
 * with a snake_case `resource` slug and a `reason` from the allowed set
 * (`no_records` | `seed_missing` | `filtered_out`). Adding a new admin
 * list page? Append it to REGISTRY below and this suite auto-covers it.
 *
 * See docs/admin-list-states.md → "admin_list_empty_shown checklist".
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const ALLOWED_REASONS = ["no_records", "seed_missing", "filtered_out"] as const;
type AllowedReason = (typeof ALLOWED_REASONS)[number];

const logClientEvent = vi.fn();
const reportClientError = vi.fn();
vi.mock("@/lib/client-monitor", () => ({
  logClientEvent: (...args: unknown[]) => logClientEvent(...args),
  reportClientError: (...args: unknown[]) => reportClientError(...args),
}));

function makeBuilder() {
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
  supabase: { from: () => makeBuilder() },
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

/**
 * Single source of truth for admin list page telemetry contracts. When
 * you add a new AdminListPage-driven route, add it here — the tests
 * below iterate this registry automatically.
 */
const REGISTRY: Array<{
  label: string;
  routePath: string;
  emptyTitle: string;
  /** Expected resource slug in the `admin_list_empty_shown` payload. */
  expectedResource: string;
}> = [
  {
    label: "admin.opportunities",
    routePath: "@/routes/_authenticated/admin.opportunities",
    emptyTitle: "No opportunities yet",
    expectedResource: "opportunities",
  },
  {
    label: "admin.commission-invoices",
    routePath: "@/routes/_authenticated/admin.commission-invoices",
    emptyTitle: "No commissions yet",
    expectedResource: "commission_invoices",
  },
  {
    label: "admin.purchase-orders",
    routePath: "@/routes/_authenticated/admin.purchase-orders",
    emptyTitle: "No purchase orders yet",
    expectedResource: "purchase_orders",
  },
];

const SNAKE_CASE = /^[a-z][a-z0-9_]*$/;

describe("admin list pages: admin_list_empty_shown contract", () => {
  it("REGISTRY resource slugs are snake_case and unique", () => {
    const slugs = REGISTRY.map((r) => r.expectedResource);
    for (const slug of slugs) {
      expect(slug, `resource "${slug}" must be snake_case`).toMatch(SNAKE_CASE);
    }
    expect(new Set(slugs).size, "resource slugs must be unique").toBe(slugs.length);
  });

  describe.each(REGISTRY)("$label", ({ routePath, emptyTitle, expectedResource }) => {
    it(`emits admin_list_empty_shown once with resource="${expectedResource}" and an allowed reason`, async () => {
      await renderRoute(routePath);
      await waitFor(() => screen.getByRole("heading", { name: emptyTitle }));

      const emptyCalls = logClientEvent.mock.calls.filter(
        ([name]) => name === "admin_list_empty_shown",
      );

      // Exactly one emission per (resource, reason) — dedup guarantee.
      expect(emptyCalls).toHaveLength(1);

      const [, payload, level] = emptyCalls[0] as [
        string,
        { surface: string; resource: string; reason: string },
        "info" | "warn" | "error",
      ];

      expect(payload.surface).toBe("admin_list");
      expect(payload.resource).toBe(expectedResource);
      expect(payload.resource).toMatch(SNAKE_CASE);
      expect(ALLOWED_REASONS).toContain(payload.reason as AllowedReason);

      // Level must correlate with reason per docs/admin-list-states.md.
      if (payload.reason === "seed_missing") {
        expect(level).toBe("warn");
      } else {
        expect(level).toBe("info");
      }

      // Empty-state render must never fire an error report.
      expect(reportClientError).not.toHaveBeenCalled();
    });
  });
});
