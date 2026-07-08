// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const logClientEvent = vi.fn();
const reportClientError = vi.fn();

vi.mock("@/lib/client-monitor", () => ({
  logClientEvent: (...args: unknown[]) => logClientEvent(...args),
  reportClientError: (...args: unknown[]) => reportClientError(...args),
}));

import { ListErrorState } from "@/components/admin/ListErrorState";

beforeEach(() => {
  logClientEvent.mockReset();
  reportClientError.mockReset();
});
afterEach(() => cleanup());

describe("ListErrorState telemetry", () => {
  it("reports the Supabase failure once per (resource+message)", () => {
    const err = new Error("relation does not exist");
    const { rerender } = render(
      <ListErrorState resource="opportunities" error={err} onRetry={() => {}} />,
    );
    expect(reportClientError).toHaveBeenCalledTimes(1);
    const [reportedErr, extra] = reportClientError.mock.calls[0];
    expect(reportedErr).toBe(err);
    expect(extra).toMatchObject({
      surface: "admin_list",
      resource: "opportunities",
      kind: "supabase_query_failure",
    });

    // Re-render with the same error → no duplicate report.
    rerender(<ListErrorState resource="opportunities" error={err} onRetry={() => {}} />);
    expect(reportClientError).toHaveBeenCalledTimes(1);

    // New error message → reported again.
    const err2 = new Error("timeout");
    rerender(<ListErrorState resource="opportunities" error={err2} onRetry={() => {}} />);
    expect(reportClientError).toHaveBeenCalledTimes(2);
  });

  it("emits admin_list_retry_clicked and calls onRetry when the button is pressed", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <ListErrorState
        resource="commissions"
        error={new Error("network")}
        onRetry={onRetry}
      />,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /retry/i }));
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(logClientEvent).toHaveBeenCalledWith(
      "admin_list_retry_clicked",
      { resource: "commissions", message: "network" },
      "info",
    );
  });

  it("does not emit telemetry when there is no error", () => {
    // Guard: passing undefined error should short-circuit both hooks.
    render(<ListErrorState resource="purchase orders" error={undefined} onRetry={() => {}} />);
    expect(reportClientError).not.toHaveBeenCalled();
  });
});
