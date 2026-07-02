/**
 * Client-side error & request monitor.
 *
 * Installs global listeners for:
 *   - window.onerror (uncaught JS errors)
 *   - unhandledrejection (unhandled Promise rejections)
 *   - fetch failures (network errors + 5xx/4xx responses)
 *   - console.error (mirrors browser errors to sink)
 *
 * Batches entries and POSTs them to /api/public/client-log where they are
 * written to server logs. Uses navigator.sendBeacon on pagehide so in-flight
 * errors aren't lost on navigation.
 *
 * Bridges into window.__lovableEvents.captureException (see
 * lovable-error-reporting.ts) so Lovable's own capture still fires.
 *
 * SSR-safe: everything guarded on `typeof window`.
 */

const ENDPOINT = "/api/public/client-log";
const FLUSH_INTERVAL_MS = 5_000;
const MAX_BUFFER = 20;
const MAX_STRING = 3800;

type Level = "error" | "warn" | "info";

type Entry = {
  level: Level;
  kind: "error" | "unhandledrejection" | "fetch" | "console" | "manual";
  message: string;
  stack?: string;
  url?: string;
  route?: string;
  ua?: string;
  locale?: string;
  release?: string;
  ts: string;
  extra?: unknown;
};

let installed = false;
let buffer: Entry[] = [];
let flushTimer: ReturnType<typeof setInterval> | undefined;

function trim(v: unknown, cap = MAX_STRING): string {
  if (v == null) return "";
  const str = typeof v === "string" ? v : (() => {
    try { return JSON.stringify(v); } catch { return String(v); }
  })();
  return str.length > cap ? str.slice(0, cap) + "…" : str;
}

function currentContext() {
  if (typeof window === "undefined") return { route: "", ua: "", locale: "", release: "" };
  const seg = window.location.pathname.split("/")[1] || "";
  const locale = /^[a-z]{2}$/.test(seg) ? seg : "";
  return {
    route: window.location.pathname + window.location.search,
    ua: navigator.userAgent,
    locale,
    release: (import.meta.env?.MODE as string) || "production",
  };
}

function enqueue(partial: Omit<Entry, "ts" | "route" | "ua" | "locale" | "release">) {
  if (typeof window === "undefined") return;
  const ctx = currentContext();
  buffer.push({
    ...partial,
    message: trim(partial.message, 800),
    stack: partial.stack ? trim(partial.stack, 2000) : undefined,
    url: partial.url ? trim(partial.url, 400) : undefined,
    ts: new Date().toISOString(),
    ...ctx,
  });
  if (buffer.length >= MAX_BUFFER) void flush();
}

async function flush(useBeacon = false) {
  if (typeof window === "undefined" || buffer.length === 0) return;
  const entries = buffer;
  buffer = [];
  const body = JSON.stringify({ entries });
  try {
    if (useBeacon && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(ENDPOINT, blob);
      return;
    }
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Swallow — don't recurse into the monitor
  }
}

/** Public: log a manual event from anywhere in the app. */
export function logClientEvent(
  message: string,
  extra?: unknown,
  level: Level = "info",
): void {
  enqueue({ level, kind: "manual", message, extra });
}

/** Public: report a caught error explicitly. */
export function reportClientError(error: unknown, extra?: unknown): void {
  const err = error instanceof Error ? error : new Error(String(error));
  enqueue({ level: "error", kind: "manual", message: err.message, stack: err.stack, extra });
}

/** Install once at app boot. Safe to call multiple times. */
export function installClientMonitor(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event: ErrorEvent) => {
    const err = event.error instanceof Error ? event.error : undefined;
    enqueue({
      level: "error",
      kind: "error",
      message: err?.message || event.message || "window.onerror",
      stack: err?.stack,
      url: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined,
    });
  });

  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const err = reason instanceof Error ? reason : undefined;
    enqueue({
      level: "error",
      kind: "unhandledrejection",
      message: err?.message || (typeof reason === "string" ? reason : "Unhandled promise rejection"),
      stack: err?.stack,
      extra: err ? undefined : reason,
    });
  });

  // Wrap fetch to log network failures and non-2xx responses to same-origin
  // and API endpoints. Skips the log endpoint itself to prevent recursion.
  const origFetch = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const [input, init] = args;
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = (init?.method || (input instanceof Request ? input.method : "GET") || "GET").toUpperCase();
    const started = performance.now();
    const isSelf = url.includes(ENDPOINT);
    try {
      const res = await origFetch(...args);
      if (!isSelf && !res.ok && res.status >= 400) {
        enqueue({
          level: res.status >= 500 ? "error" : "warn",
          kind: "fetch",
          message: `${method} ${res.status} ${res.statusText}`,
          url,
          extra: { durationMs: Math.round(performance.now() - started) },
        });
      }
      return res;
    } catch (err) {
      if (!isSelf) {
        const e = err instanceof Error ? err : new Error(String(err));
        enqueue({
          level: "error",
          kind: "fetch",
          message: `${method} network error: ${e.message}`,
          stack: e.stack,
          url,
          extra: { durationMs: Math.round(performance.now() - started) },
        });
      }
      throw err;
    }
  };

  // Mirror console.error to sink (best-effort, capped)
  const origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    try {
      const first = args[0];
      const err = args.find((a) => a instanceof Error) as Error | undefined;
      enqueue({
        level: "error",
        kind: "console",
        message: err?.message || (typeof first === "string" ? first : trim(first, 400)),
        stack: err?.stack,
        extra: args.length > 1 ? trim(args, 800) : undefined,
      });
    } catch { /* ignore */ }
    origError(...args);
  };

  // Flush timer + pagehide beacon
  flushTimer = setInterval(() => void flush(), FLUSH_INTERVAL_MS);
  window.addEventListener("pagehide", () => void flush(true));
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush(true);
  });

  logClientEvent("client-monitor installed", { path: window.location.pathname });
}

export function _teardownForTests() {
  installed = false;
  buffer = [];
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = undefined;
}
