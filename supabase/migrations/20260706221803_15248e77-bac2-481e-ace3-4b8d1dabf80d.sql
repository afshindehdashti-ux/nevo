
-- Partner linkage on leads and customers
ALTER TABLE public.project_inquiries
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS project_inquiries_partner_id_idx ON public.project_inquiries(partner_id);

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS customers_partner_id_idx ON public.customers(partner_id);

-- Partner commissions
CREATE TABLE IF NOT EXISTS public.partner_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending', -- pending | approved | paid | cancelled
  earned_at date NOT NULL DEFAULT current_date,
  paid_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);
CREATE INDEX IF NOT EXISTS partner_commissions_partner_idx ON public.partner_commissions(partner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_commissions TO authenticated;
GRANT ALL ON public.partner_commissions TO service_role;

ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partner users read own commissions" ON public.partner_commissions;
CREATE POLICY "Partner users read own commissions"
  ON public.partner_commissions FOR SELECT
  TO authenticated
  USING (public.is_partner_user(auth.uid(), partner_id));

DROP POLICY IF EXISTS "Staff manage commissions" ON public.partner_commissions;
CREATE POLICY "Staff manage commissions"
  ON public.partner_commissions FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','finance','sales']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','finance','sales']::app_role[]));

DROP TRIGGER IF EXISTS partner_commissions_set_updated_at ON public.partner_commissions;
CREATE TRIGGER partner_commissions_set_updated_at
  BEFORE UPDATE ON public.partner_commissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Allow partner users to read the leads/customers assigned to their partner
DROP POLICY IF EXISTS "Partner users read own leads" ON public.project_inquiries;
CREATE POLICY "Partner users read own leads"
  ON public.project_inquiries FOR SELECT
  TO authenticated
  USING (partner_id IS NOT NULL AND public.is_partner_user(auth.uid(), partner_id));

DROP POLICY IF EXISTS "Partner users read own customers" ON public.customers;
CREATE POLICY "Partner users read own customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (partner_id IS NOT NULL AND public.is_partner_user(auth.uid(), partner_id));
