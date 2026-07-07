-- Restrict deletion of invoice PDF versions to privileged roles
DROP POLICY IF EXISTS invoice_pdf_versions_delete ON public.invoice_pdf_versions;
CREATE POLICY invoice_pdf_versions_delete ON public.invoice_pdf_versions
  FOR DELETE
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::app_role[])
  );