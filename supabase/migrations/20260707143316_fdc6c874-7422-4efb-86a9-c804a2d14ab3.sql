
CREATE TABLE public.sms_alert_dedup (
  dedup_key text PRIMARY KEY,
  first_sent_at timestamptz NOT NULL DEFAULT now(),
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  send_count integer NOT NULL DEFAULT 1,
  last_payload jsonb
);

GRANT ALL ON public.sms_alert_dedup TO service_role;

ALTER TABLE public.sms_alert_dedup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON public.sms_alert_dedup
  FOR ALL TO service_role USING (true) WITH CHECK (true);
