import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { MasterListShell } from "@/components/crm/MasterListShell";
import { GuideMeButton } from "@/components/ai/GuideMeButton";
import { useCanEditProducts, useCanDeleteMasters } from "@/lib/crm-permissions";
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

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({
    meta: [{ title: "Products — NEVO CRM" }, { name: "robots", content: "noindex" }],
  }),
  component: ProductsPage,
});

type Product = Tables<"products">;
type Supplier = Tables<"suppliers">;

const CurrencyList = ["USD", "EUR", "AED", "GBP", "CHF", "JPY", "CNY"] as const;
const Units = ["pcs", "kg", "ton", "m", "m²", "m³", "L", "box", "pallet", "container"] as const;

const ProductSchema = z.object({
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  supplier_id: z
    .string()
    .uuid()
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  unit: z.string().min(1).max(20),
  unit_price: z.number().min(0),
  currency: z.string().min(3).max(8),
  default_commission_pct: z.number().min(0).max(100),
  hs_code: z.string().trim().max(40).optional().or(z.literal("")),
  is_active: z.boolean(),
});

const empty = {
  sku: "",
  name: "",
  description: "",
  category: "",
  supplier_id: "" as string | null,
  unit: "pcs",
  unit_price: 0,
  currency: "USD",
  default_commission_pct: 0,
  hs_code: "",
  is_active: true,
};

function ProductsPage() {
  const canEdit = useCanEditProducts();
  const canDelete = useCanDeleteMasters();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers", "options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name, default_commission_pct")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Pick<Supplier, "id" | "name" | "default_commission_pct">[];
    },
  });

  const supplierMap = useMemo(() => new Map(suppliers.map((s) => [s.id, s.name])), [suppliers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.name,
        r.sku,
        r.category,
        r.hs_code,
        r.description,
        r.supplier_id ? (supplierMap.get(r.supplier_id) ?? "") : "",
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, search, supplierMap]);

  const save = useMutation({
    mutationFn: async (form: z.infer<typeof ProductSchema>) => {
      const norm: TablesInsert<"products"> = {
        sku: form.sku?.trim() || null,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        category: form.category?.trim() || null,
        supplier_id: form.supplier_id || null,
        unit: form.unit,
        unit_price: form.unit_price,
        currency: form.currency,
        default_commission_pct: form.default_commission_pct,
        hs_code: form.hs_code?.trim() || null,
        is_active: form.is_active,
      };
      if (editing) {
        const { error } = await supabase.from("products").update(norm).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(norm);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product created");
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard-counts"] });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard-counts"] });
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <>
      <MasterListShell
        title="Products"
        description="Items NEVO trades. Prices, units and commission defaults feed quotations and invoices."
        count={rows.length}
        search={search}
        onSearchChange={setSearch}
        canCreate={canEdit}
        onCreate={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
        createLabel="New product"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell w-[130px]">SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden lg:table-cell">Supplier</TableHead>
                <TableHead className="hidden md:table-cell">Unit</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="hidden md:table-cell text-right">Comm.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[110px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    {rows.length === 0
                      ? 'No products yet. Click "New product" to add one.'
                      : "No matches."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="hidden sm:table-cell font-mono text-xs">
                    {p.sku || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    {p.category && (
                      <div className="text-xs text-muted-foreground">{p.category}</div>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {p.supplier_id ? (
                      (supplierMap.get(p.supplier_id) ?? "—")
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{p.unit}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.currency}{" "}
                    {Number(p.unit_price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right tabular-nums">
                    {Number(p.default_commission_pct).toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? "default" : "secondary"}>
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      {canEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditing(p);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(p)}>
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

      <ProductDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing}
        suppliers={suppliers}
        onSubmit={(f) => save.mutate(f)}
        saving={save.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong>.
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

function ProductDialog({
  open,
  onOpenChange,
  initial,
  suppliers,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Product | null;
  suppliers: Pick<Supplier, "id" | "name" | "default_commission_pct">[];
  onSubmit: (v: z.infer<typeof ProductSchema>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<z.infer<typeof ProductSchema>>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useMemo(() => {
    if (open) {
      if (initial) {
        setForm({
          sku: initial.sku ?? "",
          name: initial.name,
          description: initial.description ?? "",
          category: initial.category ?? "",
          supplier_id: initial.supplier_id ?? null,
          unit: initial.unit,
          unit_price: Number(initial.unit_price),
          currency: initial.currency,
          default_commission_pct: Number(initial.default_commission_pct),
          hs_code: initial.hs_code ?? "",
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

  // Auto-fill commission from supplier default when supplier changes and commission is 0
  const onSupplierChange = (id: string) => {
    setForm((s) => {
      const sup = suppliers.find((x) => x.id === id);
      const shouldFill = sup && (!s.default_commission_pct || s.default_commission_pct === 0);
      return {
        ...s,
        supplier_id: id || null,
        default_commission_pct: shouldFill
          ? Number(sup!.default_commission_pct)
          : s.default_commission_pct,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = ProductSchema.safeParse(form);
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
          <DialogTitle>{initial ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            Item master used on quotations, orders and invoices.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="SKU">
              <Input value={form.sku ?? ""} onChange={(e) => set("sku", e.target.value)} />
            </Field>
            <Field label="Product name *" error={errors.name}>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
            </Field>
            <Field label="Category">
              <Input
                value={form.category ?? ""}
                onChange={(e) => set("category", e.target.value)}
              />
            </Field>
            <Field label="Supplier">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={form.supplier_id ?? ""}
                onChange={(e) => onSupplierChange(e.target.value)}
              >
                <option value="">—</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Unit">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
              >
                {Units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="HS code">
              <Input value={form.hs_code ?? ""} onChange={(e) => set("hs_code", e.target.value)} />
            </Field>
            <Field label="Unit price">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.unit_price}
                onChange={(e) => set("unit_price", Number(e.target.value) || 0)}
              />
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
            <Field label="Default commission %">
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
              <Field label="Description">
                <Textarea
                  rows={3}
                  value={form.description ?? ""}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => set("is_active", v)}
                id="p_active"
              />
              <Label htmlFor="p_active">Active</Label>
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
