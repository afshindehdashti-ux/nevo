/**
 * Verifies the QA "one-paste" dump helpers exposed on __nevoLogoDebug.
 *
 *  - buildLogoTelemetryDump() produces a schema-tagged snapshot with
 *    metadata + config + state + the ring-buffer decisions
 *  - decisionsTruncated flips true only when the buffer is at cap
 *  - dumpAsJSON() is valid, round-trippable JSON
 *  - copyLogoTelemetryDump() echoes to console and writes to clipboard
 *    when the API is available; still resolves the JSON when it isn't
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildLogoTelemetryDump,
  dumpLogoTelemetryAsJSON,
} from "../logo-telemetry-debug";
import {
  LOGO_DECISION_BUFFER_SIZE,
  clearLogoDecisions,
  createLogoRateState,
  shouldLogError,
  shouldLogRender,
} from "../logo-telemetry";
import type { LogoTelemetryConfig } from "../logo-telemetry-config";

const cfg = (over: Partial<LogoTelemetryConfig> = {}): LogoTelemetryConfig => ({
  renderSampleRate: 1,
  errorMaxPerSession: 1000,
  errorMinIntervalMs: 0,
  debug: false,
  ...over,
});

beforeEach(() => clearLogoDecisions());
afterEach(() => {
  clearLogoDecisions();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("logo telemetry QA dump", () => {
  it("builds a schema-tagged blob with metadata, state, and decisions", () => {
    const state = createLogoRateState();
    shouldLogRender({ state, config: cfg(), random: () => 0, correlationId: "cid-X" });
    shouldLogError("primary-light-png", false, {
      state,
      config: cfg(),
      now: () => 42,
      correlationId: "cid-X",
    });

    const dump = buildLogoTelemetryDump("console");
    expect(dump.schema).toBe("nevo.logo-telemetry.dump/v1");
    expect(dump.origin).toBe("console");
    expect(typeof dump.capturedAt).toBe("string");
    expect(new Date(dump.capturedAt).toString()).not.toBe("Invalid Date");
    expect(dump.decisions).toHaveLength(2);
    expect(dump.decisions[0]).toMatchObject({ kind: "render", correlationId: "cid-X" });
    expect(dump.decisions[1]).toMatchObject({
      kind: "error",
      stage: "primary-light-png",
      correlationId: "cid-X",
    });
    expect(dump.decisionsTruncated).toBe(false);
    expect(dump.config).toHaveProperty("renderSampleRate");
    expect(dump.state).toHaveProperty("errorCount");
  });

  it("flags decisionsTruncated once the ring buffer is at cap", () => {
    const state = createLogoRateState();
    const config = cfg({ errorMaxPerSession: 10_000 });
    for (let i = 0; i < LOGO_DECISION_BUFFER_SIZE + 5; i++) {
      shouldLogError("primary-light-png", false, {
        state,
        config,
        now: () => i,
      });
    }
    expect(buildLogoTelemetryDump().decisionsTruncated).toBe(true);
  });

  it("dumpAsJSON() returns pretty-printed, parseable JSON", () => {
    const json = dumpLogoTelemetryAsJSON("button");
    expect(json).toContain("\n  "); // pretty-printed
    const parsed = JSON.parse(json);
    expect(parsed.schema).toBe("nevo.logo-telemetry.dump/v1");
    expect(parsed.origin).toBe("button");
  });

  it("__nevoLogoDebug.copyDump() echoes to console + writes to clipboard when available", async () => {
    // Attach in a headless test env: import.meta.env.DEV is true under vitest,
    // but window may not have the util yet since attach ran at import time in
    // this module. Re-attach explicitly.
    const { attachLogoDebugUtil } = await import("../logo-telemetry-debug");
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: { writeText },
      userAgent: "vitest",
    });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    attachLogoDebugUtil();
    const w = window as unknown as {
      __nevoLogoDebug?: { copyDump: (o?: string) => Promise<string> };
    };
    expect(w.__nevoLogoDebug).toBeDefined();
    const json = await w.__nevoLogoDebug!.copyDump("console");
    expect(writeText).toHaveBeenCalledWith(json);
    expect(logSpy).toHaveBeenCalledWith("[nevo:logo-telemetry] dump", json);
  });

  it("copyDump() still resolves the JSON when clipboard is unavailable", async () => {
    const { attachLogoDebugUtil } = await import("../logo-telemetry-debug");
    vi.stubGlobal("navigator", { userAgent: "vitest" }); // no clipboard
    vi.spyOn(console, "log").mockImplementation(() => {});
    attachLogoDebugUtil();
    const w = window as unknown as {
      __nevoLogoDebug?: { copyDump: () => Promise<string> };
    };
    const json = await w.__nevoLogoDebug!.copyDump();
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
