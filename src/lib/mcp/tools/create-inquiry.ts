import { withAudit } from "../audit";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

function anonClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default withAudit({
  name: "create_inquiry",
  title: "Create project inquiry",
  description:
    "Create a new project inquiry (lead) in the NEVO CRM. Captures contact, company, panel/project type, budget, and message. Works signed-in (uses caller's RLS) or anonymously via the public inquiry channel.",
  inputSchema: {
    name: z.string().trim().min(1).max(200).describe("Contact full name."),
    email: z.string().trim().email().max(320).describe("Contact email."),
    company: z.string().trim().max(200).optional().describe("Company / organization."),
    role: z.string().trim().max(120).optional().describe("Caller's role or title at the company."),
    phone: z.string().trim().max(40).optional(),
    country: z.string().trim().max(100).optional(),
    panel_type: z
      .string()
      .trim()
      .max(120)
      .optional()
      .describe("Requested sandwich panel type (e.g. PIR, PUR, Rockwool, EPS)."),
    project_type: z.string().trim().max(200).optional().describe("Application / project type."),
    budget_range: z.string().trim().max(80).optional().describe("Budget range, e.g. '10k-50k USD'."),
    timeline: z.string().trim().max(120).optional(),
    message: z.string().trim().max(5000).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  allowAnonymous: true,
  handler: async (input: Record<string, string | undefined>, ctx: ToolContext) => {
    const {
      name,
      email,
      company,
      role,
      phone,
      country,
      panel_type,
      project_type,
      budget_range,
      timeline,
      message,
    } = input as Record<string, string | undefined>;

    // Fold role + panel_type into internal_notes / application so we don't
    // require schema changes.
    const notesParts: string[] = [];
    if (role) notesParts.push(`Role: ${role}`);
    if (panel_type) notesParts.push(`Panel type: ${panel_type}`);
    const internal_notes = notesParts.length ? notesParts.join("\n") : null;
    const application = panel_type ?? null;

    const row = {
      name: name!,
      email: email!,
      company: company ?? null,
      phone: phone ?? null,
      country: country ?? null,
      application,
      project_type: project_type ?? null,
      budget_range: budget_range ?? null,
      timeline: timeline ?? null,
      message: message ?? null,
      internal_notes,
      source_page: "mcp",
      status: "new",
    };

    const client = ctx.isAuthenticated() ? supabaseForUser(ctx) : anonClient();
    const { data, error } = await client
      .from("project_inquiries")
      .insert(row)
      .select("id, created_at, name, email, company, status")
      .maybeSingle();

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { row: data },
    };
  },
});
