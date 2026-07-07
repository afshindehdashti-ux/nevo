
DROP POLICY IF EXISTS "orders_select_all_auth" ON public.orders;
CREATE POLICY "orders_select" ON public.orders FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[])
  OR public.is_customer_user(auth.uid(), customer_id)
);

DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[])
  OR public.is_customer_user(auth.uid(), customer_id)
);

DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[])
  OR EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = payments.invoice_id AND public.is_customer_user(auth.uid(), i.customer_id))
);

DROP POLICY IF EXISTS "shipments_select" ON public.shipments;
CREATE POLICY "shipments_select" ON public.shipments FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[])
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = shipments.order_id AND public.is_customer_user(auth.uid(), o.customer_id))
);

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[])
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND public.is_customer_user(auth.uid(), o.customer_id))
);

DROP POLICY IF EXISTS "ii_select" ON public.invoice_items;
CREATE POLICY "invoice_items_select" ON public.invoice_items FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[])
  OR EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_items.invoice_id AND public.is_customer_user(auth.uid(), i.customer_id))
);

DROP POLICY IF EXISTS "si_select" ON public.shipment_items;
CREATE POLICY "shipment_items_select" ON public.shipment_items FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[])
  OR EXISTS (
    SELECT 1 FROM public.shipments s JOIN public.orders o ON o.id = s.order_id
    WHERE s.id = shipment_items.shipment_id AND public.is_customer_user(auth.uid(), o.customer_id)
  )
);

DROP POLICY IF EXISTS "osh_select" ON public.order_status_history;
CREATE POLICY "osh_select" ON public.order_status_history FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[]));

DROP POLICY IF EXISTS "docs_select" ON public.documents;
CREATE POLICY "docs_select" ON public.documents FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[])
  OR (entity_type = 'customer'::document_entity AND public.is_customer_user(auth.uid(), entity_id))
);

DROP POLICY IF EXISTS "read tags with doc" ON public.doc_intel_tags;
CREATE POLICY "read tags with doc" ON public.doc_intel_tags FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[]));

DROP POLICY IF EXISTS "crm_docs_read" ON storage.objects;
CREATE POLICY "crm_docs_read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'crm-docs'
  AND public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[])
);

DROP POLICY IF EXISTS "Anyone can update own session by id" ON public.ai_assistant_conversations;
CREATE POLICY "Staff update ai sessions" ON public.ai_assistant_conversations FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales']::app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales']::app_role[]));

DROP POLICY IF EXISTS "activity_logs_insert_own" ON public.activity_logs;

DO $$
DECLARE fname text;
BEGIN
  FOR fname IN SELECT unnest(ARRAY[
    'auto_request_commission_approval()',
    'auto_request_document_approval()',
    'auto_request_invoice_approval()',
    'auto_request_quotation_approval()',
    'auto_request_quotation_item_approval()',
    'communications_set_thread()',
    'enforce_sensitive_document_gate()',
    'invoices_assign_number()',
    'log_status_approval()',
    'log_row_delete()',
    'notify_approval_change()',
    'orders_status_change_log()',
    'quotations_assign_number()',
    'recalc_invoice_totals()',
    'recalc_quotation_totals()',
    'stamp_updated_by()',
    'handle_new_user()',
    'ensure_approval_request(text, uuid, text, jsonb)',
    'evaluate_quotation_discount_approval(uuid)',
    'next_invoice_number(invoice_type)',
    'next_quotation_number()'
  ]) LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fname);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'skip revoke %: %', fname, SQLERRM;
    END;
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.decide_approval_request(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_customer_user(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_partner_user(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_approval(text, uuid, jsonb) FROM anon;
