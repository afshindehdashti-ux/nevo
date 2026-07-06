import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/document-access")({
  head: () => ({
    meta: [
      { title: "Document Access — NEVO Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DocumentAccessPage,
});

function DocumentAccessPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Document Portal Access</h1>
        <p className="text-sm text-muted-foreground">
          Link signed-in user accounts to a customer or partner so they can access
          approved documents routed to that portal.
        </p>
      </div>

      <Tabs defaultValue="customer">
        <TabsList>
          <TabsTrigger value="customer">Customer users</TabsTrigger>
          <TabsTrigger value="partner">Partner users</TabsTrigger>
        </TabsList>
        <TabsContent value="customer" className="mt-4">
          <MappingManager kind="customer" />
        </TabsContent>
        <TabsContent value="partner" className="mt-4">
          <MappingManager kind="partner" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type Kind = "customer" | "partner";

function MappingManager({ kind }: { kind: Kind }) {
  const qc = useQueryClient();
  const table = kind === "customer" ? "customer_users" : "partner_users";
  const fk = kind === "customer" ? "customer_id" : "partner_id";
  const parentTable = kind === "customer" ? "customers" : "partners";

  const [entityId, setEntityId] = useState<string>("");
  const [email, setEmail] = useState("");

  const parents = useQuery({
    queryKey: [parentTable, "list-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(parentTable)
        .select("id, name")
        .order("name")
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const mappings = useQuery({
    queryKey: [table, entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("id, user_id, created_at")
        .eq(fk, entityId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (data ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      const byId = new Map((profs ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((r) => ({
        ...r,
        profile: byId.get(r.user_id) as { full_name?: string; email?: string } | undefined,
      }));
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!entityId) throw new Error("Choose a " + kind + " first");
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) throw new Error("Enter user email");
      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("id, email")
        .ilike("email", cleanEmail)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!prof) throw new Error("No user found with that email. They must sign in first.");
      const { error } = await supabase.from(table).insert({
        [fk]: entityId,
        user_id: prof.id,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Access granted");
      setEmail("");
      qc.invalidateQueries({ queryKey: [table, entityId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Access revoked");
      qc.invalidateQueries({ queryKey: [table, entityId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base capitalize">{kind} → user mappings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end">
          <div>
            <Label className="text-xs capitalize">{kind}</Label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${kind}…`} />
              </SelectTrigger>
              <SelectContent>
                {(parents.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">User email</Label>
            <Input
              type="email"
              placeholder="user@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!entityId}
            />
          </div>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={!entityId || !email.trim() || addMutation.isPending}
          >
            <UserPlus className="h-4 w-4 mr-1" /> Grant access
          </Button>
        </div>

        <div className="border rounded-md divide-y">
          {!entityId && (
            <div className="p-4 text-sm text-muted-foreground">
              Select a {kind} to view or manage access.
            </div>
          )}
          {entityId && mappings.isLoading && (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          )}
          {entityId && !mappings.isLoading && (mappings.data ?? []).length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">
              No users linked yet. Grant access above.
            </div>
          )}
          {(mappings.data ?? []).map((row) => (
            <div key={row.id} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {row.profile?.full_name ?? row.profile?.email ?? row.user_id}
                </p>
                {row.profile?.email && (
                  <p className="text-xs text-muted-foreground truncate">{row.profile.email}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeMutation.mutate(row.id)}
                disabled={removeMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
