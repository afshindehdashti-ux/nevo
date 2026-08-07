import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  entity: z.enum(["customer", "project"]),
  id: z.string().uuid(),
});

async function callAi(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are an industrial CRM analyst for NEVO Industrial (Dubai). Summarize customer or project context for the sales/ops team in 4–6 concise bullet points. Focus on: business relationship, activity volume, financial exposure, delivery status, and one recommended next action. British/international tone, no fluff, no marketing language.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });
  if (res.status === 429) throw new Error("AI is rate-limited. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("AI returned an empty response");
  return text;
}

export const generateEntitySummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => InputSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured.");

    let prompt = "";
    const { supabase } = context;

    if (data.entity === "customer") {
      const { data: c } = await supabase
        .from("customers")
        .select(
          "name,contact_person,email,phone,country,city,currency,payment_terms,notes,is_active,created_at",
        )
        .eq("id", data.id)
        .maybeSingle();
      if (!c) throw new Error("Customer not found");
      const [{ data: orders }, { data: invoices }, { data: shipments }] = await Promise.all([
        supabase
          .from("orders")
          .select("status,total,currency,order_date")
          .eq("customer_id", data.id)
          .order("order_date", { ascending: false })
          .limit(20),
        supabase
          .from("invoices")
          .select("type,status,total,balance,currency,issue_date,due_date")
          .eq("customer_id", data.id)
          .order("issue_date", { ascending: false })
          .limit(20),
        supabase
          .from("shipments")
          .select("status,shipped_at,carrier")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      prompt = `Customer:\n${JSON.stringify(c, null, 2)}\n\nRecent orders:\n${JSON.stringify(
        orders ?? [],
        null,
        2,
      )}\n\nRecent invoices:\n${JSON.stringify(
        invoices ?? [],
        null,
        2,
      )}\n\nRecent shipments:\n${JSON.stringify(shipments ?? [], null, 2)}`;
    } else {
      const { data: p } = await supabase
        .from("projects")
        .select("project_name,project_type,country,status,customer_id,created_at,updated_at")
        .eq("id", data.id)
        .maybeSingle();
      if (!p) throw new Error("Project not found");
      let customerName: string | null = null;
      if (p.customer_id) {
        const { data: cust } = await supabase
          .from("customers")
          .select("name,country,currency")
          .eq("id", p.customer_id)
          .maybeSingle();
        customerName = cust?.name ?? null;
      }
      prompt = `Project:\n${JSON.stringify(p, null, 2)}\n\nCustomer: ${customerName ?? "unlinked"}`;
    }

    const summary = await callAi(prompt, apiKey);

    const table = data.entity === "customer" ? "customers" : "projects";
    await supabase
      .from(table)
      .update({ ai_summary: summary, ai_summary_at: new Date().toISOString() })
      .eq("id", data.id);

    return { summary, generated_at: new Date().toISOString() };
  });
