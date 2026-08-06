import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  submitApprovalRequest,
  decideApprovalRequest,
  listApprovalRequests,
  type ApprovalEntityType,
} from "@/lib/approvals.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useMyRoles } from "@/lib/crm-hooks";

export type EntityDetails = Record<string, string | number | boolean | null>;

/**
 * Compact "approval status" chip + inline submit/approve/reject controls
 * you can drop next to any proforma / invoice / commission / document /
 * quotation-discount edit page.
 */
export function ApprovalPanel({
  entityType,
  entityId,
  suggestedReason,
  details,
}: {
  entityType: ApprovalEntityType;
  entityId: string;
  suggestedReason?: string;
  details?: EntityDetails;
}) {
  const qc = useQueryClient();
  const listFn = useServerFn(listApprovalRequests);
  const submitFn = useServerFn(submitApprovalRequest);
  const decideFn = useServerFn(decideApprovalRequest);
  const { data: roles = [] } = useMyRoles();
  const canDecide =
    roles.includes("super_admin") || roles.includes("management") || roles.includes("finance");

  const queryKey = ["approvals", "for-entity", entityType, entityId];
  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => listFn({ data: { entity_type: entityType, entity_id: entityId } }),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["approvals"] });

  const submit = useMutation({
    mutationFn: (reason: string) =>
      submitFn({
        data: {
          entity_type: entityType,
          entity_id: entityId,
          reason,
          details: details ?? {},
        },
      }),
    onSuccess: (r) => {
      toast.success(r.deduped ? "Approval already pending" : "Approval requested");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: (v: { id: string; decision: "approved" | "rejected"; notes: string }) =>
      decideFn({ data: { id: v.id, decision: v.decision, notes: v.notes || null } }),
    onSuccess: (_r, v) => {
      toast.success(v.decision === "approved" ? "Approved" : "Rejected");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = rows.find((r) => r.status === "pending");
  const lastDecided = rows.find((r) => r.status !== "pending");

  const [submitOpen, setSubmitOpen] = useState(false);
  const [reason, setReason] = useState(suggestedReason ?? "");
  const [decisionOpen, setDecisionOpen] = useState<null | "approved" | "rejected">(null);
  const [notes, setNotes] = useState("");

  return (
    <div className="rounded border border-border bg-muted/30 p-3 text-sm">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-primary" />
        <span className="font-medium">Approval</span>
        {isLoading ? (
          <span className="text-xs text-muted-foreground">Loading…</span>
        ) : pending ? (
          <Badge variant="secondary">Pending review</Badge>
        ) : lastDecided ? (
          <Badge variant={lastDecided.status === "approved" ? "default" : "destructive"}>
            {lastDecided.status}
          </Badge>
        ) : (
          <Badge variant="outline">Not requested</Badge>
        )}
        <div className="ml-auto flex gap-1">
          {!pending && (
            <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Request approval
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request approval</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why this needs approval (e.g. 25% discount above threshold, sensitive document…)"
                  />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setSubmitOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    disabled={!reason.trim() || submit.isPending}
                    onClick={() =>
                      submit.mutate(reason.trim(), {
                        onSuccess: () => setSubmitOpen(false),
                      })
                    }
                  >
                    {submit.isPending ? "Sending…" : "Submit"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {pending && canDecide && (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setDecisionOpen("approved");
                  setNotes("");
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setDecisionOpen("rejected");
                  setNotes("");
                }}
              >
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {pending && (
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Reason:</span> {pending.reason}
          {pending.requested_by_name && <> · requested by {pending.requested_by_name}</>}
        </div>
      )}
      {lastDecided && !pending && (
        <div className="mt-2 text-xs text-muted-foreground">
          {lastDecided.status === "approved" ? "Approved" : "Rejected"}
          {lastDecided.decided_by_name && <> by {lastDecided.decided_by_name}</>}
          {lastDecided.decision_notes && <> — {lastDecided.decision_notes}</>}
        </div>
      )}

      <Dialog open={decisionOpen !== null} onOpenChange={(o) => !o && setDecisionOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionOpen === "approved" ? "Approve request" : "Reject request"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Decision notes (optional)</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDecisionOpen(null)}>
              Cancel
            </Button>
            <Button
              variant={decisionOpen === "rejected" ? "destructive" : "default"}
              disabled={!pending || decide.isPending}
              onClick={() =>
                pending &&
                decide.mutate(
                  { id: pending.id, decision: decisionOpen!, notes },
                  { onSuccess: () => setDecisionOpen(null) },
                )
              }
            >
              {decide.isPending ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
