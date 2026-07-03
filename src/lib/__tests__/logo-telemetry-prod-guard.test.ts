/**
 * Verifies the production-build guard: buildLogoTelemetryDump(),
 * dumpLogoTelemetryAsJSON(), copyLogoTelemetryDump() (via the
 * __nevoLogoDebug shim), and downloadLogoTelemetryDump() must refuse
 * to expose telemetry when running outside a dev bundle.
 *
 * We flip the runtime guard via the documented escape hatch
 * (`globalThis.__NEVO_FORCE_DISABLE_LOGO_DEBUG__`) since import.meta.env
 * is frozen for the test process.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildLogoTelemetryDump,
  dumpLogoTelemetryAsJSON,
  downloadLogoTelemetryDump,
} from "../logo-telemetry-debug";
import {
  clearLogoDecisions,
  recordLogoDecision,
  type LogoDecisionRecord,
} from "../logo-telemetry";

const g = globalThis as {
  __NEVO_FORCE_DISABLE_LOGO_DEBUG__?: boolean;
};

const record = (): LogoDecisionRecord => ({
  kind: "render",
  decision: "sampled-in",
  reason: "first-render",
  stage: null,
  terminal: undefined,
  correlationId: "cid-abc",
  counters: {
    renderLogged: true,
    renderSampled: true,
    errorCount: 0,
    lastErrorStage: "",
    msSinceLastError: null,
  },
  limits: { renderSampleRate: 1, errorMaxPerSession: 10, errorMinIntervalMs: 0 },
  ts: 0,
});

beforeEach(() => {
  clearLogoDecisions();
  g.__NEVO_FORCE_DISABLE_LOGO_DEBUG__ = true;
});
afterEach(() => {
  clearLogoDecisions();
  delete g.__NEVO_FORCE_DISABLE_LOGO_DEBUG__;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("logo telemetry production guard", () => {
  it("build/dump return a disabled marker with no captured telemetry", () => {
    recordLogoDecision(record());
    const dump = buildLogoTelemetryDump("console");
    expect(dump.disabled).toBe(true);
    expect(dump.decisions).toEqual([]);
    expect(dump.url).toBeNull();
    expect(dump.userAgent).toBeNull();
    expect(dump.redactions).toEqual(["disabled:production-build"]);
    expect(dumpLogoTelemetryAsJSON("console")).toBe("");
  });

  it("downloadDump is a no-op and never triggers a download", () => {
    const createElement = vi.fn();
    vi.stubGlobal("document", {
      createElement,
      body: { appendChild: vi.fn() },
    });
    vi.stubGlobal("window", {
      Blob: class {},
      URL: { createObjectURL: vi.fn(), revokeObjectURL: vi.fn() },
    });
    expect(downloadLogoTelemetryDump("button")).toBe("");
    expect(createElement).not.toHaveBeenCalled();
  });

  it("attachLogoDebugUtil does not attach __nevoLogoDebug when disabled", async () => {
    const fakeWindow: Record<string, unknown> = {};
    vi.stubGlobal("window", fakeWindow);
    const { attachLogoDebugUtil } = await import("../logo-telemetry-debug");
    attachLogoDebugUtil();
    expect(fakeWindow.__nevoLogoDebug).toBeUndefined();
  });
});
