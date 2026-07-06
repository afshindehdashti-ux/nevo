
-- Staff full access to the four doc-intel buckets on storage.objects
CREATE POLICY "docintel staff read objects" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('documents-originals','documents-routed','documents-private','documents-public')
    AND public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[])
  );
CREATE POLICY "docintel staff insert objects" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('documents-originals','documents-routed','documents-private','documents-public')
    AND public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[])
  );
CREATE POLICY "docintel staff update objects" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('documents-originals','documents-routed','documents-private','documents-public')
    AND public.has_any_role(auth.uid(), ARRAY['super_admin','management','operations']::app_role[])
  );
CREATE POLICY "docintel staff delete objects" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('documents-originals','documents-routed','documents-private','documents-public')
    AND public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[])
  );
