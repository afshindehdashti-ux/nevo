import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verifyCsvText, type VerifyResult } from "@/lib/purge-csv-preamble";

import type { Database } from "@/integrations/supabase/types";
type AppRole = Database["public"]["Enums"]["app_role"];
const ALLOWED_ROLES: AppRole[] = ["super_admin", "management", "finance"];

const Input = z.object({
  audit_id: z.string().uuid(),
  file_text: z
    .string()
    .min(1)
    .max(50 * 1024 * 1024), // hard cap 50MB
});

export type VerifyInput = z.infer<typeof Input>;

export type ServerVerifyResponse = {
  result: VerifyResult;
  audit: {
    id: string;
    filename: string;
    sha256: string;
    created_at: string;
  };
};

/**
 * Single source of truth for the "may the browser open this file?" decision.
 * The Verify & open flow MUST only open a file when this returns true.
 */
export function shouldOpenAfterVerify(result: VerifyResult): boolean {
  return result.status === "match";
}

/**
 * Minimal Supabase surface the server verifier needs. Kept as a structural
 * type so unit tests can pass a hand-rolled stub without dragging in the
 * full SupabaseClient generics.
 */
export interface VerifierSupabaseClient {
  rpc(
    fn: "has_any_role",
    params: { _user_id: string; _roles: AppRole[] },
  ): Promise<{ data: boolean | null; error: { message: string } | null }>;
  from(table: "csv_export_audit"): {
    select(cols: string): {
      eq(
        col: string,
        value: string,
      ): {
        maybeSingle(): Promise<{
          data: { id: string; filename: string; sha256: string; created_at: string } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

/**
 * Pure, testable core of the server verifier. Extracted from the
 * `createServerFn` handler so unit tests can drive it with a stubbed
 * Supabase client — the createServerFn wrapper itself is exercised end-to-end
 * by higher-level tests.
 *
 * Failure modes surfaced to the client (all cause `shouldOpenAfterVerify`
 * to return false, so the browser never opens the file):
 * - authorization: throws "Not authorised to verify CSV exports."
 * - missing audit row: throws "Audit record not found."
 * - missing embedded SHA row: `result.status === "malformed"` with
 *   `issues` including "missing-sha-row".
 * - missing payload marker / unexpected CSV structure: `result.status ===
 *   "malformed"` with `issues` including "missing-marker".
 * - hash mismatch against the audit record: `result.status === "mismatch"`.
 */
export async function verifyCsvExportForAudit(
  supabase: VerifierSupabaseClient,
  userId: string,
  data: VerifyInput,
): Promise<ServerVerifyResponse> {
  const { data: allowed, error: roleErr } = await supabase.rpc("has_any_role", {
    _user_id: userId,
    _roles: ALLOWED_ROLES,
  });
  if (roleErr) throw new Error(roleErr.message);
  if (!allowed) throw new Error("Not authorised to verify CSV exports.");

  const { data: row, error } = await supabase
    .from("csv_export_audit")
    .select("id, filename, sha256, created_at")
    .eq("id", data.audit_id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Audit record not found.");

  const result = await verifyCsvText(data.file_text, {
    expectedSha: row.sha256,
  });

  return {
    result,
    audit: {
      id: row.id,
      filename: row.filename,
      sha256: row.sha256,
      created_at: row.created_at,
    },
  };
}

/**
 * Server-authoritative SHA-256 verification for a downloaded CSV export.
 * The browser never trusts its own hash: it uploads the file bytes, the
 * server fetches the stored checksum under RLS + role gate, runs the hash,
 * and returns match / mismatch / malformed. The browser only opens the file
 * when the response says `status === "match"`.
 */
export const verifyCsvExportOnServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((v) => Input.parse(v))
  .handler(({ context, data }): Promise<ServerVerifyResponse> =>
    verifyCsvExportForAudit(
      context.supabase as unknown as VerifierSupabaseClient,
      context.userId,
      data,
    ),
  );
