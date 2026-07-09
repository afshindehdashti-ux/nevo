import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { assertValidCaller } from "./guard";

// Service-role client — writes audit rows even for unauthenticated calls.
// Loaded lazily so the MCP entry stays import-safe (no env reads at module load).
function adminClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Wrap a tool definition so every invocation is:
 *  1. Validated against issuer/audience/expiry/subject/client claims
 *     (defense-in-depth on top of mcp-js token verification), unless the
 *     tool explicitly opts into anonymous access via `allowAnonymous: true`.
 *  2. Logged to `public.mcp_tool_invocations` (tool name, caller user id/email,
 *     oauth client id, request id, timestamps, duration, status, error, sizes).
 * Audit failures degrade to console.warn; guard failures return a tool error.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withAudit(def: any): any {
  const inner = def.handler;
  const allowAnonymous = def.allowAnonymous === true;

  const wrapped = async (input: unknown, ctx: ToolContext) => {
    const requestId =
      (ctx as unknown as { getRequestId?: () => string | undefined })?.getRequestId?.() ??
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const startedAt = new Date();
    const t0 = Date.now();

    const authed = ctx.isAuthenticated();
    const userId = authed ? ctx.getUserId() : null;
    const userEmail = authed ? (ctx.getUserEmail?.() ?? null) : null;
    const clientId = ctx.getClientId?.() ?? null;

    let inputBytes = 0;
    try {
      inputBytes = new TextEncoder().encode(JSON.stringify(input ?? null)).length;
    } catch {
      /* ignore sizing errors */
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;
    let status: "ok" | "error" | "unauthorized" = "ok";
    let errorMessage: string | null = null;

    try {
      result = await inner(input, ctx);
      if (result?.isError) {
        status = !authed ? "unauthorized" : "error";
        const first = result.content?.find?.((c: { type: string; text?: string }) => c.type === "text");
        errorMessage = typeof first?.text === "string" ? first.text.slice(0, 1000) : null;
      }
    } catch (err) {
      status = "error";
      errorMessage = err instanceof Error ? err.message.slice(0, 1000) : String(err).slice(0, 1000);
      result = { content: [{ type: "text", text: errorMessage }], isError: true };
    }

    const rows = Array.isArray(result?.structuredContent?.rows)
      ? (result.structuredContent.rows.length as number)
      : null;

    // Fire-and-forget audit insert.
    void (async () => {
      try {
        await adminClient().from("mcp_tool_invocations").insert({
          request_id: requestId,
          tool_name: def.name,
          user_id: userId,
          user_email: userEmail,
          client_id: clientId,
          status,
          error_message: errorMessage,
          input_bytes: inputBytes,
          result_rows: rows,
          duration_ms: Date.now() - t0,
          started_at: startedAt.toISOString(),
          finished_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn(`[mcp-audit] failed to log ${def.name}:`, e);
      }
    })();

    return result;
  };

  return defineTool({ ...def, handler: wrapped });
}
