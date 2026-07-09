import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

// Service-role client — writes audit rows even for unauthenticated calls.
// Loaded lazily so the MCP entry stays import-safe (no env reads at module load).
function adminClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type ToolResult = {
  content: Array<{ type: string; text?: string } & Record<string, unknown>>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

type DefineToolArg = Parameters<typeof defineTool>[0];
type Handler = DefineToolArg["handler"];

/**
 * Wrap a tool definition so every invocation is logged to
 * `public.mcp_tool_invocations` (tool name, caller user id/email, oauth
 * client id, request id, timestamps, duration, status, error, sizes).
 * Never throws; audit failures degrade to console.warn.
 */
export function withAudit(def: DefineToolArg): ReturnType<typeof defineTool> {
  const inner = def.handler as Handler;

  const wrapped: Handler = async (input: unknown, ctx: ToolContext) => {
    const requestId =
      (ctx as unknown as { getRequestId?: () => string | undefined })?.getRequestId?.() ??
      (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

    let result: ToolResult;
    let status: "ok" | "error" | "unauthorized" = "ok";
    let errorMessage: string | null = null;

    try {
      result = (await (inner as (i: unknown, c: ToolContext) => Promise<ToolResult> | ToolResult)(
        input,
        ctx,
      )) as ToolResult;
      if (result?.isError) {
        status = !authed ? "unauthorized" : "error";
        errorMessage =
          result.content?.find((c) => c.type === "text")?.text?.toString().slice(0, 1000) ?? null;
      }
    } catch (err) {
      status = "error";
      errorMessage = err instanceof Error ? err.message.slice(0, 1000) : String(err).slice(0, 1000);
      result = { content: [{ type: "text", text: errorMessage }], isError: true };
    }

    const rows = Array.isArray((result?.structuredContent as { rows?: unknown[] })?.rows)
      ? ((result.structuredContent as { rows: unknown[] }).rows.length as number)
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
