ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS security_signin_failure_threshold integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS security_signin_failure_window_minutes integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS security_new_country_dedup_minutes integer NOT NULL DEFAULT 1440;

ALTER TABLE public.company_settings
  ADD CONSTRAINT security_signin_failure_threshold_pos CHECK (security_signin_failure_threshold BETWEEN 1 AND 1000),
  ADD CONSTRAINT security_signin_failure_window_pos CHECK (security_signin_failure_window_minutes BETWEEN 1 AND 1440),
  ADD CONSTRAINT security_new_country_dedup_pos CHECK (security_new_country_dedup_minutes BETWEEN 1 AND 43200);

CREATE OR REPLACE FUNCTION public.get_security_alert_settings()
RETURNS TABLE(
  signin_failure_threshold integer,
  signin_failure_window_minutes integer,
  new_country_dedup_minutes integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(security_signin_failure_threshold, 5),
    COALESCE(security_signin_failure_window_minutes, 10),
    COALESCE(security_new_country_dedup_minutes, 1440)
  FROM public.company_settings
  WHERE is_active = true
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_security_alert_settings() TO anon, authenticated, service_role;