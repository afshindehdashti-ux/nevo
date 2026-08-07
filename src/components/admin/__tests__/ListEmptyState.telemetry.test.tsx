// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Target } from "lucide-react";

const logClientEvent = vi.fn();
vi.mock("@/lib/client-monitor", () => ({
  logClientEvent: (...args: unknown[]) => logClientEvent(...args),
  reportClientError: vi.fn(),
}));

import { ListEmptyState } from "@/components/admin/ListEmptyState";

beforeEach(() => logClientEvent.mockReset());
afterEach(() => cleanup());

describe("ListEmptyState telemetry", () => {
  it("emits admin_list_empty_shown once per (resource+reason)", () => {
    const { rerender } = render(
      <ListEmptyState
        icon={Target}
        title="No opportunities yet"
        description="…"
        resource="opportunities"
      />,
    );
    expect(logClientEvent).toHaveBeenCalledTimes(1);
    expect(logClientEvent).toHaveBeenCalledWith(
      "admin_list_empty_shown",
      { surface: "admin_list", resource: "opportunities", reason: "no_records" },
      "info",
    );

    // Same resource+reason → deduped.
    rerender(
      <ListEmptyState
        icon={Target}
        title="No opportunities yet"
        description="…"
        resource="opportunities"
      />,
    );
    expect(logClientEvent).toHaveBeenCalledTimes(1);
  });

  it("escalates to warn when reason is seed_missing", () => {
    render(
      <ListEmptyState
        icon={Target}
        title="No opportunities yet"
        description="…"
        resource="opportunities"
        reason="seed_missing"
      />,
    );
    expect(logClientEvent).toHaveBeenCalledWith(
      "admin_list_empty_shown",
      { surface: "admin_list", resource: "opportunities", reason: "seed_missing" },
      "warn",
    );
  });

  it("stays silent when no resource is provided", () => {
    render(<ListEmptyState icon={Target} title="No records" description="…" />);
    expect(logClientEvent).not.toHaveBeenCalled();
  });
});
