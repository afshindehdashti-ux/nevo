-- Keep candidate documents private and make them available only to authenticated staff.
CREATE TABLE IF NOT EXISTS public.career_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL UNIQUE REFERENCES public.project_inquiries(id) ON DELETE CASCADE,
  preferred_team text,
  linkedin_url text,
  cv_bucket text,
  cv_path text,
  cv_filename text,
  cv_content_type text,
  cv_size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_applications_cv_metadata_check CHECK (
    (cv_path IS NULL AND cv_bucket IS NULL AND cv_filename IS NULL AND cv_content_type IS NULL AND cv_size_bytes IS NULL)
    OR (cv_path IS NOT NULL AND cv_bucket = 'career-applications' AND cv_filename IS NOT NULL AND cv_size_bytes BETWEEN 1 AND 8388608)
  ),
  CONSTRAINT career_applications_linkedin_url_check CHECK (
    linkedin_url IS NULL OR linkedin_url ~* '^https?://'
  )
);

CREATE INDEX IF NOT EXISTS career_applications_created_at_idx
  ON public.career_applications(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_applications TO authenticated;
GRANT ALL ON public.career_applications TO service_role;

ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS career_applications_staff_read ON public.career_applications;
CREATE POLICY career_applications_staff_read ON public.career_applications
  FOR SELECT TO authenticated
  USING (public.has_staff_role(auth.uid()));

DROP POLICY IF EXISTS career_applications_management_write ON public.career_applications;
CREATE POLICY career_applications_management_write ON public.career_applications
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations']::app_role[]));

DROP TRIGGER IF EXISTS career_applications_set_updated_at ON public.career_applications;
CREATE TRIGGER career_applications_set_updated_at
  BEFORE UPDATE ON public.career_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'career-applications',
  'career-applications',
  false,
  8388608,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- No storage.objects policy is created: only the server-side service key may write files,
-- and authenticated staff receive short-lived URLs after the app's authorization check.
