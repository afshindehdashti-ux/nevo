import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useIsSuperAdmin, useMyRoles } from "@/lib/crm-hooks";
import { inviteTeamMember } from "@/lib/crm-admin.functions";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ShieldAlert, UserPlus, ArrowLeft, Loader2 } from "lucide-react";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLES: { value: AppRole; label: string; description: string }[] = [
  {
    value: "super_admin",
    label: "Super Admin",
    description: "Full access. Can invite users, assign roles, and change settings.",
  },
  {
    value: "management",
    label: "Management",
    description: "Read/write across all modules except user administration.",
  },
  {
    value: "sales",
    label: "Sales",
    description: "Customers, leads, opportunities, tasks, files, reports.",
  },
  {
    value: "operations",
    label: "Operations",
    description: "Orders, suppliers, products, tasks, files, reports.",
  },
  {
    value: "finance",
    label: "Finance",
    description: "Invoices, payments, purchase orders, company & document settings.",
  },
  {
    value: "read_only",
    label: "Read Only",
    description: "Dashboard, tasks, files, and reports only. No writes.",
  },
];

export const Route = createFileRoute("/_authenticated/admin/users/invite")({
  head: () => ({
    meta: [{ title: "Invite user — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: InviteUserPage,
});

function InviteUserPage() {
  const isSuperAdmin = useIsSuperAdmin();
  const { isLoading: rolesLoading, isFetched: rolesFetched } = useMyRoles();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const inviteFn = useServerFn(inviteTeamMember);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [role, setRole] = useState<AppRole | "">("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Client-side guard: bounce non-super-admins off the URL once roles are known.
  // The server function ALSO enforces super_admin — this is UX, not the security boundary.
  useEffect(() => {
    if (rolesFetched && !isSuperAdmin) {
      navigate({ to: "/admin", replace: true });
    }
  }, [rolesFetched, isSuperAdmin, navigate]);

  const invite = useMutation({
    mutationFn: () =>
      inviteFn({
        data: {
          email: email.trim(),
          fullName: fullName.trim(),
          jobTitle: jobTitle.trim() || null,
          role: role as AppRole,
        },
      }),
    onSuccess: () => {
      toast.success(`Invitation sent to ${email}`);
      qc.invalidateQueries({ queryKey: ["profiles-list"] });
      qc.invalidateQueries({ queryKey: ["user-roles-list"] });
      navigate({ to: "/admin/users" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to invite user"),
  });

  // Loading roles — don't flash the form or the denial alert.
  if (rolesLoading || !rolesFetched) {
    return (
      <div className="p-10 flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking permissions…</span>
      </div>
    );
  }

  // Denial screen for non-super-admins. The useEffect above will also redirect.
  if (!isSuperAdmin) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Super Admin access required</AlertTitle>
          <AlertDescription>
            Only Super Admins can invite new team members. Redirecting…
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (!email.trim() || !fullName.trim() || !role) {
      toast.error("Full name, email, and role are required.");
      return;
    }
    invite.mutate();
  }

  const roleMissing = attemptedSubmit && !role;
  const selectedRole = ROLES.find((r) => r.value === role);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="gap-1 -ml-2 mb-2">
            <Link to="/admin/users">
              <ArrowLeft className="h-4 w-4" /> Back to Users
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-accent" />
            Invite team member
          </h1>
          <p className="text-sm text-muted-foreground">
            The invitee will receive an email to set their password. Every user must have a role
            assigned at invitation time.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invitation details</CardTitle>
          <CardDescription>
            All fields except job title are required. Role determines which CRM modules the user
            will see after signing in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">
                  Full name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Work email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@nevoindustrial.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Sales Manager"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger
                  id="role"
                  aria-invalid={roleMissing}
                  className={roleMissing ? "border-destructive" : undefined}
                >
                  <SelectValue placeholder="Select a role…" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{r.label}</span>
                        <span className="text-xs text-muted-foreground">{r.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roleMissing && (
                <p className="text-xs text-destructive">Role selection is required.</p>
              )}
              {selectedRole && !roleMissing && (
                <p className="text-xs text-muted-foreground">{selectedRole.description}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button asChild variant="ghost" type="button">
                <Link to="/admin/users">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={invite.isPending || !email || !fullName || !role}
                className="gap-2"
              >
                {invite.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Send invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
