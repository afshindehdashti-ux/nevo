
-- Mapping tables
CREATE TABLE public.customer_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (customer_id, user_id)
);
CREATE INDEX customer_users_user_idx ON public.customer_users(user_id);
CREATE INDEX customer_users_customer_idx ON public.customer_users(customer_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_users TO authenticated;
GRANT ALL ON public.customer_users TO service_role;
ALTER TABLE public.customer_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user sees own customer mapping" ON public.customer_users
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "staff read customer mapping" ON public.customer_users
  FOR SELECT TO authenticated USING (has_any_role(auth.uid(),
    ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[]));
CREATE POLICY "staff manage customer mapping" ON public.customer_users
  FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations']::app_role[]));

CREATE TABLE public.partner_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (partner_id, user_id)
);
CREATE INDEX partner_users_user_idx ON public.partner_users(user_id);
CREATE INDEX partner_users_partner_idx ON public.partner_users(partner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_users TO authenticated;
GRANT ALL ON public.partner_users TO service_role;
ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user sees own partner mapping" ON public.partner_users
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "staff read partner mapping" ON public.partner_users
  FOR SELECT TO authenticated USING (has_any_role(auth.uid(),
    ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[]));
CREATE POLICY "staff manage partner mapping" ON public.partner_users
  FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations']::app_role[]));

-- Membership helpers (SECURITY DEFINER to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_customer_user(_user_id uuid, _customer_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.customer_users
    WHERE user_id = _user_id AND customer_id = _customer_id)
$$;

CREATE OR REPLACE FUNCTION public.is_partner_user(_user_id uuid, _partner_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.partner_users
    WHERE user_id = _user_id AND partner_id = _partner_id)
$$;

-- Tighten the doc_intel_documents authenticated policy: scope customer/partner rows to mapped users
DROP POLICY IF EXISTS "authenticated read approved docintel" ON public.doc_intel_documents;

CREATE POLICY "auth read approved public docintel" ON public.doc_intel_documents
  FOR SELECT TO authenticated
  USING (status = 'approved' AND portal_visibility IN ('public','on_request'));

CREATE POLICY "auth read approved customer docintel" ON public.doc_intel_documents
  FOR SELECT TO authenticated
  USING (
    status = 'approved'
    AND portal_visibility = 'customer'
    AND customer_id IS NOT NULL
    AND public.is_customer_user(auth.uid(), customer_id)
  );

CREATE POLICY "auth read approved partner docintel" ON public.doc_intel_documents
  FOR SELECT TO authenticated
  USING (
    status = 'approved'
    AND portal_visibility = 'partner'
    AND partner_id IS NOT NULL
    AND public.is_partner_user(auth.uid(), partner_id)
  );
