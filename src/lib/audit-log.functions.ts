import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { writeAudit } from "./audit-log";

/**
 * Generic CRM audit-log sink for client-side mutations that go directly
 * through the browser Supabase client (e.g. inline saves on admin lists).
 * Server-side handlers should call `writeAudit` directly instead.
 */
const Input = z.object({
  action: z.string().min(1).max(64),
  entity_type: z.string().min(1).max(64),
  entity_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const logCrmAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => Input.parse(v))
  .handler(async ({ context, data }) => {
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id ?? null,
      metadata: data.metadata ?? {},
    });
    return { ok: true as const };
  });
