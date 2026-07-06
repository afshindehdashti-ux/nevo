import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CrmSidebar } from "@/components/crm/CrmSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/crm-hooks";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "NEVO CRM — Back Office" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { data: user } = useCurrentUser();

  // Track last login (fire-and-forget, once per session mount)
  useEffect(() => {
    if (!user?.id) return;
    const key = `crm:last-login:${user.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id)
      .then(() => {});
    supabase
      .from("activity_logs")
      .insert({
        user_id: user.id,
        action: "sign_in",
        entity_type: "auth",
        entity_id: user.id,
      })
      .then(() => {});
  }, [user?.id]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <CrmSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border bg-background px-4 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">NEVO Industrial</span>
              <span>·</span>
              <span>Internal CRM</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
