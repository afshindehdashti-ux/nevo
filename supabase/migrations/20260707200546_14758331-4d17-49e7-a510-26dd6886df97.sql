ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS pdf_version_retention_count integer NOT NULL DEFAULT 20;