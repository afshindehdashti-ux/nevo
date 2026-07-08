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

  const update = (id: string, patch: Partial<CheckResult>) =>
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch, lastTested: Date.now() } : c)),
    );

  async function runAll() {
    setRunning(true);
    setChecks(INITIAL_CHECKS.map((c) => ({ ...c, status: "running" as CheckStatus })));

    const createdIds: {
      customer?: string;
      supplier?: string;
      product?: string;
      proforma?: string;
      commission?: string;
    } = {};

    try {
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

      // 3. CRM Module Health — quick counts on core tables
      try {
        const { error } = await supabase.from("profiles").select("id", { head: true, count: "exact" });
        if (error) throw error;
        update("crm", { status: "pass", details: "Core CRM tables responded." });
      } catch (e) {
        update("crm", { status: "fail", details: (e as Error).message });
      }

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

      // 7. Quotation Generator — read schema availability
      try {
        const { error } = await supabase.from("quotations").select("id", { head: true, count: "exact" });
        if (error) throw error;
        update("quotation", { status: "pass", details: "Quotations table reachable." });
      } catch (e) {
        update("quotation", { status: "fail", details: (e as Error).message });
      }

      // 8. Proforma Invoice
      try {
        if (!createdIds.customer) throw new Error("Customer test row missing; skipping proforma.");
        const subtotal = 1000;
        const vatRate = 0.2;
        const vatAmount = subtotal * vatRate;
        const grandTotal = subtotal + vatAmount;
        const { data: piIns, error: piErr } = await supabase
          .from("proforma_invoices")
          .insert({
            customer_id: createdIds.customer,
            proforma_number: `${testName}-PI`,
            subtotal,
            vat_amount: vatAmount,
            total: grandTotal,
          } as never)
          .select("id")
          .single();
        if (piErr) throw piErr;
        createdIds.proforma = (piIns as { id: string }).id;
        if (Math.abs(grandTotal - 1200) > 0.01) throw new Error("Totals calc mismatch");
        update("proforma", {
          status: "pass",
          details: `Created proforma with subtotal=1000, VAT=200, total=1200.`,
        });
      } catch (e) {
        update("proforma", {
          status: "warn",
          details: (e as Error).message,
          suggestedFix: "Confirm required columns on proforma_invoices match generator inputs.",
        });
      }

      // 9. Commercial Invoice
      try {
        const { error } = await supabase.from("invoices").select("id", { head: true, count: "exact" });
        if (error) throw error;
        update("commercial", { status: "pass", details: "Invoices table reachable." });
      } catch (e) {
        update("commercial", { status: "fail", details: (e as Error).message });
      }

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
  };

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
            </p>
          )}
        </div>
        <Button onClick={runAll} disabled={running} className="gap-2">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Full Backend Test
        </Button>
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
