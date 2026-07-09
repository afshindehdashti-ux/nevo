
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS old_values jsonb,
  ADD COLUMN IF NOT EXISTS new_values jsonb;

CREATE INDEX IF NOT EXISTS idx_activity_logs_ip_created
  ON public.activity_logs (ip_address, created_at DESC);
