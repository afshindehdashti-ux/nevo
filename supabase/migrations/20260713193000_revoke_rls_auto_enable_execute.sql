-- Supabase creates this event-trigger helper with SECURITY DEFINER privileges.
-- It is invoked by the database, not through the Data API, so no API role needs EXECUTE.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
