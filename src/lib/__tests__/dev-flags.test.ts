import { describe, it, expect } from "vitest";
import { DEV_OVERLAY_FLAGS, resolveDevOverlay, type DevOverlayFlag } from "@/lib/dev-flags";

const flag: DevOverlayFlag = "route-area-badge";

describe("resolveDevOverlay", () => {
  it("is off by default in a dev build with no opt-in", () => {
    expect(resolveDevOverlay(flag, { isDev: true })).toBe(false);
    expect(resolveDevOverlay(flag, { isDev: true, envValue: null, storageValue: null })).toBe(false);
  });

  it("stays off in production even with an explicit opt-in", () => {
    expect(resolveDevOverlay(flag, { isDev: false, envValue: "all" })).toBe(false);
    expect(resolveDevOverlay(flag, { isDev: false, storageValue: flag })).toBe(false);
  });

  it("stays off during automated (E2E / visual) runs", () => {
    expect(
      resolveDevOverlay(flag, { isDev: true, envValue: "all", isAutomated: true }),
    ).toBe(false);
    expect(
      resolveDevOverlay(flag, { isDev: true, storageValue: "all", isAutomated: true }),
    ).toBe(false);
  });

  it("turns on for an exact flag name from env or storage", () => {
    expect(resolveDevOverlay(flag, { isDev: true, envValue: flag })).toBe(true);
    expect(resolveDevOverlay(flag, { isDev: true, storageValue: flag })).toBe(true);
  });

  it("supports comma/space separated lists", () => {
    expect(
      resolveDevOverlay(flag, { isDev: true, envValue: "layout-grid, route-area-badge" }),
    ).toBe(true);
    expect(resolveDevOverlay(flag, { isDev: true, envValue: "layout-grid query-devtools" })).toBe(
      false,
    );
  });

  it("supports wildcard tokens", () => {
    for (const token of ["all", "1", "true", "*", "on", "yes"]) {
      for (const f of DEV_OVERLAY_FLAGS) {
        expect(resolveDevOverlay(f, { isDev: true, envValue: token })).toBe(true);
      }
    }
  });

  it("treats explicit off tokens as off", () => {
    for (const token of ["", "0", "false", "none", "off", "no"]) {
      expect(resolveDevOverlay(flag, { isDev: true, envValue: token })).toBe(false);
    }
  });

  it("is case-insensitive and tolerant of stray whitespace", () => {
    expect(resolveDevOverlay(flag, { isDev: true, envValue: "  ROUTE-AREA-BADGE  " })).toBe(true);
  });

  it("does not enable other flags when one is selected", () => {
    expect(resolveDevOverlay("layout-grid", { isDev: true, envValue: flag })).toBe(false);
  });
});
