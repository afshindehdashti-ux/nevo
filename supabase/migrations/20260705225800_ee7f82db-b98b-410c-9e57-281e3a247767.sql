
-- Migrate legacy admins to super_admin
UPDATE public.user_roles SET role = 'super_admin'::public.app_role WHERE role::text = 'admin';

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  job_title TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authed" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_super_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::public.app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Company Settings
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  legal_name TEXT NOT NULL,
  trade_license TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  website TEXT,
  logo_url TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_iban TEXT,
  bank_swift TEXT,
  bank_branch TEXT,
  default_terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_settings_select_authed" ON public.company_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "company_settings_super_admin_all" ON public.company_settings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::public.app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::public.app_role));

INSERT INTO public.company_settings (
  legal_name, trade_license, address, city, country, email, phone, whatsapp, website, default_terms
) VALUES (
  'NEVO TRADING AND CONSULTANCY L.L.C - FZ',
  '2528837.01',
  'Meydan Grandstand, 6th Floor, Meydan Road, Nad Al Sheba',
  'Dubai',
  'United Arab Emirates',
  'info@nevoindustrial.com',
  '+971 50 242 6167',
  '+971 50 242 6167',
  'www.nevoindustrial.com',
  'Payment terms and conditions apply as per project agreement.'
);

-- Document Settings
CREATE TABLE IF NOT EXISTS public.document_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_prefix TEXT NOT NULL DEFAULT 'QTN-NEVO',
  proforma_prefix TEXT NOT NULL DEFAULT 'PI-NEVO',
  invoice_prefix TEXT NOT NULL DEFAULT 'INV-NEVO',
  commission_prefix TEXT NOT NULL DEFAULT 'CI-NEVO',
  purchase_order_prefix TEXT NOT NULL DEFAULT 'PO-NEVO',
  delivery_note_prefix TEXT NOT NULL DEFAULT 'DN-NEVO',
  packing_list_prefix TEXT NOT NULL DEFAULT 'PL-NEVO',
  default_vat_percent NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  default_currency TEXT NOT NULL DEFAULT 'USD',
  default_incoterms TEXT NOT NULL DEFAULT 'FOB',
  default_payment_terms TEXT NOT NULL DEFAULT '50% advance, 50% before shipment',
  footer_text TEXT,
  signature_name TEXT,
  signature_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_settings TO authenticated;
GRANT ALL ON public.document_settings TO service_role;
ALTER TABLE public.document_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_settings_select_authed" ON public.document_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "document_settings_super_admin_all" ON public.document_settings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::public.app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::public.app_role));

INSERT INTO public.document_settings (signature_name, signature_title, footer_text)
VALUES ('Arsalan Forooghmanesh','General Manager','NEVO TRADING AND CONSULTANCY L.L.C - FZ | www.nevoindustrial.com');

-- Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON public.activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON public.activity_logs (created_at DESC);

GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_select_authed" ON public.activity_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_logs_insert_own" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activity_logs_super_admin_delete" ON public.activity_logs
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::public.app_role));

-- user_roles policies for super_admin management
CREATE POLICY "user_roles_super_admin_all" ON public.user_roles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'::public.app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'::public.app_role));

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_company_settings_updated_at BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_document_settings_updated_at BEFORE UPDATE ON public.document_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
