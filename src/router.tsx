import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // Fresh client per request (SSR safe). Defaults are tuned so back/forward
  // navigation repaints from cache instantly instead of refetching on mount.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        // Cached data paints immediately; a background refresh only runs when
        // the entry is actually stale (or was explicitly invalidated).
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Preload on hover/focus so a click paints from a warm cache.
    defaultPreload: "intent",
    // Query owns freshness; the router preload cache must not shadow it.
    defaultPreloadStaleTime: 0,
  });

  return router;
};
