/**
 * Guarantee: every Sentry artifact produced by the header-logo forwarder
 * for a given page load carries the same correlationId. This is what makes
 * "click one Sentry issue → see the full fallback chain for that user's
 * page load" possible.
 *
 * Concretely, for the sequence primary-light-png → fallback-cdn-full →
 * fallback-inline-svg (terminal) — three separate events emitted by the
 * client during one page load — this test verifies that in every event
 * the forwarder builds:
 *
 *   - event.tags.correlation_id
 *   - event.contexts.logo.correlationId
 *   - event.extra.correlationId
 *   - event.user.id
 *   - event.fingerprint[last]
 *   - event.message.formatted includes `cid=<id>`
 *   - every breadcrumb has data.correlationId AND its message contains `[cid:<id>]`
 *
 * all equal the same non-empty correlationId.
 */
import { describe, expect, it } from "vitest";
import { buildSentryEvent, type LogoHistoryEntry } from "../sentry-forwarder.server";

const CID = "abc123-page-load-42";

type ForwarderEvent = Parameters<typeof buildSentryEvent>[0];

function makeEvent(over: Partial<ForwarderEvent> = {}): ForwarderEvent {
  return {
    correlationId: CID,
    stage: "primary-light-png",
    variant: "light",
    failedSrc: "https://cdn.example.com/nevo-logo.png",
    nextSrc: "https://cdn.example.com/nevo-logo-full.png",
    viewportWidth: 1280,
    online: true,
    terminal: false,
    schema: "header.logo/v1",
    schemaVersion: 1,
    route: "/",
    url: "https://nevo.example/",
    ua: "vitest",
    release: "test",
    clientTs: "2026-07-03T12:00:00.000Z",
    extra: {},
    history: [],
    ...over,
  };
}

const history: LogoHistoryEntry[] = [
  {
    eventType: "error",
    stage: "primary-light-png",
    variant: "light",
    src: "https://cdn.example.com/nevo-logo.png",
    nextSrc: "https://cdn.example.com/nevo-logo-full.png",
    online: true,
    clientTs: "2026-07-03T12:00:00.000Z",
  },
  {
    eventType: "error",
    stage: "fallback-cdn-full",
    variant: "light",
    src: "https://cdn.example.com/nevo-logo-full.png",
    nextSrc: "data:image/svg+xml;utf8,<svg/>",
    online: true,
    clientTs: "2026-07-03T12:00:00.100Z",
  },
];

/** Every place a correlationId is expected to appear inside one Sentry event. */
function assertCorrelationIdEverywhere(ev: ReturnType<typeof buildSentryEvent>, cid: string) {
  // tags
  expect(ev.tags.correlation_id).toBe(cid);
  // context
  expect(ev.contexts.logo.correlationId).toBe(cid);
  // extra
  expect(ev.extra.correlationId).toBe(cid);
  // user (used by Sentry for per-user grouping in the UI)
  expect(ev.user?.id).toBe(cid);
  // fingerprint — cid is the last segment so all stages of one page load merge
  expect(Array.isArray(ev.fingerprint)).toBe(true);
  expect(ev.fingerprint[ev.fingerprint.length - 1]).toBe(cid);
  expect(ev.fingerprint).toContain(cid);
  // message
  expect(ev.message.formatted).toContain(`cid=${cid}`);
  // breadcrumbs — every single crumb must carry the cid in data AND in its message
  expect(ev.breadcrumbs.values.length).toBeGreaterThan(0);
  for (const crumb of ev.breadcrumbs.values) {
    expect(crumb.data.correlationId).toBe(cid);
    expect(crumb.message).toContain(`[cid:${cid}]`);
  }
}

describe("sentry-forwarder buildSentryEvent — correlationId propagation", () => {
  it("stamps the correlationId on every field of a single-stage event", () => {
    const ev = buildSentryEvent(makeEvent());
    assertCorrelationIdEverywhere(ev, CID);
  });

  it("stamps the correlationId on every field of a terminal event with history", () => {
    const ev = buildSentryEvent(
      makeEvent({
        stage: "fallback-inline-svg",
        terminal: true,
        failedSrc: "data:image/svg+xml;utf8,<svg/>",
        nextSrc: undefined,
        clientTs: "2026-07-03T12:00:00.200Z",
        history,
      }),
    );
    assertCorrelationIdEverywhere(ev, CID);
    // The tail breadcrumb reflects the terminal failure.
    const tail = ev.breadcrumbs.values.at(-1)!;
    expect(tail.category).toBe("header.logo.error");
    expect(tail.level).toBe("error");
    expect(tail.message).toBe(`[cid:${CID}] fail:fallback-inline-svg`);
  });

  it("keeps the SAME correlationId across all three stages of one page load", () => {
    const primary = buildSentryEvent(makeEvent());
    const cdn = buildSentryEvent(
      makeEvent({
        stage: "fallback-cdn-full",
        failedSrc: "https://cdn.example.com/nevo-logo-full.png",
        nextSrc: "data:image/svg+xml;utf8,<svg/>",
        clientTs: "2026-07-03T12:00:00.100Z",
        history: history.slice(0, 1),
      }),
    );
    const svg = buildSentryEvent(
      makeEvent({
        stage: "fallback-inline-svg",
        terminal: true,
        failedSrc: "data:image/svg+xml;utf8,<svg/>",
        nextSrc: undefined,
        clientTs: "2026-07-03T12:00:00.200Z",
        history,
      }),
    );

    for (const ev of [primary, cdn, svg]) {
      assertCorrelationIdEverywhere(ev, CID);
    }

    // Same cid segment in every fingerprint → Sentry groups all three into
    // the same issue instead of splitting by stage.
    for (const ev of [primary, cdn, svg]) {
      expect(ev.fingerprint.at(-1)).toBe(CID);
    }

    // History breadcrumbs on the terminal event cover every prior stage
    // and each one carries the shared cid.
    const stages = svg.breadcrumbs.values.map((c) => c.message);
    expect(stages).toEqual([
      `[cid:${CID}] fail:primary-light-png`,
      `[cid:${CID}] fail:fallback-cdn-full`,
      `[cid:${CID}] fail:fallback-inline-svg`,
    ]);
  });

  it("falls back to 'no-cid' fingerprint segment and '-' placeholder when correlationId is missing", () => {
    const ev = buildSentryEvent(makeEvent({ correlationId: undefined }));
    // Fingerprint MUST always end with a stable segment so Sentry grouping stays sane.
    expect(ev.fingerprint.at(-1)).toBe("no-cid");
    // User id is dropped when there is no cid (avoids inventing IDs).
    expect(ev.user).toBeUndefined();
    // Every artifact that renders the cid uses the '-' placeholder consistently.
    expect(ev.message.formatted).toContain("cid=-");
    for (const crumb of ev.breadcrumbs.values) {
      expect(crumb.message).toContain("[cid:-]");
      expect(crumb.data.correlationId).toBeNull();
    }
  });
});
