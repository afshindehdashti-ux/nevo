import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { financeTotalAmount } from "./finance-normalization";

const DocType = z.enum([
  "quotation",
  "proforma_invoice",
  "commercial_invoice",
  "purchase_order",
  "commission_invoice",
]);

const DocStatus = z.enum([
  "draft",
  "pending_approval",
  "approved",
  "issued",
  "sent",
  "partially_paid",
  "paid",
  "overdue",
  "converted",
  "cancelled",
  "void",
]);

const ItemInput = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid().nullable().optional(),
  item_code: z.string().nullable().optional(),
  description: z.string().min(1),
  hs_code: z.string().nullable().optional(),
  quantity: z.number().positive(),
  unit: z.string().nullable().optional(),
  unit_price: z.number().min(0),
  discount_percent: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
  tax_percent: z.number().min(0).max(100).optional(),
  sort_order: z.number().int().optional(),
});

const DocumentInput = z.object({
  id: z.string().uuid().optional(),
  document_type: DocType,
  customer_id: z.string().uuid().nullable().optional(),
  supplier_id: z.string().uuid().nullable().optional(),
  partner_id: z.string().uuid().nullable().optional(),
  source_document_id: z.string().uuid().nullable().optional(),
  issue_date: z.string().optional(),
  valid_until: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  currency: z.string().max(8).optional(),
  incoterms: z.string().nullable().optional(),
  payment_terms: z.string().nullable().optional(),
  delivery_terms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  internal_notes: z.string().nullable().optional(),
  status: DocStatus.optional(),
  items: z.array(ItemInput).optional(),
});

export const listFinanceDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { document_type?: string; status?: string; limit?: number } | undefined) => v ?? {})
  .handler(async ({ data, context }) => {
    let q: any = context.supabase
      .from("finance_documents")
      .select(
        "id, document_type, document_number, status, issue_date, valid_until, due_date, currency, subtotal, discount_total, tax_total, shipping_total, grand_total, amount_paid, balance, customer_id, supplier_id, partner_id, source_document_id, created_at, updated_at, customers(company_name, name, email), suppliers(name, email), finance_document_items(count)"
      )
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.document_type) q = q.eq("document_type", data.document_type);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as any[];
  });

export const getFinanceDocument = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string }) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: doc, error } = await context.supabase
      .from("finance_documents")
      .select(
        "*, customers(id, company_name, name, email, phone, address_line1, country), suppliers(id, name, email, phone), partners(id, company_name), finance_document_items(*)"
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc) throw new Error("Document not found");
    return doc;
  });

async function ensureCounterparty(input: z.infer<typeof DocumentInput>) {
  if (input.document_type === "purchase_order") {
    if (!input.supplier_id) throw new Error("Purchase orders require a supplier");
  } else if (input.document_type === "commission_invoice") {
    if (!input.partner_id) throw new Error("Commission invoices require a partner");
  } else {
    if (!input.customer_id) throw new Error("This document requires a customer");
  }
}

export const upsertFinanceDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => DocumentInput.parse(v))
  .handler(async ({ data, context }) => {
    await ensureCounterparty(data);
    const { items, id, ...header } = data;
    const payload: any = { ...header, updated_by: context.userId };
    let docId = id;
    if (id) {
      const { error } = await (context.supabase.from("finance_documents") as any).update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      payload.created_by = context.userId;
      const { data: ins, error } = await (context.supabase.from("finance_documents") as any)
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      docId = ins.id;
    }

    if (items) {
      const { error: delErr } = await context.supabase
        .from("finance_document_items")
        .delete()
        .eq("document_id", docId!);
      if (delErr) throw new Error(delErr.message);
      if (items.length) {
        const rows = items.map((it, idx) => ({
          document_id: docId!,
          product_id: it.product_id ?? null,
          item_code: it.item_code ?? null,
          description: it.description,
          hs_code: it.hs_code ?? null,
          quantity: it.quantity,
          unit: it.unit ?? null,
          unit_price: it.unit_price,
          discount_percent: it.discount_percent ?? 0,
          discount_amount: it.discount_amount ?? 0,
          tax_percent: it.tax_percent ?? 0,
          sort_order: it.sort_order ?? idx,
        }));
        const { error: insErr } = await (context.supabase.from("finance_document_items") as any).insert(rows);
        if (insErr) throw new Error(insErr.message);
      }
    }
    return { id: docId! };
  });

export const addFinanceDocumentItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ document_id: z.string().uuid(), item: ItemInput }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("finance_document_items")
      .insert({
        document_id: data.document_id,
        product_id: data.item.product_id ?? null,
        item_code: data.item.item_code ?? null,
        description: data.item.description,
        hs_code: data.item.hs_code ?? null,
        quantity: data.item.quantity,
        unit: data.item.unit ?? null,
        unit_price: data.item.unit_price,
        discount_percent: data.item.discount_percent ?? 0,
        discount_amount: data.item.discount_amount ?? 0,
        tax_percent: data.item.tax_percent ?? 0,
        sort_order: data.item.sort_order ?? 0,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const removeFinanceDocumentItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("finance_document_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Status transition state machine -----------------------------------
// "calculated" is not a persisted enum value in the DB; it's an implicit
// gate — draft docs with a non-zero grand_total and complete counterparty
// data are considered "calculated" and eligible for issue.
const TRANSITIONS: Record<string, string[]> = {
  draft: ["pending_approval", "issued", "cancelled"],
  pending_approval: ["approved", "draft", "cancelled"],
  approved: ["issued", "draft", "cancelled"],
  issued: ["sent", "partially_paid", "paid", "overdue", "converted", "cancelled", "void"],
  sent: ["partially_paid", "paid", "overdue", "converted", "cancelled", "void"],
  partially_paid: ["paid", "overdue", "void"],
  overdue: ["partially_paid", "paid", "void"],
  paid: ["converted", "void"],
  converted: ["void"],
  cancelled: ["draft"],
  void: [],
};

// Which roles can perform status changes on which document types.
// admin/super_admin/management/finance can do everything; sales owns the
// quotation lifecycle; operations owns purchase orders; read_only cannot.
const STATUS_ROLES: Record<string, string[]> = {
  quotation: ["admin", "super_admin", "management", "finance", "sales"],
  proforma_invoice: ["admin", "super_admin", "management", "finance", "sales"],
  commercial_invoice: ["admin", "super_admin", "management", "finance"],
  purchase_order: ["admin", "super_admin", "management", "finance", "operations"],
  commission_invoice: ["admin", "super_admin", "management", "finance"],
};

async function userHasAnyRole(
  supabase: any,
  userId: string,
  roles: string[],
): Promise<boolean> {
  for (const role of roles) {
    const { data } = await supabase.rpc("current_user_has_role", { _role: role });
    if (data === true) return true;
  }
  return false;
}

async function writeStatusLog(
  supabase: any,
  userId: string,
  doc: { id: string; document_type: string; document_number?: string | null },
  from: string,
  to: string,
  reason: string | null,
) {
  try {
    await supabase.from("activity_logs").insert({
      user_id: userId,
      action: "status_change",
      entity_type: `finance_document:${doc.document_type}`,
      entity_id: doc.id,
      metadata: {
        document_number: doc.document_number ?? null,
        from_status: from,
        to_status: to,
        reason: reason ?? null,
      },
    });
  } catch (err) {
    console.warn("finance status_change activity log failed", err);
  }
}

export const changeFinanceDocumentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: DocStatus,
        reason: z.string().max(500).nullable().optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: doc, error: fErr } = await context.supabase
      .from("finance_documents")
      .select(
        "id, document_type, document_number, status, grand_total, customer_id, supplier_id, partner_id",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (fErr) throw new Error(fErr.message);
    if (!doc) throw new Error("Document not found");

    const from = doc.status as string;
    const to = data.status;
    if (from === to) return { ok: true, unchanged: true };

    // Permission check
    const allowedRoles = STATUS_ROLES[doc.document_type] ?? [
      "admin",
      "super_admin",
      "management",
      "finance",
    ];
    const permitted = await userHasAnyRole(context.supabase, context.userId, allowedRoles);
    if (!permitted) {
      throw new Error(
        `Your role is not permitted to change the status of ${doc.document_type.replace("_", " ")} documents`,
      );
    }

    // Transition validity
    const allowedNext = TRANSITIONS[from] ?? [];
    if (!allowedNext.includes(to)) {
      throw new Error(`Cannot transition from "${from}" to "${to}"`);
    }

    // Guardrails when moving into an externally-visible state
    if (["issued", "sent", "approved"].includes(to)) {
      if (financeTotalAmount(doc) <= 0) {
        throw new Error("Document total must be greater than zero — recalculate before issuing");
      }
      const needsCustomer = ["quotation", "proforma_invoice", "commercial_invoice"].includes(
        doc.document_type,
      );
      if (needsCustomer && !doc.customer_id) throw new Error("Missing customer");
      if (doc.document_type === "purchase_order" && !doc.supplier_id)
        throw new Error("Missing supplier");
      if (doc.document_type === "commission_invoice" && !doc.partner_id)
        throw new Error("Missing partner");
    }

    const { error } = await context.supabase
      .from("finance_documents")
      .update({ status: to, updated_by: context.userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await writeStatusLog(context.supabase, context.userId, doc as any, from, to, data.reason ?? null);
    return { ok: true, from, to };
  });

/**
 * Report allowed next statuses for a document based on current status,
 * document type, and the caller's roles. UI uses this to render the
 * status-change menu without duplicating the transition matrix.
 */
export const getAllowedStatusTransitions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string }) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: doc, error } = await context.supabase
      .from("finance_documents")
      .select("id, document_type, status")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc) throw new Error("Document not found");
    const allowedRoles = STATUS_ROLES[doc.document_type] ?? [
      "admin",
      "super_admin",
      "management",
      "finance",
    ];
    const permitted = await userHasAnyRole(context.supabase, context.userId, allowedRoles);
    return {
      current: doc.status,
      allowed: permitted ? TRANSITIONS[doc.status as string] ?? [] : [],
      permitted,
    };
  });

const CONVERSION_MAP: Record<string, string[]> = {
  quotation: ["proforma_invoice", "commercial_invoice"],
  proforma_invoice: ["commercial_invoice"],
};

export const convertFinanceDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ id: z.string().uuid(), target_type: DocType }).parse(v)
  )
  .handler(async ({ data, context }) => {
    const { data: src, error } = await context.supabase
      .from("finance_documents")
      .select("*, finance_document_items(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!src) throw new Error("Source document not found");
    const allowed = CONVERSION_MAP[src.document_type] ?? [];
    if (!allowed.includes(data.target_type)) {
      throw new Error(`Cannot convert ${src.document_type} to ${data.target_type}`);
    }

    const { data: newDoc, error: insErr } = await context.supabase
      .from("finance_documents")
      .insert({
        document_type: data.target_type,
        status: "draft",
        customer_id: src.customer_id,
        supplier_id: src.supplier_id,
        partner_id: src.partner_id,
        source_document_id: src.id,
        currency: src.currency,
        incoterms: src.incoterms,
        payment_terms: src.payment_terms,
        delivery_terms: src.delivery_terms,
        notes: src.notes,
        created_by: context.userId,
        updated_by: context.userId,
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);

    const items = (src.finance_document_items ?? []) as Array<Record<string, unknown>>;
    if (items.length) {
      const rows = items.map((it) => ({
        document_id: newDoc.id,
        product_id: it.product_id ?? null,
        item_code: it.item_code ?? null,
        description: it.description,
        hs_code: it.hs_code ?? null,
        quantity: it.quantity,
        unit: it.unit ?? null,
        unit_price: it.unit_price,
        discount_percent: it.discount_percent ?? 0,
        discount_amount: it.discount_amount ?? 0,
        tax_percent: it.tax_percent ?? 0,
        sort_order: it.sort_order ?? 0,
      }));
      const { error: itemsErr } = await (context.supabase
        .from("finance_document_items") as any)
        .insert(rows);
      if (itemsErr) throw new Error(itemsErr.message);
    }

    await context.supabase
      .from("finance_documents")
      .update({ status: "converted", updated_by: context.userId })
      .eq("id", src.id);

    await writeStatusLog(
      context.supabase,
      context.userId,
      { id: src.id, document_type: src.document_type, document_number: src.document_number },
      src.status,
      "converted",
      `Converted to ${data.target_type}`,
    );

    return { id: newDoc.id };
  });

/**
 * One-click "start a Purchase Order from a supplier": creates a draft
 * `finance_documents` PO pre-populated with the supplier's currency and
 * payment terms. Items are left empty for the user to fill in — a supplier
 * has no line items to copy, unlike the quote/proforma/invoice chain.
 * Idempotency isn't enforced: users can legitimately create many POs for
 * the same supplier.
 */
export const createPurchaseOrderFromSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        supplier_id: z.string().uuid(),
        currency: z.string().max(8).optional(),
        payment_terms: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { data: supplier, error: sErr } = await context.supabase
      .from("suppliers")
      .select("id, name, currency, payment_terms, is_active")
      .eq("id", data.supplier_id)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!supplier) throw new Error("Supplier not found");
    if (supplier.is_active === false) throw new Error("Supplier is inactive");

    const { data: ins, error } = await (context.supabase.from("finance_documents") as any)
      .insert({
        document_type: "purchase_order",
        status: "draft",
        supplier_id: supplier.id,
        currency: data.currency ?? supplier.currency ?? "USD",
        payment_terms: data.payment_terms ?? supplier.payment_terms ?? null,
        notes: data.notes ?? null,
        created_by: context.userId,
        updated_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    try {
      await context.supabase.from("activity_logs").insert({
        user_id: context.userId,
        action: "create",
        entity_type: "purchase_order_from_supplier",
        entity_id: ins.id,
        metadata: {
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          currency: data.currency ?? supplier.currency,
        },
      });
    } catch (err) {
      console.warn("createPurchaseOrderFromSupplier activity log failed", err);
    }

    return { id: ins.id as string };
  });

export const deleteFinanceDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("finance_documents")
      .select("status")
      .eq("id", data.id)
      .maybeSingle();
    if (doc && !["draft", "cancelled", "void"].includes(doc.status)) {
      throw new Error("Only draft, cancelled, or void documents can be deleted");
    }
    const { error } = await context.supabase.from("finance_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
