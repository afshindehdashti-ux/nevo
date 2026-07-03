/**
 * Tiny fixed-position QA button — DEV BUILDS ONLY — that lets a tester
 * export the current `__nevoLogoDebug.copyDump()` blob without opening
 * the devtools console. It reads the util straight off `window` so it
 * stays a no-op if the debug module didn't attach (e.g. prod bundle).
 *
 * The button intentionally lives in the bottom-left so it doesn't clash
 * with the sticky mobile CTA (bottom-right) or the AI assistant launcher.
 */
import { useEffect, useState } from "react";

type CopyDump = (origin?: "console" | "button" | "auto") => Promise<string>;

function getDebugUtil(): { copyDump: CopyDump } | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    __nevoLogoDebug?: { copyDump?: CopyDump };
  };
  const cd = w.__nevoLogoDebug?.copyDump;
  return typeof cd === "function" ? { copyDump: cd } : null;
}

export function LogoTelemetryOverlay() {
  // Dev-only guard — matches attachLogoDebugUtil()'s import.meta.env.DEV check
  // so the overlay literally isn't rendered on published builds.
  if (!import.meta.env.DEV) return null;

  const [status, setStatus] = useState<"idle" | "copying" | "copied" | "error">(
    "idle",
  );
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // The debug module attaches on import, but this component may mount
    // before the microtask completes; poll once on next tick just in case.
    setAvailable(!!getDebugUtil());
    const id = window.setTimeout(() => setAvailable(!!getDebugUtil()), 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!available) return null;

  const label =
    status === "copying"
      ? "Copying…"
      : status === "copied"
        ? "Copied ✓"
        : status === "error"
          ? "Copy failed"
          : "Copy logo dump";

  return (
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
        position: "fixed",
        bottom: 12,
        left: 12,
        zIndex: 2147483000,
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
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
  );
}
