import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Import Center — pragmatic backend.
 * Accepts already-parsed rows (CSV/XLSX parsing happens client-side to keep the
 * Worker bundle small) and validates + inserts them per import type.
 * Records an audit row in `imports` with per-row error details.
 */

const ImportType = z.enum(["customers", "suppliers", "products", "finance_documents"]);

const RunInput = z.object({
  import_type: ImportType,
  source: z.string().default("manual-upload"),
  rows: z.array(z.record(z.string(), z.any())),
  column_mapping: z.record(z.string(), z.string()).optional(),
  dry_run: z.boolean().optional(),
});

type Row = Record<string, unknown>;

function mapRow(row: Row, mapping?: Record<string, string>) {
  if (!mapping) return row;
  const out: Row = {};
  for (const [target, source] of Object.entries(mapping)) {
    out[target] = row[source];
  }
  return out;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  return String(v).trim();
}
function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export const runImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => RunInput.parse(v))
  .handler(async ({ data, context }) => {
    const errors: Array<{ row: number; message: string }> = [];
    let processed = 0;
    const rows = data.rows.map((r) => mapRow(r, data.column_mapping));

    // Create import audit row
    const { data: job, error: jobErr } = await (context.supabase.from("imports") as any)
      .insert({
        import_type: data.import_type,
        source: data.source,
        raw_row_count: rows.length,
        status: data.dry_run ? "dry_run" : "processing",
        column_mapping: data.column_mapping ?? {},
        preview_data: rows.slice(0, 5) as any,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (jobErr) throw new Error(jobErr.message);

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (data.import_type === "customers") {
          const name = str(r.company_name) ?? str(r.name);
          if (!name) throw new Error("company_name/name required");
          if (!data.dry_run) {
            const { error } = await (context.supabase.from("customers") as any).insert({
              company_name: name,
              name,
              email: str(r.email),
              phone: str(r.phone),
              country: str(r.country),
              address_line1: str(r.address_line1) ?? str(r.address),
            });
            if (error) throw new Error(error.message);
          }
        } else if (data.import_type === "suppliers") {
          const name = str(r.name) ?? str(r.company_name);
          if (!name) throw new Error("name required");
          if (!data.dry_run) {
            const { error } = await (context.supabase.from("suppliers") as any).insert({
              name,
              email: str(r.email),
              phone: str(r.phone),
            });
            if (error) throw new Error(error.message);
          }
        } else if (data.import_type === "products") {
          const name = str(r.name);
          const sku = str(r.sku);
          if (!name || !sku) throw new Error("name and sku required");
          const price = num(r.unit_price) ?? 0;
          if (!data.dry_run) {
            const { error } = await (context.supabase.from("products") as any).insert({
              name,
              sku,
              unit_price: price,
              description: str(r.description),
              unit: str(r.unit),
            });
            if (error) throw new Error(error.message);
          }
        } else if (data.import_type === "finance_documents") {
          const doc_type = str(r.document_type);
          const customer_ref = str(r.customer_email) ?? str(r.customer_name);
          const description = str(r.description);
          const qty = num(r.quantity) ?? 1;
          const price = num(r.unit_price) ?? 0;
          if (!doc_type || !description) throw new Error("document_type and description required");
          if (!data.dry_run) {
            let customer_id: string | null = null;
            if (customer_ref) {
              const { data: c } = await context.supabase
                .from("customers")
                .select("id")
                .or(`email.eq.${customer_ref},company_name.eq.${customer_ref}`)
                .limit(1)
                .maybeSingle();
              customer_id = c?.id ?? null;
            }
            const { data: doc, error } = await (context.supabase.from("finance_documents") as any)
              .insert({
                document_type: doc_type,
                customer_id,
                currency: str(r.currency) ?? "USD",
                created_by: context.userId,
                updated_by: context.userId,
              })
              .select("id")
              .single();
            if (error) throw new Error(error.message);
            await (context.supabase.from("finance_document_items") as any).insert({
              document_id: doc.id,
              description,
              quantity: qty,
              unit_price: price,
            });
          }
        }
        processed++;
      } catch (e) {
        errors.push({ row: i + 1, message: (e as Error).message });
      }
    }

    await (context.supabase.from("imports") as any)
      .update({
        status: data.dry_run
          ? "dry_run_complete"
          : errors.length
            ? "completed_with_errors"
            : "completed",
        processed_count: processed,
        error_count: errors.length,
        errors: errors as any,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return { import_id: job.id, processed, error_count: errors.length, errors };
  });

export const listImports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("imports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
