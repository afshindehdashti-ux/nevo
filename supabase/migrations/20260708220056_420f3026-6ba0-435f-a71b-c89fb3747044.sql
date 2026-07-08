
-- 1) Recompute proforma totals from line items, now also deriving vat_rate as
--    the blended effective rate (tax_total / taxable_base * 100). Keeps every
--    "mirror" column (discount_amount ↔ discount_total, vat_amount ↔
--    tax_total, grand_total ↔ total) in sync so PDFs and the UI never disagree.
CREATE OR REPLACE FUNCTION public.recalc_proforma_totals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  pi_id uuid := COALESCE(NEW.proforma_invoice_id, OLD.proforma_invoice_id);
  v_subtotal      numeric(14,2) := 0;
  v_discount_tot  numeric(14,2) := 0;
  v_tax_tot       numeric(14,2) := 0;
  v_grand         numeric(14,2) := 0;
  v_paid          numeric(14,2) := 0;
  v_taxable_base  numeric(14,2) := 0;
  v_vat_rate      numeric(6,2)  := 0;
BEGIN
  SELECT
    COALESCE(SUM(quantity * unit_price), 0),
    COALESCE(SUM(
      CASE WHEN COALESCE(discount_amount,0) > 0
           THEN discount_amount
           ELSE quantity * unit_price * COALESCE(discount,0) / 100.0
      END
    ), 0),
    COALESCE(SUM(
      (quantity * unit_price
        - CASE WHEN COALESCE(discount_amount,0) > 0
               THEN discount_amount
               ELSE quantity * unit_price * COALESCE(discount,0) / 100.0
          END
      ) * COALESCE(tax_rate,0) / 100.0
    ), 0),
    COALESCE(SUM(line_total), 0)
  INTO v_subtotal, v_discount_tot, v_tax_tot, v_grand
  FROM public.proforma_invoice_items
  WHERE proforma_invoice_id = pi_id;

  -- Effective taxable base = gross - discounts
  v_taxable_base := GREATEST(v_subtotal - v_discount_tot, 0);
  IF v_taxable_base > 0 THEN
    v_vat_rate := round(v_tax_tot / v_taxable_base * 100, 2);
  ELSE
    v_vat_rate := 0;
  END IF;

  SELECT COALESCE(amount_paid, 0) INTO v_paid
    FROM public.proforma_invoices WHERE id = pi_id;

  UPDATE public.proforma_invoices SET
    subtotal        = round(v_subtotal - v_discount_tot, 2),
    discount_total  = round(v_discount_tot, 2),
    discount_amount = round(v_discount_tot, 2),
    tax_total       = round(v_tax_tot, 2),
    vat_amount      = round(v_tax_tot, 2),
    vat_rate        = v_vat_rate,
    total           = round(v_grand, 2),
    grand_total     = round(v_grand, 2),
    balance_due     = GREATEST(round(v_grand, 2) - COALESCE(v_paid, 0), 0),
    payment_status  = CASE
      WHEN COALESCE(v_paid,0) <= 0 THEN 'Unpaid'
      WHEN COALESCE(v_paid,0) >= v_grand AND v_grand > 0 THEN 'Paid'
      ELSE 'Partially Paid'
    END,
    updated_at = now()
  WHERE id = pi_id;

  RETURN NULL;
END;
$function$;

-- 2) BEFORE trigger on the header itself: whenever grand_total or amount_paid
--    changes directly (payment entry, manual edit, mirror sync), keep
--    balance_due and payment_status consistent without waiting for an item
--    change to fire the recalc.
CREATE OR REPLACE FUNCTION public.proforma_sync_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  g numeric(14,2) := COALESCE(NEW.grand_total, NEW.total, 0);
  p numeric(14,2) := COALESCE(NEW.amount_paid, 0);
BEGIN
  -- Ensure mirror columns cannot drift
  NEW.grand_total := g;
  NEW.total       := g;
  NEW.discount_amount := COALESCE(NEW.discount_amount, NEW.discount_total, 0);
  NEW.discount_total  := NEW.discount_amount;
  NEW.vat_amount := COALESCE(NEW.vat_amount, NEW.tax_total, 0);
  NEW.tax_total  := NEW.vat_amount;

  NEW.balance_due := GREATEST(g - p, 0);
  NEW.payment_status := CASE
    WHEN p <= 0 THEN 'Unpaid'
    WHEN p >= g AND g > 0 THEN 'Paid'
    ELSE 'Partially Paid'
  END;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_proforma_sync_balance ON public.proforma_invoices;
CREATE TRIGGER trg_proforma_sync_balance
BEFORE INSERT OR UPDATE ON public.proforma_invoices
FOR EACH ROW EXECUTE FUNCTION public.proforma_sync_balance();

-- 3) Backfill every existing proforma so historical rows also match the new
--    invariants (vat_rate, mirrored columns, balance_due, payment_status).
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.proforma_invoices LOOP
    -- Touch one item per proforma (if any) to fire the recalc, otherwise
    -- update the header itself so the sync trigger normalises it.
    IF EXISTS (SELECT 1 FROM public.proforma_invoice_items WHERE proforma_invoice_id = r.id) THEN
      UPDATE public.proforma_invoice_items
         SET updated_at = now()
       WHERE id = (SELECT id FROM public.proforma_invoice_items
                    WHERE proforma_invoice_id = r.id
                    ORDER BY sort_order NULLS LAST, created_at LIMIT 1);
    ELSE
      UPDATE public.proforma_invoices SET updated_at = now() WHERE id = r.id;
    END IF;
  END LOOP;
END $$;
