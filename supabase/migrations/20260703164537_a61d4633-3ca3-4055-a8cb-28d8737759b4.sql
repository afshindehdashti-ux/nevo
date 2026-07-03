ALTER TABLE public.header_logo_events
  ADD COLUMN IF NOT EXISTS schema TEXT,
  ADD COLUMN IF NOT EXISTS schema_version INTEGER;
CREATE INDEX IF NOT EXISTS idx_header_logo_events_schema_version ON public.header_logo_events (schema_version);