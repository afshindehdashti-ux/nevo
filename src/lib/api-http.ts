/**
 * Shared HTTP helpers for /api/* routes so we always emit JSON, never the SPA
 * shell, on unsupported methods or generic error paths.
 */

export type ApiHandler = (ctx: {
  request: Request;
  params: Record<string, string>;
  context: unknown;
}) => Promise<Response> | Response;

const ALL_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export function methodNotAllowed(allow: string[], extraHeaders?: HeadersInit): Response {
  const headers: Record<string, string> = { allow: allow.join(", ") };
  if (extraHeaders) Object.assign(headers, Object.fromEntries(new Headers(extraHeaders)));
  return Response.json({ ok: false, error: "Method not allowed" }, { status: 405, headers });
}

/**
 * Build a { GET, POST, ... } handler map where every method not present in
 * `allowed` returns a 405 JSON response. Pass extraHeaders to include CORS on
 * the 405 (matches your OPTIONS response).
 */
export function withMethodGuards<
  T extends Partial<Record<(typeof ALL_METHODS)[number] | "OPTIONS", ApiHandler>>,
>(handlers: T, extraHeaders?: HeadersInit): Record<string, ApiHandler> {
  const allowed = ALL_METHODS.filter((m) => typeof handlers[m] === "function");
  const out: Record<string, ApiHandler> = { ...(handlers as Record<string, ApiHandler>) };
  for (const m of ALL_METHODS) {
    if (!out[m]) {
      out[m] = () => methodNotAllowed(allowed, extraHeaders);
    }
  }
  return out;
}
