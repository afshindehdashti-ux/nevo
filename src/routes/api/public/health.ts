import { createFileRoute } from "@tanstack/react-router";

// Lightweight uptime probe. Public, unauthenticated, no PII.
// Used by external uptime monitors (Better Stack, UptimeRobot, etc.)
// and post-publish smoke checks.
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(
          JSON.stringify({
            ok: true,
            service: "nevo-engineering-hub",
            ts: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store, max-age=0",
            },
          },
        );
      },
      HEAD: async () =>
        new Response(null, {
          status: 200,
          headers: { "cache-control": "no-store, max-age=0" },
        }),
    },
  },
});
