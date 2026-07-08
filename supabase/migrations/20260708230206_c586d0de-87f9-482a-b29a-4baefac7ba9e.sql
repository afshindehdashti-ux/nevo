
CREATE OR REPLACE FUNCTION public.auto_request_invoice_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  th record;
  ety text;
BEGIN
  IF NEW.status = 'void'::invoice_status THEN
    RETURN NEW;
  END IF;
  SELECT * INTO th FROM public.get_approval_thresholds();
  IF NEW.total IS NULL OR NEW.total < th.invoice THEN
    RETURN NEW;
  END IF;
  ety := CASE WHEN NEW.type = 'proforma' THEN 'proforma' ELSE 'invoice' END;
  PERFORM public.ensure_approval_request(
    ety,
    NEW.id,
    format('Total %s %s meets approval threshold %s',
           NEW.currency, NEW.total::text, th.invoice::text),
    jsonb_build_object(
      'total', NEW.total,
      'currency', NEW.currency,
      'threshold', th.invoice,
      'invoice_number', NEW.invoice_number,
      'type', NEW.type
    )
  );
  RETURN NEW;
END
$function$;
