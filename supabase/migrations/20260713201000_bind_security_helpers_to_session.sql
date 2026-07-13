-- SECURITY DEFINER helpers are used inside RLS policies. Bind their supplied
-- user id to the authenticated session so they cannot be used to enumerate
-- another user's roles, customer membership, or partner membership by RPC.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = ANY(_roles)
    )
$$;

CREATE OR REPLACE FUNCTION public.has_staff_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id
        AND role IN ('super_admin','management','sales','operations','finance','read_only')
    )
$$;

CREATE OR REPLACE FUNCTION public.is_customer_user(_user_id uuid, _customer_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.customer_users
      WHERE user_id = _user_id AND customer_id = _customer_id
    )
$$;

CREATE OR REPLACE FUNCTION public.is_partner_user(_user_id uuid, _partner_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.partner_users
      WHERE user_id = _user_id AND partner_id = _partner_id
    )
$$;

CREATE OR REPLACE FUNCTION public.can_use_invoice_importer(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id
        AND role IN ('super_admin','management','sales','finance')
    )
$$;

CREATE OR REPLACE FUNCTION public.log_pdf_version_purge(
  _invoice_id uuid,
  _removed_count integer,
  _kept integer,
  _version_ids jsonb DEFAULT '[]'::jsonb,
  _details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  log_id uuid;
BEGIN
  IF auth.uid() IS NULL
    OR NOT public.has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::public.app_role[]) THEN
    RAISE EXCEPTION 'not authorised to purge PDF versions';
  END IF;

  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'purge_pdf_versions',
    'invoice',
    _invoice_id::text,
    jsonb_build_object(
      'removed_count', _removed_count,
      'kept', _kept,
      'version_ids', COALESCE(_version_ids, '[]'::jsonb),
      'purged_at', now()
    ) || COALESCE(_details, '{}'::jsonb)
  )
  RETURNING id INTO log_id;
  RETURN log_id;
END;
$$;

-- Number generators are called only from trusted triggers.
REVOKE EXECUTE ON FUNCTION public.next_order_number() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.next_payment_number() FROM authenticated;
