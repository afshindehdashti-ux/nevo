
-- 1) Update generator: quotations -> QUO-YYYY-####
CREATE OR REPLACE FUNCTION public.next_quotation_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n bigint; y text := to_char(now(),'YYYY');
BEGIN
  n := nextval('public.quotation_number_seq');
  RETURN 'QUO-' || y || '-' || lpad(n::text, 4, '0');
END $$;

-- 2) Update generator: invoices -> PRO- / INV- YYYY-####
CREATE OR REPLACE FUNCTION public.next_invoice_number(_type invoice_type)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n bigint; y text := to_char(now(),'YYYY');
BEGIN
  IF _type = 'proforma' THEN
    n := nextval('public.proforma_number_seq');
    RETURN 'PRO-' || y || '-' || lpad(n::text, 4, '0');
  ELSE
    n := nextval('public.commercial_number_seq');
    RETURN 'INV-' || y || '-' || lpad(n::text, 4, '0');
  END IF;
END $$;

-- 3) Update generator: partner commissions -> COM-YYYY-####
CREATE OR REPLACE FUNCTION public.next_commission_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n bigint; y text := to_char(now(),'YYYY');
BEGIN
  n := nextval('public.commission_number_seq');
  RETURN 'COM-' || y || '-' || lpad(n::text, 4, '0');
END $$;

-- 4) Update generator: unified finance_documents -> QUO/PRO/INV/ORD/COM-YYYY-####
CREATE OR REPLACE FUNCTION public.next_document_number(_doc_type public.finance_document_type)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _prefix text; _year int := extract(year from now())::int; _next bigint; _pad int;
BEGIN
  _prefix := CASE _doc_type
    WHEN 'quotation'           THEN 'QUO'
    WHEN 'proforma_invoice'    THEN 'PRO'
    WHEN 'commercial_invoice'  THEN 'INV'
    WHEN 'purchase_order'      THEN 'ORD'
    WHEN 'commission_invoice'  THEN 'COM'
  END;
  INSERT INTO public.number_sequences (doc_type, year, prefix, last_value)
    VALUES (_doc_type, _year, _prefix, 1)
    ON CONFLICT (doc_type, year)
    DO UPDATE SET last_value = number_sequences.last_value + 1,
                  prefix = EXCLUDED.prefix,
                  updated_at = now()
    RETURNING last_value, padding INTO _next, _pad;
  RETURN _prefix || '-' || _year::text || '-' || lpad(_next::text, _pad, '0');
END; $$;

-- 5) Refresh stored prefixes on any pre-existing per-year sequence rows
UPDATE public.number_sequences SET prefix = 'QUO' WHERE doc_type = 'quotation'          AND prefix <> 'QUO';
UPDATE public.number_sequences SET prefix = 'PRO' WHERE doc_type = 'proforma_invoice'   AND prefix <> 'PRO';
UPDATE public.number_sequences SET prefix = 'INV' WHERE doc_type = 'commercial_invoice' AND prefix <> 'INV';
UPDATE public.number_sequences SET prefix = 'ORD' WHERE doc_type = 'purchase_order'     AND prefix <> 'ORD';
UPDATE public.number_sequences SET prefix = 'COM' WHERE doc_type = 'commission_invoice' AND prefix <> 'COM';

-- 6) Orders: auto-assign order_number as ORD-YYYY-####
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1000;
GRANT USAGE ON SEQUENCE public.order_number_seq TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n bigint; y text := to_char(now(),'YYYY');
BEGIN
  n := nextval('public.order_number_seq');
  RETURN 'ORD-' || y || '-' || lpad(n::text, 4, '0');
END $$;
REVOKE ALL ON FUNCTION public.next_order_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_order_number() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.assign_order_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.next_order_number();
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_orders_assign_number ON public.orders;
CREATE TRIGGER trg_orders_assign_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.assign_order_number();

-- 7) Payments: add payment_number + PAY-YYYY-#### auto-assign
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_number text UNIQUE;

CREATE SEQUENCE IF NOT EXISTS public.payment_number_seq START 1000;
GRANT USAGE ON SEQUENCE public.payment_number_seq TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.next_payment_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n bigint; y text := to_char(now(),'YYYY');
BEGIN
  n := nextval('public.payment_number_seq');
  RETURN 'PAY-' || y || '-' || lpad(n::text, 4, '0');
END $$;
REVOKE ALL ON FUNCTION public.next_payment_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_payment_number() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.assign_payment_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
    NEW.payment_number := public.next_payment_number();
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_payments_assign_number ON public.payments;
CREATE TRIGGER trg_payments_assign_number
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.assign_payment_number();

-- 8) Update document_settings defaults + refresh existing rows
ALTER TABLE public.document_settings ALTER COLUMN quotation_prefix      SET DEFAULT 'QUO';
ALTER TABLE public.document_settings ALTER COLUMN proforma_prefix       SET DEFAULT 'PRO';
ALTER TABLE public.document_settings ALTER COLUMN invoice_prefix        SET DEFAULT 'INV';
ALTER TABLE public.document_settings ALTER COLUMN commission_prefix     SET DEFAULT 'COM';
ALTER TABLE public.document_settings ALTER COLUMN purchase_order_prefix SET DEFAULT 'ORD';

UPDATE public.document_settings
   SET quotation_prefix      = CASE WHEN quotation_prefix      IN ('QTN-NEVO','QT','QTN') THEN 'QUO' ELSE quotation_prefix END,
       proforma_prefix       = CASE WHEN proforma_prefix       IN ('PI-NEVO','PI')        THEN 'PRO' ELSE proforma_prefix END,
       invoice_prefix        = CASE WHEN invoice_prefix        IN ('INV-NEVO','CI-NEVO','CI') THEN 'INV' ELSE invoice_prefix END,
       commission_prefix     = CASE WHEN commission_prefix     IN ('CI-NEVO','COM-NEVO','CI') THEN 'COM' ELSE commission_prefix END,
       purchase_order_prefix = CASE WHEN purchase_order_prefix IN ('PO-NEVO','PO')        THEN 'ORD' ELSE purchase_order_prefix END,
       updated_at = now();
