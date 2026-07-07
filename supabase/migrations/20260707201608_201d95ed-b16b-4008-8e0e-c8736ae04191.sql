CREATE OR REPLACE FUNCTION public.log_pdf_version_purge(
  _invoice_id uuid,
  _removed_count integer,
  _kept integer,
  _version_ids jsonb DEFAULT '[]'::jsonb,
  _details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
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

GRANT EXECUTE ON FUNCTION public.log_pdf_version_purge(uuid, integer, integer, jsonb, jsonb) TO authenticated;