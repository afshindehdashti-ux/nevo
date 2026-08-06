import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listCommunications,
  createCommunication,
  deleteCommunication,
} from "@/lib/communications.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  FileText,
  MessageCircle,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type EntityType =
  "customer" | "lead" | "order" | "invoice" | "quotation" | "project" | "partner" | "shipment";

const kindIcon = {
  note: MessageSquare,
  email: Mail,
  call: Phone,
  meeting: Calendar,
  whatsapp: MessageCircle,
  file: FileText,
} as const;

export function CommunicationTimeline({
  entityType,
  entityId,
}: {
  entityType: EntityType;
  entityId: string;
}) {
  const qc = useQueryClient();
  const listFn = useServerFn(listCommunications);
  const createFn = useServerFn(createCommunication);
  const deleteFn = useServerFn(deleteCommunication);
  const queryKey = ["comms", entityType, entityId];

  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => listFn({ data: { entity_type: entityType, entity_id: entityId } }),
  });

  const create = useMutation({
    mutationFn: (payload: {
      kind: "note" | "email" | "call" | "meeting" | "whatsapp" | "file";
      direction: "inbound" | "outbound" | "internal";
      subject: string;
      body: string;
    }) =>
      createFn({
        data: {
          entity_type: entityType,
          entity_id: entityId,
          kind: payload.kind,
          direction: payload.direction,
          subject: payload.subject || null,
          body: payload.body,
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const [kind, setKind] = useState<"note" | "email" | "call" | "meeting" | "whatsapp" | "file">(
    "note",
  );
  const [direction, setDirection] = useState<"inbound" | "outbound" | "internal">("internal");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Communication timeline</h3>
        <Badge variant="outline">{rows.length}</Badge>
      </div>

      <div className="space-y-2 rounded border border-border p-3 bg-muted/30">
        <div className="grid grid-cols-2 gap-2">
          <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="note">Note</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="file">File ref</SelectItem>
            </SelectContent>
          </Select>
          <Select value={direction} onValueChange={(v) => setDirection(v as typeof direction)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">Internal note</SelectItem>
              <SelectItem value="inbound">Inbound (from contact)</SelectItem>
              <SelectItem value="outbound">Outbound (to contact)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Subject (optional)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <Textarea
          placeholder="Log a note, summary of a call, or the content of an email…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!body.trim() || create.isPending}
            onClick={() =>
              create.mutate(
                { kind, direction, subject, body },
                {
                  onSuccess: () => {
                    setBody("");
                    setSubject("");
                  },
                },
              )
            }
          >
            {create.isPending ? "Saving…" : "Log entry"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && <div className="text-xs text-muted-foreground">Loading…</div>}
        {!isLoading && rows.length === 0 && (
          <div className="text-xs text-muted-foreground italic">No communications logged yet.</div>
        )}
        {rows.map((r) => {
          const Icon = kindIcon[r.kind as keyof typeof kindIcon] ?? MessageSquare;
          return (
            <div key={r.id} className="flex gap-3 border-b border-border pb-3 last:border-0">
              <div className="mt-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium uppercase">{r.kind}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {r.direction}
                  </Badge>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(r.occurred_at), { addSuffix: true })}
                  </span>
                </div>
                {r.subject && <div className="mt-1 text-sm font-medium">{r.subject}</div>}
                <div className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
                  {r.body}
                </div>
              </div>
              <button
                onClick={() => del.mutate(r.id)}
                className="text-muted-foreground/50 hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
