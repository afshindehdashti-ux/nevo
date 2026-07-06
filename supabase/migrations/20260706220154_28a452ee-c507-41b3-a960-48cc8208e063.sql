
-- Drop old (empty) policies and recreate with correct staff role set
DROP POLICY IF EXISTS "Staff manage quotations" ON public.quotations;
DROP POLICY IF EXISTS "Staff manage quotation items" ON public.quotation_items;
DROP POLICY IF EXISTS "Staff manage communications" ON public.communications;
DROP POLICY IF EXISTS "Staff read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Staff insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Assignee or staff update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Staff read ai sessions" ON public.ai_assistant_conversations;

CREATE POLICY "Staff manage quotations" ON public.quotations FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));

CREATE POLICY "Staff manage quotation items" ON public.quotation_items FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));

CREATE POLICY "Staff manage communications" ON public.communications FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));

CREATE POLICY "Staff read tasks" ON public.tasks FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[]));
CREATE POLICY "Staff insert tasks" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
CREATE POLICY "Assignee or staff update tasks" ON public.tasks FOR UPDATE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[])
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  )
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[])
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  );
CREATE POLICY "Admins delete tasks" ON public.tasks FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE POLICY "Staff read ai sessions" ON public.ai_assistant_conversations FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales']::app_role[]));
