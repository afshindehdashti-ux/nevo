ALTER TABLE public.mailbox_connections
  ADD COLUMN IF NOT EXISTS gmail_client_id text,
  ADD COLUMN IF NOT EXISTS gmail_client_secret text,
  ADD COLUMN IF NOT EXISTS gmail_refresh_token text,
  ADD COLUMN IF NOT EXISTS gmail_access_token text,
  ADD COLUMN IF NOT EXISTS gmail_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS gmail_scope text,
  ADD COLUMN IF NOT EXISTS gmail_oauth_state text,
  ADD COLUMN IF NOT EXISTS gmail_authorized_email text,
  ADD COLUMN IF NOT EXISTS gmail_redirect_uri text;