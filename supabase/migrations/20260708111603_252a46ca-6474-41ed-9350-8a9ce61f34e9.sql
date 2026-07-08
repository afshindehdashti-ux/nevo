
REVOKE EXECUTE ON FUNCTION public.can_use_invoice_importer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_use_invoice_importer(uuid) TO authenticated, service_role;
