/**
 * Shared audit-log helper. Writes a row to public.activity_logs using the
 * caller-scoped Supabase client (RLS applies as the signed-in user).
 *
 * Fire-and-forget: never throws, only warns — audit failures must not break
 * the underlying mutation.
 *
 * Always captures the request IP (via TanStack's server request utilities)
 * and accepts optional old/new value snapshots for mutation diffs:
 *   - create → old_values = null,     new_values = inserted payload/row
 *   - update → old_values = pre-row,  new_values = patch/updated row
 *   - delete → old_values = deleted,  new_values = null
 *   - access → both null; ip is still recorded
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

async function resolveRequestIp(explicit?: string | null): Promise<string | null> {
  if (explicit) return explicit;
  try {
    // Dynamic import keeps the server-only utilities out of any client bundle
    // that transitively imports this module.
    const { getRequestIP } = await import("@tanstack/react-start/server");
    return getRequestIP({ xForwardedFor: true }) ?? null;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writeAudit(supabase: any, entry: {
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  old_values?: Json | null;
  new_values?: Json | null;
}) {
  try {
    const ip = await resolveRequestIp(entry.ip_address);
    await supabase.from("activity_logs").insert({
      user_id: entry.user_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      metadata: entry.metadata ?? {},
      ip_address: ip,
      old_values: entry.old_values ?? null,
      new_values: entry.new_values ?? null,
    });
  } catch (err) {
    console.warn(`activity_logs insert failed [${entry.action}/${entry.entity_type}]`, err);
  }
}
