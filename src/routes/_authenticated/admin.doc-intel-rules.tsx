import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  listRoutingRules,
  upsertRoutingRule,
  deleteRoutingRule,
  toggleRoutingRule,
  type RuleUpsertInput,
} from "@/lib/doc-intel-rules.functions";
import {
  DOC_CATEGORIES,
  DESTINATIONS,
  CONFIDENTIALITY,
  VISIBILITY,
} from "@/lib/doc-intel.schema";

export const Route = createFileRoute("/_authenticated/admin/doc-intel-rules")({
  head: () => ({
    meta: [
      { title: "Routing Rules — NEVO Document Intelligence" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RoutingRulesPage,
});

type Rule = RuleUpsertInput & {
  id: string;
  created_at?: string;
  updated_at?: string;
};

const emptyDraft: RuleUpsertInput = {
  name: "",
  description: "",
  enabled: true,
  priority: 100,
  match_categories: [],
  match_doc_type_ilike: null,
  match_filename_ilike: null,
  match_keywords: [],
  match_confidentiality: [],
  match_visibility: [],
  action_require_approval: false,
  action_block_public: false,
  action_set_confidentiality: null,
  action_set_visibility: null,
  action_set_destination: null,
  action_set_folder_path: null,
  action_add_tags: [],
  action_min_confidence: null,
};

function RoutingRulesPage() {
  const qc = useQueryClient();
  const list = useServerFn(listRoutingRules);
  const upsert = useServerFn(upsertRoutingRule);
  const del = useServerFn(deleteRoutingRule);
  const toggle = useServerFn(toggleRoutingRule);

  const query = useQuery({
    queryKey: ["doc-intel-rules"],
    queryFn: () => list(),
  });

  const [openDraft, setOpenDraft] = useState<Rule | RuleUpsertInput | null>(null);

  const saveMut = useMutation({
    mutationFn: (input: RuleUpsertInput & { id?: string }) => upsert({ data: input }),
    onSuccess: () => {
      toast.success("Rule saved. It will apply to future uploads immediately.");
      setOpenDraft(null);
      qc.invalidateQueries({ queryKey: ["doc-intel-rules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Rule deleted.");
      qc.invalidateQueries({ queryKey: ["doc-intel-rules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleMut = useMutation({
    mutationFn: (v: { id: string; enabled: boolean }) => toggle({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-intel-rules"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const rules = (query.data ?? []) as Rule[];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Document routing rules</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Override AI classification and routing decisions. Rules apply immediately
            to every new upload after analysis. Lower priority numbers run first.
          </p>
        </div>
        <Button onClick={() => setOpenDraft({ ...emptyDraft })}>
          <Plus className="h-4 w-4 mr-2" /> New rule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active rules</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rules defined yet. Create one to override AI defaults.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Priority</TableHead>
                  <TableHead>Rule</TableHead>
                  <TableHead>Matches</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead className="w-24">Enabled</TableHead>
                  <TableHead className="w-24 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.priority}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      {r.description && (
                        <div className="text-xs text-muted-foreground">{r.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <MatchSummary rule={r} />
                    </TableCell>
                    <TableCell className="text-xs">
                      <ActionSummary rule={r} />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={r.enabled}
                        onCheckedChange={(v) => toggleMut.mutate({ id: r.id, enabled: v })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpenDraft(r)}
                        aria-label="Edit rule"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete rule "${r.name}"?`)) delMut.mutate(r.id);
                        }}
                        aria-label="Delete rule"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RuleEditor
        draft={openDraft}
        onClose={() => setOpenDraft(null)}
        onSave={(d) => saveMut.mutate(d)}
        saving={saveMut.isPending}
      />
    </div>
  );
}

function MatchSummary({ rule }: { rule: Rule }) {
  const parts: string[] = [];
  if (rule.match_categories.length) parts.push(`category ∈ {${rule.match_categories.join(", ")}}`);
  if (rule.match_doc_type_ilike) parts.push(`doc_type ~ ${rule.match_doc_type_ilike}`);
  if (rule.match_filename_ilike) parts.push(`filename ~ ${rule.match_filename_ilike}`);
  if (rule.match_keywords.length) parts.push(`keywords: ${rule.match_keywords.join(", ")}`);
  if (rule.match_confidentiality.length)
    parts.push(`confidentiality ∈ {${rule.match_confidentiality.join(", ")}}`);
  if (rule.match_visibility.length) parts.push(`visibility ∈ {${rule.match_visibility.join(", ")}}`);
  if (parts.length === 0) return <span className="text-muted-foreground">Any document</span>;
  return <span>{parts.join(" · ")}</span>;
}

function ActionSummary({ rule }: { rule: Rule }) {
  const chips: { label: string; tone?: "warn" | "info" }[] = [];
  if (rule.action_require_approval) chips.push({ label: "Require approval", tone: "warn" });
  if (rule.action_block_public) chips.push({ label: "Block public", tone: "warn" });
  if (rule.action_set_confidentiality)
    chips.push({ label: `Confidentiality → ${rule.action_set_confidentiality}` });
  if (rule.action_set_visibility) chips.push({ label: `Visibility → ${rule.action_set_visibility}` });
  if (rule.action_set_destination) chips.push({ label: `Destination → ${rule.action_set_destination}` });
  if (rule.action_set_folder_path) chips.push({ label: `Folder → ${rule.action_set_folder_path}` });
  if (rule.action_add_tags?.length) chips.push({ label: `+tags: ${rule.action_add_tags.join(", ")}` });
  if (rule.action_min_confidence != null)
    chips.push({ label: `Min confidence ${(rule.action_min_confidence * 100).toFixed(0)}%` });
  if (!chips.length) return <span className="text-muted-foreground">No actions</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((c, i) => (
        <Badge
          key={i}
          variant={c.tone === "warn" ? "destructive" : "secondary"}
          className="font-normal"
        >
          {c.tone === "warn" ? <ShieldAlert className="h-3 w-3 mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
          {c.label}
        </Badge>
      ))}
    </div>
  );
}

function RuleEditor({
  draft,
  onClose,
  onSave,
  saving,
}: {
  draft: Rule | RuleUpsertInput | null;
  onClose: () => void;
  onSave: (d: RuleUpsertInput & { id?: string }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<RuleUpsertInput & { id?: string }>(() => ({ ...emptyDraft }));
  const isEdit = useMemo(() => draft && "id" in (draft as Rule) && !!(draft as Rule).id, [draft]);

  // Sync form when draft opens/changes
  useMemo(() => {
    if (draft) setForm({ ...emptyDraft, ...draft } as RuleUpsertInput & { id?: string });
  }, [draft]);

  if (!draft) return null;

  const patch = (p: Partial<RuleUpsertInput>) => setForm((f) => ({ ...f, ...p }));

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit rule" : "New routing rule"}</SheetTitle>
          <SheetDescription>
            Overrides the AI's decision when this rule's conditions match. Runs in priority order.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <section className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description ?? ""}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </div>
            <div>
              <Label>Priority (lower = first)</Label>
              <Input
                type="number"
                value={form.priority}
                onChange={(e) => patch({ priority: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-end gap-2">
              <Switch
                checked={form.enabled}
                onCheckedChange={(v) => patch({ enabled: v })}
              />
              <span className="text-sm">Enabled</span>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-medium text-sm">Match conditions</h3>
            <MultiSelect
              label="Categories (any of)"
              options={DOC_CATEGORIES as unknown as string[]}
              value={form.match_categories}
              onChange={(v) => patch({ match_categories: v })}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Document type ILIKE (e.g. %invoice%)</Label>
                <Input
                  value={form.match_doc_type_ilike ?? ""}
                  onChange={(e) =>
                    patch({ match_doc_type_ilike: e.target.value.trim() || null })
                  }
                />
              </div>
              <div>
                <Label>Filename ILIKE (e.g. %NDA%.pdf)</Label>
                <Input
                  value={form.match_filename_ilike ?? ""}
                  onChange={(e) =>
                    patch({ match_filename_ilike: e.target.value.trim() || null })
                  }
                />
              </div>
            </div>
            <TagInput
              label="Keywords (any hit in summary/type/filename)"
              value={form.match_keywords}
              onChange={(v) => patch({ match_keywords: v })}
              placeholder="Add keyword and press Enter"
            />
            <MultiSelect
              label="Confidentiality (any of)"
              options={CONFIDENTIALITY as unknown as string[]}
              value={form.match_confidentiality}
              onChange={(v) => patch({ match_confidentiality: v })}
            />
            <MultiSelect
              label="Portal visibility (any of)"
              options={VISIBILITY as unknown as string[]}
              value={form.match_visibility}
              onChange={(v) => patch({ match_visibility: v })}
            />
          </section>

          <section className="space-y-3">
            <h3 className="font-medium text-sm">Actions</h3>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.action_require_approval}
                onCheckedChange={(v) => patch({ action_require_approval: v })}
              />
              <span className="text-sm">Always require human approval</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.action_block_public}
                onCheckedChange={(v) => patch({ action_block_public: v })}
              />
              <span className="text-sm">Block public portal visibility</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NullableSelect
                label="Force confidentiality"
                options={CONFIDENTIALITY as unknown as string[]}
                value={form.action_set_confidentiality}
                onChange={(v) => patch({ action_set_confidentiality: v })}
              />
              <NullableSelect
                label="Force visibility"
                options={VISIBILITY as unknown as string[]}
                value={form.action_set_visibility}
                onChange={(v) => patch({ action_set_visibility: v })}
              />
              <NullableSelect
                label="Force destination"
                options={DESTINATIONS as unknown as string[]}
                value={form.action_set_destination}
                onChange={(v) => patch({ action_set_destination: v })}
              />
              <div>
                <Label>Force folder path</Label>
                <Input
                  value={form.action_set_folder_path ?? ""}
                  onChange={(e) =>
                    patch({ action_set_folder_path: e.target.value.trim() || null })
                  }
                />
              </div>
            </div>
            <TagInput
              label="Add tags"
              value={form.action_add_tags}
              onChange={(v) => patch({ action_add_tags: v })}
              placeholder="Add tag and press Enter"
            />
            <div>
              <Label>Minimum AI confidence to auto-approve (0.00 – 1.00)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={1}
                value={form.action_min_confidence ?? ""}
                onChange={(e) =>
                  patch({
                    action_min_confidence:
                      e.target.value === "" ? null : Math.min(1, Math.max(0, Number(e.target.value))),
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                If confidence is below this threshold, the document is forced into approval.
              </p>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={saving || !form.name.trim()}
              onClick={() => onSave(form)}
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create rule"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MultiSelect({
  label, options, value, onChange,
}: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1 mt-1">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              type="button"
              key={o}
              onClick={() => toggle(o)}
              className={
                "text-xs px-2 py-1 rounded border transition-colors " +
                (on
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-input")
              }
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NullableSelect({
  label, options, value, onChange,
}: {
  label: string;
  options: string[];
  value: string | null | undefined;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select
        value={value ?? "__none__"}
        onValueChange={(v) => onChange(v === "__none__" ? null : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="No change" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">No change</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TagInput({
  label, value, onChange, placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText("");
  };
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1 mt-1 mb-2">
        {value.map((t) => (
          <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => onChange(value.filter((v) => v !== t))}>
            {t} ×
          </Badge>
        ))}
      </div>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={placeholder}
      />
    </div>
  );
}
