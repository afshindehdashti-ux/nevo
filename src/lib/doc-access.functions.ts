import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const KindEnum = z.enum(["customer", "partner"]);

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_any_role", {
    _user_id: context.userId,
    _roles: ["super_admin", "management", "sales", "operations"],
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const listDocAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ kind: KindEnum, entityId: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const table = data.kind === "customer" ? "customer_users" : "partner_users";
    const fk = data.kind === "customer" ? "customer_id" : "partner_id";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from(table)
      .select("id, user_id, created_at")
      .eq(fk, data.entityId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const enriched = await Promise.all(
      (rows ?? []).map(async (r: { id: string; user_id: string; created_at: string }) => {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("full_name")
          .eq("id", r.user_id)
          .maybeSingle();
        return {
          id: r.id,
          user_id: r.user_id,
          created_at: r.created_at,
          email: u?.user?.email ?? null,
          full_name: (prof as { full_name?: string } | null)?.full_name ?? null,
        };
      }),
    );
    return enriched;
  });

export const grantDocAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      kind: KindEnum,
      entityId: z.string().uuid(),
      email: z.string().email(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Find user by email via admin listUsers (paginate a few pages if needed)
    const target = data.email.trim().toLowerCase();
    let found: { id: string } | null = null;
    for (let page = 1; page <= 20 && !found; page++) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) throw new Error(error.message);
      const hit = list.users.find((u) => (u.email ?? "").toLowerCase() === target);
      if (hit) found = { id: hit.id };
      if (list.users.length < 200) break;
    }
    if (!found) throw new Error("No user found with that email. They must sign in first.");

    const table = data.kind === "customer" ? "customer_users" : "partner_users";
    const fk = data.kind === "customer" ? "customer_id" : "partner_id";
    const { error: insErr } = await supabaseAdmin
      .from(table)
      .insert({ [fk]: data.entityId, user_id: found.id, created_by: context.userId });
    if (insErr && !insErr.message.includes("duplicate")) {
      throw new Error(insErr.message);
    }
    return { ok: true };
  });

export const revokeDocAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ kind: KindEnum, mappingId: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.kind === "customer" ? "customer_users" : "partner_users";
    const { error } = await supabaseAdmin.from(table).delete().eq("id", data.mappingId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
