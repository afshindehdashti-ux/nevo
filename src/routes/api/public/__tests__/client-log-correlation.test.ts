/**
 * End-to-end verification of the /api/public/client-log POST handler:
 *
 * When the client posts a batch of header.logo.* events, the route must
 *   1. Persist EVERY row into public.header_logo_events with the caller's
 *      correlation_id intact (renders + errors).
 *   2. For every unique correlationId in the error subset, look up the
 *      full history from public.header_logo_events ordered by client_ts.
 *   3. Forward each error to sentry-forwarder hydrated with:
 *        - the original correlationId,
 *        - the full per-correlationId history array.
 *
 * The route uses dynamic `await import(...)` inside the handler, so we
 * mock those two modules via vi.mock and drive POST directly by
 * constructing a Fetch Request and calling the handler on Route.options.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---- Mocks ---------------------------------------------------------------

const insertSpy = vi.fn(async (_rows: unknown[]) => ({ error: null }));
type HistoryRow = {
  correlation_id: string | null;
  event_type: "render" | "error";
  stage: string | null;
  variant: string | null;
  src: string | null;
  next_src: string | null;
  online: boolean | null;
  client_ts: string | null;
};
let historyRows: HistoryRow[] = [];
let inCidsCapture: string[] = [];

vi.mock("@/integrations/supabase/client.server", () => {
  const from = (_table: string) => ({
    insert: (rows: unknown[]) => insertSpy(rows),
    select: (_cols: string) => ({
      in: (_col: string, ids: string[]) => {
        inCidsCapture = [...ids];
        return {
          order: (_col2: string, _opts: unknown) => ({
            limit: async (_n: number) => ({
              data: historyRows.filter((r) => r.correlation_id && ids.includes(r.correlation_id)),
              error: null,
            }),
          }),
        };
      },
    }),
  });
  return { supabaseAdmin: { from } };
});

const forwardSpy = vi.fn(async (_events: unknown[]) => {});
vi.mock("@/lib/sentry-forwarder.server", () => ({
  forwardLogoErrorsToSentry: forwardSpy,
}));

// ---- Helpers -------------------------------------------------------------

const CID = "page-load-cid-777";

function entry(over: Record<string, unknown> = {}) {
  return {
    level: "error",
    kind: "manual",
    route: "/",
    url: "https://nevo.example/",
    ua: "vitest",
    release: "test",
    ts: "2026-07-03T12:00:00.000Z",
    message: "header.logo.error",
    extra: { correlationId: CID, stage: "primary-light-png", variant: "light" },
    ...over,
  };
}

async function postBatch(entries: unknown[]) {
  const { Route } = await import("../../src/routes/api/public/client-log");
  const POST = Route.options.server!.handlers!.POST as (ctx: {
    request: Request;
  }) => Promise<Response>;
  const req = new Request("http://localhost/api/public/client-log", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entries }),
  });
  return POST({ request: req });
}

beforeEach(() => {
  insertSpy.mockClear();
  forwardSpy.mockClear();
  inCidsCapture = [];
  historyRows = [];
});

afterEach(() => {
  vi.resetModules();
});

// ---- Tests ---------------------------------------------------------------

describe("/api/public/client-log — correlationId end-to-end", () => {
  it("persists correlation_id on every logo row (render + error)", async () => {
    const res = await postBatch([
      entry({ message: "header.logo.render", extra: { correlationId: CID, variant: "light" } }),
      entry({ message: "header.logo.error", extra: { correlationId: CID, stage: "primary-light-png" } }),
      entry({ message: "header.logo.error", extra: { correlationId: CID, stage: "fallback-cdn-full" } }),
    ]);
    expect(res.status).toBe(200);
    expect(insertSpy).toHaveBeenCalledTimes(1);
    const rows = insertSpy.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(3);
    for (const r of rows) {
      expect(r.correlation_id).toBe(CID);
    }
    expect(rows.map((r) => r.event_type)).toEqual(["render", "error", "error"]);
    expect(rows.map((r) => r.stage)).toEqual([null, "primary-light-png", "fallback-cdn-full"]);
  });

  it("forwards each error to Sentry hydrated with its full per-correlationId history", async () => {
    // Prior history seeded in the DB for this cid.
    historyRows = [
      {
        correlation_id: CID,
        event_type: "render",
        stage: null,
        variant: "light",
        src: null,
        next_src: null,
        online: true,
        client_ts: "2026-07-03T11:59:59.000Z",
      },
      {
        correlation_id: CID,
        event_type: "error",
        stage: "primary-light-png",
        variant: "light",
        src: "https://cdn/primary.png",
        next_src: "https://cdn/full.png",
        online: true,
        client_ts: "2026-07-03T12:00:00.000Z",
      },
    ];

    const res = await postBatch([
      entry({
        message: "header.logo.error",
        extra: {
          correlationId: CID,
          stage: "fallback-cdn-full",
          variant: "light",
          failedSrc: "https://cdn/full.png",
          nextSrc: "data:image/svg+xml;utf8,<svg/>",
          terminal: false,
        },
      }),
      entry({
        message: "header.logo.error",
        extra: {
          correlationId: CID,
          stage: "fallback-inline-svg",
          variant: "light",
          failedSrc: "data:image/svg+xml;utf8,<svg/>",
          terminal: true,
        },
      }),
    ]);
    expect(res.status).toBe(200);

    // The route deduped correlationIds when looking up history.
    expect(inCidsCapture).toEqual([CID]);

    // Sentry forwarder invoked once with both errors, each carrying the
    // correlationId AND the DB history for that cid.
    expect(forwardSpy).toHaveBeenCalledTimes(1);
    const forwarded = forwardSpy.mock.calls[0][0] as Array<{
      correlationId?: string;
      stage?: string;
      terminal?: boolean;
      history?: Array<{ eventType: string; stage: string | null }>;
    }>;
    expect(forwarded).toHaveLength(2);

    for (const ev of forwarded) {
      expect(ev.correlationId).toBe(CID);
      expect(Array.isArray(ev.history)).toBe(true);
      expect(ev.history).toHaveLength(2);
      expect(ev.history![0]).toMatchObject({ eventType: "render", stage: null });
      expect(ev.history![1]).toMatchObject({ eventType: "error", stage: "primary-light-png" });
    }
    expect(forwarded.map((e) => e.stage)).toEqual(["fallback-cdn-full", "fallback-inline-svg"]);
    expect(forwarded.map((e) => e.terminal)).toEqual([false, true]);
  });

  it("dedupes correlationIds and preserves per-cid history isolation across multiple page loads", async () => {
    const CID_A = "cid-A";
    const CID_B = "cid-B";
    historyRows = [
      { correlation_id: CID_A, event_type: "error", stage: "primary-light-png", variant: null, src: null, next_src: null, online: null, client_ts: "2026-07-03T12:00:00.000Z" },
      { correlation_id: CID_B, event_type: "error", stage: "fallback-cdn-full",  variant: null, src: null, next_src: null, online: null, client_ts: "2026-07-03T12:00:01.000Z" },
    ];

    await postBatch([
      entry({ extra: { correlationId: CID_A, stage: "fallback-cdn-full",   terminal: false } }),
      entry({ extra: { correlationId: CID_A, stage: "fallback-inline-svg", terminal: true } }),
      entry({ extra: { correlationId: CID_B, stage: "fallback-inline-svg", terminal: true } }),
    ]);

    // Unique cids only, in insertion order.
    expect(inCidsCapture.sort()).toEqual([CID_A, CID_B]);

    const forwarded = forwardSpy.mock.calls[0][0] as Array<{
      correlationId?: string;
      history?: Array<{ stage: string | null }>;
    }>;
    expect(forwarded).toHaveLength(3);

    // Each event's history only contains rows for its own cid.
    for (const ev of forwarded) {
      for (const h of ev.history ?? []) {
        // stages in the mocked table map 1:1 to cid
        if (ev.correlationId === CID_A) expect(h.stage).toBe("primary-light-png");
        if (ev.correlationId === CID_B) expect(h.stage).toBe("fallback-cdn-full");
      }
    }
  });

  it("still persists rows and calls the forwarder when history lookup returns nothing", async () => {
    historyRows = []; // no prior events in the DB
    await postBatch([
      entry({ extra: { correlationId: CID, stage: "primary-light-png", terminal: false } }),
    ]);
    const rows = insertSpy.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows[0].correlation_id).toBe(CID);
    expect(forwardSpy).toHaveBeenCalledTimes(1);
    const forwarded = forwardSpy.mock.calls[0][0] as Array<{ history?: unknown[] }>;
    expect(forwarded[0].history).toEqual([]); // empty array, not undefined
  });

  it("does not attempt a history lookup or Sentry forward when every error is missing correlationId", async () => {
    await postBatch([
      entry({ extra: { stage: "primary-light-png", terminal: false } }),
    ]);
    // insert still happened (renders/errors persist regardless of cid)
    expect(insertSpy).toHaveBeenCalledTimes(1);
    // no correlationIds → the .in([]) branch is skipped
    expect(inCidsCapture).toEqual([]);
    // the forwarder is still invoked (event without history), but with no cid
    expect(forwardSpy).toHaveBeenCalledTimes(1);
    const forwarded = forwardSpy.mock.calls[0][0] as Array<{ correlationId?: string; history?: unknown[] }>;
    expect(forwarded[0].correlationId).toBeUndefined();
    expect(forwarded[0].history).toEqual([]);
  });
});
