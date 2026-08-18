import { createFileRoute } from "@tanstack/react-router";

/**
 * Public delivery endpoint for admin-uploaded image replacements.
 *
 * The `site-images` bucket is private, so this route streams the object with a
 * short-lived signed URL created server-side. Only paths that are registered as
 * an ACTIVE override are served — the bucket is never browsable.
 */
export const Route = createFileRoute("/api/public/site-image/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const storagePath = decodeURIComponent(
          (params as Record<string, string>)["_splat"] ?? "",
        ).replace(/^\/+/, "");

        if (!storagePath || storagePath.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Only serve files that an admin registered as an active replacement.
        const { data: row } = await supabaseAdmin
          .from("image_slot_overrides")
          .select("storage_path, content_type, is_active")
          .eq("storage_path", storagePath)
          .eq("is_active", true)
          .maybeSingle();

        if (!row) return new Response("Not found", { status: 404 });

        const { data: file, error } = await supabaseAdmin.storage
          .from("site-images")
          .download(storagePath);

        if (error || !file) return new Response("Not found", { status: 404 });

        return new Response(await file.arrayBuffer(), {
          headers: {
            "Content-Type": row.content_type || file.type || "application/octet-stream",
            "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
          },
        });
      },
    },
  },
});
