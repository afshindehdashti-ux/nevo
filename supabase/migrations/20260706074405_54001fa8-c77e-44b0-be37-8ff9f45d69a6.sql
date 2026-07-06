
REVOKE ALL ON FUNCTION public.log_status_approval() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_approval(text, uuid, jsonb) FROM PUBLIC, anon;
