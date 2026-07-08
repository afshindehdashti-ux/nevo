
-- =====================================================================
-- Finance rewrite — Step 1: additive schema (no drops, no renames)
-- =====================================================================

-- ---------- customers: add spec fields alongside existing ones ----------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS billing_address text;

UPDATE public.customers
   SET company_name = COALESCE(company_name, name),
       billing_address = COALESCE(billing_address, address);

-- Keep new columns in sync with legacy ones during transition period
CREATE OR REPLACE FUNCTION public.customers_sync_alias_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- company_name <-> name
    IF NEW.company_name IS DISTINCT FROM COALESCE(OLD.company_name, NULL::text)
       AND NEW.company_name IS NOT NULL THEN
      NEW.name := NEW.company_name;
    ELSIF NEW.name IS DISTINCT FROM COALESCE(OLD.name, NULL::text)
       AND NEW.name IS NOT NULL THEN
      NEW.company_name := NEW.name;
    ELSIF NEW.company_name IS NULL AND NEW.name IS NOT NULL THEN
      NEW.company_name := NEW.name;
    ELSIF NEW.name IS NULL AND NEW.company_name IS NOT NULL THEN
      NEW.name := NEW.company_name;
    END IF;

    -- billing_address <-> address
    IF NEW.billing_address IS DISTINCT FROM COALESCE(OLD.billing_address, NULL::text)
       AND NEW.billing_address IS NOT NULL THEN
      NEW.address := NEW.billing_address;
    ELSIF NEW.address IS DISTINCT FROM COALESCE(OLD.address, NULL::text)
       AND NEW.address IS NOT NULL THEN
      NEW.billing_address := NEW.address;
    ELSIF NEW.billing_address IS NULL AND NEW.address IS NOT NULL THEN
      NEW.billing_address := NEW.address;
    ELSIF NEW.address IS NULL AND NEW.billing_address IS NOT NULL THEN
      NEW.address := NEW.billing_address;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customers_sync_alias ON public.customers;
CREATE TRIGGER trg_customers_sync_alias
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.customers_sync_alias_columns();

-- ---------- invoices: add spec fields (kept alongside existing) ----------
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS proforma_invoice_id uuid,
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS discount_total numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_total numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Mirror existing vat_amount into tax_total so downstream reads work
UPDATE public.invoices SET tax_total = vat_amount WHERE tax_total = 0 AND vat_amount > 0;

-- ---------- invoice_items: add spec fields (kept alongside existing) ----------
ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS discount numeric(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate numeric(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

UPDATE public.invoice_items SET discount = discount_pct WHERE discount = 0 AND discount_pct > 0;
UPDATE public.invoice_items SET tax_rate = vat_pct WHERE tax_rate = 0 AND vat_pct > 0;
UPDATE public.invoice_items SET sort_order = position WHERE sort_order = 0 AND position > 0;

-- ---------- proforma_invoices (net-new, per spec) ----------
CREATE TABLE IF NOT EXISTS public.proforma_invoices (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proforma_number   text UNIQUE,
  customer_id       uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  opportunity_id    uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  order_id          uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  status            text NOT NULL DEFAULT 'draft',
  currency          text NOT NULL DEFAULT 'USD',
  subtotal          numeric(14,2) NOT NULL DEFAULT 0,
  discount_total    numeric(14,2) NOT NULL DEFAULT 0,
  tax_total         numeric(14,2) NOT NULL DEFAULT 0,
  total             numeric(14,2) NOT NULL DEFAULT 0,
  valid_until       date,
  payment_terms     text,
  delivery_terms    text,
  notes             text,
  created_by        uuid,
  approved_by       uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proforma_invoices_status_check CHECK (
    status IN ('draft','sent','approved','accepted','rejected','converted_to_invoice','cancelled')
  ),
  CONSTRAINT proforma_invoices_currency_check CHECK (char_length(currency) BETWEEN 3 AND 8)
);

CREATE INDEX IF NOT EXISTS idx_proforma_invoices_customer ON public.proforma_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_proforma_invoices_order ON public.proforma_invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_proforma_invoices_opportunity ON public.proforma_invoices(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_proforma_invoices_status ON public.proforma_invoices(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proforma_invoices TO authenticated;
GRANT ALL ON public.proforma_invoices TO service_role;

ALTER TABLE public.proforma_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY proforma_invoices_select ON public.proforma_invoices
  FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[])
    OR is_customer_user(auth.uid(), customer_id)
  );

CREATE POLICY proforma_invoices_insert ON public.proforma_invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['super_admin','management','sales','finance']::app_role[])
  );

CREATE POLICY proforma_invoices_update ON public.proforma_invoices
  FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','management','sales','finance']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','management','sales','finance']::app_role[]));

CREATE POLICY proforma_invoices_delete ON public.proforma_invoices
  FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

-- ---------- proforma_invoice_items ----------
CREATE TABLE IF NOT EXISTS public.proforma_invoice_items (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proforma_invoice_id   uuid NOT NULL REFERENCES public.proforma_invoices(id) ON DELETE CASCADE,
  product_id            uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description           text NOT NULL,
  quantity              numeric(14,3) NOT NULL DEFAULT 1,
  unit                  text NOT NULL DEFAULT 'pcs',
  unit_price            numeric(14,4) NOT NULL DEFAULT 0,
  discount              numeric(6,3) NOT NULL DEFAULT 0,
  tax_rate              numeric(6,3) NOT NULL DEFAULT 0,
  line_total            numeric(14,2) NOT NULL DEFAULT 0,
  sort_order            integer NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proforma_items_pi ON public.proforma_invoice_items(proforma_invoice_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proforma_invoice_items TO authenticated;
GRANT ALL ON public.proforma_invoice_items TO service_role;

ALTER TABLE public.proforma_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY pii_select ON public.proforma_invoice_items
  FOR SELECT TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[])
    OR EXISTS (
      SELECT 1 FROM public.proforma_invoices pi
      WHERE pi.id = proforma_invoice_items.proforma_invoice_id
        AND is_customer_user(auth.uid(), pi.customer_id)
    )
  );

CREATE POLICY pii_write ON public.proforma_invoice_items
  FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','management','sales','finance']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','management','sales','finance']::app_role[]));

-- ---------- proforma_invoices numbering trigger (PRO-YYYY-00001) ----------
-- proforma_number_seq already exists (used by next_invoice_number).
CREATE OR REPLACE FUNCTION public.proforma_invoices_assign_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.proforma_number IS NULL OR NEW.proforma_number = '' THEN
    NEW.proforma_number := 'PRO-' || to_char(now(),'YYYY') || '-' ||
                           lpad(nextval('public.proforma_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proforma_assign_number ON public.proforma_invoices;
CREATE TRIGGER trg_proforma_assign_number
  BEFORE INSERT ON public.proforma_invoices
  FOR EACH ROW EXECUTE FUNCTION public.proforma_invoices_assign_number();

-- ---------- proforma totals recalc ----------
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
BEGIN
  -- line_subtotal = qty*unit_price
  -- line_discount = line_subtotal * discount/100
  -- line_taxable  = line_subtotal - line_discount
  -- line_tax      = line_taxable * tax_rate/100
  -- line_total    = line_taxable + line_tax
  SELECT
    COALESCE(SUM(quantity * unit_price), 0),
    COALESCE(SUM(quantity * unit_price * discount / 100.0), 0),
    COALESCE(SUM((quantity * unit_price - quantity * unit_price * discount / 100.0) * tax_rate / 100.0), 0),
    COALESCE(SUM(
      (quantity * unit_price - quantity * unit_price * discount / 100.0)
      * (1 + tax_rate / 100.0)
    ), 0)
  INTO v_subtotal, v_discount_tot, v_tax_tot, v_grand
  FROM public.proforma_invoice_items
  WHERE proforma_invoice_id = pi_id;

  UPDATE public.proforma_invoices SET
    subtotal       = round(v_subtotal - v_discount_tot, 2),
    discount_total = round(v_discount_tot, 2),
    tax_total      = round(v_tax_tot, 2),
    total          = round(v_grand, 2),
    updated_at     = now()
  WHERE id = pi_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_proforma_totals ON public.proforma_invoice_items;
CREATE TRIGGER trg_recalc_proforma_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.proforma_invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.recalc_proforma_totals();

-- Also recompute per-line line_total on write
CREATE OR REPLACE FUNCTION public.proforma_item_compute_line_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  gross   numeric := COALESCE(NEW.quantity,0) * COALESCE(NEW.unit_price,0);
  disc    numeric := gross * COALESCE(NEW.discount,0) / 100.0;
  taxable numeric := gross - disc;
  tax     numeric := taxable * COALESCE(NEW.tax_rate,0) / 100.0;
BEGIN
  NEW.line_total := round(taxable + tax, 2);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proforma_item_line_total ON public.proforma_invoice_items;
CREATE TRIGGER trg_proforma_item_line_total
  BEFORE INSERT OR UPDATE ON public.proforma_invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.proforma_item_compute_line_total();

-- ---------- updated_at touch triggers ----------
DROP TRIGGER IF EXISTS trg_proforma_touch ON public.proforma_invoices;
CREATE TRIGGER trg_proforma_touch BEFORE UPDATE ON public.proforma_invoices
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

DROP TRIGGER IF EXISTS trg_proforma_items_touch ON public.proforma_invoice_items;
CREATE TRIGGER trg_proforma_items_touch BEFORE UPDATE ON public.proforma_invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ---------- delete audit trigger ----------
DROP TRIGGER IF EXISTS trg_proforma_del ON public.proforma_invoices;
CREATE TRIGGER trg_proforma_del AFTER DELETE ON public.proforma_invoices
  FOR EACH ROW EXECUTE FUNCTION public.log_row_delete();

-- ---------- convert_proforma_to_invoice RPC ----------
CREATE OR REPLACE FUNCTION public.convert_proforma_to_invoice(_proforma_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pi     public.proforma_invoices;
  new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::app_role[]) THEN
    RAISE EXCEPTION 'not authorised to convert proforma';
  END IF;

  SELECT * INTO pi FROM public.proforma_invoices WHERE id = _proforma_id FOR UPDATE;
  IF pi IS NULL THEN
    RAISE EXCEPTION 'proforma not found';
  END IF;
  IF pi.status = 'converted_to_invoice' THEN
    RAISE EXCEPTION 'proforma already converted';
  END IF;

  INSERT INTO public.invoices (
    type, status, customer_id, order_id, issue_date, currency,
    subtotal, vat_amount, tax_total, discount_total, total,
    amount_paid, balance, payment_terms, notes,
    proforma_invoice_id, created_by
  ) VALUES (
    'commercial'::invoice_type, 'draft'::invoice_status, pi.customer_id, pi.order_id, CURRENT_DATE, pi.currency,
    pi.subtotal, pi.tax_total, pi.tax_total, pi.discount_total, pi.total,
    0, pi.total, pi.payment_terms, pi.notes,
    pi.id, auth.uid()
  ) RETURNING id INTO new_id;

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
    auth.uid(), 'convert_proforma_to_invoice', 'proforma_invoice', pi.id::text,
    jsonb_build_object('invoice_id', new_id, 'converted_at', now())
  );

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convert_proforma_to_invoice(uuid) TO authenticated;

-- ---------- activity log helper on proforma create ----------
CREATE OR REPLACE FUNCTION public.log_proforma_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  act text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    act := 'proforma_created';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      act := 'proforma_status_' || NEW.status;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(), act, 'proforma_invoice', NEW.id::text,
    jsonb_build_object('proforma_number', NEW.proforma_number, 'total', NEW.total, 'currency', NEW.currency)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_proforma_change ON public.proforma_invoices;
CREATE TRIGGER trg_log_proforma_change
  AFTER INSERT OR UPDATE ON public.proforma_invoices
  FOR EACH ROW EXECUTE FUNCTION public.log_proforma_change();
