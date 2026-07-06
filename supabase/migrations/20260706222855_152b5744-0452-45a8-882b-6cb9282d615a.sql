
-- Company-wide approval thresholds
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS approval_invoice_threshold numeric(14,2) NOT NULL DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS approval_commission_threshold numeric(14,2) NOT NULL DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS approval_discount_pct_threshold numeric(5,2) NOT NULL DEFAULT 15;

-- Approval requests table
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN (
    'proforma','invoice','commission_invoice','document','quotation_discount'
  )),
  entity_id uuid NOT NULL,
  reason text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  decision_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_requests TO authenticated;
GRANT ALL ON public.approval_requests TO service_role;

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approvals_select_staff" ON public.approval_requests;
CREATE POLICY "approvals_select_staff" ON public.approval_requests
  FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));

DROP POLICY IF EXISTS "approvals_insert_staff" ON public.approval_requests;
CREATE POLICY "approvals_insert_staff" ON public.approval_requests
  FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance']::app_role[]));

DROP POLICY IF EXISTS "approvals_update_deciders" ON public.approval_requests;
CREATE POLICY "approvals_update_deciders" ON public.approval_requests
  FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::app_role[]));

DROP POLICY IF EXISTS "approvals_delete_admin" ON public.approval_requests;
CREATE POLICY "approvals_delete_admin" ON public.approval_requests
  FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE INDEX IF NOT EXISTS idx_approvals_entity ON public.approval_requests (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approval_requests (status, requested_at DESC);
-- Only one pending request per entity at a time
CREATE UNIQUE INDEX IF NOT EXISTS uniq_approvals_pending_per_entity
  ON public.approval_requests (entity_type, entity_id)
  WHERE status = 'pending';

DROP TRIGGER IF EXISTS trg_approvals_updated_at ON public.approval_requests;
CREATE TRIGGER trg_approvals_updated_at
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Security-definer decision helper: applies the side-effect for the entity
-- and logs the decision to activity_logs. Only callable by deciders.
CREATE OR REPLACE FUNCTION public.decide_approval_request(
  _id uuid,
  _decision text,
  _notes text DEFAULT NULL
) RETURNS public.approval_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  req public.approval_requests;
  approver uuid := auth.uid();
BEGIN
  IF approver IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT has_any_role(approver, ARRAY['super_admin','management','finance']::app_role[]) THEN
    RAISE EXCEPTION 'not authorised to decide approvals';
  END IF;
  IF _decision NOT IN ('approved','rejected','cancelled') THEN
    RAISE EXCEPTION 'invalid decision %', _decision;
  END IF;

  SELECT * INTO req FROM public.approval_requests WHERE id = _id FOR UPDATE;
  IF req IS NULL THEN
    RAISE EXCEPTION 'approval request not found';
  END IF;
  IF req.status <> 'pending' THEN
    RAISE EXCEPTION 'request already %', req.status;
  END IF;

  UPDATE public.approval_requests
     SET status = _decision,
         decided_by = approver,
         decided_at = now(),
         decision_notes = _notes
   WHERE id = _id
   RETURNING * INTO req;

  -- Apply side-effect on approval
  IF _decision = 'approved' THEN
    IF req.entity_type IN ('proforma','invoice') THEN
      UPDATE public.invoices
         SET status = 'issued'::invoice_status,
             updated_at = now()
       WHERE id = req.entity_id AND status = 'draft';
    ELSIF req.entity_type = 'commission_invoice' THEN
      UPDATE public.partner_commissions
         SET status = 'approved',
             updated_at = now()
       WHERE id = req.entity_id AND status = 'pending';
    ELSIF req.entity_type = 'document' THEN
      UPDATE public.doc_intel_documents
         SET status = 'approved',
             updated_at = now()
       WHERE id = req.entity_id;
    ELSIF req.entity_type = 'quotation_discount' THEN
      UPDATE public.quotations
         SET status = 'approved'::quotation_status,
             approved_by = approver,
             approved_at = now(),
             updated_at = now()
       WHERE id = req.entity_id AND status IN ('draft','pending_approval');
    END IF;
  END IF;

  -- Audit trail
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    approver,
    CASE _decision WHEN 'approved' THEN 'approve'
                   WHEN 'rejected' THEN 'reject'
                   ELSE 'cancel' END,
    'approval:' || req.entity_type,
    req.entity_id::text,
    jsonb_build_object(
      'request_id', req.id,
      'decision', _decision,
      'notes', _notes,
      'reason', req.reason,
      'details', req.details,
      'decided_at', now()
    )
  );

  RETURN req;
END;
$$;

REVOKE ALL ON FUNCTION public.decide_approval_request(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_approval_request(uuid, text, text) TO authenticated;
