-- Keep the finance workflow on the canonical Phase 2 proforma tables.
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS converted_proforma_invoice_id uuid
  REFERENCES public.proforma_invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quotations_converted_proforma
  ON public.quotations(converted_proforma_invoice_id)
  WHERE converted_proforma_invoice_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.convert_quotation_to_proforma(_quotation_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.quotations;
  new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.has_any_role(
    auth.uid(),
    ARRAY['super_admin','management','sales','operations','finance']::public.app_role[]
  ) THEN
    RAISE EXCEPTION 'not authorised to convert quotation';
  END IF;

  SELECT * INTO q
  FROM public.quotations
  WHERE id = _quotation_id
  FOR UPDATE;

  IF q IS NULL THEN
    RAISE EXCEPTION 'quotation not found';
  END IF;
  IF q.converted_proforma_invoice_id IS NOT NULL THEN
    RETURN q.converted_proforma_invoice_id;
  END IF;
  IF q.converted_invoice_id IS NOT NULL THEN
    RAISE EXCEPTION 'quotation was converted using the legacy invoice workflow';
  END IF;
  IF q.customer_id IS NULL THEN
    RAISE EXCEPTION 'quotation has no customer';
  END IF;
  IF q.status NOT IN ('approved'::public.quotation_status, 'accepted'::public.quotation_status) THEN
    RAISE EXCEPTION 'quotation must be approved or accepted before conversion';
  END IF;

  INSERT INTO public.proforma_invoices (
    customer_id, status, currency, subtotal, discount_total, tax_total,
    total, valid_until, payment_terms, notes, vat_rate, vat_amount,
    grand_total, balance_due, payment_status, created_by
  ) VALUES (
    q.customer_id, 'draft', q.currency, q.subtotal, 0, q.vat_amount,
    q.total, q.valid_until, q.terms, q.notes, q.vat_rate, q.vat_amount,
    q.total, q.total, 'Unpaid', auth.uid()
  )
  RETURNING id INTO new_id;

  INSERT INTO public.proforma_invoice_items (
    proforma_invoice_id, product_id, item_code, description, quantity,
    unit, unit_price, discount, discount_amount, tax_rate, sort_order
  )
  SELECT
    new_id,
    qi.product_id,
    qi.item_code,
    qi.description,
    qi.quantity,
    COALESCE(qi.unit, 'pcs'),
    qi.unit_price,
    qi.discount_pct,
    round(qi.quantity * qi.unit_price * qi.discount_pct / 100.0, 2),
    q.vat_rate,
    qi.position
  FROM public.quotation_items qi
  WHERE qi.quotation_id = q.id
  ORDER BY qi.position;

  UPDATE public.quotations
  SET converted_proforma_invoice_id = new_id,
      status = 'converted'::public.quotation_status,
      updated_at = now()
  WHERE id = q.id;

  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'convert_quotation_to_proforma',
    'quotation',
    q.id,
    jsonb_build_object(
      'proforma_invoice_id', new_id,
      'quotation_number', q.quotation_number,
      'converted_at', now()
    )
  );

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.convert_quotation_to_proforma(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_quotation_to_proforma(uuid) TO authenticated;

-- Make the existing canonical proforma conversion idempotent and preserve any
-- payment amount already recorded against the proforma.
CREATE OR REPLACE FUNCTION public.convert_proforma_to_invoice(_proforma_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pi public.proforma_invoices;
  new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.has_any_role(
    auth.uid(),
    ARRAY['super_admin','management','finance']::public.app_role[]
  ) THEN
    RAISE EXCEPTION 'not authorised to convert proforma';
  END IF;

  SELECT * INTO pi
  FROM public.proforma_invoices
  WHERE id = _proforma_id
  FOR UPDATE;

  IF pi IS NULL THEN
    RAISE EXCEPTION 'proforma not found';
  END IF;

  SELECT id INTO new_id
  FROM public.invoices
  WHERE proforma_invoice_id = pi.id AND type = 'commercial'::public.invoice_type
  ORDER BY created_at
  LIMIT 1;

  IF new_id IS NOT NULL THEN
    IF pi.status <> 'converted_to_invoice' THEN
      UPDATE public.proforma_invoices
      SET status = 'converted_to_invoice', updated_at = now()
      WHERE id = pi.id;
    END IF;
    RETURN new_id;
  END IF;

  IF pi.status NOT IN ('approved', 'accepted') THEN
    RAISE EXCEPTION 'proforma must be approved or accepted before conversion';
  END IF;

  INSERT INTO public.invoices (
    type, status, customer_id, order_id, issue_date, currency,
    subtotal, vat_amount, tax_total, discount_total, total,
    amount_paid, balance, payment_terms, notes,
    proforma_invoice_id, created_by
  ) VALUES (
    'commercial'::public.invoice_type,
    CASE
      WHEN pi.amount_paid >= pi.total AND pi.total > 0 THEN 'paid'::public.invoice_status
      WHEN pi.amount_paid > 0 THEN 'partially_paid'::public.invoice_status
      ELSE 'draft'::public.invoice_status
    END,
    pi.customer_id,
    pi.order_id,
    CURRENT_DATE,
    pi.currency,
    pi.subtotal,
    pi.tax_total,
    pi.tax_total,
    pi.discount_total,
    pi.total,
    pi.amount_paid,
    GREATEST(pi.total - pi.amount_paid, 0),
    pi.payment_terms,
    pi.notes,
    pi.id,
    auth.uid()
  )
  RETURNING id INTO new_id;

  INSERT INTO public.invoice_items (
    invoice_id, product_id, description, quantity, unit, unit_price,
    discount_pct, vat_pct, discount, tax_rate, line_total, position, sort_order
  )
  SELECT
    new_id, product_id, description, quantity, unit, unit_price,
    discount, tax_rate, discount, tax_rate, line_total, sort_order, sort_order
  FROM public.proforma_invoice_items
  WHERE proforma_invoice_id = pi.id
  ORDER BY sort_order;

  UPDATE public.proforma_invoices
  SET status = 'converted_to_invoice', updated_at = now()
  WHERE id = pi.id;

  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'convert_proforma_to_invoice',
    'proforma_invoice',
    pi.id,
    jsonb_build_object('invoice_id', new_id, 'converted_at', now())
  );

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.convert_proforma_to_invoice(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_proforma_to_invoice(uuid) TO authenticated;
