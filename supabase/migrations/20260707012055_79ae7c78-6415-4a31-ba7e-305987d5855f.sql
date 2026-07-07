
CREATE TABLE public.mailbox_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('imap','gmail')),
  imap_host text,
  imap_port integer,
  imap_username text,
  imap_password text,
  imap_tls boolean NOT NULL DEFAULT true,
  gmail_email text,
  is_active boolean NOT NULL DEFAULT true,
  last_test_at timestamptz,
  last_test_ok boolean,
  last_test_error text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX mailbox_connections_active_uniq
  ON public.mailbox_connections ((true)) WHERE is_active;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mailbox_connections TO authenticated;
GRANT ALL ON public.mailbox_connections TO service_role;

ALTER TABLE public.mailbox_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin read mailbox_connections"
  ON public.mailbox_connections FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "super_admin insert mailbox_connections"
  ON public.mailbox_connections FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "super_admin update mailbox_connections"
  ON public.mailbox_connections FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "super_admin delete mailbox_connections"
  ON public.mailbox_connections FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER mailbox_connections_set_updated_at
  BEFORE UPDATE ON public.mailbox_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER mailbox_connections_stamp_updated_by
  BEFORE INSERT OR UPDATE ON public.mailbox_connections
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();
