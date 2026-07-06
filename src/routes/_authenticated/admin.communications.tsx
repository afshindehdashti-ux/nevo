import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listCommunicationsCenter,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  getCommAttachmentUrl,
  listCommsCustomersLite,
  listCommsLeadsLite,
  listCommsProjectsLite,
  type CommAttachment,
  type CommunicationRow,
} from "@/lib/communications.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  MessageCircle,
  Paperclip,
  Trash2,
  CalendarClock,
  Check,
  Plus,
  Download,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/communications")({
  head: () => ({ meta: [{ title: "Communications · NEVO CRM" }] }),
  component: CommunicationsCenter,
});

type Kind = "note" | "email" | "call" | "meeting" | "whatsapp" | "file";
type Direction = "inbound" | "outbound" | "internal";
type EntityType = "customer" | "lead" | "project";

const KIND_META: Record<Kind, { label: string; Icon: typeof Mail }> = {
  note: { label: "Note", Icon: MessageSquare },
  email: { label: "Email", Icon: Mail },
  call: { label: "Call", Icon: Phone },
  meeting: { label: "Meeting", Icon: Calendar },
  whatsapp: { label: "WhatsApp", Icon: MessageCircle },
  file: { label: "File", Icon: Paperclip },
};

function CommunicationsCenter() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCommunicationsCenter);
  const custFn = useServerFn(listCommsCustomersLite);
  const leadFn = useServerFn(listCommsLeadsLite);
  const projFn = useServerFn(listCommsProjectsLite);
  const delFn = useServerFn(deleteCommunication);
  const updFn = useServerFn(updateCommunication);
  const urlFn = useServerFn(getCommAttachmentUrl);

  const [filterEntityType, setFilterEntityType] = useState<EntityType | "all">("all");
  const [filterEntityId, setFilterEntityId] = useState<string>("all");
  const [filterKind, setFilterKind] = useState<Kind | "all">("all");
  const [filterDirection, setFilterDirection] = useState<Direction | "all">("all");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");
  const [onlyFollowUps, setOnlyFollowUps] = useState(false);
  const [search, setSearch] = useState("");

  const { data: customers = [] } = useQuery({
    queryKey: ["comms", "lite", "customers"],
    queryFn: () => custFn(),
  });
  const { data: leads = [] } = useQuery({
    queryKey: ["comms", "lite", "leads"],
    queryFn: () => leadFn(),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["comms", "lite", "projects"],
    queryFn: () => projFn(),
  });

  const entityOptions = useMemo(() => {
    if (filterEntityType === "customer") return customers;
    if (filterEntityType === "lead") return leads;
    if (filterEntityType === "project") return projects;
    return [];
  }, [filterEntityType, customers, leads, projects]);

  const filters = {
    entity_type: filterEntityType === "all" ? null : filterEntityType,
    entity_id: filterEntityId === "all" ? null : filterEntityId,
    kind: filterKind === "all" ? null : filterKind,
    direction: filterDirection === "all" ? null : filterDirection,
    from: filterFrom ? new Date(filterFrom).toISOString() : null,
    to: filterTo ? new Date(filterTo + "T23:59:59").toISOString() : null,
    only_follow_ups: onlyFollowUps,
    q: search.trim() || null,
  } as const;

  const queryKey = ["comms", "center", filters];
  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => listFn({ data: filters }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["comms", "center"] });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: invalidate,
  });

  const markDone = useMutation({
    mutationFn: (id: string) =>
      updFn({ data: { id, follow_up_done: true } }),
    onSuccess: invalidate,
    onError: (e: any) =>
      toast.error("Could not mark done", { description: e?.message }),
  });

  const openAttachment = async (path: string) => {
    try {
      const { url } = await urlFn({ data: { path } });
      window.open(url, "_blank", "noopener");
    } catch (e: any) {
      toast.error("Attachment unavailable", { description: e?.message });
    }
  };

  const resetFilters = () => {
    setFilterEntityType("all");
    setFilterEntityId("all");
    setFilterKind("all");
    setFilterDirection("all");
    setFilterFrom("");
    setFilterTo("");
    setOnlyFollowUps(false);
    setSearch("");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Communications</h1>
          <p className="text-sm text-muted-foreground">
            Log emails, WhatsApp, calls and meetings across leads, customers and projects.
            Attach files and schedule the next follow-up.
          </p>
        </div>
        <NewCommunicationDialog
          customers={customers}
          leads={leads}
          projects={projects}
          onCreated={invalidate}
        />
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Related to</Label>
            <Select
              value={filterEntityType}
              onValueChange={(v) => {
                setFilterEntityType(v as any);
                setFilterEntityId("all");
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Specific</Label>
            <Select
              value={filterEntityId}
              onValueChange={setFilterEntityId}
              disabled={filterEntityType === "all"}
            >
              <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {entityOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={filterKind} onValueChange={(v) => setFilterKind(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(Object.keys(KIND_META) as Kind[]).map((k) => (
                  <SelectItem key={k} value={k}>{KIND_META[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Direction</Label>
            <Select
              value={filterDirection}
              onValueChange={(v) => setFilterDirection(v as any)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Search</Label>
            <Input
              placeholder="Subject, body, contact…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 justify-between flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyFollowUps}
              onChange={(e) => setOnlyFollowUps(e.target.checked)}
            />
            Only entries with a pending follow-up
          </label>
          <Button variant="ghost" size="sm" onClick={resetFilters}>Clear filters</Button>
        </div>
      </Card>

      <Card className="p-0 divide-y divide-border">
        {isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && rows.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground italic">
            No communications match these filters.
          </div>
        )}
        {rows.map((r) => (
          <CommRow
            key={r.id}
            row={r}
            onDelete={() => del.mutate(r.id)}
            onMarkDone={() => markDone.mutate(r.id)}
            onOpenAttachment={openAttachment}
          />
        ))}
      </Card>
    </div>
  );
}

function CommRow({
  row,
  onDelete,
  onMarkDone,
  onOpenAttachment,
}: {
  row: CommunicationRow;
  onDelete: () => void;
  onMarkDone: () => void;
  onOpenAttachment: (path: string) => void;
}) {
  const meta = KIND_META[(row.kind as Kind) in KIND_META ? (row.kind as Kind) : "note"];
  const Icon = meta.Icon;
  const followOverdue =
    row.follow_up_at && !row.follow_up_done && new Date(row.follow_up_at) < new Date();
  return (
    <div className="flex gap-4 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="uppercase font-semibold">{meta.label}</span>
          <Badge variant="secondary" className="text-[10px]">{row.direction}</Badge>
          {row.entity_label && (
            <Badge variant="outline" className="text-[10px]">
              {row.entity_type}: {row.entity_label}
            </Badge>
          )}
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(row.occurred_at), { addSuffix: true })} ·{" "}
            {format(new Date(row.occurred_at), "PPp")}
          </span>
          {row.contact_name && (
            <span className="text-muted-foreground">· {row.contact_name}</span>
          )}
        </div>
        {row.subject && <div className="text-sm font-medium">{row.subject}</div>}
        {row.body && (
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {row.body}
          </div>
        )}
        {row.attachments && row.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {row.attachments.map((a) => (
              <button
                key={a.path}
                type="button"
                onClick={() => onOpenAttachment(a.path)}
                className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs hover:bg-muted"
              >
                <Download className="h-3 w-3" />
                {a.name}
              </button>
            ))}
          </div>
        )}
        {row.follow_up_at && (
          <div
            className={`flex items-center gap-2 text-xs mt-1 ${
              row.follow_up_done
                ? "text-muted-foreground line-through"
                : followOverdue
                ? "text-destructive"
                : "text-amber-600"
            }`}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Follow-up {format(new Date(row.follow_up_at), "PPp")}
            {!row.follow_up_done && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2"
                onClick={onMarkDone}
              >
                <Check className="h-3 w-3 mr-1" /> Done
              </Button>
            )}
          </div>
        )}
      </div>
      <button
        onClick={onDelete}
        className="text-muted-foreground/40 hover:text-destructive self-start"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ---------------- New entry dialog ---------------- */

function NewCommunicationDialog({
  customers,
  leads,
  projects,
  onCreated,
}: {
  customers: { id: string; label: string }[];
  leads: { id: string; label: string }[];
  projects: { id: string; label: string }[];
  onCreated: () => void;
}) {
  const createFn = useServerFn(createCommunication);
  const [open, setOpen] = useState(false);
  const [entityType, setEntityType] = useState<EntityType>("customer");
  const [entityId, setEntityId] = useState<string>("");
  const [kind, setKind] = useState<Kind>("note");
  const [direction, setDirection] = useState<Direction>("outbound");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [occurredAt, setOccurredAt] = useState<string>(
    format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  );
  const [followUp, setFollowUp] = useState<string>("");
  const [attachments, setAttachments] = useState<CommAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const opts =
    entityType === "customer" ? customers : entityType === "lead" ? leads : projects;

  const reset = () => {
    setEntityType("customer");
    setEntityId("");
    setKind("note");
    setDirection("outbound");
    setSubject("");
    setBody("");
    setContactName("");
    setContactEmail("");
    setOccurredAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setFollowUp("");
    setAttachments([]);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: CommAttachment[] = [];
      for (const file of Array.from(files)) {
        const stamp = Date.now();
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `communications/${new Date().getFullYear()}/${stamp}-${safe}`;
        const { error } = await supabase.storage
          .from("crm-docs")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (error) throw error;
        uploaded.push({ name: file.name, path, size: file.size, mime: file.type });
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (e: any) {
      toast.error("Upload failed", { description: e?.message });
    } finally {
      setUploading(false);
    }
  };

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          entity_type: entityType,
          entity_id: entityId,
          kind,
          direction,
          subject: subject || null,
          body,
          contact_name: contactName || null,
          contact_email: contactEmail || null,
          occurred_at: new Date(occurredAt).toISOString(),
          follow_up_at: followUp ? new Date(followUp).toISOString() : null,
          attachments,
        },
      }),
    onSuccess: () => {
      toast.success("Communication logged");
      onCreated();
      setOpen(false);
      reset();
    },
    onError: (e: any) =>
      toast.error("Could not save", { description: e?.message }),
  });

  const canSave = entityId && body.trim().length > 0 && !create.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New entry</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log a communication</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Related to</Label>
            <Select value={entityType} onValueChange={(v) => { setEntityType(v as EntityType); setEntityId(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Record</Label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {opts.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_META) as Kind[]).map((k) => (
                  <SelectItem key={k} value={k}>{KIND_META[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Direction</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as Direction)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal note</SelectItem>
                <SelectItem value="inbound">Inbound (from contact)</SelectItem>
                <SelectItem value="outbound">Outbound (to contact)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Contact name</Label>
            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Contact email</Label>
            <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Occurred at</Label>
            <Input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Next follow-up (optional)</Label>
            <Input type="datetime-local" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Details</Label>
            <Textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Summary of the call, contents of the email, agenda of the meeting…"
            />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Attachments</Label>
            <Input
              type="file"
              multiple
              disabled={uploading}
              onChange={(e) => handleUpload(e.target.files)}
            />
            {uploading && <div className="text-xs text-muted-foreground">Uploading…</div>}
            {attachments.length > 0 && (
              <ul className="text-xs mt-1 space-y-0.5">
                {attachments.map((a) => (
                  <li key={a.path} className="flex items-center justify-between">
                    <span className="truncate">{a.name}</span>
                    <button
                      className="text-muted-foreground hover:text-destructive ml-2"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((x) => x.path !== a.path))
                      }
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!canSave} onClick={() => create.mutate()}>
            {create.isPending ? "Saving…" : "Save entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
