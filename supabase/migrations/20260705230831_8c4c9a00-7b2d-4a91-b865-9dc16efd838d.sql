
-- Team members seeded on company_settings as JSON
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS team_members jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.company_settings SET
  legal_name = 'NEVO TRADING AND CONSULTANCY L.L.C - FZ',
  trade_license = '2528837.01',
  address = 'Meydan Grandstand, 6th Floor, Meydan Road, Nad Al Sheba',
  city = 'Dubai',
  country = 'United Arab Emirates',
  email = 'info@nevoindustrial.com',
  phone = '+971 50 242 6167',
  whatsapp = '+971 50 242 6167',
  website = 'www.nevoindustrial.com',
  team_members = '[
    {"full_name":"Arsalan Forooghmanesh","title":"General Manager","email":"Arsalan@nevoindustrial.com","phone":"+971 50 242 6167","is_default_signer":true},
    {"full_name":"Afshin Dehdashti","title":"International Market Developer","email":"Afshin@nevoindustial.com","phone":"0049 142 457 96660","is_default_signer":false}
  ]'::jsonb
WHERE is_active = true;

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  contact_person text CHECK (contact_person IS NULL OR char_length(contact_person) <= 200),
  email text CHECK (email IS NULL OR (char_length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 50),
  whatsapp text CHECK (whatsapp IS NULL OR char_length(whatsapp) <= 50),
  address text CHECK (address IS NULL OR char_length(address) <= 500),
  city text CHECK (city IS NULL OR char_length(city) <= 100),
  country text CHECK (country IS NULL OR char_length(country) <= 100),
  vat_number text CHECK (vat_number IS NULL OR char_length(vat_number) <= 60),
  currency text NOT NULL DEFAULT 'USD' CHECK (char_length(currency) BETWEEN 3 AND 8),
  payment_terms text CHECK (payment_terms IS NULL OR char_length(payment_terms) <= 200),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select_authed" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers_insert_staff" ON public.customers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin','management','sales','operations')));
CREATE POLICY "customers_update_staff" ON public.customers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin','management','sales','operations')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin','management','sales','operations')));
CREATE POLICY "customers_delete_admin" ON public.customers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin','management')));

CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX customers_name_idx ON public.customers (lower(name));
CREATE INDEX customers_is_active_idx ON public.customers (is_active);

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  contact_person text CHECK (contact_person IS NULL OR char_length(contact_person) <= 200),
  email text CHECK (email IS NULL OR (char_length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 50),
  whatsapp text CHECK (whatsapp IS NULL OR char_length(whatsapp) <= 50),
  address text CHECK (address IS NULL OR char_length(address) <= 500),
  city text CHECK (city IS NULL OR char_length(city) <= 100),
  country text CHECK (country IS NULL OR char_length(country) <= 100),
  vat_number text CHECK (vat_number IS NULL OR char_length(vat_number) <= 60),
  currency text NOT NULL DEFAULT 'USD' CHECK (char_length(currency) BETWEEN 3 AND 8),
  default_commission_pct numeric(6,3) NOT NULL DEFAULT 0 CHECK (default_commission_pct BETWEEN 0 AND 100),
  payment_terms text CHECK (payment_terms IS NULL OR char_length(payment_terms) <= 200),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_select_authed" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "suppliers_insert_staff" ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin','management','operations')));
CREATE POLICY "suppliers_update_staff" ON public.suppliers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin','management','operations')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin','management','operations')));
CREATE POLICY "suppliers_delete_admin" ON public.suppliers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin','management')));

CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX suppliers_name_idx ON public.suppliers (lower(name));
CREATE INDEX suppliers_is_active_idx ON public.suppliers (is_active);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE CHECK (sku IS NULL OR char_length(sku) BETWEEN 1 AND 60),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  category text CHECK (category IS NULL OR char_length(category) <= 100),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  unit text NOT NULL DEFAULT 'pcs' CHECK (char_length(unit) BETWEEN 1 AND 20),
  unit_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (char_length(currency) BETWEEN 3 AND 8),
  default_commission_pct numeric(6,3) NOT NULL DEFAULT 0 CHECK (default_commission_pct BETWEEN 0 AND 100),
  hs_code text CHECK (hs_code IS NULL OR char_length(hs_code) <= 40),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_authed" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_insert_staff" ON public.products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin','management','operations','sales')));
CREATE POLICY "products_update_staff" ON public.products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin','management','operations','sales')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin','management','operations','sales')));
CREATE POLICY "products_delete_admin" ON public.products FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin','management')));

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX products_name_idx ON public.products (lower(name));
CREATE INDEX products_supplier_idx ON public.products (supplier_id);
CREATE INDEX products_is_active_idx ON public.products (is_active);
