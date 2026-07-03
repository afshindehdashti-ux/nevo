/**
 * Server-side sampler for header.logo.error → Sentry forwards.
 *
 * Goal: keep Sentry volume low during storms (a broken CDN can fire the same
 * error thousands of times per minute) without losing real-time alert
 * fidelity on genuinely new failure modes.
 *
 * Policy (in priority order):
 *   1. Terminal errors (final fallback exhausted) — ALWAYS forward.
 *      These are the alertable signal; sampling them defeats the purpose.
 *   2. First `ALWAYS_SEND_FIRST_N` errors per `${stage}|${variant}` bucket
 *      inside a rolling `WINDOW_MS` window — ALWAYS forward.
 *      First occurrences of a new stage/variant combo reach Sentry immediately.
 *   3. Everything else — sample 1-in-`SAMPLE_RATE_DIVISOR`.
 *      Deterministic modulo counter (not random) so behavior is testable
 *      and predictable under load.
 *
 * State is process-local. On Cloudflare Workers each isolate keeps its own
 * counters; that's acceptable — worst case a burst is fanned across a
 * handful of isolates instead of one, still ~100× reduction versus no
 * sampling. We never persist counters (Sentry rate-limits its own ingest
 * anyway).
 *
 * Env overrides (all optional, integers):
 *   SENTRY_LOGO_WINDOW_MS         default 60_000
 *   SENTRY_LOGO_FIRST_N           default 3
 *   SENTRY_LOGO_SAMPLE_DIVISOR    default 20
 *   SENTRY_LOGO_MAX_BUCKETS       default 512  (LRU cap to avoid unbounded growth)
 */

type SamplerInput = {
  stage?: string;
  variant?: string;
  terminal?: boolean;
};

export type SamplingDecision = {
  forward: boolean;
  /** Why the decision was made — surfaced as a Sentry tag for observability. */
  reason:
    | "terminal"
    | "first-n"
    | "sampled-in"
    | "sampled-out"
    | "no-bucket";
  /** Ordinal of this event within its bucket window (1 = first). */
  windowIndex: number;
  /** Bucket key used (for debugging). */
  bucketKey: string;
  /** Divisor applied when sampling non-first-N events. */
  sampleDivisor: number;
};

type Bucket = {
  count: number;
  windowStart: number;
};

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const WINDOW_MS = intFromEnv("SENTRY_LOGO_WINDOW_MS", 60_000);
const ALWAYS_SEND_FIRST_N = intFromEnv("SENTRY_LOGO_FIRST_N", 3);
const SAMPLE_RATE_DIVISOR = intFromEnv("SENTRY_LOGO_SAMPLE_DIVISOR", 20);
const MAX_BUCKETS = intFromEnv("SENTRY_LOGO_MAX_BUCKETS", 512);

// Module-scope state — per-isolate. Map iteration order is insertion order,
// which we use as a cheap LRU: on eviction we drop the oldest entry.
const buckets = new Map<string, Bucket>();

function evictIfNeeded() {
  while (buckets.size > MAX_BUCKETS) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
}

function touchBucket(key: string, now: number): Bucket {
  let b = buckets.get(key);
  if (!b || now - b.windowStart >= WINDOW_MS) {
    b = { count: 0, windowStart: now };
  } else {
    // Refresh LRU position.
    buckets.delete(key);
  }
  b.count += 1;
  buckets.set(key, b);
  evictIfNeeded();
  return b;
}

export function decideForwardLogoError(input: SamplerInput, now = Date.now()): SamplingDecision {
  const stage = input.stage ?? "unknown";
  const variant = input.variant ?? "unknown";
  const bucketKey = `${stage}|${variant}`;

  // Rule 1: terminal always wins — count it too, so the bucket state stays
  // honest for subsequent non-terminal decisions.
  if (input.terminal === true) {
    const b = touchBucket(bucketKey, now);
    return {
      forward: true,
      reason: "terminal",
      windowIndex: b.count,
      bucketKey,
      sampleDivisor: SAMPLE_RATE_DIVISOR,
    };
  }

  const b = touchBucket(bucketKey, now);

  // Rule 2: always send the first N in each window.
  if (b.count <= ALWAYS_SEND_FIRST_N) {
    return {
      forward: true,
      reason: "first-n",
      windowIndex: b.count,
      bucketKey,
      sampleDivisor: SAMPLE_RATE_DIVISOR,
    };
  }

  // Rule 3: deterministic 1-in-N modulo sampling for the tail.
  // Offset so the very next call after the first-N phase is a "sampled-in"
  // event only when it lands on the divisor boundary.
  const tailIndex = b.count - ALWAYS_SEND_FIRST_N;
  const sampledIn = SAMPLE_RATE_DIVISOR <= 1 || tailIndex % SAMPLE_RATE_DIVISOR === 0;
  return {
    forward: sampledIn,
    reason: sampledIn ? "sampled-in" : "sampled-out",
    windowIndex: b.count,
    bucketKey,
    sampleDivisor: SAMPLE_RATE_DIVISOR,
  };
}

/** Test-only: clear counters between runs. */
export function __resetLogoSampler() {
  buckets.clear();
}

export const LOGO_SAMPLER_CONFIG = Object.freeze({
  WINDOW_MS,
  ALWAYS_SEND_FIRST_N,
  SAMPLE_RATE_DIVISOR,
  MAX_BUCKETS,
});
