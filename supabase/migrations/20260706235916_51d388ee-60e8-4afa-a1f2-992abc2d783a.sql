
REVOKE EXECUTE ON FUNCTION public.has_staff_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_staff_role(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.has_staff_role(uuid) TO authenticated, service_role;
