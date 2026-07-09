import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { writeAudit } from "./audit-log";

const ConvertSchema = z.object({
  inquiry_id: z.string().uuid(),
  create_project: z.boolean().default(true),
  project_type: z.string().max(100).optional().nullable(),
});

export const convertLeadToCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ConvertSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: inq, error: inqErr } = await supabase
      .from("project_inquiries")
      .select("*")
      .eq("id", data.inquiry_id)
      .maybeSingle();
    if (inqErr) throw new Error(inqErr.message);
    if (!inq) throw new Error("Inquiry not found");

    // Reuse an existing customer if one already matches this inquiry
    let customerId = inq.converted_customer_id;
    if (!customerId) {
      // Match by email first, then by company name
      let existing: { id: string } | null = null;
      if (inq.email) {
        const { data } = await supabase
          .from("customers")
          .select("id")
          .ilike("email", inq.email)
          .maybeSingle();
        existing = data ?? null;
      }
      if (!existing && inq.company) {
        const { data } = await supabase
          .from("customers")
          .select("id")
          .ilike("name", inq.company)
          .maybeSingle();
        existing = data ?? null;
      }

      if (existing) {
        customerId = existing.id;
      } else {
        const { data: created, error: cErr } = await supabase
          .from("customers")
          .insert({
            name: inq.company || inq.name,
            contact_person: inq.name,
            email: inq.email,
            phone: inq.phone,
            country: inq.country,
            currency: "USD",
            notes: inq.message?.slice(0, 2000) ?? null,
            created_by: userId,
          })
          .select("id")
          .single();
        if (cErr) throw new Error(cErr.message);
        customerId = created.id;
      }
    }

    // Optionally create a project linked to that customer
    let projectId = inq.converted_project_id;
    if (data.create_project && !projectId) {
      const { data: proj, error: pErr } = await supabase
        .from("projects")
        .insert({
          project_name: inq.company ? `${inq.company} — ${inq.application ?? "Project"}` : (inq.application ?? "New project"),
          customer_id: customerId,
          country: inq.country,
          project_type: data.project_type ?? inq.application ?? null,
          status: "active",
        })
        .select("id")
        .single();
      if (pErr) throw new Error(pErr.message);
      projectId = proj.id;
    }

    await supabase
      .from("project_inquiries")
      .update({
        status: "converted",
        converted_customer_id: customerId,
        converted_project_id: projectId,
      })
      .eq("id", data.inquiry_id);

    await writeAudit(supabase, {
      user_id: userId,
      action: "convert",
      entity_type: "lead",
      entity_id: data.inquiry_id,
      metadata: {
        customer_id: customerId,
        project_id: projectId,
        create_project: data.create_project,
      },
    });

    return { customer_id: customerId, project_id: projectId };
  });
