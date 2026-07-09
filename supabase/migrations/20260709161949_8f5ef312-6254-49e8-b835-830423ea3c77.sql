-- Revoke EXECUTE from authenticated on SECURITY DEFINER functions that don't need direct client/authenticated access
-- These are only used from triggers or from service_role server-side code
REVOKE EXECUTE ON FUNCTION public.convert_proforma_to_invoice FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_approval_thresholds FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_security_alert_settings FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.log_approval FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.next_commission_number FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.next_po_number FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.next_document_number FROM authenticated;