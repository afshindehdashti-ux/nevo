CREATE TABLE public.invoice_pdf_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'crm-docs',
  storage_path text NOT NULL,
  filename text NOT NULL,
  byte_size bigint,
  source text NOT NULL DEFAULT 'download',
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX invoice_pdf_versions_invoice_id_idx ON public.invoice_pdf_versions(invoice_id, created_at DESC);

GRANT SELECT, INSERT ON public.invoice_pdf_versions TO authenticated;
GRANT ALL ON public.invoice_pdf_versions TO service_role;

ALTER TABLE public.invoice_pdf_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoice_pdf_versions_select ON public.invoice_pdf_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_pdf_versions.invoice_id
        AND (
          has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[])
          OR is_customer_user(auth.uid(), i.customer_id)
        )
    )
  );

CREATE POLICY invoice_pdf_versions_insert ON public.invoice_pdf_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    generated_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_pdf_versions.invoice_id
        AND has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[])
    )
  );