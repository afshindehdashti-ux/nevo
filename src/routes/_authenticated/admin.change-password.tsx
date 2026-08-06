import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/crm-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/change-password")({
  head: () => ({
    meta: [{ title: "Change Password — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 10) return toast.error("Password must be at least 10 characters.");
    if (pw !== pw2) return toast.error("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    if (user?.id) {
      await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);
    }
    toast.success("Password updated.");
    navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            Your account is using a temporary password. Please set a new one to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pw">New password</Label>
              <Input
                id="pw"
                type="password"
                autoComplete="new-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
                minLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw2">Confirm password</Label>
              <Input
                id="pw2"
                type="password"
                autoComplete="new-password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                required
                minLength={10}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
