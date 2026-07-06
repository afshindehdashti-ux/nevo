
-- Tighten SELECT policies now that access is invitation-only and every user has a role.
-- All policies below rely on the existing public.has_role(uuid, app_role) SECURITY DEFINER function.

-- helper predicate used inline; must be evaluated per-policy since Postgres has no policy-level helper

-- customers: only staff (sales / operations / management / super_admin)
DROP POLICY IF EXISTS customers_select_authed ON public.customers;
CREATE POLICY customers_select_staff ON public.customers
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
    OR public.has_role(auth.uid(), 'sales')
    OR public.has_role(auth.uid(), 'operations')
    OR public.has_role(auth.uid(), 'finance')
  );

-- suppliers: operations / management / super_admin / finance
DROP POLICY IF EXISTS suppliers_select_authed ON public.suppliers;
CREATE POLICY suppliers_select_staff ON public.suppliers
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
    OR public.has_role(auth.uid(), 'operations')
    OR public.has_role(auth.uid(), 'finance')
  );

-- products: sales / operations / management / finance / super_admin
DROP POLICY IF EXISTS products_select_authed ON public.products;
CREATE POLICY products_select_staff ON public.products
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
    OR public.has_role(auth.uid(), 'sales')
    OR public.has_role(auth.uid(), 'operations')
    OR public.has_role(auth.uid(), 'finance')
  );

-- company_settings: management / super_admin / finance (bank + legal)
DROP POLICY IF EXISTS company_settings_select_authed ON public.company_settings;
CREATE POLICY company_settings_select_admin ON public.company_settings
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
    OR public.has_role(auth.uid(), 'finance')
  );

-- document_settings: management / super_admin / finance
DROP POLICY IF EXISTS document_settings_select_authed ON public.document_settings;
CREATE POLICY document_settings_select_admin ON public.document_settings
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
    OR public.has_role(auth.uid(), 'finance')
  );

-- profiles: users can read their own row; super_admin / management can read all
DROP POLICY IF EXISTS profiles_select_authed ON public.profiles;
CREATE POLICY profiles_select_self_or_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
  );

-- activity_logs: users see their own entries; super_admin sees everything
DROP POLICY IF EXISTS activity_logs_select_authed ON public.activity_logs;
CREATE POLICY activity_logs_select_own_or_admin ON public.activity_logs
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
  );
