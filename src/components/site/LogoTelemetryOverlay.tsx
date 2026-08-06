/**
 * Tiny fixed-position QA button — DEV BUILDS ONLY — that lets a tester
 * export the current `__nevoLogoDebug.copyDump()` blob without opening
 * the devtools console. It reads the util straight off `window` so it
 * stays a no-op if the debug module didn't attach (e.g. prod bundle).
 *
 * The button intentionally lives in the bottom-left so it doesn't clash
 * with the sticky mobile CTA (bottom-right) or the AI assistant launcher.
 *
 * A collapsible "Knowledge hub" panel next to the button shows the single-line
 * console format and ready-to-use grep queries so QA can copy them without
 * switching to the source code.
 */
import { useEffect, useState } from "react";
import { isLogoDebugEnabled } from "@/lib/logo-telemetry-config";
import { shouldShowLogoTelemetryOverlay } from "./logo-telemetry-overlay-visibility";

const LOG_LINE_EXAMPLES = [
  `[nevo:logo-telemetry] kind=error decision=sampled-in reason=accepted stage=primary-light-png terminal=false correlationId=cid-123 counters.renderLogged=false counters.renderSampled=true counters.errorCount=1 counters.lastErrorStage=primary-light-png counters.msSinceLastError=null limits.renderSampleRate=0.01 limits.errorMaxPerSession=5 limits.errorMinIntervalMs=1000 ts=123456789`,
  `[nevo:logo-telemetry] kind=render decision=sampled-in reason=first-render stage=null terminal=undefined correlationId=cid-123 counters.renderLogged=true counters.renderSampled=true counters.errorCount=0 counters.lastErrorStage= counters.msSinceLastError=null limits.renderSampleRate=0.01 limits.errorMaxPerSession=5 limits.errorMinIntervalMs=1000 ts=123456789`,
  `[nevo:logo-telemetry] kind=error decision=sampled-out reason=throttle stage=primary-light-png terminal=false correlationId=cid-123 counters.renderLogged=false counters.renderSampled=true counters.errorCount=1 counters.lastErrorStage=primary-light-png counters.msSinceLastError=150 limits.renderSampleRate=0.01 limits.errorMaxPerSession=5 limits.errorMinIntervalMs=1000 ts=123456789`,
];

const GREP_QUERIES = [
  { label: "All logo-telemetry lines", query: 'grep "\\[nevo:logo-telemetry\\]" console.log' },
  { label: "One incident by correlationId", query: 'grep "correlationId=cid-123" console.log' },
  { label: "Errors that were emitted", query: 'grep "kind=error decision=sampled-in" console.log' },
  {
    label: "Errors suppressed (and why)",
    query: 'grep "kind=error decision=sampled-out" console.log',
  },
  { label: "Specific render stage", query: 'grep "stage=primary-light-png" console.log' },
  { label: "Throttled per-stage repeats", query: 'grep "reason=throttle" console.log' },
  { label: "First-render sample decision", query: 'grep "reason=first-render" console.log' },
  {
    label: "Terminal errors",
    query: 'grep -E "kind=error.*reason=terminal|reason=terminal.*kind=error" console.log',
  },
  { label: "Count emitted errors", query: 'grep -c "kind=error decision=sampled-in" console.log' },
];

type CopyDump = (origin?: "console" | "button" | "auto") => Promise<string>;

function getDebugUtil(): { copyDump: CopyDump } | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    __nevoLogoDebug?: { copyDump?: CopyDump };
  };
  const cd = w.__nevoLogoDebug?.copyDump;
  return typeof cd === "function" ? { copyDump: cd } : null;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export function LogoTelemetryOverlay() {
  const [status, setStatus] = useState<"idle" | "copying" | "copied" | "error">("idle");
  const [copiedExample, setCopiedExample] = useState<number | null>(null);
  const [copiedQuery, setCopiedQuery] = useState<number | null>(null);
  const [hubOpen, setHubOpen] = useState(false);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // The debug module attaches on import, but this component may mount
    // before the microtask completes; poll once on next tick just in case.
    setAvailable(!!getDebugUtil());
    const id = window.setTimeout(() => setAvailable(!!getDebugUtil()), 0);
    return () => window.clearTimeout(id);
  }, []);

  // Keep QA controls opt-in even in local development. The debug utility is
  // attached in every dev build, but the overlay should only appear when a
  // tester explicitly enables logo debugging.
  if (
    !shouldShowLogoTelemetryOverlay({
      isDev: import.meta.env.DEV,
      debugEnabled: isLogoDebugEnabled(),
      available,
    })
  ) {
    return null;
  }

  const label =
    status === "copying"
      ? "Copying…"
      : status === "copied"
        ? "Copied ✓"
        : status === "error"
          ? "Copy failed"
          : "Copy logo dump";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        zIndex: 2147483000,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "flex-start",
      }}
    >
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button
          type="button"
          aria-label="Copy logo telemetry dump for QA bug report"
          data-testid="logo-telemetry-overlay-button"
          onClick={async () => {
            const util = getDebugUtil();
            if (!util) {
              setStatus("error");
              return;
            }
            setStatus("copying");
            try {
              await util.copyDump("button");
              setStatus("copied");
              window.setTimeout(() => setStatus("idle"), 2000);
            } catch {
              setStatus("error");
              window.setTimeout(() => setStatus("idle"), 2000);
            }
          }}
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 11,
            lineHeight: 1,
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.15)",
            background:
              status === "copied"
                ? "rgba(22,101,52,0.9)"
                : status === "error"
                  ? "rgba(153,27,27,0.9)"
                  : "rgba(17,24,39,0.85)",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            opacity: 0.85,
          }}
        >
          {label}
        </button>
        <button
          type="button"
          aria-label={
            hubOpen ? "Close logo telemetry knowledge hub" : "Open logo telemetry knowledge hub"
          }
          aria-expanded={hubOpen}
          onClick={() => setHubOpen((s) => !s)}
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 11,
            lineHeight: 1,
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.15)",
            background: hubOpen ? "rgba(59,130,246,0.9)" : "rgba(17,24,39,0.85)",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            opacity: 0.85,
          }}
        >
          {hubOpen ? "Close hub" : "Knowledge hub"}
        </button>
      </div>

      {hubOpen && (
        <div
          style={{
            width: 420,
            maxWidth: "calc(100vw - 24px)",
            maxHeight: "60vh",
            overflow: "auto",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(17,24,39,0.95)",
            color: "#e5e7eb",
            boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
            padding: 12,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 11,
            lineHeight: 1.45,
          }}
        >
          <h3 style={{ margin: "0 0 8px", color: "#fff", fontSize: 12 }}>
            Single-line console format
          </h3>
          <p style={{ margin: "0 0 10px", opacity: 0.85 }}>
            Each decision prints as one flat line of space-separated key=value pairs. Control chars
            and spaces inside values are escaped as \xNN so the line is always grep-safe.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {LOG_LINE_EXAMPLES.map((ex, i) => (
              <div key={i} style={{ display: "flex", gap: 6 }}>
                <code
                  style={{
                    flex: 1,
                    display: "block",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    background: "rgba(0,0,0,0.35)",
                    padding: "6px 8px",
                    borderRadius: 4,
                    color: "#9ca3af",
                  }}
                >
                  {ex}
                </code>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyToClipboard(ex);
                    if (ok) {
                      setCopiedExample(i);
                      window.setTimeout(() => setCopiedExample(null), 1500);
                    }
                  }}
                  style={{
                    flexShrink: 0,
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 10,
                  }}
                >
                  {copiedExample === i ? "Copied" : "Copy"}
                </button>
              </div>
            ))}
          </div>

          <h3
            style={{
              margin: "16px 0 8px",
              color: "#fff",
              fontSize: 12,
            }}
          >
            Suggested grep queries
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {GREP_QUERIES.map((q, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#d1d5db", marginBottom: 2 }}>{q.label}</div>
                  <code
                    style={{
                      display: "block",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      background: "rgba(0,0,0,0.35)",
                      padding: "4px 8px",
                      borderRadius: 4,
                      color: "#9ca3af",
                    }}
                  >
                    {q.query}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyToClipboard(q.query);
                    if (ok) {
                      setCopiedQuery(i);
                      window.setTimeout(() => setCopiedQuery(null), 1500);
                    }
                  }}
                  style={{
                    flexShrink: 0,
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 10,
                  }}
                >
                  {copiedQuery === i ? "Copied" : "Copy"}
                </button>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              opacity: 0.75,
            }}
          >
            Toggle live console lines: enableLogLine() / disableLogLine(). Scope a dump to one
            incident: copyDumpForCorrelationId("cid-123").
          </div>
        </div>
      )}
    </div>
  );
}
