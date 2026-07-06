import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { MasterListShell } from "@/components/crm/MasterListShell";
import { useCanEditSuppliers, useCanDeleteMasters } from "@/lib/crm-permissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2 } from "lucide-react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/suppliers")({
  head: () => ({
    meta: [{ title: "Suppliers — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: SuppliersPage,
});

type Supplier = Tables<"suppliers">;
const CurrencyList = ["USD", "EUR", "AED", "GBP", "CHF", "JPY", "CNY"] as const;

const SupplierSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  contact_person: z.string().trim().max(200).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(50).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  vat_number: z.string().trim().max(60).optional().or(z.literal("")),
  currency: z.string().min(3).max(8),
  default_commission_pct: z.number().min(0).max(100),
  payment_terms: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  is_active: z.boolean(),
});

const empty = {
  name: "",
  contact_person: "",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  city: "",
  country: "",
  vat_number: "",
  currency: "USD",
  default_commission_pct: 5,
  payment_terms: "",
  notes: "",
  is_active: true,
};

function SuppliersPage() {
  const canEdit = useCanEditSuppliers();
  const canDelete = useCanDeleteMasters();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.email, r.contact_person, r.country, r.city, r.vat_number]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const save = useMutation({
    mutationFn: async (form: z.infer<typeof SupplierSchema>) => {
      const norm: TablesInsert<"suppliers"> = {
        name: form.name.trim(),
        contact_person: form.contact_person?.trim() || null,
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
        whatsapp: form.whatsapp?.trim() || null,
        address: form.address?.trim() || null,
        city: form.city?.trim() || null,
        country: form.country?.trim() || null,
        vat_number: form.vat_number?.trim() || null,
        currency: form.currency,
        default_commission_pct: form.default_commission_pct,
        payment_terms: form.payment_terms?.trim() || null,
        notes: form.notes?.trim() || null,
        is_active: form.is_active,
      };
      if (editing) {
        const { error } = await supabase.from("suppliers").update(norm).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert(norm);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Supplier updated" : "Supplier created");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["dashboard-counts"] });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Supplier deleted");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["dashboard-counts"] });
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <>
      <MasterListShell
        title="Suppliers"
        description="Manufacturers and vendors NEVO sources from, with default commission rates."
        count={rows.length}
        search={search}
        onSearchChange={setSearch}
        canCreate={canEdit}
        onCreate={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
        createLabel="New supplier"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">Country</TableHead>
                <TableHead className="hidden md:table-cell text-right">Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[110px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    {rows.length === 0
                      ? 'No suppliers yet. Click "New supplier" to add one.'
                      : "No matches."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {c.contact_person || <span className="text-muted-foreground">—</span>}
                    {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{c.country || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-right tabular-nums">
                    {Number(c.default_commission_pct).toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? "default" : "secondary"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      {canEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditing(c);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(c)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </MasterListShell>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing}
        onSubmit={(f) => save.mutate(f)}
        saving={save.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong>. Products linked to
              this supplier will lose the link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && del.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SupplierDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Supplier | null;
  onSubmit: (v: z.infer<typeof SupplierSchema>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<z.infer<typeof SupplierSchema>>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useMemo(() => {
    if (open) {
      if (initial) {
        setForm({
          name: initial.name,
          contact_person: initial.contact_person ?? "",
          email: initial.email ?? "",
          phone: initial.phone ?? "",
          whatsapp: initial.whatsapp ?? "",
          address: initial.address ?? "",
          city: initial.city ?? "",
          country: initial.country ?? "",
          vat_number: initial.vat_number ?? "",
          currency: initial.currency,
          default_commission_pct: Number(initial.default_commission_pct),
          payment_terms: initial.payment_terms ?? "",
          notes: initial.notes ?? "",
          is_active: initial.is_active,
        });
      } else {
        setForm(empty);
      }
      setErrors({});
    }
  }, [open, initial]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = SupplierSchema.safeParse(form);
    if (!res.success) {
      const errs: Record<string, string> = {};
      for (const iss of res.error.issues) errs[String(iss.path[0])] = iss.message;
      setErrors(errs);
      return;
    }
    onSubmit(res.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit supplier" : "New supplier"}</DialogTitle>
          <DialogDescription>
            Supplier master record used for products, purchase orders and commission invoices.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Supplier name *" error={errors.name}>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
            </Field>
            <Field label="Contact person">
              <Input
                value={form.contact_person ?? ""}
                onChange={(e) => set("contact_person", e.target.value)}
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="WhatsApp">
              <Input
                value={form.whatsapp ?? ""}
                onChange={(e) => set("whatsapp", e.target.value)}
              />
            </Field>
            <Field label="VAT / Tax number">
              <Input
                value={form.vat_number ?? ""}
                onChange={(e) => set("vat_number", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <Textarea
                  rows={2}
                  value={form.address ?? ""}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
            </div>
            <Field label="City">
              <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Country">
              <Input value={form.country ?? ""} onChange={(e) => set("country", e.target.value)} />
            </Field>
            <Field label="Currency">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
              >
                {CurrencyList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Default commission %" error={errors.default_commission_pct}>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.default_commission_pct}
                onChange={(e) => set("default_commission_pct", Number(e.target.value) || 0)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Payment terms">
                <Input
                  value={form.payment_terms ?? ""}
                  onChange={(e) => set("payment_terms", e.target.value)}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <Textarea
                  rows={2}
                  value={form.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </Field>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => set("is_active", v)}
                id="s_active"
              />
              <Label htmlFor="s_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : initial ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
