import type { Database } from "@/integrations/supabase/types";
import { withMethodGuards } from "@/lib/api-http";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Client-side telemetry sink.
 *
 * Receives batched error/log reports from the browser (see src/lib/client-monitor.ts)
 * and writes them to server logs via console.error/warn/info so they surface in
 * production Server Logs. This gives visibility into client-side failures
 * (JS errors, unhandled rejections, failed fetches) even when the deploy is
 * only partially complete.
 *
 * Public endpoint — no auth. Rate-limited by payload size + entry cap.
 * Never trusts client input; treat everything as untrusted strings.
 */

type ClientLogEntry = {
  level?: "error" | "warn" | "info";
  message?: unknown;
  stack?: unknown;
  url?: unknown;
  route?: unknown;
  ua?: unknown;
  locale?: unknown;
  release?: unknown;
  ts?: unknown;
  kind?: unknown; // "error" | "unhandledrejection" | "fetch" | "manual"
  extra?: unknown;
};

const MAX_ENTRIES = 20;
const MAX_STRING = 4000;
const MAX_BODY_BYTES = 64 * 1024;

const s = (v: unknown, cap = MAX_STRING): string => {
  if (v == null) return "";
  const str =
    typeof v === "string"
      ? v
      : (() => {
          try {
            return JSON.stringify(v);
          } catch {
            return String(v);
          }
        })();
  return str.length > cap ? str.slice(0, cap) + "…[truncated]" : str;
};

function corsHeaders(): HeadersInit {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
  };
}

export const Route = createFileRoute("/api/public/client-log")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders() }),
      POST: async ({ request }) => {
        try {
          const cl = Number(request.headers.get("content-length") || "0");
          if (cl > MAX_BODY_BYTES) {
            return Response.json(
              { ok: false, error: "payload_too_large" },
              { status: 413, headers: corsHeaders() },
            );
          }
          const raw = await request.text();
          if (raw.length > MAX_BODY_BYTES) {
            return Response.json(
              { ok: false, error: "payload_too_large" },
              { status: 413, headers: corsHeaders() },
            );
          }
          let payload: { entries?: ClientLogEntry[] } = {};
          try {
            payload = JSON.parse(raw);
          } catch {
            return Response.json(
              { ok: false, error: "invalid_json" },
              { status: 400, headers: corsHeaders() },
            );
          }
          const entries = Array.isArray(payload.entries)
            ? payload.entries.slice(0, MAX_ENTRIES)
            : [];
          const ip =
            request.headers.get("cf-connecting-ip") ||
            request.headers.get("x-forwarded-for") ||
            "-";
          const ref = request.headers.get("referer") || "-";

          const logoRows: Database["public"]["Tables"]["header_logo_events"]["Insert"][] = [];
          const sentryEvents: Array<{
            correlationId?: string;
            stage?: string;
            variant?: string;
            failedSrc?: string;
            nextSrc?: string;
            viewportWidth?: number;
            online?: boolean;
            terminal?: boolean;
            schema?: string;
            schemaVersion?: number;
            route?: string;
            url?: string;
            ua?: string;
            release?: string;
            clientTs?: string | number | null;
            extra: Record<string, unknown>;
          }> = [];
          for (const e of entries) {
            const line = [
              "[client-log]",
              `lvl=${s(e.level, 8) || "error"}`,
              `kind=${s(e.kind, 24) || "manual"}`,
              `route=${s(e.route, 200)}`,
              `url=${s(e.url, 400)}`,
              `msg=${s(e.message, 800)}`,
              e.stack ? `stack=${s(e.stack, 2000)}` : "",
              `ua=${s(e.ua, 240)}`,
              `locale=${s(e.locale, 8)}`,
              `release=${s(e.release, 40)}`,
              `ts=${s(e.ts, 32)}`,
              `ip=${s(ip, 64)}`,
              `ref=${s(ref, 240)}`,
              e.extra ? `extra=${s(e.extra, 1000)}` : "",
            ]
              .filter(Boolean)
              .join(" | ");

            const level = e.level === "warn" ? "warn" : e.level === "info" ? "info" : "error";
            if (level === "error") console.error(line);
            else if (level === "warn") console.warn(line);
            else console.log(line);

            // Persist header.logo.* events for the admin dashboard.
            const msg = typeof e.message === "string" ? e.message : "";
            if (msg === "header.logo.render" || msg === "header.logo.error") {
              const extra =
                e.extra && typeof e.extra === "object" ? (e.extra as Record<string, unknown>) : {};
              const vp = extra.viewport as { width?: unknown } | undefined;
              const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
              const str = (v: unknown, cap = 400) =>
                typeof v === "string" ? (v.length > cap ? v.slice(0, cap) : v) : null;
              const rawTs = e.ts;
              const clientTs =
                typeof rawTs === "string" || typeof rawTs === "number" ? new Date(rawTs) : null;
              logoRows.push({
                event_type: msg === "header.logo.render" ? "render" : "error",
                variant: str(extra.variant, 64),
                stage: str(extra.stage, 32),
                device_width: num(extra.viewportWidth) ?? num(vp?.width),
                dpr: num(extra.dpr),
                correlation_id: str(extra.correlationId, 64),
                sample_rate: num(extra.sampleRate),
                src: str(extra.src, 500),
                next_src: str(extra.nextSrc, 500),
                natural_width: num(extra.naturalWidth),
                natural_height: num(extra.naturalHeight),
                online: typeof extra.online === "boolean" ? extra.online : null,
                schema: str(extra.schema, 64),
                schema_version: num(extra.schemaVersion),
                route: str(e.route, 200),
                url: str(e.url, 400),
                ua: str(e.ua, 240),
                release: str(e.release, 40),
                ip: ip === "-" ? null : ip.slice(0, 64),
                client_ts: clientTs && !isNaN(clientTs.getTime()) ? clientTs.toISOString() : null,
              });

              if (msg === "header.logo.error") {
                sentryEvents.push({
                  correlationId: str(extra.correlationId, 64) ?? undefined,
                  stage: str(extra.stage, 32) ?? undefined,
                  variant: str(extra.variant, 64) ?? undefined,
                  failedSrc: str(extra.failedSrc, 500) ?? undefined,
                  nextSrc: str(extra.nextSrc, 500) ?? undefined,
                  viewportWidth: num(extra.viewportWidth) ?? undefined,
                  online: typeof extra.online === "boolean" ? extra.online : undefined,
                  terminal: extra.terminal === true,
                  schema: str(extra.schema, 64) ?? undefined,
                  schemaVersion: num(extra.schemaVersion) ?? undefined,
                  route: str(e.route, 200) ?? undefined,
                  url: str(e.url, 400) ?? undefined,
                  ua: str(e.ua, 240) ?? undefined,
                  release: str(e.release, 40) ?? undefined,
                  clientTs: clientTs && !isNaN(clientTs.getTime()) ? clientTs.toISOString() : null,
                  extra,
                });
              }
            }
          }

          if (logoRows.length > 0) {
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              const { error } = await supabaseAdmin.from("header_logo_events").insert(logoRows);
              if (error) console.error("[client-log] logo insert failed:", error.message);
            } catch (err) {
              console.error("[client-log] logo persist error:", err);
            }
          }

          if (sentryEvents.length > 0) {
            // Fire-and-forget — Sentry outages must not delay or fail the sink.
            try {
              const { forwardLogoErrorsToSentry } = await import("@/lib/sentry-forwarder.server");
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

              // Hydrate each error with its full fallback-chain timeline
              // (render → primary-fail → cdn-fail → svg-fail) so Sentry gets
              // end-to-end breadcrumbs for sticky logo breaks.
              const uniqueIds = Array.from(
                new Set(
                  sentryEvents.map((ev) => ev.correlationId).filter((id): id is string => !!id),
                ),
              );

              const historyByCid = new Map<
                string,
                Array<{
                  eventType: "render" | "error";
                  stage: string | null;
                  variant: string | null;
                  src: string | null;
                  nextSrc: string | null;
                  online: boolean | null;
                  clientTs: string | null;
                }>
              >();

              if (uniqueIds.length > 0) {
                const { data: hist, error: histErr } = await supabaseAdmin
                  .from("header_logo_events")
                  .select("correlation_id,event_type,stage,variant,src,next_src,online,client_ts")
                  .in("correlation_id", uniqueIds)
                  .order("client_ts", { ascending: true })
                  .limit(200);
                if (histErr) {
                  console.error("[client-log] logo history fetch failed:", histErr.message);
                } else if (hist) {
                  for (const row of hist) {
                    const cid = row.correlation_id;
                    if (!cid) continue;
                    const list = historyByCid.get(cid) ?? [];
                    list.push({
                      eventType: row.event_type === "error" ? "error" : "render",
                      stage: row.stage ?? null,
                      variant: row.variant ?? null,
                      src: row.src ?? null,
                      nextSrc: row.next_src ?? null,
                      online: typeof row.online === "boolean" ? row.online : null,
                      clientTs: row.client_ts ?? null,
                    });
                    historyByCid.set(cid, list);
                  }
                }
              }

              const hydrated = sentryEvents.map((ev) => ({
                ...ev,
                history: ev.correlationId ? (historyByCid.get(ev.correlationId) ?? []) : [],
              }));
              void forwardLogoErrorsToSentry(hydrated);
            } catch (err) {
              console.error("[client-log] sentry forwarder load failed:", err);
            }
          }

          return Response.json({ ok: true, received: entries.length }, { headers: corsHeaders() });
        } catch (err) {
          console.error("[client-log] sink failed:", err);
          return Response.json(
            { ok: false, error: "sink_failed" },
            { status: 500, headers: corsHeaders() },
          );
        }
      },
    },
  },
});
