
-- =========================================================
-- 1. ENUMS
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM ('new','contacted','qualified','proposal','negotiation','won','lost','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_source AS ENUM ('web','referral','partner','exhibition','direct','campaign','ai_assistant','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.opportunity_stage AS ENUM ('prospecting','qualification','proposal','negotiation','won','lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.import_job_status AS ENUM ('draft','validating','ready','running','completed','failed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.import_row_status AS ENUM ('pending','success','failed','skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- 2. Helper: has_staff_role (any staff role at all)
-- =========================================================
CREATE OR REPLACE FUNCTION public.has_staff_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','management','sales','operations','finance','read_only')
  )
$$;

-- =========================================================
-- 3. LEADS
-- =========================================================
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  email text,
  phone text,
  whatsapp text,
  country text,
  industry text,
  source public.lead_source NOT NULL DEFAULT 'other',
  status public.lead_status NOT NULL DEFAULT 'new',
  estimated_value numeric(14,2),
  currency text NOT NULL DEFAULT 'USD',
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  notes text,
  next_follow_up date,
  won_at timestamptz,
  lost_reason text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_owner ON public.leads(owner_id);
CREATE INDEX idx_leads_customer ON public.leads(customer_id);
CREATE INDEX idx_leads_next_follow_up ON public.leads(next_follow_up);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view leads"
  ON public.leads FOR SELECT
  USING (public.has_staff_role(auth.uid()));

CREATE POLICY "Sales staff can create leads"
  ON public.leads FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management','sales','operations']::app_role[]));

CREATE POLICY "Sales staff can update leads"
  ON public.leads FOR UPDATE
  USING (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management','sales','operations']::app_role[]));

CREATE POLICY "Management can delete leads"
  ON public.leads FOR DELETE
  USING (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management']::app_role[]));

CREATE TRIGGER leads_set_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER leads_stamp_updated_by BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();
CREATE TRIGGER leads_delete_audit AFTER DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_row_delete();

-- =========================================================
-- 4. OPPORTUNITIES
-- =========================================================
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  stage public.opportunity_stage NOT NULL DEFAULT 'prospecting',
  amount numeric(14,2),
  currency text NOT NULL DEFAULT 'USD',
  probability integer NOT NULL DEFAULT 20 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date date,
  actual_close_date date,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  loss_reason text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_opps_stage ON public.opportunities(stage);
CREATE INDEX idx_opps_customer ON public.opportunities(customer_id);
CREATE INDEX idx_opps_owner ON public.opportunities(owner_id);
CREATE INDEX idx_opps_expected_close ON public.opportunities(expected_close_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view opportunities"
  ON public.opportunities FOR SELECT
  USING (public.has_staff_role(auth.uid()));

CREATE POLICY "Sales staff can create opportunities"
  ON public.opportunities FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management','sales','operations']::app_role[]));

CREATE POLICY "Sales staff can update opportunities"
  ON public.opportunities FOR UPDATE
  USING (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management','sales','operations']::app_role[]));

CREATE POLICY "Management can delete opportunities"
  ON public.opportunities FOR DELETE
  USING (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management']::app_role[]));

CREATE TRIGGER opps_set_updated_at BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER opps_stamp_updated_by BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();
CREATE TRIGGER opps_delete_audit AFTER DELETE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.log_row_delete();

-- =========================================================
-- 5. CONTACTS  (belongs to exactly one of customer/supplier/partner)
-- =========================================================
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  title text,
  email text,
  phone text,
  whatsapp text,
  is_primary boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contacts_one_parent CHECK (
    (customer_id IS NOT NULL)::int
    + (supplier_id IS NOT NULL)::int
    + (partner_id  IS NOT NULL)::int = 1
  )
);

CREATE INDEX idx_contacts_customer ON public.contacts(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_contacts_supplier ON public.contacts(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX idx_contacts_partner  ON public.contacts(partner_id)  WHERE partner_id  IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view contacts"
  ON public.contacts FOR SELECT
  USING (public.has_staff_role(auth.uid()));

CREATE POLICY "Sales staff can create contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management','sales','operations']::app_role[]));

CREATE POLICY "Sales staff can update contacts"
  ON public.contacts FOR UPDATE
  USING (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management','sales','operations']::app_role[]));

CREATE POLICY "Management can delete contacts"
  ON public.contacts FOR DELETE
  USING (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management']::app_role[]));

CREATE TRIGGER contacts_set_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER contacts_stamp_updated_by BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();

-- =========================================================
-- 6. IMPORT JOBS
-- =========================================================
CREATE TABLE public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_type text NOT NULL,
  file_name text NOT NULL,
  file_path text,
  mode text NOT NULL DEFAULT 'create' CHECK (mode IN ('create','update','upsert','skip_duplicates')),
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.import_job_status NOT NULL DEFAULT 'draft',
  total_rows integer NOT NULL DEFAULT 0,
  success_rows integer NOT NULL DEFAULT 0,
  failed_rows integer NOT NULL DEFAULT 0,
  skipped_rows integer NOT NULL DEFAULT 0,
  error_summary text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX idx_import_jobs_type ON public.import_jobs(import_type);
CREATE INDEX idx_import_jobs_created_by ON public.import_jobs(created_by);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_jobs TO authenticated;
GRANT ALL ON public.import_jobs TO service_role;

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Import-authorized staff can view import jobs"
  ON public.import_jobs FOR SELECT
  USING (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management','operations','finance']::app_role[]));

CREATE POLICY "Import-authorized staff can create import jobs"
  ON public.import_jobs FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND public.has_any_role(auth.uid(),
      ARRAY['super_admin','management','operations','finance']::app_role[])
  );

CREATE POLICY "Import-authorized staff can update import jobs"
  ON public.import_jobs FOR UPDATE
  USING (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management','operations','finance']::app_role[]));

CREATE POLICY "Management can delete import jobs"
  ON public.import_jobs FOR DELETE
  USING (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management']::app_role[]));

-- =========================================================
-- 7. IMPORT JOB ROWS
-- =========================================================
CREATE TABLE public.import_job_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  raw_data jsonb NOT NULL,
  mapped_data jsonb,
  status public.import_row_status NOT NULL DEFAULT 'pending',
  error_message text,
  created_record_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_import_rows_job ON public.import_job_rows(import_job_id);
CREATE INDEX idx_import_rows_status ON public.import_job_rows(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_job_rows TO authenticated;
GRANT ALL ON public.import_job_rows TO service_role;

ALTER TABLE public.import_job_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Import-authorized staff can view import rows"
  ON public.import_job_rows FOR SELECT
  USING (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management','operations','finance']::app_role[]));

CREATE POLICY "Import-authorized staff can insert import rows"
  ON public.import_job_rows FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management','operations','finance']::app_role[]));

CREATE POLICY "Import-authorized staff can update import rows"
  ON public.import_job_rows FOR UPDATE
  USING (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management','operations','finance']::app_role[]));

CREATE POLICY "Management can delete import rows"
  ON public.import_job_rows FOR DELETE
  USING (public.has_any_role(auth.uid(),
    ARRAY['super_admin','management']::app_role[]));
