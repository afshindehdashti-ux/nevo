/**
 * Shared audit-log helper. Writes a row to public.activity_logs using the
 * caller-scoped Supabase client (RLS applies as the signed-in user).
 * Fire-and-forget: never throws, only warns — audit failures must not break
 * the underlying mutation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writeAudit(supabase: any, entry: {
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    await supabase.from("activity_logs").insert({
      user_id: entry.user_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    console.warn(`activity_logs insert failed [${entry.action}/${entry.entity_type}]`, err);
  }
}
