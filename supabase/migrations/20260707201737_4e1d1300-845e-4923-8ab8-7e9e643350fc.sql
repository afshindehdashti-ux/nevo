ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS pdf_version_retention_count integer
  CHECK (pdf_version_retention_count IS NULL OR (pdf_version_retention_count >= 1 AND pdf_version_retention_count <= 500));