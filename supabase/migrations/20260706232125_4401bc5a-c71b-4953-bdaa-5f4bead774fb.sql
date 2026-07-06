
CREATE TABLE public.communication_reads (
  message_id uuid NOT NULL REFERENCES public.communications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX communication_reads_user_idx ON public.communication_reads(user_id);

GRANT SELECT, INSERT, DELETE ON public.communication_reads TO authenticated;
GRANT ALL ON public.communication_reads TO service_role;

ALTER TABLE public.communication_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own read receipts"
ON public.communication_reads
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
