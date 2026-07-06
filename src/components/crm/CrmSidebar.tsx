import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { CRM_NAV, canSeeNavItem } from "@/lib/crm-nav";
import { useIsSuperAdmin, useMyProfile, useCurrentUser, useMyRoles } from "@/lib/crm-hooks";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/nevo-logo-light.png";

export function CrmSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isSuperAdmin = useIsSuperAdmin();
  const { data: profile } = useMyProfile();
  const { data: user } = useCurrentUser();
  const { data: roles } = useMyRoles();
  const effectiveRoles = roles ?? [];

  const isActive = (url: string) =>
    url === "/admin" ? pathname === "/admin" : pathname === url || pathname.startsWith(url + "/");

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border bg-background">
        <Link to="/admin" className="flex items-center gap-2 px-2 py-2">
          <img src={logo} alt="NEVO" className="h-8 w-auto object-contain" />
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">NEVO CRM</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Back Office
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {CRM_NAV.map((group) => {
          const items = group.items.filter((i) => canSeeNavItem(i, effectiveRoles));
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              {!collapsed && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        {!collapsed && user && (
          <div className="px-2 py-2">
            <p className="text-xs font-medium truncate">{profile?.full_name || user.email}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {isSuperAdmin ? "Super Admin" : profile?.job_title || "Team member"}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
