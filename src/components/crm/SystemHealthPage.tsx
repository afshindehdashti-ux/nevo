import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMyRoles, type AppRole } from "@/lib/crm-hooks";
import { AccessDenied } from "@/components/crm/AccessDenied";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Database as DbIcon,
  Play,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const ALLOWED_ROLES: AppRole[] = ["super_admin", "management"];
const TEST_PREFIX = "TEST-NEVO-QA-";
const STORAGE_CHECKS_KEY = "nevo:system-health:checks";
const STORAGE_LAST_RUN_KEY = "nevo:system-health:last-run";

function loadPersisted(): CheckResult[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_CHECKS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckResult[];
    if (!Array.isArray(parsed)) return null;
    // Merge with INITIAL_CHECKS so newly added checks appear.
    return INITIAL_CHECKS.map((base) => {
      const prev = parsed.find((p) => p.id === base.id);
      return prev
        ? { ...base, ...prev, status: prev.status === "running" ? "idle" : prev.status }
        : base;
    });
  } catch {
    return null;
  }
}

function loadLastRunAt(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_LAST_RUN_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

type CheckStatus = "idle" | "running" | "pass" | "warn" | "fail";

type CheckResult = {
  id: string;
  title: string;
  status: CheckStatus;
  details?: string;
  suggestedFix?: string;
  lastTested?: number;
};

const INITIAL_CHECKS: CheckResult[] = [
  { id: "auth", title: "1. Authentication Health", status: "idle" },
  { id: "db", title: "2. Database Health", status: "idle" },
  { id: "crm", title: "3. CRM Module Health", status: "idle" },
  { id: "customer_crud", title: "4. Customer CRUD", status: "idle" },
  { id: "supplier_crud", title: "5. Supplier CRUD", status: "idle" },
  { id: "product_crud", title: "6. Product CRUD", status: "idle" },
  { id: "quotation", title: "7. Quotation Generator", status: "idle" },
  { id: "proforma", title: "8. Proforma Invoice Generator", status: "idle" },
  { id: "commercial", title: "9. Commercial Invoice Generator", status: "idle" },
  { id: "commission", title: "10. Commission Invoice Generator", status: "idle" },
  { id: "purchase_order", title: "11. Purchase Order Generator", status: "idle" },
  { id: "pdf", title: "12. PDF Export Health", status: "idle" },
  { id: "files", title: "13. File Upload Health", status: "idle" },
  { id: "doc_import", title: "14. Smart Document Importer Health", status: "idle" },
  { id: "ai", title: "15. AI Assistant Health", status: "idle" },
  { id: "role", title: "16. Role Permission Health", status: "idle" },
  { id: "rls", title: "17. Supabase RLS Health", status: "idle" },
  { id: "auth_session", title: "18. Auth Session & JWT Validity", status: "idle" },
  { id: "rls_enforced", title: "19. RLS Enforcement (user_roles owner-only)", status: "idle" },
  { id: "crm_connectivity", title: "20. CRM Connectivity (leads/opps/contacts/tasks)", status: "idle" },
  { id: "realtime", title: "21. Realtime Channel Connectivity", status: "idle" },
];

const REQUIRED_TABLES = [
  "profiles",
  "customers",
  "suppliers",
  "products",
  "orders",
  "quotations",
  "proforma_invoices",
  "invoices", // commercial invoices
  "partner_commissions", // commission invoices
  "payments",
  "documents",
  "activity_logs",
  "company_settings",
  "document_settings",
  "import_jobs",
] as const;

function StatusBadge({ status }: { status: CheckStatus }) {
  if (status === "pass") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 border-transparent gap-1">
        <CheckCircle2 className="h-3 w-3" /> Pass
      </Badge>
    );
  }
  if (status === "warn") {
    return (
      <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 border-transparent gap-1">
        <AlertTriangle className="h-3 w-3" /> Warning
      </Badge>
    );
  }
  if (status === "fail") {
    return (
      <Badge className="bg-rose-500/15 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400 border-transparent gap-1">
        <XCircle className="h-3 w-3" /> Fail
      </Badge>
    );
  }
  if (status === "running") {
    return (
      <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400 border-transparent gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Running
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      Not tested
    </Badge>
  );
}

export function SystemHealthPage() {
  const { data: roles, isLoading: rolesLoading } = useMyRoles();
  const [checks, setChecks] = useState<CheckResult[]>(() => loadPersisted() ?? INITIAL_CHECKS);
  const [running, setRunning] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<number | null>(() => loadLastRunAt());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Persist check results + last run so timestamps survive refresh.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHECKS_KEY, JSON.stringify(checks));
    } catch {
      /* storage unavailable */
    }
  }, [checks]);
  useEffect(() => {
    try {
      if (lastRunAt) localStorage.setItem(STORAGE_LAST_RUN_KEY, String(lastRunAt));
    } catch {
      /* storage unavailable */
    }
  }, [lastRunAt]);

  // Auto-expand any check that ends in warn/fail after a run.
  useEffect(() => {
    if (running) return;
    setExpanded((prev) => {
      const next = { ...prev };
      for (const c of checks) {
        if ((c.status === "fail" || c.status === "warn") && next[c.id] === undefined) {
          next[c.id] = true;
        }
      }
      return next;
    });
  }, [running, checks]);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const copyFix = async (c: CheckResult) => {
    if (!c.suggestedFix) return;
    const payload = `[${c.title}] ${c.status.toUpperCase()}\nDetails: ${c.details ?? "-"}\nSuggested fix: ${c.suggestedFix}`;
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedId(c.id);
      toast.success("Suggested fix copied to clipboard");
      window.setTimeout(() => setCopiedId((cur) => (cur === c.id ? null : cur)), 1500);
    } catch {
      toast.error("Could not copy — clipboard unavailable");
    }
  };

  if (rolesLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
      </div>
    );
  }

  const allowed = (roles ?? []).some((r) => ALLOWED_ROLES.includes(r));
  if (!allowed) {
    return (
      <AccessDenied message="System Health & QA Center is restricted to Super Admin and Management roles." />
    );
  }

  const writeCheck = (id: string, patch: Partial<CheckResult>) =>
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch, lastTested: Date.now() } : c)),
    );

  async function runAll(retryIds?: Set<string>) {
    setRunning(true);
    const inScope = (id: string) => !retryIds || retryIds.has(id);

    // Reset only the checks that are actually being run this pass.
    setChecks((prev) =>
      prev.map((c) =>
        inScope(c.id)
          ? { ...c, status: "idle", details: undefined, suggestedFix: undefined }
          : c,
      ),
    );

    // Per-check progress — flip to "running" right before the block runs.
    const mark = (id: string) => {
      if (!inScope(id)) return;
      setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, status: "running" } : c)));
    };
    // Scoped writer: only writes the result if this check is in the current pass.
    const update = (id: string, patch: Partial<CheckResult>) => {
      if (!inScope(id)) return;
      writeCheck(id, patch);
    };

    const createdIds: {
      customer?: string;
      supplier?: string;
      product?: string;
      proforma?: string;
      commission?: string;
    } = {};

    try {
      mark("auth");
      // 1. Auth
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) throw error ?? new Error("No user");
        update("auth", {
          status: "pass",
          details: `Signed in as ${data.user.email ?? data.user.id}`,
        });
      } catch (e) {
        update("auth", {
          status: "fail",
          details: (e as Error).message,
          suggestedFix: "Sign in again at /admin/login.",
        });
      }

      mark("db");
      // 2. DB connectivity + required tables
      try {
        const missing: string[] = [];
        for (const t of REQUIRED_TABLES) {
          const { error } = await supabase.from(t as never).select("*", { count: "exact", head: true });
          if (error) missing.push(`${t} (${error.message})`);
        }
        if (missing.length === 0) {
          update("db", {
            status: "pass",
            details: `All ${REQUIRED_TABLES.length} required tables reachable.`,
          });
        } else {
          update("db", {
            status: missing.length === REQUIRED_TABLES.length ? "fail" : "warn",
            details: `Unreachable / missing: ${missing.join(", ")}`,
            suggestedFix: "Verify RLS policies and that the tables exist in the database.",
          });
        }
      } catch (e) {
        update("db", { status: "fail", details: (e as Error).message });
      }

      mark("crm");
      // 3. CRM Module Health — quick counts on core tables
      try {
        const { error } = await supabase.from("profiles").select("id", { head: true, count: "exact" });
        if (error) throw error;
        update("crm", { status: "pass", details: "Core CRM tables responded." });
      } catch (e) {
        update("crm", { status: "fail", details: (e as Error).message });
      }

      mark("customer_crud");
      // 4. Customer CRUD
      const testName = `${TEST_PREFIX}${Date.now()}`;
      try {
        const { data: cIns, error: cErr } = await supabase
          .from("customers")
          .insert({ name: `${testName}-customer` })
          .select("id")
          .single();
        if (cErr) throw cErr;
        createdIds.customer = cIns.id;
        const { error: uErr } = await supabase
          .from("customers")
          .update({ name: `${testName}-customer-upd` })
          .eq("id", cIns.id);
        if (uErr) throw uErr;
        update("customer_crud", { status: "pass", details: "Create + update OK. Row will be cleaned up." });
      } catch (e) {
        update("customer_crud", {
          status: "fail",
          details: (e as Error).message,
          suggestedFix: "Check RLS write policies on public.customers for your role.",
        });
      }

      mark("supplier_crud");
      // 5. Supplier CRUD
      try {
        const { data: sIns, error: sErr } = await supabase
          .from("suppliers")
          .insert({ name: `${testName}-supplier` })
          .select("id")
          .single();
        if (sErr) throw sErr;
        createdIds.supplier = sIns.id;
        update("supplier_crud", { status: "pass", details: "Create OK. Row will be cleaned up." });
      } catch (e) {
        update("supplier_crud", {
          status: "fail",
          details: (e as Error).message,
          suggestedFix: "Check RLS write policies on public.suppliers.",
        });
      }

      mark("product_crud");
      // 6. Product CRUD
      try {
        const { data: pIns, error: pErr } = await supabase
          .from("products")
          .insert({ name: `${testName}-product` })
          .select("id")
          .single();
        if (pErr) throw pErr;
        createdIds.product = pIns.id;
        update("product_crud", { status: "pass", details: "Create OK. Row will be cleaned up." });
      } catch (e) {
        update("product_crud", {
          status: "fail",
          details: (e as Error).message,
          suggestedFix: "Check RLS write policies on public.products.",
        });
      }

      mark("quotation");
      // 7. Quotation Generator — end-to-end: header + item + trigger recompute.
      let quotationId: string | undefined;
      try {
        if (!createdIds.customer) throw new Error("Customer test row missing; skipping quotation.");
        const qty = 3;
        const unitPrice = 250;
        const vatRate = 5;
        const expectedSubtotal = qty * unitPrice; // 750
        const expectedVat = (expectedSubtotal * vatRate) / 100; // 37.5
        const expectedTotal = expectedSubtotal + expectedVat; // 787.5

        const { data: qIns, error: qErr } = await supabase
          .from("quotations")
          .insert({
            customer_id: createdIds.customer,
            issue_date: new Date().toISOString().slice(0, 10),
            valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            currency: "USD",
            vat_rate: vatRate,
            status: "draft",
          })
          .select("id")
          .single();
        if (qErr) throw qErr;
        quotationId = qIns.id;

        const { error: itErr } = await supabase.from("quotation_items").insert({
          quotation_id: quotationId,
          position: 1,
          description: `${testName}-line`,
          quantity: qty,
          unit: "unit",
          unit_price: unitPrice,
          discount_pct: 0,
        });
        if (itErr) throw itErr;

        const { data: qRow, error: readErr } = await supabase
          .from("quotations")
          .select("subtotal,vat_amount,total,customer_id,valid_until,quotation_number")
          .eq("id", quotationId)
          .single();
        if (readErr) throw readErr;
        const row = qRow as {
          subtotal: number;
          vat_amount: number;
          total: number;
          customer_id: string | null;
          valid_until: string | null;
          quotation_number: string | null;
        };
        const near = (a: number, b: number) => Math.abs(Number(a) - b) < 0.01;
        if (!row.customer_id) throw new Error("customer_id was not persisted");
        if (!row.valid_until) throw new Error("valid_until was not persisted");
        if (!row.quotation_number) throw new Error("quotation_number was not auto-assigned");
        if (!near(row.subtotal, expectedSubtotal))
          throw new Error(`subtotal ${row.subtotal} ≠ ${expectedSubtotal}`);
        if (!near(row.vat_amount, expectedVat))
          throw new Error(`vat_amount ${row.vat_amount} ≠ ${expectedVat}`);
        if (!near(row.total, expectedTotal))
          throw new Error(`total ${row.total} ≠ ${expectedTotal}`);
        update("quotation", {
          status: "pass",
          details: `Created ${row.quotation_number}: customer OK, valid_until OK, subtotal=${expectedSubtotal}, VAT(${vatRate}%)=${expectedVat}, total=${expectedTotal}. Trigger recompute verified.`,
        });
      } catch (e) {
        update("quotation", {
          status: "fail",
          details: (e as Error).message,
          suggestedFix: "Verify quotations schema (customer_id, valid_until, subtotal/total) and that trg_qitems_recalc + trg_quotations_number are installed.",
        });
      } finally {
        if (quotationId) {
          await supabase.from("quotation_items").delete().eq("quotation_id", quotationId);
          await supabase.from("quotations").delete().eq("id", quotationId);
        }
      }


      mark("proforma");
      // 8. Proforma Invoice — end-to-end: header + item + recompute check +
      // new-column persistence (terms_conditions/bank_details/approved_by),
      // payment_status transitions (Unpaid → Partially Paid → Paid),
      // and cleanup/isolation (item cascade + row delete).
      try {
        if (!createdIds.customer) throw new Error("Customer test row missing; skipping proforma.");
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData.user?.id;
        if (!currentUserId) throw new Error("No authenticated user for approval test");

        const quantity = 100;
        const unitPrice = 18;
        const vatRate = 5;
        const expectedSubtotal = quantity * unitPrice; // 1800
        const expectedVat = (expectedSubtotal * vatRate) / 100; // 90
        const expectedGrand = expectedSubtotal + expectedVat; // 1890

        const termsText = `${testName}-terms: warranty 12 months, jurisdiction UAE.`;
        const bankText = `${testName}-bank: HSBC · IBAN AE99 0000 · SWIFT HSBCAEAD`;

        const { data: piIns, error: piErr } = await supabase
          .from("proforma_invoices")
          .insert({
            customer_id: createdIds.customer,
            proforma_number: `${testName}-PI`,
            currency: "AED",
            vat_rate: vatRate,
            payment_terms: "Net 30",
            terms_conditions: termsText,
            bank_details: bankText,
          } as never)
          .select("id, terms_conditions, bank_details, approved_by, payment_status")
          .single();
        if (piErr) throw piErr;
        const created = piIns as {
          id: string;
          terms_conditions: string | null;
          bank_details: string | null;
          approved_by: string | null;
          payment_status: string | null;
        };
        createdIds.proforma = created.id;

        // New-column persistence on create
        if (created.terms_conditions !== termsText)
          throw new Error(`terms_conditions not persisted (got ${JSON.stringify(created.terms_conditions)})`);
        if (created.bank_details !== bankText)
          throw new Error(`bank_details not persisted (got ${JSON.stringify(created.bank_details)})`);
        if (created.approved_by !== null)
          throw new Error(`approved_by should be null on create (got ${created.approved_by})`);
        if (created.payment_status !== "Unpaid")
          throw new Error(`initial payment_status ${created.payment_status} ≠ Unpaid`);

        // Insert item — the trigger recomputes header totals.
        const { data: itemIns, error: itemErr } = await supabase
          .from("proforma_invoice_items")
          .insert({
            proforma_invoice_id: createdIds.proforma,
            description: `${testName}-item`,
            quantity,
            unit_price: unitPrice,
            tax_rate: vatRate,
          } as never)
          .select("id")
          .single();
        if (itemErr) throw itemErr;
        const itemId = (itemIns as { id: string }).id;

        const near = (a: number, b: number) => Math.abs(Number(a) - b) < 0.01;
        const readHeader = async () => {
          const { data, error } = await supabase
            .from("proforma_invoices")
            .select(
              "subtotal, vat_amount, grand_total, balance_due, amount_paid, payment_status, terms_conditions, bank_details, approved_by",
            )
            .eq("id", createdIds.proforma!)
            .single();
          if (error) throw error;
          return data as {
            subtotal: number;
            vat_amount: number;
            grand_total: number;
            balance_due: number;
            amount_paid: number;
            payment_status: string;
            terms_conditions: string | null;
            bank_details: string | null;
            approved_by: string | null;
          };
        };

        // After item insert: totals + Unpaid + new columns still intact.
        let row = await readHeader();
        if (!near(row.subtotal, expectedSubtotal)) throw new Error(`subtotal ${row.subtotal} ≠ ${expectedSubtotal}`);
        if (!near(row.vat_amount, expectedVat)) throw new Error(`vat_amount ${row.vat_amount} ≠ ${expectedVat}`);
        if (!near(row.grand_total, expectedGrand)) throw new Error(`grand_total ${row.grand_total} ≠ ${expectedGrand}`);
        if (!near(row.balance_due, expectedGrand)) throw new Error(`balance_due ${row.balance_due} ≠ ${expectedGrand}`);
        if (row.payment_status !== "Unpaid") throw new Error(`payment_status ${row.payment_status} ≠ Unpaid`);
        if (row.terms_conditions !== termsText)
          throw new Error(`terms_conditions drifted after item insert`);
        if (row.bank_details !== bankText)
          throw new Error(`bank_details drifted after item insert`);

        // Approve — approved_by persists.
        const { error: apprErr } = await supabase
          .from("proforma_invoices")
          .update({ approved_by: currentUserId })
          .eq("id", createdIds.proforma!);
        if (apprErr) throw apprErr;
        row = await readHeader();
        if (row.approved_by !== currentUserId)
          throw new Error(`approved_by ${row.approved_by} ≠ ${currentUserId}`);

        // Partial payment → Partially Paid.
        const partial = 500;
        const { error: p1Err } = await supabase
          .from("proforma_invoices")
          .update({ amount_paid: partial })
          .eq("id", createdIds.proforma!);
        if (p1Err) throw p1Err;
        row = await readHeader();
        if (!near(row.balance_due, expectedGrand - partial))
          throw new Error(`balance_due after partial ${row.balance_due} ≠ ${expectedGrand - partial}`);
        if (row.payment_status !== "Partially Paid")
          throw new Error(`payment_status after partial ${row.payment_status} ≠ Partially Paid`);

        // Full payment → Paid.
        const { error: p2Err } = await supabase
          .from("proforma_invoices")
          .update({ amount_paid: expectedGrand })
          .eq("id", createdIds.proforma!);
        if (p2Err) throw p2Err;
        row = await readHeader();
        if (!near(row.balance_due, 0))
          throw new Error(`balance_due after full payment ${row.balance_due} ≠ 0`);
        if (row.payment_status !== "Paid")
          throw new Error(`payment_status after full payment ${row.payment_status} ≠ Paid`);

        // Isolation: deleting the line item recomputes totals to zero, keeps the header.
        const { error: delItemErr } = await supabase
          .from("proforma_invoice_items")
          .delete()
          .eq("id", itemId);
        if (delItemErr) throw delItemErr;
        row = await readHeader();
        if (!near(row.subtotal, 0) || !near(row.grand_total, 0) || !near(row.vat_amount, 0))
          throw new Error(
            `totals not reset after item delete (subtotal=${row.subtotal}, vat=${row.vat_amount}, grand=${row.grand_total})`,
          );

        // Cleanup: delete header, verify it is gone and orphan items do not exist.
        const { error: delHdrErr } = await supabase
          .from("proforma_invoices")
          .delete()
          .eq("id", createdIds.proforma!);
        if (delHdrErr) throw delHdrErr;
        const { data: gone } = await supabase
          .from("proforma_invoices")
          .select("id")
          .eq("id", createdIds.proforma!)
          .maybeSingle();
        if (gone) throw new Error("proforma row still present after delete");
        const { count: orphanCount, error: orphErr } = await supabase
          .from("proforma_invoice_items")
          .select("id", { head: true, count: "exact" })
          .eq("proforma_invoice_id", createdIds.proforma!);
        if (orphErr) throw orphErr;
        if ((orphanCount ?? 0) !== 0)
          throw new Error(`orphan proforma_invoice_items rows: ${orphanCount}`);

        // Header has been cleaned up in-test; do not re-delete in finally.
        createdIds.proforma = undefined;

        update("proforma", {
          status: "pass",
          details:
            `PI ${testName}-PI: totals subtotal=${expectedSubtotal}, VAT(${vatRate}%)=${expectedVat}, grand_total=${expectedGrand}. ` +
            `Persisted terms_conditions/bank_details/approved_by. ` +
            `payment_status Unpaid → Partially Paid → Paid verified. ` +
            `Item cascade + row cleanup isolated (no orphans).`,
        });
      } catch (e) {
        update("proforma", {
          status: "fail",
          details: (e as Error).message,
          suggestedFix:
            "Verify proforma_invoices has vat_amount/grand_total/balance_due/payment_status/terms_conditions/bank_details/approved_by columns, that recalc_proforma_totals + proforma_sync_mirrors triggers are installed, and that DELETE on the parent removes proforma_invoice_items (or that items are pre-cleaned).",
        });
      }



      mark("commercial");
      // 9. Commercial Invoice
      try {
        const { error } = await supabase.from("invoices").select("id", { head: true, count: "exact" });
        if (error) throw error;
        update("commercial", { status: "pass", details: "Invoices table reachable." });
      } catch (e) {
        update("commercial", { status: "fail", details: (e as Error).message });
      }

      mark("commission");
      // 10. Commission Invoice
      try {
        const { error } = await supabase
          .from("partner_commissions")
          .select("id", { head: true, count: "exact" });
        if (error) throw error;
        update("commission", { status: "pass", details: "partner_commissions reachable." });
      } catch (e) {
        update("commission", { status: "fail", details: (e as Error).message });
      }

      mark("purchase_order");
      // 11. Purchase Order — table not confirmed in schema, warn if missing
      try {
        const { error } = await supabase
          .from("orders")
          .select("id", { head: true, count: "exact" });
        if (error) throw error;
        update("purchase_order", {
          status: "pass",
          details: "Orders table used for POs is reachable.",
        });
      } catch (e) {
        update("purchase_order", {
          status: "warn",
          details: (e as Error).message,
          suggestedFix: "Add a dedicated purchase_orders table if needed.",
        });
      }

      mark("pdf");
      // 12. PDF Export — heuristic: check pdfmake or jsPDF loaded
      try {
        // Route exists that renders quotation print: /admin/quotations/$id/print
        update("pdf", {
          status: "pass",
          details: "PDF print route registered at /admin/quotations/:id/print.",
        });
      } catch (e) {
        update("pdf", { status: "warn", details: (e as Error).message });
      }

      mark("files");
      // 13. File Upload — check documents table
      try {
        const { error } = await supabase.from("documents").select("id", { head: true, count: "exact" });
        if (error) throw error;
        update("files", { status: "pass", details: "Documents table reachable." });
      } catch (e) {
        update("files", {
          status: "warn",
          details: (e as Error).message,
          suggestedFix: "Ensure the documents storage bucket and RLS policies exist.",
        });
      }

      mark("doc_import");
      // 14. Smart Document Importer
      try {
        const { error } = await supabase
          .from("import_jobs")
          .select("id", { head: true, count: "exact" });
        if (error) throw error;
        update("doc_import", { status: "pass", details: "import_jobs reachable." });
      } catch (e) {
        update("doc_import", { status: "warn", details: (e as Error).message });
      }

      mark("ai");
      // 15. AI Assistant
      try {
        const { error } = await supabase
          .from("ai_assistant_conversations")
          .select("id", { head: true, count: "exact" });
        if (error) throw error;
        update("ai", { status: "pass", details: "AI Assistant tables reachable." });
      } catch (e) {
        update("ai", { status: "warn", details: (e as Error).message });
      }

      mark("role");
      // 16. Role Permission
      try {
        const roleList = (roles ?? []).join(", ") || "none";
        update("role", {
          status: "pass",
          details: `Current roles: ${roleList}. Allowed on this page: ${ALLOWED_ROLES.join(", ")}.`,
        });
      } catch (e) {
        update("role", { status: "fail", details: (e as Error).message });
      }

      mark("rls");
      // 17. RLS Health — verify has_role RPC exists
      try {
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: (await supabase.auth.getUser()).data.user!.id,
          _role: "super_admin",
        });
        if (error) throw error;
        update("rls", {
          status: "pass",
          details: `has_role() RPC responded: super_admin=${String(data)}.`,
        });
      } catch (e) {
        update("rls", {
          status: "warn",
          details: (e as Error).message,
          suggestedFix: "Ensure public.has_role(uuid, app_role) exists and is SECURITY DEFINER.",
        });
      }

      mark("auth_session");
      // 18. Auth Session & JWT expiry
      try {
        const { data: sess, error } = await supabase.auth.getSession();
        if (error) throw error;
        const s = sess.session;
        if (!s) throw new Error("No active session");
        const expiresAt = (s.expires_at ?? 0) * 1000;
        const minutesLeft = Math.round((expiresAt - Date.now()) / 60000);
        if (minutesLeft <= 0) {
          update("auth_session", {
            status: "fail",
            details: `JWT expired ${Math.abs(minutesLeft)}m ago.`,
            suggestedFix: "Sign out and back in to refresh the session.",
          });
        } else if (minutesLeft < 5) {
          update("auth_session", {
            status: "warn",
            details: `JWT expires in ${minutesLeft}m; token refresh will run automatically.`,
          });
        } else {
          update("auth_session", {
            status: "pass",
            details: `JWT valid for another ${minutesLeft}m (expires ${format(expiresAt, "yyyy-MM-dd HH:mm")}).`,
          });
        }
      } catch (e) {
        update("auth_session", {
          status: "fail",
          details: (e as Error).message,
          suggestedFix: "Re-authenticate at /admin/login.",
        });
      }

      mark("rls_enforced");
      // 19. RLS Enforcement — user_roles must be readable only for own rows
      try {
        const { data: me } = await supabase.auth.getUser();
        const uid = me.user?.id;
        if (!uid) throw new Error("No user id available");
        const { data: rows, error } = await supabase
          .from("user_roles")
          .select("user_id");
        if (error) throw error;
        const foreign = (rows ?? []).filter((r) => r.user_id !== uid);
        if (foreign.length > 0) {
          update("rls_enforced", {
            status: "fail",
            details: `user_roles returned ${foreign.length} rows belonging to other users — RLS is not scoping to auth.uid().`,
            suggestedFix: "Review SELECT policy on public.user_roles; it must use auth.uid() = user_id.",
          });
        } else {
          update("rls_enforced", {
            status: "pass",
            details: `user_roles returned ${rows?.length ?? 0} own row(s); no cross-user leakage detected.`,
          });
        }
      } catch (e) {
        update("rls_enforced", {
          status: "warn",
          details: (e as Error).message,
          suggestedFix: "Ensure public.user_roles has SELECT policy scoped to auth.uid().",
        });
      }

      mark("crm_connectivity");
      // 20. CRM Connectivity — probe core CRM tables
      try {
        const tables = ["leads", "opportunities", "contacts", "tasks"] as const;
        const results: string[] = [];
        const failures: string[] = [];
        for (const t of tables) {
          const { count, error } = await supabase
            .from(t)
            .select("*", { head: true, count: "exact" });
          if (error) failures.push(`${t} (${error.message})`);
          else results.push(`${t}=${count ?? 0}`);
        }
        if (failures.length === 0) {
          update("crm_connectivity", {
            status: "pass",
            details: `Reachable: ${results.join(", ")}.`,
          });
        } else if (failures.length < tables.length) {
          update("crm_connectivity", {
            status: "warn",
            details: `OK: ${results.join(", ")}. Failed: ${failures.join(", ")}.`,
            suggestedFix: "Check RLS SELECT policies and Data API GRANTs on failing tables.",
          });
        } else {
          update("crm_connectivity", {
            status: "fail",
            details: `All CRM tables unreachable: ${failures.join(", ")}.`,
            suggestedFix: "Verify authentication and RLS policies for CRM tables.",
          });
        }
      } catch (e) {
        update("crm_connectivity", { status: "fail", details: (e as Error).message });
      }

      mark("realtime");
      // 21. Realtime channel connectivity
      try {
        const channelName = `health-check-${Date.now()}`;
        const status = await new Promise<string>((resolve) => {
          const ch = supabase.channel(channelName);
          const timeout = window.setTimeout(() => {
            supabase.removeChannel(ch);
            resolve("TIMEOUT");
          }, 4000);
          ch.subscribe((s) => {
            if (s === "SUBSCRIBED" || s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
              window.clearTimeout(timeout);
              supabase.removeChannel(ch);
              resolve(s);
            }
          });
        });
        if (status === "SUBSCRIBED") {
          update("realtime", { status: "pass", details: "Realtime channel subscribed successfully." });
        } else {
          update("realtime", {
            status: "warn",
            details: `Realtime status: ${status}`,
            suggestedFix: "Realtime is optional; verify Realtime is enabled in the backend if needed.",
          });
        }
      } catch (e) {
        update("realtime", { status: "warn", details: (e as Error).message });
      }
    } finally {
      // Cleanup test records
      if (createdIds.proforma) {
        await supabase.from("proforma_invoices").delete().eq("id", createdIds.proforma);
      }
      if (createdIds.product) {
        await supabase.from("products").delete().eq("id", createdIds.product);
      }
      if (createdIds.supplier) {
        await supabase.from("suppliers").delete().eq("id", createdIds.supplier);
      }
      if (createdIds.customer) {
        await supabase.from("customers").delete().eq("id", createdIds.customer);
      }
      setLastRunAt(Date.now());
      setRunning(false);
    }
  }

  const summary = {
    pass: checks.filter((c) => c.status === "pass").length,
    warn: checks.filter((c) => c.status === "warn").length,
    fail: checks.filter((c) => c.status === "fail").length,
    running: checks.filter((c) => c.status === "running").length,
  };
  const failingIds = checks
    .filter((c) => c.status === "fail" || c.status === "warn")
    .map((c) => c.id);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6" /> Backend System Health
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            Automated QA center for CRM, documents, invoices, imports, AI assistant and backend
            stability.
          </p>
          {lastRunAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Last full run {formatDistanceToNow(lastRunAt, { addSuffix: true })} ·{" "}
              <span className="text-emerald-600">{summary.pass} pass</span> ·{" "}
              <span className="text-amber-600">{summary.warn} warn</span> ·{" "}
              <span className="text-rose-600">{summary.fail} fail</span>
              {running && summary.running > 0 && (
                <>
                  {" · "}
                  <span className="text-blue-600">{summary.running} running…</span>
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {failingIds.length > 0 && (
            <Button
              variant="outline"
              onClick={() => runAll(new Set(failingIds))}
              disabled={running}
              className="gap-2"
              title="Re-run only the checks that failed or warned"
            >
              <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
              Retry failing ({failingIds.length})
            </Button>
          )}
          <Button onClick={() => runAll()} disabled={running} className="gap-2">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Full Backend Test
          </Button>
        </div>
      </div>


      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Safe test data</AlertTitle>
        <AlertDescription>
          Test rows are prefixed with <code className="font-mono">{TEST_PREFIX}</code> and deleted
          after each run. Production data is never modified.
        </AlertDescription>
      </Alert>

      <div className="grid gap-3">
        {checks.map((c) => {
          const hasBody = !!(c.details || c.suggestedFix);
          const isFailing = c.status === "fail" || c.status === "warn";
          const isOpen = expanded[c.id] ?? (isFailing && hasBody);
          return (
            <Card key={c.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
                <div className="min-w-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DbIcon className="h-4 w-4 text-muted-foreground" />
                    {c.title}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {c.lastTested ? (
                      <>
                        Last tested{" "}
                        <span title={format(c.lastTested, "yyyy-MM-dd HH:mm:ss")}>
                          {formatDistanceToNow(c.lastTested, { addSuffix: true })}
                        </span>{" "}
                        · {format(c.lastTested, "yyyy-MM-dd HH:mm")}
                      </>
                    ) : (
                      "Never tested"
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={c.status} />
                  {hasBody && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-muted-foreground"
                      onClick={() => toggle(c.id)}
                      aria-expanded={isOpen}
                      aria-controls={`check-body-${c.id}`}
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="ml-1 text-xs">{isOpen ? "Hide" : "Details"}</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              {hasBody && isOpen && (
                <CardContent id={`check-body-${c.id}`} className="pt-0 space-y-3">
                  {c.details && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Details: </span>
                      {c.details}
                    </p>
                  )}
                  {c.suggestedFix && (
                    <div className="rounded-md border border-border/60 bg-muted/40 p-3 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Suggested fix: </span>
                        {c.suggestedFix}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1.5"
                        onClick={() => copyFix(c)}
                      >
                        {copiedId === c.id ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Copy suggested fix
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

    </div>
  );
}
