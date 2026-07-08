
REVOKE EXECUTE ON FUNCTION public.next_document_number(public.finance_document_type) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fd_recalc_totals() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fd_assign_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.apply_inventory_movement() FROM PUBLIC, anon;
