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

export type LogoHistoryEntry = {
  eventType: "render" | "error";
  stage?: string | null;
  variant?: string | null;
  src?: string | null;
  nextSrc?: string | null;
  online?: boolean | null;
  clientTs?: string | null;
};

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
  /** Ordered fallback-chain timeline for this correlationId (oldest first). */
  history?: LogoHistoryEntry[];
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

function buildBreadcrumbs(e: LogoErrorEvent) {
  const nowStage = e.stage ?? "unknown";
  const currentTs = toEpochSeconds(e.clientTs);
  const history = Array.isArray(e.history) ? e.history : [];
  const cid = e.correlationId ?? null;

  const crumbs = history.map((h) => {
    const kind = h.eventType === "error" ? "fail" : "render";
    return {
      type: "default",
      category: `header.logo.${h.eventType}`,
      level: h.eventType === "error" ? "warning" : "info",
      timestamp: toEpochSeconds(h.clientTs ?? undefined),
      message: `[cid:${cid ?? "-"}] ${kind}:${h.stage ?? "unknown"}`,
      data: {
        correlationId: cid,
        variant: h.variant ?? undefined,
        src: h.src ?? undefined,
        nextSrc: h.nextSrc ?? undefined,
        online: h.online ?? undefined,
      },
    };
  });

  // Always include the current failure as the final crumb so the tail of the
  // chain matches the event itself, even if the DB lookup missed the row.
  const tailMessage = `[cid:${cid ?? "-"}] fail:${nowStage}`;
  const alreadyPresent = crumbs.some(
    (c) =>
      c.category === "header.logo.error" &&
      c.message === tailMessage &&
      Math.abs(c.timestamp - currentTs) < 0.001,
  );
  if (!alreadyPresent) {
    crumbs.push({
      type: "default",
      category: "header.logo.error",
      level: e.terminal ? "error" : "warning",
      timestamp: currentTs,
      message: tailMessage,
      data: {
        correlationId: cid,
        variant: e.variant,
        src: e.failedSrc,
        nextSrc: e.nextSrc,
        online: e.online,
      },
    });
  }
  return { values: crumbs };
}


function buildFallbackChain(e: LogoErrorEvent): string {
  const parts: string[] = [];
  const history = Array.isArray(e.history) ? e.history : [];
  for (const h of history) {
    const kind = h.eventType === "error" ? "fail" : "render";
    parts.push(`${kind}:${h.stage ?? "unknown"}`);
  }
  const tail = `fail:${e.stage ?? "unknown"}`;
  if (parts[parts.length - 1] !== tail) parts.push(tail);
  return parts.join(" → ");
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
  const fallbackChain = buildFallbackChain(e);
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
      formatted: `header.logo.error [${stage}]${terminal ? " · terminal" : ""} · ${fallbackChain}`,
    },
    fingerprint: ["header.logo.error", stage, fallbackChain],
    tags: {
      stage,
      variant: e.variant ?? null,
      terminal: String(terminal),
      next_step: nextStep,
      fallback_chain: fallbackChain,
      chain_length: String((e.history?.length ?? 0) + 1),
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
      fallbackChain,
      history: e.history ?? [],
      payload: e.extra,
    },
    breadcrumbs: buildBreadcrumbs(e),
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
