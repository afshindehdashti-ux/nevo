import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns a real-time snapshot of backend health: database latency, queue
 * depths (pgmq main + DLQ), cron job status, and email-delivery stats over
 * the last 24 hours. Admin only.
 */
export const getBackendHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // AuthZ — super_admin only. Sensitive infra data.
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const startedAt = Date.now();
    const serverTime = new Date().toISOString();

    // --- Database latency (round-trip against a trivial query) ---
    let dbLatencyMs: number | null = null;
    let dbOk = false;
    let dbError: string | null = null;
    try {
      const t0 = Date.now();
      const { error } = await supabaseAdmin
        .from("email_send_state")
        .select("id")
        .limit(1);
      dbLatencyMs = Date.now() - t0;
      dbOk = !error;
      if (error) dbError = error.message;
    } catch (e) {
      dbError = e instanceof Error ? e.message : String(e);
    }

    // --- Queue depths via pgmq introspection tables ---
    type QueueRow = { queue: string; size: number };
    const queues: QueueRow[] = [];
    const queueNames = [
      "q_auth_emails",
      "q_transactional_emails",
      "q_auth_emails_dlq",
      "q_transactional_emails_dlq",
    ];
    for (const q of queueNames) {
      const { count, error } = await (supabaseAdmin as any)
        .schema("pgmq")
        .from(q)
        .select("msg_id", { count: "exact", head: true });
      queues.push({
        queue: q,
        size: error ? 0 : count ?? 0,
      });
    }

    // --- Cron job presence (process-email-queue) ---
    let cronScheduled = false;
    let cronError: string | null = null;
    try {
      const { data, error } = await (supabaseAdmin as any)
        .schema("cron")
        .from("job")
        .select("jobname, schedule, active")
        .eq("jobname", "process-email-queue")
        .maybeSingle();
      if (error) cronError = error.message;
      cronScheduled = !!data;
    } catch (e) {
      cronError = e instanceof Error ? e.message : String(e);
    }

    // --- Email send state (throughput / rate-limit backoff) ---
    const { data: sendState } = await supabaseAdmin
      .from("email_send_state")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    // --- Email delivery stats (last 24h, deduped by message_id) ---
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: logs, error: logsError } = await supabaseAdmin
      .from("email_send_log")
      .select("message_id, status, created_at, template_name, recipient_email, error_message")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);

    // dedupe by message_id — latest row wins
    const latestByMsg = new Map<
      string,
      {
        status: string;
        template_name: string | null;
        recipient_email: string | null;
        created_at: string;
        error_message: string | null;
      }
    >();
    for (const row of logs ?? []) {
      if (!row.message_id) continue;
      if (!latestByMsg.has(row.message_id)) {
        latestByMsg.set(row.message_id, {
          status: row.status,
          template_name: row.template_name,
          recipient_email: row.recipient_email,
          created_at: row.created_at,
          error_message: row.error_message,
        });
      }
    }
    const emailStats = {
      total: latestByMsg.size,
      sent: 0,
      failed: 0,
      dlq: 0,
      suppressed: 0,
      pending: 0,
      other: 0,
    };
    const recentFailures: Array<{
      template_name: string | null;
      recipient_email: string | null;
      error_message: string | null;
      created_at: string;
      status: string;
    }> = [];
    for (const r of latestByMsg.values()) {
      const s = r.status;
      if (s === "sent") emailStats.sent++;
      else if (s === "failed") emailStats.failed++;
      else if (s === "dlq") emailStats.dlq++;
      else if (s === "suppressed") emailStats.suppressed++;
      else if (s === "pending") emailStats.pending++;
      else emailStats.other++;
      if (s === "dlq" || s === "failed" || s === "bounced" || s === "complained") {
        if (recentFailures.length < 25) recentFailures.push(r);
      }
    }

    return {
      generatedAt: serverTime,
      serverElapsedMs: Date.now() - startedAt,
      database: {
        ok: dbOk,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
      queues,
      cron: {
        scheduled: cronScheduled,
        jobName: "process-email-queue",
        error: cronError,
      },
      email: {
        stats: emailStats,
        state: sendState
          ? {
              batch_size: (sendState as any).batch_size,
              send_delay_ms: (sendState as any).send_delay_ms,
              retry_after_until: (sendState as any).retry_after_until,
            }
          : null,
        recentFailures,
        logsError: logsError?.message ?? null,
      },
    };
  });
