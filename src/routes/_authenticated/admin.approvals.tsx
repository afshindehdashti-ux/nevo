import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listApprovalRequests,
  decideApprovalRequest,
  getApprovalThresholds,
  APPROVAL_ENTITY_TYPES,
  APPROVAL_STATUSES,
  type ApprovalEntityType,
  type ApprovalStatus,
} from "@/lib/approvals.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useMyRoles } from "@/lib/crm-hooks";

export const Route = createFileRoute("/_authenticated/admin/approvals")({
  head: () => ({ meta: [{ title: "Approvals · NEVO CRM" }] }),
  component: ApprovalsPage,
});

const ENTITY_LABEL: Record<ApprovalEntityType, string> = {
  proforma: "Proforma",
  invoice: "Invoice",
  commission_invoice: "Commission invoice",
  document: "Sensitive document",
  quotation_discount: "Quotation discount",
};

function entityLink(type: ApprovalEntityType, id: string): string {
  switch (type) {
    case "proforma":
    case "invoice":
      return `/admin/invoices/${id}`;
    case "commission_invoice":
      return `/admin/commission-invoices`;
    case "document":
      return `/admin/document-intelligence`;
    case "quotation_discount":
      return `/admin/quotations/${id}`;
  }
}

function ApprovalsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listApprovalRequests);
  const decideFn = useServerFn(decideApprovalRequest);
  const thresholdsFn = useServerFn(getApprovalThresholds);
  const { data: roles = [] } = useMyRoles();
  const canDecide =
    roles.includes("super_admin") || roles.includes("management") || roles.includes("finance");

  const [status, setStatus] = useState<ApprovalStatus | "all">("pending");
  const [entityType, setEntityType] = useState<ApprovalEntityType | "all">("all");

  const filters = {
    status: status === "all" ? null : status,
    entity_type: entityType === "all" ? null : entityType,
  };
  const queryKey = ["approvals", "center", filters];
  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => listFn({ data: filters }),
  });
  const { data: thresholds } = useQuery({
    queryKey: ["approvals", "thresholds"],
    queryFn: () => thresholdsFn(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["approvals"] });

  const [decision, setDecision] = useState<null | {
    id: string;
    kind: "approved" | "rejected";
    label: string;
  }>(null);
  const [notes, setNotes] = useState("");
  const decide = useMutation({
    mutationFn: (v: { id: string; decision: "approved" | "rejected"; notes: string }) =>
      decideFn({ data: { id: v.id, decision: v.decision, notes: v.notes || null } }),
    onSuccess: (_r, v) => {
      toast.success(v.decision === "approved" ? "Approved" : "Rejected");
      invalidate();
      setDecision(null);
      setNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" /> Approvals
          </h1>
          <p className="text-sm text-muted-foreground">
            Proformas, invoices, commissions, sensitive documents and large discounts queued for
            management/finance sign-off. Every decision is written to the activity log.
          </p>
        </div>
        {thresholds && (
          <Card className="p-3 text-xs space-y-0.5">
            <div className="font-medium">Auto-suggest thresholds</div>
            <div>Invoices &gt; {thresholds.invoice.toLocaleString()}</div>
            <div>Commissions &gt; {thresholds.commission.toLocaleString()}</div>
            <div>Discounts &gt; {thresholds.discount_pct}%</div>
          </Card>
        )}
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {APPROVAL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={entityType} onValueChange={(v) => setEntityType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {APPROVAL_ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ENTITY_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-0 divide-y divide-border">
        {isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && rows.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground italic">
            No approval requests match these filters.
          </div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{ENTITY_LABEL[r.entity_type]}</Badge>
              <Badge
                variant={
                  r.status === "pending"
                    ? "secondary"
                    : r.status === "approved"
                      ? "default"
                      : r.status === "rejected"
                        ? "destructive"
                        : "outline"
                }
              >
                {r.status}
              </Badge>
              <Link
                to={entityLink(r.entity_type, r.entity_id)}
                className="text-sm font-medium hover:underline"
              >
                {r.entity_label ?? r.entity_id.slice(0, 8)}
              </Link>
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(r.requested_at), { addSuffix: true })} ·{" "}
                {format(new Date(r.requested_at), "PPp")}
              </span>
            </div>
            {r.reason && (
              <div className="text-sm">
                <span className="font-medium">Reason:</span>{" "}
                <span className="text-muted-foreground">{r.reason}</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Requested by {r.requested_by_name || "—"}
              {r.decided_at && (
                <>
                  {" · "}
                  {r.status} by {r.decided_by_name || "—"} on{" "}
                  {format(new Date(r.decided_at), "PPp")}
                  {r.decision_notes ? ` — ${r.decision_notes}` : ""}
                </>
              )}
            </div>
            {r.status === "pending" && canDecide && (
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() =>
                    setDecision({
                      id: r.id,
                      kind: "approved",
                      label: r.entity_label ?? "",
                    })
                  }
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    setDecision({
                      id: r.id,
                      kind: "rejected",
                      label: r.entity_label ?? "",
                    })
                  }
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </Card>

      <Dialog open={decision !== null} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.kind === "approved" ? "Approve request" : "Reject request"}
              {decision?.label ? ` — ${decision.label}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Decision notes (optional)</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              variant={decision?.kind === "rejected" ? "destructive" : "default"}
              disabled={!decision || decide.isPending}
              onClick={() =>
                decision &&
                decide.mutate({
                  id: decision.id,
                  decision: decision.kind,
                  notes,
                })
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
