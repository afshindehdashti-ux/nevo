/**
 * Ensures buildLogoTelemetryDump() / redactLogoTelemetryDump() scrub
 * anything that looks like a token, user identifier, or auth-bearing URL
 * param before the QA blob is exposed. The raw ring buffer is left
 * alone — redaction happens on the dump copy.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildLogoTelemetryDump,
  redactLogoTelemetryDump,
  type LogoTelemetryDump,
} from "../logo-telemetry-debug";
import {
  clearLogoDecisions,
  recordLogoDecision,
  type LogoDecisionRecord,
} from "../logo-telemetry";

const record = (over: Partial<LogoDecisionRecord> = {}): LogoDecisionRecord => ({
  kind: "render",
  decision: "sampled-in",
  reason: "first-render",
  stage: null,
  terminal: undefined,
  correlationId: undefined,
  counters: {
    renderLogged: true,
    renderSampled: true,
    errorCount: 0,
    lastErrorStage: "",
    msSinceLastError: null,
  },
  limits: { renderSampleRate: 1, errorMaxPerSession: 10, errorMinIntervalMs: 0 },
  ts: 0,
  ...over,
});

beforeEach(() => clearLogoDecisions());
afterEach(() => {
  clearLogoDecisions();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("logo telemetry redaction", () => {
  it("redacts sensitive URL query and hash params", () => {
    vi.stubGlobal("window", {
      location: {
        href:
          "http://app.test/oauth/callback?code=abc123&state=xyz&safe=1#access_token=eyJhbGciOi.payload.sig&refresh_token=r_secret",
      },
    });
    const dump = buildLogoTelemetryDump("console");
    expect(dump.url).toContain("safe=1");
    expect(dump.url).toContain("code=%5Bredacted%5D");
    expect(dump.url).toContain("access_token=%5Bredacted%5D");
    expect(dump.url).toContain("refresh_token=%5Bredacted%5D");
    expect(dump.url).not.toContain("abc123");
    expect(dump.url).not.toContain("eyJhbGciOi.payload.sig");
    expect(dump.redactions).toContain("url:params");
  });

  it("strips userinfo from URLs", () => {
    vi.stubGlobal("window", {
      location: { href: "http://alice:pw@app.test/x" },
    });
    const dump = buildLogoTelemetryDump("console");
    expect(dump.url).not.toContain("alice");
    expect(dump.url).not.toContain("pw");
    expect(dump.redactions).toContain("url:params");
  });

  it("redacts JWT / bearer / email-shaped strings inside decisions", () => {
    recordLogoDecision(
      record({
        correlationId: "cid-normal",
        stage: "primary-light-png Bearer abcdef1234567890ABCDEF",
        counters: {
          renderLogged: false,
          renderSampled: null,
          errorCount: 1,
          lastErrorStage: "user@example.com",
          msSinceLastError: null,
        },
      }),
    );
    recordLogoDecision(
      record({
        correlationId:
          "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.abcdefghijklmnop",
      }),
    );

    const dump = buildLogoTelemetryDump("console");
    const [d1, d2] = dump.decisions;
    expect(d1.stage).not.toContain("Bearer");
    expect(d1.stage).toContain("[redacted]");
    expect(d1.counters.lastErrorStage).toBe("[redacted]");
    expect(d2.correlationId).toBe("[redacted]");
    expect(dump.redactions).toEqual(
      expect.arrayContaining(["string:bearer", "string:email"]),
    );
    // Sensitive-looking correlationId → either the JWT string scrub OR
    // the length/pattern-based redaction fires; both produce [redacted].
    expect(
      dump.redactions.some(
        (r) => r === "correlationId" || r === "string:jwt",
      ),
    ).toBe(true);
  });

  it("redacts correlationIds that embed user identifiers", () => {
    recordLogoDecision(
      record({ correlationId: "user:42:session-abc" }),
    );
    recordLogoDecision(
      record({ correlationId: "qa@nevo.example" }),
    );
    const dump = buildLogoTelemetryDump("console");
    expect(dump.decisions[0].correlationId).toBe("[redacted]");
    expect(dump.decisions[1].correlationId).toBe("[redacted]");
    expect(dump.redactions).toContain("correlationId");
  });

  it("passes benign values through unchanged", () => {
    vi.stubGlobal("window", {
      location: { href: "http://app.test/panels?variant=roof" },
    });
    recordLogoDecision(
      record({ correlationId: "cid-123", stage: "primary-light-png" }),
    );
    const dump = buildLogoTelemetryDump("console");
    expect(dump.url).toBe("http://app.test/panels?variant=roof");
    expect(dump.decisions[0].correlationId).toBe("cid-123");
    expect(dump.decisions[0].stage).toBe("primary-light-png");
    expect(dump.redactions).toEqual([]);
  });

  it("redactLogoTelemetryDump does not mutate its input", () => {
    const raw: LogoTelemetryDump = {
      schema: "nevo.logo-telemetry.dump/v1",
      capturedAt: new Date(0).toISOString(),
      origin: "console",
      url: "http://x/?token=abc",
      userAgent: "ua",
      debugEnabled: false,
      config: {
        renderSampleRate: 1,
        errorMaxPerSession: 1,
        errorMinIntervalMs: 0,
        debug: false,
        logLine: true,
      },
      state: {
        renderLogged: false,
        renderSampled: null,
        errorCount: 0,
        lastErrorAt: 0,
        lastErrorStage: "",
      },
      decisions: [record({ correlationId: "user:1" })],
      decisionsTruncated: false,
      redactions: [],
    };
    const snapshot = JSON.stringify(raw);
    const out = redactLogoTelemetryDump(raw);
    expect(JSON.stringify(raw)).toBe(snapshot);
    expect(out.url).toContain("token=%5Bredacted%5D");
    expect(out.decisions[0].correlationId).toBe("[redacted]");
  });
});
