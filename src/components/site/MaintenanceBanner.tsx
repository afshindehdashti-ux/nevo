import { useEffect, useState, useCallback } from "react";
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Maintenance / deploy-in-progress banner.
 *
 * Rendered inside the root NotFoundComponent. On mount it probes
 * /api/public/health and the current URL to figure out whether this
 * "404" is really a partial-deploy situation (health endpoint missing,
 * 307 redirect, 5xx from the origin) or a legitimate not-found.
 *
 * If it looks like a partial deploy, it takes over the UI with a
 * maintenance card, polls health every 10s, and reloads the page as
 * soon as the current URL responds 200 again.
 *
 * Never renders anything on genuine 404s — the caller keeps showing
 * its normal not-found content in that case.
 */

type Phase =
  | "checking"        // initial probe
  | "genuine_404"     // health ok AND current path 404 → nothing to do
  | "deploying"      // health missing/5xx/307 → show maintenance UI
  | "recovering"     // health returned but current path still 404 → keep polling
  | "recovered";     // ready to reload

const HEALTH_PATH = "/api/public/health";
const POLL_MS = 10_000;
const MAX_POLLS = 60; // ~10 minutes

async function probeStatus(currentPath: string): Promise<
  { healthOk: boolean; pathOk: boolean; healthStatus: number; pathStatus: number }
> {
  const [h, p] = await Promise.allSettled([
    fetch(HEALTH_PATH, { cache: "no-store", redirect: "manual" }),
    fetch(currentPath, { method: "HEAD", cache: "no-store", redirect: "manual" }),
  ]);
  const healthRes = h.status === "fulfilled" ? h.value : undefined;
  const pathRes = p.status === "fulfilled" ? p.value : undefined;
  let healthOk = false;
  if (healthRes && healthRes.status === 200) {
    try {
      const body = await healthRes.clone().json();
      healthOk = body?.ok === true;
    } catch {
      healthOk = false;
    }
  }
  return {
    healthOk,
    pathOk: !!pathRes && pathRes.status >= 200 && pathRes.status < 400,
    healthStatus: healthRes?.status ?? 0,
    pathStatus: pathRes?.status ?? 0,
  };
}

export function MaintenanceBanner() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [polls, setPolls] = useState(0);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runProbe = useCallback(async () => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname + window.location.search;
    const result = await probeStatus(path);
    setLastCheck(new Date());

    // Partial deploy signals:
    //   - health endpoint not there yet (0/404/307/5xx)
    //   - current path returns 5xx (build broken) — treat as deploying
    const deploying =
      !result.healthOk ||
      result.healthStatus === 307 ||
      result.healthStatus === 308 ||
      result.healthStatus >= 500 ||
      result.pathStatus >= 500;

    if (deploying) {
      setPhase("deploying");
      return;
    }
    // Health is good. If the original URL now responds 2xx/3xx, reload.
    if (result.pathOk) {
      setPhase("recovered");
      setTimeout(() => window.location.reload(), 400);
      return;
    }
    // Health good but path still 404 → could be recovering or genuine miss.
    // First check after we already showed the maintenance UI stays as
    // "recovering" so we keep polling briefly before falling back.
    setPhase((prev) => (prev === "deploying" || prev === "recovering" ? "recovering" : "genuine_404"));
  }, []);

  useEffect(() => {
    void runProbe();
  }, [runProbe]);

  useEffect(() => {
    if (phase !== "deploying" && phase !== "recovering") return;
    if (polls >= MAX_POLLS) return;
    const t = setTimeout(() => {
      setPolls((n) => n + 1);
      void runProbe();
    }, POLL_MS);
    return () => clearTimeout(t);
  }, [phase, polls, runProbe]);

  // Genuine 404 or still figuring it out → render nothing (caller shows 404 UI).
  if (phase === "checking" || phase === "genuine_404") return null;

  const isRecovering = phase === "recovering" || phase === "recovered";
  const title = phase === "recovered"
    ? "Back online — reloading"
    : isRecovering
      ? "Almost ready"
      : "Site update in progress";

  const body = phase === "recovered"
    ? "The new build is live. Reloading this page now…"
    : isRecovering
      ? "The new build is deploying. This page will appear as soon as it's ready."
      : "We're publishing a new build. Some pages may return 404 for a minute or two while it propagates.";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm px-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-panel-lg">
        <div className="mb-5 flex items-center gap-3">
          {phase === "recovered" ? (
            <CheckCircle2 className="h-6 w-6 text-accent" />
          ) : isRecovering ? (
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-accent" />
          )}
          <div className="eyebrow text-accent">Deployment status</div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{body}</p>

        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {lastCheck ? `Last check: ${lastCheck.toLocaleTimeString()}` : "Checking…"}
          </span>
          <span>
            Retry {polls}/{MAX_POLLS}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setPolls(0);
              void runProbe();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Check now
          </button>
          <a
            href="/status"
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            View full status
          </a>
        </div>

        {polls >= MAX_POLLS ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Deploy is taking longer than expected. Please try again shortly or contact support.
          </p>
        ) : null}
      </div>
    </div>
  );
}
