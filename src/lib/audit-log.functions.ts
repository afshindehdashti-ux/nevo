import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { writeAudit } from "./audit-log";

/**
 * Generic CRM audit-log sink for client-side mutations that go directly
 * through the browser Supabase client (e.g. inline saves on admin lists).
 * Server-side handlers should call `writeAudit` directly instead.
 *
 * The request IP is always captured server-side (via TanStack's
 * `getRequestIP`) inside `writeAudit`; callers pass old/new value snapshots
 * for the mutation being logged.
 */
const JsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValue),
    z.record(z.string(), JsonValue),
  ]),
);

const Input = z.object({
  action: z.string().min(1).max(64),
  entity_type: z.string().min(1).max(64),
  entity_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  old_values: JsonValue.nullable().optional(),
  new_values: JsonValue.nullable().optional(),
});

export const logCrmAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v) => Input.parse(v))
  .handler(async ({ context, data }) => {
    await writeAudit(context.supabase, {
      user_id: context.userId,
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id ?? null,
      metadata: data.metadata ?? {},
      old_values: data.old_values ?? null,
      new_values: data.new_values ?? null,
    });
    return { ok: true as const };
  });
