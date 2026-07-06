import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/set-user-cred")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-token");
        const expected = process.env.TEMP_PWD_TOKEN2;
        if (!expected || token !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        const body = (await request.json()) as { email: string; password: string };
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (listErr) return Response.json({ error: listErr.message }, { status: 500 });
        const user = list.users.find(
          (u) => u.email?.toLowerCase() === body.email.toLowerCase(),
        );
        if (!user) return Response.json({ error: "user_not_found" }, { status: 404 });
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: body.password,
          email_confirm: true,
        });
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ ok: true, userId: user.id });
      },
    },
  },
});
