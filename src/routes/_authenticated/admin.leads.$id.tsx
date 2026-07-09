import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, UserPlus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { convertLeadToCustomer } from "@/lib/leads.functions";
import { logCrmAction } from "@/lib/audit-log.functions";
import { formatDate } from "@/lib/crm-money";
import { LEAD_STATUSES } from "./admin.leads";

export const Route = createFileRoute("/_authenticated/admin/leads/$id")({
  head: () => ({
    meta: [{ title: "Lead — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: LeadDetail,
});

function LeadDetail() {
  const { id } = useParams({ from: "/_authenticated/admin/leads/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const convertFn = useServerFn(convertLeadToCustomer);
  const logAudit = useServerFn(logCrmAction);

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_inquiries")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["leads-staff"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name")
        .eq("is_active", true)
        .order("full_name");
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const [form, setForm] = useState({
    status: "new",
    priority: "normal",
    assigned_to: "none",
    internal_score: "",
    next_action_date: "",
    project_type: "",
    budget_range: "",
    timeline: "",
    internal_notes: "",
  });

  useEffect(() => {
    if (!lead) return;
    setForm({
      status: lead.status ?? "new",
      priority: lead.priority ?? "normal",
      assigned_to: lead.assigned_to ?? "none",
      internal_score: lead.internal_score?.toString() ?? "",
      next_action_date: lead.next_action_date ?? "",
      project_type: lead.project_type ?? "",
      budget_range: lead.budget_range ?? "",
      timeline: lead.timeline ?? "",
      internal_notes: lead.internal_notes ?? "",
    });
  }, [lead]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const patch = {
        status: form.status,
        priority: form.priority,
        assigned_to: form.assigned_to === "none" ? null : form.assigned_to,
        internal_score: form.internal_score ? Number(form.internal_score) : null,
        next_action_date: form.next_action_date || null,
        project_type: form.project_type || null,
        budget_range: form.budget_range || null,
        timeline: form.timeline || null,
        internal_notes: form.internal_notes || null,
      };
      const { error } = await supabase.from("project_inquiries").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead updated");
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const convertMutation = useMutation({
    mutationFn: async (create_project: boolean) => {
      return await convertFn({
        data: {
          inquiry_id: id,
          create_project,
          project_type: form.project_type || null,
        },
      });
    },
    onSuccess: (res) => {
      toast.success("Lead converted");
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      if (res.customer_id) {
        navigate({ to: "/admin/customers/$id", params: { id: res.customer_id } });
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Conversion failed"),
  });

  if (isLoading) {
    return (
      <div className="p-6 text-muted-foreground">
        <Loader2 className="inline h-4 w-4 mr-2 animate-spin" /> Loading lead…
      </div>
    );
  }
  if (!lead) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-muted-foreground">Lead not found.</p>
        <Button asChild variant="outline">
          <Link to="/admin/leads">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
      </div>
    );
  }

  const isConverted = !!lead.converted_customer_id;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/admin/leads">
            <ArrowLeft className="h-4 w-4 mr-1" /> All leads
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Lead</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              {lead.company || lead.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {lead.name} · {lead.email}
              {lead.country ? ` · ${lead.country}` : ""}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">Received {formatDate(lead.created_at)}</Badge>
            {isConverted && (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                Converted
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inquiry details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Info label="Full name" value={lead.name} />
              <Info label="Email" value={lead.email} />
              <Info label="Phone" value={lead.phone} />
              <Info label="Company" value={lead.company} />
              <Info label="Country" value={lead.country} />
              <Info label="Application / interest" value={lead.application} />
              <Info label="Source page" value={lead.source_page} full />
              <Info label="Message" value={lead.message} full multiline />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Qualification & internal notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Project type">
                  <Input
                    value={form.project_type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, project_type: e.target.value }))
                    }
                    placeholder="e.g. Sandwich panel line"
                    maxLength={100}
                  />
                </Field>
                <Field label="Budget range">
                  <Input
                    value={form.budget_range}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, budget_range: e.target.value }))
                    }
                    placeholder="e.g. $500k–$1M"
                    maxLength={80}
                  />
                </Field>
                <Field label="Timeline">
                  <Input
                    value={form.timeline}
                    onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                    placeholder="e.g. Q3 2026"
                    maxLength={80}
                  />
                </Field>
              </div>
              <Field label="Internal notes (not visible to customer)">
                <Textarea
                  value={form.internal_notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, internal_notes: e.target.value }))
                  }
                  rows={5}
                  maxLength={5000}
                  placeholder="Add discovery notes, competitor info, requirements…"
                />
              </Field>
              <div className="flex justify-end">
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  )}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Status">
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Priority">
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Assigned to">
                <Select
                  value={form.assigned_to}
                  onValueChange={(v) => setForm((f) => ({ ...f, assigned_to: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Unassigned —</SelectItem>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Lead score (0–100)">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.internal_score}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, internal_score: e.target.value }))
                  }
                />
              </Field>
              <Field label="Next action date">
                <Input
                  type="date"
                  value={form.next_action_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, next_action_date: e.target.value }))
                  }
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Convert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isConverted ? (
                <>
                  <p className="text-muted-foreground">This lead is already converted.</p>
                  {lead.converted_customer_id && (
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link
                        to="/admin/customers/$id"
                        params={{ id: lead.converted_customer_id }}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" /> Open customer
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    Create a customer record (and optionally a project) from this inquiry.
                  </p>
                  <Button
                    onClick={() => convertMutation.mutate(true)}
                    disabled={convertMutation.isPending}
                    className="w-full"
                  >
                    {convertMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-1" />
                    )}
                    Convert to customer + project
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => convertMutation.mutate(false)}
                    disabled={convertMutation.isPending}
                    className="w-full"
                  >
                    Convert to customer only
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Info({
  label,
  value,
  full,
  multiline,
}: {
  label: string;
  value: string | null | undefined;
  full?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-0.5 ${multiline ? "whitespace-pre-wrap" : ""}`}>{value || "—"}</p>
    </div>
  );
}
