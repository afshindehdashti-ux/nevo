import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const KindEnum = z.enum(["customer", "partner"]);

async function assertStaff(context: { supabase: unknown; userId: string }) {
  const client = context.supabase as { rpc: (fn: string, args: unknown) => Promise<{ data: unknown; error: unknown }> };
  const { data, error } = await client.rpc("current_user_has_any_role", { _roles: ["super_admin", "management", "sales", "operations"] });
  if (error) throw new Error((error as { message: string }).message);
  if (!data) throw new Error("Forbidden");
}

export const listDocAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ kind: KindEnum, entityId: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const table = data.kind === "customer" ? "customer_users" : "partner_users";
    const fk = data.kind === "customer" ? "customer_id" : "partner_id";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as unknown as {
      from: (t: string) => {
        select: (s: string) => {
          eq: (c: string, v: string) => {
            order: (c: string, o: { ascending: boolean }) => Promise<{
              data: { id: string; user_id: string; created_at: string }[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
    const res = await admin.from(table).select("id, user_id, created_at").eq(fk, data.entityId).order("created_at", { ascending: false });
    if (res.error) throw new Error(res.error.message);
    const rows = res.data ?? [];
    const enriched = await Promise.all(
      rows.map(async (r) => {
        const u = await supabaseAdmin.auth.admin.getUserById(r.user_id);
        const prof = await supabaseAdmin.from("profiles").select("full_name").eq("id", r.user_id).maybeSingle();
        return {
          id: r.id,
          user_id: r.user_id,
          created_at: r.created_at,
          email: u.data?.user?.email ?? null,
          full_name: (prof.data as { full_name?: string } | null)?.full_name ?? null,
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
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const target = data.email.trim().toLowerCase();
    let foundId: string | null = null;
    for (let page = 1; page <= 20 && !foundId; page++) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      const hit = list.users.find((u) => (u.email ?? "").toLowerCase() === target);
      if (hit) foundId = hit.id;
      if (list.users.length < 200) break;
    }
    if (!foundId) throw new Error("No user found with that email. They must sign in first.");

    const table = data.kind === "customer" ? "customer_users" : "partner_users";
    const fk = data.kind === "customer" ? "customer_id" : "partner_id";
    const admin = supabaseAdmin as unknown as {
      from: (t: string) => { insert: (row: Record<string, string>) => Promise<{ error: { message: string } | null }> };
    };
    const res = await admin.from(table).insert({ [fk]: data.entityId, user_id: foundId, created_by: context.userId });
    if (res.error && !res.error.message.includes("duplicate")) {
      throw new Error(res.error.message);
    }
    return { ok: true };
  });

export const revokeDocAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ kind: KindEnum, mappingId: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.kind === "customer" ? "customer_users" : "partner_users";
    const admin = supabaseAdmin as unknown as {
      from: (t: string) => { delete: () => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } };
    };
    const res = await admin.from(table).delete().eq("id", data.mappingId);
    if (res.error) throw new Error(res.error.message);
    return { ok: true };
  });
