import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AlertStatus = "dlq" | "failed" | "bounced" | "complained";

export type AlertRow = {
  message_id: string;
  status: string;
  template_name: string | null;
  recipient_email: string | null;
  error_message: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export type AlertsResponse = {
  generatedAt: string;
  windowHours: number;
  total: number;
  counts: Record<AlertStatus | "total", number>;
  templates: string[];
  rows: AlertRow[];
  queues: {
    auth_emails_dlq: number;
    transactional_emails_dlq: number;
  };
};

const ALLOWED: AlertStatus[] = ["dlq", "failed", "bounced", "complained"];

async function assertSuperAdmin(context: {
  supabase: any;
  userId: string;
}) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "super_admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const listAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      hours?: number;
      statuses?: AlertStatus[];
      template?: string | null;
      search?: string | null;
      limit?: number;
    }) => ({
      hours: Math.min(Math.max(input.hours ?? 24, 1), 24 * 30),
      statuses:
        input.statuses && input.statuses.length > 0
          ? input.statuses.filter((s): s is AlertStatus => ALLOWED.includes(s))
          : ALLOWED,
      template: input.template?.trim() || null,
      search: input.search?.trim() || null,
      limit: Math.min(Math.max(input.limit ?? 200, 1), 500),
    }),
  )
  .handler(async ({ context, data }): Promise<AlertsResponse> => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const since = new Date(
      Date.now() - data.hours * 60 * 60 * 1000,
    ).toISOString();

    // Fetch a wide window; we need every row per message_id to pick the latest,
    // then filter by status.
    const { data: logs, error } = await supabaseAdmin
      .from("email_send_log")
      .select(
        "message_id, status, template_name, recipient_email, error_message, created_at, metadata",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) throw new Error(error.message);

    // Deduplicate by message_id, keep latest.
    const latest = new Map<string, AlertRow>();
    for (const r of logs ?? []) {
      if (!r.message_id) continue;
      if (!latest.has(r.message_id)) {
        latest.set(r.message_id, r as AlertRow);
      }
    }

    const templates = new Set<string>();
    let rows: AlertRow[] = [];
    const counts: AlertsResponse["counts"] = {
      total: 0,
      dlq: 0,
      failed: 0,
      bounced: 0,
      complained: 0,
    };

    for (const row of latest.values()) {
      if (row.template_name) templates.add(row.template_name);
      if (!ALLOWED.includes(row.status as AlertStatus)) continue;
      counts.total++;
      counts[row.status as AlertStatus] =
        (counts[row.status as AlertStatus] ?? 0) + 1;
      if (!data.statuses.includes(row.status as AlertStatus)) continue;
      if (data.template && row.template_name !== data.template) continue;
      if (data.search) {
        const q = data.search.toLowerCase();
        const hay =
          `${row.recipient_email ?? ""} ${row.template_name ?? ""} ${row.error_message ?? ""} ${row.message_id}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      rows.push(row);
    }

    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    rows = rows.slice(0, data.limit);

    // Queue DLQ depths
    let queues = { auth_emails_dlq: 0, transactional_emails_dlq: 0 };
    try {
      const { data: metrics } = await (supabaseAdmin as any).rpc(
        "get_backend_health_metrics",
      );
      if (metrics?.queues) {
        queues = {
          auth_emails_dlq: metrics.queues.auth_emails_dlq ?? 0,
          transactional_emails_dlq:
            metrics.queues.transactional_emails_dlq ?? 0,
        };
      }
    } catch {
      // best-effort
    }

    return {
      generatedAt: new Date().toISOString(),
      windowHours: data.hours,
      total: rows.length,
      counts,
      templates: Array.from(templates).sort(),
      rows,
      queues,
    };
  });

export type AlertDetail = {
  message_id: string;
  timeline: Array<{
    id: string;
    status: string;
    error_message: string | null;
    created_at: string;
    metadata: Record<string, unknown> | null;
  }>;
  latest: AlertRow | null;
};

export const getAlertDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messageId: string }) => {
    if (!input.messageId) throw new Error("messageId required");
    return { messageId: input.messageId.slice(0, 256) };
  })
  .handler(async ({ context, data }): Promise<AlertDetail> => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: rows, error } = await supabaseAdmin
      .from("email_send_log")
      .select(
        "id, message_id, status, template_name, recipient_email, error_message, created_at, metadata",
      )
      .eq("message_id", data.messageId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) throw new Error(error.message);

    const timeline = (rows ?? []).map((r) => ({
      id: r.id as string,
      status: r.status as string,
      error_message: r.error_message as string | null,
      created_at: r.created_at as string,
      metadata: r.metadata as Record<string, unknown> | null,
    }));

    const last = rows && rows.length > 0 ? rows[rows.length - 1] : null;
    const latest: AlertRow | null = last
      ? {
          message_id: last.message_id as string,
          status: last.status as string,
          template_name: last.template_name as string | null,
          recipient_email: last.recipient_email as string | null,
          error_message: last.error_message as string | null,
          created_at: last.created_at as string,
          metadata: last.metadata as Record<string, unknown> | null,
        }
      : null;

    return { message_id: data.messageId, timeline, latest };
  });
