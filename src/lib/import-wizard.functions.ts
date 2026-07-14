import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  IMPORT_SCHEMAS,
  type ImportField,
  type ImportEntitySchema,
  SUPPORTED_IMPORT_TYPES,
} from "./import-schemas";

/* -------------------------------------------------------------------------- */
/* Coercion                                                                    */
/* -------------------------------------------------------------------------- */

function coerce(field: ImportField, raw: unknown): unknown {
  if (raw === null || raw === undefined || raw === "") {
    if (field.required) throw new Error(`Missing required field "${field.label}"`);
    return null;
  }
  const s = String(raw).trim();
  if (s === "") {
    if (field.required) throw new Error(`Missing required field "${field.label}"`);
    return null;
  }
  switch (field.type) {
    case "number": {
      const n = Number(s.replace(/[, ]/g, ""));
      if (!Number.isFinite(n)) throw new Error(`"${field.label}" is not a number: "${s}"`);
      return n;
    }
    case "boolean": {
      const l = s.toLowerCase();
      if (["true", "yes", "y", "1", "active"].includes(l)) return true;
      if (["false", "no", "n", "0", "inactive"].includes(l)) return false;
      throw new Error(`"${field.label}" is not a boolean: "${s}"`);
    }
    case "email": {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
        throw new Error(`"${field.label}" is not a valid email: "${s}"`);
      return s;
    }
    case "enum": {
      const l = s.toLowerCase().replace(/\s+/g, "_");
      if (!field.enumValues?.includes(l))
        throw new Error(
          `"${field.label}" must be one of ${field.enumValues?.join(", ")}, got "${s}"`,
        );
      return l;
    }
    case "date": {
      // Accept ISO, dd/mm/yyyy, mm/dd/yyyy, Excel serial number.
      const asNum = Number(s);
      if (Number.isFinite(asNum) && asNum > 20000 && asNum < 90000) {
        const d = new Date(Math.round((asNum - 25569) * 86400 * 1000));
        return d.toISOString().slice(0, 10);
      }
      const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
      const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
      if (dmy) {
        const yy = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
        // Assume dd/mm/yyyy (UAE convention) unless day > 12 and month <= 12.
        const a = Number(dmy[1]);
        const b = Number(dmy[2]);
        const [day, mon] = a > 12 ? [a, b] : [a, b]; // still dd/mm — we default UAE style
        return `${yy}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      throw new Error(`"${field.label}" is not a valid date: "${s}"`);
    }
    default:
      return s;
  }
}

/* -------------------------------------------------------------------------- */
/* Input contract                                                              */
/* -------------------------------------------------------------------------- */

const RowsInput = z.object({
  import_type: z.enum(SUPPORTED_IMPORT_TYPES as [string, ...string[]]),
  file_name: z.string().min(1).max(300),
  mode: z.enum(["create", "upsert", "skip_duplicates"]).default("create"),
  mapping: z.record(z.string(), z.string()),
  rows: z
    .array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])))
    .min(1)
    .max(5000),
});
type ImportInput = z.infer<typeof RowsInput>;

/* -------------------------------------------------------------------------- */
/* Per-type doc configs for the generalized hierarchical import                */
/* -------------------------------------------------------------------------- */

type DocConfig = {
  parentTable: string;
  itemsTable: string;
  itemsFkCol: string;
  numberField: string;
  numberCol: string;
  requiresCustomer: boolean;
  requiresOrder?: boolean;
  // Map schema field key -> db column on parent (default identity)
  parentColMap?: Record<string, string>;
  // Map schema field key -> db column on items
  itemsColMap?: Record<string, string>;
  // Build a parent insert payload from resolved fields
  buildParent: (args: {
    header: Record<string, unknown>;
    customerId?: string;
    orderId?: string;
    subtotal: number;
    vatAmount: number;
    total: number;
    vatRate: number;
    userId: string;
  }) => Record<string, unknown>;
  // Build items rows (already computed)
  buildItem?: (
    item: Record<string, unknown>,
    idx: number,
    parentId: string,
  ) => Record<string, unknown>;
};

const DOC_CONFIGS: Record<string, DocConfig> = {
  quotations: {
    parentTable: "quotations",
    itemsTable: "quotation_items",
    itemsFkCol: "quotation_id",
    numberField: "quotation_number",
    numberCol: "quotation_number",
    requiresCustomer: true,
    buildParent: ({ header, customerId, subtotal, vatAmount, total, vatRate, userId }) => ({
      quotation_number: header.quotation_number,
      customer_id: customerId,
      issue_date: header.issue_date ?? new Date().toISOString().slice(0, 10),
      valid_until: header.valid_until ?? null,
      currency: header.currency ?? "USD",
      vat_rate: vatRate,
      vat_amount: vatAmount,
      subtotal,
      total,
      status: (header.status as string) ?? "draft",
      terms: header.terms ?? null,
      notes: header.notes ?? null,
      created_by: userId,
    }),
  },
  proforma_invoices: {
    parentTable: "proforma_invoices",
    itemsTable: "proforma_invoice_items",
    itemsFkCol: "proforma_invoice_id",
    numberField: "proforma_number",
    numberCol: "proforma_number",
    requiresCustomer: true,
    buildParent: ({ header, customerId, subtotal, vatAmount, total, vatRate, userId }) => ({
      proforma_number: header.proforma_number,
      customer_id: customerId,
      status: (header.status as string) ?? "draft",
      currency: header.currency ?? "USD",
      subtotal,
      discount_total: 0,
      tax_total: vatAmount,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      discount_amount: 0,
      total,
      grand_total: total,
      amount_paid: 0,
      balance_due: total,
      payment_status: "unpaid",
      valid_until: header.valid_until ?? null,
      payment_terms: header.payment_terms ?? null,
      delivery_terms: header.delivery_terms ?? null,
      incoterms: header.incoterms ?? null,
      notes: header.notes ?? null,
      created_by: userId,
    }),
    itemsColMap: {
      // proforma_invoice_items uses `discount` + `tax_rate` naming
      discount_pct: "discount",
    },
    buildItem: (item, idx, parentId) => ({
      proforma_invoice_id: parentId,
      item_code: item.item_code ?? null,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit ?? "pc",
      unit_price: item.unit_price,
      discount: item.discount_pct ?? 0,
      discount_amount: 0,
      tax_rate: item.vat_pct ?? 0,
      line_total: item.line_total,
      sort_order: idx + 1,
    }),
  },
  invoices: {
    parentTable: "invoices",
    itemsTable: "invoice_items",
    itemsFkCol: "invoice_id",
    numberField: "invoice_number",
    numberCol: "invoice_number",
    requiresCustomer: true,
    buildParent: ({ header, customerId, subtotal, vatAmount, total, vatRate, userId }) => ({
      invoice_number: header.invoice_number,
      customer_id: customerId,
      type: "commercial",
      status: (header.status as string) ?? "draft",
      issue_date: header.issue_date ?? new Date().toISOString().slice(0, 10),
      due_date: header.due_date ?? null,
      currency: header.currency ?? "USD",
      subtotal,
      discount_total: 0,
      tax_total: vatAmount,
      vat_amount: vatAmount,
      total,
      amount_paid: 0,
      balance: total,
      payment_status: "unpaid",
      payment_terms: header.payment_terms ?? null,
      notes: header.notes ?? null,
      created_by: userId,
      // vat_rate isn't a column on invoices; carried per-line
      _vatRate: vatRate,
    }),
    itemsColMap: { discount_pct: "discount" },
    buildItem: (item, idx, parentId) => ({
      invoice_id: parentId,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit ?? "pc",
      unit_price: item.unit_price,
      discount_pct: item.discount_pct ?? 0,
      vat_pct: item.vat_pct ?? 0,
      discount: item.discount_pct ?? 0,
      tax_rate: item.vat_pct ?? 0,
      line_total: item.line_total,
      position: idx + 1,
      sort_order: idx + 1,
    }),
  },
  orders: {
    parentTable: "orders",
    itemsTable: "order_items",
    itemsFkCol: "order_id",
    numberField: "order_number",
    numberCol: "order_number",
    requiresCustomer: true,
    buildParent: ({ header, customerId, subtotal, vatAmount, total, userId }) => ({
      order_number: header.order_number,
      customer_id: customerId,
      status: (header.status as string) ?? "draft",
      order_date: header.order_date ?? new Date().toISOString().slice(0, 10),
      requested_delivery: header.requested_delivery ?? null,
      currency: header.currency ?? "USD",
      incoterm: header.incoterm ?? null,
      subtotal,
      vat_amount: vatAmount,
      total,
      notes: header.notes ?? null,
      created_by: userId,
    }),
    buildItem: (item, idx, parentId) => ({
      order_id: parentId,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit ?? "pc",
      unit_price: item.unit_price,
      discount_pct: item.discount_pct ?? 0,
      vat_pct: item.vat_pct ?? 0,
      line_total: item.line_total,
      position: idx + 1,
    }),
  },
  shipments: {
    parentTable: "shipments",
    itemsTable: "shipment_items",
    itemsFkCol: "shipment_id",
    numberField: "shipment_number",
    numberCol: "shipment_number",
    requiresCustomer: false,
    requiresOrder: true,
    buildParent: ({ header, orderId, userId }) => ({
      shipment_number: header.shipment_number,
      order_id: orderId,
      status: (header.status as string) ?? "pending",
      carrier: header.carrier ?? null,
      tracking_no: header.tracking_no ?? null,
      incoterm: header.incoterm ?? null,
      container_no: header.container_no ?? null,
      bl_number: header.bl_number ?? null,
      shipped_at: header.shipped_at ?? null,
      delivered_at: header.delivered_at ?? null,
      notes: header.notes ?? null,
      created_by: userId,
    }),
    buildItem: (item, _idx, parentId) => ({
      shipment_id: parentId,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit ?? "pc",
    }),
  },
};

/* -------------------------------------------------------------------------- */
/* Server fn                                                                   */
/* -------------------------------------------------------------------------- */

export const runImportJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RowsInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const schema = IMPORT_SCHEMAS[data.import_type];
    if (!schema) throw new Error(`Unsupported import type: ${data.import_type}`);

    for (const f of schema.fields) {
      if (f.required && !data.mapping[f.key]) {
        throw new Error(`Required column "${f.label}" is not mapped`);
      }
    }

    // Route to specialized handlers where applicable.
    if (schema.groupBy && DOC_CONFIGS[schema.key]) {
      return runHierarchicalImport({
        supabase,
        userId,
        data,
        schema,
        config: DOC_CONFIGS[schema.key],
      });
    }
    if (schema.key === "payments") {
      return runPaymentsImport({ supabase, userId, data, schema });
    }
    if (schema.key === "commission_invoices") {
      return runCommissionsImport({ supabase, userId, data, schema });
    }

    // Flat generic insert (customers, contacts, leads, suppliers, products).
    return runFlatImport({ supabase, userId, data, schema });
  });

/* -------------------------------------------------------------------------- */
/* Flat generic                                                                */
/* -------------------------------------------------------------------------- */

async function createJob(supabase: any, data: ImportInput) {
  const { data: job, error } = await supabase
    .from("import_jobs")
    .insert({
      import_type: data.import_type,
      file_name: data.file_name,
      mapping: data.mapping,
      mode: data.mode,
      status: "running",
      total_rows: data.rows.length,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !job) throw new Error(error?.message || "Failed to create import job");
  return job.id as string;
}

async function finishJob(
  supabase: any,
  jobId: string,
  totals: { success: number; failed: number; skipped: number; samples: string[] },
) {
  const finalStatus =
    totals.failed === 0 ? "completed" : totals.success === 0 ? "failed" : "completed";
  await supabase
    .from("import_jobs")
    .update({
      status: finalStatus,
      success_rows: totals.success,
      failed_rows: totals.failed,
      skipped_rows: totals.skipped,
      error_summary: totals.samples.length ? totals.samples.join("\n") : null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

async function runFlatImport({
  supabase,
  userId,
  data,
  schema,
}: {
  supabase: any;
  userId: string;
  data: ImportInput;
  schema: ImportEntitySchema;
}) {
  const jobId = await createJob(supabase, data);
  const totals = { success: 0, failed: 0, skipped: 0, samples: [] as string[] };

  for (let i = 0; i < data.rows.length; i++) {
    const raw = data.rows[i];
    const rowNumber = i + 1;
    const mapped: Record<string, unknown> = {};
    let error: string | null = null;
    let createdId: string | null = null;
    let status: "success" | "failed" | "skipped" = "success";

    try {
      for (const f of schema.fields) {
        const src = data.mapping[f.key];
        if (!src) continue;
        const value = coerce(f, raw[src]);
        if (value !== null) mapped[f.key] = value;
      }
      mapped.created_by = userId;
      const { data: ins, error: insErr } = await supabase
        .from(schema.table as never)
        .insert(mapped as never)
        .select("id")
        .single();
      if (insErr) throw new Error(insErr.message);
      createdId = (ins as { id: string } | null)?.id ?? null;
      totals.success++;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      if (data.mode === "skip_duplicates" && /duplicate|unique/i.test(error)) {
        status = "skipped";
        totals.skipped++;
      } else {
        status = "failed";
        totals.failed++;
        if (totals.samples.length < 10) totals.samples.push(`Row ${rowNumber}: ${error}`);
      }
    }

    await supabase.from("import_job_rows").insert({
      import_job_id: jobId,
      row_number: rowNumber,
      raw_data: raw,
      mapped_data: mapped as never,
      status,
      error_message: error,
      created_record_id: createdId,
    });
  }

  await finishJob(supabase, jobId, totals);
  return { job_id: jobId, ...totals, samples: undefined, total: data.rows.length };
}

/* -------------------------------------------------------------------------- */
/* Customer / order / invoice / partner resolvers                              */
/* -------------------------------------------------------------------------- */

function makeCustomerResolver(supabase: any, userId: string, autoCreate: boolean) {
  const cache = new Map<string, string>();
  return async (name: string): Promise<string> => {
    const key = name.trim().toLowerCase();
    if (cache.has(key)) return cache.get(key)!;
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .ilike("name", name.trim())
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      cache.set(key, existing.id);
      return existing.id;
    }
    if (!autoCreate) {
      throw new Error(`Customer "${name}" not found (mode does not auto-create)`);
    }
    const { data: created, error } = await supabase
      .from("customers")
      .insert({ name: name.trim(), company_name: name.trim(), created_by: userId })
      .select("id")
      .single();
    if (error || !created)
      throw new Error(`Failed to create customer "${name}": ${error?.message}`);
    cache.set(key, created.id);
    return created.id;
  };
}

async function resolveOrderId(supabase: any, orderNumber: string): Promise<string> {
  const { data } = await supabase
    .from("orders")
    .select("id")
    .ilike("order_number", orderNumber.trim())
    .limit(1)
    .maybeSingle();
  if (!data?.id) throw new Error(`Order "${orderNumber}" not found`);
  return data.id;
}

async function resolveInvoiceId(supabase: any, invoiceNumber: string) {
  const { data } = await supabase
    .from("invoices")
    .select("id, currency")
    .ilike("invoice_number", invoiceNumber.trim())
    .limit(1)
    .maybeSingle();
  if (!data?.id) throw new Error(`Invoice "${invoiceNumber}" not found`);
  return data as { id: string; currency: string };
}

async function resolvePartnerId(supabase: any, partnerName: string) {
  // Try partners then suppliers.
  const { data: p } = await supabase
    .from("partners")
    .select("id")
    .ilike("name", partnerName.trim())
    .limit(1)
    .maybeSingle();
  if (p?.id) return p.id as string;
  const { data: s } = await supabase
    .from("suppliers")
    .select("id")
    .ilike("name", partnerName.trim())
    .limit(1)
    .maybeSingle();
  if (s?.id) {
    // partner_commissions.partner_id references partners; if only supplier exists,
    // create a partner shell record so the FK holds.
    const { data: newP, error } = await supabase
      .from("partners")
      .insert({ name: partnerName.trim(), supplier_id: s.id })
      .select("id")
      .single();
    if (error || !newP)
      throw new Error(`Failed to link partner "${partnerName}": ${error?.message}`);
    return newP.id as string;
  }
  throw new Error(`Partner / supplier "${partnerName}" not found`);
}

/* -------------------------------------------------------------------------- */
/* Hierarchical (quotations, proformas, invoices, orders, shipments)           */
/* -------------------------------------------------------------------------- */

async function runHierarchicalImport({
  supabase,
  userId,
  data,
  schema,
  config,
}: {
  supabase: any;
  userId: string;
  data: ImportInput;
  schema: ImportEntitySchema;
  config: DocConfig;
}) {
  const groupField = schema.groupBy!;
  const headerKeys = new Set(schema.headerFields ?? []);
  const itemKeys = new Set(schema.itemFields ?? []);

  type MappedRow = {
    rowNumber: number;
    raw: (typeof data.rows)[number];
    mapped: Record<string, unknown>;
  };
  const groups = new Map<string, MappedRow[]>();
  const rowErrors: Array<{ rowNumber: number; error: string; raw: any }> = [];

  for (let i = 0; i < data.rows.length; i++) {
    const raw = data.rows[i];
    const rowNumber = i + 1;
    const mapped: Record<string, unknown> = {};
    try {
      for (const f of schema.fields) {
        const src = data.mapping[f.key];
        if (!src) continue;
        const value = coerce(f, raw[src]);
        if (value !== null) mapped[f.key] = value;
      }
      const gv = mapped[groupField];
      if (gv === undefined || gv === null || String(gv).trim() === "") {
        throw new Error(`Missing grouping value in "${groupField}"`);
      }
      const key = String(gv).trim();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ rowNumber, raw, mapped });
    } catch (e) {
      rowErrors.push({ rowNumber, error: (e as Error).message, raw });
    }
  }

  const jobId = await createJob(supabase, data);
  const totals = { success: 0, failed: 0, skipped: 0, samples: [] as string[] };

  for (const rf of rowErrors) {
    totals.failed++;
    if (totals.samples.length < 10) totals.samples.push(`Row ${rf.rowNumber}: ${rf.error}`);
    await supabase.from("import_job_rows").insert({
      import_job_id: jobId,
      row_number: rf.rowNumber,
      raw_data: rf.raw,
      mapped_data: {},
      status: "failed",
      error_message: rf.error,
      created_record_id: null,
    });
  }

  const autoCreateCustomer = data.mode === "create" || data.mode === "upsert";
  const resolveCustomer = makeCustomerResolver(supabase, userId, autoCreateCustomer);

  for (const [groupKey, rowsInGroup] of groups.entries()) {
    const firstRowNumber = rowsInGroup[0].rowNumber;
    try {
      // Header from first non-empty across the group.
      const header: Record<string, unknown> = {};
      for (const key of headerKeys) {
        for (const r of rowsInGroup) {
          const v = r.mapped[key];
          if (v !== undefined && v !== null && v !== "") {
            header[key] = v;
            break;
          }
        }
      }

      let customerId: string | undefined;
      if (config.requiresCustomer) {
        const custName = header.customer_name as string | undefined;
        if (!custName) throw new Error(`Group "${groupKey}": customer_name missing`);
        customerId = await resolveCustomer(custName);
      }
      let orderId: string | undefined;
      if (config.requiresOrder) {
        const on = header.order_number as string | undefined;
        if (!on) throw new Error(`Group "${groupKey}": order_number missing`);
        orderId = await resolveOrderId(supabase, on);
      }

      // Build items + totals.
      const vatRate = Number(header.vat_rate ?? 0) || 0;
      const items = rowsInGroup.map((r, idx) => {
        const qty = Number(r.mapped.quantity ?? 1) || 1;
        const unitPrice = Number(r.mapped.unit_price ?? 0) || 0;
        const discPct = Number(r.mapped.discount_pct ?? 0) || 0;
        const gross = qty * unitPrice;
        const net = gross * (1 - discPct / 100);
        const line_total = Math.round(net * 100) / 100;
        const item: Record<string, unknown> = {
          position: idx + 1,
          line_total,
          vat_pct: vatRate,
        };
        for (const k of itemKeys) {
          if (r.mapped[k] !== undefined) item[k] = r.mapped[k];
        }
        item.quantity = qty;
        item.unit_price = unitPrice;
        item.discount_pct = discPct;
        if (!item.description) throw new Error(`Row ${r.rowNumber}: description required`);
        return item;
      });
      const subtotal =
        Math.round(items.reduce((s, it) => s + Number(it.line_total ?? 0), 0) * 100) / 100;
      const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
      const total = Math.round((subtotal + vatAmount) * 100) / 100;

      const parentPayload = config.buildParent({
        header,
        customerId,
        orderId,
        subtotal,
        vatAmount,
        total,
        vatRate,
        userId,
      });
      // Strip helper fields (prefixed _)
      for (const k of Object.keys(parentPayload)) {
        if (k.startsWith("_")) delete parentPayload[k];
      }

      const { data: parent, error: pErr } = await supabase
        .from(config.parentTable as never)
        .insert(parentPayload as never)
        .select("id")
        .single();
      if (pErr || !parent)
        throw new Error(pErr?.message || `Failed to create ${config.parentTable}`);
      const parentId = (parent as { id: string }).id;

      const itemsPayload = items.map((it, idx) =>
        config.buildItem
          ? config.buildItem(it, idx, parentId)
          : { ...it, [config.itemsFkCol]: parentId },
      );
      const { error: iErr } = await supabase
        .from(config.itemsTable as never)
        .insert(itemsPayload as never);
      if (iErr) {
        await supabase
          .from(config.parentTable as never)
          .delete()
          .eq("id", parentId);
        throw new Error(`Line items failed: ${iErr.message}`);
      }

      totals.success += rowsInGroup.length;
      for (const r of rowsInGroup) {
        await supabase.from("import_job_rows").insert({
          import_job_id: jobId,
          row_number: r.rowNumber,
          raw_data: r.raw,
          mapped_data: r.mapped as never,
          status: "success",
          error_message: null,
          created_record_id: parentId,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      totals.failed += rowsInGroup.length;
      if (totals.samples.length < 10) {
        totals.samples.push(`Row ${firstRowNumber} (group "${groupKey}"): ${msg}`);
      }
      for (const r of rowsInGroup) {
        await supabase.from("import_job_rows").insert({
          import_job_id: jobId,
          row_number: r.rowNumber,
          raw_data: r.raw,
          mapped_data: r.mapped as never,
          status: "failed",
          error_message: msg,
          created_record_id: null,
        });
      }
    }
  }

  await finishJob(supabase, jobId, totals);
  return {
    job_id: jobId,
    success: totals.success,
    failed: totals.failed,
    skipped: totals.skipped,
    total: data.rows.length,
    groups_created: [...groups.keys()].length,
  };
}

/* -------------------------------------------------------------------------- */
/* Payments (flat, resolves invoice_number -> invoice_id)                      */
/* -------------------------------------------------------------------------- */

async function runPaymentsImport({
  supabase,
  userId,
  data,
  schema,
}: {
  supabase: any;
  userId: string;
  data: ImportInput;
  schema: ImportEntitySchema;
}) {
  const jobId = await createJob(supabase, data);
  const totals = { success: 0, failed: 0, skipped: 0, samples: [] as string[] };
  const invoiceCache = new Map<string, { id: string; currency: string }>();

  for (let i = 0; i < data.rows.length; i++) {
    const raw = data.rows[i];
    const rowNumber = i + 1;
    const mapped: Record<string, unknown> = {};
    let error: string | null = null;
    let createdId: string | null = null;
    let status: "success" | "failed" | "skipped" = "success";

    try {
      for (const f of schema.fields) {
        const src = data.mapping[f.key];
        if (!src) continue;
        const value = coerce(f, raw[src]);
        if (value !== null) mapped[f.key] = value;
      }
      const invNum = String(mapped.invoice_number ?? "").trim();
      if (!invNum) throw new Error(`invoice_number is required`);
      let inv = invoiceCache.get(invNum.toLowerCase());
      if (!inv) {
        inv = await resolveInvoiceId(supabase, invNum);
        invoiceCache.set(invNum.toLowerCase(), inv);
      }

      const payload = {
        invoice_id: inv.id,
        amount: mapped.amount,
        currency: (mapped.currency as string) ?? inv.currency ?? "USD",
        method: (mapped.method as string) ?? "bank_transfer",
        received_at: mapped.received_at,
        reference: mapped.reference ?? null,
        notes: mapped.notes ?? null,
        created_by: userId,
      };
      const { data: ins, error: insErr } = await supabase
        .from("payments")
        .insert(payload)
        .select("id")
        .single();
      if (insErr) throw new Error(insErr.message);
      createdId = ins?.id ?? null;
      totals.success++;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      status = "failed";
      totals.failed++;
      if (totals.samples.length < 10) totals.samples.push(`Row ${rowNumber}: ${error}`);
    }

    await supabase.from("import_job_rows").insert({
      import_job_id: jobId,
      row_number: rowNumber,
      raw_data: raw,
      mapped_data: mapped as never,
      status,
      error_message: error,
      created_record_id: createdId,
    });
  }

  await finishJob(supabase, jobId, totals);
  return {
    job_id: jobId,
    success: totals.success,
    failed: totals.failed,
    skipped: totals.skipped,
    total: data.rows.length,
  };
}

/* -------------------------------------------------------------------------- */
/* Commission invoices (flat, resolves partner name -> partner_id)             */
/* -------------------------------------------------------------------------- */

async function runCommissionsImport({
  supabase,
  userId,
  data,
  schema,
}: {
  supabase: any;
  userId: string;
  data: ImportInput;
  schema: ImportEntitySchema;
}) {
  const jobId = await createJob(supabase, data);
  const totals = { success: 0, failed: 0, skipped: 0, samples: [] as string[] };
  const partnerCache = new Map<string, string>();
  const invoiceCache = new Map<string, string>();
  const orderCache = new Map<string, string>();

  for (let i = 0; i < data.rows.length; i++) {
    const raw = data.rows[i];
    const rowNumber = i + 1;
    const mapped: Record<string, unknown> = {};
    let error: string | null = null;
    let createdId: string | null = null;
    let status: "success" | "failed" | "skipped" = "success";

    try {
      for (const f of schema.fields) {
        const src = data.mapping[f.key];
        if (!src) continue;
        const value = coerce(f, raw[src]);
        if (value !== null) mapped[f.key] = value;
      }
      const partnerName = String(mapped.partner_name ?? "").trim();
      if (!partnerName) throw new Error(`partner_name is required`);
      const pKey = partnerName.toLowerCase();
      let partnerId = partnerCache.get(pKey);
      if (!partnerId) {
        partnerId = await resolvePartnerId(supabase, partnerName);
        partnerCache.set(pKey, partnerId);
      }

      let invoiceId: string | null = null;
      if (mapped.invoice_number) {
        const key = String(mapped.invoice_number).toLowerCase();
        invoiceId = invoiceCache.get(key) ?? null;
        if (!invoiceId) {
          const inv = await resolveInvoiceId(supabase, String(mapped.invoice_number));
          invoiceId = inv.id;
          invoiceCache.set(key, invoiceId);
        }
      }
      let orderId: string | null = null;
      if (mapped.order_number) {
        const key = String(mapped.order_number).toLowerCase();
        orderId = orderCache.get(key) ?? null;
        if (!orderId) {
          orderId = await resolveOrderId(supabase, String(mapped.order_number));
          orderCache.set(key, orderId);
        }
      }

      const payload = {
        partner_id: partnerId,
        commission_number: mapped.commission_number ?? null,
        amount: mapped.amount,
        currency: (mapped.currency as string) ?? "USD",
        invoice_id: invoiceId,
        order_id: orderId,
        earned_at: mapped.earned_at,
        invoice_date: mapped.invoice_date ?? mapped.earned_at,
        due_date: mapped.due_date ?? null,
        status: (mapped.status as string) ?? "pending",
        calc_type: "fixed",
        description: mapped.description ?? null,
        notes: mapped.notes ?? null,
        created_by: userId,
      };
      const { data: ins, error: insErr } = await supabase
        .from("partner_commissions")
        .insert(payload)
        .select("id")
        .single();
      if (insErr) throw new Error(insErr.message);
      createdId = ins?.id ?? null;
      totals.success++;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      status = "failed";
      totals.failed++;
      if (totals.samples.length < 10) totals.samples.push(`Row ${rowNumber}: ${error}`);
    }

    await supabase.from("import_job_rows").insert({
      import_job_id: jobId,
      row_number: rowNumber,
      raw_data: raw,
      mapped_data: mapped as never,
      status,
      error_message: error,
      created_record_id: createdId,
    });
  }

  await finishJob(supabase, jobId, totals);
  return {
    job_id: jobId,
    success: totals.success,
    failed: totals.failed,
    skipped: totals.skipped,
    total: data.rows.length,
  };
}

/* -------------------------------------------------------------------------- */
/* Failed-rows CSV                                                             */
/* -------------------------------------------------------------------------- */

function toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map(esc).join(",");
  const body = rows.map((r) => columns.map((c) => esc(r[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

export const getFailedRowsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ job_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("import_job_rows")
      .select("row_number, raw_data, error_message")
      .eq("import_job_id", data.job_id)
      .eq("status", "failed")
      .order("row_number", { ascending: true });
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return { csv: "", count: 0 };

    // Gather all raw_data keys.
    const keys = new Set<string>();
    for (const r of rows) {
      const raw = (r.raw_data ?? {}) as Record<string, unknown>;
      for (const k of Object.keys(raw)) keys.add(k);
    }
    const cols = ["row_number", ...Array.from(keys), "error_message"];
    const flat = rows.map((r) => ({
      row_number: r.row_number,
      ...((r.raw_data ?? {}) as Record<string, unknown>),
      error_message: r.error_message,
    }));
    return { csv: toCsv(flat, cols), count: rows.length };
  });
