import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { resolveRedirect } from "./lib/redirects";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

/**
 * 301s old/variant URLs (locale aliases, legacy slugs, trailing slashes,
 * uppercase paths) to their single canonical /{locale}/{path} form so users
 * and crawlers never hit duplicate or empty pages after a language change.
 */
const redirectMiddleware = createMiddleware().server(async ({ next, request }) => {
  if (request.method === "GET" || request.method === "HEAD") {
    const url = new URL(request.url);
    const hit = resolveRedirect(url.pathname, url.search);
    if (hit) {
      return new Response(null, {
        status: hit.status,
        headers: { Location: hit.location, "cache-control": "public, max-age=3600" },
      });
    }
  }
  return next();
});


const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url);
  if (
    url.pathname.startsWith("/lovable/") ||
    url.pathname === "/email/unsubscribe" ||
    url.pathname.startsWith("/api/public/")
  ) {
    return next();
  }
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [redirectMiddleware, errorMiddleware],
}));
