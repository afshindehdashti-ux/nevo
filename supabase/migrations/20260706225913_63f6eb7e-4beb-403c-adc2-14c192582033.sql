
REVOKE EXECUTE ON FUNCTION public.get_approval_thresholds() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_approval_request(text, uuid, text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.evaluate_quotation_discount_approval(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auto_request_invoice_approval() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auto_request_commission_approval() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auto_request_quotation_approval() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auto_request_quotation_item_approval() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_approval_thresholds() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_approval_request(text, uuid, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.evaluate_quotation_discount_approval(uuid) TO authenticated, service_role;
