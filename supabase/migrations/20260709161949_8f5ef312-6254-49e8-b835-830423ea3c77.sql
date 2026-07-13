-- Revoke EXECUTE from authenticated on SECURITY DEFINER functions that don't need direct client/authenticated access
-- These are only used from triggers or from service_role server-side code
DO $$
DECLARE
  signature text;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.convert_proforma_to_invoice(uuid)',
    'public.get_approval_thresholds()',
    'public.get_security_alert_settings()',
    'public.log_approval(text,uuid,jsonb)',
    'public.next_commission_number()',
    'public.next_po_number()',
    'public.next_document_number(public.finance_document_type)'
  ] LOOP
    IF to_regprocedure(signature) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', signature);
    END IF;
  END LOOP;
END
$$;
