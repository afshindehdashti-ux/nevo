
ALTER TABLE public.download_events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS filename text,
  ADD COLUMN IF NOT EXISTS error_message text;

ALTER TABLE public.download_events
  DROP CONSTRAINT IF EXISTS download_events_status_check;
ALTER TABLE public.download_events
  ADD CONSTRAINT download_events_status_check
  CHECK (status IN ('start','success','failure'));

CREATE INDEX IF NOT EXISTS idx_download_events_status_created
  ON public.download_events (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_events_document
  ON public.download_events (document_id, created_at DESC);
