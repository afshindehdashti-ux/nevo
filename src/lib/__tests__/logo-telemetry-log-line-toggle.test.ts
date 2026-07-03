import { afterEach, describe, expect, it, vi } from "vitest";
import { shouldLogRender } from "../logo-telemetry";
import type { LogoTelemetryConfig } from "../logo-telemetry-config";

const cfg = (over: Partial<LogoTelemetryConfig> = {}): LogoTelemetryConfig => ({
  renderSampleRate: 1,
  errorMaxPerSession: 4,
  errorMinIntervalMs: 1000,
  debug: true,
  logLine: true,
  ...over,
});

afterEach(() => vi.restoreAllMocks());

describe("logo debug logLine runtime toggle", () => {
  it("prints the grep-friendly console line when logLine is true", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    shouldLogRender({
      state: { renderLogged: false, renderSampled: null, errorCount: 0, lastErrorAt: 0, lastErrorStage: "" },
      config: cfg({ logLine: true }),
      random: () => 0,
    });
    expect(spy).toHaveBeenCalledWith(
      "[nevo:logo-telemetry]",
      expect.stringContaining("kind=render"),
    );
  });

  it("suppresses the console line when logLine is false but keeps sampling behavior", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const state = { renderLogged: false, renderSampled: null, errorCount: 0, lastErrorAt: 0, lastErrorStage: "" };
    const result = shouldLogRender({
      state,
      config: cfg({ logLine: false }),
      random: () => 0,
    });
    expect(result).toBe(true);
    expect(state.renderLogged).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });
});
