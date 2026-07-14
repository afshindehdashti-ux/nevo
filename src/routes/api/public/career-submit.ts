import { withMethodGuards } from "@/lib/api-http";
import { assertAllowedOrigin, assertRateLimit, corsHeaders, jsonError } from "@/lib/api-security";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const MAX_CV_BYTES = 8 * 1024 * 1024;
const ALLOWED_CV_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_CV_EXTENSIONS = new Set(["pdf", "doc", "docx"]);

const careerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(3).max(60),
  linkedin: z.string().trim().url().max(500).optional().or(z.literal("")),
  team: z.string().trim().max(100).optional().or(z.literal("")),
  note: z.string().trim().max(4000).optional().or(z.literal("")),
});

function extensionFor(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function safeFilename(filename: string): string {
  const normalized = filename.replace(/[^A-Za-z0-9._-]/g, "_").slice(-120);
  return normalized || "cv";
}

function fileContentType(file: File, extension: string): string {
  if (file.type) return file.type;
  if (extension === "pdf") return "application/pdf";
  if (extension === "doc") return "application/msword";
  return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

export const Route = createFileRoute("/api/public/career-submit")({
  server: {
    handlers: withMethodGuards({
      OPTIONS: async ({ request }) => {
        const headers = corsHeaders(request);
        const blocked = assertAllowedOrigin(request, headers);
        if (blocked) return blocked;
        return new Response(null, { status: 204, headers });
      },
      POST: async ({ request }) => {
        const headers = corsHeaders(request);
        const blocked = assertAllowedOrigin(request, headers);
        if (blocked) return blocked;
        const limited = assertRateLimit(request, "career-submit", {
          limit: 5,
          windowMs: 10 * 60_000,
        });
        if (limited) return limited;
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return jsonError(400, "invalid_form_data", undefined, headers);
        }

        const parsed = careerSchema.safeParse({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          linkedin: form.get("linkedin"),
          team: form.get("team"),
          note: form.get("note"),
        });
        if (!parsed.success) {
          return jsonError(400, "validation_failed", { details: parsed.error.flatten() }, headers);
        }

        const rawCv = form.get("cv");
        const cv = rawCv instanceof File && rawCv.size > 0 ? rawCv : null;
        if (cv) {
          const extension = extensionFor(cv.name);
          if (
            cv.size > MAX_CV_BYTES ||
            !ALLOWED_CV_EXTENSIONS.has(extension) ||
            (cv.type && !ALLOWED_CV_TYPES.has(cv.type))
          ) {
            return jsonError(400, "invalid_cv", undefined, headers);
          }
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const data = parsed.data;
        const details = [
          "Career application",
          data.team ? `Preferred team: ${data.team}` : null,
          data.linkedin ? `LinkedIn: ${data.linkedin}` : null,
          data.note ? `Candidate note: ${data.note}` : null,
          cv ? `CV attached: ${cv.name}` : null,
        ]
          .filter(Boolean)
          .join("\n\n");

        const { data: inquiry, error: inquiryError } = await supabaseAdmin
          .from("project_inquiries")
          .insert({
            name: data.name,
            email: data.email,
            phone: data.phone,
            application: "Career application",
            message: details,
            source_page: "careers",
            status: "new",
          })
          .select("id")
          .single();
        if (inquiryError || !inquiry) {
          console.error("career-submit: inquiry insert failed", inquiryError);
          return jsonError(503, "inquiry_store_failed", undefined, headers);
        }

        let storagePath: string | null = null;
        try {
          if (cv) {
            const extension = extensionFor(cv.name);
            storagePath = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}-${safeFilename(cv.name)}`;
            const { error: uploadError } = await supabaseAdmin.storage
              .from("career-applications")
              .upload(storagePath, await cv.arrayBuffer(), {
                contentType: fileContentType(cv, extension),
                upsert: false,
              });
            if (uploadError) throw uploadError;
          }

          const { error: applicationError } = await supabaseAdmin
            .from("career_applications")
            .insert({
              inquiry_id: inquiry.id,
              preferred_team: data.team || null,
              linkedin_url: data.linkedin || null,
              cv_bucket: storagePath ? "career-applications" : null,
              cv_path: storagePath,
              cv_filename: cv?.name ?? null,
              cv_content_type: cv ? fileContentType(cv, extensionFor(cv.name)) : null,
              cv_size_bytes: cv?.size ?? null,
            } as never);
          if (applicationError) throw applicationError;
        } catch (error) {
          console.error("career-submit: file metadata transaction failed", error);
          if (storagePath) {
            await supabaseAdmin.storage.from("career-applications").remove([storagePath]);
          }
          await supabaseAdmin.from("project_inquiries").delete().eq("id", inquiry.id);
          return jsonError(503, "application_store_failed", undefined, headers);
        }

        return Response.json({ ok: true, inquiryId: inquiry.id }, { status: 201, headers });
      },
    }),
  },
});
