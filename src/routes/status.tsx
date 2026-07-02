import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";

/**
 * Public status page. Human-readable dashboard showing whether the
 * production build is live and responding. Safe to link users to
 * (e.g. from the maintenance banner) — no auth, no secrets.
 */

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "System Status — NEVO Industrial" },
      { name: "description", content: "Live deployment and API status for the NEVO Industrial website." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatusPage,
});

type CheckState =
  | { state: "loading" }
  | { state: "ok"; status: number; detail: string }
  | { state: "fail"; status: number; detail: string };

type Checks = {
  health: CheckState;
  home: CheckState;
};

async function checkEndpoint(path: string, expectJson: boolean): Promise<CheckState> {
  try {
    const res = await fetch(path, { cache: "no-store", redirect: "manual" });
    if (expectJson && res.status === 200) {
      try {
        const body = await res.json();
        if (body?.ok === true) {
          return { state: "ok", status: 200, detail: `service=${body.service ?? "unknown"} ts=${body.ts ?? "-"}` };
        }
        return { state: "fail", status: 200, detail: "ok:false in body" };
      } catch {
        return { state: "fail", status: 200, detail: "invalid JSON response" };
      }
    }
    if (!expectJson && res.status >= 200 && res.status < 400) {
      return { state: "ok", status: res.status, detail: `${res.status} ${res.statusText || ""}`.trim() };
    }
    return { state: "fail", status: res.status, detail: `${res.status} ${res.statusText || ""}`.trim() };
  } catch (err) {
    return { state: "fail", status: 0, detail: err instanceof Error ? err.message : String(err) };
  }
}

function StatusPage() {
  const [checks, setChecks] = useState<Checks>({
    health: { state: "loading" },
    home: { state: "loading" },
  });
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [running, setRunning] = useState(false);

  const runChecks = async () => {
    setRunning(true);
    setChecks({ health: { state: "loading" }, home: { state: "loading" } });
    const [health, home] = await Promise.all([
      checkEndpoint("/api/public/health", true),
      checkEndpoint("/", false),
    ]);
    setChecks({ health, home });
    setLastCheck(new Date());
    setRunning(false);
  };

  useEffect(() => {
    void runChecks();
    const iv = setInterval(() => void runChecks(), 30_000);
    return () => clearInterval(iv);
  }, []);

  const allOk = checks.health.state === "ok" && checks.home.state === "ok";
  const anyLoading = checks.health.state === "loading" || checks.home.state === "loading";
  const overall = anyLoading ? "Checking…" : allOk ? "All systems operational" : "Partial outage";

  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="eyebrow mb-3 text-accent">System status</div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{overall}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Real-time health checks for the NEVO Industrial production deployment.
        </p>

        <div className="mt-8 space-y-3">
          <StatusRow label="Health endpoint" path="/api/public/health" check={checks.health} />
          <StatusRow label="Homepage" path="/" check={checks.home} />
        </div>

        <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>{lastCheck ? `Last check: ${lastCheck.toLocaleTimeString()}` : "—"}</span>
          <button
            onClick={() => void runChecks()}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Auto-refreshes every 30 seconds. If a check keeps failing after a recent deploy,
          the build may still be propagating.
        </p>
      </div>
    </div>
  );
}

function StatusRow({ label, path, check }: { label: string; path: string; check: CheckState }) {
  const isOk = check.state === "ok";
  const isLoading = check.state === "loading";
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{path}</div>
        {!isLoading ? (
          <div className="mt-1 truncate text-xs text-muted-foreground">{check.detail}</div>
        ) : null}
      </div>
      <div className="ml-4 flex items-center gap-2 text-sm font-medium">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Checking</span>
          </>
        ) : isOk ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <span className="text-accent">Operational</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-destructive">Failing</span>
          </>
        )}
      </div>
    </div>
  );
}
