import { createFileRoute } from "@tanstack/react-router";

// 301 redirect: legacy /knowledge -> /knowledge-hub
export const Route = createFileRoute("/knowledge/")({
  server: {
    handlers: {
      GET: async () =>
        new Response(null, {
          status: 301,
          headers: { Location: "/knowledge-hub" },
        }),
    },
  },
});
