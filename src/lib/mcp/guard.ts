import type { ToolContext } from "@lovable.dev/mcp-js";

/**
 * Expected token shape for MCP callers. mcp-js already validates the token's
 * signature, issuer, audience, and expiry against the configured issuer before
 * the handler runs — these checks are a defense-in-depth belt-and-suspenders
 * guard that runs INSIDE the handler, so a mis-wired transport / auth adapter
 * can never let a bad token reach a Supabase query.
 */
const EXPECTED_ISSUER_HOST_SUFFIX = ".supabase.co";
const EXPECTED_AUDIENCE = "authenticated";

export type GuardResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "unauthenticated"
        | "missing_claims"
        | "invalid_issuer"
        | "invalid_audience"
        | "expired"
        | "missing_subject"
        | "missing_client";
      message: string;
    };

function toolError(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true as const };
}

/**
 * Validate the caller's OAuth token claims before touching Supabase.
 * Returns { ok: true } when the caller is safe to proceed, or a tool-error
 * response ready to return from the handler.
 */
export function assertValidCaller(
  ctx: ToolContext,
  opts: { requireOAuthClient?: boolean } = { requireOAuthClient: true },
):
  | { ok: true; userId: string; claims: Record<string, unknown> }
  | { ok: false; error: ReturnType<typeof toolError>; reason: string } {
  if (!ctx.isAuthenticated()) {
    return {
      ok: false,
      reason: "unauthenticated",
      error: toolError("Unauthorized: sign-in required to call this tool."),
    };
  }

  const claims = (ctx.getClaims?.() ?? {}) as Record<string, unknown>;
  if (!claims || typeof claims !== "object") {
    return {
      ok: false,
      reason: "missing_claims",
      error: toolError("Unauthorized: token claims missing."),
    };
  }

  // Issuer must be a Supabase auth server (never a proxy or unrelated IdP).
  const iss = typeof claims.iss === "string" ? claims.iss : "";
  try {
    const host = new URL(iss).host;
    if (!host.endsWith(EXPECTED_ISSUER_HOST_SUFFIX)) {
      return {
        ok: false,
        reason: "invalid_issuer",
        error: toolError(`Unauthorized: unexpected token issuer (${host || "unknown"}).`),
      };
    }
  } catch {
    return {
      ok: false,
      reason: "invalid_issuer",
      error: toolError("Unauthorized: token issuer is not a valid URL."),
    };
  }

  // Audience must include "authenticated".
  const aud = claims.aud;
  const audOk =
    aud === EXPECTED_AUDIENCE ||
    (Array.isArray(aud) && aud.includes(EXPECTED_AUDIENCE));
  if (!audOk) {
    return {
      ok: false,
      reason: "invalid_audience",
      error: toolError("Unauthorized: token audience is not 'authenticated'."),
    };
  }

  // Expiry — reject anything already past exp (guard clock skew of 30s).
  const exp = typeof claims.exp === "number" ? claims.exp : 0;
  const nowSec = Math.floor(Date.now() / 1000);
  if (!exp || exp + 30 < nowSec) {
    return {
      ok: false,
      reason: "expired",
      error: toolError("Unauthorized: token expired."),
    };
  }

  // Subject (user id) must be present.
  const sub = ctx.getUserId?.();
  if (!sub || typeof sub !== "string") {
    return {
      ok: false,
      reason: "missing_subject",
      error: toolError("Unauthorized: token has no subject."),
    };
  }

  // OAuth client claim — Supabase mints this only for tokens issued via the
  // OAuth server. Blocks direct session JWTs from being pasted as bearer tokens.
  if (opts.requireOAuthClient) {
    const clientId = ctx.getClientId?.();
    if (!clientId) {
      return {
        ok: false,
        reason: "missing_client",
        error: toolError(
          "Unauthorized: token is not an OAuth client token (missing client_id).",
        ),
      };
    }
  }

  return { ok: true, userId: sub, claims };
}
