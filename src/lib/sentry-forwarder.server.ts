/**
 * Server-only Sentry forwarder for header.logo.error events.
 *
 * Ships the enriched payload received by /api/public/client-log to Sentry
 * via the raw envelope HTTP API — no SDK, so it runs fine on the Cloudflare
 * Workers SSR runtime and adds zero client-bundle weight.
 *
 * DSN is read from process.env.SENTRY_DSN inside the caller's handler; if it
 * is missing or malformed, the forwarder no-ops silently so the client-log
 * sink continues to serve traffic without Sentry.
 *
 * File is `.server.ts` — never imported directly from client bundles.
 */

type LogoErrorEvent = {
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
};

type ParsedDsn = {
  publicKey: string;
  host: string;
  projectId: string;
  envelopeUrl: string;
};

let cachedDsn: ParsedDsn | null | undefined;

function parseDsn(dsn: string | undefined): ParsedDsn | null {
  if (!dsn) return null;
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\/+/, "").split("/").pop() ?? "";
    if (!publicKey || !projectId || !url.host) return null;
    const envelopeUrl = `${url.protocol}//${url.host}/api/${projectId}/envelope/`;
    return { publicKey, host: url.host, projectId, envelopeUrl };
  } catch {
    return null;
  }
}

function getDsn(): ParsedDsn | null {
  if (cachedDsn !== undefined) return cachedDsn;
  cachedDsn = parseDsn(process.env.SENTRY_DSN);
  return cachedDsn;
}

function randomEventId(): string {
  // 32 hex chars — Sentry event id format
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function toIsoTs(v: unknown): string {
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function toEpochSeconds(v: unknown): number {
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.getTime() / 1000;
  }
  return Date.now() / 1000;
}

function buildSentryEvent(e: LogoErrorEvent) {
  const stage = e.stage ?? "unknown";
  const terminal = e.terminal === true;
  const nextStep =
    stage === "primary-light-png"
      ? "fallback-cdn"
      : stage === "fallback-cdn-full"
        ? "inline-svg"
        : "none";
  return {
    event_id: randomEventId(),
    timestamp: toEpochSeconds(e.clientTs),
    platform: "javascript",
    level: terminal ? "error" : "warning",
    logger: "header.logo",
    environment: process.env.NODE_ENV ?? "production",
    release: e.release,
    transaction: e.route,
    message: {
      formatted: `header.logo.error [${stage}]${terminal ? " · terminal" : ""}`,
    },
    fingerprint: ["header.logo.error", stage],
    tags: {
      stage,
      variant: e.variant ?? null,
      terminal: String(terminal),
      next_step: nextStep,
      viewport_width: e.viewportWidth ?? null,
      online: typeof e.online === "boolean" ? String(e.online) : null,
      schema: e.schema ?? null,
      schema_version:
        typeof e.schemaVersion === "number" ? String(e.schemaVersion) : null,
      correlation_id: e.correlationId ?? null,
    },
    user: e.correlationId ? { id: e.correlationId } : undefined,
    request: {
      url: e.url,
      headers: e.ua ? { "User-Agent": e.ua } : undefined,
    },
    extra: {
      failedSrc: e.failedSrc,
      nextSrc: e.nextSrc,
      correlationId: e.correlationId,
      payload: e.extra,
    },
    breadcrumbs: {
      values: [
        {
          type: "default",
          category: "header.logo",
          level: terminal ? "error" : "warning",
          timestamp: toEpochSeconds(e.clientTs),
          message: `stage=${stage} nextStep=${nextStep}`,
          data: {
            variant: e.variant,
            failedSrc: e.failedSrc,
            nextSrc: e.nextSrc,
            viewportWidth: e.viewportWidth,
            online: e.online,
          },
        },
      ],
    },
  };
}

function buildEnvelope(dsn: ParsedDsn, events: ReturnType<typeof buildSentryEvent>[]): string {
  const sentAt = new Date().toISOString();
  const header = JSON.stringify({ dsn: process.env.SENTRY_DSN, sent_at: sentAt });
  const items = events
    .map((ev) => {
      const itemHeader = JSON.stringify({
        type: "event",
        event_id: ev.event_id,
        content_type: "application/json",
      });
      return `${itemHeader}\n${JSON.stringify(ev)}`;
    })
    .join("\n");
  return `${header}\n${items}\n`;
  // Reference dsn.host so tree-shakers don't drop the parsed struct.
  void dsn.host;
}

/**
 * Forwards one batch of header.logo.error events to Sentry.
 * Fire-and-forget: caller does not await the result.
 * Never throws — Sentry outages MUST NOT break the client-log sink.
 */
export async function forwardLogoErrorsToSentry(
  events: LogoErrorEvent[],
): Promise<void> {
  if (events.length === 0) return;
  const dsn = getDsn();
  if (!dsn) return; // no DSN configured — silent no-op
  try {
    const sentryEvents = events.map(buildSentryEvent);
    const body = buildEnvelope(dsn, sentryEvents);
    const auth = [
      "Sentry sentry_version=7",
      `sentry_client=nevo-logo-forwarder/1.0`,
      `sentry_key=${dsn.publicKey}`,
    ].join(", ");
    const res = await fetch(dsn.envelopeUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-sentry-envelope",
        "user-agent": "nevo-logo-forwarder/1.0",
        "x-sentry-auth": auth,
      },
      body,
    });
    if (!res.ok) {
      console.error(
        "[sentry-forwarder] envelope rejected:",
        res.status,
        (await res.text().catch(() => "")).slice(0, 400),
      );
    }
  } catch (err) {
    console.error("[sentry-forwarder] send failed:", err);
  }
}
