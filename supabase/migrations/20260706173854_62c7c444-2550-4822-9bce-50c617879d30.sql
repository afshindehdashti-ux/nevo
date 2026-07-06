
CREATE POLICY "crm_docs_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'crm-docs');
CREATE POLICY "crm_docs_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'crm-docs'
    AND public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
CREATE POLICY "crm_docs_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'crm-docs'
    AND public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
CREATE POLICY "crm_docs_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'crm-docs'
    AND public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));
