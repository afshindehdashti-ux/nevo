import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const APPROVE_ROLES = ["super_admin", "management"] as const;
const READ_ROLES = [
  "super_admin",
  "management",
  "sales",
  "operations",
  "finance",
  "read_only",
] as const;

async function assertRole(
  supabase: {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  },
  userId: string,
  roles: readonly string[],
) {
  const { data, error } = await supabase.rpc("has_any_role", {
    _user_id: userId,
    _roles: roles as unknown as string[],
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const nullableStr = z.string().trim().min(1).nullable().optional();
const strArr = z.array(z.string().trim().min(1)).default([]);

export const RuleUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  enabled: z.boolean().default(true),
  priority: z.number().int().min(0).max(10_000).default(100),
  match_categories: strArr,
  match_doc_type_ilike: nullableStr,
  match_filename_ilike: nullableStr,
  match_keywords: strArr,
  match_confidentiality: strArr,
  match_visibility: strArr,
  action_require_approval: z.boolean().default(false),
  action_block_public: z.boolean().default(false),
  action_set_confidentiality: nullableStr,
  action_set_visibility: nullableStr,
  action_set_destination: nullableStr,
  action_set_folder_path: nullableStr,
  action_add_tags: strArr,
  action_min_confidence: z.number().min(0).max(1).nullable().optional(),
});
export type RuleUpsertInput = z.infer<typeof RuleUpsertSchema>;

export const listRoutingRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.supabase as never, context.userId, READ_ROLES);
    const { data, error } = await context.supabase
      .from("doc_intel_routing_rules")
      .select("*")
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertRoutingRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RuleUpsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase as never, context.userId, APPROVE_ROLES);
    const payload = {
      name: data.name,
      description: data.description ?? null,
      enabled: data.enabled,
      priority: data.priority,
      match_categories: data.match_categories,
      match_doc_type_ilike: data.match_doc_type_ilike ?? null,
      match_filename_ilike: data.match_filename_ilike ?? null,
      match_keywords: data.match_keywords,
      match_confidentiality: data.match_confidentiality,
      match_visibility: data.match_visibility,
      action_require_approval: data.action_require_approval,
      action_block_public: data.action_block_public,
      action_set_confidentiality: data.action_set_confidentiality ?? null,
      action_set_visibility: data.action_set_visibility ?? null,
      action_set_destination: data.action_set_destination ?? null,
      action_set_folder_path: data.action_set_folder_path ?? null,
      action_add_tags: data.action_add_tags,
      action_min_confidence: data.action_min_confidence ?? null,
    };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("doc_intel_routing_rules")
        .update(payload as never)
        .eq("id", data.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("doc_intel_routing_rules")
      .insert(payload as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteRoutingRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase as never, context.userId, APPROVE_ROLES);
    const { error } = await context.supabase
      .from("doc_intel_routing_rules")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleRoutingRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase as never, context.userId, APPROVE_ROLES);
    const { error } = await context.supabase
      .from("doc_intel_routing_rules")
      .update({ enabled: data.enabled } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Re-run all enabled rules against a single already-analyzed document. */
export const reapplyRulesToDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.supabase as never, context.userId, APPROVE_ROLES);
    const { applyRulesToAnalysis, fetchEnabledRules } = await import("./doc-intel-rules.server");
    const { data: doc, error } = await context.supabase
      .from("doc_intel_documents")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !doc) throw new Error(error?.message ?? "Not found");
    if (doc.status === "routed") {
      throw new Error("Document already routed — rules cannot be re-applied.");
    }
    const rules = await fetchEnabledRules(context.supabase as never);
    const outcome = applyRulesToAnalysis(
      {
        category: doc.category ?? "",
        document_type: doc.document_type ?? "",
        original_filename: doc.original_filename ?? "",
        stored_filename: doc.stored_filename ?? "",
        summary: doc.summary ?? "",
        confidentiality_level: doc.confidentiality_level ?? "internal",
        portal_visibility: doc.portal_visibility ?? "none",
        destination: doc.destination ?? "",
        folder_path: doc.folder_path ?? "",
        ai_confidence: doc.ai_confidence ?? null,
      },
      rules,
    );
    const patch: Record<string, unknown> = {
      confidentiality_level: outcome.confidentiality,
      portal_visibility: outcome.visibility,
      destination: outcome.destination,
      folder_path: outcome.folder_path,
    };
    if (outcome.requires_approval && doc.status !== "pending_approval") {
      patch.status = "pending_approval";
    }
    await context.supabase
      .from("doc_intel_documents")
      .update(patch as never)
      .eq("id", doc.id);
    if (outcome.added_tags.length > 0) {
      await context.supabase
        .from("doc_intel_tags")
        .upsert(outcome.added_tags.map((tag: string) => ({ document_id: doc.id, tag })) as never, {
          onConflict: "document_id,tag" as never,
        });
    }
    await context.supabase.from("doc_intel_audit_logs").insert({
      document_id: doc.id,
      actor_id: context.userId,
      action: "rules_reapplied",
      details: {
        matched_rules: outcome.matched.map((m: { id: string; name: string }) => ({
          id: m.id,
          name: m.name,
        })),
        require_approval: outcome.requires_approval,
      },
    });
    return { ok: true, outcome };
  });
