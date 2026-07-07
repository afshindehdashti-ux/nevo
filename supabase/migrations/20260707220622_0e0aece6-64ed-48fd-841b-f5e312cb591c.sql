
CREATE POLICY "ai-knowledge: management upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ai-knowledge' AND public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE POLICY "ai-knowledge: staff read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ai-knowledge' AND public.has_staff_role(auth.uid()));

CREATE POLICY "ai-knowledge: management update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ai-knowledge' AND public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE POLICY "ai-knowledge: management delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ai-knowledge' AND public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));
