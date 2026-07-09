import { withAudit } from "../audit";
import { z } from "zod";

export default withAudit({
  name: "echo",
  title: "Echo",
  description: "Echo the input text back to the caller. Useful for verifying MCP connectivity.",
  inputSchema: { text: z.string().min(1).describe("Text to echo back.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ text }) => ({ content: [{ type: "text", text }] }),
});
