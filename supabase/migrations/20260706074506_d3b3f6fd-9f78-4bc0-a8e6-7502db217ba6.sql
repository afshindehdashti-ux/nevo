
-- 1. project_inquiries: replace broken 'admin' role policy, add DELETE
DROP POLICY IF EXISTS "Admins can update inquiries" ON public.project_inquiries;
CREATE POLICY project_inquiries_update_staff ON public.project_inquiries
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
    OR public.has_role(auth.uid(), 'sales')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
    OR public.has_role(auth.uid(), 'sales')
  );

CREATE POLICY project_inquiries_delete_admin ON public.project_inquiries
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
  );

-- 2. solutions_inspection: replace broken 'admin' policies
DROP POLICY IF EXISTS "Admins can insert solutions_inspection" ON public.solutions_inspection;
DROP POLICY IF EXISTS "Admins can update solutions_inspection" ON public.solutions_inspection;
DROP POLICY IF EXISTS "Admins can read solutions_inspection" ON public.solutions_inspection;

CREATE POLICY solutions_inspection_select_admin ON public.solutions_inspection
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
  );

CREATE POLICY solutions_inspection_insert_admin ON public.solutions_inspection
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
  );

CREATE POLICY solutions_inspection_update_admin ON public.solutions_inspection
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
  );

CREATE POLICY solutions_inspection_delete_admin ON public.solutions_inspection
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
  );

-- 3. products: remove sales from write access (they retain SELECT)
DROP POLICY IF EXISTS products_insert_staff ON public.products;
DROP POLICY IF EXISTS products_update_staff ON public.products;

CREATE POLICY products_insert_staff ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
    OR public.has_role(auth.uid(), 'operations')
  );

CREATE POLICY products_update_staff ON public.products
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
    OR public.has_role(auth.uid(), 'operations')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'management')
    OR public.has_role(auth.uid(), 'operations')
  );

-- 4. activity_logs: block UPDATE entirely — logs are append-only
CREATE POLICY activity_logs_no_update ON public.activity_logs
  FOR UPDATE TO authenticated, anon
  USING (false)
  WITH CHECK (false);
