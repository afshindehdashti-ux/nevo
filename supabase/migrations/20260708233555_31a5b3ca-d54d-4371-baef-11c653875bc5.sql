
DO $$ BEGIN CREATE TYPE public.finance_document_type AS ENUM ('quotation','proforma_invoice','commercial_invoice','purchase_order','commission_invoice'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.finance_document_status AS ENUM ('draft','pending_approval','approved','issued','sent','partially_paid','paid','overdue','converted','cancelled','void'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.number_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type public.finance_document_type NOT NULL,
  year int NOT NULL, prefix text NOT NULL,
  last_value bigint NOT NULL DEFAULT 0, padding int NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doc_type, year)
);
GRANT SELECT ON public.number_sequences TO authenticated;
GRANT ALL ON public.number_sequences TO service_role;
ALTER TABLE public.number_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seq_read_staff" ON public.number_sequences;
CREATE POLICY "seq_read_staff" ON public.number_sequences FOR SELECT TO authenticated USING (public.has_staff_role(auth.uid()));

CREATE OR REPLACE FUNCTION public.next_document_number(_doc_type public.finance_document_type)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _prefix text; _year int := extract(year from now())::int; _next bigint; _pad int;
BEGIN
  _prefix := CASE _doc_type
    WHEN 'quotation' THEN 'QTN-NEVO'
    WHEN 'proforma_invoice' THEN 'PI-NEVO'
    WHEN 'commercial_invoice' THEN 'CI-NEVO'
    WHEN 'purchase_order' THEN 'PO-NEVO'
    WHEN 'commission_invoice' THEN 'COM-NEVO' END;
  INSERT INTO public.number_sequences (doc_type, year, prefix, last_value)
    VALUES (_doc_type, _year, _prefix, 1)
    ON CONFLICT (doc_type, year)
    DO UPDATE SET last_value = number_sequences.last_value + 1, updated_at = now()
    RETURNING last_value, padding INTO _next, _pad;
  RETURN _prefix || '-' || _year::text || '-' || lpad(_next::text, _pad, '0');
END; $$;

CREATE TABLE IF NOT EXISTS public.finance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type public.finance_document_type NOT NULL,
  document_number text UNIQUE,
  revision int NOT NULL DEFAULT 0,
  status public.finance_document_status NOT NULL DEFAULT 'draft',
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  source_document_id uuid REFERENCES public.finance_documents(id) ON DELETE SET NULL,
  issue_date date NOT NULL DEFAULT current_date,
  valid_until date, due_date date,
  currency text NOT NULL DEFAULT 'USD',
  incoterms text, payment_terms text, delivery_terms text,
  notes text, internal_notes text,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  discount_total numeric(14,2) NOT NULL DEFAULT 0,
  tax_total numeric(14,2) NOT NULL DEFAULT 0,
  shipping_total numeric(14,2) NOT NULL DEFAULT 0,
  grand_total numeric(14,2) NOT NULL DEFAULT 0,
  amount_paid numeric(14,2) NOT NULL DEFAULT 0,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  legacy_table text, legacy_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (legacy_table, legacy_id)
);
CREATE INDEX IF NOT EXISTS idx_fd_type_status ON public.finance_documents(document_type, status);
CREATE INDEX IF NOT EXISTS idx_fd_customer ON public.finance_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_fd_supplier ON public.finance_documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_fd_source ON public.finance_documents(source_document_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_documents TO authenticated;
GRANT ALL ON public.finance_documents TO service_role;
ALTER TABLE public.finance_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fd_read_staff" ON public.finance_documents;
DROP POLICY IF EXISTS "fd_read_own_customer" ON public.finance_documents;
DROP POLICY IF EXISTS "fd_read_own_partner" ON public.finance_documents;
DROP POLICY IF EXISTS "fd_write_sales" ON public.finance_documents;
DROP POLICY IF EXISTS "fd_update_sales" ON public.finance_documents;
DROP POLICY IF EXISTS "fd_delete_admin" ON public.finance_documents;
CREATE POLICY "fd_read_staff" ON public.finance_documents FOR SELECT TO authenticated USING (public.has_staff_role(auth.uid()));
CREATE POLICY "fd_read_own_customer" ON public.finance_documents FOR SELECT TO authenticated USING (customer_id IS NOT NULL AND public.is_customer_user(auth.uid(), customer_id));
CREATE POLICY "fd_read_own_partner" ON public.finance_documents FOR SELECT TO authenticated USING (partner_id IS NOT NULL AND public.is_partner_user(auth.uid(), partner_id));
CREATE POLICY "fd_write_sales" ON public.finance_documents FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
CREATE POLICY "fd_update_sales" ON public.finance_documents FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
CREATE POLICY "fd_delete_admin" ON public.finance_documents FOR DELETE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE TABLE IF NOT EXISTS public.finance_document_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.finance_documents(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  item_code text, description text NOT NULL, hs_code text,
  quantity numeric(14,3) NOT NULL DEFAULT 1, unit text,
  unit_price numeric(14,4) NOT NULL DEFAULT 0,
  discount_percent numeric(6,3) NOT NULL DEFAULT 0,
  discount_amount numeric(14,2) NOT NULL DEFAULT 0,
  tax_percent numeric(6,3) NOT NULL DEFAULT 0,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  line_total numeric(14,2) NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fdi_document ON public.finance_document_items(document_id, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_document_items TO authenticated;
GRANT ALL ON public.finance_document_items TO service_role;
ALTER TABLE public.finance_document_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fdi_read_via_parent" ON public.finance_document_items;
DROP POLICY IF EXISTS "fdi_write_sales" ON public.finance_document_items;
CREATE POLICY "fdi_read_via_parent" ON public.finance_document_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.finance_documents d WHERE d.id = document_id));
CREATE POLICY "fdi_write_sales" ON public.finance_document_items FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));

CREATE OR REPLACE FUNCTION public.fd_item_compute()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  gross numeric := COALESCE(NEW.quantity,0) * COALESCE(NEW.unit_price,0);
  d_amt numeric := COALESCE(NEW.discount_amount,0);
  d_pct numeric := gross * COALESCE(NEW.discount_percent,0) / 100.0;
  d_final numeric := CASE WHEN d_amt > 0 THEN d_amt ELSE d_pct END;
  taxable numeric := gross - d_final;
BEGIN
  NEW.tax_amount := round(taxable * COALESCE(NEW.tax_percent,0) / 100.0, 2);
  NEW.line_total := round(taxable + NEW.tax_amount, 2);
  NEW.updated_at := now();
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_fdi_compute ON public.finance_document_items;
CREATE TRIGGER trg_fdi_compute BEFORE INSERT OR UPDATE ON public.finance_document_items FOR EACH ROW EXECUTE FUNCTION public.fd_item_compute();

CREATE OR REPLACE FUNCTION public.fd_recalc_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d_id uuid := COALESCE(NEW.document_id, OLD.document_id); s numeric; dt numeric; tt numeric;
BEGIN
  SELECT
    COALESCE(SUM(quantity*unit_price - CASE WHEN discount_amount>0 THEN discount_amount ELSE quantity*unit_price*discount_percent/100 END),0),
    COALESCE(SUM(CASE WHEN discount_amount>0 THEN discount_amount ELSE quantity*unit_price*discount_percent/100 END),0),
    COALESCE(SUM(tax_amount),0)
  INTO s, dt, tt FROM public.finance_document_items WHERE document_id = d_id;
  UPDATE public.finance_documents
    SET subtotal = round(s,2), discount_total = round(dt,2), tax_total = round(tt,2),
        grand_total = round(s + tt + shipping_total, 2),
        balance = round(s + tt + shipping_total - amount_paid, 2),
        updated_at = now()
    WHERE id = d_id;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS trg_fdi_recalc ON public.finance_document_items;
CREATE TRIGGER trg_fdi_recalc AFTER INSERT OR UPDATE OR DELETE ON public.finance_document_items FOR EACH ROW EXECUTE FUNCTION public.fd_recalc_totals();

CREATE OR REPLACE FUNCTION public.fd_assign_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.document_number IS NULL OR NEW.document_number = '' THEN
    NEW.document_number := public.next_document_number(NEW.document_type);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_fd_number ON public.finance_documents;
CREATE TRIGGER trg_fd_number BEFORE INSERT ON public.finance_documents FOR EACH ROW EXECUTE FUNCTION public.fd_assign_number();
DROP TRIGGER IF EXISTS trg_fd_updated ON public.finance_documents;
CREATE TRIGGER trg_fd_updated BEFORE UPDATE ON public.finance_documents FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.document_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.finance_documents(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'pdf',
  storage_bucket text NOT NULL DEFAULT 'documents',
  storage_path text NOT NULL,
  file_size bigint, content_type text DEFAULT 'application/pdf',
  version int NOT NULL DEFAULT 1, is_current boolean NOT NULL DEFAULT true,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_docfiles_doc ON public.document_files(document_id, version DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_files TO authenticated;
GRANT ALL ON public.document_files TO service_role;
ALTER TABLE public.document_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "df_read_staff" ON public.document_files;
DROP POLICY IF EXISTS "df_write_staff" ON public.document_files;
CREATE POLICY "df_read_staff" ON public.document_files FOR SELECT TO authenticated USING (public.has_staff_role(auth.uid()));
CREATE POLICY "df_write_staff" ON public.document_files FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));

CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.finance_documents(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  to_email text NOT NULL, cc_emails text[],
  subject text NOT NULL, body text, attachment_paths text[],
  provider text, provider_message_id text,
  status text NOT NULL DEFAULT 'queued', error text,
  sent_at timestamptz,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_log_doc ON public.email_log(document_id);
GRANT SELECT, INSERT, UPDATE ON public.email_log TO authenticated;
GRANT ALL ON public.email_log TO service_role;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "el_read_staff" ON public.email_log;
DROP POLICY IF EXISTS "el_write_staff" ON public.email_log;
CREATE POLICY "el_read_staff" ON public.email_log FOR SELECT TO authenticated USING (public.has_staff_role(auth.uid()));
CREATE POLICY "el_write_staff" ON public.email_log FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse text NOT NULL DEFAULT 'main',
  quantity_on_hand numeric(14,3) NOT NULL DEFAULT 0,
  quantity_reserved numeric(14,3) NOT NULL DEFAULT 0,
  reorder_level numeric(14,3) NOT NULL DEFAULT 0,
  unit text, last_movement_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, warehouse)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inv_read_staff" ON public.inventory_items;
DROP POLICY IF EXISTS "inv_write_ops" ON public.inventory_items;
CREATE POLICY "inv_read_staff" ON public.inventory_items FOR SELECT TO authenticated USING (public.has_staff_role(auth.uid()));
CREATE POLICY "inv_write_ops" ON public.inventory_items FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','operations','finance']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','operations','finance']::app_role[]));

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('in','out','adjust','reserve','release')),
  quantity numeric(14,3) NOT NULL,
  reference_document_id uuid REFERENCES public.finance_documents(id) ON DELETE SET NULL,
  reference_note text,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invm_item ON public.inventory_movements(inventory_item_id, created_at DESC);
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invm_read_staff" ON public.inventory_movements;
DROP POLICY IF EXISTS "invm_write_ops" ON public.inventory_movements;
CREATE POLICY "invm_read_staff" ON public.inventory_movements FOR SELECT TO authenticated USING (public.has_staff_role(auth.uid()));
CREATE POLICY "invm_write_ops" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','operations','finance']::app_role[]));

CREATE OR REPLACE FUNCTION public.apply_inventory_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.movement_type = 'in' THEN
    UPDATE public.inventory_items SET quantity_on_hand = quantity_on_hand + NEW.quantity, last_movement_at = now(), updated_at = now() WHERE id = NEW.inventory_item_id;
  ELSIF NEW.movement_type = 'out' THEN
    UPDATE public.inventory_items SET quantity_on_hand = quantity_on_hand - NEW.quantity, last_movement_at = now(), updated_at = now() WHERE id = NEW.inventory_item_id;
  ELSIF NEW.movement_type = 'adjust' THEN
    UPDATE public.inventory_items SET quantity_on_hand = NEW.quantity, last_movement_at = now(), updated_at = now() WHERE id = NEW.inventory_item_id;
  ELSIF NEW.movement_type = 'reserve' THEN
    UPDATE public.inventory_items SET quantity_reserved = quantity_reserved + NEW.quantity, last_movement_at = now(), updated_at = now() WHERE id = NEW.inventory_item_id;
  ELSIF NEW.movement_type = 'release' THEN
    UPDATE public.inventory_items SET quantity_reserved = GREATEST(quantity_reserved - NEW.quantity, 0), last_movement_at = now(), updated_at = now() WHERE id = NEW.inventory_item_id;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_invm_apply ON public.inventory_movements;
CREATE TRIGGER trg_invm_apply AFTER INSERT ON public.inventory_movements FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_movement();

CREATE TABLE IF NOT EXISTS public.imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_type text NOT NULL, source text NOT NULL,
  file_path text, raw_row_count int,
  processed_count int NOT NULL DEFAULT 0, error_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  column_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  preview_data jsonb, errors jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imports TO authenticated;
GRANT ALL ON public.imports TO service_role;
ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "imp_read_own_or_staff" ON public.imports;
DROP POLICY IF EXISTS "imp_write_staff" ON public.imports;
CREATE POLICY "imp_read_own_or_staff" ON public.imports FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.has_staff_role(auth.uid()));
CREATE POLICY "imp_write_staff" ON public.imports FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));

DROP POLICY IF EXISTS "docs_read_staff" ON storage.objects;
DROP POLICY IF EXISTS "docs_write_staff" ON storage.objects;
DROP POLICY IF EXISTS "docs_update_staff" ON storage.objects;
DROP POLICY IF EXISTS "docs_delete_admin" ON storage.objects;
CREATE POLICY "docs_read_staff" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents' AND public.has_staff_role(auth.uid()));
CREATE POLICY "docs_write_staff" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
CREATE POLICY "docs_update_staff" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents' AND public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));
CREATE POLICY "docs_delete_admin" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents' AND public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

-- Back-fills
INSERT INTO public.finance_documents (document_type, document_number, status, customer_id, issue_date, valid_until, currency, payment_terms, notes, subtotal, tax_total, grand_total, legacy_table, legacy_id, created_by, updated_by, created_at, updated_at)
SELECT 'quotation'::finance_document_type, q.quotation_number,
  CASE q.status::text WHEN 'draft' THEN 'draft' WHEN 'sent' THEN 'sent' WHEN 'approved' THEN 'approved' WHEN 'rejected' THEN 'cancelled' WHEN 'expired' THEN 'cancelled' WHEN 'converted' THEN 'converted' WHEN 'pending_approval' THEN 'pending_approval' ELSE 'draft' END::finance_document_status,
  q.customer_id, q.issue_date, q.valid_until, COALESCE(q.currency,'USD'), q.terms, q.notes,
  COALESCE(q.subtotal,0), COALESCE(q.vat_amount,0), COALESCE(q.total,0),
  'quotations', q.id, q.created_by, q.updated_by, q.created_at, q.updated_at
FROM public.quotations q
ON CONFLICT (legacy_table, legacy_id) DO NOTHING;

INSERT INTO public.finance_document_items (document_id, product_id, description, quantity, unit, unit_price, discount_percent, tax_percent, line_total, sort_order)
SELECT fd.id, qi.product_id, qi.description, qi.quantity, qi.unit, qi.unit_price,
       COALESCE(qi.discount_pct,0), 0, COALESCE(qi.line_total,0), COALESCE(qi.position,0)
FROM public.quotation_items qi
JOIN public.finance_documents fd ON fd.legacy_table='quotations' AND fd.legacy_id = qi.quotation_id
WHERE NOT EXISTS (SELECT 1 FROM public.finance_document_items x WHERE x.document_id = fd.id AND x.sort_order = COALESCE(qi.position,0) AND x.description = qi.description);

INSERT INTO public.finance_documents (document_type, document_number, status, customer_id, issue_date, due_date, currency, payment_terms, notes, subtotal, tax_total, grand_total, amount_paid, balance, legacy_table, legacy_id, created_by, updated_by, created_at, updated_at)
SELECT
  CASE i.type::text WHEN 'proforma' THEN 'proforma_invoice'::finance_document_type ELSE 'commercial_invoice'::finance_document_type END,
  i.invoice_number,
  CASE i.status::text WHEN 'draft' THEN 'draft' WHEN 'issued' THEN 'issued' WHEN 'partially_paid' THEN 'partially_paid' WHEN 'paid' THEN 'paid' WHEN 'overdue' THEN 'overdue' WHEN 'void' THEN 'void' ELSE 'draft' END::finance_document_status,
  i.customer_id, i.issue_date, i.due_date, COALESCE(i.currency,'USD'), i.payment_terms, i.notes,
  COALESCE(i.subtotal,0), COALESCE(i.vat_amount,0), COALESCE(i.total,0),
  COALESCE(i.amount_paid,0), COALESCE(i.balance,0),
  'invoices', i.id, i.created_by, i.updated_by, i.created_at, i.updated_at
FROM public.invoices i
ON CONFLICT (legacy_table, legacy_id) DO NOTHING;

INSERT INTO public.finance_document_items (document_id, product_id, description, quantity, unit, unit_price, discount_percent, tax_percent, line_total, sort_order)
SELECT fd.id, ii.product_id, ii.description, ii.quantity, ii.unit, ii.unit_price,
       COALESCE(ii.discount_pct,0), COALESCE(ii.vat_pct,0), COALESCE(ii.line_total,0), COALESCE(ii.position,0)
FROM public.invoice_items ii
JOIN public.finance_documents fd ON fd.legacy_table='invoices' AND fd.legacy_id = ii.invoice_id
WHERE NOT EXISTS (SELECT 1 FROM public.finance_document_items x WHERE x.document_id = fd.id AND x.sort_order = COALESCE(ii.position,0) AND x.description = ii.description);

INSERT INTO public.finance_documents (document_type, document_number, status, customer_id, issue_date, currency, incoterms, notes, subtotal, tax_total, grand_total, legacy_table, legacy_id, created_by, updated_by, created_at, updated_at)
SELECT 'purchase_order'::finance_document_type, o.order_number, 'issued'::finance_document_status,
  o.customer_id, o.order_date, COALESCE(o.currency,'USD'), o.incoterm, o.notes,
  COALESCE(o.subtotal,0), COALESCE(o.vat_amount,0), COALESCE(o.total,0),
  'orders', o.id, o.created_by, o.updated_by, o.created_at, o.updated_at
FROM public.orders o
ON CONFLICT (legacy_table, legacy_id) DO NOTHING;

INSERT INTO public.finance_document_items (document_id, product_id, description, quantity, unit, unit_price, discount_percent, tax_percent, line_total, sort_order)
SELECT fd.id, oi.product_id, oi.description, oi.quantity, oi.unit, oi.unit_price,
       COALESCE(oi.discount_pct,0), COALESCE(oi.vat_pct,0), COALESCE(oi.line_total,0), COALESCE(oi.position,0)
FROM public.order_items oi
JOIN public.finance_documents fd ON fd.legacy_table='orders' AND fd.legacy_id = oi.order_id
WHERE NOT EXISTS (SELECT 1 FROM public.finance_document_items x WHERE x.document_id = fd.id AND x.sort_order = COALESCE(oi.position,0) AND x.description = oi.description);

INSERT INTO public.finance_documents (document_type, document_number, status, customer_id, partner_id, issue_date, due_date, currency, notes, subtotal, grand_total, legacy_table, legacy_id, created_by, updated_by, created_at, updated_at)
SELECT 'commission_invoice'::finance_document_type, NULL::text,
  CASE pc.status WHEN 'draft' THEN 'draft' WHEN 'pending' THEN 'pending_approval' WHEN 'approved' THEN 'approved' WHEN 'paid' THEN 'paid' WHEN 'cancelled' THEN 'cancelled' WHEN 'rejected' THEN 'cancelled' ELSE 'draft' END::finance_document_status,
  pc.customer_id, pc.partner_id, COALESCE(pc.earned_at, pc.created_at::date),
  NULL::date, COALESCE(pc.currency,'USD'), pc.notes,
  COALESCE(pc.amount,0), COALESCE(pc.amount,0),
  'partner_commissions', pc.id, pc.created_by, pc.updated_by, pc.created_at, pc.updated_at
FROM public.partner_commissions pc
ON CONFLICT (legacy_table, legacy_id) DO NOTHING;

INSERT INTO public.inventory_items (product_id, warehouse, quantity_on_hand, unit)
SELECT p.id, 'main', 0, p.unit FROM public.products p
ON CONFLICT (product_id, warehouse) DO NOTHING;
