
-- Helper: read active thresholds with sane fallbacks
CREATE OR REPLACE FUNCTION public.get_approval_thresholds()
RETURNS TABLE(invoice numeric, commission numeric, discount_pct numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(approval_invoice_threshold, 10000)::numeric,
    COALESCE(approval_commission_threshold, 2500)::numeric,
    COALESCE(approval_discount_pct_threshold, 15)::numeric
  FROM public.company_settings
  WHERE is_active = true
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;
$$;

-- Helper: create a pending approval only when none exists in pending or approved state
CREATE OR REPLACE FUNCTION public.ensure_approval_request(
  _entity_type text,
  _entity_id uuid,
  _reason text,
  _details jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  existing_id uuid;
  new_id uuid;
BEGIN
  SELECT id INTO existing_id
  FROM public.approval_requests
  WHERE entity_type = _entity_type
    AND entity_id = _entity_id
    AND status IN ('pending','approved')
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;

  INSERT INTO public.approval_requests (entity_type, entity_id, reason, details, requested_by)
  VALUES (_entity_type, _entity_id, _reason, COALESCE(_details, '{}'::jsonb), auth.uid())
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Invoices / proformas
CREATE OR REPLACE FUNCTION public.auto_request_invoice_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  th record;
  ety text;
BEGIN
  IF NEW.status IN ('void','cancelled') THEN
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
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_approval_invoice ON public.invoices;
CREATE TRIGGER trg_auto_approval_invoice
AFTER INSERT OR UPDATE OF total, status, type ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.auto_request_invoice_approval();

-- Partner commissions
CREATE OR REPLACE FUNCTION public.auto_request_commission_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  th record;
  pname text;
BEGIN
  IF NEW.status IN ('paid','cancelled','rejected') THEN
    RETURN NEW;
  END IF;
  SELECT * INTO th FROM public.get_approval_thresholds();
  IF NEW.amount IS NULL OR NEW.amount < th.commission THEN
    RETURN NEW;
  END IF;
  SELECT company_name INTO pname FROM public.partners WHERE id = NEW.partner_id;
  PERFORM public.ensure_approval_request(
    'commission_invoice',
    NEW.id,
    format('Commission %s %s meets approval threshold %s',
           NEW.currency, NEW.amount::text, th.commission::text),
    jsonb_build_object(
      'amount', NEW.amount,
      'currency', NEW.currency,
      'threshold', th.commission,
      'partner_id', NEW.partner_id,
      'partner_name', pname
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_approval_commission ON public.partner_commissions;
CREATE TRIGGER trg_auto_approval_commission
AFTER INSERT OR UPDATE OF amount, status ON public.partner_commissions
FOR EACH ROW EXECUTE FUNCTION public.auto_request_commission_approval();

-- Quotations: discount threshold check driven by quotation_items
CREATE OR REPLACE FUNCTION public.evaluate_quotation_discount_approval(_quotation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  th record;
  max_discount numeric;
  q record;
BEGIN
  SELECT * INTO q FROM public.quotations WHERE id = _quotation_id;
  IF q IS NULL OR q.status IN ('rejected','converted','expired') THEN
    RETURN;
  END IF;
  SELECT * INTO th FROM public.get_approval_thresholds();
  SELECT COALESCE(MAX(discount_pct), 0) INTO max_discount
  FROM public.quotation_items WHERE quotation_id = _quotation_id;
  IF max_discount < th.discount_pct THEN
    RETURN;
  END IF;
  PERFORM public.ensure_approval_request(
    'quotation_discount',
    _quotation_id,
    format('Discount %s%% meets approval threshold %s%%',
           max_discount::text, th.discount_pct::text),
    jsonb_build_object(
      'max_discount_pct', max_discount,
      'threshold_pct', th.discount_pct,
      'quotation_number', q.quotation_number,
      'total', q.total,
      'currency', q.currency
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_request_quotation_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public.evaluate_quotation_discount_approval(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_approval_quotation ON public.quotations;
CREATE TRIGGER trg_auto_approval_quotation
AFTER INSERT OR UPDATE OF total, status ON public.quotations
FOR EACH ROW EXECUTE FUNCTION public.auto_request_quotation_approval();

CREATE OR REPLACE FUNCTION public.auto_request_quotation_item_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public.evaluate_quotation_discount_approval(COALESCE(NEW.quotation_id, OLD.quotation_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_approval_quotation_items ON public.quotation_items;
CREATE TRIGGER trg_auto_approval_quotation_items
AFTER INSERT OR UPDATE OF discount_pct, quantity, unit_price OR DELETE ON public.quotation_items
FOR EACH ROW EXECUTE FUNCTION public.auto_request_quotation_item_approval();
