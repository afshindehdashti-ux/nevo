import * as React from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod";

const search = z.object({ token: z.string().optional() });

type State =
  | { kind: "loading" }
  | { kind: "valid" }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "success" }
  | { kind: "error"; message: string };

function UnsubscribePage() {
  const { token } = useSearch({ from: "/unsubscribe" });
  const [state, setState] = React.useState<State>({ kind: "loading" });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function validate() {
      if (!token) {
        setState({ kind: "invalid" });
        return;
      }
      try {
        const res = await fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setState({ kind: "invalid" });
        } else if (data.valid === true) {
          setState({ kind: "valid" });
        } else if (data.valid === false && data.reason === "already_unsubscribed") {
          setState({ kind: "already" });
        } else {
          setState({ kind: "invalid" });
        }
      } catch (err: any) {
        if (!cancelled) setState({ kind: "error", message: err?.message ?? "Network error" });
      }
    }
    validate();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function confirm() {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) setState({ kind: "success" });
      else if (data.reason === "already_unsubscribed") setState({ kind: "already" });
      else setState({ kind: "error", message: data.error ?? "Failed to unsubscribe" });
    } catch (err: any) {
      setState({ kind: "error", message: err?.message ?? "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          NEVO Industrial
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Email preferences</h1>

        {state.kind === "loading" && (
          <p className="mt-6 text-sm text-muted-foreground">Checking your link…</p>
        )}

        {state.kind === "valid" && (
          <>
            <p className="mt-6 text-sm">
              Confirm you'd like to stop receiving notification emails from NEVO Industrial at this
              address.
            </p>
            <button
              onClick={confirm}
              disabled={submitting}
              className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Unsubscribing…" : "Confirm unsubscribe"}
            </button>
          </>
        )}

        {state.kind === "already" && (
          <p className="mt-6 text-sm">
            You've already been unsubscribed. No further action needed.
          </p>
        )}

        {state.kind === "invalid" && (
          <p className="mt-6 text-sm">This unsubscribe link is invalid or has expired.</p>
        )}

        {state.kind === "success" && (
          <p className="mt-6 text-sm">
            You've been unsubscribed. You'll no longer receive notification emails from us.
          </p>
        )}

        {state.kind === "error" && <p className="mt-6 text-sm text-destructive">{state.message}</p>}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (s) => search.parse(s),
  component: UnsubscribePage,
});
