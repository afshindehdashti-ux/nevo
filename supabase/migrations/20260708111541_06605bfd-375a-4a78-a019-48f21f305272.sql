
-- 1. Extend invoices with imported reference
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS original_document_reference text;

-- 2. Enums
DO $$ BEGIN
  CREATE TYPE public.invoice_import_status AS ENUM (
    'uploaded','processing','ready_for_review','draft_created','failed','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_import_type AS ENUM (
    'proforma','commercial','customer_and_invoice','order_and_invoice','draft_only'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Helper: can current user use the importer?
CREATE OR REPLACE FUNCTION public.can_use_invoice_importer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','management','sales','finance')
  );
$$;

-- 4. invoice_import_jobs
CREATE TABLE IF NOT EXISTS public.invoice_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status public.invoice_import_status NOT NULL DEFAULT 'uploaded',
  import_type public.invoice_import_type NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  related_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  related_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  overall_confidence numeric(4,3),
  extraction_summary text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_import_jobs TO authenticated;
GRANT ALL ON public.invoice_import_jobs TO service_role;
ALTER TABLE public.invoice_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Importers can view their jobs"
  ON public.invoice_import_jobs FOR SELECT TO authenticated
  USING (
    public.can_use_invoice_importer(auth.uid())
    OR uploaded_by = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR (
      related_order_id IS NOT NULL
      AND public.has_role(auth.uid(), 'operations')
    )
  );

CREATE POLICY "Importers can create jobs"
  ON public.invoice_import_jobs FOR INSERT TO authenticated
  WITH CHECK (
    public.can_use_invoice_importer(auth.uid())
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Importers can update their jobs"
  ON public.invoice_import_jobs FOR UPDATE TO authenticated
  USING (
    public.can_use_invoice_importer(auth.uid())
    AND (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'management'))
  )
  WITH CHECK (public.can_use_invoice_importer(auth.uid()));

CREATE POLICY "Super admin can delete jobs"
  ON public.invoice_import_jobs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 5. invoice_import_files
CREATE TABLE IF NOT EXISTS public.invoice_import_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid NOT NULL REFERENCES public.invoice_import_jobs(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  original_file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.invoice_import_files TO authenticated;
GRANT ALL ON public.invoice_import_files TO service_role;
ALTER TABLE public.invoice_import_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View files for accessible jobs"
  ON public.invoice_import_files FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoice_import_jobs j
    WHERE j.id = import_job_id
      AND (
        j.uploaded_by = auth.uid()
        OR public.can_use_invoice_importer(auth.uid())
        OR public.has_role(auth.uid(), 'super_admin')
      )
  ));

CREATE POLICY "Insert files for own jobs"
  ON public.invoice_import_files FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND public.can_use_invoice_importer(auth.uid())
    AND EXISTS (SELECT 1 FROM public.invoice_import_jobs j WHERE j.id = import_job_id AND j.uploaded_by = auth.uid())
  );

CREATE POLICY "Delete files as super admin"
  ON public.invoice_import_files FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 6. invoice_import_extracted_data
CREATE TABLE IF NOT EXISTS public.invoice_import_extracted_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid NOT NULL UNIQUE REFERENCES public.invoice_import_jobs(id) ON DELETE CASCADE,
  raw_text text,
  extracted_json jsonb,
  mapped_json jsonb,
  confidence_scores jsonb,
  validation_warnings jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_import_extracted_data TO authenticated;
GRANT ALL ON public.invoice_import_extracted_data TO service_role;
ALTER TABLE public.invoice_import_extracted_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View extracted data for accessible jobs"
  ON public.invoice_import_extracted_data FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoice_import_jobs j
    WHERE j.id = import_job_id
      AND (j.uploaded_by = auth.uid() OR public.can_use_invoice_importer(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  ));

CREATE POLICY "Write extracted data for own jobs"
  ON public.invoice_import_extracted_data FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoice_import_jobs j
    WHERE j.id = import_job_id AND j.uploaded_by = auth.uid()
  ));

CREATE POLICY "Update extracted data for own jobs"
  ON public.invoice_import_extracted_data FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoice_import_jobs j
    WHERE j.id = import_job_id
      AND (j.uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'management'))
  ))
  WITH CHECK (public.can_use_invoice_importer(auth.uid()));

CREATE POLICY "Delete extracted data as super admin"
  ON public.invoice_import_extracted_data FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 7. invoice_import_audit_log
CREATE TABLE IF NOT EXISTS public.invoice_import_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid NOT NULL REFERENCES public.invoice_import_jobs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.invoice_import_audit_log TO authenticated;
GRANT ALL ON public.invoice_import_audit_log TO service_role;
ALTER TABLE public.invoice_import_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View audit for accessible jobs"
  ON public.invoice_import_audit_log FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoice_import_jobs j
    WHERE j.id = import_job_id
      AND (j.uploaded_by = auth.uid() OR public.can_use_invoice_importer(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
  ));

CREATE POLICY "Insert audit for own jobs"
  ON public.invoice_import_audit_log FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() OR user_id IS NULL)
    AND EXISTS (
      SELECT 1 FROM public.invoice_import_jobs j
      WHERE j.id = import_job_id
        AND (j.uploaded_by = auth.uid() OR public.can_use_invoice_importer(auth.uid()))
    )
  );

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_iij_uploaded_by ON public.invoice_import_jobs(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_iij_status ON public.invoice_import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_iij_related_order ON public.invoice_import_jobs(related_order_id);
CREATE INDEX IF NOT EXISTS idx_iij_related_customer ON public.invoice_import_jobs(related_customer_id);
CREATE INDEX IF NOT EXISTS idx_iif_job ON public.invoice_import_files(import_job_id);
CREATE INDEX IF NOT EXISTS idx_iial_job ON public.invoice_import_audit_log(import_job_id);

-- 9. updated_at triggers
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS touch_iij_updated ON public.invoice_import_jobs;
CREATE TRIGGER touch_iij_updated BEFORE UPDATE ON public.invoice_import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

DROP TRIGGER IF EXISTS touch_iied_updated ON public.invoice_import_extracted_data;
CREATE TRIGGER touch_iied_updated BEFORE UPDATE ON public.invoice_import_extracted_data
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 10. Storage policies for private bucket 'invoice-imports'
--     Path convention: {user_id}/{job_id}/{filename}
CREATE POLICY "Users read own import files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'invoice-imports'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'management')
      OR public.has_role(auth.uid(), 'finance')
    )
  );

CREATE POLICY "Users upload own import files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'invoice-imports'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.can_use_invoice_importer(auth.uid())
  );

CREATE POLICY "Users delete own import files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'invoice-imports'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'super_admin')
    )
  );
