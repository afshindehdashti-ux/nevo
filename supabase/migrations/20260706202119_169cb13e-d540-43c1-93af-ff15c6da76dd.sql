
-- ============ partners ============
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  country text,
  partner_type text,
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read partners" ON public.partners FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[]));
CREATE POLICY "staff write partners" ON public.partners FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','operations','sales']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','operations','sales']::app_role[]));
CREATE TRIGGER partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ projects ============
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  country text,
  project_type text,
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read projects" ON public.projects FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[]));
CREATE POLICY "staff write projects" ON public.projects FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','operations','sales']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','operations','sales']::app_role[]));
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ doc_intel_documents ============
CREATE TABLE IF NOT EXISTS public.doc_intel_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_filename text NOT NULL,
  stored_filename text,
  title text,
  summary text,
  document_type text,
  category text,
  language text,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  destination text,
  folder_path text,
  file_url text,
  storage_bucket text NOT NULL DEFAULT 'documents-originals',
  storage_path text NOT NULL,
  mime_type text,
  file_size bigint,
  confidentiality_level text DEFAULT 'internal',
  portal_visibility text DEFAULT 'none',
  status text NOT NULL DEFAULT 'uploaded',
  ai_confidence numeric,
  ai_reasoning text,
  user_note text,
  intended_destination text,
  detected_products jsonb DEFAULT '[]'::jsonb,
  detected_standards jsonb DEFAULT '[]'::jsonb,
  detected_country text,
  detected_company text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  routed_bucket text,
  routed_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_intel_documents TO authenticated;
GRANT SELECT ON public.doc_intel_documents TO anon;
GRANT ALL ON public.doc_intel_documents TO service_role;
ALTER TABLE public.doc_intel_documents ENABLE ROW LEVEL SECURITY;

-- staff full read
CREATE POLICY "staff read docintel" ON public.doc_intel_documents FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[]));
-- staff insert
CREATE POLICY "staff insert docintel" ON public.doc_intel_documents FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
-- staff update
CREATE POLICY "staff update docintel" ON public.doc_intel_documents FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
-- staff delete
CREATE POLICY "staff delete docintel" ON public.doc_intel_documents FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));
-- anon can read approved public/on_request rows only
CREATE POLICY "public read approved docintel" ON public.doc_intel_documents FOR SELECT TO anon
  USING (status = 'approved' AND portal_visibility IN ('public','on_request'));
-- authenticated non-staff read (customer/partner/public/on_request)
CREATE POLICY "authenticated read approved docintel" ON public.doc_intel_documents FOR SELECT TO authenticated
  USING (status = 'approved' AND portal_visibility IN ('public','on_request','customer','partner'));

CREATE TRIGGER docintel_updated_at BEFORE UPDATE ON public.doc_intel_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER docintel_stamp_updated_by BEFORE UPDATE ON public.doc_intel_documents
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();

CREATE INDEX IF NOT EXISTS docintel_status_idx ON public.doc_intel_documents(status);
CREATE INDEX IF NOT EXISTS docintel_customer_idx ON public.doc_intel_documents(customer_id);
CREATE INDEX IF NOT EXISTS docintel_partner_idx ON public.doc_intel_documents(partner_id);
CREATE INDEX IF NOT EXISTS docintel_project_idx ON public.doc_intel_documents(project_id);
CREATE INDEX IF NOT EXISTS docintel_visibility_idx ON public.doc_intel_documents(portal_visibility);

-- ============ doc_intel_tags ============
CREATE TABLE IF NOT EXISTS public.doc_intel_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.doc_intel_documents(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_intel_tags TO authenticated;
GRANT SELECT ON public.doc_intel_tags TO anon;
GRANT ALL ON public.doc_intel_tags TO service_role;
ALTER TABLE public.doc_intel_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read tags with doc" ON public.doc_intel_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.doc_intel_documents d WHERE d.id = document_id)
);
CREATE POLICY "staff write tags" ON public.doc_intel_tags FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
CREATE INDEX IF NOT EXISTS docintel_tags_doc_idx ON public.doc_intel_tags(document_id);

-- ============ doc_intel_versions ============
CREATE TABLE IF NOT EXISTS public.doc_intel_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.doc_intel_documents(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  file_url text,
  storage_bucket text,
  storage_path text,
  filename text,
  change_note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_intel_versions TO authenticated;
GRANT ALL ON public.doc_intel_versions TO service_role;
ALTER TABLE public.doc_intel_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read versions" ON public.doc_intel_versions FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[]));
CREATE POLICY "staff write versions" ON public.doc_intel_versions FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
CREATE INDEX IF NOT EXISTS docintel_versions_doc_idx ON public.doc_intel_versions(document_id);

-- ============ doc_intel_audit_logs ============
CREATE TABLE IF NOT EXISTS public.doc_intel_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.doc_intel_documents(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.doc_intel_audit_logs TO authenticated;
GRANT ALL ON public.doc_intel_audit_logs TO service_role;
ALTER TABLE public.doc_intel_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read audit" ON public.doc_intel_audit_logs FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[]));
CREATE POLICY "staff insert audit" ON public.doc_intel_audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
CREATE INDEX IF NOT EXISTS docintel_audit_doc_idx ON public.doc_intel_audit_logs(document_id);

-- ============ doc_intel_extractions ============
CREATE TABLE IF NOT EXISTS public.doc_intel_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.doc_intel_documents(id) ON DELETE CASCADE,
  raw_text text,
  extracted_json jsonb,
  model_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.doc_intel_extractions TO authenticated;
GRANT ALL ON public.doc_intel_extractions TO service_role;
ALTER TABLE public.doc_intel_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read extractions" ON public.doc_intel_extractions FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[]));
CREATE POLICY "staff insert extractions" ON public.doc_intel_extractions FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
CREATE INDEX IF NOT EXISTS docintel_extract_doc_idx ON public.doc_intel_extractions(document_id);
