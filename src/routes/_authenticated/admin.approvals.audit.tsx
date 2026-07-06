import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listApprovalAudit, type ApprovalAuditEntry } from "@/lib/approvals-audit.functions";
import { APPROVAL_ENTITY_TYPES, type ApprovalEntityType } from "@/lib/approvals.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, ShieldAlert, Clock, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/approvals/audit")({
  head: () => ({ meta: [{ title: "Approvals audit trail · NEVO CRM" }] }),
  component: ApprovalsAuditPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Failed to load audit trail: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm">Not found</div>,
});

const ENTITY_LABEL: Record<ApprovalEntityType, string> = {
  proforma: "Proforma",
  invoice: "Invoice",
  commission_invoice: "Commission invoice",
  document: "Sensitive document",
  quotation_discount: "Quotation discount",
};

const ACTION_META: Record<
  string,
  { label: string; icon: typeof CheckCircle2; className: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }
> = {
  approve: { label: "Approved", icon: CheckCircle2, className: "text-emerald-600", badgeVariant: "default" },
  reject: { label: "Rejected", icon: XCircle, className: "text-destructive", badgeVariant: "destructive" },
  cancel: { label: "Cancelled", icon: ShieldAlert, className: "text-muted-foreground", badgeVariant: "outline" },
};

function ApprovalsAuditPage() {
  const listFn = useServerFn(listApprovalAudit);
  const [entityType, setEntityType] = useState<ApprovalEntityType | "all">("all");
  const [action, setAction] = useState<"all" | "approve" | "reject" | "cancel">("all");
  const [entityId, setEntityId] = useState("");
  const [entityIdSearch, setEntityIdSearch] = useState("");

  const q = useQuery({
    queryKey: ["approvals-audit", entityType, action, entityIdSearch],
    queryFn: () =>
      listFn({
        data: {
          entity_type: entityType === "all" ? null : entityType,
          action: action === "all" ? null : action,
          entity_id: entityIdSearch || null,
          limit: 300,
        },
      }),
  });

  const rows = q.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/approvals">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Approvals
              </Link>
            </Button>
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Approvals audit trail</h1>
          <p className="text-sm text-muted-foreground">
            Every status change with decider, reason, notes, and affected fields.
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Entity</label>
            <Select value={entityType} onValueChange={(v) => setEntityType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                {APPROVAL_ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{ENTITY_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Decision</label>
            <Select value={action} onValueChange={(v) => setAction(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All decisions</SelectItem>
                <SelectItem value="approve">Approved</SelectItem>
                <SelectItem value="reject">Rejected</SelectItem>
                <SelectItem value="cancel">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Entity ID (UUID)</label>
            <div className="flex gap-2">
              <Input
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="Paste an entity UUID to filter"
              />
              <Button
                variant="secondary"
                onClick={() => setEntityIdSearch(entityId.trim())}
                disabled={entityId.length > 0 && entityId.length < 32}
              >
                Filter
              </Button>
              {entityIdSearch && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEntityId("");
                    setEntityIdSearch("");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        {q.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading audit trail…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No audit events match your filters.</div>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <AuditRow key={r.id} row={r} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function AuditRow({ row }: { row: ApprovalAuditEntry }) {
  const meta = ACTION_META[row.action] ?? {
    label: row.action,
    icon: Clock,
    className: "text-muted-foreground",
    badgeVariant: "secondary" as const,
  };
  const Icon = meta.icon;
  const entityLabel = ENTITY_LABEL[row.entity_type as ApprovalEntityType] ?? row.entity_type;

  return (
    <li className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${meta.className}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
              <span className="text-sm font-medium">{entityLabel}</span>
              {row.entity_label && (
                <span className="text-sm text-muted-foreground">· {row.entity_label}</span>
              )}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {row.previous_status ?? "pending"} → {row.new_status ?? "—"}
              {row.actor_name ? ` · by ${row.actor_name}` : row.actor_id ? " · by system user" : ""}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground font-mono">{row.entity_id}</div>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {format(new Date(row.timestamp), "PPpp")}
        </div>
      </div>

      {(row.reason || row.notes || row.affected_fields) && (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {row.reason && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Reason</div>
              <div className="text-sm whitespace-pre-wrap">{row.reason}</div>
            </div>
          )}
          {row.notes && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Decision notes</div>
              <div className="text-sm whitespace-pre-wrap">{row.notes}</div>
            </div>
          )}
          {row.affected_fields && Object.keys(row.affected_fields).length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Affected fields</div>
              <dl className="mt-1 grid gap-x-3 gap-y-0.5 text-xs [grid-template-columns:auto_1fr]">
                {Object.entries(row.affected_fields).map(([k, v]) => (
                  <>
                    <dt key={`k-${k}`} className="text-muted-foreground">{k}</dt>
                    <dd key={`v-${k}`} className="font-mono break-all">{formatVal(v)}</dd>
                  </>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
