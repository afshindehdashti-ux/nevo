import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { resolveLandingRoute } from "@/lib/role-landing";

export const Route = createFileRoute("/crm")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/admin/login" });
    }
    const to = await resolveLandingRoute(data.user.id);
    throw redirect({ to });
  },
});
