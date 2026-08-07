import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CareerCvInput = z.object({
  inquiryId: z.string().uuid(),
});

/**
 * Resolves a short-lived download URL only after RLS confirms that the caller
 * is an authenticated staff member allowed to read the candidate record.
 */
export const getCareerCvDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => CareerCvInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: application, error } = await context.supabase
      .from("career_applications")
      .select("cv_bucket,cv_path,cv_filename")
      .eq("inquiry_id", data.inquiryId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!application?.cv_bucket || !application.cv_path || !application.cv_filename) return null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from(application.cv_bucket)
      .createSignedUrl(application.cv_path, 60 * 5, {
        download: application.cv_filename,
      });
    if (signedError || !signed?.signedUrl) {
      throw new Error(signedError?.message ?? "Could not prepare the CV download");
    }

    return { filename: application.cv_filename, url: signed.signedUrl };
  });
