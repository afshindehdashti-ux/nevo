import { beforeEach, describe, expect, it } from "vitest";
import { clearLogoDecisions, shouldLogError, shouldLogRender } from "../logo-telemetry";
import { buildLogoTelemetryDump, dumpLogoTelemetryAsJSON } from "../logo-telemetry-debug";

beforeEach(() => clearLogoDecisions());

function seed() {
  // Two distinct incidents worth of decisions in the ring buffer.
  shouldLogRender({ correlationId: "cid-alpha", random: () => 0 });
  shouldLogError("primary-light-png", false, { correlationId: "cid-alpha" });
  shouldLogError("fallback-inline-svg", true, { correlationId: "cid-alpha" });
  shouldLogError("primary-light-png", false, { correlationId: "cid-beta" });
  shouldLogError("primary-light-png", true, { correlationId: "cid-beta" });
}

describe("dump filter by correlationId", () => {
  it("returns only decisions matching the requested correlationId", () => {
    seed();
    const dump = buildLogoTelemetryDump("console", { correlationId: "cid-alpha" });
    expect(dump.decisions.length).toBe(3);
    for (const d of dump.decisions) {
      expect(d.correlationId).toBe("cid-alpha");
    }
    expect(dump.filter).toEqual({
      correlationId: "cid-alpha",
      criteria: { correlationId: "cid-alpha" },
      matchedCount: 3,
      totalScanned: 5,
    });
  });

  it("reports zero matches distinctly (not a filter failure)", () => {
    seed();
    const dump = buildLogoTelemetryDump("button", { correlationId: "cid-missing" });
    expect(dump.decisions).toEqual([]);
    expect(dump.filter).toEqual({
      correlationId: "cid-missing",
      criteria: { correlationId: "cid-missing" },
      matchedCount: 0,
      totalScanned: 5,
    });
  });

  it("omits filter metadata for an unscoped dump", () => {
    seed();
    const dump = buildLogoTelemetryDump("console");
    expect(dump.filter).toBeUndefined();
    expect(dump.decisions.length).toBe(5);
  });

  it("JSON variant serializes the scoped dump", () => {
    seed();
    const json = dumpLogoTelemetryAsJSON("console", { correlationId: "cid-beta" });
    const parsed = JSON.parse(json);
    expect(parsed.filter.correlationId).toBe("cid-beta");
    expect(parsed.decisions.length).toBe(2);
    for (const d of parsed.decisions) {
      expect(d.correlationId).toBe("cid-beta");
    }
  });
});
