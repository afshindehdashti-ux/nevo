import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listTasks, upsertTask, setTaskStatus } from "@/lib/tasks.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, CircleCheck, PauseCircle } from "lucide-react";

const STATUSES = ["open", "in_progress", "waiting", "done"] as const;
type Status = (typeof STATUSES)[number];

const priorityColor: Record<string, string> = {
  low: "outline",
  normal: "secondary",
  high: "default",
  urgent: "destructive",
};

export const Route = createFileRoute("/_authenticated/admin/tasks")({
  head: () => ({ meta: [{ title: "Tasks — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: TasksPage,
});

function TasksPage() {
  const listFn = useServerFn(listTasks);
  const upsertFn = useServerFn(upsertTask);
  const statusFn = useServerFn(setTaskStatus);
  const qc = useQueryClient();

  const { data: rows = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => listFn({ data: {} }),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
    due_date: "",
  });

  const create = useMutation({
    mutationFn: () =>
      upsertFn({
        data: {
          title: form.title,
          description: form.description || null,
          priority: form.priority,
          due_date: form.due_date || null,
          status: "open",
          approval_required: false,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setOpen(false);
      setForm({ title: "", description: "", priority: "normal", due_date: "" });
    },
  });

  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      statusFn({ data: { id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const grouped = STATUSES.reduce<Record<Status, typeof rows>>(
    (acc, s) => {
      acc[s] = rows.filter((r) => r.status === s);
      return acc;
    },
    { open: [], in_progress: [], waiting: [], done: [] },
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Assign, prioritise, and track work across the NEVO team.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              New task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create task</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <Textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v as typeof form.priority }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => create.mutate()}
                disabled={!form.title.trim() || create.isPending}
              >
                {create.isPending ? "Creating…" : "Create task"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {STATUSES.map((status) => (
          <div key={status} className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              {status === "open" && <Clock className="h-3.5 w-3.5" />}
              {status === "in_progress" && <Clock className="h-3.5 w-3.5 text-blue-500" />}
              {status === "waiting" && <PauseCircle className="h-3.5 w-3.5" />}
              {status === "done" && <CircleCheck className="h-3.5 w-3.5 text-green-600" />}
              {status.replace("_", " ")}
              <Badge variant="outline">{grouped[status].length}</Badge>
            </div>
            <div className="space-y-2">
              {grouped[status].map((t) => (
                <Card key={t.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium">{t.title}</div>
                    <Badge
                      variant={
                        (priorityColor[t.priority] ?? "outline") as
                          | "default"
                          | "secondary"
                          | "destructive"
                          | "outline"
                      }
                    >
                      {t.priority}
                    </Badge>
                  </div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                  )}
                  {t.due_date && (
                    <div className="text-[10px] text-muted-foreground">Due {t.due_date}</div>
                  )}
                  <div className="flex gap-1 flex-wrap">
                    {STATUSES.filter((s) => s !== t.status).map((s) => (
                      <button
                        key={s}
                        onClick={() => move.mutate({ id: t.id, status: s })}
                        className="text-[10px] text-muted-foreground hover:text-foreground border border-border rounded px-1.5 py-0.5"
                      >
                        → {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
              {grouped[status].length === 0 && (
                <div className="text-xs text-muted-foreground italic px-2 py-4">
                  No tasks.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
