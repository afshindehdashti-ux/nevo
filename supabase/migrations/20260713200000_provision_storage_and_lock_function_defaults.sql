-- Provision every private bucket used by the CRM. Existing storage policies
-- already define access for crm-docs, documents, ai-knowledge, and invoice-imports.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('crm-docs', 'crm-docs', false, 20971520),
  ('documents', 'documents', false, 20971520),
  ('ai-knowledge', 'ai-knowledge', false, 20971520),
  ('invoice-imports', 'invoice-imports', false, 20971520),
  ('documents-originals', 'documents-originals', false, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Document-intelligence uploads are staff-only and are kept separate from
-- customer-facing CRM documents.
DROP POLICY IF EXISTS "documents_originals_read_staff" ON storage.objects;
DROP POLICY IF EXISTS "documents_originals_write_staff" ON storage.objects;
DROP POLICY IF EXISTS "documents_originals_delete_staff" ON storage.objects;
CREATE POLICY "documents_originals_read_staff"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents-originals' AND public.has_staff_role(auth.uid()));
CREATE POLICY "documents_originals_write_staff"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents-originals'
    AND public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::public.app_role[])
  );
CREATE POLICY "documents_originals_delete_staff"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents-originals'
    AND public.has_any_role(auth.uid(), ARRAY['super_admin','management']::public.app_role[])
  );

-- PostgreSQL grants EXECUTE to PUBLIC for newly-created functions by default.
-- Public forms use tables through explicitly-scoped policies, never RPCs.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

-- Trigger helpers and sequence generators are never valid RPC endpoints.
REVOKE EXECUTE ON FUNCTION public.assign_order_number() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_payment_number() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.next_commission_number() FROM authenticated;
