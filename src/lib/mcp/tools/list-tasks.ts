import { withAudit } from "../audit";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default withAudit({
  name: "list_tasks",
  title: "List tasks",
  description: "List tasks visible to the signed-in user, most recent first.",
  inputSchema: {
    status: z.string().trim().optional().describe("Optional status filter."),
    limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 25)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (
    { status, limit }: { status?: string; limit?: number },
    ctx: import("@lovable.dev/mcp-js").ToolContext,
  ) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx)
      .from("tasks")
      .select("id, title, status, priority, due_date, assigned_to, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { rows: data },
    };
  },
});
