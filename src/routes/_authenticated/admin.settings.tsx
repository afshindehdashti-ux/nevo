import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsSuperAdmin } from "@/lib/crm-hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — NEVO CRM" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const isSuperAdmin = useIsSuperAdmin();
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Company profile, document defaults and system preferences.</p>
      </div>
      {!isSuperAdmin && (
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Read-only</AlertTitle>
          <AlertDescription>Only Super Admins can edit these settings. You can view current values.</AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Company Profile</TabsTrigger>
          <TabsTrigger value="documents">Document Defaults</TabsTrigger>
        </TabsList>
        <TabsContent value="company"><CompanyForm canEdit={isSuperAdmin} /></TabsContent>
        <TabsContent value="documents"><DocumentForm canEdit={isSuperAdmin} /></TabsContent>
      </Tabs>
    </div>
  );
}

function CompanyForm({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["company_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => { if (data) setForm(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v == null ? "" : String(v)]))); }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!data?.id) throw new Error("Settings row missing");
      const payload: TablesUpdate<"company_settings"> = {};
      const fields = ["legal_name","trade_license","address","city","country","email","phone","whatsapp","website","logo_url","bank_name","bank_account_name","bank_account_number","bank_iban","bank_swift","bank_branch","default_terms"] as const;
      for (const f of fields) (payload as Record<string, string | null>)[f] = (form[f] ?? "").trim() || null;
      const { error } = await supabase.from("company_settings").update(payload).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Company settings saved"); qc.invalidateQueries({ queryKey: ["company_settings"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading…</p>;

  const F = (name: string, label: string, opts: { textarea?: boolean; type?: string } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {opts.textarea ? (
        <Textarea id={name} value={form[name] ?? ""} onChange={(e) => setForm({ ...form, [name]: e.target.value })} disabled={!canEdit} rows={3} />
      ) : (
        <Input id={name} type={opts.type ?? "text"} value={form[name] ?? ""} onChange={(e) => setForm({ ...form, [name]: e.target.value })} disabled={!canEdit} />
      )}
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-6 mt-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Company identity</CardTitle><CardDescription>Used on all invoices and documents.</CardDescription></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {F("legal_name", "Legal name")}
          {F("trade_license", "Trade license no.")}
          {F("website", "Website")}
          {F("email", "Email", { type: "email" })}
          {F("phone", "Phone")}
          {F("whatsapp", "WhatsApp")}
          <div className="md:col-span-2">{F("address", "Address", { textarea: true })}</div>
          {F("city", "City")}
          {F("country", "Country")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Bank details</CardTitle><CardDescription>Appears on proforma and commercial invoices.</CardDescription></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {F("bank_name", "Bank name")}
          {F("bank_branch", "Branch")}
          {F("bank_account_name", "Account name")}
          {F("bank_account_number", "Account number")}
          {F("bank_iban", "IBAN")}
          {F("bank_swift", "SWIFT / BIC")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Default terms</CardTitle></CardHeader>
        <CardContent>{F("default_terms", "Default terms & conditions", { textarea: true })}</CardContent>
      </Card>

      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
        </div>
      )}
    </form>
  );
}

function DocumentForm({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["document_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("document_settings").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => { if (data) setForm(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v == null ? "" : String(v)]))); }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!data?.id) throw new Error("Settings row missing");
      const payload: TablesUpdate<"document_settings"> = {};
      const textFields = ["quotation_prefix","proforma_prefix","invoice_prefix","commission_prefix","purchase_order_prefix","delivery_note_prefix","packing_list_prefix","default_currency","default_incoterms","default_payment_terms","footer_text","signature_name","signature_title"] as const;
      for (const f of textFields) (payload as Record<string, string | null>)[f] = (form[f] ?? "").trim() || null;
      (payload as Record<string, number>).default_vat_percent = form.default_vat_percent ? Number(form.default_vat_percent) : 0;
      const { error } = await supabase.from("document_settings").update(payload).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Document settings saved"); qc.invalidateQueries({ queryKey: ["document_settings"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading…</p>;

  const F = (name: string, label: string, opts: { type?: string } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={opts.type ?? "text"} value={form[name] ?? ""} onChange={(e) => setForm({ ...form, [name]: e.target.value })} disabled={!canEdit} />
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-6 mt-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Numbering prefixes</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {F("quotation_prefix", "Quotation")}
          {F("proforma_prefix", "Proforma")}
          {F("invoice_prefix", "Invoice")}
          {F("commission_prefix", "Commission")}
          {F("purchase_order_prefix", "Purchase Order")}
          {F("delivery_note_prefix", "Delivery Note")}
          {F("packing_list_prefix", "Packing List")}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Defaults</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {F("default_vat_percent", "Default VAT %", { type: "number" })}
          {F("default_currency", "Currency")}
          {F("default_incoterms", "Incoterms")}
          <div className="col-span-2 md:col-span-4">{F("default_payment_terms", "Payment terms")}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Footer & signature</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">{F("footer_text", "Footer text")}</div>
          {F("signature_name", "Signature name")}
          {F("signature_title", "Signature title")}
        </CardContent>
      </Card>
      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
        </div>
      )}
    </form>
  );
}
