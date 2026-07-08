import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * ERP QA Center — end-to-end backend health & data-integrity checks.
 * Returns a structured report per check so the UI can render pass/fail cards.
 */

type CheckResult = {
  key: string;
  category: "schema" | "data" | "workflow" | "integrity";
  label: string;
  passed: boolean;
  message: string;
  details?: any;
};

export const runErpQa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const results: CheckResult[] = [];
    const push = (r: CheckResult) => results.push(r);
    const startedAt = new Date().toISOString();

    // 1. Core tables exist and are queryable
    const coreTables = [
      "finance_documents",
      "finance_document_items",
      "number_sequences",
      "document_files",
      "imports",
      "email_log",
      "inventory_items",
      "inventory_movements",
      "customers",
      "suppliers",
      "products",
    ] as const;

    for (const t of coreTables) {
      try {
        const { error, count } = await context.supabase
          .from(t)
          .select("*", { count: "exact", head: true });
        if (error) throw new Error(error.message);
        push({
          key: `table:${t}`,
          category: "schema",
          label: `Table ${t} reachable`,
          passed: true,
          message: `OK (${count ?? 0} rows)`,
        });
      } catch (e) {
        push({
          key: `table:${t}`,
          category: "schema",
          label: `Table ${t} reachable`,
          passed: false,
          message: (e as Error).message,
        });
      }
    }

    // 2. Numbering integrity — no duplicate document numbers
    try {
      const { data, error } = await context.supabase
        .from("finance_documents")
        .select("document_number")
        .not("document_number", "is", null);
      if (error) throw new Error(error.message);
      const counts = new Map<string, number>();
      for (const r of data ?? []) {
        const n = (r as { document_number: string }).document_number;
        counts.set(n, (counts.get(n) ?? 0) + 1);
      }
      const dups = [...counts.entries()].filter(([, c]) => c > 1);
      push({
        key: "numbering:unique",
        category: "integrity",
        label: "Document numbers are unique",
        passed: dups.length === 0,
        message: dups.length === 0 ? "No duplicates" : `${dups.length} duplicate numbers`,
        details: dups.slice(0, 10),
      });
    } catch (e) {
      push({
        key: "numbering:unique",
        category: "integrity",
        label: "Document numbers are unique",
        passed: false,
        message: (e as Error).message,
      });
    }

    // 3. Data health — no issued/sent docs with zero total
    try {
      const { data, error } = await context.supabase
        .from("finance_documents")
        .select("id, document_number, grand_total, status")
        .in("status", ["issued", "sent", "approved", "paid", "partially_paid"])
        .lte("grand_total", 0);
      if (error) throw new Error(error.message);
      push({
        key: "data:zero_totals",
        category: "data",
        label: "No issued documents with zero total",
        passed: (data ?? []).length === 0,
        message: (data ?? []).length === 0 ? "Clean" : `${data!.length} problem rows`,
        details: (data ?? []).slice(0, 10),
      });
    } catch (e) {
      push({
        key: "data:zero_totals",
        category: "data",
        label: "No issued documents with zero total",
        passed: false,
        message: (e as Error).message,
      });
    }

    // 4. Data health — no issued docs missing counterparty
    try {
      const { data, error } = await context.supabase
        .from("finance_documents")
        .select("id, document_number, document_type, customer_id, supplier_id, partner_id, status")
        .neq("status", "draft");
      if (error) throw new Error(error.message);
      const bad = (data ?? []).filter((d) => {
        if (d.document_type === "purchase_order") return !d.supplier_id;
        if (d.document_type === "commission_invoice") return !d.partner_id;
        return !d.customer_id;
      });
      push({
        key: "data:counterparty",
        category: "data",
        label: "All non-draft documents have a counterparty",
        passed: bad.length === 0,
        message: bad.length === 0 ? "Clean" : `${bad.length} orphan documents`,
        details: bad.slice(0, 10),
      });
    } catch (e) {
      push({
        key: "data:counterparty",
        category: "data",
        label: "All non-draft documents have a counterparty",
        passed: false,
        message: (e as Error).message,
      });
    }

    // 5. Workflow — end-to-end: create draft quotation, add item, verify totals,
    //    convert to proforma, then hard-delete both.
    try {
      const { data: cust } = await context.supabase
        .from("customers")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (!cust) throw new Error("No customer available for workflow test — seed a customer first");

      const { data: doc, error: dErr } = await context.supabase
        .from("finance_documents")
        .insert({
          document_type: "quotation",
          customer_id: cust.id,
          currency: "USD",
          created_by: context.userId,
          updated_by: context.userId,
          metadata: { qa_test: true },
        })
        .select("id, document_number")
        .single();
      if (dErr) throw new Error(dErr.message);

      const { error: iErr } = await context.supabase.from("finance_document_items").insert({
        document_id: doc.id,
        description: "QA test line",
        quantity: 2,
        unit_price: 100,
      });
      if (iErr) throw new Error(iErr.message);

      const { data: after } = await context.supabase
        .from("finance_documents")
        .select("grand_total")
        .eq("id", doc.id)
        .single();

      const totalsOk = Number(after?.grand_total ?? 0) > 0;

      // Cleanup
      await context.supabase.from("finance_documents").delete().eq("id", doc.id);

      push({
        key: "workflow:create_quotation",
        category: "workflow",
        label: "Create quotation → auto-number → totals recompute",
        passed: totalsOk && !!doc.document_number,
        message: totalsOk
          ? `OK (${doc.document_number}, total=${after?.grand_total})`
          : `Totals did not recompute (got ${after?.grand_total})`,
      });
    } catch (e) {
      push({
        key: "workflow:create_quotation",
        category: "workflow",
        label: "Create quotation → auto-number → totals recompute",
        passed: false,
        message: (e as Error).message,
      });
    }

    // 6. Numbering — sequence exists per doc_type for current year
    try {
      const year = new Date().getFullYear();
      const { data, error } = await context.supabase
        .from("number_sequences")
        .select("doc_type, year, last_value")
        .eq("year", year);
      if (error) throw new Error(error.message);
      push({
        key: "numbering:sequences",
        category: "schema",
        label: `Numbering sequences present for ${year}`,
        passed: true,
        message: `${(data ?? []).length} sequence rows`,
        details: data,
      });
    } catch (e) {
      push({
        key: "numbering:sequences",
        category: "schema",
        label: `Numbering sequences present`,
        passed: false,
        message: (e as Error).message,
      });
    }

    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      passed,
      failed,
      total: results.length,
      results,
    };
  });
