import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verifyCsvText, type VerifyResult } from "@/lib/purge-csv-preamble";

import type { Database } from "@/integrations/supabase/types";
type AppRole = Database["public"]["Enums"]["app_role"];
const ALLOWED_ROLES: AppRole[] = ["super_admin", "management", "finance"];

const Input = z.object({
  audit_id: z.string().uuid(),
  file_text: z.string().min(1).max(50 * 1024 * 1024), // hard cap 50MB
});

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
 * Server-authoritative SHA-256 verification for a downloaded CSV export.
 * The browser never trusts its own hash: it uploads the file bytes, the
 * server fetches the stored checksum under RLS + role gate, runs the hash,
 * and returns match / mismatch / malformed. The browser only opens the file
 * when the response says `status === "match"`.
 */
export const verifyCsvExportOnServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => Input.parse(v))
  .handler(async ({ context, data }): Promise<ServerVerifyResponse> => {
    const { data: allowed, error: roleErr } = await context.supabase.rpc(
      "has_any_role",
      {
        _user_id: context.userId,
        _roles: ALLOWED_ROLES,
      },
    );
    if (roleErr) throw new Error(roleErr.message);
    if (!allowed) throw new Error("Not authorised to verify CSV exports.");

    const { data: row, error } = await context.supabase
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
  });
