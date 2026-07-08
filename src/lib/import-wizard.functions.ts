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

    // Create parent job row.
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
