type JsonBody = Record<string, unknown>;

const DEFAULT_ALLOWED_ORIGINS = [
  "https://nevoindustrial.com",
  "https://www.nevoindustrial.com",
];

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

function configuredOrigins(): string[] {
  const raw =
    process.env.API_ALLOWED_ORIGINS ||
    process.env.CORS_ALLOWED_ORIGINS ||
    process.env.APP_URL ||
    process.env.SITE_URL ||
    "";
  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...origins]));
}

export function requestOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = requestOrigin(request);
  if (!origin) return true;
  return configuredOrigins().includes(origin);
}

export function corsHeaders(request: Request, options?: { methods?: string; headers?: string }): HeadersInit {
  const origin = requestOrigin(request);
  const headers: Record<string, string> = {
    "access-control-allow-methods": options?.methods ?? "POST, OPTIONS",
    "access-control-allow-headers": options?.headers ?? "content-type, authorization, x-bootstrap-token",
    "access-control-max-age": "86400",
    vary: "Origin",
  };

  if (origin && isAllowedOrigin(request)) {
    headers["access-control-allow-origin"] = origin;
  }

  return headers;
}

export function jsonError(status: number, error: string, extra?: JsonBody, headers?: HeadersInit): Response {
  return Response.json({ ok: false, error, ...(extra ?? {}) }, { status, headers });
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    forwarded ||
    "unknown"
  );
}

export function timingSafeEqualText(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aa = encoder.encode(a);
  const bb = encoder.encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i += 1) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

export function assertAllowedOrigin(request: Request, headers?: HeadersInit): Response | null {
  if (isAllowedOrigin(request)) return null;
  return jsonError(403, "origin_not_allowed", undefined, headers);
}

export function assertRateLimit(
  request: Request,
  keyPrefix: string,
  options?: { limit?: number; windowMs?: number },
): Response | null {
  const limit = options?.limit ?? 30;
  const windowMs = options?.windowMs ?? 60_000;
  const now = Date.now();
  const key = `${keyPrefix}:${getClientIp(request)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  bucket.count += 1;
  if (bucket.count <= limit) return null;

  const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
  const headers = new Headers(corsHeaders(request));
  headers.set("retry-after", String(retryAfterSeconds));

  return jsonError(429, "rate_limited", { retryAfterSeconds }, headers);
}
