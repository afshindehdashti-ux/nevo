
CREATE TABLE public.project_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  country text,
  application text,
  message text,
  source_page text,
  calculator_state jsonb,
  status text NOT NULL DEFAULT 'new',
  ip text,
  user_agent text
);
GRANT INSERT ON public.project_inquiries TO anon, authenticated;
GRANT SELECT, UPDATE ON public.project_inquiries TO authenticated;
GRANT ALL ON public.project_inquiries TO service_role;
ALTER TABLE public.project_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit inquiries" ON public.project_inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view inquiries" ON public.project_inquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update inquiries" ON public.project_inquiries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.download_events (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  document_id text NOT NULL,
  document_title text,
  category text,
  source_page text,
  ip text,
  user_agent text
);
GRANT INSERT ON public.download_events TO anon, authenticated;
GRANT USAGE ON SEQUENCE public.download_events_id_seq TO anon, authenticated;
GRANT SELECT ON public.download_events TO authenticated;
GRANT ALL ON public.download_events TO service_role;
GRANT ALL ON SEQUENCE public.download_events_id_seq TO service_role;
ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log downloads" ON public.download_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view downloads" ON public.download_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_project_inquiries_created_at ON public.project_inquiries (created_at DESC);
CREATE INDEX idx_project_inquiries_status ON public.project_inquiries (status);
CREATE INDEX idx_download_events_created_at ON public.download_events (created_at DESC);
CREATE INDEX idx_download_events_document ON public.download_events (document_id);
