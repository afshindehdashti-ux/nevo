import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { listDocAccess, grantDocAccess, revokeDocAccess } from "@/lib/doc-access.functions";

export const Route = createFileRoute("/_authenticated/admin/document-access")({
  head: () => ({
    meta: [{ title: "Document Access — NEVO Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: DocumentAccessPage,
});

function DocumentAccessPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Document Portal Access</h1>
        <p className="text-sm text-muted-foreground">
          Link signed-in user accounts to a customer or partner so they can access approved
          documents routed to that portal.
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

function useParents(kind: Kind) {
  return useQuery({
    queryKey: ["doc-access-parents", kind],
    queryFn: async () => {
      if (kind === "customer") {
        const { data, error } = await supabase
          .from("customers")
          .select("id, name")
          .order("name")
          .limit(500);
        if (error) throw error;
        return (data ?? []).map((c) => ({ id: c.id, name: c.name }));
      }
      const { data, error } = await supabase
        .from("partners")
        .select("id, company_name")
        .order("company_name")
        .limit(500);
      if (error) throw error;
      return (data ?? []).map((p) => ({ id: p.id, name: p.company_name }));
    },
  });
}

function MappingManager({ kind }: { kind: Kind }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listDocAccess);
  const grantFn = useServerFn(grantDocAccess);
  const revokeFn = useServerFn(revokeDocAccess);

  const [entityId, setEntityId] = useState<string>("");
  const [email, setEmail] = useState("");

  const parents = useParents(kind);

  const mappings = useQuery({
    queryKey: ["doc-access", kind, entityId],
    enabled: !!entityId,
    queryFn: () => listFn({ data: { kind, entityId } }),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!entityId) throw new Error(`Choose a ${kind} first`);
      const clean = email.trim().toLowerCase();
      if (!clean) throw new Error("Enter user email");
      await grantFn({ data: { kind, entityId, email: clean } });
    },
    onSuccess: () => {
      toast.success("Access granted");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["doc-access", kind, entityId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      await revokeFn({ data: { kind, mappingId: id } });
    },
    onSuccess: () => {
      toast.success("Access revoked");
      qc.invalidateQueries({ queryKey: ["doc-access", kind, entityId] });
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
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
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
                  {row.full_name ?? row.email ?? row.user_id}
                </p>
                {row.email && <p className="text-xs text-muted-foreground truncate">{row.email}</p>}
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
