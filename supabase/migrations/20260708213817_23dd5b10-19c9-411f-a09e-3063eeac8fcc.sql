
-- 1) Add missing financial + metadata columns to proforma_invoices.
--    Do NOT drop existing columns (subtotal/discount_total/tax_total/total)
--    to avoid breaking existing code paths; add mirror + extension columns.
ALTER TABLE public.proforma_invoices
  ADD COLUMN IF NOT EXISTS discount_amount  numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_rate         numeric(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_amount       numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grand_total      numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_paid      numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due      numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status   text          NOT NULL DEFAULT 'Unpaid',
  ADD COLUMN IF NOT EXISTS incoterms        text,
  ADD COLUMN IF NOT EXISTS terms_conditions text,
  ADD COLUMN IF NOT EXISTS bank_details     text,
  ADD COLUMN IF NOT EXISTS prepared_by      text;

-- Backfill mirrors so existing rows are consistent.
UPDATE public.proforma_invoices
   SET vat_amount     = COALESCE(tax_total, 0),
       grand_total    = COALESCE(total, 0),
       discount_amount = COALESCE(discount_total, 0),
       balance_due    = GREATEST(COALESCE(total, 0) - COALESCE(amount_paid, 0), 0),
       payment_status = CASE
         WHEN COALESCE(amount_paid, 0) <= 0 THEN 'Unpaid'
         WHEN COALESCE(amount_paid, 0) >= COALESCE(total, 0) AND COALESCE(total,0) > 0 THEN 'Paid'
         ELSE 'Partially Paid'
       END
 WHERE vat_amount = 0 AND grand_total = 0;

-- 2) proforma_invoice_items: add item_code + discount_amount alongside
--    the existing discount (percent) column.
ALTER TABLE public.proforma_invoice_items
  ADD COLUMN IF NOT EXISTS item_code       text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(14,2) NOT NULL DEFAULT 0;

-- 3) Update line-total trigger: prefer discount_amount when > 0.
CREATE OR REPLACE FUNCTION public.proforma_item_compute_line_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  gross      numeric := COALESCE(NEW.quantity, 0) * COALESCE(NEW.unit_price, 0);
  disc_amt   numeric := COALESCE(NEW.discount_amount, 0);
  disc_pct   numeric := gross * COALESCE(NEW.discount, 0) / 100.0;
  disc_final numeric := CASE WHEN disc_amt > 0 THEN disc_amt ELSE disc_pct END;
  taxable    numeric := gross - disc_final;
  tax        numeric := taxable * COALESCE(NEW.tax_rate, 0) / 100.0;
BEGIN
  NEW.line_total := round(taxable + tax, 2);
  RETURN NEW;
END;
$$;

-- 4) Update recalc trigger to also populate vat_amount / grand_total /
--    discount_amount / balance_due / payment_status on the parent invoice.
CREATE OR REPLACE FUNCTION public.recalc_proforma_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pi_id uuid := COALESCE(NEW.proforma_invoice_id, OLD.proforma_invoice_id);
  v_subtotal      numeric(14,2) := 0;
  v_discount_tot  numeric(14,2) := 0;
  v_tax_tot       numeric(14,2) := 0;
  v_grand         numeric(14,2) := 0;
  v_paid          numeric(14,2) := 0;
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

  SELECT COALESCE(amount_paid, 0) INTO v_paid
    FROM public.proforma_invoices WHERE id = pi_id;

  UPDATE public.proforma_invoices SET
    subtotal        = round(v_subtotal - v_discount_tot, 2),
    discount_total  = round(v_discount_tot, 2),
    discount_amount = round(v_discount_tot, 2),
    tax_total       = round(v_tax_tot, 2),
    vat_amount      = round(v_tax_tot, 2),
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
$$;

-- 5) Trigger on proforma_invoices itself: keep mirrors + payment status
--    in sync when the parent row is written directly (e.g. amount_paid change,
--    or an insert with subtotal/vat_amount only and no items).
CREATE OR REPLACE FUNCTION public.proforma_invoices_sync_mirrors()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Keep the two naming conventions aligned in both directions.
  IF NEW.vat_amount IS DISTINCT FROM COALESCE(OLD.vat_amount, -1)
     AND NEW.vat_amount IS NOT NULL AND NEW.vat_amount <> 0
     AND (NEW.tax_total IS NULL OR NEW.tax_total = 0) THEN
    NEW.tax_total := NEW.vat_amount;
  END IF;
  IF NEW.tax_total IS DISTINCT FROM COALESCE(OLD.tax_total, -1)
     AND (NEW.vat_amount IS NULL OR NEW.vat_amount = 0) THEN
    NEW.vat_amount := COALESCE(NEW.tax_total, 0);
  END IF;

  IF NEW.grand_total IS DISTINCT FROM COALESCE(OLD.grand_total, -1)
     AND NEW.grand_total IS NOT NULL AND NEW.grand_total <> 0
     AND (NEW.total IS NULL OR NEW.total = 0) THEN
    NEW.total := NEW.grand_total;
  END IF;
  IF NEW.total IS DISTINCT FROM COALESCE(OLD.total, -1)
     AND (NEW.grand_total IS NULL OR NEW.grand_total = 0) THEN
    NEW.grand_total := COALESCE(NEW.total, 0);
  END IF;

  IF NEW.discount_amount IS DISTINCT FROM COALESCE(OLD.discount_amount, -1)
     AND NEW.discount_amount IS NOT NULL AND NEW.discount_amount <> 0
     AND (NEW.discount_total IS NULL OR NEW.discount_total = 0) THEN
    NEW.discount_total := NEW.discount_amount;
  END IF;
  IF NEW.discount_total IS DISTINCT FROM COALESCE(OLD.discount_total, -1)
     AND (NEW.discount_amount IS NULL OR NEW.discount_amount = 0) THEN
    NEW.discount_amount := COALESCE(NEW.discount_total, 0);
  END IF;

  -- Balance + payment status derived from grand_total & amount_paid.
  NEW.balance_due := GREATEST(COALESCE(NEW.grand_total, 0) - COALESCE(NEW.amount_paid, 0), 0);
  NEW.payment_status := CASE
    WHEN COALESCE(NEW.amount_paid, 0) <= 0 THEN 'Unpaid'
    WHEN COALESCE(NEW.amount_paid, 0) >= COALESCE(NEW.grand_total, 0)
         AND COALESCE(NEW.grand_total, 0) > 0 THEN 'Paid'
    ELSE 'Partially Paid'
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proforma_sync_mirrors ON public.proforma_invoices;
CREATE TRIGGER trg_proforma_sync_mirrors
  BEFORE INSERT OR UPDATE ON public.proforma_invoices
  FOR EACH ROW EXECUTE FUNCTION public.proforma_invoices_sync_mirrors();

-- 6) Refresh PostgREST schema cache so the new columns are visible immediately.
NOTIFY pgrst, 'reload schema';
