-- 1) Fix broken SELECT policy on finance_document_items: inherit parent ownership.
DROP POLICY IF EXISTS fdi_read_via_parent ON public.finance_document_items;

CREATE POLICY fdi_read_via_parent
ON public.finance_document_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.finance_documents d
    WHERE d.id = finance_document_items.document_id
      AND (
        public.has_staff_role(auth.uid())
        OR (d.customer_id IS NOT NULL AND public.is_customer_user(auth.uid(), d.customer_id))
        OR (d.partner_id  IS NOT NULL AND public.is_partner_user(auth.uid(),  d.partner_id))
      )
  )
);

-- 2) Pin search_path on the last plpgsql helper that was missing one.
ALTER FUNCTION public.tg_touch_updated_at() SET search_path = public;

-- 3) Revoke EXECUTE from PUBLIC (which also covers anon) on every function in
--    the public schema. Authenticated grants and RLS-helper access remain
--    intact; trigger firing does not depend on caller EXECUTE privileges.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- 4) Revoke EXECUTE from authenticated on trigger-only SECURITY DEFINER
--    functions. These return `trigger` and are only ever invoked by the
--    trigger runtime — no client should be able to call them as RPCs.
REVOKE EXECUTE ON FUNCTION public.apply_inventory_movement()               FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fd_assign_number()                       FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fd_recalc_totals()                       FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.log_proforma_change()                    FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.orders_assign_number()                   FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.partner_commissions_assign_number()      FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.proforma_invoices_assign_number()        FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_proforma_totals()                 FROM authenticated;

-- Keep service_role able to invoke everything (defensive; it already can).
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
