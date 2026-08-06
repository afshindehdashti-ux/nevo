// Exponential-backoff retry helper for transient failures on the alert path.
// Server-only — uses setTimeout + Math.random for jitter.
//
// Design:
// - Retries only on results the caller marks transient via `isTransient`.
// - Delay = min(maxDelayMs, baseDelayMs * 2^attempt) with +/- jitter.
// - Always logs each retry so ops can see it in server-function logs.

export interface RetryOptions<T> {
  /** Human label used in log lines (e.g. "twilio-send"). */
  label: string;
  /** Total attempts including the first. Default 4 → 1 initial + 3 retries. */
  maxAttempts?: number;
  /** Base delay in ms for attempt 0 → attempt 1 wait. Default 250. */
  baseDelayMs?: number;
  /** Absolute cap per wait. Default 4000. */
  maxDelayMs?: number;
  /** Jitter fraction (0..1). Default 0.3 → ±30%. */
  jitter?: number;
  /** Return true when the result should trigger another retry. */
  isTransient?: (result: T) => boolean;
}

export interface RetryOutcome<T> {
  result: T;
  attempts: number;
}

/** HTTP status codes we treat as transient (worth retrying). */
export function isTransientHttpStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitter: number,
): number {
  const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  const spread = exp * jitter;
  const delta = (Math.random() * 2 - 1) * spread;
  return Math.max(0, Math.round(exp + delta));
}

/**
 * Run `fn` with exponential backoff. Retries when `fn` throws OR when
 * `isTransient(result)` returns true. Non-transient results are returned
 * immediately.
 */
export async function retryWithBackoff<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions<T>,
): Promise<RetryOutcome<T>> {
  const {
    label,
    maxAttempts = 4,
    baseDelayMs = 250,
    maxDelayMs = 4000,
    jitter = 0.3,
    isTransient,
  } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn(attempt);
      if (attempt < maxAttempts - 1 && isTransient?.(result)) {
        const delay = computeDelay(attempt, baseDelayMs, maxDelayMs, jitter);
        console.warn(
          `[retry:${label}] transient result on attempt ${attempt + 1}/${maxAttempts}; retrying in ${delay}ms`,
        );
        await sleep(delay);
        continue;
      }
      if (attempt > 0) {
        console.info(`[retry:${label}] succeeded on attempt ${attempt + 1}/${maxAttempts}`);
      }
      return { result, attempts: attempt + 1 };
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      if (attempt >= maxAttempts - 1) {
        console.error(`[retry:${label}] gave up after ${maxAttempts} attempts: ${message}`);
        throw err;
      }
      const delay = computeDelay(attempt, baseDelayMs, maxDelayMs, jitter);
      console.warn(
        `[retry:${label}] threw on attempt ${attempt + 1}/${maxAttempts}: ${message}; retrying in ${delay}ms`,
      );
      await sleep(delay);
    }
  }

  // Unreachable — the loop either returns or throws.
  throw lastError instanceof Error ? lastError : new Error(`[retry:${label}] exhausted`);
}
