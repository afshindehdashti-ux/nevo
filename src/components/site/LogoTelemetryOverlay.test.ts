import { describe, expect, it } from "vitest";
import { shouldShowLogoTelemetryOverlay } from "./logo-telemetry-overlay-visibility";

describe("logo telemetry overlay visibility", () => {
  it("stays hidden during normal local development", () => {
    expect(
      shouldShowLogoTelemetryOverlay({
        isDev: true,
        debugEnabled: false,
        available: true,
      }),
    ).toBe(false);
  });

  it("renders only when development, debug, and the utility are all available", () => {
    expect(
      shouldShowLogoTelemetryOverlay({
        isDev: true,
        debugEnabled: true,
        available: true,
      }),
    ).toBe(true);

    expect(
      shouldShowLogoTelemetryOverlay({
        isDev: false,
        debugEnabled: true,
        available: true,
      }),
    ).toBe(false);

    expect(
      shouldShowLogoTelemetryOverlay({
        isDev: true,
        debugEnabled: true,
        available: false,
      }),
    ).toBe(false);
  });
});
