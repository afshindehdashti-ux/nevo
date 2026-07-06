
-- =========================================================
-- Helper: any-role check
-- =========================================================
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;
REVOKE ALL ON FUNCTION public.has_any_role(uuid, app_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated, service_role;

-- =========================================================
-- Enums
-- =========================================================
CREATE TYPE public.order_status AS ENUM
  ('draft','confirmed','in_production','ready_to_ship','shipped','delivered','cancelled');

CREATE TYPE public.invoice_type AS ENUM ('proforma','commercial');
CREATE TYPE public.invoice_status AS ENUM
  ('draft','issued','partially_paid','paid','overdue','void');

CREATE TYPE public.payment_method AS ENUM ('bank_transfer','card','cash','letter_of_credit','other');

CREATE TYPE public.shipment_status AS ENUM ('preparing','in_transit','delivered','cancelled');

CREATE TYPE public.document_entity AS ENUM ('order','invoice','shipment','customer');
CREATE TYPE public.document_kind AS ENUM
  ('proforma_pdf','commercial_pdf','packing_list','bill_of_lading','coa','contract','other');

-- =========================================================
-- Number sequences (proforma / commercial)
-- =========================================================
CREATE SEQUENCE IF NOT EXISTS public.proforma_number_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS public.commercial_number_seq START 1000;

CREATE OR REPLACE FUNCTION public.next_invoice_number(_type invoice_type)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n bigint; y text := to_char(now(),'YYYY');
BEGIN
  IF _type = 'proforma' THEN
    n := nextval('public.proforma_number_seq');
    RETURN 'PRO-' || y || '-' || lpad(n::text, 5, '0');
  ELSE
    n := nextval('public.commercial_number_seq');
    RETURN 'INV-' || y || '-' || lpad(n::text, 5, '0');
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.next_invoice_number(invoice_type) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_invoice_number(invoice_type) TO authenticated, service_role;

-- =========================================================
-- ORDERS
-- =========================================================
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  status public.order_status NOT NULL DEFAULT 'draft',
  order_date date NOT NULL DEFAULT current_date,
  requested_delivery date,
  currency text NOT NULL DEFAULT 'USD',
  incoterm text,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  vat_amount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_all_auth" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "orders_write" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations']::app_role[]));
CREATE POLICY "orders_update" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations']::app_role[]));
CREATE POLICY "orders_delete" ON public.orders FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_stamp BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();
CREATE TRIGGER trg_orders_del AFTER DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_row_delete();

CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(14,3) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'pcs',
  unit_price numeric(14,4) NOT NULL DEFAULT 0,
  discount_pct numeric(6,3) NOT NULL DEFAULT 0,
  vat_pct numeric(6,3) NOT NULL DEFAULT 0,
  line_total numeric(14,2) NOT NULL DEFAULT 0,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_items_write" ON public.order_items FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations']::app_role[]));

CREATE TRIGGER trg_order_items_updated BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- ORDER STATUS HISTORY
CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status public.order_status,
  to_status public.order_status NOT NULL,
  changed_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "osh_select" ON public.order_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "osh_insert" ON public.order_status_history FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations']::app_role[]));

CREATE OR REPLACE FUNCTION public.orders_status_change_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_orders_status_log AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_status_change_log();

-- =========================================================
-- INVOICES
-- =========================================================
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE,
  type public.invoice_type NOT NULL DEFAULT 'commercial',
  status public.invoice_status NOT NULL DEFAULT 'draft',
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  issue_date date NOT NULL DEFAULT current_date,
  due_date date,
  currency text NOT NULL DEFAULT 'USD',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  vat_amount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  amount_paid numeric(14,2) NOT NULL DEFAULT 0,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "invoices_write_ins" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::app_role[]));
CREATE POLICY "invoices_write_upd" ON public.invoices FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::app_role[]));
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_invoices_stamp BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();
CREATE TRIGGER trg_invoices_del AFTER DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.log_row_delete();

CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX idx_invoices_order ON public.invoices(order_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- Auto-assign invoice_number on insert if missing
CREATE OR REPLACE FUNCTION public.invoices_assign_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.next_invoice_number(NEW.type);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_invoices_number BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.invoices_assign_number();

-- INVOICE ITEMS
CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(14,3) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'pcs',
  unit_price numeric(14,4) NOT NULL DEFAULT 0,
  discount_pct numeric(6,3) NOT NULL DEFAULT 0,
  vat_pct numeric(6,3) NOT NULL DEFAULT 0,
  line_total numeric(14,2) NOT NULL DEFAULT 0,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ii_select" ON public.invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "ii_write" ON public.invoice_items FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::app_role[]));
CREATE TRIGGER trg_invoice_items_updated BEFORE UPDATE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);

-- =========================================================
-- PAYMENTS
-- =========================================================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  method public.payment_method NOT NULL DEFAULT 'bank_transfer',
  received_at date NOT NULL DEFAULT current_date,
  reference text,
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments_ins" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::app_role[]));
CREATE POLICY "payments_upd" ON public.payments FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::app_role[]));
CREATE POLICY "payments_del" ON public.payments FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_payments_stamp BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();
CREATE TRIGGER trg_payments_del AFTER DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.log_row_delete();

CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);

-- Recalc invoice paid amount + status after payment change
CREATE OR REPLACE FUNCTION public.recalc_invoice_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv_id uuid := COALESCE(NEW.invoice_id, OLD.invoice_id);
  paid numeric(14,2);
  inv record;
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO paid FROM public.payments WHERE invoice_id = inv_id;
  SELECT total, due_date, status INTO inv FROM public.invoices WHERE id = inv_id;
  UPDATE public.invoices SET
    amount_paid = paid,
    balance = GREATEST(inv.total - paid, 0),
    status = CASE
      WHEN paid >= inv.total AND inv.total > 0 THEN 'paid'::invoice_status
      WHEN paid > 0 AND paid < inv.total THEN 'partially_paid'::invoice_status
      WHEN inv.due_date IS NOT NULL AND inv.due_date < current_date AND paid < inv.total THEN 'overdue'::invoice_status
      WHEN inv.status IN ('draft','void') THEN inv.status
      ELSE 'issued'::invoice_status
    END,
    updated_at = now()
  WHERE id = inv_id;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_payments_recalc AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.recalc_invoice_totals();

-- =========================================================
-- SHIPMENTS
-- =========================================================
CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_number text UNIQUE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.shipment_status NOT NULL DEFAULT 'preparing',
  carrier text,
  tracking_no text,
  incoterm text,
  container_no text,
  bl_number text,
  shipped_at date,
  delivered_at date,
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipments_select" ON public.shipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "shipments_ins" ON public.shipments FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','operations']::app_role[]));
CREATE POLICY "shipments_upd" ON public.shipments FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','operations']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','operations']::app_role[]));
CREATE POLICY "shipments_del" ON public.shipments FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE TRIGGER trg_shipments_updated BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_shipments_stamp BEFORE INSERT OR UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();

CREATE INDEX idx_shipments_order ON public.shipments(order_id);

CREATE TABLE public.shipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(14,3) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'pcs',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipment_items TO authenticated;
GRANT ALL ON public.shipment_items TO service_role;
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "si_select" ON public.shipment_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "si_write" ON public.shipment_items FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','operations']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','operations']::app_role[]));

-- =========================================================
-- DOCUMENTS
-- =========================================================
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type public.document_entity NOT NULL,
  entity_id uuid NOT NULL,
  kind public.document_kind NOT NULL DEFAULT 'other',
  file_path text NOT NULL,   -- storage path in crm-docs bucket
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs_select" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "docs_ins" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
CREATE POLICY "docs_upd" ON public.documents FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
CREATE POLICY "docs_del" ON public.documents FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE INDEX idx_documents_entity ON public.documents(entity_type, entity_id);
