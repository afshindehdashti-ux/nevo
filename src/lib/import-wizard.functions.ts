import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { IMPORT_SCHEMAS, type ImportField, SUPPORTED_IMPORT_TYPES } from "./import-schemas";

/** Coerce a cell into the DB-friendly type for a field, or throw. */
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
      if (["true","yes","y","1","active"].includes(l)) return true;
      if (["false","no","n","0","inactive"].includes(l)) return false;
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
        throw new Error(`"${field.label}" must be one of ${field.enumValues?.join(", ")}, got "${s}"`);
      return l;
    }
    default:
      return s;
  }
}

const RowsInput = z.object({
  import_type: z.enum(SUPPORTED_IMPORT_TYPES as [string, ...string[]]),
  file_name: z.string().min(1).max(300),
  mode: z.enum(["create", "upsert", "skip_duplicates"]).default("create"),
  // mapping: dbColumnKey -> source header (or "" if unmapped)
  mapping: z.record(z.string(), z.string()),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))).min(1).max(5000),
});

export const runImportJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => RowsInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const schema = IMPORT_SCHEMAS[data.import_type];
    if (!schema) throw new Error(`Unsupported import type: ${data.import_type}`);

    // Validate mapping covers required fields.
    for (const f of schema.fields) {
      if (f.required && !data.mapping[f.key]) {
        throw new Error(`Required column "${f.label}" is not mapped`);
      }
    }

    // Hierarchical branch (e.g. quotations) — group rows before insert.
    if (schema.groupBy) {
      return runHierarchicalImport({ supabase, userId, data, schema });
    }

    // Create parent job row (flat mode).
    const { data: job, error: jobErr } = await supabase
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
    if (jobErr || !job) throw new Error(jobErr?.message || "Failed to create import job");

    let success = 0;
    let failed = 0;
    let skipped = 0;
    const errorSamples: string[] = [];

    for (let i = 0; i < data.rows.length; i++) {
      const raw = data.rows[i];
      const rowNumber = i + 1;
      let mapped: Record<string, unknown> = {};
      let error: string | null = null;
      let createdId: string | null = null;
      let status: "pending" | "success" | "failed" | "skipped" = "pending";

      try {
        for (const f of schema.fields) {
          const src = data.mapping[f.key];
          if (!src) continue;
          const value = coerce(f, raw[src]);
          if (value !== null) mapped[f.key] = value;
        }
        // Stamp created_by where the column exists.
        mapped.created_by = userId;

        const { data: ins, error: insErr } = await supabase
          .from(schema.table as never)
          .insert(mapped as never)
          .select("id")
          .single();
        if (insErr) throw new Error(insErr.message);
        createdId = (ins as { id: string } | null)?.id ?? null;
        status = "success";
        success++;
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
        if (data.mode === "skip_duplicates" && /duplicate|unique/i.test(error)) {
          status = "skipped";
          skipped++;
        } else {
          status = "failed";
          failed++;
          if (errorSamples.length < 10) errorSamples.push(`Row ${rowNumber}: ${error}`);
        }
      }

      await supabase.from("import_job_rows").insert({
        import_job_id: job.id,
        row_number: rowNumber,
        raw_data: raw,
        mapped_data: mapped as never,
        status,
        error_message: error,
        created_record_id: createdId,
      });
    }

    const finalStatus =
      failed === 0 ? "completed" : success === 0 ? "failed" : "completed";

    await supabase
      .from("import_jobs")
      .update({
        status: finalStatus,
        success_rows: success,
        failed_rows: failed,
        skipped_rows: skipped,
        error_summary: errorSamples.length ? errorSamples.join("\n") : null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return { job_id: job.id, success, failed, skipped, total: data.rows.length };
  });

/**
 * Hierarchical import (quotations, etc.).
 *
 * Rules:
 * - Rows sharing `schema.groupBy` value collapse into ONE parent record.
 * - Header field values are read from the FIRST non-empty row of each group.
 * - Every row of the group contributes ONE child line item.
 * - The customer_name is resolved to an existing customer (case-insensitive,
 *   trimmed match on `name`); created if missing.
 * - Header VAT %, currency, status etc. are stamped on the parent quotation.
 *   Line totals are computed as qty * unit_price * (1 - discount/100) and the
 *   parent subtotal / vat_amount / total are written on the header.
 */
async function runHierarchicalImport({
  supabase,
  userId,
  data,
  schema,
}: {
  supabase: any;
  userId: string;
  data: z.infer<typeof RowsInput>;
  schema: (typeof IMPORT_SCHEMAS)[string];
}) {
  if (schema.key !== "quotations") {
    throw new Error(`Hierarchical import not implemented for ${schema.key}`);
  }

  const groupField = schema.groupBy!;
  const headerKeys = new Set(schema.headerFields ?? []);
  const itemKeys = new Set(schema.itemFields ?? []);

  type MappedRow = { rowNumber: number; raw: (typeof data.rows)[number]; mapped: Record<string, unknown> };
  const groups = new Map<string, MappedRow[]>();
  const rowErrors: Array<{ rowNumber: number; error: string; raw: any }> = [];

  // Coerce every row and bucket by group key.
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

  const { data: job, error: jobErr } = await supabase
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
  if (jobErr || !job) throw new Error(jobErr?.message || "Failed to create import job");

  let success = 0;
  let failed = 0;
  const skipped = 0;
  const errorSamples: string[] = [];

  // Persist pre-coerce row failures immediately.
  for (const rf of rowErrors) {
    failed++;
    if (errorSamples.length < 10) errorSamples.push(`Row ${rf.rowNumber}: ${rf.error}`);
    await supabase.from("import_job_rows").insert({
      import_job_id: job.id,
      row_number: rf.rowNumber,
      raw_data: rf.raw,
      mapped_data: {},
      status: "failed",
      error_message: rf.error,
      created_record_id: null,
    });
  }

  // Customer name cache to avoid repeat lookups.
  const customerCache = new Map<string, string>();
  async function resolveCustomer(name: string): Promise<string> {
    const key = name.trim().toLowerCase();
    if (customerCache.has(key)) return customerCache.get(key)!;
    const { data: existing } = await supabase
      .from("customers")
      .select("id, name")
      .ilike("name", name.trim())
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      customerCache.set(key, existing.id);
      return existing.id;
    }
    const { data: created, error: cErr } = await supabase
      .from("customers")
      .insert({ name: name.trim(), company_name: name.trim(), created_by: userId })
      .select("id")
      .single();
    if (cErr || !created) throw new Error(`Failed to create customer "${name}": ${cErr?.message}`);
    customerCache.set(key, created.id);
    return created.id;
  }

  for (const [groupKey, rowsInGroup] of groups.entries()) {
    const firstRowNumber = rowsInGroup[0].rowNumber;
    try {
      // Header from first-non-empty across the group.
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
      const custName = header.customer_name as string | undefined;
      if (!custName) throw new Error(`Group "${groupKey}": customer_name missing`);
      const customer_id = await resolveCustomer(custName);

      // Compute line totals + header subtotal / VAT / grand total.
      const vatRate = Number(header.vat_rate ?? 0) || 0;
      const items = rowsInGroup.map((r, idx) => {
        const qty = Number(r.mapped.quantity ?? 1) || 1;
        const unitPrice = Number(r.mapped.unit_price ?? 0) || 0;
        const discPct = Number(r.mapped.discount_pct ?? 0) || 0;
        const gross = qty * unitPrice;
        const net = gross * (1 - discPct / 100);
        const line_total = Math.round(net * 100) / 100;
        const item: Record<string, unknown> = { position: idx + 1, line_total };
        for (const k of itemKeys) {
          if (r.mapped[k] !== undefined) item[k] = r.mapped[k];
        }
        item.quantity = qty;
        item.unit_price = unitPrice;
        item.discount_pct = discPct;
        if (!item.description) throw new Error(`Row ${r.rowNumber}: description required`);
        return item;
      });
      const subtotal = Math.round(items.reduce((s, it) => s + Number(it.line_total ?? 0), 0) * 100) / 100;
      const vat_amount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
      const total = Math.round((subtotal + vat_amount) * 100) / 100;

      const insertHeader: Record<string, unknown> = {
        quotation_number: header.quotation_number,
        customer_id,
        issue_date: header.issue_date ?? new Date().toISOString().slice(0, 10),
        valid_until: header.valid_until ?? null,
        currency: header.currency ?? "USD",
        vat_rate: vatRate,
        vat_amount,
        subtotal,
        total,
        status: (header.status as string) ?? "draft",
        terms: header.terms ?? null,
        notes: header.notes ?? null,
        created_by: userId,
      };

      const { data: q, error: qErr } = await supabase
        .from("quotations")
        .insert(insertHeader)
        .select("id")
        .single();
      if (qErr || !q) throw new Error(qErr?.message || "Failed to create quotation");
      const quotationId = q.id as string;

      const itemsPayload = items.map((it) => ({ ...it, quotation_id: quotationId }));
      const { error: iErr } = await supabase.from("quotation_items").insert(itemsPayload);
      if (iErr) {
        // Roll back header so we don't leave an empty quotation.
        await supabase.from("quotations").delete().eq("id", quotationId);
        throw new Error(`Line items failed: ${iErr.message}`);
      }

      success += rowsInGroup.length;
      for (const r of rowsInGroup) {
        await supabase.from("import_job_rows").insert({
          import_job_id: job.id,
          row_number: r.rowNumber,
          raw_data: r.raw,
          mapped_data: r.mapped as never,
          status: "success",
          error_message: null,
          created_record_id: quotationId,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      failed += rowsInGroup.length;
      if (errorSamples.length < 10) {
        errorSamples.push(`Row ${firstRowNumber} (group "${groupKey}"): ${msg}`);
      }
      for (const r of rowsInGroup) {
        await supabase.from("import_job_rows").insert({
          import_job_id: job.id,
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

  const finalStatus = failed === 0 ? "completed" : success === 0 ? "failed" : "completed";
  await supabase
    .from("import_jobs")
    .update({
      status: finalStatus,
      success_rows: success,
      failed_rows: failed,
      skipped_rows: skipped,
      error_summary: errorSamples.length ? errorSamples.join("\n") : null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  return {
    job_id: job.id,
    success,
    failed,
    skipped,
    total: data.rows.length,
    groups_created: [...groups.keys()].length,
  };
}
