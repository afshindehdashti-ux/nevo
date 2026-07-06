
ALTER TABLE public.communications
  ADD COLUMN IF NOT EXISTS follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS follow_up_done boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_comms_follow_up
  ON public.communications (follow_up_at)
  WHERE follow_up_at IS NOT NULL AND follow_up_done = false;

CREATE INDEX IF NOT EXISTS idx_comms_occurred_desc
  ON public.communications (occurred_at DESC);
