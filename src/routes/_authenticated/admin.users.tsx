import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsSuperAdmin, useCurrentUser } from "@/lib/crm-hooks";
import { inviteTeamMember, sendPasswordReset } from "@/lib/crm-admin.functions";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShieldAlert, UserPlus, KeyRound } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLES: { value: AppRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "management", label: "Management" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "read_only", label: "Read Only" },
];

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [{ title: "Users & Roles — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: UsersPage,
});

function UsersPage() {
  const isSuperAdmin = useIsSuperAdmin();
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();

  const profilesQ = useQuery({
    queryKey: ["profiles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rolesQ = useQuery({
    queryKey: ["user-roles-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data ?? [];
    },
  });

  const rolesByUser = useMemo(() => {
    const map = new Map<string, AppRole[]>();
    for (const r of rolesQ.data ?? []) {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      map.set(r.user_id, arr);
    }
    return map;
  }, [rolesQ.data]);

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["user-roles-list"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update role"),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: active })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profiles-list"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const inviteFn = useServerFn(inviteTeamMember);
  const resetFn = useServerFn(sendPasswordReset);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteTitle, setInviteTitle] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("sales");

  const invite = useMutation({
    mutationFn: () =>
      inviteFn({
        data: {
          email: inviteEmail.trim(),
          fullName: inviteName.trim(),
          jobTitle: inviteTitle.trim() || null,
          role: inviteRole,
        },
      }),
    onSuccess: () => {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteTitle("");
      setInviteRole("sales");
      qc.invalidateQueries({ queryKey: ["profiles-list"] });
      qc.invalidateQueries({ queryKey: ["user-roles-list"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to invite user"),
  });

  const resetPw = useMutation({
    mutationFn: (email: string) => resetFn({ data: { email } }),
    onSuccess: () => toast.success("Password reset email sent"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to send reset"),
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users & Roles</h1>
          <p className="text-sm text-muted-foreground">
            Manage team members and their CRM permissions.
          </p>
        </div>
        {isSuperAdmin && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" /> Invite user
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite team member</DialogTitle>
                <DialogDescription>
                  They will receive an email to set their password and sign in to the CRM.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Work email</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="jane@nevoindustrial.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Job title</Label>
                  <Input
                    value={inviteTitle}
                    onChange={(e) => setInviteTitle(e.target.value)}
                    placeholder="Sales Manager"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => invite.mutate()}
                  disabled={invite.isPending || !inviteEmail || !inviteName}
                >
                  {invite.isPending ? "Sending…" : "Send invitation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isSuperAdmin && (
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Restricted</AlertTitle>
          <AlertDescription>Only Super Admins can invite users or change roles.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team members</CardTitle>
          <CardDescription>
            Access is invite-only. Public sign-ups are disabled — only Super Admins can add new
            users.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Job title</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profilesQ.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {profilesQ.data?.map((p) => {
                const roles = rolesByUser.get(p.id) ?? [];
                const primary = roles[0];
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.full_name || <span className="text-muted-foreground">Unnamed</span>}
                      {p.id === me?.id && (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          You
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.job_title || "—"}</TableCell>
                    <TableCell>
                      {isSuperAdmin ? (
                        <Select
                          value={primary ?? ""}
                          onValueChange={(v) =>
                            setRole.mutate({ userId: p.id, role: v as AppRole })
                          }
                        >
                          <SelectTrigger className="w-40 h-8">
                            <SelectValue placeholder="Assign role" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary">
                          {primary ? ROLES.find((r) => r.value === primary)?.label : "No role"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.last_login_at
                        ? formatDistanceToNow(new Date(p.last_login_at), { addSuffix: true })
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {p.is_active ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {isSuperAdmin && p.id !== me?.id && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1"
                            onClick={() => {
                              const email = (p as { email?: string | null }).email;
                              if (!email) {
                                toast.error("No email on profile");
                                return;
                              }
                              resetPw.mutate(email);
                            }}
                          >
                            <KeyRound className="h-3.5 w-3.5" /> Reset
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              toggleActive.mutate({ userId: p.id, active: !p.is_active })
                            }
                          >
                            {p.is_active ? "Disable" : "Enable"}
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {profilesQ.data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No team members yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
